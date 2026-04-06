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
  newly_unlocked_steps: string[]; // steps that became available
  chapter_completion_percentage: number; // updated
  journey_completion_percentage: number; // updated
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
