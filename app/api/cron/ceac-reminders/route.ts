// ============================================================
// app/api/cron/ceac-reminders/route.ts
//
// GET — called by EasyCron every 6 hours.
// Delegates to recurringJobRunner.runCeacNotificationJob().
// Protected by X-CRON-SECRET header (same pattern as update-tracking).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runCeacNotificationJob } from "@/lib/ceac-tracking/recurringJobRunner";

export const runtime = "nodejs"; // node-cron / Resend require Node runtime

export async function GET(req: NextRequest) {
  // In dev, allow without secret for easy testing
  if (process.env.NODE_ENV !== "development") {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const stats = await runCeacNotificationJob();

    return NextResponse.json({
      ok: true,
      ran_at: new Date().toISOString(),
      ...stats,
    });
  } catch (err: any) {
    console.error("[/api/cron/ceac-reminders]", err);
    return NextResponse.json({ error: err.message ?? "Job failed" }, { status: 500 });
  }
}
