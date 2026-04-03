// GET /api/v1/journeys/[journeyId]/documents/[documentId]
// PATCH /api/v1/journeys/[journeyId]/documents/[documentId]
// DELETE /api/v1/journeys/[journeyId]/documents/[documentId]

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { UpdateJourneyDocumentBody } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// GET — Get single document by ID
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; documentId: string }> }
) {
  try {
    const { journeyId, documentId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { data: document, error } = await supabase
      .from('journey_documents')
      .select('*')
      .eq('id', documentId)
      .eq('journey_id', journeyId)
      .is('deleted_at', null)
      .single()

    if (error || !document) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Document not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(successResponse(document), { status: 200 })
  } catch (err) {
    console.error('[GET /documents/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — Update document status, expiry, notes, vault reference
// Only include fields you want to change in the body
// ─────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; documentId: string }> }
) {
  try {
    const { journeyId, documentId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const body: UpdateJourneyDocumentBody = await request.json()

    // Validate via DataValidationService
    const validationErrors = DataValidationService.updateDocument(body)
    if (DataValidationService.hasErrors(validationErrors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', validationErrors),
        { status: 422 }
      )
    }

    // Build update object — only include fields that were sent
    const updateData: Record<string, unknown> = {}

    if (body.status !== undefined)       updateData.status = body.status
    if (body.vault_file_id !== undefined) updateData.vault_file_id = body.vault_file_id
    if (body.vault_file_url !== undefined) updateData.vault_file_url = body.vault_file_url
    if (body.expiry_date !== undefined)   updateData.expiry_date = body.expiry_date
    if (body.notes !== undefined)         updateData.notes = body.notes
    if (body.document_label !== undefined) updateData.document_label = body.document_label

    // If transitioning to 'uploaded' status, record the upload date
    if (body.status === 'uploaded' && !body.uploaded_date) {
      updateData.uploaded_date = new Date().toISOString()
    } else if (body.uploaded_date !== undefined) {
      updateData.uploaded_date = body.uploaded_date
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'No valid fields to update'),
        { status: 422 }
      )
    }

    const { data: document, error } = await supabase
      .from('journey_documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('journey_id', journeyId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error || !document) {
      console.error('[PATCH /documents/:id] DB error:', error)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Document not found or update failed'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse(document, 'Document updated'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[PATCH /documents/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — Soft delete document (sets deleted_at)
// ─────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; documentId: string }> }
) {
  try {
    const { journeyId, documentId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { error } = await supabase
      .from('journey_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId)
      .eq('journey_id', journeyId)
      .is('deleted_at', null)     // cannot delete already-deleted

    if (error) {
      console.error('[DELETE /documents/:id] DB error:', error)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Document not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse(null, 'Document removed'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[DELETE /documents/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
