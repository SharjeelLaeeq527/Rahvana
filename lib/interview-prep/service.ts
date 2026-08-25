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
  getInterviewSessionByCategory,
  getInterviewSessionByJourneyId,
  createJourneyInterviewSessionDB,
  isJourneyActive,
  getActiveJourneySession,
} from "./data-access";
import {
  InterviewSession,
  InterviewSessionInput,
  InterviewPrepOutput,
  GeneratedQuestion,
} from "./types";
import { categoryLoader } from "./category-loader";
import { loadRulesForCategory } from "./rules-loader";
import { initializeVariationSession, applyVariationsToQuestions } from "./variation-selector";
import { DynamicQuestionSelectionEngine } from "./question-selection-engine";

// Answer Generation Engine - Personalizes answer templates with user-specific data
class AnswerGenerationEngine {
  // Generate personalized answers for selected questions
  generateAnswers(
    questions: GeneratedQuestion[],
    answersMap: Record<string, unknown>
  ): GeneratedQuestion[] {
    return questions.map((question) => {
      const personalizedAnswer = this.processTemplate(question.sampleAnswer, answersMap);
      const personalizedGuidance = this.processTemplate(question.guidance, answersMap);
      const personalizedTooltip = this.processTemplate(question.tooltip, answersMap);

      return {
        ...question,
        sampleAnswer: personalizedAnswer,
        guidance: personalizedGuidance,
        tooltip: personalizedTooltip,
      };
    });
  }

  // Process template string by replacing placeholders and ternary operators
  private processTemplate(template: string, answersMap: Record<string, unknown>): string {
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
    const ternaryRegexEscaped =
      /\{\{(\w+)\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'\}\}/g;
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
      if (field === "daily_communication" && replacement === "All of the above") {
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

//  Create a new interview session (tool-based)
//  With the (user_id, category_slug, source) unique constraint,
//  tool sessions and journey sessions can coexist independently.
export async function createInterviewSession(
  sessionData: Omit<InterviewSessionInput, "user_id">
): Promise<{
  session: InterviewSession;
  alreadyExists: boolean;
  source?: "journey" | "tool";
}> {
  // Check for existing tool-based session for this category
  const existingSession = await getInterviewSessionByCategory(sessionData.category_slug);

  if (existingSession) {
    return {
      session: existingSession,
      alreadyExists: true,
      source: "tool",
    };
  }

  // No existing tool session - create a new one
  // Journey sessions are not checked here; they coexist independently
  const session = await createInterviewSessionDB({
    ...sessionData,
    source: "tool",
    status: "ready",
  });

  return {
    session,
    alreadyExists: false,
    source: "tool",
  };
}

// Create or get journey-based interview session
// Called automatically when a journey is initialized
export async function createJourneyInterviewSession(
  journey_id: string,
  category_slug: string
): Promise<{
  session: InterviewSession;
  alreadyExists: boolean;
}> {
  // Check if journey session already exists
  const existingSession = await getInterviewSessionByJourneyId(journey_id);

  if (existingSession) {
    return {
      session: existingSession,
      alreadyExists: true,
    };
  }

  // Create new journey-based session
  const session = await createJourneyInterviewSessionDB(journey_id, category_slug);

  return {
    session,
    alreadyExists: false,
  };
}

// Get interview session by journey ID (for journey-based access)
export async function getInterviewSessionByJourney(
  journey_id: string
): Promise<InterviewSession | null> {
  const session = await getInterviewSessionByJourneyId(journey_id);
  if (!session) return null;

  // Check if journey is still active
  const journeyIsActive = await isJourneyActive(journey_id);
  if (!journeyIsActive) {
    // Journey is completed/inactive - block access
    return null;
  }

  const answers = await getSessionAnswersDB(session.id);
  const results = await getInterviewResultsDB(session.id);

  return {
    ...session,
    answers,
    output: results?.generated_questions || null,
  } as InterviewSession;
}

// Get active journey session for interview prep tool
// Returns session if user has an active IR-1 journey with an interview session
export async function getActiveJourneyInterviewSession(
  journey_type: string = "IR1"
): Promise<{ session: InterviewSession; journey_status: string } | null> {
  const result = await getActiveJourneySession(journey_type);
  if (!result) return null;

  // Enrich with answers and results
  const answers = await getSessionAnswersDB(result.session.id);
  const resultsDB = await getInterviewResultsDB(result.session.id);

  return {
    session: {
      ...result.session,
      answers,
      output: resultsDB?.generated_questions || null,
    } as InterviewSession,
    journey_status: result.journey_status,
  };
}

// Validate session access - checks journey status for journey-based sessions
export async function validateSessionAccess(sessionId: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    return { valid: false, reason: "Session not found" };
  }

  // For journey-based sessions, check journey status
  if (session.source === "journey" && session.journey_id) {
    const journeyIsActive = await isJourneyActive(session.journey_id);
    if (!journeyIsActive) {
      return { valid: false, reason: "Journey is no longer active" };
    }
  }

  return { valid: true };
}

//  Get an interview session with answers and results
export async function getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
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
  answers: Record<string, unknown>
): Promise<InterviewSession> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const answersArray = Object.entries(answers).map(([questionKey, answerValue]) => ({
    question_key: questionKey,
    answer_value: answerValue,
  }));

  await saveInterviewAnswersDB(sessionId, answersArray);
  return (await getInterviewSession(sessionId)) as InterviewSession;
}

// Generate personalized interview prep output
export async function generateInterviewPrepOutput(sessionId: string): Promise<InterviewPrepOutput> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  // Initialize variation session cache for consistent variation selection within this session
  initializeVariationSession();

  const answers = await getSessionAnswersDB(sessionId);
  const categoryData = await categoryLoader.loadCategory(session.category_slug);

  // Load rules for the category
  const rules = await loadRulesForCategory(session.category_slug);

  const answersMap: Record<string, unknown> = {};
  answers.forEach((answer) => {
    answersMap[answer.question_key] = answer.answer_value;
  });

  const selectionEngine = new DynamicQuestionSelectionEngine(session.category_slug, rules);
  const applicableQuestions = selectionEngine.selectQuestions(
    answersMap,
    categoryData.questionBank.questions
  );

  const generationEngine = new AnswerGenerationEngine();
  const generatedQuestions = generationEngine.generateAnswers(applicableQuestions, answersMap);

  // Apply variation selection to each question
  const questionsWithVariations = applyVariationsToQuestions(generatedQuestions);

  await saveInterviewResultsDB(sessionId, questionsWithVariations);

  return {
    sessionId,
    questions: questionsWithVariations,
    summary: {
      totalQuestions: categoryData.questionBank.questions.length,
      applicableQuestions: questionsWithVariations.length,
      categories: Array.from(new Set(questionsWithVariations.map((q) => q.category))),
    },
  };
}

//  Mark an interview session as completed
export async function completeInterviewSession(sessionId: string): Promise<InterviewSession> {
  const updatedSession = await updateInterviewSessionDB(sessionId, {
    completed: true,
  });
  return updatedSession;
}

// Get the generated interview prep output
export async function getInterviewPrepOutput(
  sessionId: string
): Promise<InterviewPrepOutput | null> {
  const results = await getInterviewResultsDB(sessionId);
  if (!results) return null;

  return {
    sessionId,
    questions: results.generated_questions as GeneratedQuestion[],
    summary: {
      totalQuestions: (results.generated_questions as GeneratedQuestion[]).length,
      applicableQuestions: (results.generated_questions as GeneratedQuestion[]).filter(
        (q) => q.applicable
      ).length,
      categories: Array.from(
        new Set((results.generated_questions as GeneratedQuestion[]).map((q) => q.category))
      ),
    },
  };
}
