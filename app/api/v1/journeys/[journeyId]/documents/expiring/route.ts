// GET /api/v1/journeys/[journeyId]/documents/expiring
// Returns documents expiring within a configurable window (default: 30 days)
// Used by dashboard to surface "your police certificate expires in 12 days" alerts
//
// Query params:
//   ?days=30   (default 30 — how many days ahead to look)
//   ?required_only=true  (only include is_required documents)

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> }
) {
  try {
    const { journeyId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    // How many days ahead to look (default 30, max 365)
    const daysParam = parseInt(searchParams.get('days') ?? '30', 10)
    const days = isNaN(daysParam) || daysParam < 1 ? 30 : Math.min(daysParam, 365)
    const requiredOnly = searchParams.get('required_only') === 'true'

    // Window: now → now + days
    const now = new Date()
    const windowEnd = new Date(now)
    windowEnd.setDate(windowEnd.getDate() + days)

    let query = supabase
      .from('journey_documents')
      .select('*')
      .eq('journey_id', journeyId)
      .is('deleted_at', null)
      // Documents with expiry_date within the window
      .lte('expiry_date', windowEnd.toISOString())
      .gt('expiry_date', now.toISOString())           // not already expired
      .neq('status', 'rejected')
      .order('expiry_date', { ascending: true })       // soonest first

    if (requiredOnly) {
      query = query.eq('is_required', true)
    }

    const { data: expiringDocs, error } = await query

    if (error) {
      console.error('[GET /documents/expiring] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to fetch expiring documents'),
        { status: 500 }
      )
    }

    // Also get already-expired documents separately
    const { data: expiredDocs } = await supabase
      .from('journey_documents')
      .select('id, document_type, document_label, expiry_date, step_key, is_required')
      .eq('journey_id', journeyId)
      .is('deleted_at', null)
      .lte('expiry_date', now.toISOString())
      .eq('status', 'uploaded')        // uploaded but now expired
      .order('expiry_date', { ascending: false })

    return NextResponse.json(
      successResponse({
        expiring_soon: expiringDocs ?? [],
        already_expired: expiredDocs ?? [],
        expiring_count: (expiringDocs ?? []).length,
        expired_count: (expiredDocs ?? []).length,
        window_days: days,
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('[GET /documents/expiring] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
