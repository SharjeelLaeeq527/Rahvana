import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { rateLimitResponse } from "@/lib/security/rate-limit";
import { checkRateLimitRedis } from "@/lib/security/rate-limit-redis";
import { auditAuthSuccess, auditAuthFailure, auditBlocked } from "@/lib/security/audit-log";
import { maybeRunSecurityScan } from "@/lib/security/alerting";

/**
 * POST /api/auth/login
 *
 * Server-side login proxy. Email + password sign-in now runs here instead of
 * directly in the browser, so every attempt passes through:
 *   1. Rate limiting (per IP + per email+IP) - brute-force defense
 *   2. Audit logging (success / failure / blocked)
 * before Supabase is called. The Supabase SSR server client sets the auth
 * cookies on the response, which the browser client reads on the next load.
 *
 * MFA is preserved: if a challenge is required we return the factor/challenge
 * ids and the client continues via /api/auth/mfa/verify-login (unchanged).
 */
export async function POST(request: NextRequest) {
  // ── 1. Rate limit (fail closed on abuse) ─────────────────────────────────
  // Per-IP: stops one machine spraying many accounts.
  const ipLimit = await checkRateLimitRedis(request, "auth-login", { maxAttempts: 10 });
  if (!ipLimit.allowed) {
    auditBlocked(request, "auth.login", { reason: "rate_limited_ip" });
    return rateLimitResponse(ipLimit);
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ error: msg(E.AUTH_LOGIN_FAILED), code: "AUTH_LOGIN_FAILED" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: msg(E.AUTH_LOGIN_FAILED), code: "AUTH_LOGIN_FAILED" }, { status: 400 });
  }

  // Per-account (email+IP): tighter cap so one account can't be hammered.
  const emailLimit = await checkRateLimitRedis(request, `auth-login:${email}`, { maxAttempts: 5 });
  if (!emailLimit.allowed) {
    auditBlocked(request, "auth.login", { reason: "rate_limited_email", email });
    return rateLimitResponse(emailLimit);
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // ── Error paths ─────────────────────────────────────────────────────────
    if (error) {
      // MFA required: create a challenge and hand the ids to the client.
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
          { error: msg(E.AUTH_MFA_ENABLE_FAILED), code: "mfa_error" },
          { status: 400 }
        );
      }

      // Record the failed attempt for detection, then return a GENERIC message.
      // We never reveal whether the email exists or the password was wrong -
      // that distinction helps an attacker enumerate accounts.
      auditAuthFailure(request, "auth.login", { email, reason: error.code || "invalid_credentials" });
      // Near-real-time brute-force detection (fire-and-forget, self-throttled).
      maybeRunSecurityScan().catch(() => {});

      if (error.code === "email_not_confirmed") {
        return NextResponse.json(
          { error: msg(E.AUTH_EMAIL_NOT_CONFIRMED), code: "AUTH_EMAIL_NOT_CONFIRMED" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: msg(E.AUTH_LOGIN_FAILED), code: "AUTH_LOGIN_FAILED" },
        { status: 401 }
      );
    }

    // ── Success with a session but MFA still pending at AAL1 ──────────────────
    if (data?.session) {
      const userWithFactors = data.session.user as {
        factors?: Array<{ id: string; factor_type: string; status: string }>;
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

    // ── Clean success ─────────────────────────────────────────────────────────
    auditAuthSuccess(request, "auth.login", data.user!.id, { email });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json(
      { error: msg(E.AUTH_LOGIN_SERVER_ERROR), code: "AUTH_LOGIN_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
