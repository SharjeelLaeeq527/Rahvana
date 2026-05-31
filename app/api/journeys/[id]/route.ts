import { NextRequest, NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import { journeyService } from "@/lib/journey/service";
import * as db from "@/lib/journey/data-access";
import { progressService } from "@/lib/journey/service";
import type { JourneyUpdate } from "@/lib/journey/types";

// GET /api/journeys/[id] - Get journey details with chapters, steps, and case_data
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const journeyId = (await params).id;

    // Get journey
    const journey = await db.getJourneyDB(journeyId);
    if (!journey) {
      return NextResponse.json(
        { error: msg(E.JOURNEY_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get chapters
    const chapters = await db.getChaptersForJourneyDB(journeyId);

    // Get all steps for journey
    const steps = await db.getStepsForJourneyDB(journeyId);

    // Get case data
    const caseData = await db.getCaseDataForJourneyDB(journeyId);

    // Get progress summary
    const progressSummary = await progressService.getJourneyProgressSummary(journeyId);

    return NextResponse.json(
      {
        success: true,
        data: {
          journey,
          chapters,
          steps,
          case_data: caseData,
          progress_summary: progressSummary,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in GET /api/journeys/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: msg(E.JOURNEYS_FETCH_FAILED),
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/journeys/[id] - Update journey details
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const journeyId = (await params).id;
    const updates: JourneyUpdate = await request.json();

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["not_started", "in_progress", "completed", "paused"];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          {
            error: `status must be one of: ${validStatuses.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }
    }

    // Validate filing_method if provided
    if (updates.filing_method) {
      const validFilingMethods = ["online", "paper"];
      if (!validFilingMethods.includes(updates.filing_method)) {
        return NextResponse.json(
          {
            error: `filing_method must be one of: ${validFilingMethods.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }
    }

    // Update journey
    const result = await journeyService.updateJourney(journeyId, updates);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in PATCH /api/journeys/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message?.includes("Journey not found")) {
      return NextResponse.json(
        { error: msg(E.JOURNEY_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: msg(E.CHAPTER_SERVER_ERROR),
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/journeys/[id] - Delete a journey
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const journeyId = (await params).id;

    const result = await journeyService.deleteJourney(journeyId);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/journeys/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message?.includes("Journey not found")) {
      return NextResponse.json(
        { error: msg(E.JOURNEY_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: msg(E.JOURNEYS_DELETE_FAILED),
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
