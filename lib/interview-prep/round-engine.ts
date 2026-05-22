import { GeneratedQuestion } from "./types";

const QUESTIONS_PER_ROUND = 12;

export type ResponseType =
  | "covered"
  | "partial"
  | "missed"
  | "skipped";

export interface QuestionResponse {
  question: GeneratedQuestion;
  response: ResponseType;
  index: number;
}

export interface RoundSummary {
  coveredCount: number;
  partialCount: number;
  missedCount: number;
  skippedCount: number;
  earnedPoints: number;
  possiblePoints: number;
  readinessScore: number;
  weakQuestionIds: string[];
}

// ---------------------------
// ROUND SUMMARY
// ---------------------------
export function computeRoundSummary(
  responses: QuestionResponse[]
): RoundSummary {
  const coveredCount = responses.filter(r => r.response === "covered").length;
  const partialCount = responses.filter(r => r.response === "partial").length;
  const missedCount = responses.filter(r => r.response === "missed").length;
  const skippedCount = responses.filter(r => r.response === "skipped").length;

  const earnedPoints = coveredCount * 10 + partialCount * 5;
  const possiblePoints = (coveredCount + partialCount + missedCount) * 10;

  return {
    coveredCount,
    partialCount,
    missedCount,
    skippedCount,
    earnedPoints,
    possiblePoints,
    readinessScore:
      possiblePoints > 0
        ? Math.round((earnedPoints / possiblePoints) * 100)
        : 0,
    weakQuestionIds: responses
      .filter(r => r.response === "missed" || r.response === "skipped")
      .map(r => r.question.id),
  };
}

// ---------------------------
// MASTERED + RETRY LOGIC
// ---------------------------
export function computeMasteredIds(responses: QuestionResponse[]) {
  return responses
    .filter(r => r.response === "covered" || r.response === "partial")
    .map(r => r.question.id);
}

export function computeRetryIds(
  responses: QuestionResponse[],
  masteredIds: string[]
) {
  const weakIds = responses
    .filter(r => r.response === "missed" || r.response === "skipped")
    .map(r => r.question.id);

  return [...new Set(weakIds)].filter(id => !masteredIds.includes(id));
}

// ---------------------------
// ROUND BUILDER
// ---------------------------
export function buildNextRoundQuestions(params: {
  allQuestions: GeneratedQuestion[];
  retryIds: string[];
  completedIds: string[];
  masteredIds: string[];
}): GeneratedQuestion[] {
  const { allQuestions, retryIds, completedIds, masteredIds } = params;

  const retryQuestions = allQuestions.filter(
    q =>
      q.applicable &&
      retryIds.includes(q.id) &&
      !masteredIds.includes(q.id)
  );

  const freshQuestions = allQuestions.filter(
    q =>
      q.applicable &&
      !completedIds.includes(q.id) &&
      !retryIds.includes(q.id) &&
      !masteredIds.includes(q.id)
  );

  const shuffle = <T,>(arr: T[]) =>
    [...arr].sort(() => Math.random() - 0.5);

  const remainingSlots = QUESTIONS_PER_ROUND - retryQuestions.length;

  const selectedFresh = shuffle(freshQuestions).slice(0, remainingSlots);

  return shuffle([...retryQuestions, ...selectedFresh]).slice(
    0,
    QUESTIONS_PER_ROUND
  );
}