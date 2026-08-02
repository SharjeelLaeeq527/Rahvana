import type { InterviewQuestion } from "@/data/interview-categories/schema";

import {
  evaluateQuestionConditions,
  evaluateSkipIf,
  inferCaseTypeFromCategorySlug,
  resolveCaseType,
} from "./condition-evaluator";
import { getAppliedRules, type QuestionSelectionRule, type RulesConfig } from "./rules-loader";
import type { GeneratedQuestion } from "./types";

const PRIORITY_ORDER: Record<GeneratedQuestion["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function toComparableOrder(value: number | undefined): number {
  return value ?? Number.MAX_SAFE_INTEGER;
}

export class DynamicQuestionSelectionEngine {
  private rules: QuestionSelectionRule[] = [];
  private readonly fallbackCaseType: string;

  constructor(private readonly categorySlug: string, rulesConfig: RulesConfig | null) {
    if (rulesConfig?.questionSelectionRules) {
      this.rules = rulesConfig.questionSelectionRules;
    }

    this.fallbackCaseType = inferCaseTypeFromCategorySlug(categorySlug);
  }

  selectQuestions(
    answers: Record<string, unknown>,
    questionBank: InterviewQuestion[]
  ): GeneratedQuestion[] {
    const resolvedCaseType = resolveCaseType(answers, this.fallbackCaseType);
    const normalizedAnswers = {
      ...answers,
      caseType: resolvedCaseType,
    };
    const applicableQuestions: GeneratedQuestion[] = [];

    for (const questionEntry of questionBank) {
      const questionContext = {
        caseType: resolvedCaseType,
        fallbackCaseType: this.fallbackCaseType,
      };

      if (!evaluateQuestionConditions(questionEntry.conditions, normalizedAnswers, questionContext)) {
        continue;
      }

      if (evaluateSkipIf(questionEntry.skipIf, normalizedAnswers, questionContext)) {
        continue;
      }

      const appliedRules = getAppliedRules(questionEntry.category, normalizedAnswers, this.rules);

      if (appliedRules.length === 0) {
        continue;
      }

      const maxPriority = Math.max(
        ...appliedRules.map((rule) => {
          const boostedPriority = rule.actions.priorityBoost?.[0] || "low";
          return PRIORITY_ORDER[boostedPriority as keyof typeof PRIORITY_ORDER] ?? PRIORITY_ORDER.low;
        })
      );

      const priority: GeneratedQuestion["priority"] =
        maxPriority >= 3 ? "high" : maxPriority === 2 ? "medium" : "low";

      const reason = appliedRules
        .map((rule) => rule.actions.reason)
        .filter((value): value is string => Boolean(value))
        .join("; ");

      applicableQuestions.push({
        id: questionEntry.id,
        category: questionEntry.category,
        question: questionEntry.question,
        sampleAnswer: questionEntry.sampleAnswer,
        guidance: questionEntry.guidance,
        tooltip: questionEntry.tooltip,
        tier: questionEntry.tier,
        applicable: true,
        priority,
        mockInterviewOrder: questionEntry.mockInterviewOrder,
        variations: questionEntry.variations,
        reason: reason || undefined,
      });
    }

    return applicableQuestions.sort((left, right) => {
      const priorityDelta = PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      const mockInterviewDelta =
        toComparableOrder(left.mockInterviewOrder) - toComparableOrder(right.mockInterviewOrder);

      if (mockInterviewDelta !== 0) {
        return mockInterviewDelta;
      }

      return left.id.localeCompare(right.id);
    });
  }
}
