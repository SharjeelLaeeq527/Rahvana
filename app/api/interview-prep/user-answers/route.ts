/**
 * POST/GET /api/interview-prep/user-answers
 * Handle user answer operations: save and retrieve answers
*/

import { NextResponse, NextRequest } from "next/server";
import {
  saveUserAnswerDB,
  getUserAnswersForSessionDB,
  getUserAnswerDB,
} from "@/lib/interview-prep/data-access";

/**
 * POST /api/interview-prep/user-answers
 * Save a user's answer to a question
 * 
 * Body:
 * - sessionId: string
 * - questionId: string
 * - userAnswerText: string
 * - confidenceScore?: number (1-10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, userAnswerText, confidenceScore } = body;

    // Validate required fields
    if (!sessionId || !questionId || !userAnswerText) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sessionId, questionId, userAnswerText",
        },
        { status: 400 }
      );
    }

    // Validate answer text length
    if (userAnswerText.trim().length < 10) {
      return NextResponse.json(
        { error: "Answer must be at least 10 characters long" },
        { status: 400 }
      );
    }

    // Save answer
    const savedAnswer = await saveUserAnswerDB(
      sessionId,
      questionId,
      userAnswerText,
      confidenceScore
    );

    return NextResponse.json({ success: true, answer: savedAnswer }, { status: 201 });
  } catch (error) {
    console.error("Error saving user answer:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/interview-prep/user-answers?sessionId={id}
 * Get all saved answers for a session
 * 
 * OR
 * 
 * GET /api/interview-prep/user-answers?sessionId={id}&questionId={id}
 * Get a single answer for a specific question
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const questionId = searchParams.get("questionId");

    // Validate required parameter
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // If questionId is provided, get single answer
    if (questionId) {
      const answer = await getUserAnswerDB(sessionId, questionId);
      return NextResponse.json({ success: true, answer }, { status: 200 });
    }

    // Otherwise get all answers for session
    const answers = await getUserAnswersForSessionDB(sessionId);
    return NextResponse.json({ success: true, answers }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving user answers:", error);
    const message =
      error instanceof Error ? error.message : "Failed to retrieve answers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
