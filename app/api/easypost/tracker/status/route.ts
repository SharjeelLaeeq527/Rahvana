import { NextRequest, NextResponse } from "next/server";
import { getTracker } from "@/lib/easypost/tracker";
import * as db from "@/lib/journey/data-access";
import { E, msg } from '@/lib/errors';

/**
 * GET /api/easypost/tracker/status?caseId=xxx
 * Fetch current tracker status and update DB
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json(
        { error: msg(E.EASPOST_MISSING_CASE_ID) },
        { status: 400 },
      );
    }

    console.log(`[EasyPost API] Fetching status for case ${caseId}`);

    // Step 1: Get tracker ID from case_data (using getCaseDataByKeyDB)
    const trackerIdData = await db.getCaseDataByKeyDB(caseId, "easypost_tracker_id");

    if (!trackerIdData || !trackerIdData.data_value) {
      return NextResponse.json(
        { error: msg(E.EASPOST_NO_TRACKER) },
        { status: 404 },
      );
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
        { status: 500 },
      );
    }

    // Step 3: Update case_data with new status only when it changes
    const now = new Date().toISOString();

    // Idempotency / status-change detection
    const existingStatusRow = await db.getCaseDataByKeyDB(caseId, "tracking_status");
    const existingStatus = existingStatusRow?.data_value;
    const newStatus = trackerData.status;

    // Derive a simple event id for this fetch
    const eventId = trackerData.id || `${trackerId}:${newStatus}:${trackerData.updated_at}`;

    // Always update last-checked timestamp
    const updates: Promise<any>[] = [];
    updates.push(
      db.upsertCaseDataDB(caseId, "tracking_last_checked_at", {
        data_key: "tracking_last_checked_at",
        data_value: now,
        source: "external_api",
        source_reference: "status_fetch",
      }),
    );

    if (existingStatus !== newStatus) {
      updates.push(
        db.upsertCaseDataDB(caseId, "tracking_status", {
          data_key: "tracking_status",
          data_value: newStatus,
          source: "external_api",
          source_reference: "status_fetch",
        }),
      );

      // If delivered, also save delivery timestamp
      if (newStatus === "delivered" && trackerData.updated_at) {
        updates.push(
          db.upsertCaseDataDB(caseId, "delivered_at", {
            data_key: "delivered_at",
            data_value: trackerData.updated_at,
            source: "external_api",
            source_reference: "status_fetch",
          }),
        );
      }

      // Save last processed event id for idempotency
      updates.push(
        db.upsertCaseDataDB(caseId, "easypost_last_event_id", {
          data_key: "easypost_last_event_id",
          data_value: eventId,
          source: "external_api",
          source_reference: "status_fetch",
        }),
      );
    } else {
      // Even if status didn't change, store last event id so retries are tracked
      updates.push(
        db.upsertCaseDataDB(caseId, "easypost_last_event_id", {
          data_key: "easypost_last_event_id",
          data_value: eventId,
          source: "external_api",
          source_reference: "status_fetch",
        }),
      );
    }

    await Promise.all(updates);

    console.log(`[EasyPost API] Status fetched: ${trackerData.status} (changed=${existingStatus !== newStatus})`);

    return NextResponse.json(
      {
        success: true,
        status: trackerData.status,
        lastChecked: now,
        delivered: trackerData.status === "delivered",
        deliveredAt: trackerData.updated_at,
        events: trackerData.events || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[EasyPost API] Unexpected error:", error);
    return NextResponse.json({ error: msg(E.EASPOST_WEBHOOK_PROCESS_FAILED) }, { status: 500 });
  }
}
