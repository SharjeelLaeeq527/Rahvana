import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { auditLog, auditBlocked } from "@/lib/security/audit-log";

export async function POST(request: NextRequest) {
  // ── Rate Limit ──
  const rl = checkRateLimit(request, "auth-mfa-verify", { maxAttempts: 5 });
  if (!rl.allowed) {
    auditBlocked(request, "auth.mfa_verify", { reason: "rate_limited" });
    return rateLimitResponse(rl);
  }

  try {
    const supabase = await createClient();
    const { factorId, challengeId, code } = await request.json();

    if (!factorId || !challengeId || !code) {
      return NextResponse.json(
        { error: msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE) },
        { status: 400 }
      );
    }

    // Verify the MFA code
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error("MFA verification error:", error);
      return NextResponse.json({ error: msg(E.AUTH_MFA_CODE_INVALID) }, { status: 400 });
    }

    // Get updated session after MFA verification
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session retrieval error:", sessionError);
      return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 500 });
    }

    auditLog({
      userId: sessionData.session?.user?.id,
      action: "auth.mfa_verify",
      resource: "auth",
      request,
      metadata: { factorId },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      user: sessionData.session?.user,
      session: sessionData.session,
    });
  } catch (error) {
    console.error("MFA verify login error:", error);
    return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 500 });
  }
}
