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

    const emailHtml = getPasswordChangedHtml();

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

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
      metadata: { email: user.email },
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
