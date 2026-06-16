// ============================================================
// lib/ceac-tracking/CeacReminderEngine.ts
//
// Core engine. Three public methods:
//   scheduleReminders(input)  — cancels old group + schedules new reminders
//   suppressionEngine(journeyId) — cancels any reminders no longer valid
//   updateRefusedSubType(...)    — fires 11/12 or 13 after user clarifies
//
// Usage from API route:
//   const engine = new CeacReminderEngine(supabaseAdminClient)
//   await engine.scheduleReminders({ journeyId, userId, newStatus, previousStatus })
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { REMINDERS, getRemindersForStatus } from "./reminderConfig";
import { getGroupsToCancel, isTrackingActive, isValidTransition } from "./stateMachine";
import type {
  CeacStatus,
  ReminderConfig,
  RefusedSubType,
  ScheduleRemindersInput,
  SuppressionResult,
  CeacCaseStatus,
} from "./types";

export class CeacReminderEngine {
  constructor(private supabase: SupabaseClient) {}

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: scheduleReminders
  // Called when user reports a new CEAC status.
  // 1. Validates the transition
  // 2. Updates ceac_case_status row
  // 3. Cancels all pending reminders from now-obsolete groups
  // 4. Schedules new reminders for the entered status
  // 5. For 'refused': fires Reminder 10 immediately, prompts for sub-type
  //    (Reminders 11/12/13 are held until updateRefusedSubType is called)
  // ─────────────────────────────────────────────────────────────

  async scheduleReminders(input: ScheduleRemindersInput): Promise<void> {
    const { journeyId, userId, newStatus, previousStatus } = input;

    // Tracking starts only past at_nvc
    if (!isTrackingActive(newStatus)) return;

    // Validate transition
    if (!isValidTransition(previousStatus, newStatus)) {
      throw new Error(`Invalid CEAC transition: ${previousStatus ?? "null"} → ${newStatus}`);
    }

    // ── Step 1: Update / upsert the ceac_case_status row ──────
    await this._upsertCaseStatus(input);

    // ── Step 2: Cancel reminders from now-obsolete groups ─────
    const groupsToCancel = getGroupsToCancel(newStatus);
    if (groupsToCancel.length > 0) {
      await this._cancelGroupReminders(
        journeyId,
        groupsToCancel,
        `status_advanced_to_${newStatus}`
      );
    }

    // ── Step 3: Schedule new reminders for the entered status ──
    const remindersToSchedule = getRemindersForStatus(newStatus);

    for (const reminder of remindersToSchedule) {
      // Group 5 (refused) sub-type reminders (11, 12, 13) are held here.
      // Reminder 10 fires immediately for all refusals.
      // 11, 12, 13 only fire AFTER updateRefusedSubType() is called.
      if (reminder.requiresRefusedSubType) {
        // Only schedule now if sub-type was provided with this call
        if (input.refusedSubType !== reminder.requiresRefusedSubType) {
          continue; // hold — will be scheduled in updateRefusedSubType()
        }
      }

      await this._scheduleOne(journeyId, reminder, new Date());
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: updateRefusedSubType
  // Called when user tells us whether their refusal is 221(g) or final.
  // Global Rule 8: "do NOT auto-assume 221(g) or final."
  // This fires either:
  //   - Reminder 11 + schedules Reminder 12 (221g path)
  //   - Reminder 13 (final denial path)
  // ─────────────────────────────────────────────────────────────

  async updateRefusedSubType(
    journeyId: string,
    subType: Exclude<RefusedSubType, "pending_clarification">
  ): Promise<void> {
    // Update the sub-type in the status row
    await this.supabase
      .from("ceac_case_status")
      .update({ refused_sub: subType, updated_at: new Date().toISOString() })
      .eq("journey_id", journeyId);

    // Get current status row to check status_entered_at
    const { data: statusRow } = (await this.supabase
      .from("ceac_case_status")
      .select("status_entered_at, current_status")
      .eq("journey_id", journeyId)
      .single()) as { data: CeacCaseStatus | null };

    if (!statusRow || statusRow.current_status !== "refused") return;

    const enteredAt = new Date(statusRow.status_entered_at);

    // Fire reminders that match this sub-type
    const subTypeReminders = REMINDERS.filter(
      (r) => r.triggerStatus === "refused" && r.requiresRefusedSubType === subType
    );

    for (const reminder of subTypeReminders) {
      await this._scheduleOne(journeyId, reminder, enteredAt);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: mark221gDocsSubmitted
  // Called when user records that they submitted 221(g) documents.
  // Reminder 12 recurring clock starts from docs_submitted_at,
  // NOT from status_entered_at.
  // ─────────────────────────────────────────────────────────────

  async mark221gDocsSubmitted(journeyId: string): Promise<void> {
    const now = new Date();

    await this.supabase
      .from("ceac_case_status")
      .update({
        docs_221g_submitted: true,
        docs_221g_submitted_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("journey_id", journeyId);

    // Cancel any existing pending Reminder 12 (may have been scheduled at wrong time)
    await this.supabase
      .from("ceac_scheduled_notifications")
      .update({
        status: "cancelled",
        cancel_reason: "docs_submitted_rescheduled",
        cancelled_at: now.toISOString(),
      })
      .eq("journey_id", journeyId)
      .eq("reminder_id", "refused_221g_followup")
      .eq("status", "pending");

    // Re-schedule Reminder 12 from the correct base date (now = docs submitted)
    const reminder12 = REMINDERS.find((r) => r.id === "refused_221g_followup")!;
    await this._scheduleOne(journeyId, reminder12, now);
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: markPassportReceived
  // Suppresses Reminder 9 (issued_courier_followup) if not yet sent.
  // ─────────────────────────────────────────────────────────────

  async markPassportReceived(journeyId: string): Promise<void> {
    const now = new Date().toISOString();

    await this.supabase
      .from("ceac_case_status")
      .update({ passport_received: true, passport_received_at: now, updated_at: now })
      .eq("journey_id", journeyId);

    // Cancel Reminder 9 if it hasn't fired yet
    await this.supabase
      .from("ceac_scheduled_notifications")
      .update({ status: "cancelled", cancel_reason: "passport_received", cancelled_at: now })
      .eq("journey_id", journeyId)
      .eq("reminder_id", "issued_courier_followup")
      .eq("status", "pending");
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: suppressionEngine
  // Runs on every status update to cancel any reminders that
  // should no longer fire based on current state.
  // Also callable independently (e.g. from a cron check).
  // ─────────────────────────────────────────────────────────────

  async suppressionEngine(journeyId: string): Promise<SuppressionResult> {
    const now = new Date().toISOString();
    const cancelledIds: string[] = [];

    // Fetch current case status
    const { data: statusRow } = (await this.supabase
      .from("ceac_case_status")
      .select("current_status, refused_sub, passport_received, docs_221g_submitted")
      .eq("journey_id", journeyId)
      .single()) as { data: CeacCaseStatus | null };

    if (!statusRow) return { cancelledCount: 0, cancelledIds: [] };

    const { current_status, refused_sub, passport_received } = statusRow;

    // Fetch all pending notifications for this journey
    const { data: pending } = await this.supabase
      .from("ceac_scheduled_notifications")
      .select("id, reminder_id, trigger_group")
      .eq("journey_id", journeyId)
      .eq("status", "pending");

    if (!pending || pending.length === 0) return { cancelledCount: 0, cancelledIds: [] };

    const toCancel: { id: string; reason: string }[] = [];

    for (const notif of pending) {
      let reason: string | null = null;

      // Rule 1: Cancel groups that are superseded by current status
      const groupsToCancel = getGroupsToCancel(current_status);
      if (groupsToCancel.includes(notif.trigger_group as any)) {
        reason = `status_advanced_to_${current_status}`;
      }

      // Rule 2: Reminder 9 (courier followup) cancelled once passport received
      if (notif.reminder_id === "issued_courier_followup" && passport_received) {
        reason = "passport_received";
      }

      // Rule 3: AP group reminders cancelled if user left AP
      if (
        notif.trigger_group === "ap" &&
        (current_status === "issued" || current_status === "refused")
      ) {
        reason = `left_ap_to_${current_status}`;
      }

      // Rule 4: Refused sub-branch reminders only valid for their sub-type
      if (notif.trigger_group === "refused") {
        const config = REMINDERS.find((r) => r.id === notif.reminder_id);
        if (config?.requiresRefusedSubType) {
          // Cancel if user confirmed a DIFFERENT sub-type
          if (
            refused_sub &&
            refused_sub !== "pending_clarification" &&
            refused_sub !== config.requiresRefusedSubType
          ) {
            reason = `wrong_refused_subtype_${refused_sub}`;
          }
        }
      }

      if (reason) {
        toCancel.push({ id: notif.id, reason });
        cancelledIds.push(notif.id);
      }
    }

    // Bulk cancel
    if (toCancel.length > 0) {
      // Group by reason to minimise queries
      const byReason = toCancel.reduce<Record<string, string[]>>((acc, item) => {
        (acc[item.reason] ||= []).push(item.id);
        return acc;
      }, {});

      for (const [reason, ids] of Object.entries(byReason)) {
        await this.supabase
          .from("ceac_scheduled_notifications")
          .update({ status: "cancelled", cancel_reason: reason, cancelled_at: now })
          .in("id", ids);
      }
    }

    return { cancelledCount: toCancel.length, cancelledIds };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /** Insert a single notification row with the correct fire_at timestamp */
  private async _scheduleOne(
    journeyId: string,
    reminder: ReminderConfig,
    baseDate: Date
  ): Promise<void> {
    // Avoid duplicate pending rows for the same reminder on this journey
    const { data: existing } = await this.supabase
      .from("ceac_scheduled_notifications")
      .select("id")
      .eq("journey_id", journeyId)
      .eq("reminder_id", reminder.id)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) return; // already scheduled

    const fireAt = new Date(baseDate);
    fireAt.setDate(fireAt.getDate() + reminder.delayDays);

    await this.supabase.from("ceac_scheduled_notifications").insert({
      journey_id: journeyId,
      reminder_id: reminder.id,
      trigger_group: reminder.triggerGroup,
      reminder_type: reminder.kind,
      title: reminder.title,
      message: reminder.message,
      channel: reminder.channel === "push_and_email" ? "push_and_email" : "push",
      fire_at: fireAt.toISOString(),
      status: "pending",
      is_recurring: !!reminder.recurring,
      interval_days: reminder.recurring
        ? (reminder.recurring as { intervalDays: number }).intervalDays
        : null,
      recurrence_count: 0,
    });
  }

  /** Cancel all pending notifications belonging to the given trigger groups */
  private async _cancelGroupReminders(
    journeyId: string,
    groups: string[],
    reason: string
  ): Promise<void> {
    if (groups.length === 0) return;
    const now = new Date().toISOString();
    await this.supabase
      .from("ceac_scheduled_notifications")
      .update({ status: "cancelled", cancel_reason: reason, cancelled_at: now })
      .eq("journey_id", journeyId)
      .in("trigger_group", groups)
      .eq("status", "pending");
  }

  /** Upsert the ceac_case_status row and append history entry */
  private async _upsertCaseStatus(input: ScheduleRemindersInput): Promise<void> {
    const { journeyId, userId, newStatus, refusedSubType } = input;
    const now = new Date().toISOString();

    // Fetch existing to append history
    const { data: existing } = await this.supabase
      .from("ceac_case_status")
      .select("status_history")
      .eq("journey_id", journeyId)
      .single();

    const history: any[] = existing?.status_history ?? [];
    history.push({ status: newStatus, entered_at: now, set_by_user_id: userId });

    await this.supabase.from("ceac_case_status").upsert(
      {
        journey_id: journeyId,
        current_status: newStatus,
        refused_sub: newStatus === "refused" ? (refusedSubType ?? "pending_clarification") : null,
        status_entered_at: now,
        updated_at: now,
        status_history: history,
      },
      { onConflict: "journey_id" }
    );
  }
}
