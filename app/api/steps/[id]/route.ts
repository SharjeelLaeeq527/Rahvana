import { NextRequest, NextResponse } from "next/server";
import { stepService } from "@/lib/journey/service";
import * as db from "@/lib/journey/data-access";
import type { StepUpdate } from "@/lib/journey/types";
import { stepCompletionEngine } from "@/lib/journey/service";
import { createClient } from "@/lib/supabase/server";
import { logCaseActivity } from "@/lib/case-collaboration/activity";
import { E, msg, normalizeError } from "@/lib/errors";

/** Current authenticated user id (best-effort, for activity attribution). */
async function getActorId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// GET /api/steps/[id] - Get step details with metadata and visibility context
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const stepId = (await params).id;

    // Get step
    const step = await db.getStepDB(stepId);
    if (!step) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
      return NextResponse.json({ error: "Step not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Get chapter to access journey
    const chapter = await db.getChapterDB(step.chapter_id);
    if (!chapter) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get case data for the journey (needed for visibility/dependency evaluation)
    const caseData = await db.getCaseDataForJourneyDB(chapter.journey_id);
    const caseDataMap = caseData.reduce(
      (acc, cd) => {
        acc[cd.data_key] = cd.data_value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    // Get step details with visibility info
    const stepDetails = await stepService.getStepDetails(stepId, caseDataMap);

    // Get dependent steps (if this step is completed, what unlocks)
    const dependentSteps =
      step.status === "completed"
        ? await stepCompletionEngine.getDependentSteps(stepId, step.chapter_id)
        : [];

    return NextResponse.json(
      {
        success: true,
        data: {
          ...stepDetails,
          dependent_steps: dependentSteps,
          case_data_context: caseDataMap,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in GET /api/steps/[id]:`, error);
    const norm = normalizeError(error, E.TOOL_CASE_FETCH_FAILED);

    if (norm.code === E.AUTH_UNAUTHORIZED) {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (norm.code === E.CASE_DATA_NOT_FOUND) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: msg(E.AUTH_UNEXPECTED_ERROR),
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/steps/[id] - Update step details
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const stepId = (await params).id;
    const updates: StepUpdate = await request.json();

    // Detect a "reopen" (a completed step being moved back to an open status) so
    // we can log it. Read the prior status before the update.
    const isStatusChange = typeof updates.status === "string" && updates.status !== "completed";
    const priorStep = isStatusChange ? await db.getStepDB(stepId) : null;

    const result = await stepService.updateStep(stepId, updates);

    // Audit log (best-effort, shared case only) — only when a completed step was
    // actually reopened.
    if (priorStep && priorStep.status === "completed") {
      const chapter = await db.getChapterDB(priorStep.chapter_id);
      if (chapter) {
        await logCaseActivity({
          journeyId: chapter.journey_id,
          actorUserId: await getActorId(),
          action: "step.reopen",
          targetLabel: priorStep.step_name,
          metadata: { step_key: priorStep.step_key, new_status: updates.status },
        });
      }
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in PATCH /api/steps/[id]:`, error);
    const norm = normalizeError(error, E.TOOL_CASE_FETCH_FAILED);

    if (norm.code === E.AUTH_UNAUTHORIZED) {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (norm.code === E.CASE_DATA_NOT_FOUND) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: msg(E.AUTH_UNEXPECTED_ERROR),
        code: "SERVER_ERROR",
        details: msg(E.AUTH_UNEXPECTED_ERROR),
      },
      { status: 500 }
    );
  }
}

// POST /api/steps/[id]/complete - Mark step as completed
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const stepId = (await params).id;
    const action = request.nextUrl.searchParams.get("action");

    if (action !== "complete") {
      return NextResponse.json(
        { error: "Unknown action", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const body: any = await request.json();

    // Get step to find its journey context
    const step = await db.getStepDB(stepId);
    if (!step) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get chapter to find journey
    const chapter = await db.getChapterDB(step.chapter_id);
    if (!chapter) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Complete step with journey context
    const result = await stepService.completeStep(stepId, chapter.journey_id, body);

    // Audit log (best-effort, shared case only).
    await logCaseActivity({
      journeyId: chapter.journey_id,
      actorUserId: await getActorId(),
      action: "step.complete",
      targetLabel: step.step_name,
      metadata: { step_key: step.step_key },
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in POST /api/steps/[id]/complete:`, error);
    const norm = normalizeError(error, E.TOOL_VISA_SUBMIT_FAILED);

    if (norm.code === E.AUTH_UNAUTHORIZED) {
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (norm.code === E.DASH_JOURNEY_STEP_LOCKED) {
      return NextResponse.json(
        {
          error: msg(E.DASH_JOURNEY_STEP_LOCKED),
          code: "INVALID_STATE",
        },
        { status: 400 }
      );
    }

    if (norm.code === E.CASE_DATA_VALIDATION_FAILED) {
      return NextResponse.json(
        {
          error: msg(E.CASE_DATA_VALIDATION_FAILED),
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: msg(E.AUTH_UNEXPECTED_ERROR),
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/steps/[id] - Delete a step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stepId = (await params).id;

    // Check if step exists
    const step = await db.getStepDB(stepId);
    if (!step) {
      return NextResponse.json({ error: "Step not found", code: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND), code: "NOT_FOUND" },
        { status: 404 }
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
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in DELETE /api/steps/[id]:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      return NextResponse.json(
        { error: msg(E.AUTH_UNAUTHORIZED), code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete step",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
