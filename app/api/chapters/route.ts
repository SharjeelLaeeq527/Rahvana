import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/journey/data-access";
import type { ChapterInput } from "@/lib/journey/types";

// GET /api/chapters?journey_id=uuid&status=optional_status - Get chapters for a journey, optionally filtered by status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const journeyId = searchParams.get("journey_id");
    const status = searchParams.get("status");

    // Validation: journey_id required
    if (!journeyId) {
      return NextResponse.json(
        {
          error: "journey_id query parameter is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Get chapters
    const chapters = await db.getChaptersForJourneyDB(journeyId, {
      status: status || undefined,
    });

    return NextResponse.json(
      { success: true, data: chapters },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/chapters:", error);

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
        error: "Failed to fetch chapters",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/chapters - Create a new chapter for a journey
export async function POST(request: NextRequest) {
  try {
    const body: ChapterInput & { journey_id: string } = await request.json();

    // Validation
    const requiredFields = [
      "journey_id",
      "chapter_key",
      "chapter_number",
      "chapter_name",
    ];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          {
            error: `${field} is required`,
            code: "VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }
    }

    // Validate chapter_number is positive integer
    if (!Number.isInteger(body.chapter_number) || body.chapter_number < 1) {
      return NextResponse.json(
        {
          error: "chapter_number must be a positive integer",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Create chapter
    const chapter = await db.createChapterDB(body.journey_id, {
      chapter_key: body.chapter_key,
      chapter_number: body.chapter_number,
      chapter_name: body.chapter_name,
      chapter_description: body.chapter_description,
      display_order: body.display_order,
      visible_when: body.visible_when,
    });

    return NextResponse.json({ success: true, data: chapter }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chapters:", error);

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
        error: "Failed to create chapter",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
