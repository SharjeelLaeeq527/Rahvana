// app/api/dev/seed-notifications/route.ts
// DEV ONLY — seeds sample notifications into journey_reminders for UI testing.
// Disabled in production (NODE_ENV check).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { E, msg } from "@/lib/errors";
import { ir1journeyHref } from "@/lib/constants/routes";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const SAMPLE_NOTIFICATIONS = [
  {
    reminder_type: "appointment_approaching",
    priority: "critical",
    title: "🔴 Interview in 3 days — Final checklist",
    body: "Your visa interview is in 3 days. Make sure all original documents are ready: passport, birth certificate, I-864, DS-260 confirmation, medical results, and PCC. Arrive 30 minutes early.",
    action_label: "View Interview Checklist",
    action_url: ir1journeyHref,
    step_key: "step_2_12",
  },
  {
    reminder_type: "ceac_status_update",
    priority: "high",
    title: "Medical exam in 7 days — confirm you have everything",
    body: "One week to your medical exam. Confirm you have: ✓ Original passport ✓ 2 passport photos (35×45mm) ✓ Polio certificate ✓ Vaccination records ✓ Payment for physician fee.",
    action_label: "View Medical Checklist",
    action_url: ir1journeyHref,
    step_key: "step_3_1",
  },
  {
    reminder_type: "ceac_status_update",
    priority: "high",
    title: "Apply for Police Clearance Certificate NOW",
    body: "A fresh PCC is required for your interview. Apply immediately at your nearest Police Khidmat Markaz. PCCs can take 3–14 days — do not leave this for the last minute.",
    action_label: "Apply for PCC",
    action_url: ir1journeyHref,
    step_key: "step_3_3",
  },
  {
    reminder_type: "step_pending_too_long",
    priority: "normal",
    title: "Check your CEAC portal for NVC updates",
    body: "Log into your CEAC portal and check for any messages or status changes from NVC. If NVC marks your case as Documentarily Qualified, return here and record it in Step 10.",
    action_label: "Open CEAC Portal",
    action_url: "https://ceac.state.gov/IV/Login.aspx",
    step_key: "step_2_9",
  },
  {
    reminder_type: "missing_document",
    priority: "high",
    title: "Ask your US sponsor to prepare fresh financial documents",
    body: "Contact your US-based petitioner/sponsor now. They need recent tax returns, pay stubs, and a current I-864 Affidavit of Support ready for your interview.",
    action_label: "Go to Step 11",
    action_url: ir1journeyHref,
    step_key: "step_2_11",
  },
  {
    reminder_type: "nvc_fee_not_confirmed",
    priority: "normal",
    title: "Monthly check — any update on your interview date?",
    body: "Check your email and CEAC portal for an interview appointment letter. Once received, record your interview date in Chapter 2 → Step 12 to unlock Chapter 3.",
    action_label: "Check CEAC Portal",
    action_url: "https://ceac.state.gov/IV/Login.aspx",
    step_key: "step_2_11",
  },
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { journeyId } = await request.json();
    if (!journeyId) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journeyId]" }) },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Always clear previous demo notifications first — prevents duplicates on repeat clicks
    await supabase
      .from("journey_reminders")
      .delete()
      .eq("journey_id", journeyId)
      .like("dedup_key", `${journeyId}:dev_seed:%`);

    const rows = SAMPLE_NOTIFICATIONS.map((n, i) => ({
      journey_id: journeyId,
      reminder_type: n.reminder_type,
      priority: n.priority,
      title: n.title,
      body: n.body,
      action_label: n.action_label,
      action_url: n.action_url,
      step_key: n.step_key,
      is_dismissed: false,
      dedup_key: `${journeyId}:dev_seed:${i}`, // stable key — no timestamp = no duplicates
      created_at: new Date(Date.now() - i * 60000).toISOString(),
    }));

    const { error } = await supabase.from("journey_reminders").upsert(rows, {
      onConflict: "dedup_key",
      ignoreDuplicates: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, seeded: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { journeyId } = await request.json();
    const supabase = getAdminClient();

    // Fully reset all notifications for this journey to allow clean testing
    await supabase.from("journey_reminders").delete().eq("journey_id", journeyId);

    await supabase.from("ceac_scheduled_notifications").delete().eq("journey_id", journeyId);

    return NextResponse.json({ success: true, message: "Notifications fully reset for testing" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
