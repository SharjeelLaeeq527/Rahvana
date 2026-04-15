import { NextRequest, NextResponse } from "next/server";
import { journeyService } from "@/lib/journey/service";
import type { JourneyFilters } from "@/lib/journey/types";

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
      const normalizedQuery = journeyType.toLowerCase().replace(/-/g, "");
      filtered = filtered.filter((j) => {
        const normalizedItem = j.journey.journey_type.toLowerCase().replace(/-/g, "");
        return normalizedItem === normalizedQuery;
      });
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
