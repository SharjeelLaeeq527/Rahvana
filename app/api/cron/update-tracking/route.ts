import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/journey/data-access";
import { getTracker } from "@/lib/easypost/tracker";
import { E, msg } from "@/lib/errors";

/**
 * POST /api/cron/update-tracking
 *
 * Triggered by external cron service (EasyCron)
 * Updates tracking status for all active cases
 */
export async function POST(request: NextRequest) {
  try {
    // Validate cron secret to prevent unauthorized calls
    const cronSecret = request.headers.get("X-CRON-SECRET");
    if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
      console.warn("[Cron API] Unauthorized cron request");
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    console.log("[Cron API] Starting tracking status update job");

    // Step 1: Get all cases with active trackers
    const activeCases = await db.getAllCasesWithTrackers?.();

    if (!activeCases || activeCases.length === 0) {
      console.log("[Cron API] No active trackers to update");
      return NextResponse.json({ success: true, updated: 0, failed: 0, total: 0 }, { status: 200 });
    }

    console.log(`[Cron API] Found ${activeCases.length} cases with active trackers`);

    let updated = 0;
    let failed = 0;

    // Step 2: Update each tracker
    for (const caseId of activeCases) {
      try {
        // Get tracker ID from case_data
        const trackerIdData = await db.getCaseDataByKeyDB(caseId, "easypost_tracker_id");

        if (!trackerIdData?.data_value) {
          console.warn(`[Cron API] No tracker ID found for case ${caseId}`);
          failed++;
          continue;
        }

        const trackerId = trackerIdData.data_value;

        // Fetch latest status from EasyPost
        const trackerData = await getTracker(trackerId);

        // Update case_data with new status
        const now = new Date().toISOString();
        const updates = [
          db.upsertCaseDataDB(caseId, "tracking_status", {
            data_key: "tracking_status",
            data_value: trackerData.status,
            source: "external_api",
            source_reference: "scheduled_update",
          }),
          db.upsertCaseDataDB(caseId, "tracking_last_checked_at", {
            data_key: "tracking_last_checked_at",
            data_value: now,
            source: "external_api",
            source_reference: "scheduled_update",
          }),
        ];

        // If delivered, also save delivery timestamp
        if (trackerData.status === "delivered" && trackerData.updated_at) {
          updates.push(
            db.upsertCaseDataDB(caseId, "delivered_at", {
              data_key: "delivered_at",
              data_value: trackerData.updated_at,
              source: "external_api",
              source_reference: "scheduled_update",
            })
          );
        }

        await Promise.all(updates);
        updated++;

        console.log(`[Cron API] Updated case ${caseId}: ${trackerData.status}`);
      } catch (error) {
        console.error(`[Cron API] Failed to update case ${caseId}:`, error);
        failed++;
      }
    }

    console.log(`[Cron API] Job complete: ${updated} updated, ${failed} failed`);

    return NextResponse.json(
      {
        success: true,
        updated,
        failed,
        total: activeCases.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cron API] Unexpected error:", error);
    return NextResponse.json({ error: msg(E.CEAC_SERVER_ERROR) }, { status: 500 });
  }
}
