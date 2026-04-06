// Complete type definitions for the Journey Roadmap module
export interface Journey {
  id: string;
  user_id: string;
  journey_type: string; // e.g. "IR1", "IR5", "F1"
  case_id?: string; // Optional external case ID for reference
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

  // Timing & Deadlines
  estimated_duration_days?: number; // How many days this step typically takes
  started_at?: string; // ISO timestamp when user first viewed step
  completed_at?: string; // ISO timestamp when fully completed
  due_date?: string; // Optional target completion date (e.g., filing deadline)

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

//    API Input types - only fields user/system should provide
export interface JourneyInput {
  journey_type: string; // Required: "IR1", "IR5", "F1"
  case_id?: string; // Optional: external case ID
  filing_method: string; // Required: "online" | "paper"
  sponsor_structure: string; // Required: "individual" | "joint_sponsor"
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
  // chapter_id comes from URL, status defaults to "not_started"
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
