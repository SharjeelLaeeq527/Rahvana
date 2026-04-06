// GET /api/v1/journeys/[journeyId]/documents
// POST /api/v1/journeys/[journeyId]/documents

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type {
  CreateJourneyDocumentBody,
  DocumentListResponse,
  DocumentStatus,
} from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// GET — List all documents for a journey
// Query params: ?status=uploaded&step_key=I.2
// ─────────────────────────────────────────────────────────────

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
    const statusFilter = searchParams.get('status') as DocumentStatus | null
    const stepKeyFilter = searchParams.get('step_key')

    // Build query
    let query = supabase
      .from('journey_documents')
      .select('*')
      .eq('journey_id', journeyId)
      .is('deleted_at', null)             // exclude soft-deleted
      .order('created_at', { ascending: true })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (stepKeyFilter) {
      query = query.eq('step_key', stepKeyFilter)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('[GET /documents] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to fetch documents'),
        { status: 500 }
      )
    }

    const docs = documents ?? []
    const missingCount = docs.filter(
      (d) => d.status === 'not_started' || d.status === 'requested'
    ).length
    const uploadedCount = docs.filter((d) => d.status === 'uploaded').length

    const response: DocumentListResponse = {
      success: true,
      documents: docs,
      total: docs.length,
      missing_count: missingCount,
      uploaded_count: uploadedCount,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    console.error('[GET /documents] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Create new document requirement or record an upload
// Body: { document_type, step_key?, vault_file_id?, ... }
// Logic: if vault_file_id is provided → status = 'uploaded'
//        otherwise → status = 'not_started'
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
    const body: CreateJourneyDocumentBody = await request.json()

    // Validate via DataValidationService
    const errors = DataValidationService.createDocument(body)
    if (DataValidationService.hasErrors(errors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', errors),
        { status: 422 }
      )
    }

    // Auto-determine status based on whether vault file is provided
    const status: DocumentStatus = body.vault_file_id ? 'uploaded' : 'not_started'

    const { data: document, error } = await supabase
      .from('journey_documents')
      .insert({
        journey_id: journeyId,
        document_type: body.document_type.trim(),
        document_label: body.document_label ?? null,
        step_key: body.step_key ?? null,
        is_required: body.is_required ?? true,
        is_recommended: body.is_recommended ?? false,
        vault_file_id: body.vault_file_id ?? null,
        vault_file_url: body.vault_file_url ?? null,
        uploaded_date: body.vault_file_id ? new Date().toISOString() : null,
        expiry_date: body.expiry_date ?? null,
        notes: body.notes ?? null,
        status,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /documents] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to create document record'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(document, 'Document record created'),
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /documents] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
