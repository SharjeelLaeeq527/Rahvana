// ============================================================
// types/journey-support.ts
// TypeScript types for Hashir's Supporting Features Group
// IR-1 Roadmap — Developer B
//
// Tables covered:
//   - journey_documents
//   - tool_sessions
//   - journey_portal_records
//   - journey_appointments
// ============================================================

// ─────────────────────────────────────────────────────────────
// ENUMS — matching Supabase ENUM types exactly
// ─────────────────────────────────────────────────────────────

export type DocumentStatus =
  | 'not_started'
  | 'requested'
  | 'pending'
  | 'received'
  | 'uploaded'
  | 'expired'
  | 'rejected'

export type PortalType =
  | 'uscis'
  | 'ceac'
  | 'embassy_booking'
  | 'other'

export type AppointmentType =
  | 'medical'
  | 'interview'
  | 'police_certificate_followup'
  | 'other'

export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'pending_confirmation'

// ─────────────────────────────────────────────────────────────
// JOURNEY DOCUMENTS
// ─────────────────────────────────────────────────────────────

/** A row in the journey_documents table */
export interface JourneyDocument {
  id: string
  journey_id: string
  step_key: string | null
  document_type: string
  document_label: string | null
  status: DocumentStatus
  is_required: boolean
  is_recommended: boolean
  vault_file_id: string | null
  vault_file_url: string | null
  uploaded_date: string | null   // ISO timestamp
  expiry_date: string | null     // ISO timestamp
  notes: string | null
  deleted_at: string | null      // null = active
  created_at: string
  updated_at: string
}

/** Body for POST /api/v1/journeys/:id/documents */
export interface CreateJourneyDocumentBody {
  document_type: string
  document_label?: string
  step_key?: string
  is_required?: boolean
  is_recommended?: boolean
  vault_file_id?: string
  vault_file_url?: string
  expiry_date?: string           // ISO date string
  notes?: string
}

/** Body for PATCH /api/v1/journeys/:id/documents/:docId */
export interface UpdateJourneyDocumentBody {
  status?: DocumentStatus
  vault_file_id?: string
  vault_file_url?: string
  uploaded_date?: string
  expiry_date?: string
  notes?: string
  document_label?: string
}

/** GET /api/v1/journeys/:id/documents?status=&stepKey= */
export interface GetDocumentsQuery {
  status?: DocumentStatus
  step_key?: string
}

/** Response shape for document list */
export interface DocumentListResponse {
  success: true
  documents: JourneyDocument[]
  total: number
  missing_count: number          // count of not_started or requested
  uploaded_count: number
}

// ─────────────────────────────────────────────────────────────
// TOOL SESSIONS
// ─────────────────────────────────────────────────────────────

/** Tool key enum — all supported tools */
export type ToolKey =
  | 'form_filler_i130'
  | 'affidavit_calculator'
  | 'ds260_prep'
  | 'interview_prep'
  | 'case_strength_checker'

/** A row in the tool_sessions table */
export interface ToolSession {
  id: string
  journey_id: string
  step_key: string
  tool_key: ToolKey | string
  session_state: Record<string, unknown> | null   // tool-specific JSON
  completion_percentage: number                   // 0-100
  is_completed: boolean
  tool_output: Record<string, unknown> | null     // final result JSON
  started_at: string
  last_saved_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** Body for PUT /api/v1/journeys/:id/tool-sessions/:toolKey (save/upsert) */
export interface SaveToolSessionBody {
  step_key: string
  session_state: Record<string, unknown>
  completion_percentage: number
  is_completed?: false            // cannot mark complete via PUT — use /complete endpoint
}

/** Body for POST /api/v1/journeys/:id/tool-sessions/:toolKey/complete */
export interface CompleteToolSessionBody {
  tool_output: Record<string, unknown>
}

/** Response for tool completion */
export interface ToolCompletionResponse {
  success: true
  message: string
  next_step_key: string | null   // next step to navigate to (from Hammad's engine)
}

/** Tool launch config returned to frontend */
export interface ToolLaunchConfig {
  tool_key: ToolKey | string
  tool_url: string
  preload_data: Record<string, unknown>
  has_resume_session: boolean
  resume_session: ToolSession | null
  step_key: string
  journey_id: string
}

// ─────────────────────────────────────────────────────────────
// JOURNEY PORTAL RECORDS
// ─────────────────────────────────────────────────────────────

/** A row in the journey_portal_records table */
export interface JourneyPortalRecord {
  id: string
  journey_id: string
  portal_type: PortalType
  portal_name: string | null
  portal_url: string | null
  account_email: string | null
  account_username: string | null
  account_identifier: string | null
  nvc_case_number: string | null
  nvc_invoice_id: string | null
  saved_at: string
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

/** Body for POST /api/v1/journeys/:id/portal-records */
export interface CreatePortalRecordBody {
  portal_type: PortalType
  portal_name?: string
  portal_url?: string
  account_email?: string
  account_username?: string
  account_identifier?: string
  nvc_case_number?: string       // only for portal_type='ceac'
  nvc_invoice_id?: string        // only for portal_type='ceac'
  // SECURITY: password field is intentionally NOT here — never accepted
}

/** Body for PATCH /api/v1/journeys/:id/portal-records/:recordId */
export interface UpdatePortalRecordBody {
  portal_name?: string
  portal_url?: string
  account_email?: string
  account_username?: string
  account_identifier?: string
  nvc_case_number?: string
  nvc_invoice_id?: string
}

// ─────────────────────────────────────────────────────────────
// JOURNEY APPOINTMENTS
// ─────────────────────────────────────────────────────────────

/** A row in the journey_appointments table */
export interface JourneyAppointment {
  id: string
  journey_id: string
  step_key: string | null
  appointment_type: AppointmentType
  appointment_date: string        // 'YYYY-MM-DD'
  appointment_time: string | null // 'HH:MM:SS'
  appointment_datetime: string | null // full ISO timestamp (computed by trigger)
  location: string | null
  provider: string | null
  address: string | null
  phone_number: string | null
  notes: string | null
  status: AppointmentStatus
  reminder_sent_14d: string | null
  reminder_sent_7d: string | null
  reminder_sent_1d: string | null
  created_at: string
  updated_at: string
}

/** Body for POST /api/v1/journeys/:id/appointments */
export interface CreateAppointmentBody {
  appointment_type: AppointmentType
  appointment_date: string        // 'YYYY-MM-DD'
  appointment_time?: string       // 'HH:MM'
  step_key?: string
  location?: string
  provider?: string
  address?: string
  phone_number?: string
  notes?: string
}

/** Body for PATCH /api/v1/journeys/:id/appointments/:appointmentId */
export interface UpdateAppointmentBody {
  appointment_date?: string
  appointment_time?: string
  location?: string
  provider?: string
  address?: string
  phone_number?: string
  notes?: string
  status?: AppointmentStatus
}

/** GET /api/v1/journeys/:id/appointments?upcomingOnly=true&type= */
export interface GetAppointmentsQuery {
  upcoming_only?: string           // 'true' | 'false' (query param is string)
  type?: AppointmentType
}

// ─────────────────────────────────────────────────────────────
// SHARED API RESPONSE SHAPES
// ─────────────────────────────────────────────────────────────

/** Standard success response */
export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

/** Standard error response — matches project pattern */
export interface ApiError {
  success: false
  error: {
    code: string      // E.g. 'VALIDATION_ERROR', 'NOT_FOUND', 'FORBIDDEN'
    message: string
    details?: Array<{ field: string; issue: string }>
  }
}

/** Validation error detail */
export interface ValidationError {
  field: string
  issue: string
}
