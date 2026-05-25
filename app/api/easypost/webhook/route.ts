import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import * as db from "@/lib/journey/data-access";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/easypost/webhook
 * Receives webhook events from EasyPost
 * Signature verification included
 *
 * Note: We update the database and Supabase Realtime automatically
 * broadcasts the change to connected clients on Vercel
 */
export async function POST(request: NextRequest) {
  try {
    // Raw body needed for correct HMAC verification
    const body = await request.text();

    // EasyPost may send the signature in different headers depending on setup.
    // Try common header names and fall back to original used value.
    const sigHeader =
      request.headers.get("x-easypost-signature") ||
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-signature");

    // Verify webhook signature with EasyPost secret
    const webhookSecret = process.env.EASYPOST_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[EasyPost Webhook] EASYPOST_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Build expected signature (hex digest of HMAC-SHA256 over raw body)
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    // Normalize incoming signature: headers sometimes include prefixes like "sha256=" or timestamps.
    const incomingSig = sigHeader
      ? sigHeader.split(",").pop()?.split("=").pop()?.trim()
      : null;

    // Timing-safe comparison — only when both buffers are same length
    if (!incomingSig) {
      console.warn("[EasyPost Webhook] Missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const incomingBuf = Buffer.from(incomingSig, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");

    if (incomingBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(incomingBuf, expectedBuf)) {
      console.warn("[EasyPost Webhook] Invalid signature - potential security threat");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);
    console.log(`[EasyPost Webhook] Received event: ${data.result?.object}`);

    // Extract tracker data from webhook
    if (data.result?.object === "Tracker") {
      const tracker = data.result;
      const trackerId = tracker.id;

      // Find case with this tracker ID
      const caseData = await findCaseByTrackerId(trackerId);
      if (!caseData) {
        console.log(`[EasyPost Webhook] No case found for tracker ${trackerId}`);
        return NextResponse.json({ success: true, message: "No associated case" }, { status: 200 });
      }

      const journeyId = caseData.journey_id;

      // Idempotency: derive an event id (EasyPost includes `id` on webhook events; fall back to body hash)
      const eventId = data.id || data.event_id || `${trackerId}:${tracker.status}:${tracker.updated_at}` || crypto.createHash("sha256").update(body).digest("hex");

      try {
        const lastEvent = await db.getCaseDataByKeyDB(journeyId, "easypost_last_event_id");
        if (lastEvent && lastEvent.data_value === eventId) {
          console.log(`[EasyPost Webhook] Duplicate event ${eventId} for journey ${journeyId} — skipping`);
          return NextResponse.json({ success: true, message: "Duplicate event" }, { status: 200 });
        }
      } catch (err) {
        // Log and continue — idempotency check failing should not block processing
        console.error("[EasyPost Webhook] Idempotency check failed:", err);
      }

      // Status change detection: only update DB when status actually changes
      const existingStatusRow = await db.getCaseDataByKeyDB(journeyId, "tracking_status");
      const existingStatus = existingStatusRow?.data_value;
      const newStatus = tracker.status;

      if (existingStatus === newStatus) {
        // Still record last checked time and last event id to avoid reprocessing retries
        const now = new Date().toISOString();
        await Promise.all([
          db.upsertCaseDataDB(journeyId, "tracking_last_checked_at", {
            data_key: "tracking_last_checked_at",
            data_value: now,
            source: "external_api",
            source_reference: "easypost_webhook",
          }),
          db.upsertCaseDataDB(journeyId, "easypost_last_event_id", {
            data_key: "easypost_last_event_id",
            data_value: eventId,
            source: "external_api",
            source_reference: "easypost_webhook",
          }),
        ]);

        console.log(`[EasyPost Webhook] No status change for ${journeyId} (${newStatus}) — updated last-checked`);
        return NextResponse.json({ success: true, message: "No status change" }, { status: 200 });
      }

      // Status changed — perform updates
      const now = new Date().toISOString();

      const updates: Promise<any>[] = [];
      updates.push(
        db.upsertCaseDataDB(journeyId, "tracking_status", {
          data_key: "tracking_status",
          data_value: newStatus,
          source: "external_api",
          source_reference: "easypost_webhook",
        }),
      );

      updates.push(
        db.upsertCaseDataDB(journeyId, "tracking_last_checked_at", {
          data_key: "tracking_last_checked_at",
          data_value: now,
          source: "external_api",
          source_reference: "easypost_webhook",
        }),
      );

      // If delivered, save delivery timestamp
      if (newStatus === "delivered" && tracker.updated_at) {
        updates.push(
          db.upsertCaseDataDB(journeyId, "delivered_at", {
            data_key: "delivered_at",
            data_value: tracker.updated_at,
            source: "external_api",
            source_reference: "easypost_webhook",
          }),
        );
      }

      // Save last processed event id for idempotency
      updates.push(
        db.upsertCaseDataDB(journeyId, "easypost_last_event_id", {
          data_key: "easypost_last_event_id",
          data_value: eventId,
          source: "external_api",
          source_reference: "easypost_webhook",
        }),
      );

      await Promise.all(updates);

      console.log(`[EasyPost Webhook] Updated case ${journeyId} - Status: ${newStatus}`);
      // Supabase Realtime will automatically broadcast this DB change to all subscribers
    }

    return NextResponse.json({ success: true, message: "Webhook processed" }, { status: 200 });
  } catch (error) {
    console.error("[EasyPost Webhook] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Find case by EasyPost tracker ID
 * Queries case_data table to find which journey has this tracker
 */
async function findCaseByTrackerId(trackerId: string) {
  try {
    const supabase = await createClient();

    // Query case_data to find the journey with this tracker ID
    const { data, error } = await supabase
      .from("case_data")
      .select("journey_id")
      .eq("data_key", "easypost_tracker_id")
      .eq("data_value", trackerId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }

    return data; // Returns { journey_id: "xxx" }
  } catch (error) {
    console.error("[EasyPost Webhook] Error finding case:", error);
    return null;
  }
}
