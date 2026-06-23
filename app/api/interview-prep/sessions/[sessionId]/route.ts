/**
 * PUT/POST /api/interview-prep/sessions/[sessionId]
 * Handle session actions: update answers, generate results, complete session
 */

import { NextResponse, NextRequest } from "next/server";
import { E, msg } from "@/lib/errors";
import {
  getInterviewSession,
  updateInterviewSessionAnswers,
  generateInterviewPrepOutput,
  completeInterviewSession,
} from "@/lib/interview-prep/service";
import type { InterviewAnswer } from "@/lib/interview-prep/types";
import { getSessionAnswersDB, getInterviewResultsDB } from "@/lib/interview-prep/data-access";
import { resolveSessionAccess } from "@/lib/interview-prep/case-access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { action, answers } = body;

    // Verify session exists + the caller may act on it (owner OR shared-case
    // member — the petitioner editing the beneficiary's shared interview).
    const access = await resolveSessionAccess(sessionId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    // Handle different actions
    switch (action) {
      case "update-answers": {
        if (!answers || typeof answers !== "object") {
          return NextResponse.json({ error: "Invalid answers data" }, { status: 400 });
        }

        const updatedSession = await updateInterviewSessionAnswers(sessionId, answers, acting);
        return NextResponse.json({ success: true, session: updatedSession });
      }

      case "generate": {
        const output = await generateInterviewPrepOutput(sessionId, acting);
        return NextResponse.json({ success: true, output });
      }

      case "complete": {
        const completedSession = await completeInterviewSession(sessionId, acting);
        return NextResponse.json({ success: true, session: completedSession });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling session action:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Owner OR shared-case member may read the session.
    const access = await resolveSessionAccess(sessionId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    const session = await getInterviewSession(sessionId, acting);

    if (!session) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    // Load answers and results for this session
    let answers: InterviewAnswer[] = [];
    let results: any = null;

    try {
      answers = await getSessionAnswersDB(sessionId, acting);
    } catch (err) {
      console.error("Error loading answers:", err);
    }

    try {
      results = await getInterviewResultsDB(sessionId, acting);
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
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
