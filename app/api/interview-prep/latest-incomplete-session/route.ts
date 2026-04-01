/**
 * GET /api/interview-prep/latest-incomplete-session
 * Get the latest incomplete session for the current user
 * Allows resuming from where they left off
 */

import { NextResponse } from "next/server";
import { getLatestIncompleteSessionDB, getSessionAnswersDB, getInterviewResultsDB } from "@/lib/interview-prep/data-access";

export async function GET() {
  try {
    // Get the latest incomplete session for the current user
    const session = await getLatestIncompleteSessionDB();

    if (!session) {
      return NextResponse.json({
        success: false,
        session: null,
        message: "No incomplete session found"
      });
    }

    // Get the answers for this session
    const answers = await getSessionAnswersDB(session.id);

    // Get generated results if available
    const results = await getInterviewResultsDB(session.id);

    // Format results in InterviewPrepOutput format if they exist
    let formattedResults = null;
    if (results && results.generated_questions) {
      formattedResults = {
        sessionId: session.id,
        questions: results.generated_questions,
        summary: {
          totalQuestions: results.generated_questions.length,
          applicableQuestions: results.generated_questions.length,
          categories: Array.from(
            new Set((results.generated_questions as any[]).map((q: any) => q.category))
          ),
        },
      };
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        answers,
        results: formattedResults
      }
    });
  } catch (error) {
    console.error("Error fetching latest incomplete session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
