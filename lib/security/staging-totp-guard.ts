// lib/security/staging-totp-guard.ts
import { NextRequest, NextResponse } from "next/server";
import {
  STAGING_SESSION_COOKIE_NAME,
  verifyStagingSessionToken,
  getAllStagingTotpSecretsForUser,
} from "./totp";

/**
 * Edge middleware guard for Staging Authenticator (TOTP) Access.
 *
 * Intercepts requests on the staging platform:
 * - If user holds a valid, signed 30-day session cookie, allows request.
 * - If cookie is missing/expired, redirects to /staging-access.
 * - Bypasses external webhooks and the staging authentication routes.
 */
export async function assertStagingTotpSession(
  request: NextRequest
): Promise<NextResponse | null> {
  const env = (process.env.NEXT_PUBLIC_ENVIRONMENT || "").toLowerCase().trim();

  // 1. NEVER enforce in production
  if (env === "production") {
    return null;
  }

  // 2. Check if TOTP gate is enabled
  const isStagingEnv = env === "staging" || env === "development";
  const explicitEnable = process.env.STAGING_TOTP_ENABLED === "true";
  const explicitDisable = process.env.STAGING_TOTP_ENABLED === "false";

  // In staging: enabled by default unless explicitly disabled.
  // In development: enabled only when explicitly toggled on (STAGING_TOTP_ENABLED=true).
  const isEnabled = isStagingEnv ? !explicitDisable : explicitEnable;
  const hasConfiguredKeys = !!(
    process.env.STAGING_TOTP_KEYS?.trim() || process.env.STAGING_TOTP_SECRET?.trim()
  );

  // If not enabled or no keys configured, do not block
  if (!isEnabled || !hasConfiguredKeys) {
    return null;
  }

  const { pathname, search } = request.nextUrl;

  // 3. Bypass paths that must remain accessible without session
  const isBypass =
    pathname.startsWith("/staging-access") ||
    pathname.startsWith("/api/staging-auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/easypost/webhook") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/v1/tool-completion");

  if (isBypass) {
    return null;
  }

  // 4. Validate session cookie
  const cookieValue = request.cookies.get(STAGING_SESSION_COOKIE_NAME)?.value;
  if (cookieValue) {
    const verification = await verifyStagingSessionToken(cookieValue);
    if (verification.valid && verification.username) {
      // Instant Offboarding Check: Verify that the user still has an active key in STAGING_TOTP_KEYS!
      // If an employee left and was removed from the config, their active cookie is instantly rejected.
      const stillAuthorized = getAllStagingTotpSecretsForUser(verification.username).length > 0;
      if (stillAuthorized) {
        return null; // Authenticated & authorized
      }
    }
  }

  // 5. Unauthorized: Handle API vs Page request
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Staging access restricted. Please authenticate with an authenticator app.",
        code: "STAGING_AUTH_REQUIRED",
        gateUrl: "/staging-access",
      },
      { status: 401 }
    );
  }

  // Page request: Redirect to branded staging access gate with return target
  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = "/staging-access";
  gateUrl.searchParams.set("redirectTo", pathname + search);
  return NextResponse.redirect(gateUrl);
}
