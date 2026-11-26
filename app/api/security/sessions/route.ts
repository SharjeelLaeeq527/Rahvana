// Lists only sessions owned by the user resolved from the auth cookie.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { requireActiveSession } from "@/lib/security/session-guard";

type SecuritySessionRecord = {
  id: string;
  session_id: string;
  device_name: string;
  browser: string;
  created_at: string;
  last_active_at: string;
};

function isSecuritySessionRecord(value: unknown): value is SecuritySessionRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "session_id" in value &&
    typeof value.session_id === "string" &&
    "device_name" in value &&
    typeof value.device_name === "string" &&
    "browser" in value &&
    typeof value.browser === "string" &&
    "created_at" in value &&
    typeof value.created_at === "string" &&
    "last_active_at" in value &&
    typeof value.last_active_at === "string"
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sessionGuard = await requireActiveSession(supabase, request);
    if (!sessionGuard.ok) return sessionGuard.response;
    const { context } = sessionGuard;

    const { data, error } = await createSecurityAdmin().rpc("list_security_sessions", {
      p_user_id: context.user.id,
    });
    if (error) throw error;

    const rows: unknown = data;
    if (!Array.isArray(rows) || !rows.every(isSecuritySessionRecord)) {
      throw new Error("Session list RPC returned an invalid response.");
    }

    return NextResponse.json({
      sessions: rows.map((row: SecuritySessionRecord) => ({
        id: row.id,
        deviceName: row.device_name,
        browser: row.browser,
        createdAt: row.created_at,
        lastActiveAt: row.last_active_at,
        isCurrent: row.session_id === context.sessionId,
      })),
    });
  } catch (error) {
    console.error("[security/sessions] list failed:", error);
    return NextResponse.json({ error: "Unable to load sessions." }, { status: 503 });
  }
}
