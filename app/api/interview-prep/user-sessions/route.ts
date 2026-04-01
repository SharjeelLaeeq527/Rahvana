/**
 * GET /api/interview-prep/user-sessions
 * Get all interview preparation sessions for the current user
 * 
 * Query Parameters:
 * - completed: boolean (optional) - filter by completion status
 * - limit: number (optional) - limit number of results
 */

import { NextResponse, NextRequest } from "next/server";
import { getAllUserSessionsDB, getSessionAnswersDB, getInterviewResultsDB } from "@/lib/interview-prep/data-access";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const completedParam = searchParams.get("completed");
    const limitParam = searchParams.get("limit");
    
    const completed = completedParam ? completedParam === "true" : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get all user sessions with optional filters
    const sessions = await getAllUserSessionsDB(limit, completed);

    // Enrich sessions with answer counts and category information
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        try {
          const answers = await getSessionAnswersDB(session.id);
          const results = await getInterviewResultsDB(session.id);
          
          return {
            ...session,
            answerCount: answers?.length || 0,
            questionCount: results?.generated_questions?.length || 0,
            completionPercentage: results?.generated_questions 
              ? Math.round((answers?.length || 0) / (results.generated_questions.length) * 100)
              : 0,
          };
        } catch (error) {
          console.error(`Error enriching session ${session.id}:`, error);
          return {
            ...session,
            answerCount: 0,
            questionCount: 0,
            completionPercentage: 0,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      sessions: enrichedSessions,
      total: enrichedSessions.length,
    });
  } catch (error: any) {
    console.error("Error fetching user sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
