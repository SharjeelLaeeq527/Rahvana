// ============================================================
// lib/notifications/UnifiedReminderEngine.ts
//
// Core engine that drives ALL journey reminders (Ch1, Ch2, Ch3).
// Reads from reminderRegistry — adding a new reminder = one config
// object in the registry, zero engine changes.
//
// Two main entry points:
//
//   scheduleForStep(journeyId, stepKey, completedAt?)
//     — Call when a journey step is marked complete.
//     — Schedules all reminders whose trigger.stepKey matches.
//
//   scheduleForMetadata(journeyId, metadataKey, metadataValue?, setAt?)
//     — Call when a metadata key is first set (e.g., dqDate, receiptNum).
//     — Schedules reminders triggered by metadata changes.
//
//   runSuppression(journeyId)
//     — Cancels any pending reminders whose suppress condition is now met.
//     — Called on every GET /reminders request.
//
// Delivery is handled by the cron job (recurringJobRunner).
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import {
  REMINDER_REGISTRY,
  getRemindersForStep,
  getRemindersForMetadataKey,
  type JourneyReminderDef,
  type SuppressCondition,
} from './reminderRegistry'

export class UnifiedReminderEngine {
  constructor(private supabase: SupabaseClient) {}

  // ─────────────────────────────────────────────────────────
  // PUBLIC: scheduleForStep
  // Schedules all reminders triggered by a step completion.
  // Safe to call multiple times — deduped by reminder_id+journey.
  // ─────────────────────────────────────────────────────────
  async scheduleForStep(
    journeyId: string,
    stepKey: string,
    completedAt?: Date
  ): Promise<void> {
    const reminders = getRemindersForStep(stepKey)
    if (reminders.length === 0) return
    const baseDate = completedAt ?? new Date()
    await this._scheduleAll(journeyId, reminders, baseDate)
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: scheduleForMetadata
  // Schedules reminders triggered by a metadata key being set.
  // For 'metadata_date_set' triggers, metadataValue must be an
  // ISO date string — fire_at is calculated as:
  //   appointmentDate + delayDays (negative = before the date)
  // ─────────────────────────────────────────────────────────
  async scheduleForMetadata(
    journeyId: string,
    metadataKey: string,
    metadataValue?: string,
    setAt?: Date
  ): Promise<void> {
    const baseDate = setAt ?? new Date()
    const candidates = getRemindersForMetadataKey(metadataKey).filter((r) => {
      if (r.trigger.type === 'metadata_key_value') {
        return metadataValue === (r.trigger as any).value
      }
      return true
    })
    if (candidates.length === 0) return

    for (const def of candidates) {
      // For date-based reminders, base is the appointment date itself
      if (def.trigger.type === 'metadata_date_set' && metadataValue) {
        const appointmentDate = new Date(metadataValue + 'T00:00:00')
        if (!isNaN(appointmentDate.getTime())) {
          await this._scheduleOne(journeyId, def, appointmentDate)
          continue
        }
      }
      await this._scheduleOne(journeyId, def, baseDate)
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: checkAndScheduleAll
  // Lazily checks all triggers on every GET /reminders.
  // For each unscheduled trigger that is now met, schedules it.
  // This is the "stateless on-demand" path for reminders that
  // are hard to hook via step completion events.
  // ─────────────────────────────────────────────────────────
  async checkAndScheduleAll(journeyId: string): Promise<void> {
    // Fetch journey metadata + completed steps in one call
    const [journeyResult, stepsResult] = await Promise.allSettled([
      this.supabase
        .from('journeys')
        .select('metadata')
        .eq('id', journeyId)
        .single(),
      this.supabase
        .from('journey_steps')
        .select('step_key, status, completed_at')
        .eq('journey_id', journeyId),
    ])

    const metadata: Record<string, unknown> =
      journeyResult.status === 'fulfilled'
        ? (journeyResult.value.data?.metadata as Record<string, unknown>) ?? {}
        : {}

    const completedSteps: Record<string, string | null> = {}
    if (stepsResult.status === 'fulfilled' && stepsResult.value.data) {
      for (const step of stepsResult.value.data) {
        if (step.status === 'completed') {
          completedSteps[step.step_key] = step.completed_at ?? null
        }
      }
    }

    // Get all reminder IDs already scheduled for this journey
    const { data: existing } = await this.supabase
      .from('ceac_scheduled_notifications')
      .select('reminder_id')
      .eq('journey_id', journeyId)
      .eq('reminder_origin', 'journey')
      .not('status', 'eq', 'cancelled')

    const scheduledIds = new Set((existing ?? []).map((r) => r.reminder_id))

    const toSchedule: Array<{ def: JourneyReminderDef; baseDate: Date }> = []

    for (const def of REMINDER_REGISTRY) {
      if (def.origin !== 'journey') continue
      if (scheduledIds.has(def.id)) continue // already scheduled

      let triggerMet = false
      let baseDate = new Date()

      if (def.trigger.type === 'step_completed') {
        const completedAt = completedSteps[(def.trigger as any).stepKey]
        if (completedAt !== undefined) {
          triggerMet = true
          baseDate = completedAt ? new Date(completedAt) : new Date()
        }
      } else if (def.trigger.type === 'metadata_key_exists') {
        if (metadata[(def.trigger as any).metadataKey] != null) {
          triggerMet = true
        }
      } else if (def.trigger.type === 'metadata_key_value') {
        if (String(metadata[(def.trigger as any).metadataKey]) === (def.trigger as any).value) {
          triggerMet = true
        }
      } else if (def.trigger.type === 'metadata_date_set') {
        const dateVal = metadata[(def.trigger as any).metadataKey]
        if (dateVal) {
          const apptDate = new Date(String(dateVal) + 'T00:00:00')
          if (!isNaN(apptDate.getTime())) {
            triggerMet = true
            baseDate = apptDate  // fire_at = appointmentDate + delayDays (negative = before)
          }
        }
      }

      if (triggerMet) {
        toSchedule.push({ def, baseDate })
      }
    }

    for (const { def, baseDate } of toSchedule) {
      await this._scheduleOne(journeyId, def, baseDate)
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: runSuppression
  // Cancels pending reminders whose suppress condition is now met.
  // Called on every GET /reminders to keep the queue clean.
  // ─────────────────────────────────────────────────────────
  async runSuppression(journeyId: string): Promise<void> {
    // Fetch all pending journey reminders for this journey
    const { data: pending } = await this.supabase
      .from('ceac_scheduled_notifications')
      .select('id, reminder_id')
      .eq('journey_id', journeyId)
      .eq('reminder_origin', 'journey')
      .eq('status', 'pending')

    if (!pending || pending.length === 0) return

    // Fetch journey state once
    const [journeyResult, stepsResult] = await Promise.allSettled([
      this.supabase
        .from('journeys')
        .select('metadata')
        .eq('id', journeyId)
        .single(),
      this.supabase
        .from('journey_steps')
        .select('step_key, status')
        .eq('journey_id', journeyId),
    ])

    const metadata: Record<string, unknown> =
      journeyResult.status === 'fulfilled'
        ? (journeyResult.value.data?.metadata as Record<string, unknown>) ?? {}
        : {}

    const completedStepKeys = new Set<string>()
    if (stepsResult.status === 'fulfilled' && stepsResult.value.data) {
      for (const step of stepsResult.value.data) {
        if (step.status === 'completed') completedStepKeys.add(step.step_key)
      }
    }

    const toCancel: string[] = []

    for (const row of pending) {
      const def = REMINDER_REGISTRY.find((r) => r.id === row.reminder_id)
      if (!def) continue

      if (this._isSuppressed(def.suppressWhen, metadata, completedStepKeys)) {
        toCancel.push(row.id)
      }
    }

    if (toCancel.length === 0) return

    await this.supabase
      .from('ceac_scheduled_notifications')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: 'suppress_condition_met',
      })
      .in('id', toCancel)
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────

  private async _scheduleAll(
    journeyId: string,
    defs: JourneyReminderDef[],
    baseDate: Date
  ): Promise<void> {
    for (const def of defs) {
      await this._scheduleOne(journeyId, def, baseDate)
    }
  }

  private async _scheduleOne(
    journeyId: string,
    def: JourneyReminderDef,
    baseDate: Date
  ): Promise<void> {
    // Dedup: don't re-schedule if a pending/sent row already exists
    const { data: existing } = await this.supabase
      .from('ceac_scheduled_notifications')
      .select('id')
      .eq('journey_id', journeyId)
      .eq('reminder_id', def.id)
      .in('status', ['pending', 'sent'])
      .limit(1)

    if (existing && existing.length > 0) return

    const fireAt = new Date(baseDate)
    fireAt.setDate(fireAt.getDate() + def.delayDays)

    await this.supabase.from('ceac_scheduled_notifications').insert({
      journey_id: journeyId,
      reminder_id: def.id,
      trigger_group: def.group,
      reminder_type: def.kind,
      title: def.title,
      message: def.body,
      channel: def.channels.includes('push_and_email') ? 'push_and_email' : 'push',
      fire_at: fireAt.toISOString(),
      status: 'pending',
      is_recurring: !!def.recurring,
      interval_days: def.recurring?.intervalDays ?? null,
      recurrence_count: 0,
      reminder_origin: 'journey',
      step_trigger_key:
        def.trigger.type === 'step_completed' ? def.trigger.stepKey : null,
    })
  }

  private _isSuppressed(
    condition: SuppressCondition,
    metadata: Record<string, unknown>,
    completedStepKeys: Set<string>
  ): boolean {
    switch (condition.type) {
      case 'never':
        return false
      case 'step_completed':
        return completedStepKeys.has(condition.stepKey)
      case 'metadata_key_exists':
        return metadata[condition.metadataKey] != null && metadata[condition.metadataKey] !== ''
      case 'metadata_key_value':
        return String(metadata[condition.metadataKey]) === condition.value
      case 'ceac_status_beyond':
        return false // handled by CeacReminderEngine suppression
      default:
        return false
    }
  }
}
