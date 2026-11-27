// Server-side sign-out handler that properly clears all session cookies.
// This is necessary because the browser client's signOut() cannot reliably
// clear httpOnly cookies that were set by the middleware on Vercel.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { getRequestDevice } from "@/lib/security/security-context";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Identify the currently authenticated user.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[signout] User lookup failed:", userError.message);
    }

    // Revoke all registered Rahvana sessions before provider sign-out.
    // This is best-effort: provider sign-out must still be attempted.
    if (user) {
      const device = getRequestDevice(request);

      const { error: registryError } = await createSecurityAdmin().rpc(
        "revoke_all_security_sessions",
        {
          p_user_id: user.id,
          p_device_name: device.deviceName,
          p_browser: device.browser,
          p_event_type: "logout",
        }
      );

      if (registryError) {
        console.error(
          "[signout] Session registry update failed. Existing access JWTs may remain usable for Rahvana until expiry if registry enforcement is unavailable:",
          registryError
        );
      }
    }

    // Always attempt Supabase global sign-out, even if registry revocation fails.
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "global",
    });

    if (signOutError) {
      console.error("[signout] Supabase signOut error:", signOutError.message);

      // Preserve existing behavior: allow the client to proceed with redirect.
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[signout] Unexpected error:", err);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
