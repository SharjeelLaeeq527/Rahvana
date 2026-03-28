// Dynamic Interview Preparation - TypeScript Schemas. 
// Defines structure for all category configuration files.

// Category Configuration
export interface InterviewCategoryConfig {
  visaCountry: string;
  categorySlug: string;
  displayName: string;
  description: string;
  metadata: {
    version: string;
    questionnaireVersion: string;
    questionBankVersion: string;
    estimatedDurationMinutes: number;
    totalQuestions: number;
    totalIntakeQuestions: number;
  };
  features: {
    hasRapidFire: boolean;
    hasProfileAutoFill: boolean;
  };
  ui: {
    themeColor: string;
    icon: string;
  };
  isActive: boolean;
}

// Questionnaire Types
export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select';

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface SkipCondition {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
}

export interface DependsOnCondition {
  key: string;
  value?: unknown;
  valueIn?: unknown[];
  notValue?: unknown;
}

export interface DynamicQuestion {
  key: string;
  label: string;
  type: QuestionType;
  required: boolean;
  validation?: QuestionValidation;
  options?: string[];
  helpText?: string;
  placeholder?: string;
  skipIf?: SkipCondition[];
  dependsOn?: DependsOnCondition;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description: string;
  order: number;
  questions: DynamicQuestion[];
}

export interface DynamicQuestionnaire {
  categorySlug: string;
  version: string;
  lastUpdated: string;
  sections: QuestionnaireSection[];
}

// Question Bank Types
export interface InterviewQuestion {
  variations: string[] | undefined;
  id: string;
  category: string;
  question: string;
  suggestedAnswer: string;
  guidance: string;
  tooltip: string;
  priority: 'high' | 'medium' | 'low';
  skipIf?: SkipCondition[];
}

export interface QuestionBank {
  categorySlug: string;
  version: string;
  lastUpdated: string;
  questions: InterviewQuestion[];
}