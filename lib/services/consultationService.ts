import { createClient } from "@supabase/supabase-js";
import { ConsultationBooking, TimeSlot } from "@/types/consultation";
import * as Errors from "@/lib/errors";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Supabase URL is not set");
}

// Initialize Supabase client - Prefer Service Role Key for backend operations
const supabase =
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
    ? createClient(supabaseUrl, (supabaseServiceRoleKey || supabaseAnonKey) as string)
    : null;

if (!supabase) {
  console.error("Supabase client failed to initialize");
}

export const consultationService = {
  // Get all consultation bookings with optional filtering
  async getAllBookings(filters: { status?: string; search?: string; paidOnly?: boolean } = {}) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      return [];
    }

    let query = supabase
      .from("consultation_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.paidOnly) {
      query = query.or("payment_status.eq.paid,payment_status.eq.free");
    }

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,reference_id.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching consultation bookings:", error);
      // Check if it's a table not found error
      if (error.message && error.message.includes("does not exist")) {
        console.warn(
          "Consultation bookings table does not exist yet. Please run database migrations."
        );
      }
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    return data.map((booking) => ({
      ...booking,
      id: booking.id,
      reference_id: booking.reference_id,
      issue_category: booking.issue_category,
      visa_category: booking.visa_category,
      case_stage: booking.case_stage,
      preferred_language: booking.preferred_language,
      full_name: booking.full_name,
      whatsapp_phone: booking.whatsapp_phone,
      embassy_consulate: booking.embassy_consulate,
      case_summary: booking.case_summary,
      selected_slot: new Date(booking.selected_slot),
      alternate_slots: booking.alternate_slots
        ? booking.alternate_slots.map((slot: string) => new Date(slot))
        : undefined,
      admin_notes: booking.admin_notes,
      created_at: new Date(booking.created_at),
      updated_at: new Date(booking.updated_at),
      expires_at: booking.expires_at ? new Date(booking.expires_at) : undefined,
      payment_status: booking.payment_status ?? null,
    })) as ConsultationBooking[];
  },

  // Create a new consultation booking
  async createBooking(
    bookingData: Omit<
      ConsultationBooking,
      "id" | "reference_id" | "created_at" | "updated_at" | "expires_at"
    > & {
      status?: ConsultationBooking["status"];
      payment_status?: ConsultationBooking["payment_status"];
    }
  ) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error(Errors.msg(Errors.E.CONSULTATION_SUPABASE_NOT_INITIALIZED));
    }

    // Generate reference ID
    const referenceId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    // Normalize urgency for database check constraint (must be 'normal' or 'urgent')
    const normalizedUrgency =
      bookingData.urgency && bookingData.urgency.startsWith("urgent") ? "urgent" : "normal";
    const bookingStatus = bookingData.status || "pending_approval";
    const bookingPaymentStatus = bookingData.payment_status ?? "paid";

    // Map camelCase to snake_case for Supabase
    const newBooking = {
      issue_category: bookingData.issue_category,
      visa_category: bookingData.visa_category,
      case_stage: bookingData.case_stage,
      urgency: normalizedUrgency,
      preferred_language: bookingData.preferred_language || "English",
      full_name: bookingData.full_name,
      email: bookingData.email,
      whatsapp_phone: bookingData.whatsapp_phone,
      embassy_consulate: bookingData.embassy_consulate,
      case_summary: bookingData.case_summary,
      attachments: bookingData.attachments || [],
      selected_slot: bookingData.selected_slot.toISOString(),
      alternate_slots: bookingData.alternate_slots
        ? bookingData.alternate_slots.map((slot) => slot.toISOString())
        : [],
      reference_id: referenceId,
      status: bookingStatus,
      payment_status: bookingPaymentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 24 hours if not approved
    };

    const { data, error } = await supabase
      .from("consultation_bookings")
      .insert([newBooking])
      .select()
      .single();

    if (error) {
      console.error("Error creating consultation booking:", error);
      throw new Error(Errors.msg(Errors.E.CONSULTATION_CREATE_FAILED));
    }

    // Automatically update the slot status in time_slots to 'confirmed' (booked)
    try {
      const slotDateStr = bookingData.selected_slot.toISOString().split("T")[0];
      const slotTimeStr = bookingData.selected_slot.toISOString().split("T")[1].substring(0, 8);

      const { error: slotUpdateError } = await supabase
        .from("time_slots")
        .update({ status: "confirmed" })
        .eq("date", slotDateStr)
        .eq("start_time", slotTimeStr);

      if (slotUpdateError) {
        console.error("Error updating slot status:", slotUpdateError);
      } else {
        console.log(`Successfully marked slot ${slotDateStr} ${slotTimeStr} as confirmed`);
      }
    } catch (slotErr) {
      console.error("Error in auto-marking slot as booked:", slotErr);
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    const result = data;
    return {
      ...result,
      id: result.id,
      reference_id: result.reference_id,
      issue_category: result.issue_category,
      visa_category: result.visa_category,
      case_stage: result.case_stage,
      preferred_language: result.preferred_language,
      full_name: result.full_name,
      whatsapp_phone: result.whatsapp_phone,
      embassy_consulate: result.embassy_consulate,
      case_summary: result.case_summary,
      selected_slot: new Date(result.selected_slot),
      alternate_slots: result.alternate_slots
        ? result.alternate_slots.map((slot: string) => new Date(slot))
        : undefined,
      admin_notes: result.admin_notes,
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at),
      expires_at: result.expires_at ? new Date(result.expires_at) : undefined,
    } as ConsultationBooking;
  },

  // Update a consultation booking
  async updateBooking(id: string, updates: Partial<ConsultationBooking>) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error(Errors.msg(Errors.E.CONSULTATION_SUPABASE_NOT_INITIALIZED));
    }

    // Map camelCase to snake_case for Supabase
    const updatesSnakeCase: Record<string, unknown> = {};
    Object.keys(updates).forEach((key) => {
      const typedKey = key as keyof Partial<ConsultationBooking>;
      if (typedKey === "selected_slot") {
        const value = updates[typedKey];
        updatesSnakeCase["selected_slot"] = value instanceof Date ? value.toISOString() : undefined;
      } else if (typedKey === "alternate_slots") {
        const value = updates[typedKey] as Date[] | undefined;
        updatesSnakeCase["alternate_slots"] = value?.map((slot) => slot.toISOString());
      } else if (
        typedKey === "created_at" ||
        typedKey === "updated_at" ||
        typedKey === "expires_at"
      ) {
        const value = updates[typedKey];
        updatesSnakeCase[key] =
          value instanceof Date ? value.toISOString() : value === null ? null : undefined;
      } else {
        updatesSnakeCase[key] = updates[typedKey];
      }
    });

    updatesSnakeCase.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("consultation_bookings")
      .update(updatesSnakeCase)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating consultation booking:", error);
      throw new Error(Errors.msg(Errors.E.CONSULTATION_UPDATE_FAILED));
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    const result = data;
    return {
      ...result,
      id: result.id,
      reference_id: result.reference_id,
      issue_category: result.issue_category,
      visa_category: result.visa_category,
      case_stage: result.case_stage,
      preferred_language: result.preferred_language,
      full_name: result.full_name,
      whatsapp_phone: result.whatsapp_phone,
      embassy_consulate: result.embassy_consulate,
      case_summary: result.case_summary,
      selected_slot: new Date(result.selected_slot),
      alternate_slots: result.alternate_slots
        ? result.alternate_slots.map((slot: string) => new Date(slot))
        : undefined,
      admin_notes: result.admin_notes,
      payment_status: result.payment_status ?? null,
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at),
      expires_at: result.expires_at ? new Date(result.expires_at) : undefined,
    } as ConsultationBooking;
  },

  // Get a single consultation booking by ID
  async getBookingById(id: string) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error(Errors.msg(Errors.E.CONSULTATION_SUPABASE_NOT_INITIALIZED));
    }

    const { data, error } = await supabase
      .from("consultation_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching consultation booking:", error);
      throw new Error(Errors.msg(Errors.E.CONSULTATION_FETCH_FAILED));
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    return {
      ...data,
      id: data.id,
      reference_id: data.reference_id,
      issue_category: data.issue_category,
      visa_category: data.visa_category,
      case_stage: data.case_stage,
      preferred_language: data.preferred_language,
      full_name: data.full_name,
      whatsapp_phone: data.whatsapp_phone,
      embassy_consulate: data.embassy_consulate,
      case_summary: data.case_summary,
      selected_slot: new Date(data.selected_slot),
      alternate_slots: data.alternate_slots
        ? data.alternate_slots.map((slot: string) => new Date(slot))
        : undefined,
      admin_notes: data.admin_notes,
      payment_status: data.payment_status ?? null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
    } as ConsultationBooking;
  },

  // Get time slots with optional filtering
  async getTimeSlots(filters: { date?: string; status?: string } = {}) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      return [];
    }

    let query = supabase
      .from("time_slots")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (filters.date) {
      query = query.eq("date", filters.date);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching time slots:", error);
      // Check if it's a table not found error
      if (error.message && error.message.includes("does not exist")) {
        console.warn("Time slots table does not exist yet. Please run database migrations.");
      }
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    return data.map((slot) => ({
      ...slot,
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_bookings: slot.max_bookings,
      current_bookings: slot.current_bookings,
      created_at: new Date(slot.created_at),
      updated_at: new Date(slot.updated_at),
    })) as TimeSlot[];
  },

  // Create a new time slot
  async createTimeSlot(slotData: Omit<TimeSlot, "id" | "created_at" | "updated_at">) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error(Errors.msg(Errors.E.CONSULTATION_SUPABASE_NOT_INITIALIZED));
    }

    // Map camelCase to snake_case for Supabase
    const newSlot = {
      date:
        slotData.date instanceof Date ? slotData.date.toISOString().split("T")[0] : slotData.date,
      start_time: slotData.start_time,
      end_time: slotData.end_time,
      status: slotData.status || "available",
      max_bookings: slotData.max_bookings || 1,
      current_bookings: slotData.current_bookings || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("time_slots").insert([newSlot]).select().single();

    if (error) {
      console.error("Error creating time slot:", error);
      throw new Error(Errors.msg(Errors.E.CONSULTATION_TIMESLOT_CREATE_FAILED));
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    const result = data;
    return {
      ...result,
      id: result.id,
      start_time: result.start_time,
      end_time: result.end_time,
      max_bookings: result.max_bookings,
      current_bookings: result.current_bookings,
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at),
    } as TimeSlot;
  },

  // Update a time slot
  async updateTimeSlot(id: string, updates: Partial<TimeSlot>) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error(Errors.msg(Errors.E.CONSULTATION_SUPABASE_NOT_INITIALIZED));
    }

    // Map camelCase to snake_case for Supabase
    const updatesSnakeCase: Record<string, unknown> = {};
    Object.keys(updates).forEach((key) => {
      const typedKey = key as keyof Partial<TimeSlot>;
      if (typedKey === "date" || typedKey === "created_at" || typedKey === "updated_at") {
        const value = updates[typedKey];
        updatesSnakeCase[key] =
          value instanceof Date ? value.toISOString().split("T")[0] : undefined; // Date only for date field
      } else {
        updatesSnakeCase[key] = updates[typedKey];
      }
    });

    updatesSnakeCase.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("time_slots")
      .update(updatesSnakeCase)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating time slot:", error);
      throw new Error(Errors.msg(Errors.E.CONSULTATION_TIMESLOT_UPDATE_FAILED));
    }

    // Map the snake_case fields from Supabase to camelCase for the frontend
    const result = data;
    return {
      ...result,
      id: result.id,
      start_time: result.start_time,
      end_time: result.end_time,
      max_bookings: result.max_bookings,
      current_bookings: result.current_bookings,
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at),
    } as TimeSlot;
  },

  // Delete a time slot
  async deleteTimeSlot(id: string) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error("Failed to delete time slot: Supabase not initialized");
    }

    const { error } = await supabase.from("time_slots").delete().eq("id", id);

    if (error) {
      console.error("Error deleting time slot:", error);
      throw new Error(`Failed to delete time slot: ${error.message}`);
    }

    return true;
  },
};
