import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import * as db from "@/lib/journey/data-access";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from '@/lib/errors';

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
    const body = await request.text();
    const signature = request.headers.get("x-webhook-signature");

    // Verify webhook signature with EasyPost secret
    const webhookSecret = process.env.EASYPOST_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[EasyPost Webhook] EASYPOST_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn(
        "[EasyPost Webhook] Invalid signature - potential security threat",
      );
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
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
          return NextResponse.json(
            { success: true, message: msg(E.EASPOST_WEBHOOK_NO_CASE) },
            { status: 200 },
          );
      }

      const journeyId = caseData.journey_id;

      // Update case data with new tracking status
      const now = new Date().toISOString();
      await Promise.all([
        db.upsertCaseDataDB(journeyId, "tracking_status", {
          data_key: "tracking_status",
          data_value: tracker.status,
          source: "external_api",
          source_reference: "easypost_webhook",
        }),
        db.upsertCaseDataDB(journeyId, "tracking_last_checked_at", {
          data_key: "tracking_last_checked_at",
          data_value: now,
          source: "external_api",
          source_reference: "easypost_webhook",
        }),
      ]);

      // If delivered, save delivery timestamp
      if (tracker.status === "delivered" && tracker.updated_at) {
        await db.upsertCaseDataDB(journeyId, "delivered_at", {
          data_key: "delivered_at",
          data_value: tracker.updated_at,
          source: "external_api",
          source_reference: "easypost_webhook",
        });
      }

      console.log(
        `[EasyPost Webhook] Updated case ${journeyId} - Status: ${tracker.status}`,
      );
      // Supabase Realtime will automatically broadcast this DB change to all subscribers
    }

    return NextResponse.json(
      { success: true, message: "Webhook processed" },
      { status: 200 },
    );
    } catch (error) {
    console.error("[EasyPost Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: msg(E.EASPOST_WEBHOOK_PROCESS_FAILED) }, { status: 500 });
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
