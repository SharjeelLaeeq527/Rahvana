// lib/security/staging-basic-auth.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Layer 2: HTTP Basic Authentication for Staging Environment.
 *
 * Prompts the browser for username and password at the network/middleware edge,
 * preventing any unauthorized access to HTML pages, API routes, or assets.
 *
 * Controlled by:
 * - NEXT_PUBLIC_ENVIRONMENT === "development"
 * - Or explicitly enabled via STAGING_BASIC_AUTH_ENABLED=true (useful for testing)
 * - Credentials: STAGING_BASIC_AUTH_USER & STAGING_BASIC_AUTH_PASS
 *   (or STAGING_BASIC_AUTH_CREDENTIALS="user1:pass1,user2:pass2")
 */
export function assertStagingBasicAuth(request: NextRequest): NextResponse | null {
  const env = (process.env.NEXT_PUBLIC_ENVIRONMENT || "").toLowerCase().trim();

  // 1. NEVER enforce in production
  if (env === "production") {
    return null;
  }

  // 2. Check if Basic Auth is active
  const isStaging = env === "development";
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
      .split(",")
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

  // 5. Inspect Authorization header
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const b64 = authHeader.substring(6).trim();
      // Edge runtime compatible base64 decoding
      const decoded =
        typeof atob === "function"
          ? atob(b64)
          : Buffer.from(b64, "base64").toString("utf-8");

      if (validPairs.includes(decoded)) {
        return null; // Authenticated
      }
    } catch {
      // Decode error -> fall through to 401
    }
  }

  // 6. Return 401 Unauthorized with WWW-Authenticate header to prompt browser login
  return new NextResponse("401 Unauthorized: Staging environment access restricted.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Restricted Staging Environment", charset="UTF-8"',
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

