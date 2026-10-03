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
  /** Request lifecycle status (e.g. "requested"). */
  status?: string;
  /** Booking city / filing district. */
  location?: string;
  /** Medical appointment time slot (e.g. "09:30 AM"). */
  timeSlot?: string;
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
