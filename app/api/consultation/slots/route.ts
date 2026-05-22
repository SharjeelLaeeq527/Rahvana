import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/services/consultationService';
import { E, msg } from '@/lib/errors';

// Helper function to handle service errors (localized)
const handleServiceError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (defaultMessage.toLowerCase().includes('fetch')) {
    return NextResponse.json({ error: msg(E.CONSULTATION_FETCH_FAILED), details: errorMessage }, { status: 500 });
  }
  if (defaultMessage.toLowerCase().includes('create')) {
    return NextResponse.json({ error: msg(E.CONSULTATION_CREATE_FAILED), details: errorMessage }, { status: 500 });
  }
  return NextResponse.json({ error: msg(E.CONSULTATION_CREATE_FAILED), details: errorMessage }, { status: 500 });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const filters = {
      date: date || undefined,
      status: status || undefined,
    };

    const slots = await consultationService.getTimeSlots(filters);

    // Return slots with proper timezone info
    // Database stores in UTC, so we'll send back the raw data
    // and let the frontend handle the display timezone conversion
    return NextResponse.json(slots.map(slot => ({
      ...slot,
      // Add a flag to indicate this is stored in UTC
      timezone: 'UTC'
    })));
  } catch (error) {
    return handleServiceError(error, 'Error fetching time slots');
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.date || !data.start_time || !data.end_time) {
      return NextResponse.json({ error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, { fields: '[date, start_time, end_time]' }) }, { status: 400 });
    }

    // IMPORTANT: Accept the date and time as-is from admin
    // The admin inputs in their local timezone
    // We need to preserve the date in the user's timezone context
    // To do this, we'll create a date object that represents the local time in the user's timezone
    // and then convert it to UTC for storage

    // Create a date object using the local date and time
    // This interprets the date/time as being in the user's local timezone
    const localDateTime = new Date(`${data.date}T${data.start_time}`);

    // Convert to UTC by getting the UTC values
    // This might change the date if the local time crosses midnight UTC
    const utcISOString = localDateTime.toISOString();
    const [utcDate, timeWithMs] = utcISOString.split('T');
    const utcStartTime = timeWithMs.substring(0, 8); // HH:mm:ss in UTC

    const localEndTime = new Date(`${data.date}T${data.end_time}`);
    const utcEndISOString = localEndTime.toISOString();
    const [, endTimeWithMs] = utcEndISOString.split('T');
    const utcEndTime = endTimeWithMs.substring(0, 8); // HH:mm:ss in UTC

    // Create new time slot with UTC times
    const newSlot = await consultationService.createTimeSlot({
      date: new Date(utcDate),
      start_time: utcStartTime,
      end_time: utcEndTime,
      status: data.status || 'available',
      max_bookings: data.max_bookings || 1,
      current_bookings: data.current_bookings || 0,
    });

    return NextResponse.json({
      ...newSlot,
      timezone: 'UTC',
      original_input: {
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time
      }
    }, { status: 201 });
  } catch (error) {
    return handleServiceError(error, 'Error creating time slot');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, { fields: '[id]' }) }, { status: 400 });
    }

    const data = await request.json();

    // Update the time slot
    const updatedSlot = await consultationService.updateTimeSlot(id, data);

    return NextResponse.json({
      ...updatedSlot,
      timezone: 'UTC'
    });
  } catch (error) {
    return handleServiceError(error, 'Error updating time slot');
  }
}
