// ============================================================
// lib/ceac-tracking/types.ts
// All TypeScript types for the CEAC status notification system.
//
// Tracking starts only when user reports a status BEYOND 'at_nvc'.
// Progression: at_nvc → in_transit → ready → ap | issued | refused
// ============================================================

// ─────────────────────────────────────────────────────────────
// CEAC STATUS — mirrors ceac_status_value DB enum
// ─────────────────────────────────────────────────────────────

export type CeacStatus =
  | "at_nvc" // default — NVC sub-stages, tracking NOT active yet
  | "in_transit" // case heading to embassy
  | "ready" // embassy has file, interview upcoming
  | "ap" // administrative processing (post-interview)
  | "issued" // visa issued
  | "refused"; // refused — needs sub-type clarification

/** Which group a status belongs to (used for bulk cancellation) */
export type TriggerGroup = "in_transit" | "ready" | "ap" | "issued" | "refused";

/** Sub-type for 'refused' — only set after user clarifies */
export type RefusedSubType =
  | "pending_clarification" // user has NOT yet told us which type
  | "refusal_221g" // 221(g) — document request, case still active
  | "refusal_final"; // final denial under INA ground

// ─────────────────────────────────────────────────────────────
// REMINDER TYPES — the 4 delivery categories
// ─────────────────────────────────────────────────────────────

export type ReminderKind = "ACTION" | "URGENT" | "WAITING" | "FOLLOW-UP";

export type NotificationChannel = "push" | "push_and_email";

// ─────────────────────────────────────────────────────────────
// REMINDER CONFIG — shape of each of the 13 reminder definitions
// ─────────────────────────────────────────────────────────────

export interface ReminderConfig {
  /** Unique ID — matches reminder_id column in ceac_scheduled_notifications */
  id: string;
  /** Delivery category */
  kind: ReminderKind;
  /** Which status triggers this reminder */
  triggerStatus: CeacStatus;
  /** Which group this belongs to (used for bulk suppression) */
  triggerGroup: TriggerGroup;
  title: string;
  message: string;
  channel: NotificationChannel;

  // One-shot vs recurring
  recurring: false | { intervalDays: number };

  /**
   * How many days after the status is entered before this fires.
   * 0 = fire immediately on status entry.
   */
  delayDays: number;

  /**
   * Human-readable suppression rule (for documentation).
   * Actual suppression logic lives in suppressionEngine().
   */
  suppressIf: string;

  /**
   * For 'refused' sub-branch reminders (11, 12, 13):
   * which RefusedSubType must be confirmed before this fires.
   * undefined = fires without sub-type condition.
   */
  requiresRefusedSubType?: RefusedSubType;
}

// ─────────────────────────────────────────────────────────────
// DB ROW SHAPES
// ─────────────────────────────────────────────────────────────

/** Row in ceac_case_status table */
export interface CeacCaseStatus {
  id: string;
  journey_id: string;
  current_status: CeacStatus;
  refused_sub: RefusedSubType | null;
  status_entered_at: string; // ISO
  passport_received: boolean;
  passport_received_at: string | null; // ISO
  docs_221g_submitted: boolean;
  docs_221g_submitted_at: string | null; // ISO
  updated_at: string;
  created_at: string;
  status_history: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: CeacStatus;
  entered_at: string; // ISO
  set_by_user_id: string;
}

/** Row in ceac_scheduled_notifications table */
export interface CeacScheduledNotification {
  id: string;
  journey_id: string;
  reminder_id: string;
  trigger_group: TriggerGroup;
  reminder_type: ReminderKind;
  title: string;
  message: string;
  channel: NotificationChannel;
  fire_at: string; // ISO
  status: "pending" | "sent" | "cancelled" | "failed";
  is_recurring: boolean;
  interval_days: number | null;
  recurrence_count: number;
  sent_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// ENGINE INPUT / OUTPUT
// ─────────────────────────────────────────────────────────────

export interface ScheduleRemindersInput {
  journeyId: string;
  userId: string; // Supabase auth.uid() — for status_history
  newStatus: CeacStatus;
  previousStatus: CeacStatus | null;
  /** Only required when newStatus = 'refused' */
  refusedSubType?: RefusedSubType;
  /** Only required when reminder_id = 'refused_221g_followup' trigger */
  docs221gSubmittedAt?: string; // ISO
}

export interface SuppressionResult {
  cancelledCount: number;
  cancelledIds: string[];
}
