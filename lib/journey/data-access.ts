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
