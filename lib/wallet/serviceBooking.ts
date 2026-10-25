import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceCatalogItem } from "@/lib/wallet/resourceMapping";
import { topupAmountForDeficit } from "@/lib/wallet/launch";
import {
  triggerAppointmentNotification,
  triggerPCCNotification,
  triggerTranslationNotification,
  triggerConsultationNotification,
} from "@/lib/notifications";

/** The booking row each service charges for, and whether it has a draft flag. */
const SERVICE_BOOKING_TABLES: Record<string, { table: string; hasDraftFlag: boolean }> = {
  "book-medical-appointment": { table: "appointments", hasDraftFlag: true },
  "pcc-filing-service": { table: "police_verification_requests", hasDraftFlag: true },
  "book-a-consultation": { table: "consultation_bookings", hasDraftFlag: false },
  "document-translation": { table: "translation_documents", hasDraftFlag: false },
};

/** Payment states a booking can be charged from. */
const PAYABLE_STATUSES = new Set<string | null>([null, "pending", "failed"]);

export type ServiceBookingRequest = {
  serviceId: unknown;
  referenceId?: unknown;
  /** Accepted for compatibility; the key is derived from the booking id. */
  idempotencyKey?: unknown;
  metadata?: Record<string, unknown>;
};

export type ServiceBookingResult =
  | {
      status: 200;
      body: {
        success: true;
        transactionId: string | null;
        balance: number | null;
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
      status: 400 | 404 | 409 | 500;
      body: {
        success: false;
        error: string;
      };
    };

const fail = (status: 400 | 404 | 409 | 500, error: string): ServiceBookingResult => ({
  status,
  body: { success: false, error },
});

/**
 * Deduct wallet credits for one standalone service booking.
 * Unlike tools and guides, services are consumable per booking and NEVER grant
 * permanent unlock rows. Pricing is strictly authoritative from the server catalog.
 *
 * One charge per booking: the booking must be the caller's own unpaid row, the
 * idempotency key is derived from it (a retry after a lost response replays
 * instead of charging again), and the RPC refuses a second charge for the same
 * booking. The row is marked paid only after the charge, and a failed update is
 * reported (a retry replays the charge and finishes the update).
 *
 * Call with the service-role client ONLY after authenticating `userId`.
 */
export async function deductServiceBooking(
  supabase: SupabaseClient,
  userId: string,
  request: ServiceBookingRequest
): Promise<ServiceBookingResult> {
  if (typeof request.serviceId !== "string" || !request.serviceId.trim()) {
    return fail(400, "INVALID_SERVICE_ID");
  }

  const item = getServiceCatalogItem(request.serviceId);
  const target = item ? SERVICE_BOOKING_TABLES[item.resourceId] : undefined;
  if (!item || item.resourceType !== "service" || !target) {
    return fail(404, "UNKNOWN_SERVICE");
  }

  const referenceId =
    typeof request.referenceId === "string" && request.referenceId.trim().length > 0
      ? request.referenceId.trim()
      : null;
  if (!referenceId || referenceId.length > 100) {
    return fail(400, "REFERENCE_REQUIRED");
  }

  // The booking must exist, belong to the caller and still be unpaid.
  const columns = target.hasDraftFlag ? "id, payment_status, awaiting_payment" : "id, payment_status";
  const { data: booking, error: bookingError } = await supabase
    .from(target.table)
    .select(columns)
    .eq("id", referenceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (bookingError) {
    console.error(`[wallet] booking lookup failed for ${item.resourceId} (${referenceId}):`, bookingError);
    return fail(500, "DEDUCT_SERVICE_FAILED");
  }
  if (!booking) return fail(404, "BOOKING_NOT_FOUND");

  const row = booking as unknown as { payment_status: string | null; awaiting_payment?: boolean };
  if ((row.payment_status === "paid" || row.payment_status === "free") && row.awaiting_payment !== true) {
    // Already paid (an earlier attempt whose response was lost, or a journey row).
    return {
      status: 200,
      body: {
        success: true,
        transactionId: null,
        balance: null,
        serviceId: item.resourceId,
        referenceId,
        alreadyProcessed: true,
      },
    };
  }
  if (!PAYABLE_STATUSES.has(row.payment_status ?? null)) {
    return fail(409, "BOOKING_NOT_PAYABLE");
  }

  const clientMetadata =
    request.metadata && typeof request.metadata === "object" && !Array.isArray(request.metadata)
      ? request.metadata
      : undefined;

  const { data, error } = await supabase.rpc("deduct_service_credits_atomic", {
    p_user_id: userId,
    p_service_id: item.resourceId,
    p_credit_cost: item.credits,
    p_reference_id: referenceId,
    p_description: `${item.name} - Standalone Service Booking`,
    p_idempotency_key: `service_booking:${userId}:${item.resourceId}:${referenceId}`,
    p_metadata: {
      // Client fields are nested so they can never overwrite the server's.
      ...(clientMetadata ? { client: clientMetadata } : {}),
      source: "service_booking",
      catalog_credits: item.credits,
    },
  });

  if (error || !data) {
    console.error(`[wallet] deduct_service_credits_atomic failed for ${item.resourceId}:`, error);
    return fail(500, "DEDUCT_SERVICE_FAILED");
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
    return fail(500, "DEDUCT_SERVICE_FAILED");
  }

  // Charged (now or on an earlier attempt): reveal the booking as paid.
  const paidFields = target.hasDraftFlag
    ? { payment_status: "paid", awaiting_payment: false }
    : { payment_status: "paid" };
  const { data: updated, error: updateError } = await supabase
    .from(target.table)
    .update(paidFields)
    .eq("id", referenceId)
    .eq("user_id", userId)
    .select("id");
  if (updateError || !Array.isArray(updated) || updated.length === 0) {
    console.error(
      `[wallet] charged but could not mark ${item.resourceId} (${referenceId}) paid:`,
      updateError
    );
    return fail(500, "BOOKING_UPDATE_FAILED");
  }

  await notifyAdmins(supabase, item.resourceId, referenceId, userId);

  return {
    status: 200,
    body: {
      success: true,
      transactionId: data.transaction_id ?? null,
      balance: data.balance === undefined || data.balance === null ? null : Number(data.balance),
      serviceId: item.resourceId,
      referenceId,
      alreadyProcessed: data.already_processed === true,
    },
  };
}

/** Admins hear about a standalone booking only once it is paid. Never throws. */
async function notifyAdmins(
  supabase: SupabaseClient,
  serviceId: string,
  referenceId: string,
  userId: string
): Promise<void> {
  try {
    if (serviceId === "book-medical-appointment") {
      await triggerAppointmentNotification(referenceId);
    } else if (serviceId === "pcc-filing-service") {
      const { data: pccReq } = await supabase
        .from("police_verification_requests")
        .select("id, full_name, district, province, request_id")
        .eq("id", referenceId)
        .eq("user_id", userId)
        .maybeSingle();
      if (pccReq) {
        const locationParts = [pccReq.district, pccReq.province].filter(Boolean);
        const locationText = locationParts.length > 0 ? ` for ${locationParts.join(", ")}` : "";
        const refText = pccReq.request_id ? ` (${pccReq.request_id})` : "";
        const body = `${pccReq.full_name} has submitted a new Police Verification request${refText}${locationText}.`;
        await triggerPCCNotification(pccReq.id, undefined, pccReq.full_name, body);
      }
    } else if (serviceId === "book-a-consultation") {
      await triggerConsultationNotification(referenceId);
    } else if (serviceId === "document-translation") {
      await triggerTranslationNotification(referenceId);
    }
  } catch (notifErr) {
    console.error(`[wallet] Failed to notify admins for ${serviceId} (${referenceId}):`, notifErr);
  }
}
