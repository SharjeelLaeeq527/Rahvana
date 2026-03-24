import { createClient } from "@/lib/supabase/server";
import {
  CreateSessionRequest,
  SaveAnswersRequest,
  CaseType,
  RiskLevel,
} from "./types";

export class VisaCheckerSupabaseService {
  // ------------------------------
  // CREATE SESSION
  // ------------------------------
  static async createSession(request: CreateSessionRequest) {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_case_sessions")
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || null,
        case_type: request.caseType,
        risk_level: "PENDING",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);

    return {
      sessionId: data.id,
      message: "Assessment session created successfully",
    };
  }

  // ------------------------------
  // SAVE ANSWERS
  // ------------------------------
  static async saveAnswers(sessionId: string, answers: SaveAnswersRequest["answers"]) {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    // Verify session ownership
    const { data: session } = await supabase
      .from("user_case_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();
    if (!session || session.user_id !== user.id) throw new Error("Unauthorized");

    // Delete existing answers
    const { error: deleteError } = await supabase
      .from("user_case_answers")
      .delete()
      .eq("session_id", sessionId);
    if (deleteError) throw new Error(`Failed to delete existing answers: ${deleteError.message}`);

    // Insert new answers
    const answerRecords = Object.entries(answers).map(([key, value]) => ({
      session_id: sessionId,
      question_key: key,
      answer_value: value,
    }));

    if (answerRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("user_case_answers")
        .insert(answerRecords);
      if (insertError) throw new Error(`Failed to save answers: ${insertError.message}`);
    }

    return { message: "Answers saved successfully", sessionId };
  }

  // ------------------------------
  // GET SESSION DETAILS
  // ------------------------------
  static async getSessionDetails(sessionId: string) {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_case_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    
    if (sessionError) throw new Error(`Failed to get session: ${sessionError.message}`);
    if (!sessionData) throw new Error("Assessment session not found. It might have been deleted or not created correctly.");
    if (sessionData.user_id !== user.id) throw new Error("Unauthorized: You do not have permission to view this session.");

    const { data: answersData, error: answersError } = await supabase
      .from("user_case_answers")
      .select("question_key, answer_value")
      .eq("session_id", sessionId);
    if (answersError) throw new Error(`Failed to get answers: ${answersError.message}`);

    const answers: Record<string, unknown> = {};
    answersData?.forEach((item) => {
      answers[item.question_key] = item.answer_value;
    });

    return {
      sessionId: sessionData.id,
      userId: sessionData.user_id,
      userEmail: sessionData.user_email,
      userName: sessionData.user_name,
      caseType: sessionData.case_type as CaseType,
      overallScore: sessionData.overall_score,
      riskLevel: sessionData.risk_level as RiskLevel,
      completed: sessionData.completed,
      answers,
      createdAt: sessionData.created_at,
      updatedAt: sessionData.updated_at,
    };
  }

  // ------------------------------
  // SUBMIT FOR SCORING
  // ------------------------------
  static async submitForScoring(sessionId: string) {
    const supabase = await createClient();

    const sessionDetails = await this.getSessionDetails(sessionId);

    const {
      totalScore,
      allRisks,
      riskLevel,
      summaryReasons,
      improvementSuggestions,
    } = await import("./scoring-rules").then((rules) =>
      rules.ScoringRules.calculateTotalScore(sessionDetails.answers),
    );

    const { error: updateError } = await supabase
      .from("user_case_sessions")
      .update({
        overall_score: totalScore,
        risk_level: riskLevel,
        summary_reasons: summaryReasons,
        improvement_suggestions: improvementSuggestions,
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    if (updateError) throw new Error(`Failed to update session: ${updateError.message}`);

    // Delete existing risk flags
    const { error: deleteFlagsError } = await supabase
      .from("risk_flags")
      .delete()
      .eq("session_id", sessionId);
    if (deleteFlagsError) throw new Error(`Failed to clear risk flags: ${deleteFlagsError.message}`);

    if (allRisks.length > 0) {
      const { RISK_POINTS_DEDUCTION } = await import("./scoring-config");
      const flagRecords = allRisks.map((flag) => ({
        session_id: sessionId,
        flag_code: flag.flagCode,
        severity: flag.severity,
        points_deducted: RISK_POINTS_DEDUCTION[flag.severity],
        explanation: flag.explanation,
        improvement_suggestions: flag.improvement,
        improvement_priority: this.getPriorityNumber(flag.severity),
      }));

      const { error: insertFlagsError } = await supabase
        .from("risk_flags")
        .insert(flagRecords);
      if (insertFlagsError) throw new Error(`Failed to save risk flags: ${insertFlagsError.message}`);
    }

    return {
      sessionId,
      overallScore: totalScore,
      riskLevel,
      riskFlags: allRisks,
      summaryReasons,
      improvementSuggestions,
    };
  }

  // ------------------------------
  // GET SCORING RESULTS
  // ------------------------------
  static async getScoringResults(sessionId: string) {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_case_sessions")
      .select(
        "id, user_id, overall_score, risk_level, summary_reasons, improvement_suggestions, updated_at, completed",
      )
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) {
      throw new Error(`Database error while fetching results: ${sessionError.message}`);
    }

    if (!sessionData) {
      throw new Error("This assessment session no longer exists. Please start a new analysis.");
    }

    if (sessionData.user_id !== user.id) {
      throw new Error("Unauthorized: These results belong to another user.");
    }

    if (!sessionData.completed) {
      throw new Error("This session has not been submitted for analysis yet. Please complete the review step.");
    }

    const { data: riskFlagsData, error: flagsError } = await supabase
      .from("risk_flags")
      .select("*")
      .eq("session_id", sessionId)
      .order("points_deducted", { ascending: false });
    if (flagsError) throw new Error(`Failed to get risk flags: ${flagsError.message}`);

    return {
      sessionId: sessionData.id,
      overallScore: sessionData.overall_score,
      riskLevel: sessionData.risk_level as RiskLevel,
      completedAt: sessionData.updated_at,
      riskFlags: riskFlagsData.map((flag) => ({
        flagCode: flag.flag_code,
        severity: flag.severity,
        pointsDeducted: flag.points_deducted,
        explanation: flag.explanation,
        improvementSuggestions: flag.improvement_suggestions,
      })),
      summaryReasons: sessionData.summary_reasons || [],
      improvementSuggestions: sessionData.improvement_suggestions || [],
    };
  }

  // ------------------------------
  // DELETE SESSION
  // ------------------------------
  static async deleteSession(sessionId: string) {
    const supabase = await createClient();

    const { error: flagsError } = await supabase
      .from("risk_flags")
      .delete()
      .eq("session_id", sessionId);
    if (flagsError) throw new Error(`Failed to delete risk flags: ${flagsError.message}`);

    const { error: answersError } = await supabase
      .from("user_case_answers")
      .delete()
      .eq("session_id", sessionId);
    if (answersError) throw new Error(`Failed to delete answers: ${answersError.message}`);

    const { error: sessionError } = await supabase
      .from("user_case_sessions")
      .delete()
      .eq("id", sessionId);
    if (sessionError) throw new Error(`Failed to delete session: ${sessionError.message}`);

    return {
      sessionId,
      deleted: true,
      message: "Session deleted successfully",
    };
  }

  // ------------------------------
  // GET USER REQUESTS
  // ------------------------------
  static async getUserRequests(limit = 50, offset = 0) {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_case_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    return data.map((item) => ({
      sessionId: item.id,
      userEmail: item.user_email,
      userName: item.user_name,
      caseType: item.case_type as CaseType,
      overallScore: item.overall_score,
      riskLevel: item.risk_level as RiskLevel,
      completed: item.completed,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  // ------------------------------
  // HELPER: PRIORITY NUMBER
  // ------------------------------
  private static getPriorityNumber(severity: string): number {
    switch (severity) {
      case "HIGH":
        return 1;
      case "MEDIUM":
        return 2;
      case "LOW":
        return 3;
      default:
        return 3;
    }
  }
}