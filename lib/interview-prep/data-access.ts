// lib/interview-prep/data-access.ts
import { createClient } from "../supabase/server";
import {
  InterviewSession,
  InterviewAnswer,
  InterviewResult,
  InterviewSessionInput,
} from "./types";

async function getSupabaseWithUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  return { supabase, user };
}

// Create new session
export async function createInterviewSessionDB(
  sessionData: Omit<InterviewSessionInput, "user_id">
): Promise<InterviewSession> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("interview_prep_sessions")
    .insert([
      {
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || null,
        category_slug: sessionData.category_slug,
        completed: false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as InterviewSession;
}

// Get session (enforce ownership)
export async function getInterviewSessionDB(
  sessionId: string
): Promise<InterviewSession | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("interview_prep_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as InterviewSession;
}

// Get latest incomplete session for current user
export async function getLatestIncompleteSessionDB(): Promise<InterviewSession | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("interview_prep_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as InterviewSession;
}

// Get all sessions for current user (with optional filters)
export async function getAllUserSessionsDB(
  limit?: number,
  completed?: boolean
): Promise<InterviewSession[]> {
  const { supabase, user } = await getSupabaseWithUser();

  let query = supabase
    .from("interview_prep_sessions")
    .select("*")
    .eq("user_id", user.id);

  // Optional filter by completion status
  if (completed !== undefined) {
    query = query.eq("completed", completed);
  }

  // Order by most recent first
  query = query.order("updated_at", { ascending: false });

  // Apply limit if specified
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data as InterviewSession[];
}

// Update session
export async function updateInterviewSessionDB(
  sessionId: string,
  updateData: Partial<InterviewSession>
): Promise<InterviewSession> {
  const { supabase, user } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("interview_prep_sessions")
    .update(updateData)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as InterviewSession;
}

// Save answers
export async function saveInterviewAnswersDB(
  sessionId: string,
  answers: Array<{ question_key: string; answer_value: unknown }>
) {
  const { supabase, user } = await getSupabaseWithUser();

  // Ensure session belongs to user
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  const answersToInsert = answers.map((a) => ({
    session_id: sessionId,
    question_key: a.question_key,
    answer_value: a.answer_value,
  }));

  const { error } = await supabase
    .from("interview_prep_answers")
    .upsert(answersToInsert, { onConflict: "session_id, question_key" });

  if (error) throw new Error(error.message);
}

// Get answers
export async function getSessionAnswersDB(
  sessionId: string
): Promise<InterviewAnswer[]> {
  const { supabase, user } = await getSupabaseWithUser();

  // Enforce ownership
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  const { data, error } = await supabase
    .from("interview_prep_answers")
    .select("*")
    .eq("session_id", sessionId);

  if (error) throw new Error(error.message);

  return data as InterviewAnswer[];
}

// Save results
export async function saveInterviewResultsDB(
  sessionId: string,
  generatedQuestions: unknown[]
): Promise<InterviewResult> {
  const { supabase, user } = await getSupabaseWithUser();

  // Ensure session ownership
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  const { data, error } = await supabase
    .from("interview_prep_results")
    .upsert({ session_id: sessionId, generated_questions: generatedQuestions }, { onConflict: "session_id" })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as InterviewResult;
}

// Get results
export async function getInterviewResultsDB(
  sessionId: string
): Promise<InterviewResult | null> {
  const { supabase, user } = await getSupabaseWithUser();

  const session = await getInterviewSessionDB(sessionId);
  if (!session) return null;

  const { data, error } = await supabase
    .from("interview_prep_results")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as InterviewResult;
}

// STEP 5: Save user answer text for interview question
export async function saveUserAnswerDB(
  sessionId: string,
  questionId: string,
  userAnswerText: string,
  confidenceScore?: number
): Promise<any> {
  const { supabase, user } = await getSupabaseWithUser();

  // Verify session ownership
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  const wordCount = userAnswerText.trim().split(/\s+/).length;

  const { data, error } = await supabase
    .from("interview_user_answers")
    .upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        user_answer_text: userAnswerText,
        confidence_score: confidenceScore || null,
        word_count: wordCount,
        status: "saved",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "session_id,question_id",
      }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

// STEP 5: Get user's saved answers for a session
export async function getUserAnswersForSessionDB(
  sessionId: string
): Promise<any[]> {
  const { supabase, user } = await getSupabaseWithUser();

  // Verify session ownership
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  const { data, error } = await supabase
    .from("interview_user_answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return data || [];
}

// STEP 5: Get single user answer for a question
export async function getUserAnswerDB(
  sessionId: string,
  questionId: string
): Promise<any | null> {
  const { supabase, user } = await getSupabaseWithUser();

  // Verify session ownership
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  const { data, error } = await supabase
    .from("interview_user_answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data;
}

// STEP 5: Save AI improvement suggestion
export async function saveAIImprovementDB(
  sessionId: string,
  questionId: string,
  originalAnswer: string,
  improvedAnswer: string,
  improvementType: string
): Promise<any> {
  const { supabase, user } = await getSupabaseWithUser();

  // Verify session ownership
  const session = await getInterviewSessionDB(sessionId);
  if (!session) throw new Error("Session not found");

  // Get current answer with improvements
  const currentAnswer = await getUserAnswerDB(sessionId, questionId);

  if (!currentAnswer) throw new Error("Answer not found");

  const improvements = currentAnswer.ai_improvements || [];
  improvements.push({
    version: improvements.length + 1,
    originalAnswer,
    improvedAnswer,
    improvementType,
    acceptedAt: null,
    generatedAt: new Date().toISOString(),
  });

  // Update answer with new improvement
  const { data, error } = await supabase
    .from("interview_user_answers")
    .update({
      ai_improvements: improvements,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}