/**
 * Question Variation Selector
 * Randomly selects a variation for each question in a session
 * Ensures consistency within the same session
 */

import { GeneratedQuestion } from "./types";

// Session-based variation cache for consistency
class VariationSessionCache {
  private cache: Map<string, string> = new Map();

  get(questionId: string): string | undefined {
    return this.cache.get(questionId);
  }

  set(questionId: string, selectedQuestion: string): void {
    this.cache.set(questionId, selectedQuestion);
  }

  has(questionId: string): boolean {
    return this.cache.has(questionId);
  }
}

// Global cache instance (created per session)
let sessionCache: VariationSessionCache | null = null;

// Initialize variation cache for a new session
export function initializeVariationSession(): void {
  sessionCache = new VariationSessionCache();
}

// Select a random variation for a question
// For consistency: if already selected in this session, return the same one
export function selectQuestionVariation(question: GeneratedQuestion): string {
  // Check if already selected in this session (consistency)
  if (sessionCache?.has(question.id)) {
    return sessionCache.get(question.id)!;
  }

  // If no variations, use base question as fallback
  if (!question.variations || question.variations.length === 0) {
    const selected = question.question;
    sessionCache?.set(question.id, selected);
    return selected;
  }

  const pool = [question.question, ...(question.variations || [])];
  const selected = pool[Math.floor(Math.random() * pool.length)];

  // Cache for session consistency
  sessionCache?.set(question.id, selected);

  return selected;
}

// Apply variations to all generated questions
// This should be called after questions are generated from the question bank
export function applyVariationsToQuestions(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  return questions.map((question) => ({
    ...question,
    selectedQuestion: selectQuestionVariation(question),
  }));
}

// Get the display text for a question (prefers selectedQuestion if available)
export function getQuestionDisplay(question: GeneratedQuestion): string {
  return question.selectedQuestion || question.question;
}
