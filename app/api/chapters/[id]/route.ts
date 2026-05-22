import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/journey/data-access";
import type { ChapterUpdate } from "@/lib/journey/types";
import { E, msg, normalizeError } from '@/lib/errors';

// GET /api/chapters/[id] - Get chapter by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const chapterId = params.id;

    const chapter = await db.getChapterDB(chapterId);
    if (!chapter) {
      console.error('chapters/[id] GET chapter not found:', chapterId);
      return NextResponse.json({ error: msg(E.CHAPTER_NOT_FOUND), code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: chapter }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/chapters/[id]:", error);

    const norm = normalizeError(error, E.CHAPTER_SERVER_ERROR);

    if (norm.code === E.AUTH_UNAUTHORIZED) {
      console.error('chapters/[id] unauthorized error');
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED), code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (norm.code === E.CHAPTER_NOT_FOUND) {
      console.error('chapters/[id] chapter not found:', error);
      return NextResponse.json({ error: msg(E.CHAPTER_NOT_FOUND), code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: msg(E.CHAPTER_SERVER_ERROR),
        code: "SERVER_ERROR",
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

    const norm = normalizeError(error, E.CHAPTER_SERVER_ERROR);

    if (norm.code === E.AUTH_UNAUTHORIZED) {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (norm.code === E.CHAPTER_NOT_FOUND) {
      console.error('chapters/[id] chapter not found (caught):', error);
      return NextResponse.json({ error: msg(E.CHAPTER_NOT_FOUND), code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: msg(E.CHAPTER_SERVER_ERROR),
        code: "SERVER_ERROR",
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

    const norm = normalizeError(error, E.CHAPTER_SERVER_ERROR);

    if (norm.code === E.AUTH_UNAUTHORIZED) {
      console.error('chapters/[id] unauthorized error (DELETE)');
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED), code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (norm.code === E.CHAPTER_NOT_FOUND) {
      console.error('chapters/[id] chapter not found (DELETE caught):', error);
      return NextResponse.json({ error: msg(E.CHAPTER_NOT_FOUND), code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: msg(E.CHAPTER_SERVER_ERROR),
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
