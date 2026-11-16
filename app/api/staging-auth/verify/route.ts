// app/api/staging-auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyTOTP,
  getAllStagingTotpSecretsForUser,
  createStagingSessionToken,
  STAGING_SESSION_COOKIE_NAME,
  STAGING_SESSION_MAX_AGE_SECONDS,
} from "@/lib/security/totp";
import {
  checkStagingTotpLockout,
  recordFailedStagingTotpAttempt,
  resetStagingTotpAttempts,
} from "@/lib/security/rate-limit";
import { auditBlocked, auditLog } from "@/lib/security/audit-log";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username || "").trim().toLowerCase();
    const code = String(body.code || "").trim();

    // 1. Check if client or username is currently locked (8 failed attempts -> 15 min lockout)
    const lockout = checkStagingTotpLockout(request, username);
    if (!lockout.allowed) {
      auditBlocked(request, "staging.totp_verify", {
        reason: "locked_out",
        username,
        retryAfterSeconds: lockout.retryAfterSeconds,
      });

      const minutes = Math.max(1, Math.ceil(lockout.retryAfterSeconds / 60));
      return NextResponse.json(
        {
          error: `Too many failed attempts. Staging access is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. Please try again later.`,
          message: `Too many failed attempts. Staging access is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. Please try again later.`,
          code: "STAGING_AUTH_LOCKED",
          locked: true,
          retryAfterSeconds: lockout.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(lockout.retryAfterSeconds),
          },
        }
      );
    }

    if (!username || !code) {
      return NextResponse.json(
        { error: "Username and 6-digit code are required." },
        { status: 400 }
      );
    }

    // 2. Fetch all secrets for username (supports rotated / multiple keys)
    const secrets = getAllStagingTotpSecretsForUser(username);
    if (!secrets || secrets.length === 0) {
      const fail = recordFailedStagingTotpAttempt(request, username);
      if (fail.locked) {
        auditBlocked(request, "staging.totp_verify", {
          reason: "locked_out_after_failures",
          username,
        });
        const minutes = Math.max(1, Math.ceil(fail.retryAfterSeconds / 60));
        return NextResponse.json(
          {
            error: `Too many failed attempts. Staging access is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. Please try again later.`,
            message: `Too many failed attempts. Staging access is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. Please try again later.`,
            code: "STAGING_AUTH_LOCKED",
            locked: true,
            retryAfterSeconds: fail.retryAfterSeconds,
          },
          {
            status: 429,
            headers: { "Retry-After": String(fail.retryAfterSeconds) },
          }
        );
      }

      const warning =
        fail.remainingAttempts <= 3
          ? ` (${fail.remainingAttempts} attempt${fail.remainingAttempts === 1 ? "" : "s"} remaining before 15-minute lockout)`
          : "";

      return NextResponse.json(
        {
          error: `Invalid username or verification code.${warning}`,
          remainingAttempts: fail.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Verify TOTP code against any configured secret for this user (RFC 6238, window = 1 for ±1 step)
    let isValid = false;
    for (const secret of secrets) {
      if (await verifyTOTP(code, secret, 1)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      const fail = recordFailedStagingTotpAttempt(request, username);
      if (fail.locked) {
        auditBlocked(request, "staging.totp_verify", {
          reason: "locked_out_after_failures",
          username,
        });
        const minutes = Math.max(1, Math.ceil(fail.retryAfterSeconds / 60));
        return NextResponse.json(
          {
            error: `Too many failed attempts. Staging access is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. Please try again later.`,
            message: `Too many failed attempts. Staging access is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. Please try again later.`,
            code: "STAGING_AUTH_LOCKED",
            locked: true,
            retryAfterSeconds: fail.retryAfterSeconds,
          },
          {
            status: 429,
            headers: { "Retry-After": String(fail.retryAfterSeconds) },
          }
        );
      }

      const warning =
        fail.remainingAttempts <= 3
          ? ` (${fail.remainingAttempts} attempt${fail.remainingAttempts === 1 ? "" : "s"} remaining before 15-minute lockout)`
          : "";

      return NextResponse.json(
        {
          error: `Invalid or expired code. Please enter the latest 6 digits from your app.${warning}`,
          remainingAttempts: fail.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 4. Success! Reset failure count immediately
    resetStagingTotpAttempts(request, username);

    // 5. Create signed session token
    const token = await createStagingSessionToken(username);

    // 6. Issue HTTP-only, secure 30-day session cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: username,
    });

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set(STAGING_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: STAGING_SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    auditLog({
      action: "staging.totp_success",
      resource: "staging_gate",
      request,
      metadata: { username },
      status: "success",
    });

    return response;
  } catch (error) {
    console.error("[staging-auth-verify] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
