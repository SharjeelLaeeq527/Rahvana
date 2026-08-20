/**
 * lib/security/rate-limit-redis.ts
 *
 * Distributed rate limiter backed by Upstash Redis (REST API), with an
 * automatic fallback to the in-memory limiter when Upstash is not configured.
 *
 * WHY: the in-memory limiter (rate-limit.ts) keeps counters in each server's
 * RAM. On a serverless/multi-instance host (Vercel, Render) every instance has
 * its own memory, so the real limit is looser than configured and resets on
 * cold starts. A shared store (Redis) fixes both: all instances read/write the
 * same counter, and it survives restarts.
 *
 * NO NEW DEPENDENCY: we talk to Upstash over its plain HTTP REST API using
 * fetch, so nothing needs to be installed. Set these env vars in production to
 * activate it:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * If they are absent, we transparently use the in-memory limiter.
 *
 * Usage (async):
 *   const rl = await checkRateLimitRedis(request, "auth-login", { maxAttempts: 5 })
 *   if (!rl.allowed) return rateLimitResponse(rl)
 */

import { NextRequest } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  type RateLimitResult,
} from "@/lib/security/rate-limit";

interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** True when Upstash is configured and we should use the distributed backend. */
function upstashEnabled(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

/**
 * Run a pipeline of Redis commands against the Upstash REST API in one request.
 * Returns the array of results (one per command), or null on any failure.
 */
async function upstashPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      // Never let a slow Redis hang the request forever.
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    return json.map((entry) => entry.result);
  } catch {
    return null;
  }
}

/**
 * Distributed fixed-window rate limit check.
 *
 * Fixed window mechanics in Redis:
 *   INCR key            -> atomically bump the counter, returns the new count
 *   PEXPIRE key ms NX   -> set the window expiry only on the first hit
 *   PTTL key            -> ms left in the window (for Retry-After)
 *
 * INCR is atomic, so even with many instances hitting Redis at once the count
 * is correct (no race). If Upstash is unreachable we fail OPEN by falling back
 * to the in-memory limiter - availability over strictness for login.
 */
export async function checkRateLimitRedis(
  request: NextRequest,
  action: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;

  // Fallback path: no Upstash configured -> use the in-memory limiter.
  if (!upstashEnabled()) {
    return checkRateLimit(request, action, options);
  }

  const ip = getClientIp(request);
  const key = `rl:${action}:${ip}`;

  const results = await upstashPipeline([
    ["INCR", key],
    ["PEXPIRE", key, windowMs, "NX"],
    ["PTTL", key],
  ]);

  // Redis error/timeout -> fail open via in-memory so logins are never bricked.
  if (!results) {
    return checkRateLimit(request, action, options);
  }

  const count = Number(results[0] ?? 0);
  const ttlMs = Number(results[2] ?? windowMs);
  const retryAfterSeconds = Math.max(Math.ceil(ttlMs / 1000), 1);

  if (count > maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterSeconds, limit: maxAttempts };
  }

  return {
    allowed: true,
    remaining: Math.max(maxAttempts - count, 0),
    retryAfterSeconds: 0,
    limit: maxAttempts,
  };
}

export { DEFAULT_MAX_ATTEMPTS, DEFAULT_WINDOW_MS };
