import { NextRequest, NextResponse } from "next/server";
import { journeyService } from "@/lib/journey/service";
import type { JourneyUpdate } from "@/lib/journey/types";

// GET /api/journeys/[id] - Get journey details
// TODO: Will do later on when we will work on case_data table.

// PATCH /api/journeys/[id] - Update journey details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const journeyId = (await params).id;
    const updates: JourneyUpdate = await request.json();

    // Validate status if provided
    if (updates.status) {
      const validStatuses = [
        "not_started",
        "in_progress",
        "completed",
        "paused",
      ];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          {
            error: `status must be one of: ${validStatuses.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
          { status: 400 },
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
          { status: 400 },
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
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("Journey not found")) {
      return NextResponse.json(
        { error: "Journey not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update journey",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/journeys/[id] - Delete a journey
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const journeyId = (await params).id;

    const result = await journeyService.deleteJourney(journeyId);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/journeys/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("Journey not found")) {
      return NextResponse.json(
        { error: "Journey not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete journey",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
