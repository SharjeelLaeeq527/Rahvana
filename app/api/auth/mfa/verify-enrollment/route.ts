import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendEmail, getMFAEnabledEmailHtml } from "@/lib/email/resend";
import { E, msg } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { factorId, code } = await request.json();

    // Validate input
    if (!factorId || !code) {
      return NextResponse.json(
        { error: msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE) },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("MFA verify unauthorized:", authError);
      return NextResponse.json(
        { success: false, code: E.AUTH_UNAUTHORIZED, message: msg(E.AUTH_UNAUTHORIZED) },
        { status: 401 }
      );
    }

    // Create challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      console.error("MFA challenge error:", challengeError);
      return NextResponse.json(
        { success: false, code: E.AUTH_MFA_VERIFY_FAILED, message: msg(E.AUTH_MFA_VERIFY_FAILED) },
        { status: 400 }
      );
    }

    // Verify the code
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      console.error("MFA verify error:", verifyError);
      // If the SDK indicates the code is invalid, return a client-visible validation error
      return NextResponse.json(
        { success: false, code: E.AUTH_MFA_CODE_INVALID, message: msg(E.AUTH_MFA_CODE_INVALID) },
        { status: 400 }
      );
    }

    // After successful verification, the factor should now be active
    // Let's verify it's properly enrolled by checking the factors
    const { data: updatedFactors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      console.error("Error listing factors after verification:", listError);
      return NextResponse.json(
        { success: false, code: E.AUTH_MFA_VERIFY_FAILED, message: msg(E.AUTH_MFA_VERIFY_FAILED) },
        { status: 500 }
      );
    }

    console.log("Factors after verification:", updatedFactors);

    // Verify that we have at least one verified factor
    const verifiedFactor = updatedFactors?.totp?.find((factor) => factor.status === "verified");
    if (!verifiedFactor) {
      console.error("No verified factor found after verification");
      return NextResponse.json(
        { success: false, code: E.AUTH_MFA_VERIFY_FAILED, message: msg(E.AUTH_MFA_VERIFY_FAILED) },
        { status: 500 }
      );
    }

    // Update user profile to mark MFA as enabled
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        mfa_enabled: true,
        mfa_enrolled_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile with MFA status:", updateError);
    }

    // Send MFA enabled notification email
    try {
      console.log("Attempting to send MFA enabled email to:", user.email);
      console.log(
        "Environment variables check - RESEND_API_KEY exists:",
        !!process.env.RESEND_API_KEY,
        "EMAIL_FROM:",
        process.env.EMAIL_FROM
      );

      const emailResult = await sendEmail({
        to: user.email!,
        subject: "Two-Factor Authentication Enabled Successfully - Rahvana",
        html: getMFAEnabledEmailHtml(),
      });

      console.log("Email send result:", emailResult);

      if (!emailResult.success) {
        console.error("MFA enabled email failed to send:", emailResult.error);
      } else {
        console.log("MFA enabled email sent successfully");
      }
    } catch (emailError) {
      console.error("Exception occurred when sending MFA enabled email:", emailError);
      // Don't fail the operation if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: "MFA enabled successfully",
    });
  } catch (error) {
    console.error("MFA verify enrollment error:", error);
    return NextResponse.json(
      { success: false, code: E.AUTH_MFA_VERIFY_FAILED, message: msg(E.AUTH_MFA_VERIFY_FAILED) },
      { status: 500 }
    );
  }
}
