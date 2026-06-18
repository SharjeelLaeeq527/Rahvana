/**
 * API Route: Check Active Journey Session
 *
 * GET /api/interview-prep/active-journey-session
 *
 * Checks if the user has an active IR-1 journey with an associated interview session.
 * Used by the Interview Prep Tool to determine which session to use.
 *
 * Returns:
 * - { hasActiveJourney: true, session, journey_id } if active journey session exists
 * - { hasActiveJourney: false } if no active journey or no session
 */

import { NextResponse, NextRequest } from "next/server";
import { getActiveJourneyInterviewSession } from "@/lib/interview-prep/service";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const journey_type = searchParams.get("journey_type") || "IR1";

    const result = await getActiveJourneyInterviewSession(journey_type);

    if (!result) {
      return NextResponse.json({
        success: true,
        hasActiveJourney: false,
        session: null,
        journey_id: null,
        journey_status: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveJourney: true,
      session: result.session,
      journey_id: result.session.journey_id,
      journey_status: result.journey_status,
      source: "journey",
    });
  } catch (error) {
    console.error("Error checking active journey session:", error);
    return NextResponse.json({ error: msg(E.TOOL_INTERVIEW_SESSION_FAILED) }, { status: 500 });
  }
}
