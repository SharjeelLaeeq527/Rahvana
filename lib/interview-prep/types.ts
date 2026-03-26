// Types for the IR/CR-1 Interview Preparation Tool
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
  suggestedAnswer: string;
  guidance: string;
  tooltip: string;
}

export interface QuestionBank {
  caseType: string;
  version: string;
  questions: QuestionBankEntry[];
}

export interface GeneratedQuestion {
  id: string;
  category: string;
  question: string;
  variations?: string[];
  selectedQuestion?: string; 
  suggestedAnswer: string;
  guidance: string;
  tooltip: string;
  applicable: boolean;
  priority: 'high' | 'medium' | 'low';
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