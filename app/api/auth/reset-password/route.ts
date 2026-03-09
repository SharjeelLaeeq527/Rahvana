// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Strong password validation
function validatePassword(password: string) {
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,72}$/;
  return strongPassword.test(password);
}

// Constant-time comparison
function safeCompare(a: string, b: string) {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  if (hashA.length !== hashB.length) return false;
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and password are required" },
        { status: 400 },
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must contain uppercase, lowercase, number, symbol and be 8+ characters",
        },
        { status: 400 },
      );
    }

    // Find user by email
    const { data: users, error: userError } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });

    if (userError) {
      console.error("Error listing users:", userError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const user = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const storedTokenHash = user.user_metadata?.reset_token_hash;
    const tokenExpiry = user.user_metadata?.reset_token_expiry;

    if (
      !storedTokenHash ||
      !tokenExpiry ||
      !safeCompare(tokenHash, storedTokenHash)
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    if (new Date() > new Date(tokenExpiry)) {
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Update password and clear token
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
        user_metadata: {
          ...user.user_metadata,
          reset_token_hash: null,
          reset_token_expiry: null,
        },
      });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
