// GET /api/v1/journeys/[journeyId]/portal-records/[portalRecordId]
// PATCH /api/v1/journeys/[journeyId]/portal-records/[portalRecordId]
// DELETE /api/v1/journeys/[journeyId]/portal-records/[portalRecordId]

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { UpdatePortalRecordBody } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// GET — Get single portal record by ID
// Also updates last_accessed_at (tracks when user last looked this up)
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; portalRecordId: string }> }
) {
  try {
    const { journeyId, portalRecordId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { data: portal, error } = await supabase
      .from('journey_portal_records')
      .select('*')
      .eq('id', portalRecordId)
      .eq('journey_id', journeyId)
      .single()

    if (error || !portal) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Portal record not found'),
        { status: 404 }
      )
    }

    // Update last_accessed_at (fire-and-forget — don't await)
    supabase
      .from('journey_portal_records')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', portalRecordId)
      .then(() => {}) // intentionally fire-and-forget
      .catch(() => {})

    return NextResponse.json(successResponse(portal), { status: 200 })
  } catch (err) {
    console.error('[GET /portal-records/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — Update portal record (change email, URL, case number)
// SECURITY: Password fields still rejected
// ─────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; portalRecordId: string }> }
) {
  try {
    const { journeyId, portalRecordId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const body: UpdatePortalRecordBody = await request.json()

    // SECURITY: Reject password fields even in PATCH
    const securityErrors = DataValidationService.noPasswordFields(body as unknown as Record<string, unknown>)
    if (securityErrors.length > 0) {
      return NextResponse.json(
        errorResponse('SECURITY_VIOLATION', securityErrors[0].issue),
        { status: 400 }
      )
    }

    const validationErrors = DataValidationService.updatePortalRecord(body)
    if (DataValidationService.hasErrors(validationErrors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', validationErrors),
        { status: 422 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.portal_name !== undefined)      updateData.portal_name = body.portal_name
    if (body.portal_url !== undefined)        updateData.portal_url = body.portal_url
    if (body.account_email !== undefined)     updateData.account_email = body.account_email
    if (body.account_username !== undefined)  updateData.account_username = body.account_username
    if (body.account_identifier !== undefined) updateData.account_identifier = body.account_identifier
    if (body.nvc_case_number !== undefined)   updateData.nvc_case_number = body.nvc_case_number
    if (body.nvc_invoice_id !== undefined)    updateData.nvc_invoice_id = body.nvc_invoice_id

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'No valid fields to update'),
        { status: 422 }
      )
    }

    const { data: portal, error } = await supabase
      .from('journey_portal_records')
      .update(updateData)
      .eq('id', portalRecordId)
      .eq('journey_id', journeyId)
      .select()
      .single()

    if (error || !portal) {
      console.error('[PATCH /portal-records/:id] DB error:', error)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Portal record not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse(portal, 'Portal record updated'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[PATCH /portal-records/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — Remove portal record
// ─────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; portalRecordId: string }> }
) {
  try {
    const { journeyId, portalRecordId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { error } = await supabase
      .from('journey_portal_records')
      .delete()
      .eq('id', portalRecordId)
      .eq('journey_id', journeyId)

    if (error) {
      console.error('[DELETE /portal-records/:id] DB error:', error)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Portal record not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse(null, 'Portal record removed'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[DELETE /portal-records/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
