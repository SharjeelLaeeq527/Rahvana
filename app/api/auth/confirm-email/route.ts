// app/api/auth/confirm-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { auditLog, auditBlocked } from "@/lib/security/audit-log";

// Create admin client
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

export async function GET(request: NextRequest) {
  // ── Rate Limit ──
  const rl = checkRateLimit(request, "auth-confirm-email", { maxAttempts: 10 });
  if (!rl.allowed) {
    auditBlocked(request, "auth.confirm_email", { reason: "rate_limited" });
    return rateLimitResponse(rl);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
    }

    // Hash the provided token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the user
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError);
      return NextResponse.redirect(new URL("/login?error=server_error", request.url));
    }

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", request.url));
    }

    // Verify token
    const storedTokenHash = user.user_metadata?.confirm_token_hash;
    const tokenExpiry = user.user_metadata?.confirm_token_expiry;

    if (!storedTokenHash || !tokenExpiry) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
    }

    // Check if token matches
    if (tokenHash !== storedTokenHash) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
    }

    // Check if token expired
    if (new Date() > new Date(tokenExpiry)) {
      return NextResponse.redirect(new URL("/login?error=link_expired", request.url));
    }

    // Confirm the email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        confirm_token_hash: null,
        confirm_token_expiry: null,
        email_verified: true,
      },
    });

    if (updateError) {
      console.error("Error confirming email:", updateError);
      return NextResponse.redirect(new URL("/login?error=confirmation_failed", request.url));
    }

    // Audit log — successful email confirmation
    auditLog({
      userId: user.id,
      action: "auth.confirm_email",
      resource: "auth",
      request,
      metadata: { email },
      status: "success",
    });

    // Redirect to login with success message
    return NextResponse.redirect(new URL("/login?confirmed=true", request.url));
  } catch (error) {
    console.error("Email confirmation error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
  }
}
