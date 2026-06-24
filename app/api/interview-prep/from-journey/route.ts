/**
 * API Route: Create Interview Session from Journey
 *
 * POST /api/interview-prep/from-journey
 *
 * This endpoint is called automatically when a journey (e.g., IR-1) is initialized.
 * It creates an interview session linked to the journey with:
 * - source: "journey"
 * - status: "ready" (questionnaire NOT started automatically)
 *
 * Business Rules:
 * - One interview session per journey
 * - Session is only accessible while journey is active
 * - Questionnaire flow is NOT triggered - user must explicitly start it
 */

import { NextResponse, NextRequest } from "next/server";
import {
  createJourneyInterviewSession,
  getInterviewSessionByJourney,
} from "@/lib/interview-prep/service";
import { verifyAuth } from "@/lib/api/journey-auth";
import { getAdminClient, getCaseRole } from "@/lib/case-collaboration/helpers";
import { E, msg } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journey_id, category_slug } = body;

    // Validate required fields
    if (!journey_id) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journey_id]" }) },
        { status: 400 }
      );
    }

    // There is ONE shared interview per case, owned by the BENEFICIARY. Both
    // spouses can view/edit/practise it (the petitioner does so via the shared
    // /api/case/interview load + the service-role "acting" write path). We still
    // block a PETITIONER from auto-creating a SEPARATE journey session here, so a
    // petitioner-owner's auto-init can't spawn a parallel/duplicate session — the
    // canonical session stays the beneficiary's.
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const role = await getCaseRole(getAdminClient(), journey_id, auth.user.id);
    if (role === "petitioner") {
      return NextResponse.json(
        {
          error:
            "The shared interview belongs to the beneficiary's session; it is not created from the petitioner side.",
        },
        { status: 403 }
      );
    }

    // Default to IR-1 spouse category if not specified
    const effectiveCategory = category_slug || "ir-1-spouse";

    // Create or get existing journey session
    const result = await createJourneyInterviewSession(journey_id, effectiveCategory);

    return NextResponse.json(
      {
        success: true,
        alreadyExists: result.alreadyExists,
        session: result.session,
        source: "journey",
      },
      {
        status: result.alreadyExists ? 200 : 201,
      }
    );
  } catch (error) {
    console.error("Error creating journey interview session:", error);
    return NextResponse.json({ error: msg(E.TOOL_INTERVIEW_SESSION_FAILED) }, { status: 500 });
  }
}

/**
 * GET /api/interview-prep/from-journey?journey_id={id}
 *
 * Retrieve the interview session associated with a journey.
 * Returns null if journey is inactive/completed.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const journey_id = searchParams.get("journey_id");

  if (!journey_id) {
    return NextResponse.json(
      { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journey_id]" }) },
      { status: 400 }
    );
  }

  try {
    const session = await getInterviewSessionByJourney(journey_id);

    if (!session) {
      // Either no session exists or journey is inactive
      return NextResponse.json(
        {
          success: true,
          session: null,
          reason: "No active session found for this journey",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
      source: "journey",
    });
  } catch (error) {
    console.error("Error fetching journey interview session:", error);
    return NextResponse.json(
      { error: "Failed to fetch journey interview session" },
      { status: 500 }
    );
  }
}
