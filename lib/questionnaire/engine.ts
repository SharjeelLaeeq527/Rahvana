// ============================================================================
// Document Questionnaire Decision Engine
// ============================================================================

import type {
  QuestionnaireConfig,
  QuestionnaireQuestion,
  QuestionnaireAnswers,
  ConditionalDocument,
  QuestionnaireResult,
} from "./types";

/**
 * Check if a single visibility condition is met.
 */
function isConditionMet(
  condition: { questionId: string; requiredValue: string | string[] },
  answers: QuestionnaireAnswers
): boolean {
  const answer = answers[condition.questionId];
  if (!answer) return false;
  if (Array.isArray(condition.requiredValue)) {
    return condition.requiredValue.includes(answer);
  }
  return answer === condition.requiredValue;
}

/**
 * Returns whether a question should be visible given the current answers.
 * A question is visible if it has no visibility conditions, or ALL conditions are met.
 */
export function isQuestionVisible(
  question: QuestionnaireQuestion,
  answers: QuestionnaireAnswers
): boolean {
  if (!question.visibleWhen || question.visibleWhen.length === 0) {
    return true;
  }
  return question.visibleWhen.every((cond) => isConditionMet(cond, answers));
}

/**
 * Returns the ordered list of questions that are currently visible
 * based on the answers provided so far.
 */
export function getVisibleQuestions(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers
): QuestionnaireQuestion[] {
  return config.questions.filter((q) => isQuestionVisible(q, answers));
}

/**
 * Returns the index of the next unanswered visible question.
 * Returns -1 if all visible questions are answered (questionnaire complete).
 */
export function getNextUnansweredIndex(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers
): number {
  const visible = getVisibleQuestions(config, answers);
  const idx = visible.findIndex((q) => !answers[q.id]);
  return idx;
}

/**
 * Check if the questionnaire is complete — all visible questions are answered.
 */
export function isQuestionnaireComplete(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers
): boolean {
  const visible = getVisibleQuestions(config, answers);
  return visible.length > 0 && visible.every((q) => !!answers[q.id]);
}

/**
 * Compute the final document list based on base documents + decision rules.
 * Deduplicates by document ID (later rules override earlier ones).
 */
export function computeDocumentList(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers
): ConditionalDocument[] {
  // Start with base documents
  const documentMap = new Map<string, ConditionalDocument>();

  for (const doc of config.baseDocuments) {
    documentMap.set(doc.id, { ...doc });
  }

  // Evaluate each decision rule
  for (const rule of config.decisionRules) {
    const answer = answers[rule.questionId];
    if (!answer) continue;

    // Check trigger match
    const triggerMatches = Array.isArray(rule.triggerValue)
      ? rule.triggerValue.includes(answer)
      : answer === rule.triggerValue;

    if (!triggerMatches) continue;

    // Check additional condition if present
    if (rule.additionalCondition) {
      if (!isConditionMet(rule.additionalCondition, answers)) continue;
    }

    // Add documents (override if already exists with same ID)
    for (const doc of rule.documents) {
      const finalDoc = { ...doc };
      if (rule.asOptional) {
        finalDoc.required = false;
      }
      documentMap.set(finalDoc.id, finalDoc);
    }
  }

  // Convert to array and sort by group priority
  const groupOrder = ["Required Now", "Required if Applicable", "Gather Now for Later"];

  return Array.from(documentMap.values()).sort((a, b) => {
    const idxA = groupOrder.indexOf(a.group);
    const idxB = groupOrder.indexOf(b.group);
    return idxA - idxB;
  });
}

/**
 * Build the full questionnaire result.
 */
export function buildQuestionnaireResult(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers
): QuestionnaireResult {
  return {
    answers: { ...answers },
    documentList: computeDocumentList(config, answers),
    completedAt: new Date().toISOString(),
  };
}

/**
 * Compute the progress percentage (answered visible questions / total visible questions).
 */
export function getProgress(config: QuestionnaireConfig, answers: QuestionnaireAnswers): number {
  const visible = getVisibleQuestions(config, answers);
  if (visible.length === 0) return 0;
  const answered = visible.filter((q) => !!answers[q.id]).length;
  return Math.round((answered / visible.length) * 100);
}

// ============================================================================
// Step 1 → Step 2 Answer Derivation
// Maps eligibility quest answers to document questionnaire answer keys
// so duplicate questions can be skipped.
// ============================================================================

/**
 * Eligibility answers shape from QuestRenderer:
 * state.answers["eligibility-suite"] → { [questId]: { [screenId]: value } }
 *
 * Relevant screens:
 *   q3 → q3s1 (prior marriage history): "none" | "petitioner" | "beneficiary" | "both" | "unsure"
 *   q5 → q5s2 (criminal history):       "no" | "yes" | "unsure"
 */
type EligibilityAnswers = Record<string, Record<string, string | string[]>>;

export function deriveDocAnswersFromEligibility(
  eligibilityAnswers: EligibilityAnswers | undefined
): QuestionnaireAnswers {
  const derived: QuestionnaireAnswers = {};
  if (!eligibilityAnswers) return derived;

  // ── Prior marriage (q3 → q3s1) ──────────────────────────────────
  const q3Answers = eligibilityAnswers["q3"];
  const q3s1 = q3Answers?.["q3s1"] as string | undefined;

  if (q3s1 && q3s1 !== "unsure") {
    // Petitioner had a prior marriage?
    derived["prior_marriage_petitioner"] = q3s1 === "petitioner" || q3s1 === "both" ? "yes" : "no";

    // Beneficiary had a prior marriage?
    derived["prior_marriage_beneficiary"] =
      q3s1 === "beneficiary" || q3s1 === "both" ? "yes" : "no";
  }

  // ── Criminal history (q5 → q5s2) ────────────────────────────────
  const q5Answers = eligibilityAnswers["q5"];
  const q5s2 = q5Answers?.["q5s2"] as string | undefined;

  if (q5s2 && q5s2 !== "unsure") {
    derived["criminal_history"] = q5s2 === "yes" ? "yes" : "no";
  }

  return derived;
}
