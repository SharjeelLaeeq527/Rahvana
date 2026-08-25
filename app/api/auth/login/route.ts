import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

import {
  rateLimitResponse,
  checkLoginLockout,
  recordFailedLogin,
  resetLoginAttempts,
  accountLockoutResponse,
} from "@/lib/security/rate-limit";

import { checkRateLimitRedis } from "@/lib/security/rate-limit-redis";

import { auditAuthSuccess, auditAuthFailure, auditBlocked } from "@/lib/security/audit-log";

import { maybeRunSecurityScan } from "@/lib/security/alerting";

/**
 * POST /api/auth/login
 *
 * Login protection uses two layers:
 *
 * 1. IP-based distributed rate limiting
 *    - Protects against one IP sending a large number of login requests.
 *    - Uses Redis/Upstash when configured.
 *
 * 2. Email/account-based progressive lockout
 *    - Tracks failed login attempts for a specific email.
 *    - Lockout increases progressively:
 *        5 failures  -> 2 minutes
 *        10 failures  -> 5 minutes
 *        15 failures -> 10 minutes
 *        20 failures -> 20 minutes
 *        25 failures -> 30 minutes
 *        30 failures -> 1 hour
 *
 * A successful login resets the account failure state.
 *
 * MFA flow remains unchanged.
 */
export async function POST(request: NextRequest) {
  // 1. IP-BASED RATE LIMIT
  //
  // This protects against:
  //
  // - One IP attacking many different accounts
  // - High-volume automated login attempts
  // - Credential stuffing from a single source
  const ipLimit = await checkRateLimitRedis(request, "auth-login", {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    auditBlocked(request, "auth.login", {
      reason: "rate_limited_ip",
    });

    return rateLimitResponse(ipLimit);
  }

  // 2. READ LOGIN CREDENTIALS
  let email = "";
  let password = "";

  try {
    const body = await request.json();

    email = String(body.email || "")
      .trim()
      .toLowerCase();

    password = String(body.password || "");
  } catch {
    return NextResponse.json(
      {
        error: msg(E.AUTH_LOGIN_FAILED),
        code: "AUTH_LOGIN_FAILED",
      },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      {
        error: msg(E.AUTH_LOGIN_FAILED),
        code: "AUTH_LOGIN_FAILED",
      },
      { status: 400 }
    );
  }

  // 3. EMAIL/ACCOUNT-BASED PROGRESSIVE LOCKOUT
  //
  // IMPORTANT:
  //
  // The helper's checkLoginLockout() is responsible for progressive
  // account-based protection.
  //
  const accountLockout = checkLoginLockout(email);

  if (!accountLockout.allowed) {
    auditBlocked(request, "auth.login", {
      reason: "account_lockout",
      email,
    });

    return accountLockoutResponse(accountLockout);
  }

  // 4. AUTHENTICATE WITH SUPABASE
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 5. LOGIN FAILURE
    if (error) {
      // MFA required: create a challenge and hand the IDs to the client.
      if (error.code === "mfa_required") {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();

        const totp = factorsData?.totp || [];

        if (totp.length > 0) {
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: totp[0].id,
          });

          if (!challengeError && challengeData) {
            return NextResponse.json({
              mfaRequired: true,
              factorId: totp[0].id,
              challengeId: challengeData.id,
            });
          }
        }

        return NextResponse.json(
          {
            error: msg(E.AUTH_MFA_ENABLE_FAILED),
            code: "mfa_error",
          },
          { status: 400 }
        );
      }

      // Record failed login attempt
      const lockoutResult = recordFailedLogin(email);

      auditAuthFailure(request, "auth.login", {
        email,
        reason: error.code || "invalid_credentials",
      });

      maybeRunSecurityScan().catch(() => {});

      // If this failed attempt triggered a progressive lockout,
      // return the lockout response.
      if (!lockoutResult.allowed) {
        auditBlocked(request, "auth.login", {
          reason: "account_lockout",
          email,
          lockoutLevel: lockoutResult.lockoutLevel,
        });

        return accountLockoutResponse(lockoutResult);
      }

      // Keep the response generic.
      //
      // Do not reveal whether:
      // - email exists
      // - password was wrong
      // - account is valid
      //
      if (error.code === "email_not_confirmed") {
        return NextResponse.json(
          {
            error: msg(E.AUTH_EMAIL_NOT_CONFIRMED),
            code: "AUTH_EMAIL_NOT_CONFIRMED",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: msg(E.AUTH_LOGIN_FAILED),
          code: "AUTH_LOGIN_FAILED",
        },
        { status: 401 }
      );
    }

    // 6. SUCCESSFUL LOGIN
    // Clear all previous failed-login attempts for this email.
    resetLoginAttempts(email);

    // 7. MFA CHECK
    if (data?.session) {
      const userWithFactors = data.session.user as {
        factors?: Array<{
          id: string;
          factor_type: string;
          status: string;
        }>;
      };

      const totpFactors = (userWithFactors?.factors || []).filter(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );

      if (totpFactors.length > 0) {
        const factorId = totpFactors[0].id;

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId,
        });

        if (!challengeError && challengeData) {
          return NextResponse.json({
            mfaRequired: true,
            factorId,
            challengeId: challengeData.id,
          });
        }
      }
    }

    // 8. CLEAN SUCCESS
    auditAuthSuccess(request, "auth.login", data.user!.id, {
      email,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("[login] Unexpected error:", err);

    return NextResponse.json(
      {
        error: msg(E.AUTH_LOGIN_SERVER_ERROR),
        code: "AUTH_LOGIN_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
