// app/api/case/interview/route.ts
// GET [?journeyId=...] — the SHARED case's interview-prep session, readable by
// EITHER spouse. The interview tool is otherwise fully per-user (every query in
// lib/interview-prep/data-access.ts filters user_id), so a petitioner — who has
// no session row of their own — could never see the beneficiary's prep. This
// route resolves the shared case, confirms membership, then reads the journey
// session + its generated questions + the beneficiary's saved answers with the
// service role.
//
// Role rule (spec §13): in IR-1 the BENEFICIARY sits the interview, so only the
// beneficiary edits/practices. `canEdit` is false for the petitioner; the client
// renders the returned data read-only. Writes are blocked server-side too (see
// app/api/interview-prep/from-journey + the per-user ownership filter).

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, errorResponse, successResponse } from "@/lib/api/journey-auth";
import {
  getAdminClient,
  resolveActiveJourneyId,
  getCaseRole,
} from "@/lib/case-collaboration/helpers";
import type { GeneratedQuestion } from "@/lib/interview-prep/types";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (auth.error) return auth.error;
    const { user, supabase } = auth;

    const admin = getAdminClient();

    // Resolve the shared case. An explicit param wins; otherwise fall back to the
    // caller's own/collaborator journey (a petitioner partner has no journey row,
    // so resolveActiveJourneyId returns their collaborator journey_id).
    const journeyId =
      req.nextUrl.searchParams.get("journeyId") ||
      (await resolveActiveJourneyId(supabase, user.id));

    if (!journeyId) {
      return NextResponse.json(successResponse({ hasCase: false }));
    }

    // Defence-in-depth: confirm membership before reading with the service role.
    const { data: isMember, error: memberError } = await supabase.rpc("is_journey_member", {
      p_journey_id: journeyId,
      p_uid: user.id,
    });
    if (memberError) {
      return NextResponse.json(errorResponse("INTERNAL", "Membership check failed"), {
        status: 500,
      });
    }
    if (!isMember) {
      return NextResponse.json(errorResponse("FORBIDDEN", "Access denied to this journey"), {
        status: 403,
      });
    }

    const caseRole = await getCaseRole(admin, journeyId, user.id);

    // Identify the beneficiary — whose interview prep this case shows. Prefer a
    // member explicitly assigned case_role = 'beneficiary'; otherwise fall back to
    // the journey owner (account holder = beneficiary in the default model).
    const { data: journeyRow } = await admin
      .from("journeys")
      .select("user_id")
      .eq("id", journeyId)
      .maybeSingle();
    const journeyOwnerId = (journeyRow as { user_id: string } | null)?.user_id ?? null;

    const { data: memberRows } = await admin
      .from("case_collaborators")
      .select("user_id, case_role")
      .eq("journey_id", journeyId)
      .eq("status", "active");
    const beneficiaryMember = ((memberRows as Array<{ user_id: string; case_role: string | null }>) ||
      []).find((m) => m.case_role === "beneficiary");
    const beneficiaryId = beneficiaryMember?.user_id ?? journeyOwnerId;

    // The beneficiary edits/practices; every other case member views read-only.
    // This holds even when roles were never assigned (beneficiaryId falls back to
    // the journey owner).
    const canEdit = !!beneficiaryId && beneficiaryId === user.id;

    // The beneficiary's interview prep. Prefer a session linked to this journey,
    // but FALL BACK to their latest session of any kind — in practice the prep is
    // often a standalone 'tool' session with journey_id = null, which the old
    // journey-only lookup missed entirely.
    let session:
      | {
          id: string;
          user_id: string | null;
          category_slug: string | null;
          completed: boolean | null;
          status: string | null;
          journey_id: string | null;
        }
      | null = null;

    if (beneficiaryId) {
      const sel = "id, user_id, category_slug, completed, status, journey_id";
      const { data: linked } = await admin
        .from("interview_prep_sessions")
        .select(sel)
        .eq("user_id", beneficiaryId)
        .eq("journey_id", journeyId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      session = (linked as typeof session) ?? null;

      if (!session) {
        const { data: latest } = await admin
          .from("interview_prep_sessions")
          .select(sel)
          .eq("user_id", beneficiaryId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        session = (latest as typeof session) ?? null;
      }
    }

    if (!session) {
      return NextResponse.json(
        successResponse({
          hasCase: true,
          journeyId,
          caseRole,
          canEdit,
          session: null,
          output: null,
          userAnswers: {},
          answeredCount: 0,
        })
      );
    }

    const sessionId = (session as { id: string }).id;

    const [resultsRes, userAnswersRes, questionnaireRes, progressRes] = await Promise.all([
      admin
        .from("interview_prep_results")
        .select("generated_questions")
        .eq("session_id", sessionId)
        .maybeSingle(),
      admin
        .from("interview_user_answers")
        .select("question_id, user_answer_text")
        .eq("session_id", sessionId),
      // Count of questionnaire answers — used to show "preparation in progress".
      admin
        .from("interview_prep_answers")
        .select("session_id", { count: "exact", head: true })
        .eq("session_id", sessionId),
      // Rapid Fire practice progress (rounds completed, readiness, scores).
      admin
        .from("interview_prep_session_progress")
        .select(
          "current_round, total_rounds_completed, score, last_round_score, round_summary, completed"
        )
        .eq("session_id", sessionId)
        .maybeSingle(),
    ]);

    const prog = progressRes.data as {
      current_round: number | null;
      total_rounds_completed: number | null;
      score: number | null;
      last_round_score: number | null;
      round_summary: unknown | null;
      completed: boolean | null;
    } | null;

    // Only surface Rapid Fire once at least one round is done.
    const rapidFire =
      prog && (prog.total_rounds_completed ?? 0) > 0
        ? {
            currentRound: prog.current_round ?? 0,
            totalRoundsCompleted: prog.total_rounds_completed ?? 0,
            score: prog.score ?? 0,
            lastRoundScore: prog.last_round_score ?? 0,
            roundSummary: prog.round_summary ?? null,
            completed: Boolean(prog.completed),
          }
        : null;

    const generatedQuestions =
      ((resultsRes.data as { generated_questions: GeneratedQuestion[] } | null)
        ?.generated_questions as GeneratedQuestion[] | null) ?? null;

    const output =
      generatedQuestions && generatedQuestions.length > 0
        ? {
            sessionId,
            questions: generatedQuestions,
            summary: {
              totalQuestions: generatedQuestions.length,
              applicableQuestions: generatedQuestions.filter((q) => q.applicable).length,
              categories: Array.from(new Set(generatedQuestions.map((q) => q.category))),
            },
          }
        : null;

    // The beneficiary's typed answers, keyed by question id (for read-only view).
    const userAnswers: Record<string, string> = {};
    (
      (userAnswersRes.data as Array<{
        question_id: string;
        user_answer_text: string | null;
      }>) || []
    ).forEach((a) => {
      userAnswers[a.question_id] = a.user_answer_text || "";
    });

    return NextResponse.json(
      successResponse({
        hasCase: true,
        journeyId,
        caseRole,
        canEdit,
        session: {
          id: sessionId,
          category_slug: (session as { category_slug: string | null }).category_slug,
          completed: Boolean((session as { completed: boolean | null }).completed),
          status: (session as { status: string | null }).status ?? null,
        },
        output,
        userAnswers,
        answeredCount: questionnaireRes.count ?? 0,
        rapidFire,
      })
    );
  } catch (error) {
    console.error("[case/interview] GET error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}
