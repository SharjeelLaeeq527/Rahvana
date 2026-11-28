// Returns this account's events and failed attempts matching its email HMAC.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { requireActiveSession } from "@/lib/security/session-guard";
import { getLoginEmailHmac } from "@/lib/security/security-activity";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sessionGuard = await requireActiveSession(supabase, request);
    if (!sessionGuard.ok) return sessionGuard.response;
    const { context } = sessionGuard;
    if (!context.user.email) {
      return NextResponse.json({ error: "Account email unavailable." }, { status: 400 });
    }

    const rawOffset = Number(request.nextUrl.searchParams.get("offset") ?? 0);
    const offset = Number.isSafeInteger(rawOffset) ? Math.max(0, Math.min(rawOffset, 500)) : 0;
    const pageSize = 25;
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const hmac = getLoginEmailHmac(context.user.email);

    const admin = createSecurityAdmin();

    const filter = `user_id.eq.${context.user.id},and(user_id.is.null,identifier_hmac.eq.${hmac.hash},identifier_hmac_key_version.eq.${hmac.keyVersion})`;

    const { count, error: countError } = await admin
      .from("login_activity")
      .select("id", { count: "exact", head: true })
      .or(filter)
      .gte("created_at", cutoff);

    if (countError) throw countError;

    const { data, error } = await admin
      .from("login_activity")
      .select("id, user_id, event_type, failure_reason, device_name, browser, created_at")
      .or(filter)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const rows = data ?? [];
    return NextResponse.json({
      events: rows.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        failureReason: row.failure_reason,
        deviceName: row.device_name,
        browser: row.browser,
        createdAt: row.created_at,
      })),
      totalItems: count ?? 0,
    });
  } catch (error) {
    console.error("[security/login-activity] list failed:", error);
    return NextResponse.json({ error: "Unable to load login activity." }, { status: 503 });
  }
}
