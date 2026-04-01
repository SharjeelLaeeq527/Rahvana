import { IntakeQuestionnaire, QuestionBank } from "./types";

// Loads the intake questionnaire from the data file
export async function loadIntakeQuestionnaire(): Promise<IntakeQuestionnaire> {
  // In production, this will be loaded from the filesystem
  // For now, return a basic structure that will be populated at runtime
  const data = {
    caseType: "Spouse",
    sections: []
  };
  
  // This function would typically load from a database or external source in production
  // The actual implementation would depend on your deployment setup
  return data as IntakeQuestionnaire;
}

// Loads the question bank from the data file
export async function loadQuestionBank(): Promise<QuestionBank> {
  // In production, this will be loaded from the filesystem
  // For now, return a basic structure that will be populated at runtime
  const data = {
    caseType: "Spouse",
    version: "1.0",
    questions: []
  };
  
  // This function would typically load from a database or external source in production
  // The actual implementation would depend on your deployment setup
  return data as QuestionBank;
}

// Validates required fields in intake answers
export function validateIntakeAnswers(answers: Record<string, unknown>, questionnaire: IntakeQuestionnaire): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  for (const section of questionnaire.sections) {
    for (const question of section.questions) {
      if (question.required && (answers[question.key] === undefined || answers[question.key] === null || answers[question.key] === '')) {
        errors.push(`Missing required answer for: ${question.label}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Normalizes user input values
export function normalizeInputValues(answers: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === 'string') {
      normalized[key] = value.trim();
    } else if (value === 'true') {
      normalized[key] = true;
    } else if (value === 'false') {
      normalized[key] = false;
    } else {
      normalized[key] = value;
    }
  }
  
  return normalized;
}

// Generates a unique ID for a generated question
export function generateQuestionId(category: string, question: string): string {
  // Create a simple hash-like ID based on category and question
  const baseString = `${category}-${question}`.toLowerCase().replace(/\s+/g, '-');
  return `${baseString}-${Date.now()}`;
}

// Helper function to generate AI prompt based on improvement type
export function generatePrompt(
  question: string,
  answer: string,
  type: string = 'clarity'
): string {
  const prompts: Record<string, string> = {
    clarity: `
You are an immigration interview coach. Improve this answer for CLARITY and STRUCTURE.

QUESTION: "${question}"
CURRENT ANSWER: "${answer}"

Make it clearer, easier to understand, and better organized while keeping the user's authentic voice and facts intact.
Return ONLY the improved answer, no explanations or markdown formatting.
    `.trim(),
    professional: `
You are an immigration interview coach. Make this answer more PROFESSIONAL in tone.

QUESTION: "${question}"
CURRENT ANSWER: "${answer}"

Polish the tone to be more professional and formal while keeping it sincere and authentic. Remove informal language or filler words.
Return ONLY the improved answer, no explanations or markdown formatting.
    `.trim(),
    complete: `
You are an immigration interview coach. Make this answer more COMPLETE and DETAILED.

QUESTION: "${question}"
CURRENT ANSWER: "${answer}"

Add relevant details that strengthen the answer and show deeper understanding. Consider what an immigration officer would want to know.
Return ONLY the improved answer, no explanations or markdown formatting.
    `.trim(),
    concise: `
You are an immigration interview coach. Make this answer more CONCISE and FOCUSED.

QUESTION: "${question}"
CURRENT ANSWER: "${answer}"

Remove unnecessary details while keeping the most important information. Make it direct and to the point.
Return ONLY the improved answer, no explanations or markdown formatting.
    `.trim(),
  };

  return prompts[type] || prompts['clarity'];
}
