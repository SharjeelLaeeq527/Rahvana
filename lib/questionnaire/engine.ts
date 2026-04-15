// ============================================================================
// Document Questionnaire Decision Engine
// Pure logic — no React, no side effects. Takes config + answers → documents.
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
  answers: QuestionnaireAnswers,
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
  answers: QuestionnaireAnswers,
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
  answers: QuestionnaireAnswers,
): QuestionnaireQuestion[] {
  return config.questions.filter((q) => isQuestionVisible(q, answers));
}

/**
 * Returns the index of the next unanswered visible question.
 * Returns -1 if all visible questions are answered (questionnaire complete).
 */
export function getNextUnansweredIndex(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers,
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
  answers: QuestionnaireAnswers,
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
  answers: QuestionnaireAnswers,
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
  const groupOrder = [
    "Required Now",
    "Required if Applicable",
    "Gather Now for Later",
  ];

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
  answers: QuestionnaireAnswers,
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
export function getProgress(
  config: QuestionnaireConfig,
  answers: QuestionnaireAnswers,
): number {
  const visible = getVisibleQuestions(config, answers);
  if (visible.length === 0) return 0;
  const answered = visible.filter((q) => !!answers[q.id]).length;
  return Math.round((answered / visible.length) * 100);
}
