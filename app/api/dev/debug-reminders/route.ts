// DEV ONLY — dumps exactly what UnifiedReminderEngine sees for a journey
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  const journeyId = req.nextUrl.searchParams.get('journeyId')
  if (!journeyId) return NextResponse.json({ error: 'journeyId required' }, { status: 400 })

  const supabase = getAdminClient()

  const [journeyRes, caseDataRes, stepsRes, scheduledRes, deliveredRes] = await Promise.all([
    supabase.from('journeys').select('*').eq('id', journeyId).single(),
    supabase.from('case_data').select('data_key, data_value, data_type').eq('journey_id', journeyId),
    supabase.from('journey_steps').select('step_key, status, completed_at').eq('journey_id', journeyId),
    supabase.from('ceac_scheduled_notifications').select('reminder_id, status, fire_at, reminder_origin').eq('journey_id', journeyId).order('fire_at'),
    supabase.from('journey_reminders').select('title, priority, is_dismissed, dedup_key, created_at').eq('journey_id', journeyId).order('created_at', { ascending: false }).limit(20),
  ])

  // Build metadata like the engine does
  const metadata: Record<string, unknown> = {
    ...(journeyRes.data?.metadata ?? {}),
  }
  for (const row of caseDataRes.data ?? []) {
    if (!row.data_key) continue
    try {
      metadata[row.data_key] = typeof row.data_value === 'string' && row.data_value.startsWith('"')
        ? JSON.parse(row.data_value)
        : row.data_value
    } catch { metadata[row.data_key] = row.data_value }
  }

  const completedSteps = (stepsRes.data ?? [])
    .filter((s: any) => s.status === 'completed')
    .map((s: any) => s.step_key)

  // Test insert to catch exact DB error
  const testInsert = await supabase.from('ceac_scheduled_notifications').insert({
    journey_id: journeyId,
    reminder_id: 'c3_s1_medical_day_before',
    trigger_group: 'c3_medical_countdown',
    reminder_type: 'URGENT',
    title: 'Medical test',
    message: 'Debug message',
    channel: 'push_and_email', // The potential culprit
    fire_at: new Date().toISOString(),
    status: 'pending',
    is_recurring: false,
    interval_days: null,
    recurrence_count: 0,
    reminder_origin: 'journey',
    step_trigger_key: 'step_3_1',
  })

  // Clean up test row
  if (!testInsert.error) {
    await supabase.from('ceac_scheduled_notifications')
      .delete().eq('journey_id', journeyId).eq('reminder_id', 'c3_s1_medical_day_before')
  }

  return NextResponse.json({
    journey: {
      id: journeyId,
      status: journeyRes.data?.status,
      hasMetadataColumn: !!journeyRes.data?.metadata,
    },
    metadata_keys: Object.keys(metadata),
    metadata_values: metadata,
    completed_steps: completedSteps,
    case_data_rows: caseDataRes.data?.length ?? 0,
    scheduled_notifications: scheduledRes.data ?? [],
    delivered_reminders: deliveredRes.data ?? [],
    test_insert: {
      success: !testInsert.error,
      error: testInsert.error?.message ?? null,
      error_code: testInsert.error?.code ?? null,
    },
    errors: {
      journey: journeyRes.error?.message,
      case_data: caseDataRes.error?.message,
      steps: stepsRes.error?.message,
    }
  })
}
