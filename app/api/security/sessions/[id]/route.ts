// The verified caller ID is passed to the RPC; never accept an owner ID from the client.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { requireActiveSession } from "@/lib/security/session-guard";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = checkRateLimit(request, "security-session-revoke", { maxAttempts: 5 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const supabase = await createClient();
    const sessionGuard = await requireActiveSession(supabase, request);
    if (!sessionGuard.ok) return sessionGuard.response;
    const { context } = sessionGuard;

    const { id } = await params;
    // The RPC checks ownership and commits the activity event with the revoke.
    const { data: revoked, error } = await createSecurityAdmin().rpc("revoke_security_session", {
      p_user_id: context.user.id,
      p_record_id: id,
      p_device_name: context.device.deviceName,
      p_browser: context.device.browser,
    });
    if (error) throw error;
    if (!revoked || typeof revoked.session_id !== "string") {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const isCurrent = revoked.session_id === context.sessionId;
    if (isCurrent) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
    }

    return NextResponse.json({ success: true, isCurrent });
  } catch (error) {
    console.error("[security/sessions/:id] revoke failed:", error);
    return NextResponse.json({ error: "Unable to revoke session." }, { status: 503 });
  }
}
