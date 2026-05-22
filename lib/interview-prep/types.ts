// Types for the Interview Preparation Tool
export interface InterviewSession {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  category_slug: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  answers?: unknown[];
  output?: unknown[];
}

export interface InterviewSessionInput {
  category_slug: string;
  user_id?: string;
  user_email: string;
  user_name: string;
}

export interface InterviewAnswer {
  id: string;
  session_id: string;
  question_key: string;
  answer_value: unknown;
  created_at: string;
}

export interface InterviewResult {
  id: string;
  session_id: string;
  generated_questions: unknown[];
  created_at: string;
}

export interface InterviewPrepRoundSummary {
  coveredCount: number;
  partialCount: number;
  missedCount: number;
  skippedCount: number;
  earnedPoints: number;
  possiblePoints: number;
  readinessScore: number;
  weakQuestionIds: string[];
}

export interface InterviewPrepQuestionResponse {
  question: GeneratedQuestion;
  response: "covered" | "partial" | "missed" | "skipped" | null;
  index: number;
}

export type InterviewPrepProgressScreen = "training" | "results" | "completed";

export interface InterviewPrepSessionProgress {
  id: string;
  session_id: string;
  current_round: number;
  current_question_index: number;
  round_question_ids: string[];
  completed_question_ids: string[];
  retry_question_ids: string[];
  mastered_question_ids: string[];
  question_responses: InterviewPrepQuestionResponse[];
  round_summary: InterviewPrepRoundSummary | null;
  last_round_score: number;
  total_rounds_completed: number;
  score: number;
  time_left: number;
  show_answer: boolean;
  is_flipped: boolean;
  user_response: InterviewPrepQuestionResponse["response"];
  skipped_questions: number;
  screen: InterviewPrepProgressScreen;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InterviewPrepSessionProgressInput {
  current_round: number;
  current_question_index: number;
  round_question_ids: string[];
  completed_question_ids: string[];
  retry_question_ids: string[];
  mastered_question_ids: string[];
  question_responses: InterviewPrepQuestionResponse[];
  round_summary: InterviewPrepRoundSummary | null;
  last_round_score: number;
  total_rounds_completed: number;
  score: number;
  time_left: number;
  show_answer: boolean;
  is_flipped: boolean;
  user_response: InterviewPrepQuestionResponse["response"];
  skipped_questions: number;
  screen: InterviewPrepProgressScreen;
  completed: boolean;
}

// Interfaces for intake questionnaire and question bank
export interface IntakeQuestion {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface IntakeSection {
  id: string;
  title: string;
  description: string;
  questions: IntakeQuestion[];
}

export interface IntakeQuestionnaire {
  caseType: string;
  sections: IntakeSection[];
}

export interface QuestionBankEntry {
  category: string;
  question: string;
  sampleAnswer: string;
  guidance: string;
  tooltip: string;
  mockInterviewOrder?: number;
}

export interface QuestionBank {
  caseType: string;
  version: string;
  questions: QuestionBankEntry[];
}

export interface GeneratedQuestion {
  sampleAnswer: string;
  id: string;
  category: string;
  question: string;
  variations?: string[];
  selectedQuestion?: string; 
  guidance: string;
  tooltip: string;
  applicable: boolean;
  priority: 'high' | 'medium' | 'low';
  mockInterviewOrder?: number;
  reason?: string;
}

export interface InterviewPrepOutput {
  sessionId: string;
  questions: GeneratedQuestion[];
  summary: {
    totalQuestions: number;
    applicableQuestions: number;
    categories: string[];
  };
}

// Interfaces for user answers with AI improvements
export interface AIImprovement {
  version: number;
  originalAnswer: string;
  improvedAnswer: string;
  improvementType: 'clarity' | 'professional' | 'complete' | 'concise';
  generatedAt: string;
  acceptedAt?: string;
}

export interface UserAnswer {
  id: string;
  session_id: string;
  question_id: string;
  user_answer_text: string;
  word_count: number;
  ai_improvements: AIImprovement[];
  confidence_score?: number;
  status: 'draft' | 'completed' | 'improved';
  created_at: string;
  updated_at: string;
}