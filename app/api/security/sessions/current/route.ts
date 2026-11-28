// Updates activity for an existing session; this route never registers one.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { touchSession } from "@/lib/security/session-registry";
import { requireActiveSession } from "@/lib/security/session-guard";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sessionGuard = await requireActiveSession(supabase, request);
    if (!sessionGuard.ok) return sessionGuard.response;
    const { context } = sessionGuard;

    await touchSession(context.user.id, context.sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[security/sessions/current] heartbeat failed:", error);
    return NextResponse.json({ error: "Unable to verify session." }, { status: 503 });
  }
}
