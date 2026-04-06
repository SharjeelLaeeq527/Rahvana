// GET /api/v1/journeys/[journeyId]/appointments/[appointmentId]
// PATCH /api/v1/journeys/[journeyId]/appointments/[appointmentId]
// DELETE /api/v1/journeys/[journeyId]/appointments/[appointmentId]

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { UpdateAppointmentBody } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// GET — Get single appointment details
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; appointmentId: string }> }
) {
  try {
    const { journeyId, appointmentId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { data: appointment, error } = await supabase
      .from('journey_appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('journey_id', journeyId)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Appointment not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(successResponse(appointment), { status: 200 })
  } catch (err) {
    console.error('[GET /appointments/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — Update / reschedule appointment
// Key behavior: if appointment_date changes → DB trigger auto-resets
//              reminder_sent_* flags back to NULL
// ─────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; appointmentId: string }> }
) {
  try {
    const { journeyId, appointmentId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth
    const body: UpdateAppointmentBody = await request.json()

    // Validate via DataValidationService (date format, time format, status enum)
    const validationErrors = DataValidationService.updateAppointment(body)
    if (DataValidationService.hasErrors(validationErrors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', validationErrors),
        { status: 422 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.appointment_date !== undefined) {
      updateData.appointment_date = body.appointment_date
      // DB trigger auto-resets reminder_sent_* and recomputes appointment_datetime
    }
    if (body.appointment_time !== undefined) updateData.appointment_time = body.appointment_time
    if (body.location !== undefined)         updateData.location = body.location
    if (body.provider !== undefined)         updateData.provider = body.provider
    if (body.address !== undefined)          updateData.address = body.address
    if (body.phone_number !== undefined)     updateData.phone_number = body.phone_number
    if (body.notes !== undefined)            updateData.notes = body.notes
    if (body.status !== undefined)           updateData.status = body.status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'No valid fields to update'),
        { status: 422 }
      )
    }

    const { data: appointment, error } = await supabase
      .from('journey_appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('journey_id', journeyId)
      .select()
      .single()

    if (error || !appointment) {
      console.error('[PATCH /appointments/:id] DB error:', error)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Appointment not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse(appointment, 'Appointment updated'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[PATCH /appointments/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — Remove appointment
// ─────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; appointmentId: string }> }
) {
  try {
    const { journeyId, appointmentId } = await params
    const auth = await verifyJourneyAccess(journeyId)
    if (auth.error) return auth.error

    const { supabase } = auth

    const { error } = await supabase
      .from('journey_appointments')
      .delete()
      .eq('id', appointmentId)
      .eq('journey_id', journeyId)

    if (error) {
      console.error('[DELETE /appointments/:id] DB error:', error)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Appointment not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse(null, 'Appointment removed'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[DELETE /appointments/:id] Error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
