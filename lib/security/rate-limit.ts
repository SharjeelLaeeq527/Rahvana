/**
 * lib/security/rate-limit.ts
 *
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * No external dependencies — uses a simple Map<string, bucket> store.
 * Each bucket tracks (count, resetAt) per IP+action key.
 *
 * IMPORTANT: This is per-instance. In Vercel Serverless, each function
 * invocation gets its own memory, so the effective rate limit is slightly
 * more permissive than configured. This is intentional — for strict
 * rate limiting at scale, add Redis (Upstash) later.
 *
 * Usage in an API route:
 *   import { checkRateLimit, rateLimitResponse } from '@/lib/security/rate-limit'
 *
 *   const rl = checkRateLimit(request, 'auth-signup', { maxAttempts: 5 })
 *   if (!rl.allowed) return rateLimitResponse(rl)
 */

import { NextRequest, NextResponse } from "next/server";
import { msg, E } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitBucket {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

interface RateLimitOptions {
  /** Max requests allowed within the window. Default: 5 */
  maxAttempts?: number;
  /** Window duration in milliseconds. Default: 15 minutes */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

// Global in-memory store keyed by `${action}:${ip}`
const store = new Map<string, RateLimitBucket>();

// Cleanup interval — remove expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt) {
      store.delete(key);
    }
  }
}

// ─── IP Extraction ────────────────────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 * Vercel sets x-forwarded-for; Render sets x-real-ip.
 * Falls back to "unknown" if neither is available.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (client) IP
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

// ─── Core ─────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check whether this request is within the rate limit.
 *
 * @param request  - The incoming NextRequest
 * @param action   - A unique string per endpoint (e.g. "auth-signup")
 * @param options  - Optional max attempts and window size
 * @returns        - { allowed, remaining, retryAfterSeconds, limit }
 */
export function checkRateLimit(
  request: NextRequest,
  action: string,
  options?: RateLimitOptions
): RateLimitResult {
  // Lazy cleanup on each call
  cleanupExpired();

  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const ip = getClientIp(request);
  const key = `${action}:${ip}`;
  const now = Date.now();

  let bucket = store.get(key);

  // If no bucket or window has expired, start a fresh window
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count++;

  if (bucket.count > maxAttempts) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      limit: maxAttempts,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - bucket.count,
    retryAfterSeconds: 0,
    limit: maxAttempts,
  };
}

// ─── Response Helper ──────────────────────────────────────────────────────────

/**
 * Build a 429 Too Many Requests response with standard headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);

  return NextResponse.json(
    {
      success: false,
      code: E.AUTH_RATE_LIMITED,
      message: msg(E.AUTH_RATE_LIMITED, { minutes }),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
