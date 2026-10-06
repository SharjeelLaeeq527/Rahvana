// lib/journey/toolModeGuards.ts
/**
 * A journey-scoped service (medical booking, PCC filing) may be re-opened only
 * until its booked date has passed. This keeps a journey to one active request
 * per service while still letting the user rebook after the date elapses.
 */
export type JourneyServiceRecord = {
  savedAt: string; // ISO timestamp when the request was created from the journey
  referenceDate?: string; // appointment / application date (YYYY-MM-DD) or ISO
  referenceId?: string; // appointmentId / policeVerificationId returned by the API
  /** Request lifecycle status (e.g. "requested", "received"). */
  status?: string;
  /** Booking city / filing district. */
  location?: string;
  /** Medical appointment time slot (e.g. "09:30 AM"). */
  timeSlot?: string;
  /** Date the PCC certificate was collected/marked received (YYYY-MM-DD). */
  receivedAt?: string;
};

/** True when an existing journey request is still "live" (date not yet passed). */
export function isJourneyRequestLocked(record?: JourneyServiceRecord | null): boolean {
  if (!record) return false;
  if (!record.referenceDate) return true; // no date known → stay locked until cleared
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(record.referenceDate);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() >= today.getTime(); // date is today or in the future → locked
}

/** Number of months a collected Police Character Certificate stays valid. */
export const PCC_VALIDITY_MONTHS = 6;

/**
 * PCC re-request lock. A journey keeps one active PCC application at a time:
 * - while the certificate is still pending (`status !== "received"`) it stays locked;
 * - once received, it stays locked for {@link PCC_VALIDITY_MONTHS} months from the
 *   received date (a PCC is valid for six months), then unlocks for a fresh application.
 */
export function isPccRequestLocked(record?: JourneyServiceRecord | null): boolean {
  if (!record) return false;
  if (record.status !== "received") return true; // application in progress → one active request
  const base = record.receivedAt || record.referenceDate;
  if (!base) return true; // received but no date known → stay locked
  const received = new Date(base);
  if (Number.isNaN(received.getTime())) return true;
  const expiry = new Date(received);
  expiry.setMonth(expiry.getMonth() + PCC_VALIDITY_MONTHS);
  return expiry.getTime() > Date.now();
}

/** ISO date (YYYY-MM-DD) on which a received PCC expires, or undefined if unknown. */
export function pccExpiryDate(record?: JourneyServiceRecord | null): string | undefined {
  if (!record || record.status !== "received") return undefined;
  const base = record.receivedAt || record.referenceDate;
  if (!base) return undefined;
  const received = new Date(base);
  if (Number.isNaN(received.getTime())) return undefined;
  const expiry = new Date(received);
  expiry.setMonth(expiry.getMonth() + PCC_VALIDITY_MONTHS);
  return expiry.toISOString().slice(0, 10);
}
