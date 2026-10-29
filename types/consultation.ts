export interface ConsultationBooking {
  id: string;
  reference_id: string;
  issue_category: string;
  visa_category: string;
  case_stage: string;
  urgency: "normal" | "urgent";
  preferred_language: string;
  full_name: string;
  email: string;
  whatsapp_phone: string;
  embassy_consulate?: string;
  case_summary: string;
  attachments?: string[];
  selected_slot: Date;
  alternate_slots?: Date[];
  status:
    | "pending_approval"
    | "alternatives_proposed"
    | "needs_more_info"
    | "confirmed"
    | "completed"
    | "canceled";
  payment_status?: "pending" | "paid" | "free" | "failed" | null;
  payment_id?: string | null;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
  user_id?: string | null;
  /** Origin tag: 'journey' when created from inside a journey, 'standalone' otherwise. */
  source?: "journey" | "standalone";
  /** Journey slug (e.g. "ir5-journey") when `source === "journey"`. */
  journey_slug?: string | null;
  /** Candidate this booking belongs to (multi-candidate journeys). */
  candidate_id?: string | null;
}

export interface TimeSlot {
  id: string;
  date: Date;
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  status: "available" | "unavailable" | "pending" | "confirmed";
  max_bookings?: number;
  current_bookings?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ConsultationRequest extends Omit<
  ConsultationBooking,
  | "id"
  | "reference_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "expires_at"
  | "selected_slot"
  | "alternate_slots"
> {
  selected_slot: string; // ISO string
  alternate_slots?: string[]; // ISO strings
}
