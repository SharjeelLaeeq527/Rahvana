// app/api/v1/journeys/[journeyId]/reminders/route.ts
// GET  → Auto-generate + fetch all active reminders for a journey
// PATCH is handled in [reminderId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse } from '@/lib/api/journey-auth'
import { ReminderEngine } from '@/lib/reminders/ReminderEngine'
import { REMINDER_PRIORITY_ORDER } from '@/lib/reminders/types'
import type { ReminderListResponse } from '@/lib/reminders/types'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

// ─────────────────────────────────────────────────────────────
// GET /api/v1/journeys/[journeyId]/reminders
// Returns all active (non-dismissed, non-snoozed) reminders.
// Also triggers ReminderEngine to detect + create any new ones.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId } = await params

    // Verify auth + journey ownership
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    // Step 1: Run the ReminderEngine to create/refresh reminders
    const engine = new ReminderEngine(supabase)
    await engine.generateReminders(journeyId)

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
