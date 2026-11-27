import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, getMFADisabledEmailHtml } from "@/lib/email/resend";
import { E, msg } from "@/lib/errors";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { getRequestDevice } from "@/lib/security/security-context";
import { requireActiveSessionForRequest } from "@/lib/security/session-guard";

export async function POST(req: NextRequest) {
  try {
    const sessionGuard = await requireActiveSessionForRequest(req);
    if (!sessionGuard.ok) return sessionGuard.response;

    const supabase = await createClient();

    // 1. Validate the authenticated user on the server.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("auth/mfa/disable unauthorized:", authError);

      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // 2. Validate request input.
    const body = await req.json();
    const { factorId, code } = body;

    if (
      typeof factorId !== "string" ||
      typeof code !== "string" ||
      !factorId.trim() ||
      !code.trim()
    ) {
      return NextResponse.json({ error: "Missing or invalid factorId or code" }, { status: 400 });
    }

    // 3. Create an MFA challenge.
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challenge) {
      console.error("[mfa-disable] Challenge creation failed:", challengeError);

      return NextResponse.json({ error: "Failed to initiate MFA challenge" }, { status: 400 });
    }

    // 4. Verify the authenticator code.
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      console.warn("[mfa-disable] Invalid authenticator code.");

      return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 400 });
    }

    // 5. Fetch the user's MFA factors.
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error("[mfa-disable] Factor lookup failed:", factorsError);

      return NextResponse.json({ error: "Failed to fetch MFA factors" }, { status: 500 });
    }

    // 6. Find all verified TOTP factors.
    const verifiedFactors = (factors?.totp ?? []).filter((factor) => factor.status === "verified");

    if (verifiedFactors.length === 0) {
      return NextResponse.json(
        { error: "No verified TOTP factors found to disable" },
        { status: 400 }
      );
    }

    // 7. Remove all verified TOTP factors.
    for (const factor of verifiedFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (unenrollError) {
        console.error("[mfa-disable] Factor unenrollment failed:", unenrollError);

        return NextResponse.json({ error: msg(E.AUTH_MFA_DISABLE_FAILED) }, { status: 500 });
      }
    }

    // 8. Revoke all registered Rahvana sessions.
    // This is best-effort. Global Supabase sign-out must still run.
    const device = getRequestDevice(req);

    const { error: revokeError } = await createSecurityAdmin().rpc("revoke_all_security_sessions", {
      p_user_id: user.id,
      p_device_name: device.deviceName,
      p_browser: device.browser,
      p_event_type: "mfa_disabled",
    });

    if (revokeError) {
      console.error(
        "[mfa-disable] Session registry update failed. Existing access JWTs may remain usable for Rahvana until expiry if registry enforcement is unavailable:",
        revokeError
      );
    }

    // 9. Invalidate all Supabase sessions.
    // Continue with profile update and notification even if this fails.
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "global",
    });

    if (signOutError) {
      console.error("[mfa-disable] Supabase global sign-out failed:", signOutError.message);
    }

    // 10. Update the user's profile.
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        mfa_enabled: false,
        mfa_enrolled_at: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[mfa-disable] Profile update failed:", updateError);
    }

    // 11. Send MFA disabled notification email.
    try {
      if (user.email) {
        const emailResult = await sendEmail({
          to: user.email,
          subject: "Two-Factor Authentication Disabled - Rahvana",
          html: getMFADisabledEmailHtml(),
        });

        if (!emailResult.success) {
          console.error("[mfa-disable] Notification email failed:", emailResult.error);
        }
      }
    } catch (emailError) {
      console.error("[mfa-disable] Notification email exception:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("[mfa-disable] Unexpected error:", error);

    return NextResponse.json({ error: msg(E.AUTH_MFA_DISABLE_FAILED) }, { status: 500 });
  }
}
