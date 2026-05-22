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
  getInterviewSessionDB,
  getInterviewSessionProgressDB,
} from "@/lib/interview-prep/data-access";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await req.json();

    const session = await getInterviewSessionDB(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const {
      questionResponses,
      allQuestions,
      completedQuestionIds = [],
      currentRound = 1,
    } = body as {
      questionResponses: QuestionResponse[];
      allQuestions: GeneratedQuestion[];
      completedQuestionIds?: string[];
      currentRound?: number;
    };

    // Load persisted progress to merge mastered/completed ids
    const persistedProgress = await getInterviewSessionProgressDB(sessionId);
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