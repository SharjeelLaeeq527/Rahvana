import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/journey/data-access";
import type { ChapterUpdate } from "@/lib/journey/types";

// GET /api/chapters/[id] - Get chapter by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const chapterId = params.id;

    const chapter = await db.getChapterDB(chapterId);
    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: chapter }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/chapters/[id]:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch chapter",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/chapters/[id] - Update chapter by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const chapterId = params.id;
    const updates: ChapterUpdate = await request.json();

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["not_started", "in_progress", "completed"];
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

    // Update chapter
    const chapter = await db.updateChapterDB(chapterId, updates);

    return NextResponse.json({ success: true, data: chapter }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/chapters/[id]:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("Chapter not found")) {
      return NextResponse.json(
        { error: "Chapter not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update chapter",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/chapters/[id] - Delete chapter by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const chapterId = params.id;

    const success = await db.deleteChapterDB(chapterId);

    return NextResponse.json(
      {
        success: true,
        message: "Chapter deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/chapters/[id]:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes("Chapter not found")) {
      return NextResponse.json(
        { error: "Chapter not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete chapter",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
