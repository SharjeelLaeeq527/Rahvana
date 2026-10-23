import { NextRequest, NextResponse } from "next/server";
import { ConsultationRequest } from "@/types/consultation";
import { consultationService } from "@/lib/services/consultationService";
import { E, msg } from "@/lib/errors";
import { triggerConsultationNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser, requireAdmin } from "@/lib/api/authGuards";
import { verifyJourneyServiceAccess } from "@/lib/journey/journeyServiceAccess";

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
    // Bookings carry contact details and case summaries: admins see all, a user
    // sees only their own.
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }
    const { isAdmin } = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filters = {
      status: status || undefined,
      search: search || undefined,
      paidOnly: searchParams.get("paid_only") === "true",
      owner: isAdmin ? undefined : { userId: user.id, email: user.email },
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

    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }
    const userId = user.id;

    // Payment is decided here, never by the client. A journey booking is covered by
    // the journey plan, so it is paid once the journey checks out; a standalone
    // booking stays pending until /api/wallet/deduct-service charges it.
    const body = data as ConsultationRequest & {
      journey_id?: string | null;
      journey_category?: string | null;
      candidate_id?: string | null;
      candidateId?: string | null;
    };
    const isJourneyBooking = body.source === "journey";
    const candidateId = body.candidateId ?? body.candidate_id ?? null;
    if (isJourneyBooking) {
      const access = await verifyJourneyServiceAccess(authClient, userId, "expert_consultation", {
        journeyId: body.journey_id ?? null,
        journeyCategory: body.journey_category || body.journey_slug || null,
        candidateId,
      });
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }
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
      payment_status: isJourneyBooking ? "paid" : "pending",
      status: "pending_approval",
      user_id: userId,
      source: isJourneyBooking ? "journey" : "standalone",
      journey_slug: isJourneyBooking ? (body.journey_slug ?? null) : null,
      candidate_id: candidateId,
    });

    // In a real app, you would send an email/SMS notification here
    console.log(`New consultation request created: ${newBooking.reference_id}`);

    // Trigger admin notification only for confirmed paid requests (standalone credit bookings will trigger when payment succeeds)
    if (newBooking.payment_status === "paid") {
      try {
        await triggerConsultationNotification(newBooking.id);
      } catch (notifError) {
        console.error("Failed to trigger consultation notification:", notifError);
      }
    }

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

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }
    const { isAdmin } = await requireAdmin();

    const data = await request.json();
    const { action } = data;

    // Get the current booking to check its status
    const booking = await consultationService.getBookingById(id);

    // Admins run every action. A user may only accept one of the alternative
    // slots an admin proposed on their own booking.
    if (!isAdmin) {
      const proposed = (booking.alternate_slots ?? []).map((slot) => new Date(slot).getTime());
      const chosen = data.selected_slot ? new Date(data.selected_slot).getTime() : NaN;
      const allowed =
        action === "approve" &&
        booking.user_id === user.id &&
        booking.status === "alternatives_proposed" &&
        proposed.includes(chosen);
      if (!allowed) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }
    // Admin notes are admin-only; a user's acceptance keeps the existing note.
    const adminNotes = isAdmin ? data.adminNotes : booking.admin_notes;

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
