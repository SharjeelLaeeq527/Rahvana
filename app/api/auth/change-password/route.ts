import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { sendEmail, getPasswordChangedHtml } from "@/lib/email/resend";
import { validateStrongPassword } from "@/lib/security/password";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { auditLog, auditBlocked } from "@/lib/security/audit-log";

export async function POST(req: NextRequest) {
  // ── Rate Limit ──
  const rl = checkRateLimit(req, "auth-change-password", { maxAttempts: 5 });
  if (!rl.allowed) {
    auditBlocked(req, "auth.change-password", { reason: "rate_limited" });
    return rateLimitResponse(rl);
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const mfaCode = String(body.mfaCode || "").trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (!validateStrongPassword(newPassword)) {
      return NextResponse.json({ error: msg(E.AUTH_PASSWORD_TOO_WEAK) }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Your new password must be different from the current password." },
        { status: 400 }
      );
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    const mfaRequiredBySignIn = verifyError?.code === "mfa_required";

    if (verifyError && !mfaRequiredBySignIn) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("mfa_enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[change-password] profile lookup error:", profileError);
    }

    const mfaEnabled = !!profileData?.mfa_enabled;
    const mfaIsRequired = mfaRequiredBySignIn || mfaEnabled;

    if (mfaIsRequired && !mfaCode) {
      return NextResponse.json(
        {
          success: false,
          mfaRequired: true,
          message: "Enter the 6-digit code from your authenticator app to continue.",
        },
        { status: 428 }
      );
    }

    if (mfaIsRequired) {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        return NextResponse.json(
          { error: "We couldn't verify your authenticator setup. Please try again." },
          { status: 400 }
        );
      }

      const verifiedFactor = factors?.totp?.find((factor) => factor.status === "verified");

      if (!verifiedFactor) {
        return NextResponse.json(
          { error: "We couldn't find a verified authenticator app on this account." },
          { status: 400 }
        );
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });

      if (challengeError || !challengeData) {
        return NextResponse.json(
          { error: "We couldn't start the MFA challenge. Please try again." },
          { status: 400 }
        );
      }

      const { error: mfaVerifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (mfaVerifyError) {
        return NextResponse.json(
          { error: "The authenticator code is incorrect or expired." },
          { status: 400 }
        );
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const emailHtml = getPasswordChangedHtml();

    // Send confirmation email
    await sendEmail({
      to: user.email!,
      subject: "Password Changed - Rahvana",
      html: emailHtml,
    });

    // Audit log — successful change password
    auditLog({
      userId: user.id,
      action: "auth.change-password",
      resource: "profiles",
      request: req,
      metadata: { email: user.email, mfaEnabled: mfaIsRequired },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("[change-password] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
