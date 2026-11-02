// lib/security/staging-basic-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/security/rate-limit";

// ==========================================
// In-Memory Brute-Force Protection
// ==========================================
interface FailedAttemptBucket {
  count: number;
  resetAt: number;
  blockedUntil: number | null;
}

const failedAuthStore = new Map<string, FailedAttemptBucket>();

const BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000; // 5-minute rolling window
const MAX_FAILED_ATTEMPTS = 8; // Max 8 failed guesses before temporary lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15-minute lockout

function checkBasicAuthBruteForce(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = failedAuthStore.get(ip);

  if (!bucket) {
    return { allowed: true };
  }

  // If currently locked out
  if (bucket.blockedUntil && now < bucket.blockedUntil) {
    const retryAfterSeconds = Math.ceil((bucket.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // If window expired, reset
  if (now > bucket.resetAt) {
    failedAuthStore.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordBasicAuthFailure(ip: string) {
  const now = Date.now();
  let bucket = failedAuthStore.get(ip);

  if (!bucket || now > bucket.resetAt) {
    bucket = {
      count: 1,
      resetAt: now + BRUTE_FORCE_WINDOW_MS,
      blockedUntil: null,
    };
    failedAuthStore.set(ip, bucket);
    return;
  }

  bucket.count++;
  if (bucket.count >= MAX_FAILED_ATTEMPTS) {
    bucket.blockedUntil = now + LOCKOUT_DURATION_MS;
  }
}

function clearBasicAuthFailures(ip: string) {
  failedAuthStore.delete(ip);
}

/**
 * Constant-time comparison to prevent microsecond side-channel timing attacks.
 * Always processes maxLen operations regardless of where mismatch occurs.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  let mismatch = a.length === b.length ? 0 : 1;
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

/**
 * Layer 2: Hardened HTTP Basic Authentication for Staging Environment.
 *
 * Security Features:
 * 1. Native HTTP Basic Auth at the middleware edge before pages or APIs load.
 * 2. Automated Brute-Force & Credential-Stuffing Protection (blocks IP after 8 failed guesses).
 * 3. Constant-time string comparison to neutralize timing side-channel attacks.
 * 4. Supports multi-user credentials (comma/semicolon separated) for frictionless offboarding.
 * 5. Webhook & scheduled cron bypass so critical external services remain unaffected.
 */
export function assertStagingBasicAuth(request: NextRequest): NextResponse | null {
  const env = (process.env.NEXT_PUBLIC_ENVIRONMENT || "").toLowerCase().trim();

  // 1. NEVER enforce in production
  if (env === "production") {
    return null;
  }

  // 2. Check if Basic Auth is active
  const isStaging = env === "staging" || env === "development";
  const explicitEnable = process.env.STAGING_BASIC_AUTH_ENABLED === "true";
  const testMode = process.env.STAGING_RESTRICT_ACCESS === "true";

  if (!isStaging && !explicitEnable && !testMode) {
    return null;
  }

  // 3. Collect valid credentials
  const expectedUser = process.env.STAGING_BASIC_AUTH_USER;
  const expectedPass = process.env.STAGING_BASIC_AUTH_PASS;
  const multiCreds = process.env.STAGING_BASIC_AUTH_CREDENTIALS;

  const validPairs: string[] = [];
  if (expectedUser && expectedPass) {
    validPairs.push(`${expectedUser}:${expectedPass}`);
  }
  if (multiCreds) {
    multiCreds
      .split(/[,;\n]/)
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((pair) => validPairs.push(pair));
  }

  // If no credentials have been configured, do not block
  if (validPairs.length === 0) {
    return null;
  }

  // 4. Bypass external webhooks and scheduled cron jobs
  const pathname = request.nextUrl.pathname;
  const isWebhookOrBypass =
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/easypost/webhook") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/v1/tool-completion");

  if (isWebhookOrBypass) {
    return null;
  }

  const clientIp = getClientIp(request);

  // 5. Brute-force & credential stuffing defense
  const bruteForceCheck = checkBasicAuthBruteForce(clientIp);
  if (!bruteForceCheck.allowed) {
    const retrySeconds = bruteForceCheck.retryAfterSeconds || 900;
    return new NextResponse(
      "429 Too Many Requests: Staging access temporarily blocked due to repeated failed authentication attempts.",
      {
        status: 429,
        headers: {
          "Retry-After": String(retrySeconds),
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  // 6. Inspect Authorization header
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const b64 = authHeader.substring(6).trim();
      // Edge runtime compatible base64 decoding
      const decoded =
        typeof atob === "function"
          ? atob(b64)
          : Buffer.from(b64, "base64").toString("utf-8");

      const colonIdx = decoded.indexOf(":");
      if (colonIdx !== -1) {
        const inputUser = decoded.substring(0, colonIdx).trim().toLowerCase();
        const inputPass = decoded.substring(colonIdx + 1);

        const isMatch = validPairs.some((pair) => {
          const pColon = pair.indexOf(":");
          if (pColon === -1) return false;
          const pairUser = pair.substring(0, pColon).trim().toLowerCase();
          const pairPass = pair.substring(pColon + 1);

          // Constant-time comparison for password and case-insensitive check for user
          return inputUser === pairUser && constantTimeCompare(inputPass, pairPass);
        });

        if (isMatch) {
          // Successful login clears any past failed attempts from this IP
          clearBasicAuthFailures(clientIp);
          return null; // Authenticated
        }
      }
    } catch {
      // Decode error -> fall through to record failure and return 401
    }
  }

  // 7. Track failed attempt from this IP
  recordBasicAuthFailure(clientIp);

  // 8. Return 401 Unauthorized with WWW-Authenticate header to prompt browser login
  return new NextResponse("401 Unauthorized: Staging environment access restricted.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Restricted Staging Environment", charset="UTF-8"',
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
