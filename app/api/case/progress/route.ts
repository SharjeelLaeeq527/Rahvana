// app/api/case/progress/route.ts
// GET ?journeyId=... — case-wide progress snapshot for the spouse panel.
// Returns overall journey progress + every tool session + every form draft for
// the SHARED case, so both spouses see the same live picture. Any member may
// read it (verifyJourneyAccess); rows are gathered with the service role after
// membership is confirmed, so the view doesn't depend on per-row RLS quirks.
// Spec: docs/partner-collaboration-spec.md §13.

import { NextRequest, NextResponse } from "next/server";
import { verifyJourneyAccess, errorResponse, successResponse } from "@/lib/api/journey-auth";
import { getAdminClient } from "@/lib/case-collaboration/helpers";

// Friendly labels. Unknown keys fall back to a humanised version of the code.
const TOOL_LABELS: Record<string, string> = {
  form_filler_i130: "I-130 Auto Form Filler",
  affidavit_calculator: "Affidavit of Support Calculator",
  ds260_prep: "DS-260 Preparation",
  interview_prep: "Interview Preparation",
  case_strength_checker: "Case Strength Checker",
};

const FORM_LABELS: Record<string, string> = {
  i130: "Form I-130",
  i130a: "Form I-130A",
  ds260: "Form DS-260",
  i864: "Form I-864",
  i864a: "Form I-864A",
};

function humanise(code: string): string {
  return code.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(req: NextRequest) {
  try {
    const journeyId = req.nextUrl.searchParams.get("journeyId") || "";
    if (!journeyId) {
      return NextResponse.json(errorResponse("VALIDATION", "journeyId is required"), {
        status: 400,
      });
    }

    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;
    const { user } = access;

    const admin = getAdminClient();

    const [journeyRes, toolsRes, formsRes, collabRes] = await Promise.all([
      admin
        .from("journeys")
        .select("completion_percentage, completed_steps_count, total_steps_count, status")
        .eq("id", journeyId)
        .maybeSingle(),
      admin
        .from("tool_sessions")
        .select("tool_key, step_key, completion_percentage, is_completed, last_saved_at")
        .eq("journey_id", journeyId)
        .order("last_saved_at", { ascending: false }),
      admin
        .from("visa_forms_draft")
        .select("form_code, completed, current_step, last_saved_at, user_id")
        .eq("journey_id", journeyId)
        .order("last_saved_at", { ascending: false }),
      admin
        .from("case_collaborators")
        .select("user_id, membership_role, case_role")
        .eq("journey_id", journeyId)
        .eq("status", "active"),
    ]);

    const j = journeyRes.data as
      | {
          completion_percentage: number | null;
          completed_steps_count: number | null;
          total_steps_count: number | null;
          status: string | null;
        }
      | null;

    const tools = ((toolsRes.data as Array<Record<string, unknown>>) || []).map((t) => ({
      toolKey: t.tool_key as string,
      label: TOOL_LABELS[t.tool_key as string] || humanise(t.tool_key as string),
      stepKey: (t.step_key as string) ?? null,
      completionPercentage: (t.completion_percentage as number) ?? 0,
      isCompleted: Boolean(t.is_completed),
      lastSavedAt: (t.last_saved_at as string) ?? null,
    }));

    const forms = ((formsRes.data as Array<Record<string, unknown>>) || []).map((f) => ({
      formCode: f.form_code as string,
      label: FORM_LABELS[f.form_code as string] || humanise(f.form_code as string),
      completed: Boolean(f.completed),
      currentStep: (f.current_step as number) ?? 1,
      lastSavedAt: (f.last_saved_at as string) ?? null,
      // Who saved last — lets the UI show "your spouse just updated this".
      lastEditedByYou: (f.user_id as string) === user.id,
    }));

    const members = ((collabRes.data as Array<Record<string, unknown>>) || []).map((c) => ({
      userId: c.user_id as string,
      membershipRole: c.membership_role as string,
      caseRole: (c.case_role as string) ?? null,
      isYou: (c.user_id as string) === user.id,
    }));

    return NextResponse.json(
      successResponse({
        journey: {
          completionPercentage: j?.completion_percentage ?? 0,
          completedSteps: j?.completed_steps_count ?? 0,
          totalSteps: j?.total_steps_count ?? 0,
          status: j?.status ?? null,
        },
        tools,
        forms,
        members,
      })
    );
  } catch (error) {
    console.error("[case/progress] GET error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}
