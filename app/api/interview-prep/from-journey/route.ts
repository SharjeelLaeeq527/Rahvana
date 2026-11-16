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
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journey_id, category_slug, candidate_id } = body;

    // Validate required fields
    if (!journey_id || !category_slug) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journey_id, category_slug]" }) },
        { status: 400 }
      );
    }

    // Validate journey belongs to current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id, user_id, journey_type")
      .eq("id", journey_id)
      .single();

    if (journeyError || !journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    if (journey.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - journey belongs to another user" },
        { status: 403 }
      );
    }

    // Create or get existing journey session
    const result = candidate_id
      ? await createJourneyInterviewSession(journey_id, category_slug, candidate_id)
      : await createJourneyInterviewSession(journey_id, category_slug);

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
  const candidate_id = searchParams.get("candidate_id") || undefined;

  if (!journey_id) {
    return NextResponse.json(
      { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journey_id]" }) },
      { status: 400 }
    );
  }

  try {
    // Validate journey belongs to current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id, user_id, journey_type, status")
      .eq("id", journey_id)
      .single();

    if (journeyError || !journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    if (journey.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - journey belongs to another user" },
        { status: 403 }
      );
    }

    // Get session (authentication handled by data-access)
    const session = await getInterviewSessionByJourney(journey_id, candidate_id);

    if (!session) {
      return NextResponse.json(
        {
          success: true,
          session: null,
          journey,
          reason: "No active session found for this journey",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
      journey,
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
