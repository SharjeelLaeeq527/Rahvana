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