import { NextRequest, NextResponse } from "next/server";
import { getTracker } from "@/lib/easypost/tracker";
import * as db from "@/lib/journey/data-access";

/**
 * GET /api/easypost/tracker/status?caseId=xxx
 * Fetch current tracker status and update DB
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json({ error: "Missing caseId parameter" }, { status: 400 });
    }

    console.log(`[EasyPost API] Fetching status for case ${caseId}`);

    // Step 1: Get tracker ID from case_data (using getCaseDataByKeyDB)
    const trackerIdData = await db.getCaseDataByKeyDB(caseId, "easypost_tracker_id");

    if (!trackerIdData || !trackerIdData.data_value) {
      return NextResponse.json({ error: "No tracker found for this case" }, { status: 404 });
    }

    const trackerId = trackerIdData.data_value;

    // Step 2: Fetch latest status from EasyPost
    let trackerData;
    try {
      trackerData = await getTracker(trackerId);
    } catch (error) {
      console.error("[EasyPost API] Failed to get tracker:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch tracker status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Step 3: Update case_data with new status
    const now = new Date().toISOString();
    const updates = [
      db.upsertCaseDataDB(caseId, "tracking_status", {
        data_key: "tracking_status",
        data_value: trackerData.status,
        source: "external_api",
        source_reference: "status_fetch",
      }),
      db.upsertCaseDataDB(caseId, "tracking_last_checked_at", {
        data_key: "tracking_last_checked_at",
        data_value: now,
        source: "external_api",
        source_reference: "status_fetch",
      }),
    ];

    // If delivered, also save delivery timestamp
    if (trackerData.status === "delivered" && trackerData.updated_at) {
      updates.push(
        db.upsertCaseDataDB(caseId, "delivered_at", {
          data_key: "delivered_at",
          data_value: trackerData.updated_at,
          source: "external_api",
          source_reference: "status_fetch",
        })
      );
    }

    await Promise.all(updates);

    console.log(`[EasyPost API] Status updated: ${trackerData.status}`);

    return NextResponse.json(
      {
        success: true,
        status: trackerData.status,
        lastChecked: now,
        delivered: trackerData.status === "delivered",
        deliveredAt: trackerData.updated_at,
        events: trackerData.events || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[EasyPost API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
