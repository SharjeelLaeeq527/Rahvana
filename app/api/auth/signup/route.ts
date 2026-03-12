// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, getEmailConfirmationHtml } from "@/lib/email/resend";
import crypto from "crypto";

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
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
      .slice(0, 254);
    const password = String(body.password || "");

    if (!email || !password)
      return NextResponse.json(
        { error: "Invalid signup request" },
        { status: 400 },
      );

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );

    // Disposable email check
    const blockedDomains = [
      "mailinator.com",
      "tempmail.com",
      "10minutemail.com",
      "yopmail.com",
    ];
    const domain = email.split("@")[1];
    if (blockedDomains.includes(domain))
      return NextResponse.json(
        { error: "Disposable emails are not allowed" },
        { status: 400 },
      );

    // Strong password
    if (!validatePassword(password))
      return NextResponse.json(
        {
          error:
            "Password must contain uppercase, lowercase, number, symbol and be 8+ characters",
        },
        { status: 400 },
      );

    // List users to check existing
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    const existingUser = users?.users?.find((u) =>
      safeCompare(u.email?.toLowerCase() || "", email),
    );

    // Build confirmation token & link (for both new and existing unconfirmed users)
    const confirmToken = crypto.randomBytes(32).toString("hex");
    const confirmTokenHash = crypto
      .createHash("sha256")
      .update(confirmToken)
      .digest("hex");
    const confirmTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const confirmLink = `${baseUrl}/api/auth/confirm-email?token=${confirmToken}&email=${encodeURIComponent(email)}`;

    const emailHtml = getEmailConfirmationHtml(confirmLink);

    if (existingUser) {
      // If already exists, only resend confirmation email if not confirmed
      if (!existingUser.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            confirm_token_hash: confirmTokenHash,
            confirm_token_expiry: confirmTokenExpiry.toISOString(),
          },
        });

        await sendEmail({
          to: email,
          subject: "Confirm Your Email - Rahvana",
          html: emailHtml,
        });
      }

      // Prevent enumeration
      return NextResponse.json({
        success: true,
        message: "If the email is valid, a confirmation link will be sent",
      });
    }

    // Create new user
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          confirm_token_hash: confirmTokenHash,
          confirm_token_expiry: confirmTokenExpiry.toISOString(),
        },
      });

    if (createError) {
      console.error("Create user error:", createError);
      return NextResponse.json(
        { error: "Unable to create account" },
        { status: 500 },
      );
    }

    // Wait for DB trigger
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ensure profile exists
    if (newUser?.user?.id) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", newUser.user.id)
        .single();

      if (!existingProfile) {
        await supabaseAdmin.from("profiles").upsert(
          [
            {
              id: newUser.user.id,
              email,
              full_name: email.split("@")[0],
              role: "user",
            },
          ],
          { onConflict: "id" },
        );
      }
    }

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Confirm Your Email - Rahvana",
      html: emailHtml,
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: "If the email is valid, a confirmation link will be sent",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
