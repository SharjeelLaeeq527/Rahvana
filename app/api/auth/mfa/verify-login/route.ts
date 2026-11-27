import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { auditLog, auditBlocked } from "@/lib/security/audit-log";

import { registerVerifiedSession } from "@/lib/security/session-registry";
import { recordLoginFailure } from "@/lib/security/security-activity";
import { getRequestDevice } from "@/lib/security/security-context";

export async function POST(request: NextRequest) {
  // 1. Rate limit MFA verification attempts.
  const rl = checkRateLimit(request, "auth-mfa-verify", { maxAttempts: 5 });

  if (!rl.allowed) {
    auditBlocked(request, "auth.mfa_verify", { reason: "rate_limited" });
    return rateLimitResponse(rl);
  }

  try {
    const supabase = await createClient();

    const { factorId, challengeId, code } = await request.json();

    // 2. Validate required input.
    if (
      typeof factorId !== "string" ||
      typeof challengeId !== "string" ||
      typeof code !== "string" ||
      !factorId.trim() ||
      !challengeId.trim() ||
      !code.trim()
    ) {
      return NextResponse.json(
        { error: msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE) },
        { status: 400 }
      );
    }

    // 3. Confirm that this request has a partially authenticated user.
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.warn("[mfa-login] No authenticated user found for MFA verification.");

      return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 401 });
    }

    // 4. Verify the MFA code.
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (verifyError) {
      console.warn("[mfa-login] MFA verification failed.");

      // Record the failed MFA attempt without storing the email itself.
      if (userData.user.email) {
        try {
          await recordLoginFailure({
            email: userData.user.email,
            reason: "invalid_mfa",
            device: getRequestDevice(request),
          });
        } catch (activityError) {
          console.error("[mfa-login] Failed-attempt activity write failed:", activityError);
        }
      }

      return NextResponse.json({ error: msg(E.AUTH_MFA_CODE_INVALID) }, { status: 400 });
    }

    // 5. Retrieve the session after successful MFA verification.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.error("[mfa-login] Session retrieval failed:", sessionError?.message);

      return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 500 });
    }

    // 6. Register the verified session before granting application access.
    try {
      await registerVerifiedSession(supabase, request);
    } catch (registrationError) {
      console.error("[mfa-login] Session registration failed:", registrationError);

      await supabase.auth.signOut({ scope: "local" });

      return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 503 });
    }

    // 7. Record successful MFA verification.
    auditLog({
      userId: sessionData.session.user.id,
      action: "auth.mfa_verify",
      resource: "auth",
      request,
      metadata: { factorId },
      status: "success",
    });

    // 8. Return success only. The browser reads its session from Supabase.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mfa-login] MFA verify login error:", error);

    return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 500 });
  }
}
