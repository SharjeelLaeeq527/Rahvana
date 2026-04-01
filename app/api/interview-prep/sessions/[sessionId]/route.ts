/**
 * PUT/POST /api/interview-prep/sessions/[sessionId]
 * Handle session actions: update answers, generate results, complete session
 */

import { NextResponse, NextRequest } from "next/server";
import {
  getInterviewSession,
  updateInterviewSessionAnswers,
  generateInterviewPrepOutput,
  completeInterviewSession,
} from "@/lib/interview-prep/service";
import {
  getSessionAnswersDB,
  getInterviewResultsDB,
} from "@/lib/interview-prep/data-access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { action, answers } = body;

    // Verify session exists
    if (!sessionId || sessionId === "undefined") {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 },
      );
    }

    const session = await getInterviewSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case "update-answers": {
        if (!answers || typeof answers !== "object") {
          return NextResponse.json(
            { error: "Invalid answers data" },
            { status: 400 },
          );
        }

        const updatedSession = await updateInterviewSessionAnswers(
          sessionId,
          answers,
        );
        return NextResponse.json({ success: true, session: updatedSession });
      }

      case "generate": {
        const output = await generateInterviewPrepOutput(sessionId);
        return NextResponse.json({ success: true, output });
      }

      case "complete": {
        const completedSession = await completeInterviewSession(sessionId);
        return NextResponse.json({ success: true, session: completedSession });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error handling session action:", error);
    return NextResponse.json(
      { error: "Failed to process session action" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 },
      );
    }

    const session = await getInterviewSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Load answers and results for this session
    let answers = [];
    let results = null;

    try {
      answers = await getSessionAnswersDB(sessionId);
    } catch (err) {
      console.error("Error loading answers:", err);
    }

    try {
      results = await getInterviewResultsDB(sessionId);
    } catch (err) {
      console.error("Error loading results:", err);
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        answers,
        interview_prep_results: results,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 },
    );
  }
}
