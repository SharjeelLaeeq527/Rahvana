// app/api/v1/journeys/[journeyId]/reminders/route.ts
// GET  → Auto-generate + fetch all active reminders for a journey
// PATCH is handled in [reminderId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse } from '@/lib/api/journey-auth'
import { ReminderEngine } from '@/lib/reminders/ReminderEngine'
import { UnifiedReminderEngine } from '@/lib/notifications/UnifiedReminderEngine'
import { REMINDER_PRIORITY_ORDER } from '@/lib/reminders/types'
import { getReminderById } from '@/lib/notifications/reminderRegistry'
import type { ReminderListResponse } from '@/lib/reminders/types'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ─────────────────────────────────────────────────────────────
// GET /api/v1/journeys/[journeyId]/reminders
// Returns all active (non-dismissed, non-snoozed) reminders.
// Also triggers ReminderEngine to detect + create any new ones.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId } = await params

    // Verify auth + journey ownership (uses user client)
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    // Create service role client for background inserts/updates
    const adminSupabase = getAdminClient()

    // Step 1a: Stateless condition-based reminders (documents, fees, etc.)
    const engine = new ReminderEngine(adminSupabase)
    await engine.generateReminders(journeyId)

    // Step 1b: Unified registry — schedule + suppress
    const unified = new UnifiedReminderEngine(adminSupabase)
    await unified.checkAndScheduleAll(journeyId)
    await unified.runSuppression(journeyId)

    // Step 1c: Immediately deliver any DUE scheduled notifications for this journey
    // so user sees them without waiting for the cron job (6-hour delay).
    const nowIso = new Date().toISOString()
    const { data: dueNow } = await adminSupabase
      .from('ceac_scheduled_notifications')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('reminder_origin', 'journey')
      .eq('status', 'pending')
      .lte('fire_at', nowIso)
      .limit(20)

    for (const notif of dueNow ?? []) {
      const def = getReminderById(notif.reminder_id)
      const priority = notif.reminder_type === 'URGENT' || notif.reminder_type === 'ACTION'
        ? (def?.priority ?? 'high') : (def?.priority ?? 'normal')

      await adminSupabase.from('journey_reminders').upsert({
        journey_id: journeyId,
        reminder_type: 'step_pending_too_long',
        priority,
        title: notif.title,
        body: notif.message,
        step_key: notif.step_trigger_key ?? null,
        action_url: def?.actionUrl ?? null,
        action_label: def?.actionLabel ?? null,
        is_dismissed: false,
        dedup_key: `${journeyId}:journey:${notif.reminder_id}:${notif.recurrence_count}:${notif.id}`,
      }, { onConflict: 'dedup_key', ignoreDuplicates: true })

      await adminSupabase.from('ceac_scheduled_notifications')
        .update({ status: 'sent', sent_at: nowIso })
        .eq('id', notif.id)
    }

    // Step 2: Fetch all active reminders (not dismissed, not snoozed)
    const now = new Date().toISOString()

    const { data: reminders, error } = await supabase
      .from('journey_reminders')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('is_dismissed', false)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /reminders] DB fetch error:', error)
      return NextResponse.json(
        errorResponse('SERVER_ERROR', 'Failed to fetch reminders'),
        { status: 500 }
      )
    }

    // Step 3: Sort by priority (critical → high → normal → low)
    const sorted = (reminders ?? []).sort((a, b) => {
      const pa = REMINDER_PRIORITY_ORDER[a.priority as keyof typeof REMINDER_PRIORITY_ORDER] ?? 99
      const pb = REMINDER_PRIORITY_ORDER[b.priority as keyof typeof REMINDER_PRIORITY_ORDER] ?? 99
      return pa - pb
    })

    const response: ReminderListResponse = {
      success: true,
      reminders: sorted,
      total: sorted.length,
      critical_count: sorted.filter(r => r.priority === 'critical').length,
      high_count: sorted.filter(r => r.priority === 'high').length,
    }

    return NextResponse.json(response, { status: 200 })

  } catch (err) {
    console.error('[GET /reminders] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('SERVER_ERROR', err instanceof Error ? err.message : 'Unexpected error'),
      { status: 500 }
    )
  }
}
