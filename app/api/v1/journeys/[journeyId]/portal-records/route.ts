// GET /api/v1/journeys/[journeyId]/portal-records
// POST /api/v1/journeys/[journeyId]/portal-records

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { CreatePortalRecordBody } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// GET — List all saved portals for a journey (Portal Wallet display)
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> }
) {
  try {
    const { journeyId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { data: portals, error } = await supabase
      .from('journey_portal_records')
      .select('*')
      .eq('journey_id', journeyId)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('[GET /portal-records] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to fetch portal records'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(portals ?? [], undefined),
      { status: 200 }
    )
  } catch (err) {
    console.error('[GET /portal-records] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Save portal to wallet (upsert by portal_type)
// SECURITY: Any password field in body is rejected with 400
// ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> }
) {
  try {
    const { journeyId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const body: CreatePortalRecordBody = await request.json()

    // DataValidationService handles: password rejection, portal_type, URL, email, NVC-CEAC rule
    const securityErrors = DataValidationService.noPasswordFields(body as unknown as Record<string, unknown>)
    if (DataValidationService.hasErrors(securityErrors)) {
      return NextResponse.json(
        errorResponse('SECURITY_VIOLATION', securityErrors[0].issue),
        { status: 400 }
      )
    }

    const validationErrors = DataValidationService.createPortalRecord(body)
    if (DataValidationService.hasErrors(validationErrors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', validationErrors),
        { status: 422 }
      )
    }

    // UPSERT: one record per portal_type per journey
    const { data: portal, error } = await supabase
      .from('journey_portal_records')
      .upsert(
        {
          journey_id: journeyId,
          portal_type: body.portal_type,
          portal_name: body.portal_name ?? null,
          portal_url: body.portal_url ?? null,
          account_email: body.account_email ?? null,
          account_username: body.account_username ?? null,
          account_identifier: body.account_identifier ?? null,
          nvc_case_number: body.nvc_case_number ?? null,
          nvc_invoice_id: body.nvc_invoice_id ?? null,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'journey_id,portal_type', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) {
      console.error('[POST /portal-records] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to save portal record'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(portal, 'Portal saved to wallet'),
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /portal-records] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
