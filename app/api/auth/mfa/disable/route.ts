import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, getMFADisabledEmailHtml } from "@/lib/email/resend";
import { E, msg } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('auth/mfa/disable unauthorized:', sessionError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await req.json();
    const { factorId, code } = body;

    if (!factorId || !code) {
      return NextResponse.json(
        { error: "Missing factorId or code" },
        { status: 400 },
      );
    }

    // Verify OTP again
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: "Failed to initiate MFA challenge" },
        { status: 400 },
      );
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      console.warn('auth/mfa/disable invalid auth code:', verifyError);
      return NextResponse.json({ error: msg(E.AUTH_MFA_VERIFY_FAILED) }, { status: 400 });
    }

    // Fetch all MFA factors
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) {
      return NextResponse.json(
        { error: "Failed to fetch MFA factors" },
        { status: 500 },
      );
    }

    // Unenroll all verified totp factors
    const verifiedFactors = factors?.totp?.filter(
      (factor: { status: string }) => factor.status === "verified",
    );
    if (!verifiedFactors || verifiedFactors.length === 0) {
      return NextResponse.json(
        { error: "No verified TOTP factors found to disable" },
        { status: 400 },
      );
    }

    for (const factor of verifiedFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (unenrollError) {
        console.error('auth/mfa/disable unenroll error:', unenrollError);
        return NextResponse.json({ error: msg(E.AUTH_MFA_DISABLE_FAILED) }, { status: 500 });
      }
    }

    // Invalidate all sessions
    await supabase.auth.signOut({ scope: "global" });

    // Update user profile to mark MFA as disabled
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
      .eq("id", session.user.id);

    if (updateError) {
      console.error("Error updating profile with MFA status:", updateError);
    }

    // Send MFA disabled notification email
    try {
      console.log("Attempting to send MFA disabled email to:", session.user.email);
      console.log("Environment variables check - RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY, "EMAIL_FROM:", process.env.EMAIL_FROM);
      
      const emailResult = await sendEmail({
        to: session.user.email!,
        subject: "Two-Factor Authentication Disabled - Rahvana",
        html: getMFADisabledEmailHtml(),
      });
      
      console.log("Email send result:", emailResult);
      
      if (!emailResult.success) {
        console.error("MFA disabled email failed to send:", emailResult.error);
      } else {
        console.log("MFA disabled email sent successfully");
      }
    } catch (emailError) {
      console.error("Exception occurred when sending MFA disabled email:", emailError);
      // Don't fail the operation if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("Disable MFA error:", error);
    return NextResponse.json({ error: msg(E.AUTH_MFA_DISABLE_FAILED) }, { status: 500 });
  }
}
