// Interview Preparation Service
// Business logic for creating and managing interview prep sessions. Now category-agnostic and supports dynamic loading.

import {
  createInterviewSessionDB,
  getInterviewSessionDB,
  updateInterviewSessionDB,
  saveInterviewAnswersDB,
  getSessionAnswersDB,
  saveInterviewResultsDB,
  getInterviewResultsDB,
} from "./data-access";
import {
  InterviewSession,
  InterviewSessionInput,
  InterviewPrepOutput,
  GeneratedQuestion,
} from "./types";
import { categoryLoader } from "./category-loader";
import { loadRulesForCategory, getAppliedRules } from "./rules-loader";
import type { InterviewQuestion } from "@/data/interview-categories/schema";
import type { RulesConfig, QuestionSelectionRule } from "./rules-loader";

// Dynamic Question Selection Engine - Determines which questions are applicable based on user answers
class DynamicQuestionSelectionEngine {
  private rules: QuestionSelectionRule[] = [];
  private categorySlug: string;

  constructor(categorySlug: string, rulesConfig: RulesConfig | null) {
    this.categorySlug = categorySlug;
    if (rulesConfig?.questionSelectionRules) {
      this.rules = rulesConfig.questionSelectionRules;
    }
  }

  // Select applicable questions based on user answers and loaded rules
  selectQuestions(
    answers: Record<string, unknown>,
    questionBank: InterviewQuestion[],
  ): GeneratedQuestion[] {
    const applicableQuestions: GeneratedQuestion[] = [];

    for (const questionEntry of questionBank) {
      const questionCategory = questionEntry.category;
      let isApplicable = false;
      let priority: "high" | "medium" | "low" = "low";
      let reason = "Does not match selection criteria";

      // Check if question should be skipped based on skipIf conditions
      if (this.shouldSkipQuestion(questionEntry, answers)) {
        continue;
      }

      // Check if any rules apply to this question's category
      const appliedRules = getAppliedRules(
        questionCategory,
        answers,
        this.rules,
      );

      if (appliedRules.length > 0) {
        isApplicable = true;
        // Use highest priority from applied rules
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const maxPriority = Math.max(
          ...appliedRules.map(
            (r) => priorityOrder[r.actions.priorityBoost[0] || "low"],
          ),
        );
        priority =
          maxPriority === 3 ? "high" : maxPriority === 2 ? "medium" : "low";
        reason = appliedRules.map((r) => r.actions.reason).join("; ");
      }

      // ONLY add to results if applicable
      if (isApplicable) {
        applicableQuestions.push({
          id: this.generateQuestionId(
            questionEntry.category,
            questionEntry.question,
          ),
          category: questionEntry.category,
          question: questionEntry.question,
          suggestedAnswer: questionEntry.suggestedAnswer,
          guidance: questionEntry.guidance,
          tooltip: questionEntry.tooltip,
          applicable: true,
          priority,
          reason,
        });
      }
    }

    // Sort by priority (high first, then medium, then low)
    return applicableQuestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Check if a question should be skipped based on skipIf conditions
  private shouldSkipQuestion(
    question: any,
    answers: Record<string, unknown>,
  ): boolean {
    if (!question.skipIf || !Array.isArray(question.skipIf)) {
      return false;
    }

    // All skipIf conditions are OR'd together
    // If any skipIf condition is true, skip the question
    return question.skipIf.some((condition: any) => {
      const fieldValue = answers[condition.field];

      if (condition.equals !== undefined) {
        return fieldValue === condition.equals;
      }
      if (condition.notEquals !== undefined) {
        return fieldValue !== condition.notEquals;
      }
      return false;
    });
  }

  // Generate unique question ID
  private generateQuestionId(category: string, question: string): string {
    return `${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")}`;
  }
}

// Answer Generation Engine - Personalizes answer templates with user-specific data
class AnswerGenerationEngine {
  // Generate personalized answers for selected questions
  generateAnswers(
    questions: GeneratedQuestion[],
    answersMap: Record<string, unknown>,
  ): GeneratedQuestion[] {
    return questions.map((question) => {
      const personalizedAnswer = this.processTemplate(
        question.suggestedAnswer,
        answersMap,
      );
      const personalizedGuidance = this.processTemplate(
        question.guidance,
        answersMap,
      );
      const personalizedTooltip = this.processTemplate(
        question.tooltip,
        answersMap,
      );

      return {
        ...question,
        suggestedAnswer: personalizedAnswer,
        guidance: personalizedGuidance,
        tooltip: personalizedTooltip,
      };
    });
  }

  // Process template string by replacing placeholders and ternary operators
  private processTemplate(
    template: string,
    answersMap: Record<string, unknown>,
  ): string {
    if (!template) return template;

    let processed = template;

    // First, handle ternary operators: {{field ? 'true_text' : 'false_text'}}
    // This regex captures the ternary and any nested placeholders within the text
    const ternaryRegex = /\{\{(\w+)\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\}\}/g;
    processed = processed.replace(ternaryRegex, (match, field, trueText, falseText) => {
      const value = answersMap[field];
      // Treat as truthy if value exists and is not false/0
      const isTruthy = value && value !== false && value !== 0 && value !== "false";
      const resultText = isTruthy ? trueText : falseText;
      
      // Process any nested placeholders in the result text (e.g., {{country}})
      return this.processTemplate(resultText, answersMap);
    });

    // Also handle ternary operators with double quotes: {{field ? "true_text" : "false_text"}}
    const ternaryRegexDouble = /\{\{(\w+)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\}\}/g;
    processed = processed.replace(ternaryRegexDouble, (match, field, trueText, falseText) => {
      const value = answersMap[field];
      const isTruthy = value && value !== false && value !== 0 && value !== "false";
      const resultText = isTruthy ? trueText : falseText;
      
      // Process any nested placeholders in the result text
      return this.processTemplate(resultText, answersMap);
    });

    // Handle ternary operators with escaped quotes in text: {{field ? 'it\'s true' : 'it\'s false'}}
    const ternaryRegexEscaped = /\{\{(\w+)\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'\}\}/g;
    processed = processed.replace(ternaryRegexEscaped, (match, field, trueText, falseText) => {
      // Only process if the previous simple ternary regex didn't already handle it
      if (!match.includes("\\'")) return match;
      
      const value = answersMap[field];
      const isTruthy = value && value !== false && value !== 0 && value !== "false";
      // Unescape the text and process any nested placeholders
      const resultText = (isTruthy ? trueText : falseText).replace(/\\'/g, "'");
      return this.processTemplate(resultText, answersMap);
    });

    // Then, handle simple placeholders: {{field}}
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    processed = processed.replace(placeholderRegex, (match, field) => {
      const value = answersMap[field];

      if (value === undefined || value === null || value === "") {
        return match; // Return original if not found
      }

      let replacement = String(value);

      // Special handling for common cases
      if (
        field === "daily_communication" &&
        replacement === "All of the above"
      ) {
        replacement = "phone calls, video calls, and text messages";
      }

      if (typeof value === "boolean") {
        replacement = value ? "Yes" : "No";
      }

      return replacement;
    });

    return processed;
  }
}

// Service Functions for managing interview prep sessions and generating output

//  Create a new interview session
export async function createInterviewSession(
  sessionData: Omit<InterviewSessionInput, "user_id">,
): Promise<InterviewSession> {
  return await createInterviewSessionDB(sessionData);
}

//  Get an interview session with answers and results
export async function getInterviewSession(
  sessionId: string,
): Promise<InterviewSession | null> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) return null;

  const answers = await getSessionAnswersDB(sessionId);
  const results = await getInterviewResultsDB(sessionId);

  return {
    ...session,
    answers,
    output: results?.generated_questions || null,
  } as InterviewSession;
}

// Update answers for an interview session
export async function updateInterviewSessionAnswers(
  sessionId: string,
  answers: Record<string, unknown>,
): Promise<InterviewSession> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const answersArray = Object.entries(answers).map(
    ([questionKey, answerValue]) => ({
      question_key: questionKey,
      answer_value: answerValue,
    }),
  );

  await saveInterviewAnswersDB(sessionId, answersArray);
  return (await getInterviewSession(sessionId)) as InterviewSession;
}

// Generate personalized interview prep output
export async function generateInterviewPrepOutput(
  sessionId: string,
): Promise<InterviewPrepOutput> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const answers = await getSessionAnswersDB(sessionId);
  const categoryData = await categoryLoader.loadCategory(session.category_slug);
  
  // Load rules for the category
  const rules = await loadRulesForCategory(session.category_slug);

  const answersMap: Record<string, unknown> = {};
  answers.forEach((answer) => {
    answersMap[answer.question_key] = answer.answer_value;
  });

  const selectionEngine = new DynamicQuestionSelectionEngine(
    session.category_slug,
    rules,
  );
  const applicableQuestions = selectionEngine.selectQuestions(
    answersMap,
    categoryData.questionBank.questions,
  );

  const generationEngine = new AnswerGenerationEngine();
  const generatedQuestions = generationEngine.generateAnswers(
    applicableQuestions,
    answersMap,
  );

  await saveInterviewResultsDB(sessionId, generatedQuestions);

  return {
    sessionId,
    questions: generatedQuestions,
    summary: {
      totalQuestions: categoryData.questionBank.questions.length,
      applicableQuestions: generatedQuestions.length,
      categories: Array.from(
        new Set(generatedQuestions.map((q) => q.category)),
      ),
    },
  };
}

//  Mark an interview session as completed
export async function completeInterviewSession(
  sessionId: string,
): Promise<InterviewSession> {
  const updatedSession = await updateInterviewSessionDB(sessionId, {
    completed: true,
  });
  return updatedSession;
}

// Get the generated interview prep output
export async function getInterviewPrepOutput(
  sessionId: string,
): Promise<InterviewPrepOutput | null> {
  const results = await getInterviewResultsDB(sessionId);
  if (!results) return null;

  return {
    sessionId,
    questions: results.generated_questions as GeneratedQuestion[],
    summary: {
      totalQuestions: (results.generated_questions as GeneratedQuestion[])
        .length,
      applicableQuestions: (
        results.generated_questions as GeneratedQuestion[]
      ).filter((q) => q.applicable).length,
      categories: Array.from(
        new Set(
          (results.generated_questions as GeneratedQuestion[]).map(
            (q) => q.category,
          ),
        ),
      ),
    },
  };
}
