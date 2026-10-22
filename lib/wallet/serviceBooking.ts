import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceCatalogItem } from "@/lib/wallet/resourceMapping";
import { topupAmountForDeficit } from "@/lib/wallet/launch";
import {
  triggerAppointmentNotification,
  triggerPCCNotification,
  triggerTranslationNotification,
  triggerConsultationNotification,
} from "@/lib/notifications";

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_:.-]{8,100}$/;

export type ServiceBookingRequest = {
  serviceId: unknown;
  referenceId?: unknown;
  idempotencyKey?: unknown;
  description?: unknown;
  metadata?: Record<string, unknown>;
};

export type ServiceBookingResult =
  | {
      status: 200;
      body: {
        success: true;
        transactionId: string | null;
        balance: number;
        serviceId: string;
        referenceId: string | null;
        alreadyProcessed: boolean;
      };
    }
  | {
      status: 402;
      body: {
        success: false;
        error: "INSUFFICIENT_CREDITS";
        required: number;
        available: number;
        deficit: number;
        topupAmount: number;
      };
    }
  | {
      status: 400 | 404 | 500;
      body: {
        success: false;
        error: string;
      };
    };

/**
 * Deduct wallet credits for a standalone service booking.
 * Unlike tools and guides, services are consumable per-booking and NEVER grant
 * permanent unlock rows. Pricing is strictly authoritative from the server catalog.
 *
 * Call with the service-role client ONLY after authenticating `userId`.
 */
export async function deductServiceBooking(
  supabase: SupabaseClient,
  userId: string,
  request: ServiceBookingRequest
): Promise<ServiceBookingResult> {
  if (typeof request.serviceId !== "string" || !request.serviceId.trim()) {
    return { status: 400, body: { success: false, error: "INVALID_SERVICE_ID" } };
  }

  const item = getServiceCatalogItem(request.serviceId);
  if (!item || item.resourceType !== "service") {
    return { status: 404, body: { success: false, error: "UNKNOWN_SERVICE" } };
  }

  let idempotencyKey: string | null = null;
  if (request.idempotencyKey !== undefined && request.idempotencyKey !== null) {
    if (typeof request.idempotencyKey !== "string" || !IDEMPOTENCY_KEY_RE.test(request.idempotencyKey)) {
      return { status: 400, body: { success: false, error: "INVALID_IDEMPOTENCY_KEY" } };
    }
    idempotencyKey = `service_booking:${userId}:${item.resourceId}:${request.idempotencyKey}`;
  }

  const referenceId =
    typeof request.referenceId === "string" && request.referenceId.trim().length > 0
      ? request.referenceId.trim()
      : null;

  const description =
    typeof request.description === "string" && request.description.trim().length > 0
      ? request.description.trim()
      : `${item.name} - Standalone Service Booking`;

  const { data, error } = await supabase.rpc("deduct_service_credits_atomic", {
    p_user_id: userId,
    p_service_id: item.resourceId,
    p_credit_cost: item.credits,
    p_reference_id: referenceId,
    p_description: description,
    p_idempotency_key: idempotencyKey,
    p_metadata: {
      source: "service_booking",
      catalog_credits: item.credits,
      ...(request.metadata && typeof request.metadata === "object" ? request.metadata : {}),
    },
  });

  if (error || !data) {
    console.error(`[wallet] deduct_service_credits_atomic failed for ${item.resourceId}:`, error);
    return { status: 500, body: { success: false, error: "DEDUCT_SERVICE_FAILED" } };
  }

  if (data.success === false) {
    if (data.error === "INSUFFICIENT_CREDITS") {
      const deficit = Number(data.deficit ?? item.credits);
      return {
        status: 402,
        body: {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          required: Number(data.required ?? item.credits),
          available: Number(data.available ?? 0),
          deficit,
          topupAmount: topupAmountForDeficit(deficit),
        },
      };
    }
    console.error(`[wallet] deduct_service_credits_atomic refused ${item.resourceId}:`, data);
    return { status: 500, body: { success: false, error: "DEDUCT_SERVICE_FAILED" } };
  }

    // Reveal and mark the service record as paid when referenceId is provided
    if (referenceId) {
      try {
        if (item.resourceId === "book-medical-appointment") {
          await supabase
            .from("appointments")
            .update({ payment_status: "paid", awaiting_payment: false })
            .eq("id", referenceId)
            .eq("user_id", userId);
          try {
            await triggerAppointmentNotification(referenceId);
          } catch (notifErr) {
            console.error("[wallet] Failed to trigger appointment notification:", notifErr);
          }
        } else if (item.resourceId === "pcc-filing-service") {
          await supabase
            .from("police_verification_requests")
            .update({ payment_status: "paid", awaiting_payment: false })
            .eq("id", referenceId)
            .eq("user_id", userId);
          try {
            const { data: pccReq } = await supabase
              .from("police_verification_requests")
              .select("id, full_name, district, province, request_id")
              .eq("id", referenceId)
              .maybeSingle();
            if (pccReq) {
              const locationParts = [pccReq.district, pccReq.province].filter(Boolean);
              const locationText = locationParts.length > 0 ? ` for ${locationParts.join(", ")}` : "";
              const refText = pccReq.request_id ? ` (${pccReq.request_id})` : "";
              const body = `${pccReq.full_name} has submitted a new Police Verification request${refText}${locationText}.`;
              await triggerPCCNotification(pccReq.id, undefined, pccReq.full_name, body);
            }
          } catch (notifErr) {
            console.error("[wallet] Failed to trigger PCC notification:", notifErr);
          }
        } else if (item.resourceId === "book-a-consultation") {
          await supabase
            .from("consultation_bookings")
            .update({ payment_status: "paid" })
            .eq("id", referenceId)
            .eq("user_id", userId);
          try {
            await triggerConsultationNotification(referenceId);
          } catch (notifErr) {
            console.error("[wallet] Failed to trigger consultation notification:", notifErr);
          }
        } else if (item.resourceId === "document-translation") {
          await supabase
            .from("translation_documents")
            .update({ payment_status: "paid" })
            .eq("id", referenceId)
            .eq("user_id", userId);
          try {
            await triggerTranslationNotification(referenceId);
          } catch (notifErr) {
            console.error("[wallet] Failed to trigger translation notification:", notifErr);
          }
        }
      } catch (tableErr) {
        console.error(`[wallet] Failed to update service record for ${item.resourceId} (${referenceId}):`, tableErr);
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        transactionId: data.transaction_id ?? null,
        balance: Number(data.balance ?? 0),
        serviceId: item.resourceId,
        referenceId: data.reference_id ?? referenceId,
        alreadyProcessed: data.already_processed === true,
      },
    };
}
