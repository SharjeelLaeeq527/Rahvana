// app/auth/callback/route.ts
// OAuth callback handler for Google Sign-In

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/security/safeRedirect";
import { isStagingEmailAllowed } from "@/lib/security/staging-access";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { getSecurityContext } from "@/lib/security/security-context";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;)\s*oauth_redirect\s*=\s*([^;]+)/);
  const nextCookie = match ? decodeURIComponent(match[1]) : null;

  // Only allow same-origin relative redirect targets (prevents open redirect
  // to an attacker-controlled site after login).
  const next = safeRedirectPath(searchParams.get("next") ?? nextCookie);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the current user to create/update their profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Enforce staging access restriction for OAuth sign-ins
        if (!isStagingEmailAllowed(user.email)) {
          await supabase.auth.signOut();
          const response = NextResponse.redirect(`${origin}/login?error=staging_access_denied`);
          response.cookies.delete("oauth_redirect");
          return response;
        }

        try {
          const context = await getSecurityContext(supabase, request);
          if (!context || context.user.id !== user.id) {
            throw new Error("Verified OAuth session required.");
          }

          // OAuth intentionally records the session without the app's MFA gate.
          const { data: recordId, error: registrationError } =
            await createSecurityAdmin().rpc("register_security_session", {
              p_user_id: context.user.id,
              p_session_id: context.sessionId,
              p_device_name: context.device.deviceName,
              p_browser: context.device.browser,
            });
          if (registrationError || typeof recordId !== "string") {
            throw new Error(
              `Session registration failed: ${registrationError?.message ?? "invalid response"}`
            );
          }
        } catch (registrationError) {
          console.error("[auth/callback] session registration failed:", registrationError);
          await supabase.auth.signOut({ scope: "local" });
          const response = NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
          response.cookies.delete("oauth_redirect");
          return response;
        }

        // Create or update user profile
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
          role: "user", // Default role is 'user'
        });

        if (profileError) {
          console.error("Error creating/updating user profile:", profileError);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let response;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        response = NextResponse.redirect(`${origin}${next}`);
      }

      response.cookies.delete("oauth_redirect");
      return response;
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
