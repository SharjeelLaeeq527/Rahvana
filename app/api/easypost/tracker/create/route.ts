import { NextRequest, NextResponse } from "next/server";
import { createTracker } from "@/lib/easypost/tracker";
import * as db from "@/lib/journey/data-access";
import { E, msg } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const { caseId, carrier, trackingCode } = await request.json();

    if (!caseId || !carrier || !trackingCode) {
      return NextResponse.json({ error: msg(E.EASPOST_TRACKER_MISSING_FIELDS) }, { status: 400 });
    }

    console.log(`[EasyPost API] Creating tracker for case ${caseId}: ${carrier} ${trackingCode}`);

    // Step 1: Create tracker in EasyPost
    let trackerData;
    try {
      trackerData = await createTracker(trackingCode, carrier);
    } catch (error) {
      console.error("[EasyPost API] Failed to create tracker:", error);

      // Save error to case_data so we can retry later
      await db.upsertCaseDataDB(caseId, "tracking_error", {
        data_key: "tracking_error",
        data_value: error instanceof Error ? error.message : "Unknown error",
        source: "external_api",
        source_reference: "tracker_creation",
      });

      return NextResponse.json(
        {
          error: msg(E.EASPOST_TRACKER_CREATE_FAILED),
        },
        { status: 500 }
      );
    }

    // Step 2: Save tracker ID and initial status to case_data
    const now = new Date().toISOString();

    const eventId = `${trackerData.id}:${trackerData.status}:${trackerData.updated_at}`;

    const writes: Promise<any>[] = [];
    writes.push(
      db.upsertCaseDataDB(caseId, "easypost_tracker_id", {
        data_key: "easypost_tracker_id",
        data_value: trackerData.id,
        label: "EasyPost Tracker ID",
        source: "external_api",
        source_reference: "tracker_creation",
      })
    );

    writes.push(
      db.upsertCaseDataDB(caseId, "tracking_status", {
        data_key: "tracking_status",
        data_value: trackerData.status,
        label: "Tracking Status",
        source: "external_api",
        source_reference: "tracker_creation",
      })
    );

    writes.push(
      db.upsertCaseDataDB(caseId, "tracking_last_checked_at", {
        data_key: "tracking_last_checked_at",
        data_value: now,
        source: "external_api",
        source_reference: "tracker_creation",
      })
    );

    // Save last processed event id for idempotency
    writes.push(
      db.upsertCaseDataDB(caseId, "easypost_last_event_id", {
        data_key: "easypost_last_event_id",
        data_value: eventId,
        source: "easypost_api",
        source_reference: "tracker_creation",
      })
    );

    // If already delivered, record delivered_at
    if (trackerData.status === "delivered" && trackerData.updated_at) {
      writes.push(
        db.upsertCaseDataDB(caseId, "delivered_at", {
          data_key: "delivered_at",
          data_value: trackerData.updated_at,
          source: "easypost_api",
          source_reference: "tracker_creation",
        })
      );
    }

    await Promise.all(writes);

    console.log(`[EasyPost API] Tracker saved to case: ${trackerData.id}`);

    return NextResponse.json(
      {
        success: true,
        id: trackerData.id,
        status: trackerData.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[EasyPost API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: msg(E.EASPOST_WEBHOOK_PROCESS_FAILED),
      },
      { status: 500 }
    );
  }
}
