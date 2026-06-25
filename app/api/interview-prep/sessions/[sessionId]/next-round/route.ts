import { NextRequest, NextResponse } from "next/server";
import {
  buildNextRoundQuestions,
  computeMasteredIds,
  computeRetryIds,
  computeRoundSummary,
  QuestionResponse,
} from "@/lib/interview-prep/round-engine";
import { GeneratedQuestion } from "@/lib/interview-prep/types";
import {
  getInterviewSessionProgressDB,
} from "@/lib/interview-prep/data-access";
import { resolveSessionAccess } from "@/lib/interview-prep/case-access";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();

    // Advancing a practice round is a write — beneficiary only; petitioner is
    // read-only.
    const access = await resolveSessionAccess(sessionId, { write: true });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    const {
      questionResponses,
      allQuestions,
      completedQuestionIds = [],
      currentRound = 1,
      questionCooldowns = {},
    } = body as {
      questionResponses: QuestionResponse[];
      allQuestions: GeneratedQuestion[];
      completedQuestionIds?: string[];
      currentRound?: number;
      questionCooldowns?: Record<string, number>;
    };

    // Load persisted progress to merge mastered/completed ids
    const persistedProgress = await getInterviewSessionProgressDB(sessionId, acting);
    const persistedMasteredIds = (persistedProgress?.mastered_question_ids as string[]) ?? [];
    const persistedCompletedIds = (persistedProgress?.completed_question_ids as string[]) ?? [];

    // 1. Compute mastered (merge with persisted mastered)
    const masteredFromResponses = computeMasteredIds(questionResponses);
    const masteredIds = Array.from(new Set([...(persistedMasteredIds as string[]), ...masteredFromResponses]));

    // 2. Compute retry (exclude masteredIds)
    const retryIds = computeRetryIds(questionResponses, masteredIds);

    // 3. Build next round
    const mergedCompletedIds = Array.from(
      new Set([...(persistedCompletedIds as string[]), ...completedQuestionIds]),
    );

    // Treat current round responses as completed before building next round
    const effectiveCompletedIds = Array.from(
      new Set([...
        mergedCompletedIds,
        ...questionResponses.map((r: QuestionResponse) => r.question.id),
      ]),
    );

    const nextQuestions = buildNextRoundQuestions({
      allQuestions,
      retryIds,
      completedIds: effectiveCompletedIds,
      masteredIds,
      questionCooldowns,
    });

    // 4. Summary
    const summary = computeRoundSummary(questionResponses);

    return NextResponse.json({
      currentRound: currentRound + 1,
      shuffledQuestions: nextQuestions,
      completedQuestionIds: effectiveCompletedIds,
      retryQuestionIds: retryIds,
      masteredQuestionIds: masteredIds,
      roundSummary: summary,
      isTrainingComplete:
        retryIds.length === 0 && nextQuestions.length === 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to compute next round" },
      { status: 500 }
    );
  }
}