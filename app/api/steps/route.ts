import { NextRequest, NextResponse } from "next/server";
import { stepService } from "@/lib/journey/service";
import type { StepInput } from "@/lib/journey/types";

// POST /api/steps - Create a new step
export async function POST(request: NextRequest) {
  try {
    const body: StepInput = await request.json();

    // Extract chapter_id from query or body
    let chapterId = request.nextUrl.searchParams.get("chapter_id");
    if (!chapterId && body) {
      chapterId = (body as any).chapter_id;
    }

    if (!chapterId) {
      return NextResponse.json(
        {
          error: "chapter_id is required (as query param or in body)",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!body.step_key) {
      return NextResponse.json(
        { error: "step_key is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    if (body.step_number === undefined || body.step_number === null) {
      return NextResponse.json(
        { error: "step_number is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    if (!body.step_name) {
      return NextResponse.json(
        { error: "step_name is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    if (!body.step_type) {
      return NextResponse.json(
        { error: "step_type is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // Create step
    const result = await stepService.createStep(chapterId, body);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/steps:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("Chapter not found")) {
      return NextResponse.json(
        { error: "Chapter not found or not owned", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create step",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/steps - Get all steps for a chapter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapterId = searchParams.get("chapter_id");
    const status = searchParams.get("status");
    const stepType = searchParams.get("step_type");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : undefined;

    if (!chapterId) {
      return NextResponse.json(
        {
          error: "chapter_id query parameter is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Get steps
    const steps = await stepService.getChapterSteps(chapterId, {
      status: status || undefined,
      step_type: stepType || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: steps }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/steps:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("Chapter not found")) {
      return NextResponse.json(
        { error: "Chapter not found or not owned", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch steps",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
