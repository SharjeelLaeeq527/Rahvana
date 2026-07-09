// Complete type definitions for the Journey Roadmap module
export interface Journey {
  id: string;
  user_id: string;
  journey_type: string; // e.g. "IR1", "IR5", "F1"
  case_id?: string; // Optional external case ID for reference
  journey_name?: string; // Display name from config (e.g., "Immediate Relative - IR1")
  filing_method: string; // 'online' | 'paper'
  sponsor_structure: string; // 'individual' | 'joint_sponsor'
  status: "not_started" | "in_progress" | "completed" | "paused"; // Journey lifecycle
  current_chapter_id?: string; // UUID of current chapter (nullable)
  current_step_id?: string; // UUID of current step (nullable)
  total_steps_count: number;
  completed_steps_count: number;
  completion_percentage: number; // 0-100, auto-calculated
  started_at?: string; // ISO timestamp when user formally started
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp, auto-updated
}

export interface Chapter {
  id: string;
  journey_id: string;
  chapter_key: string; // e.g. "chapter_1", unique per journey
  chapter_number: number; // 1, 2, 3...
  chapter_name: string;
  chapter_description?: string; // Detailed description of chapter
  display_order: number; // Order to display chapters
  status: "not_started" | "in_progress" | "completed";
  is_visible: boolean; // Can be hidden based on conditions
  total_steps_count: number;
  completed_steps_count: number;
  completion_percentage: number; // 0-100
  visible_when?: Record<string, unknown>; // JSON conditions for visibility (e.g., {"filing_method": "online"})
  started_at?: string; // ISO timestamp when chapter was started
  completed_at?: string; // ISO timestamp when chapter was completed
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Step {
  id: string;
  chapter_id: string;
  step_key: string; // e.g. "step_1_1", unique per chapter
  step_number: number; // Sequential within chapter: 1, 2, 3...
  step_name: string; // Display name: "Complete I-130 Form", "Schedule Interview", etc.
  step_description?: string; // Detailed description of what to do in this step
  step_type: string; // e.g. "form_fillable", "document_upload", "form_submit", etc.
  status: "not_started" | "in_progress" | "completed" | "blocked" | "skipped"; // Step lifecycle
  substatus?: string; // Additional status detail: "awaiting_uscis_response", "document_rejected", etc.
  completion_percentage: number; // 0-100, manual tracking per step
  display_order: number; // Order to display within chapter
  is_visible: boolean; // Can be hidden based on conditions
  is_required: boolean; // Can step be skipped by user?

  // Dependencies & Visibility
  dependencies: string[]; // Array of step IDs (in JSONB as string[]) that must be completed first
  visible_when: Record<string, unknown>; // JSON conditions for visibility
  // Example: { "filing_method": "online", "sponsor_structure": "individual" }
  visibility_rules?: string; // Human-readable description of when step is visible

  // Tool Integration
  tool_integration?: string; // e.g. "autofill_i130", "interview_prep", "case_strength"
  tool_key?: string; // Unique key to identify tool in integrations
  metadata?: Record<string, unknown>; // Additional step metadata from JSON config (quest_data, tool_data, filing_data)

  // Timing & Deadlines
  estimated_duration_days?: number; // How many days this step typically takes
  started_at?: string; // ISO timestamp when user first viewed step
  completed_at?: string; // ISO timestamp when fully completed
  due_date?: string; // Optional target completion date (e.g., filing deadline)

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CaseData {
  id: string;
  journey_id: string;
  data_key: string; // e.g., 'filing_method', 'visa_category', 'beneficiary_age', etc.
  data_value: any; // JSONB - flexible value storage (string, number, boolean, array, object, null)
  data_type: "string" | "number" | "boolean" | "array" | "object" | "date"; // Data type hint
  label?: string; // User-friendly label for this data
  description?: string; // Description of what this data represents

  // Source tracking
  source: "user_input" | "form_extraction" | "system_calculated" | "external_api" | "tool_output";
  source_reference?: string; // Reference to step_id, tool_name, form_name, etc.

  // Validation & Status
  is_validated: boolean; // Whether this data has been validated
  validation_errors: string[]; // Array of validation error messages
  is_verified: boolean; // Whether user explicitly verified this data

  // Versioning
  version: number; // Increment on updates for audit trail
  previous_value?: any; // Store previous value for audit trail

  // Timestamps
  captured_at: string; // ISO timestamp when data was first captured
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

//    API Input types - only fields user/system should provide
export interface JourneyInput {
  journey_type: string; // Required: "IR1", "IR5", "F1"
  case_id?: string; // Optional: external case ID
  visa_category?: string; // Optional: specific visa ID
  sponsor_structure: string; // Required: "individual" | "joint_sponsor"
  filing_method: string; // Required: "online" | "paper"
  journey_description?: string; // Metadata for display
  journey_name?: string; // Metadata for display
  total_estimated_months?: number; // Estimated duration
  // Note: user_id, status, counts, percentages, current_chapter_id, current_step_id are set server-side
}

export interface JourneyUpdate {
  filing_method?: string; // 'online' | 'paper'
  sponsor_structure?: string; // 'individual' | 'joint_sponsor'
  status?: "not_started" | "in_progress" | "completed" | "paused";
  current_chapter_id?: string; // Set by service on chapter start
  current_step_id?: string; // Set by service on step start
  started_at?: string; // Set when user formally starts journey
  // Counts and percentages auto-calculated, not user-provided
}

export interface ChapterInput {
  chapter_key: string; // Required: unique identifier (e.g., "chapter_1")
  chapter_number: number; // Required: sequential number
  chapter_name: string; // Required: display name
  chapter_description?: string; // Optional: detailed description
  display_order?: number; // Optional: display order (defaults to chapter_number)
  visible_when?: Record<string, unknown>; // Optional: conditional visibility
  // journey_id comes from URL, status defaults to "not_started", is_visible defaults to true
}

export interface StepInput {
  step_key: string; // Required: unique identifier (e.g., "step_1_1")
  step_number: number; // Required: sequential number
  step_name: string; // Required: display name (e.g., "Complete I-130 Form")
  step_description?: string; // Optional: detailed description
  step_type: string; // Required: type of step (form_fillable, document_upload, etc.)
  display_order?: number; // Optional: display order (defaults to step_number)
  is_required?: boolean; // Optional: can user skip this step? (defaults to true)
  visible_when?: Record<string, unknown>; // Optional: conditional visibility
  visibility_rules?: string; // Optional: human-readable description of visibility conditions
  dependencies?: string[]; // Optional: dependency step IDs that must be completed first
  tool_integration?: string; // Optional: tool to integrate
  tool_key?: string; // Optional: unique key to identify tool
  estimated_duration_days?: number; // Optional: estimated days to complete
  due_date?: string; // Optional: target completion date
  metadata?: Record<string, unknown>; // Optional: additional metadata (quest_data, tool_data, filing_data)
  // chapter_id comes from URL, status defaults to "not_started"
}

export interface CaseDataInput {
  data_key: string; // Required: unique identifier (e.g., 'filing_method')
  data_value: any; // Required: the actual value
  data_type?: "string" | "number" | "boolean" | "array" | "object" | "date"; // Optional: type hint
  label?: string; // Optional: human-readable label
  description?: string; // Optional: description
  source?: "user_input" | "form_extraction" | "system_calculated" | "external_api" | "tool_output"; // Optional: defaults to 'user_input'
  source_reference?: string; // Optional: reference to source (step_id, tool_name, etc.)
  is_verified?: boolean; // Optional: user verified this (defaults to false)
  // journey_id comes from URL, created_at/updated_at set by system
}

export interface ChapterUpdate {
  chapter_name?: string;
  chapter_description?: string;
  display_order?: number;
  visible_when?: Record<string, unknown>;
  is_visible?: boolean;
  status?: "not_started" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
}

export interface StepUpdate {
  step_name?: string;
  step_description?: string;
  display_order?: number;
  is_required?: boolean;
  is_visible?: boolean;
  visible_when?: Record<string, unknown>;
  visibility_rules?: string;
  dependencies?: string[];
  tool_integration?: string;
  tool_key?: string;
  status?: "not_started" | "in_progress" | "completed" | "blocked" | "skipped";
  substatus?: string;
  completion_percentage?: number;
  estimated_duration_days?: number;
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  metadata?: Record<string, unknown>;
}

export interface CaseDataUpdate {
  data_value?: any; // Update the value
  data_type?: string; // Update type hint
  label?: string;
  description?: string;
  is_validated?: boolean;
  validation_errors?: string[]; // Array of validation error messages
  is_verified?: boolean;
  source?: string; // Update source if needed
  source_reference?: string;
}

export interface CaseDataHistoryEntry {
  version: number;
  previous_value: any;
  changed_by: string; // email or user_id
  changed_at: string; // ISO timestamp
  change_reason?: string;
}

//    API Response types - with metadata for UI construction
export interface JourneyResponse extends Journey {
  chapters?: ChapterResponse[];
  progress_summary?: {
    total_chapters: number;
    completed_chapters: number;
    current_chapter?: ChapterResponse;
  };
}

export interface ChapterResponse extends Chapter {
  steps?: Array<{
    id: string;
    step_key: string;
    step_number: number;
    step_name: string;
    status: string;
  }>;
  progress_details?: {
    steps_remaining: number;
    estimated_days_remaining: number;
  };
}

export interface CaseDataResponse extends CaseData {
  is_editable: boolean; // Whether user can edit this
  edit_history?: CaseDataHistoryEntry[]; // Optional: full change history
}

export interface StepResponse extends Step {
  chapter?: Chapter;
  dependencies_completed?: boolean; // Are all dependency steps completed?
  blocked_reason?: string; // Why step is blocked, if blocked
  next_steps?: Step[]; // Steps that depend on this one
  progress_in_chapter?: {
    step_position: number; // e.g., "1 of 5"
    total_steps_in_chapter: number;
  };
}

//    Business Logic Return Types - from Service/Engine methods
export interface ProgressData {
  total_steps_count: number;
  completed_steps_count: number;
  completion_percentage: number;
}

export interface VisibilityCheckResult {
  is_visible: boolean;
  reason: string; // "all conditions met", "waiting for x to be completed"
}

export interface StepCompletionResult {
  step_id: string;
  was_completed: boolean;
  newly_unlocked_steps: string[]; // Steps that became available
  chapter_completion_percentage: number;
  journey_completion_percentage: number;
  next_step?: Step; // The next step to work on
}

export interface DependencyCheckResult {
  all_dependencies_met: boolean;
  pending_dependencies: string[]; // Step IDs not yet completed
  reason: string;
}

export interface CaseDataBatchOperation {
  operation: "set" | "update" | "delete"; // Batch operation type
  data_key: string; // Target key
  data_value?: any; // Value for set/update
  is_verified?: boolean;
}

// Case Data Validation Result
export interface CaseDataValidationResult {
  is_valid: boolean;
  data_key: string;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
  affected_steps?: string[]; // Steps that depend on this data
}

// Complete Case Profile (all data for a journey)
export interface CaseProfile {
  journey_id: string;
  filing_method?: string; // 'online', 'embassy', 'consulate', etc.
  visa_category?: string; // 'EB-1C', 'EB-3', 'F-1', etc.
  beneficiary_age?: number;
  beneficiary_relationship?: string;
  beneficiary_country_of_residence?: string;
  employer_state?: string;
  sponsor_type?: string; // 'individual', 'employer', 'family', etc.
  case_status?: string; // 'initial', 'in_progress', 'submitted', etc.
  critical_data_keys: string[]; // Keys that are required for case
  optional_data_keys: string[]; // Keys that are optional
  completion_percentage: number; // % of required data filled
  last_updated: string;
  all_data: Record<string, CaseData>; // All case data keyed by data_key
}

// Case Data Dependency Map (what steps depend on what case data)
export interface DataDependencyMap {
  data_key: string;
  depends_on: string[]; // Other data_keys that must be filled first
  steps_that_depend_on_this: string[]; // Step IDs that need this data
  blocks_steps?: string[]; // Steps that are blocked if this is missing
}

//    Error Response Types (not stored, API only)
export interface ErrorResponse {
  error: string; // User-friendly error message
  code?: string; // Error code for debugging: "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"
  details?: unknown; // Optional validation errors object
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

//    Query Filter Types
export interface JourneyFilters {
  status?: "not_started" | "in_progress" | "completed" | "paused";
  journey_type?: string;
  limit?: number;
  offset?: number;
}

export interface ChapterFilters {
  status?: "not_started" | "in_progress" | "completed";
  limit?: number;
  offset?: number;
}

export interface StepFilters {
  status?: "not_started" | "in_progress" | "completed" | "blocked" | "skipped";
  step_type?: string;
  visible_only?: boolean; // Only return visible steps (apply visibility logic)
  limit?: number;
  offset?: number;
}

export interface CaseDataFilters {
  data_key?: string; // Filter by specific key
  source?: string; // Filter by source
  is_validated?: boolean; // Only validated data
  is_verified?: boolean; // Only verified data
  limit?: number;
  offset?: number;
}

// ────────────────────────────────────────────────
// JOURNEY DOCUMENTS (TABLE: journey_documents)
// ────────────────────────────────────────────────

export type JourneyDocumentStatus =
  | "not_started"
  | "requested"
  | "pending"
  | "received"
  | "uploaded"
  | "expired"
  | "rejected";

export interface JourneyDocument {
  id: string;
  journey_id: string;
  step_key?: string; // e.g. "I.2", "II.4"
  document_type: string; // Machine ID: "marriage_cert", "police_cert"
  document_label?: string; // Human readable: "Marriage Certificate"
  status: JourneyDocumentStatus;
  is_required: boolean;
  is_recommended: boolean;
  vault_file_id?: string;
  vault_file_url?: string;
  uploaded_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyDocumentInput {
  document_type: string;
  document_label?: string;
  status?: JourneyDocumentStatus;
  is_required?: boolean;
  is_recommended?: boolean;
  vault_file_id?: string;
  vault_file_url?: string;
  uploaded_date?: string;
  expiry_date?: string;
  notes?: string;
}
