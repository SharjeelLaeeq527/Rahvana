import { NextRequest, NextResponse } from "next/server";
import { stepService } from "@/lib/journey/service";
import * as db from "@/lib/journey/data-access";
import type { StepUpdate } from "@/lib/journey/types";

// GET /api/steps/[id] - Get step details
// TODO: Will do later on when we will work on case_data table.

// PATCH /api/steps/[id] - Update step details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stepId = (await params).id;
    const updates: StepUpdate = await request.json();

    const result = await stepService.updateStep(stepId, updates);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in PATCH /api/steps/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Step not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update step",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/steps/[id]/complete - Mark step as completed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stepId = (await params).id;
    const action = request.nextUrl.searchParams.get("action");

    if (action !== "complete") {
      return NextResponse.json(
        { error: "Unknown action", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const body: any = await request.json();

    // Get step to find its journey context
    const step = await db.getStepDB(stepId);
    if (!step) {
      return NextResponse.json(
        { error: "Step not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Get chapter to find journey
    const chapter = await db.getChapterDB(step.chapter_id);
    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Complete step with journey context
    const result = await stepService.completeStep(
      stepId,
      chapter.journey_id,
      body,
    );

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in POST /api/steps/[id]/complete:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("already completed")) {
      return NextResponse.json(
        {
          error: "Step is already completed",
          code: "INVALID_STATE",
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Cannot complete step")
    ) {
      return NextResponse.json(
        {
          error: error.message,
          code: "DEPENDENCY_ERROR",
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Validation failed")) {
      return NextResponse.json(
        {
          error: error.message,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to complete step",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/steps/[id] - Delete a step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stepId = (await params).id;

    // Check if step exists
    const step = await db.getStepDB(stepId);
    if (!step) {
      return NextResponse.json(
        { error: "Step not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Delete step
    await db.deleteStepDB(stepId);

    return NextResponse.json(
      {
        success: true,
        data: {
          deleted_id: stepId,
          message: "Step deleted successfully",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error in DELETE /api/steps/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete step",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
