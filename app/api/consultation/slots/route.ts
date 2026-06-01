import { NextRequest, NextResponse } from "next/server";
import { consultationService } from "@/lib/services/consultationService";

// Helper function to handle service errors
const handleServiceError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    {
      error: defaultMessage,
      details: errorMessage,
    },
    { status: 500 }
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    const filters = {
      date: date || undefined,
      status: status || undefined,
    };

    const slots = await consultationService.getTimeSlots(filters);

    // Return slots with proper timezone info
    // Database stores in UTC, so we'll send back the raw data
    // and let the frontend handle the display timezone conversion
    return NextResponse.json(
      slots.map((slot) => ({
        ...slot,
        // Add a flag to indicate this is stored in UTC
        timezone: "UTC",
      }))
    );
  } catch (error) {
    return handleServiceError(error, "Error fetching time slots");
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.date || !data.start_time || !data.end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create new time slot with UTC times (which are already converted by frontend)
    const newSlot = await consultationService.createTimeSlot({
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status || "available",
      max_bookings: data.max_bookings || 1,
      current_bookings: data.current_bookings || 0,
    });

    return NextResponse.json(
      {
        ...newSlot,
        timezone: "UTC",
        original_input: {
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleServiceError(error, "Error creating time slot");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    const data = await request.json();
    if (!id && data && data.id) {
      id = data.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    // Update the time slot
    const updatedSlot = await consultationService.updateTimeSlot(id, data);

    return NextResponse.json({
      ...updatedSlot,
      timezone: "UTC",
    });
  } catch (error) {
    return handleServiceError(error, "Error updating time slot");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    await consultationService.deleteTimeSlot(id);

    return NextResponse.json({
      success: true,
      message: "Slot deleted successfully",
    });
  } catch (error) {
    return handleServiceError(error, "Error deleting time slot");
  }
}
