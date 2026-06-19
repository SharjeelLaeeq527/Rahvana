// ============================================================
// app/api/ceac/status/route.ts
//
// POST — user reports a new CEAC status from step_3_9 (or step_1_16 / step_2_1)
// Triggers CeacReminderEngine.scheduleReminders()
//
// PATCH — user clarifies refused sub-type (221g vs final)
// Triggers CeacReminderEngine.updateRefusedSubType()
//
// PUT — user marks passport received / 221(g) docs submitted
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CeacReminderEngine } from "@/lib/ceac-tracking/CeacReminderEngine";
import { isValidTransition, isTrackingActive } from "@/lib/ceac-tracking/stateMachine";
import type { CeacStatus, RefusedSubType } from "@/lib/ceac-tracking/types";
import { E, msg } from "@/lib/errors";

// ─────────────────────────────────────────────────────────────
// POST /api/ceac/status
// Body: { journeyId, newStatus, refusedSubType? }
// Called from step_3_9 tool whenever user selects a CEAC status.
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { success: false, code: E.AUTH_UNAUTHORIZED, message: msg(E.AUTH_UNAUTHORIZED) },
        { status: 401 }
      );

    const body = await req.json();
    const { journeyId, newStatus, refusedSubType } = body as {
      journeyId: string;
      newStatus: CeacStatus;
      refusedSubType?: RefusedSubType;
    };

    if (!journeyId || !newStatus) {
      return NextResponse.json(
        {
          success: false,
          code: E.CEAC_STATUS_FIELDS_REQUIRED,
          message: msg(E.CEAC_STATUS_FIELDS_REQUIRED, { fields: "journeyId, newStatus" }),
        },
        { status: 400 }
      );
    }

    // Verify the caller is a MEMBER of this journey (owner OR partner).
    // RLS on journeys (is_journey_member) returns the row only to members, so a
    // non-member gets null below → 404. Either spouse can report CEAC status.
    const { data: journey } = await supabase
      .from("journeys")
      .select("id")
      .eq("id", journeyId)
      .single();

    if (!journey)
      return NextResponse.json(
        { success: false, code: E.JOURNEY_NOT_FOUND, message: msg(E.JOURNEY_NOT_FOUND) },
        { status: 404 }
      );

    // Tracking only starts past at_nvc
    if (!isTrackingActive(newStatus)) {
      return NextResponse.json({ ok: true, message: "Status at_nvc — tracking not active" });
    }

    // Get previous status for transition validation
    const { data: currentStatusRow } = await supabase
      .from("ceac_case_status")
      .select("current_status")
      .eq("journey_id", journeyId)
      .single();

    const previousStatus = (currentStatusRow?.current_status as CeacStatus) ?? null;

    // Validate transition
    if (!isValidTransition(previousStatus, newStatus)) {
      return NextResponse.json(
        {
          success: false,
          code: E.CEAC_INVALID_TRANSITION,
          message: msg(E.CEAC_INVALID_TRANSITION, {
            from: String(previousStatus),
            to: String(newStatus),
          }),
        },
        { status: 422 }
      );
    }

    // Use admin client so RLS doesn't block engine writes
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const engine = new CeacReminderEngine(adminSupabase);
    await engine.scheduleReminders({
      journeyId,
      userId: user.id,
      newStatus,
      previousStatus,
      refusedSubType,
    });

    return NextResponse.json({ ok: true, scheduled: true, newStatus });
  } catch (err: any) {
    console.error("[/api/ceac/status POST]", err);
    return NextResponse.json(
      { success: false, code: E.CEAC_SERVER_ERROR, message: msg(E.CEAC_SERVER_ERROR) },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/ceac/status
// Body: { journeyId, action: 'clarify_refused', refusedSubType }
//       | { journeyId, action: 'mark_passport_received' }
//       | { journeyId, action: 'submit_221g_docs' }
// ─────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { success: false, code: E.AUTH_UNAUTHORIZED, message: msg(E.AUTH_UNAUTHORIZED) },
        { status: 401 }
      );

    const body = await req.json();
    const { journeyId, action, refusedSubType } = body as {
      journeyId: string;
      action: "clarify_refused" | "mark_passport_received" | "submit_221g_docs";
      refusedSubType?: Exclude<RefusedSubType, "pending_clarification">;
    };

    if (!journeyId || !action) {
      return NextResponse.json(
        {
          success: false,
          code: E.CEAC_STATUS_FIELDS_REQUIRED,
          message: msg(E.CEAC_STATUS_FIELDS_REQUIRED, { fields: "journeyId, action" }),
        },
        { status: 400 }
      );
    }

    // Verify membership (owner OR partner) — RLS scopes the row to members.
    const { data: journey } = await supabase
      .from("journeys")
      .select("id")
      .eq("id", journeyId)
      .single();

    if (!journey)
      return NextResponse.json(
        { success: false, code: E.JOURNEY_NOT_FOUND, message: msg(E.JOURNEY_NOT_FOUND) },
        { status: 404 }
      );

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const engine = new CeacReminderEngine(adminSupabase);

    if (action === "clarify_refused") {
      // Global Rule 8: user explicitly tells us 221(g) or final denial
      if (!refusedSubType || refusedSubType === "pending_clarification") {
        return NextResponse.json(
          {
            success: false,
            code: E.CEAC_STATUS_FIELDS_REQUIRED,
            message: msg(E.CEAC_STATUS_FIELDS_REQUIRED, { fields: "refusedSubType" }),
          },
          { status: 400 }
        );
      }
      await engine.updateRefusedSubType(journeyId, refusedSubType);
      return NextResponse.json({ ok: true, action, refusedSubType });
    }

    if (action === "mark_passport_received") {
      await engine.markPassportReceived(journeyId);
      return NextResponse.json({ ok: true, action });
    }

    if (action === "submit_221g_docs") {
      await engine.mark221gDocsSubmitted(journeyId);
      return NextResponse.json({ ok: true, action });
    }

    return NextResponse.json(
      { success: false, code: E.CEAC_INVALID_INPUT, message: msg(E.CEAC_INVALID_INPUT) },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[/api/ceac/status PATCH]", err);
    return NextResponse.json(
      { success: false, code: E.CEAC_SERVER_ERROR, message: msg(E.CEAC_SERVER_ERROR) },
      { status: 500 }
    );
  }
}
