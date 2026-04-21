// app/api/v1/journeys/[journeyId]/reminders/[reminderId]/route.ts
// PATCH → Dismiss or snooze a specific reminder

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import type { UpdateReminderBody, ReminderUpdateResponse } from '@/lib/reminders/types'

interface RouteParams {
  params: Promise<{ journeyId: string; reminderId: string }>
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/journeys/[journeyId]/reminders/[reminderId]
// Body: { action: 'dismiss' } | { action: 'snooze', snooze_days: 1|3|7 }
// ─────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId, reminderId } = await params

    // Verify auth + ownership
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    // Parse body
    const body: UpdateReminderBody = await request.json()

    if (!body.action || !['dismiss', 'snooze'].includes(body.action)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'action must be "dismiss" or "snooze"'),
        { status: 400 }
      )
    }

    if (body.action === 'snooze') {
      if (!body.snooze_days || ![1, 3, 7, 14].includes(body.snooze_days)) {
        return NextResponse.json(
          errorResponse('VALIDATION_ERROR', 'snooze_days must be 1, 3, 7, or 14'),
          { status: 400 }
        )
      }
    }

    // Verify reminder belongs to this journey
    const { data: existing, error: fetchError } = await supabase
      .from('journey_reminders')
      .select('id, journey_id, is_dismissed')
      .eq('id', reminderId)
      .eq('journey_id', journeyId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Reminder not found'),
        { status: 404 }
      )
    }

    // Build update payload
    const updates: Record<string, unknown> = {}

    if (body.action === 'dismiss') {
      updates.is_dismissed = true
      updates.dismissed_at = new Date().toISOString()
      // Clear any snooze when permanently dismissing
      updates.snoozed_until = null
    } else if (body.action === 'snooze') {
      const snoozeUntil = new Date()
      snoozeUntil.setDate(snoozeUntil.getDate() + body.snooze_days!)
      updates.snoozed_until = snoozeUntil.toISOString()
    }

    // Apply update
    const { data: updated, error: updateError } = await supabase
      .from('journey_reminders')
      .update(updates)
      .eq('id', reminderId)
      .select('*')
      .single()

    if (updateError || !updated) {
      console.error('[PATCH /reminders/:id] Update error:', updateError)
      return NextResponse.json(
        errorResponse('SERVER_ERROR', 'Failed to update reminder'),
        { status: 500 }
      )
    }

    const message =
      body.action === 'dismiss'
        ? 'Reminder dismissed'
        : `Reminder snoozed for ${body.snooze_days} day${body.snooze_days !== 1 ? 's' : ''}`

    const response: ReminderUpdateResponse = {
      success: true,
      message,
      reminder: updated,
    }

    return NextResponse.json(response, { status: 200 })

  } catch (err) {
    console.error('[PATCH /reminders/:id] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('SERVER_ERROR', err instanceof Error ? err.message : 'Unexpected error'),
      { status: 500 }
    )
  }
}
