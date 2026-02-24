// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email/resend";
import crypto from "crypto";

// Create admin client for password reset
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers(
      {
        page: 1,
        perPage: 1000,
      },
    );

    if (listError) {
      console.error("List users error:", listError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );

    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in user metadata
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          reset_token_hash: resetTokenHash,
          reset_token_expiry: resetTokenExpiry.toISOString(),
        },
      });

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to generate reset token" },
        { status: 500 },
      );
    }

    // Build reset URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email via Resend
    const emailHtml = getPasswordResetEmailHtml(resetLink);
    const { success, error: emailError } = await sendEmail({
      to: email,
      subject: "Reset Your Password - Rahvana",
      html: emailHtml,
    });

    if (!success) {
      console.error("Email send failed:", emailError);
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
