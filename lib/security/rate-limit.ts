/**
 * lib/security/rate-limit.ts
 *
 * Rate limiting and progressive account lockout.
 *
 * Provides two layers of protection:
 *
 * 1. IP-based rate limiting
 *    - Limits requests from a single IP for a specific action.
 *    - Useful for protecting login/signup/API endpoints from high-volume abuse.
 *
 * 2. Email/account-based progressive lockout
 *    - Tracks failed login attempts for a specific account/email.
 *    - Lockout duration increases as failures continue.
 *    - Successful login resets the account's failure state.
 *
 * IMPORTANT:
 * This implementation uses in-memory storage.
 *
 * In Vercel Serverless, memory is NOT shared between all instances/functions.
 * Therefore, this should be considered suitable for basic/MVP protection,
 * but not strict distributed rate limiting at scale.
 *
 * For production scale, move the stores to Redis/Upstash.
 *
 * Usage:
 *
 * // IP-based:
 * const rl = checkRateLimit(request, "auth-login", {
 *   maxAttempts: 20,
 *   windowMs: 5 * 60 * 1000,
 * });
 *
 * if (!rl.allowed) {
 *   return rateLimitResponse(rl);
 * }
 *
 * // Account-based login protection:
 * const accountRl = checkLoginAttempt(request, email);
 *
 * if (!accountRl.allowed) {
 *   return accountLockoutResponse(accountRl);
 * }
 *
 * // After successful login:
 * resetLoginAttempts(email);
 */

import { NextRequest, NextResponse } from "next/server";
import { msg, E } from "@/lib/errors";

// Types
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface AccountLockoutBucket {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

interface RateLimitOptions {
  /** Maximum requests allowed within the window. Default: 5 */
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

export interface LoginAttemptResult {
  allowed: boolean;
  failedAttempts: number;
  lockoutLevel: number;
  retryAfterSeconds: number;
  locked: boolean;
}

// Stores

// IP/action based rate-limit store.
//
// Key:
// `${action}:${ip}`
const rateLimitStore = new Map<string, RateLimitBucket>();

// Account/email based login store.
//
// Key:
// `${action}:${normalizedEmail}`
const accountLockoutStore = new Map<string, AccountLockoutBucket>();

// Cleanup

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  // Clean IP rate-limit buckets
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now > bucket.resetAt) {
      rateLimitStore.delete(key);
    }
  }

  // Clean account lockout buckets
  //
  // We only remove accounts that:
  // - are not currently locked
  // - haven't had a failed attempt recently
  //
  // This prevents unnecessary memory growth.
  for (const [key, bucket] of accountLockoutStore.entries()) {
    const lockExpired = bucket.lockedUntil === null || now > bucket.lockedUntil;

    const inactive = now - bucket.lastAttemptAt > ACCOUNT_STATE_RETENTION_MS;

    if (lockExpired && inactive) {
      accountLockoutStore.delete(key);
    }
  }
}

// Keep inactive account records for 1 hour.
const ACCOUNT_STATE_RETENTION_MS = 60 * 60 * 1000;

// IP Extraction

/**
 * Extract client IP from request headers.
 *
 * Vercel commonly provides x-forwarded-for.
 * Other platforms may provide x-real-ip.
 *
 * NOTE:
 * The exact trust model for forwarded headers depends on your deployment
 * infrastructure. Only trust headers that are controlled by your trusted
 * reverse proxy/platform.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

// Generic IP Rate Limiting
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Check whether a request is within the IP-based rate limit.
 *
 * @param request - The incoming request.
 * @param action - The action being performed (e.g., "auth-login").
 * @param options - Optional rate limit configuration.
 * @returns The rate limit result.
 *
 * Example:
 *
 * const rl = checkRateLimit(request, "auth-login", {
 *   maxAttempts: 20,
 *   windowMs: 5 * 60 * 1000,
 * });
 *
 * if (!rl.allowed) {
 *   return rateLimitResponse(rl);
 * }
 */
export function checkRateLimit(
  request: NextRequest,
  action: string,
  options?: RateLimitOptions
): RateLimitResult {
  cleanupExpired();

  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;

  const ip = getClientIp(request);

  const key = `${action}:${ip}`;

  const now = Date.now();

  let bucket = rateLimitStore.get(key);

  // Start a new window if:
  // - no bucket exists
  // - previous window expired
  if (!bucket || now > bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + windowMs,
    };

    rateLimitStore.set(key, bucket);
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

// Progressive Account Lockout

/**
 * Progressive login lockout configuration.
 *
 * The account is not permanently locked.
 *
 * 5 failures  → 2 minutes
 * 10 failures  → 5 minutes
 * 15 failures → 10 minutes
 * 20 failures → 20 minutes
 * 25 failures → 30 minutes
 * 30 failures → 1 hour
 */
const LOCKOUT_LEVELS = [
  { attempts: 5, durationMs: 2 * 60 * 1000 }, // 2 min
  { attempts: 10, durationMs: 5 * 60 * 1000 }, // 5 min
  { attempts: 15, durationMs: 10 * 60 * 1000 }, // 10 min
  { attempts: 20, durationMs: 20 * 60 * 1000 }, // 20 min
  { attempts: 25, durationMs: 30 * 60 * 1000 }, // 30 min
  { attempts: 30, durationMs: 60 * 60 * 1000 }, // 1 hour
] as const;

/**
 * Normalize an email before using it as a rate-limit key.
 *
 * This prevents simple casing/whitespace variations from bypassing
 * account-based rate limiting.
 *
 * Example:
 *
 * Hammad@Example.com
 * hammad@example.com
 *
 * Both become:
 *
 * hammad@example.com
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Get the current lockout level based on failed attempts.
 */
function getLockoutLevel(failedAttempts: number): number {
  let level = 0;

  for (let i = 0; i < LOCKOUT_LEVELS.length; i++) {
    if (failedAttempts >= LOCKOUT_LEVELS[i].attempts) {
      level = i + 1;
    }
  }

  return level;
}

//Get the lockout duration for a given number of failed attempts.
function getLockoutDuration(failedAttempts: number): number {
  let duration = 0;

  for (const level of LOCKOUT_LEVELS) {
    if (failedAttempts >= level.attempts) {
      duration = level.durationMs;
    }
  }

  return duration;
}

/**
 * Check whether an account is currently locked.
 *
 * IMPORTANT:
 * This does NOT increment the failed-attempt counter.
 *
 * Use this before password authentication.
 */
export function checkLoginLockout(email: string): LoginAttemptResult {
  cleanupExpired();

  const normalizedEmail = normalizeEmail(email);

  const key = `auth-login:${normalizedEmail}`;

  const bucket = accountLockoutStore.get(key);

  if (!bucket) {
    return {
      allowed: true,
      failedAttempts: 0,
      lockoutLevel: 0,
      retryAfterSeconds: 0,
      locked: false,
    };
  }

  const now = Date.now();

  // Lockout has expired.
  if (bucket.lockedUntil !== null && now >= bucket.lockedUntil) {
    bucket.lockedUntil = null;

    return {
      allowed: true,
      failedAttempts: bucket.failedAttempts,
      lockoutLevel: getLockoutLevel(bucket.failedAttempts),
      retryAfterSeconds: 0,
      locked: false,
    };
  }

  // Still locked.
  if (bucket.lockedUntil !== null && now < bucket.lockedUntil) {
    const retryAfterSeconds = Math.ceil((bucket.lockedUntil - now) / 1000);

    return {
      allowed: false,
      failedAttempts: bucket.failedAttempts,
      lockoutLevel: getLockoutLevel(bucket.failedAttempts),
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      locked: true,
    };
  }

  return {
    allowed: true,
    failedAttempts: bucket.failedAttempts,
    lockoutLevel: getLockoutLevel(bucket.failedAttempts),
    retryAfterSeconds: 0,
    locked: false,
  };
}

/**
 * Record a FAILED login attempt for an account.
 *
 * Call this ONLY when:
 *
 * - the account/email is valid or you intentionally want to prevent
 *   account enumeration
 * - password authentication failed
 *
 * Example:
 *
 * const result = recordFailedLogin(email);
 *
 * if (!result.allowed) {
 *   return accountLockoutResponse(result);
 * }
 */
export function recordFailedLogin(email: string): LoginAttemptResult {
  cleanupExpired();

  const normalizedEmail = normalizeEmail(email);

  const key = `auth-login:${normalizedEmail}`;

  const now = Date.now();

  let bucket = accountLockoutStore.get(key);

  if (!bucket) {
    bucket = {
      failedAttempts: 0,
      lockedUntil: null,
      lastAttemptAt: now,
    };

    accountLockoutStore.set(key, bucket);
  }

  bucket.failedAttempts++;
  bucket.lastAttemptAt = now;

  const lockoutDuration = getLockoutDuration(bucket.failedAttempts);

  const lockoutLevel = getLockoutLevel(bucket.failedAttempts);

  // Only apply a new lock when the new failed-attempt count exactly reaches a threshold.
  if (
    lockoutDuration > 0 &&
    LOCKOUT_LEVELS.some(
      (level) => level.attempts === bucket.failedAttempts
    )
  ) {
    bucket.lockedUntil = now + lockoutDuration;

    const retryAfterSeconds = Math.ceil(lockoutDuration / 1000);

    return {
      allowed: false,
      failedAttempts: bucket.failedAttempts,
      lockoutLevel,
      retryAfterSeconds,
      locked: true,
    };
  }

  return {
    allowed: true,
    failedAttempts: bucket.failedAttempts,
    lockoutLevel,
    retryAfterSeconds: 0,
    locked: false,
  };
}

/**
 * Reset login failures after a SUCCESSFUL authentication.
 *
 * This should be called immediately after successful login.
 */
export function resetLoginAttempts(email: string): void {
  const normalizedEmail = normalizeEmail(email);

  const key = `auth-login:${normalizedEmail}`;

  accountLockoutStore.delete(key);
}

// Response Helpers

//Build a 429 response for IP-based rate limiting.
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);

  return NextResponse.json(
    {
      success: false,
      code: E.AUTH_RATE_LIMITED,
      message: msg(E.AUTH_RATE_LIMITED, {
        minutes,
      }),
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

/**
 * Build a response for account-based login lockout.
 *
 * We intentionally keep the message generic.
 *
 * Do NOT tell the user:
 *
 * "Your account has been locked because 5 passwords failed."
 *
 * Generic responses reduce the information available to attackers.
 */
export function accountLockoutResponse(result: LoginAttemptResult): NextResponse {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);

  return NextResponse.json(
    {
      success: false,
      code: E.AUTH_RATE_LIMITED,
      message: msg(E.AUTH_RATE_LIMITED, {
        minutes,
      }),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
