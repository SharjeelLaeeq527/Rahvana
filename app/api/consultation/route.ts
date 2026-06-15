import { NextRequest, NextResponse } from "next/server";
import { ConsultationRequest } from "@/types/consultation";
import { consultationService } from "@/lib/services/consultationService";
import { E, msg } from "@/lib/errors";
import { triggerConsultationNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

// Helper function to handle service errors (returns localized messages)
const handleServiceError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (defaultMessage.toLowerCase().includes("fetch")) {
    return NextResponse.json({ error: msg(E.CONSULTATION_FETCH_FAILED) }, { status: 500 });
  }
  if (defaultMessage.toLowerCase().includes("create")) {
    return NextResponse.json({ error: msg(E.CONSULTATION_CREATE_FAILED) }, { status: 500 });
  }
  if (defaultMessage.toLowerCase().includes("update")) {
    return NextResponse.json({ error: msg(E.CONSULTATION_UPDATE_FAILED) }, { status: 500 });
  }
  return NextResponse.json({ error: msg(E.CONSULTATION_CREATE_FAILED) }, { status: 500 });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filters = {
      status: status || undefined,
      search: search || undefined,
      paidOnly: searchParams.get("paid_only") === "true",
    };

    const bookings = await consultationService.getAllBookings(filters);

    return NextResponse.json(bookings);
  } catch (error) {
    return handleServiceError(error, "Error fetching consultation bookings");
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ConsultationRequest = await request.json();

    // Validate required fields
    if (
      !data.issue_category ||
      !data.case_stage ||
      !data.full_name ||
      !data.email ||
      !data.whatsapp_phone ||
      !data.case_summary ||
      !data.selected_slot
    ) {
      return NextResponse.json(
        {
          error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, {
            fields:
              "[issue_category, visa_category, case_stage, full_name, email, whatsapp_phone, case_summary, selected_slot]",
          }),
        },
        { status: 400 }
      );
    }

    // Retrieve authenticated user from session if any
    let userId: string | null = null;
    try {
      const authClient = await createClient();
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (authError) {
      console.warn("Could not retrieve session for consultation booking:", authError);
    }

    // Create new booking
    const newBooking = await consultationService.createBooking({
      issue_category: data.issue_category,
      visa_category: data.visa_category,
      case_stage: data.case_stage,
      urgency: data.urgency || "normal",
      preferred_language: data.preferred_language || "English",
      full_name: data.full_name,
      email: data.email,
      whatsapp_phone: data.whatsapp_phone,
      embassy_consulate: data.embassy_consulate,
      case_summary: data.case_summary,
      selected_slot: new Date(data.selected_slot),
      alternate_slots: data.alternate_slots
        ? data.alternate_slots.map((date) => new Date(date))
        : undefined,
      payment_status: data.payment_status || "paid",
      status: data.status || "pending_approval",
      user_id: userId,
    });

    // In a real app, you would send an email/SMS notification here
    console.log(`New consultation request created: ${newBooking.reference_id}`);

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    return handleServiceError(error, "Error creating consultation booking");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: msg(E.AUTH_SIGNUP_FIELDS_REQUIRED, { fields: "[id]" }) },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { action, adminNotes } = data;

    // Get the current booking to check its status
    const booking = await consultationService.getBookingById(id);

    switch (action) {
      case "approve":
        if (booking.status !== "pending_approval" && booking.status !== "alternatives_proposed") {
          return NextResponse.json(
            { error: "Cannot approve a booking with current status" },
            { status: 400 }
          );
        }
        await consultationService.updateBooking(id, {
          status: "confirmed",
          selected_slot: data.selected_slot ? new Date(data.selected_slot) : undefined,
          expires_at: undefined, // Remove expiration since it's confirmed
          admin_notes: adminNotes || "",
        });
        break;

      case "propose_alternatives":
        if (booking.status !== "pending_approval" && booking.status !== "needs_more_info") {
          return NextResponse.json(
            { error: "Cannot propose alternatives for this booking status" },
            { status: 400 }
          );
        }
        await consultationService.updateBooking(id, {
          status: "alternatives_proposed",
          alternate_slots: data.alternate_slots
            ? data.alternate_slots.map((s: string) => {
                // If it's already an ISO string, use it. If it's space-separated, it's from the admin picker (ET).
                if (s.includes("T")) return new Date(s);
                return new Date(`${s.replace(" ", "T")}-05:00`);
              })
            : undefined,
          admin_notes: adminNotes || "",
        });
        break;

      case "request_more_info":
        if (booking.status !== "pending_approval" && booking.status !== "alternatives_proposed") {
          return NextResponse.json(
            { error: "Cannot request more info for this booking status" },
            { status: 400 }
          );
        }
        await consultationService.updateBooking(id, {
          status: "needs_more_info",
          admin_notes: adminNotes || "",
        });
        break;

      case "cancel":
        await consultationService.updateBooking(id, {
          status: "canceled",
          admin_notes: adminNotes || "",
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the updated booking
    const updatedBooking = await consultationService.getBookingById(id);

    // Trigger notification when appointment status changes
    try {
      await triggerConsultationNotification(id);
    } catch (notifError) {
      console.error("Failed to send consultation status update notification:", notifError);
    }

    console.log(
      `Booking ${updatedBooking.reference_id} status updated to ${updatedBooking.status}`
    );

    return NextResponse.json(updatedBooking);
  } catch (error) {
    return handleServiceError(error, "Error updating consultation booking");
  }
}
