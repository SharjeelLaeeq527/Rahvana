// POST /api/v1/journeys/[journeyId]/tool-sessions/[toolKey]/complete
// Marks a tool as fully complete and triggers step completion

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { CompleteToolSessionBody, ToolCompletionResponse } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// POST — Mark tool session as complete
//
// Flow:
//  1. Mark tool_sessions record as is_completed = true
//  2. Store tool_output (PDF URL, form data, sponsor structure, etc.)
//  3. Import ToolIntegrationService to handle downstream effects
//     (e.g. after Affidavit Calculator → update case_data.sponsorStructure)
//  4. Call Hammad's step completion (via internal API or service)
//  5. Return success + next step info
// ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; toolKey: string }> }
) {
  try {
    const { journeyId, toolKey } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const body: CompleteToolSessionBody = await request.json()

    // Validate via DataValidationService
    const errors = DataValidationService.completeToolSession(body)
    if (DataValidationService.hasErrors(errors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', errors),
        { status: 422 }
      )
    }

    // Find the existing session for this tool
    const { data: existingSession, error: findError } = await supabase
      .from('tool_sessions')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('tool_key', toolKey)
      .eq('is_completed', false)
      .order('last_saved_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !existingSession) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'No active tool session found for this tool. Start the tool first.'),
        { status: 404 }
      )
    }

    // Mark session as complete
    const { data: completedSession, error: updateError } = await supabase
      .from('tool_sessions')
      .update({
        is_completed: true,
        completion_percentage: 100,
        tool_output: body.tool_output,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existingSession.id)
      .select()
      .single()

    if (updateError || !completedSession) {
      console.error('[POST /complete] Update error:', updateError)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to mark tool as complete'),
        { status: 500 }
      )
    }

    // ─── Tool-specific post-completion side effects ───────────────────────
    // Affidavit Calculator: store sponsor structure in case_data
    if (toolKey === 'affidavit_calculator' && body.tool_output.sponsor_structure) {
      try {
        // Call Hammad's case-data API to store the sponsor structure
        // This ensures Hashir never writes directly to case_data table
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
        await fetch(`${baseUrl}/api/v1/journeys/${journeyId}/case-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_key: 'sponsor_structure',
            data_value: body.tool_output.sponsor_structure,
          }),
        })
      } catch (sideEffectErr) {
        // Log but don't fail the request — session is marked complete
        console.error('[POST /complete] Affidavit side effect failed:', sideEffectErr)
      }
    }

    // ─── Notify Hammad's StepCompletionEngine ────────────────────────────
    // TODO: Once Hammad exposes StepCompletionEngine, call it here:
    //
    // const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    // await fetch(`${baseUrl}/api/v1/steps/${completedSession.step_key}/complete`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ journey_id: journeyId, completion_source: 'tool' }),
    // })
    //
    // For now, this is a placeholder until Hammad's step API is ready.
    // ─────────────────────────────────────────────────────────────────────

    const response: ToolCompletionResponse = {
      success: true,
      message: `Tool '${toolKey}' completed successfully`,
      next_step_key: null,   // Will be populated once Hammad's engine is connected
    }

    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    console.error('[POST /complete] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
