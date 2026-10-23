import { NextRequest, NextResponse } from "next/server";
import { consultationService } from "@/lib/services/consultationService";
import { E, msg } from "@/lib/errors";
import { requireAdmin } from "@/lib/api/authGuards";

/** An unpaid standalone draft holds its slot only this long (the payment step). */
const UNPAID_HOLD_MS = 15 * 60 * 1000;

/** Whether a booking still occupies its slot. */
function holdsSlot(b: { status?: string; payment_status?: string | null; created_at?: Date | string }) {
  if (b.status === "canceled" || b.status === "cancelled") return false;
  if (b.payment_status === "failed") return false;
  if (b.payment_status === "pending") {
    const created = b.created_at ? new Date(b.created_at).getTime() : 0;
    return Date.now() - created < UNPAID_HOLD_MS;
  }
  return true;
}

async function adminOnly() {
  const { isAdmin, user } = await requireAdmin();
  if (isAdmin) return null;
  return NextResponse.json(
    { error: user ? "Admin access required" : msg(E.AUTH_UNAUTHORIZED) },
    { status: user ? 403 : 401 }
  );
}

// Helper function to handle service errors (localized)
const handleServiceError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (defaultMessage.toLowerCase().includes("fetch")) {
    return NextResponse.json(
      { error: msg(E.CONSULTATION_FETCH_FAILED) },
      { status: 500 }
    );
  }
  if (defaultMessage.toLowerCase().includes("create")) {
    return NextResponse.json(
      { error: msg(E.CONSULTATION_CREATE_FAILED) },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: msg(E.CONSULTATION_CREATE_FAILED) },
    { status: 500 }
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    // Fetch slots matching the date, but not status, so we can filter/override dynamically in memory
    const slots = await consultationService.getTimeSlots({ date: date || undefined });
    const bookings = await consultationService.getAllBookings();

    const mappedSlots = slots.map((slot) => {
      // Find if there is a booking matching this slot
      const dateStr = slot.date instanceof Date 
        ? slot.date.toISOString().split("T")[0] 
        : String(slot.date);
      
      // start_time is a string like "09:00:00" or "09:00"
      const timeStr = String(slot.start_time).substring(0, 8);
      const slotDate = new Date(`${dateStr}T${timeStr}Z`);
      
      const matchingBookings = bookings.filter((b) => {
        return new Date(b.selected_slot).getTime() === slotDate.getTime();
      });

      let displayStatus = slot.status;
      if (matchingBookings.length > 0) {
        // Cancelled bookings and abandoned unpaid drafts free the slot again.
        displayStatus = matchingBookings.some(holdsSlot) ? "confirmed" : "available";
      }

      return {
        ...slot,
        status: displayStatus,
        // Add a flag to indicate this is stored in UTC
        timezone: "UTC",
      };
    });

    // If a status filter was requested, perform filtering in memory
    const filteredSlots = status 
      ? mappedSlots.filter((slot) => slot.status === status)
      : mappedSlots;

    return NextResponse.json(filteredSlots);
  } catch (error) {
    return handleServiceError(error, "Error fetching time slots");
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.date || !data.start_time || !data.end_time) {
      return NextResponse.json(
        { error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, { fields: "[date, start_time, end_time]" }) },
        { status: 400 }
      );
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
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    const data = await request.json();
    if (!id && data && data.id) {
      id = data.id;
    }

    if (!id) {
      return NextResponse.json(
        { error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, { fields: "[id]" }) },
        { status: 400 }
      );
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
  const denied = await adminOnly();
  if (denied) return denied;
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
