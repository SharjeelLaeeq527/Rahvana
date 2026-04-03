// GET /api/v1/journeys/[journeyId]/appointments
// POST /api/v1/journeys/[journeyId]/appointments

import { NextRequest, NextResponse } from 'next/server'
import { verifyJourneyAccess, errorResponse, successResponse } from '@/lib/api/journey-auth'
import DataValidationService from '@/lib/services/DataValidationService'
import type { CreateAppointmentBody, AppointmentType } from '@/types/journey-support'

const VALID_APPOINTMENT_TYPES: AppointmentType[] = [
  'medical',
  'interview',
  'police_certificate_followup',
  'other',
]

// ─────────────────────────────────────────────────────────────
// GET — List appointments for a journey
// Query: ?upcoming_only=true&type=medical
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
    const upcomingOnly = searchParams.get('upcoming_only') === 'true'
    const typeFilter = searchParams.get('type') as AppointmentType | null

    let query = supabase
      .from('journey_appointments')
      .select('*')
      .eq('journey_id', journeyId)
      .order('appointment_date', { ascending: true })

    if (upcomingOnly) {
      // Only future appointments with scheduled status
      query = query
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled')
    }

    if (typeFilter && VALID_APPOINTMENT_TYPES.includes(typeFilter)) {
      query = query.eq('appointment_type', typeFilter)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('[GET /appointments] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to fetch appointments'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(appointments ?? []),
      { status: 200 }
    )
  } catch (err) {
    console.error('[GET /appointments] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Create a new appointment
// appointment_datetime is auto-computed by the DB trigger
// Reminder timestamps are initialized to NULL (sent by future cron job)
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
    const body: CreateAppointmentBody = await request.json()

    // Validate via DataValidationService (type, date format, future date, time format)
    const errors = DataValidationService.createAppointment(body)
    if (DataValidationService.hasErrors(errors)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid input', errors),
        { status: 422 }
      )
    }

    // Insert — the DB trigger auto-computes appointment_datetime
    const { data: appointment, error } = await supabase
      .from('journey_appointments')
      .insert({
        journey_id: journeyId,
        step_key: body.step_key ?? null,
        appointment_type: body.appointment_type,
        appointment_date: body.appointment_date,
        appointment_time: body.appointment_time ?? null,
        location: body.location ?? null,
        provider: body.provider ?? null,
        address: body.address ?? null,
        phone_number: body.phone_number ?? null,
        notes: body.notes ?? null,
        status: 'scheduled',
        // reminder_sent_* are NULL by default — future notification cron job will check these
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /appointments] DB error:', error)
      return NextResponse.json(
        errorResponse('DB_ERROR', 'Failed to create appointment'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(appointment, 'Appointment scheduled'),
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /appointments] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
