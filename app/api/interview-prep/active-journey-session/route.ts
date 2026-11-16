/**
 * API Route: Get Journey Interview Session
 *
 * GET /api/interview-prep/active-journey-session?journey_id=<uuid>
 *
 * Retrieves the interview session for a specific journey.
 * Requires journey_id parameter to identify which journey.
 * Authentication handled by data-access layer.
 *
 * Returns:
 * - { hasActiveJourney: true, session, journey_id } if session exists
 * - { hasActiveJourney: false } if no session found
 */

import { NextResponse, NextRequest } from "next/server";
import { getInterviewSessionByJourney } from "@/lib/interview-prep/service";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const journey_id = searchParams.get("journey_id");
    const candidate_id = searchParams.get("candidate_id") || undefined;

    // Require journey_id parameter
    if (!journey_id) {
      return NextResponse.json(
        { error: 'journey_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get session by specific journey ID (and optional candidate ID)
    const result = await getInterviewSessionByJourney(journey_id, candidate_id);

    if (!result) {
      return NextResponse.json({
        success: true,
        hasActiveJourney: false,
        session: null,
        journey_id: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveJourney: true,
      session: result,
      journey_id: result.journey_id,
      source: "journey",
    });
  } catch (error) {
    console.error("Error checking active journey session:", error);
    return NextResponse.json({ error: msg(E.TOOL_INTERVIEW_SESSION_FAILED) }, { status: 500 });
  }
}