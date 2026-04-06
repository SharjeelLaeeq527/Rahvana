// GET /api/v1/journeys/[journeyId]/tool-sessions/[toolKey]
// PUT /api/v1/journeys/[journeyId]/tool-sessions/[toolKey]

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { SaveToolSessionBody } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// GET — Get saved session for a tool (resume flow)
// Returns null data if no session exists yet (not an error)
// ─────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; toolKey: string }> }
) {
  try {
    const { journeyId, toolKey } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const { searchParams } = new URL(request.url)
    const stepKey = searchParams.get('step_key')

    let query = supabase
      .from('tool_sessions')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('tool_key', toolKey)

    // If step_key provided, filter by it (in case same tool used in multiple steps)
    if (stepKey) {
      query = query.eq('step_key', stepKey)
    }

    const { data: sessions, error } = await query
      .order('last_saved_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[GET /tool-sessions/:toolKey] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to fetch tool session'),
        { status: 500 }
      )
    }

    const session = sessions && sessions.length > 0 ? sessions[0] : null

    return NextResponse.json(
      successResponse(session, session ? 'Session found' : 'No existing session'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[GET /tool-sessions/:toolKey] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PUT — Save / upsert tool session state
// Called frequently while user is working (every few seconds)
// MUST be idempotent — same result no matter how many times called
// Unique constraint: (journey_id, step_key, tool_key)
// ─────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; toolKey: string }> }
) {
  try {
    const { journeyId, toolKey } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const body: SaveToolSessionBody = await request.json()

    // Validate via DataValidationService
    const errors = DataValidationService.saveToolSession(body, toolKey)
    if (DataValidationService.hasErrors(errors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', errors),
        { status: 422 }
      )
    }

    // UPSERT on unique constraint (journey_id, step_key, tool_key)
    // last_saved_at is auto-updated by the DB trigger
    const { data: session, error } = await supabase
      .from('tool_sessions')
      .upsert(
        {
          journey_id: journeyId,
          step_key: body.step_key,
          tool_key: toolKey,
          session_state: body.session_state,
          completion_percentage: body.completion_percentage,
          is_completed: false,         // only /complete endpoint can set this
        },
        {
          onConflict: 'journey_id,step_key,tool_key',
          ignoreDuplicates: false,     // always update
        }
      )
      .select()
      .single()

    if (error) {
      console.error('[PUT /tool-sessions/:toolKey] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to save tool session'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(session, 'Session saved'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[PUT /tool-sessions/:toolKey] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
