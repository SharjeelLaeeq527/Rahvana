import { NextRequest, NextResponse } from "next/server";
import { journeyService } from "@/lib/journey/service";
import type { JourneyInput, JourneyFilters } from "@/lib/journey/types";

// POST /api/journeys - Create a new journey
export async function POST(request: NextRequest) {
  try {
    const body: JourneyInput = await request.json();

    // Validation: required fields
    if (!body.journey_type) {
      return NextResponse.json(
        {
          error: "journey_type is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    if (!body.filing_method) {
      return NextResponse.json(
        {
          error: "filing_method is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    if (!body.sponsor_structure) {
      return NextResponse.json(
        {
          error: "sponsor_structure is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Validate journey_type
    const validJourneyTypes = ["IR1"];
    if (!validJourneyTypes.includes(body.journey_type)) {
      return NextResponse.json(
        {
          error: `journey_type must be one of: ${validJourneyTypes.join(", ")}`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Validate filing_method
    const validFilingMethods = ["online", "paper"];
    if (!validFilingMethods.includes(body.filing_method)) {
      return NextResponse.json(
        {
          error: `filing_method must be one of: ${validFilingMethods.join(", ")}`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Validate sponsor_structure
    const validSponsorStructures = ["individual", "joint_sponsor"];
    if (!validSponsorStructures.includes(body.sponsor_structure)) {
      return NextResponse.json(
        {
          error: `sponsor_structure must be one of: ${validSponsorStructures.join(", ")}`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Create the journey
    const result = await journeyService.createJourneyWithChapters(body);

    return NextResponse.json(
      { success: true, journey: result },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/journeys:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create journey",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/journeys - List journeys with optional filters
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const journeyType = searchParams.get("journey_type");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Build filters object
    const filters: JourneyFilters = {};
    if (status) filters.status = status as any;
    if (journeyType) filters.journey_type = journeyType;
    filters.limit = limit;
    filters.offset = offset;

    // Get journeys with progress
    const journeysWithProgress =
      await journeyService.getAllJourneysWithProgress();

    // Apply filters post-fetch
    let filtered = journeysWithProgress;
    if (status) {
      filtered = filtered.filter((j) => j.journey.status === status);
    }
    if (journeyType) {
      filtered = filtered.filter((j) => j.journey.journey_type === journeyType);
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginated,
        pagination: {
          total: filtered.length,
          limit,
          offset,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/journeys:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch journeys",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/journeys - Delete all journeys
export async function DELETE() {
  try {
    // Delete all journeys for the user
    const deletedCount = await journeyService.deleteAllUserJourneys();
    return NextResponse.json(
      {
        success: true,
        data: {
          deleted_count: deletedCount,
          message: `All ${deletedCount} journeys deleted successfully`,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/journeys:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete journeys",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
