// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, getEmailConfirmationHtml } from "@/lib/email/resend";
import crypto from "crypto";
import { E, msg } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { auditLog, auditBlocked } from "@/lib/security/audit-log";
import { validateStrongPassword } from "@/lib/security/password";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Constant-time comparison
function safeCompare(a: string, b: string) {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  if (hashA.length !== hashB.length) return false;
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request: NextRequest) {
  // ── Rate Limit ──
  const rl = checkRateLimit(request, "auth-signup", { maxAttempts: 5 });
  if (!rl.allowed) {
    auditBlocked(request, "auth.signup", { reason: "rate_limited" });
    return rateLimitResponse(rl);
  }

  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
      .slice(0, 254);
    const password = String(body.password || "");

    if (!email || !password) {
      console.warn("signup invalid request");
      return NextResponse.json(
        { error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, { fields: "email, password" }) },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn("signup invalid email format");
      return NextResponse.json({ error: msg(E.AUTH_EMAIL_FORMAT_INVALID) }, { status: 400 });
    }

    // Disposable email check
    const blockedDomains = ["mailinator.com", "tempmail.com", "10minutemail.com", "yopmail.com"];
    const domain = email.split("@")[1];
    if (blockedDomains.includes(domain)) {
      console.warn("signup disposable email blocked");
      return NextResponse.json(
        { error: msg(E.AUTH_SIGNUP_DISPOSABLE_EMAIL, { domain }) },
        { status: 400 }
      );
    }

    // Strong password
    if (!validateStrongPassword(password)) {
      console.warn("signup weak password");
      return NextResponse.json({ error: msg(E.AUTH_PASSWORD_TOO_WEAK) }, { status: 400 });
    }

    // List users to check existing
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    const existingUser = users?.users?.find((u) =>
      safeCompare(u.email?.toLowerCase() || "", email)
    );

    // Build confirmation token & link (for both new and existing unconfirmed users)
    const confirmToken = crypto.randomBytes(32).toString("hex");
    const confirmTokenHash = crypto.createHash("sha256").update(confirmToken).digest("hex");
    const confirmTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000";
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
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
        {
          success: false,
          code: E.AUTH_SIGNUP_CREATE_FAILED,
          message: msg(E.AUTH_SIGNUP_CREATE_FAILED),
        },
        { status: 500 }
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
          { onConflict: "id" }
        );
      }
    }

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Confirm Your Email - Rahvana",
      html: emailHtml,
    });

    // Audit log — successful signup
    auditLog({
      userId: newUser?.user?.id,
      action: "auth.signup",
      resource: "profiles",
      request,
      metadata: { email },
      status: "success",
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: "If the email is valid, a confirmation link will be sent",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, code: E.AUTH_UNEXPECTED_ERROR, message: msg(E.AUTH_UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}
