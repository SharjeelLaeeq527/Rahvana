// CRUD Operations - Journey Data Access
import { createClient } from "../supabase/server";
import {
  Journey,
  Chapter,
  JourneyInput,
  JourneyUpdate,
  ChapterInput,
  ChapterUpdate,
  ProgressData,
  StepInput,
  Step,
  StepUpdate,
} from "./types";

// Helper: Get authenticated Supabase client - Throws "Unauthorized" if no user session
async function getSupabaseWithUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  return { supabase, user };
}

// Journey Operations
// Create a new journey for the user
export async function createJourneyDB(
  journeyData: JourneyInput,
): Promise<Journey> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("journeys")
    .insert([
      {
        user_id: user.id,
        journey_type: journeyData.journey_type,
        case_id: journeyData.case_id,
        filing_method: journeyData.filing_method,
        sponsor_structure: journeyData.sponsor_structure,
        status: "not_started", // Default status on creation
        current_chapter_id: null,
        current_step_id: null,
        total_steps_count: 0,
        completed_steps_count: 0,
        completion_percentage: 0,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Journey;
}

// Get a specific journey by ID
export async function getJourneyDB(journeyId: string): Promise<Journey | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw new Error(error.message);
  }

  return data as Journey;
}

/**
 * Get all journeys for current user with optional filtering
 * @param filters - Optional status, journey_type, limit, offset
 * @returns Array of Journeys
 */
export async function getAllJourneysDB(filters?: {
  status?: string;
  journey_type?: string;
  limit?: number;
  offset?: number;
}): Promise<Journey[]> {
  const { supabase, user } = await getSupabaseWithUser();

  let query = supabase
    .from("journeys")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.journey_type) {
    query = query.eq("journey_type", filters.journey_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1,
    );
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data as Journey[]) || [];
}

// Fetch latest in-progress journey
export async function getLatestInProgressJourneyDB(): Promise<Journey | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw new Error(error.message);
  }

  return data as Journey;
}

// Update journey details
export async function updateJourneyDB(
  journeyId: string,
  updates: JourneyUpdate,
): Promise<Journey> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if journey exists and belongs to user before updating
  const existing = await getJourneyDB(journeyId);
  if (!existing) throw new Error("Journey not found or not owned");

  const { data, error } = await supabase
    .from("journeys")
    .update({
      ...(updates.filing_method !== undefined && {
        filing_method: updates.filing_method,
      }),
      ...(updates.sponsor_structure !== undefined && {
        sponsor_structure: updates.sponsor_structure,
      }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.current_chapter_id !== undefined && {
        current_chapter_id: updates.current_chapter_id,
      }),
      ...(updates.current_step_id !== undefined && {
        current_step_id: updates.current_step_id,
      }),
      ...(updates.started_at !== undefined && {
        started_at: updates.started_at,
      }),
    })
    .eq("id", journeyId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Journey;
}

// Delete a journey
export async function deleteJourneyDB(journeyId: string): Promise<boolean> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if journey exists and belongs to user before deleting
  const existing = await getJourneyDB(journeyId);
  if (!existing) throw new Error("Journey not found or not owned");

  const { error } = await supabase
    .from("journeys")
    .delete()
    .eq("id", journeyId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  return true;
}

// Delete all journeys for a user
export async function deleteAllJourneysDB(): Promise<number> {
  const { supabase, user } = await getSupabaseWithUser();

  // Fetch all user journeys
  const { data: journeys, error: fetchError } = await supabase
    .from("journeys")
    .select("id")
    .eq("user_id", user.id);

  if (fetchError) throw new Error(fetchError.message);

  if (!journeys || journeys.length === 0) {
    return 0; // No journeys to delete
  }

  const { error: deleteError, count } = await supabase
    .from("journeys")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) throw new Error(deleteError.message);

  return count || 0; // Return number of deleted journeys
}

// Update journey progress
export async function updateJourneyProgressDB(
  journeyId: string,
  progressData: ProgressData,
): Promise<void> {
  const { supabase, user } = await getSupabaseWithUser();

  const { error } = await supabase
    .from("journeys")
    .update({
      total_steps_count: progressData.total_steps_count,
      completed_steps_count: progressData.completed_steps_count,
      completion_percentage: progressData.completion_percentage,
    })
    .eq("id", journeyId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

// Chapter Operations
// Create a new chapter for a journey
export async function createChapterDB(
  journeyId: string,
  chapterData: ChapterInput,
): Promise<Chapter> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if journey exists and belongs to user before adding chapter
  const existingJourney = await getJourneyDB(journeyId);
  if (!existingJourney) throw new Error("Journey not found or not owned");

  // Create new chapter
  const { data, error } = await supabase
    .from("chapters")
    .insert([
      {
        journey_id: journeyId,
        chapter_key: chapterData.chapter_key,
        chapter_number: chapterData.chapter_number,
        chapter_name: chapterData.chapter_name,
        chapter_description: chapterData.chapter_description || null,
        display_order: chapterData.display_order || chapterData.chapter_number,
        visible_when: chapterData.visible_when || {},
        status: "not_started",
        is_visible: true,
        total_steps_count: 0,
        completed_steps_count: 0,
        completion_percentage: 0,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Chapter;
}

export async function getChapterDB(chapterId: string): Promise<Chapter | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("chapters")
    .select(
      `
        *,
        journeys!inner(user_id)
      `,
    )
    .eq("id", chapterId)
    .eq("journeys.user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  // Extract chapter from response
  const chapterData = data as any;
  delete chapterData.journeys; // Remove joined data
  return chapterData as Chapter;
}

/**
 * Get all chapters for a journey
 * @param journeyId - Parent journey UUID
 * @param filters - Optional status, limit, offset
 * @returns Array of Chapters
 */
export async function getChaptersForJourneyDB(
  journeyId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  },
): Promise<Chapter[]> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if journey exists and belongs to user before fetching chapters
  const journey = await getJourneyDB(journeyId);
  if (!journey) throw new Error("Journey not found or not owned");

  let query = supabase
    .from("chapters")
    .select("*")
    .eq("journey_id", journeyId)
    .order("chapter_number", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset && filters.limit) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data as Chapter[]) || [];
}

//   Update chapter details
export async function updateChapterDB(
  chapterId: string,
  updates: ChapterUpdate,
): Promise<Chapter> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if chapter exists
  const existing = await getChapterDB(chapterId);
  if (!existing) throw new Error("Chapter not found or not owned");

  const { data, error } = await supabase
    .from("chapters")
    .update({
      ...(updates.chapter_name !== undefined && {
        chapter_name: updates.chapter_name,
      }),
      ...(updates.chapter_description !== undefined && {
        chapter_description: updates.chapter_description,
      }),
      ...(updates.display_order !== undefined && {
        display_order: updates.display_order,
      }),
      ...(updates.visible_when !== undefined && {
        visible_when: updates.visible_when,
      }),
      ...(updates.is_visible !== undefined && {
        is_visible: updates.is_visible,
      }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.started_at !== undefined && {
        started_at: updates.started_at,
      }),
      ...(updates.completed_at !== undefined && {
        completed_at: updates.completed_at,
      }),
    })
    .eq("id", chapterId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Chapter;
}

//   Update chapter progress
export async function updateChapterProgressDB(
  chapterId: string,
  progressData: ProgressData,
): Promise<void> {
  const { supabase, user } = await getSupabaseWithUser();

  const { error } = await supabase
    .from("chapters")
    .update({
      total_steps_count: progressData.total_steps_count,
      completed_steps_count: progressData.completed_steps_count,
      completion_percentage: progressData.completion_percentage,
    })
    .eq("id", chapterId);

  if (error) throw new Error(error.message);
}

//   Delete a chapter
export async function deleteChapterDB(chapterId: string): Promise<boolean> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if chapter exists
  const existing = await getChapterDB(chapterId);
  if (!existing) throw new Error("Chapter not found or not owned");

  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", chapterId);

  if (error) throw new Error(error.message);

  return true;
}

// Step Operations
// Create a new step for a chapter
export async function createStepDB(
  chapterId: string,
  stepData: StepInput,
): Promise<Step> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if chapter exists
  const existingChapter = await getChapterDB(chapterId);
  if (!existingChapter) throw new Error("Chapter not found or not owned");

  const { data, error } = await supabase
    .from("steps")
    .insert([
      {
        chapter_id: chapterId,
        step_key: stepData.step_key,
        step_number: stepData.step_number,
        step_name: stepData.step_name,
        step_description: stepData.step_description || null,
        step_type: stepData.step_type,
        status: "not_started",
        substatus: null,
        completion_percentage: 0.0,
        display_order: stepData.display_order || stepData.step_number,
        is_visible: true,
        is_required: stepData.is_required !== false,
        visible_when: stepData.visible_when || null,
        visibility_rules: stepData.visibility_rules || null,
        dependencies: stepData.dependencies || [],
        tool_integration: stepData.tool_integration || null,
        tool_key: stepData.tool_key || null,
        estimated_duration_days: stepData.estimated_duration_days || null,
        started_at: null,
        completed_at: null,
        due_date: stepData.due_date || null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Step;
}

// Get a specific step by ID
export async function getStepDB(stepId: string): Promise<Step | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("steps")
    .select(
      `*,
    chapters!inner(
      id,
      journey_id,
      journeys!inner(user_id)
    )`,
    )
    .eq("id", stepId)
    .eq("chapters.journeys.user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  // Extract step from response and remove nested data
  const stepData = data as any;
  delete stepData.chapters;
  return stepData as Step;
}

// Get all steps for a chapter
export async function getStepsForChapterDB(
  chapterId: string,
  filters?: {
    status?: string;
    step_type?: string;
    limit?: number;
    offset?: number;
  },
): Promise<Step[]> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if chapter exists
  const existingChapter = await getChapterDB(chapterId);
  if (!existingChapter) throw new Error("Chapter not found or not owned");

  let query = supabase
    .from("steps")
    .select(
      `
      *,
      chapters!inner(
        journey_id,
        journeys!inner(user_id)
      )
    `,
    )
    .eq("chapter_id", chapterId)
    .eq("chapters.journeys.user_id", user.id)
    .order("display_order", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.step_type) {
    query = query.eq("step_type", filters.step_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset && filters.limit) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data as Step[]) || [];
}

// Get all steps for a journey (across chapters)
export async function getStepsForJourneyDB(
  journeyId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  },
): Promise<Step[]> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if chapter exists
  const existingJourney = await getJourneyDB(journeyId);
  if (!existingJourney) throw new Error("Journey not found or not owned");

  let query = supabase
    .from("steps")
    .select(
      `
      *,
      chapters!inner(
        journey_id,
      )
    `,
    )
    .eq("chapters.journey_id", journeyId)
    .order("display_order", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset && filters.limit) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  // Remove nested data
  const steps = (data as any[]) || [];
  return steps.map((s) => {
    delete s.chapters;
    return s as Step;
  });
}

// Get current step for a journey (first incomplete step)
export async function getCurrentStepForJourneyDB(
  journeyId: string,
): Promise<Step | null> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if journey exists
  const existingJourney = await getJourneyDB(journeyId);
  if (!existingJourney) throw new Error("Journey not found or not owned");

  const { data, error } = await supabase
    .from("steps")
    .select(`*, chapters!inner(journey_id)`)
    .eq("chapters.journey_id", journeyId)
    .eq("status", "not_started")
    .order("display_order", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  const stepData = data as any;
  delete stepData.chapters;
  return stepData as Step;
}

// Update Step
export async function updateStepDB(
  stepId: string,
  updates: StepUpdate,
): Promise<Step> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if step exists
  const existing = await getStepDB(stepId);
  if (!existing) throw new Error("Step not found or not owned");

  const { data, error } = await supabase
    .from("steps")
    .update({
      ...(updates.step_name && { step_name: updates.step_name }),
      ...(updates.step_description !== undefined && {
        step_description: updates.step_description,
      }),
      ...(updates.display_order && { display_order: updates.display_order }),
      ...(updates.is_required !== undefined && {
        is_required: updates.is_required,
      }),
      ...(updates.is_visible !== undefined && {
        is_visible: updates.is_visible,
      }),
      ...(updates.visible_when && { visible_when: updates.visible_when }),
      ...(updates.visibility_rules && {
        visibility_rules: updates.visibility_rules,
      }),
      ...(updates.dependencies && { dependencies: updates.dependencies }),
      ...(updates.tool_integration && {
        tool_integration: updates.tool_integration,
      }),
      ...(updates.tool_key && { tool_key: updates.tool_key }),
      ...(updates.status && { status: updates.status }),
      ...(updates.substatus && { substatus: updates.substatus }),
      ...(updates.completion_percentage !== undefined && {
        completion_percentage: updates.completion_percentage,
      }),
      ...(updates.estimated_duration_days && {
        estimated_duration_days: updates.estimated_duration_days,
      }),
      ...(updates.started_at && { started_at: updates.started_at }),
      ...(updates.completed_at && { completed_at: updates.completed_at }),
      ...(updates.due_date && { due_date: updates.due_date }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Step;
}

// Complete a step (mark as completed)
export async function completeStepDB(stepId: string): Promise<Step> {
  const { supabase, user } = await getSupabaseWithUser();

  // Check if step exists
  const existing = await getStepDB(stepId);
  if (!existing) throw new Error("Step not found or not owned");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("steps")
    .update({
      status: "completed",
      substatus: null,
      completion_percentage: 100,
      completed_at: now,
    })
    .eq("id", stepId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Step;
}

// Delete a step
export async function deleteStepDB(stepId: string): Promise<boolean> {
  const {supabase, user} = await getSupabaseWithUser();

  // Check if step exists
  const existing = await getStepDB(stepId);
  if (!existing) throw new Error("Step not found or not owned");

  const {error} = await supabase.from("steps").delete().eq("id", stepId);

  if (error) throw new Error(error.message);

  return true;
}
