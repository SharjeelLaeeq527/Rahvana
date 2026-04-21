// ============================================================
// lib/notifications/UnifiedReminderEngine.ts
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import {
  REMINDER_REGISTRY,
  getRemindersForStep,
  getRemindersForMetadataKey,
  getStepKey,
  getMetadataKey,
  getMetadataValue,
  getSuppressStepKey,
  getCeacGroups,
  type JourneyReminderDef,
  type SuppressCondition,
} from './reminderRegistry'

type JourneyState = {
  metadata: Record<string, unknown>
  completedStepKeys: Set<string>
  ceacStatus?: string | null
}

export class UnifiedReminderEngine {
  constructor(private supabase: SupabaseClient) {}

  // ─────────────────────────────────────────────────────────
  // PUBLIC: scheduleForStep
  // ─────────────────────────────────────────────────────────
  async scheduleForStep(journeyId: string, stepKey: string, completedAt?: Date): Promise<void> {
    const defs = getRemindersForStep(stepKey)
    if (defs.length === 0) return
    await this._scheduleBatch(journeyId, defs, completedAt ?? new Date())
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: scheduleForMetadata
  // ─────────────────────────────────────────────────────────
  async scheduleForMetadata(
    journeyId: string,
    metadataKey: string,
    metadataValue?: string,
    setAt?: Date
  ): Promise<void> {
    const baseDate = setAt ?? new Date()
<<<<<<< HEAD
    const candidates = getRemindersForMetadataKey(metadataKey).filter((r) => {
      if (r.trigger.type === 'metadata_key_value') {
        return metadataValue === getMetadataValue(r.trigger)
      }
      return true
    })
=======
    const candidates = getRemindersForMetadataKey(metadataKey)
>>>>>>> hashir-roadmap-journey-feature
    if (candidates.length === 0) return

    const dateBasedDefs: JourneyReminderDef[] = []
    const regularDefs: JourneyReminderDef[] = []

    for (const def of candidates) {
      if (def.trigger.type === 'metadata_date_set' && metadataValue) {
        const apptDate = new Date(metadataValue + 'T00:00:00')
        if (!isNaN(apptDate.getTime())) {
          dateBasedDefs.push(def)
          continue
        }
      }
      regularDefs.push(def)
    }

    if (regularDefs.length > 0) await this._scheduleBatch(journeyId, regularDefs, baseDate)

    for (const def of dateBasedDefs) {
      const apptDate = new Date((metadataValue as string) + 'T00:00:00')
      await this._scheduleOne(journeyId, def, apptDate)
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: checkAndScheduleAll
  // Lazily schedules + handles date-change detection.
  // ─────────────────────────────────────────────────────────
  async checkAndScheduleAll(journeyId: string): Promise<void> {
<<<<<<< HEAD
    const jState = await this._fetchJourneyState(journeyId)

    // Fetch existing scheduled rows (all non-cancelled)
=======
    const [journeyResult, caseDataResult, stepsResult] = await Promise.allSettled([
      this.supabase.from('journeys').select('metadata').eq('id', journeyId).single(),
      this.supabase.from('case_data').select('data_key, data_value').eq('journey_id', journeyId),
      this.supabase.from('journey_steps').select('step_key, status, completed_at').eq('journey_id', journeyId),
    ])

    // Merge journeys.metadata (admin fields) + case_data rows (user-saved fields)
    const metadata: Record<string, unknown> =
      journeyResult.status === 'fulfilled'
        ? { ...(journeyResult.value.data?.metadata as Record<string, unknown> ?? {}) }
        : {}

    if (caseDataResult.status === 'fulfilled' && caseDataResult.value.data) {
      for (const row of caseDataResult.value.data) {
        if (!row.data_key) continue
        try {
          metadata[row.data_key] = typeof row.data_value === 'string' && row.data_value.startsWith('"')
            ? JSON.parse(row.data_value)
            : row.data_value
        } catch { metadata[row.data_key] = row.data_value }
      }
    }

    const completedSteps: Record<string, string | null> = {}
    if (stepsResult.status === 'fulfilled' && stepsResult.value.data) {
      for (const step of stepsResult.value.data) {
        if (step.status === 'completed') {
          completedSteps[step.step_key] = step.completed_at ?? null
        }
      }
    }

    // Get all already-scheduled reminder rows (with fire_at for date-change detection)
>>>>>>> hashir-roadmap-journey-feature
    const { data: existing } = await this.supabase
      .from('ceac_scheduled_notifications')
      .select('id, reminder_id, fire_at, trigger_group, status')
      .eq('journey_id', journeyId)
      .eq('reminder_origin', 'journey')
      .not('status', 'eq', 'cancelled')

    const existingByReminderId = new Map<string, { id: string; fire_at: string; trigger_group: string; status: string }>()
    for (const row of existing ?? []) {
      existingByReminderId.set(row.reminder_id, row)
    }

    // Detect date-changes for metadata_date_set triggers
    // Group by group name — cancel + reschedule the whole group if date changed
    const groupsCancelledForDateChange = new Set<string>()

    for (const def of REMINDER_REGISTRY) {
      if (def.origin !== 'journey' || def.trigger.type !== 'metadata_date_set') continue
      const metaKey = getMetadataKey(def.trigger)
      if (!metaKey) continue
      const currentDateVal = String(jState.metadata[metaKey] ?? '')
      if (!currentDateVal || groupsCancelledForDateChange.has(def.group)) continue

      const existingRow = existingByReminderId.get(def.id)
      if (!existingRow) continue

      const currentBase = new Date(currentDateVal + 'T00:00:00')
      const expectedFireAt = new Date(currentBase)
      expectedFireAt.setDate(expectedFireAt.getDate() + def.delayDays)

      const storedFireAt = new Date(existingRow.fire_at)
      const diffMs = Math.abs(expectedFireAt.getTime() - storedFireAt.getTime())
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      if (diffDays > 1) {
        groupsCancelledForDateChange.add(def.group)

        // Cancel all pending/sent rows for this group
        const groupIds = (existing ?? [])
          .filter((r) => r.trigger_group === def.group && (r.status === 'pending' || r.status === 'sent'))
          .map((r) => r.id)

        if (groupIds.length > 0) {
          await this.supabase
            .from('ceac_scheduled_notifications')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'date_changed' })
            .in('id', groupIds)
        }

        // Dismiss delivered journey_reminders for this group (by trigger_group match)
        const groupReminderIds = REMINDER_REGISTRY
          .filter((r) => r.group === def.group)
          .map((r) => r.id)

        if (groupReminderIds.length > 0) {
          for (const rid of groupReminderIds) {
            await this.supabase
              .from('journey_reminders')
              .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
              .eq('journey_id', journeyId)
              .eq('is_dismissed', false)
              .like('dedup_key', `${journeyId}:journey:${rid}%`)
          }
        }

        // Remove from map so they get re-scheduled below
        for (const r of (existing ?? [])) {
          if (r.trigger_group === def.group) existingByReminderId.delete(r.reminder_id)
        }
      }
    }

    // Schedule unscheduled reminders
    const toSchedule: Array<{ def: JourneyReminderDef; baseDate: Date }> = []

    for (const def of REMINDER_REGISTRY) {
      if (def.origin !== 'journey') continue
      if (existingByReminderId.has(def.id)) continue

      const { met, baseDate } = this._isTriggerMet(def, jState)
      if (met) toSchedule.push({ def, baseDate })
    }

    for (const { def, baseDate } of toSchedule) {
      await this._scheduleOne(journeyId, def, baseDate)
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: runSuppression
  // 1. Cancels PENDING scheduled notifications
  // 2. Auto-dismisses DELIVERED journey_reminders (batched)
  // ─────────────────────────────────────────────────────────
  async runSuppression(journeyId: string): Promise<void> {
    const jState = await this._fetchJourneyState(journeyId)

    // Build list of all reminder IDs whose suppress condition is now met
    const suppressedIds = REMINDER_REGISTRY
      .filter((def) => def.origin === 'journey' && this._isSuppressed(def.suppressWhen, jState))
      .map((def) => def.id)

    if (suppressedIds.length === 0) return

    // 1. Cancel PENDING in queue (single batched query)
    await this.supabase
      .from('ceac_scheduled_notifications')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'suppress_condition_met' })
      .eq('journey_id', journeyId)
      .eq('reminder_origin', 'journey')
      .eq('status', 'pending')
      .in('reminder_id', suppressedIds)

    // 2. Auto-dismiss delivered journey_reminders (one query per ID — dedup_key is LIKE pattern)
    // Batch: fetch all matching IDs first, then dismiss in one .in() call
    const { data: toDissmiss } = await this.supabase
      .from('journey_reminders')
      .select('id')
      .eq('journey_id', journeyId)
      .eq('is_dismissed', false)
      .or(suppressedIds.map((rid) => `dedup_key.like.${journeyId}:journey:${rid}%`).join(','))

    if (toDissmiss && toDissmiss.length > 0) {
      await this.supabase
        .from('journey_reminders')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .in('id', toDissmiss.map((r) => r.id))
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE: _fetchJourneyState — single round-trip
  // ─────────────────────────────────────────────────────────
  private async _fetchJourneyState(journeyId: string): Promise<JourneyState> {
    const [journeyResult, stepsResult, ceacResult, caseDataResult] = await Promise.allSettled([
      this.supabase.from('journeys').select('metadata').eq('id', journeyId).single(),
      this.supabase.from('journey_steps').select('step_key, status, completed_at').eq('journey_id', journeyId),
      this.supabase.from('ceac_case_status').select('current_status').eq('journey_id', journeyId).single(),
      this.supabase.from('case_data').select('data_key, data_value').eq('journey_id', journeyId),
    ])

    const metadata: Record<string, unknown> =
      journeyResult.status === 'fulfilled'
        ? { ...((journeyResult.value.data?.metadata as Record<string, unknown>) ?? {}) }
        : {}

    if (caseDataResult.status === 'fulfilled' && caseDataResult.value?.data) {
      for (const row of caseDataResult.value.data) {
        if (!row.data_key) continue
        try {
          metadata[row.data_key] =
            typeof row.data_value === 'string' && row.data_value.startsWith('"')
              ? JSON.parse(row.data_value)
              : row.data_value
        } catch {
          metadata[row.data_key] = row.data_value
        }
      }
    }

    const completedStepKeys = new Set<string>()
    const completedStepDates: Record<string, string | null> = {}
    if (stepsResult.status === 'fulfilled' && stepsResult.value.data) {
      for (const step of stepsResult.value.data) {
        if (step.status === 'completed') {
          completedStepKeys.add(step.step_key)
          completedStepDates[step.step_key] = step.completed_at ?? null
        }
      }
    }

    const ceacStatus =
      ceacResult.status === 'fulfilled' ? ceacResult.value.data?.current_status ?? null : null

    return { metadata, completedStepKeys, ceacStatus }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE: _isTriggerMet — type-safe, no `as any`
  // ─────────────────────────────────────────────────────────
  private _isTriggerMet(def: JourneyReminderDef, state: JourneyState): { met: boolean; baseDate: Date } {
    const t = def.trigger
    const now = new Date()

    if (t.type === 'step_completed') {
      const key = getStepKey(t)!
      if (state.completedStepKeys.has(key)) return { met: true, baseDate: now }
      return { met: false, baseDate: now }
    }

    if (t.type === 'metadata_key_exists') {
      const key = getMetadataKey(t)!
      const val = state.metadata[key]
      return { met: val != null && val !== '', baseDate: now }
    }

    if (t.type === 'metadata_key_value') {
      const key = getMetadataKey(t)!
      const expected = getMetadataValue(t)!
      return { met: String(state.metadata[key] ?? '') === expected, baseDate: now }
    }

    if (t.type === 'metadata_date_set') {
      const key = getMetadataKey(t)!
      const dateVal = state.metadata[key]
      if (!dateVal) return { met: false, baseDate: now }
      const apptDate = new Date(String(dateVal) + 'T00:00:00')
      if (isNaN(apptDate.getTime())) return { met: false, baseDate: now }
      return { met: true, baseDate: apptDate }
    }

    return { met: false, baseDate: now }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE: _isSuppressed — type-safe, handles all variants
  // ─────────────────────────────────────────────────────────
  private _isSuppressed(condition: SuppressCondition, state: JourneyState): boolean {
    switch (condition.type) {
      case 'never':
        return false

      case 'step_completed': {
        const key = getSuppressStepKey(condition)!
        return state.completedStepKeys.has(key)
      }

      case 'metadata_key_exists': {
        const key = getMetadataKey(condition)!
        const val = state.metadata[key]
        return val != null && val !== ''
      }

      case 'metadata_key_value': {
        const key = getMetadataKey(condition)!
        const expected = getMetadataValue(condition)!
        return String(state.metadata[key] ?? '') === expected
      }

      case 'ceac_status_beyond': {
        const groups = getCeacGroups(condition)
        if (!state.ceacStatus) return false
        const STATUS_ORDER = ['at_nvc', 'in_transit', 'ready', 'ap', 'issued', 'refused']
        const currentIdx = STATUS_ORDER.indexOf(state.ceacStatus)
        return groups.some((g) => {
          const groupIdx = STATUS_ORDER.indexOf(g)
          return groupIdx !== -1 && currentIdx > groupIdx
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE: _scheduleBatch — single bulk insert, dedup-safe
  // ─────────────────────────────────────────────────────────
  private async _scheduleBatch(
    journeyId: string,
    defs: JourneyReminderDef[],
    baseDate: Date
  ): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Fetch existing in one call
    const { data: existing } = await this.supabase
      .from('ceac_scheduled_notifications')
      .select('reminder_id')
      .eq('journey_id', journeyId)
      .in('reminder_id', defs.map((d) => d.id))
      .in('status', ['pending', 'sent'])

    const alreadyScheduled = new Set((existing ?? []).map((r) => r.reminder_id))

    const rows = defs
      .filter((def) => !alreadyScheduled.has(def.id))
      .map((def) => {
        const fireAt = new Date(baseDate)
        fireAt.setDate(fireAt.getDate() + def.delayDays)
        return { def, fireAt }
      })
      .filter(({ fireAt }) => fireAt >= oneDayAgo)
      .map(({ def, fireAt }) => ({
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
        step_trigger_key: def.trigger.type === 'step_completed' ? getStepKey(def.trigger) : null,
      }))

    if (rows.length > 0) {
      await this.supabase.from('ceac_scheduled_notifications').insert(rows)
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE: _scheduleOne — for date-based reminders where
  // each has a different baseDate (appointment date)
  // ─────────────────────────────────────────────────────────
  private async _scheduleOne(
    journeyId: string,
    def: JourneyReminderDef,
    baseDate: Date
  ): Promise<void> {
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

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (fireAt < oneDayAgo) return

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
      step_trigger_key: def.trigger.type === 'step_completed' ? getStepKey(def.trigger) : null,
    })
  }
}
