import { Questionnaire, Section } from "./engine-types";

export type CaseType = string; // e.g., 'ir-1', 'k-1'

export type RiskLevel = 'PENDING' | 'WEAK' | 'MODERATE' | 'STRONG';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type QuestionKey = string;

// existing FlagCode remains for backend compatibility but is now also TEXT in DB
export type FlagCode = string;

export interface CreateSessionRequest {
  userEmail?: string;
  userName?: string;
  caseType: CaseType;
}

export interface CreateSessionResponse {
  sessionId: string;
  message: string;
}

export interface SaveAnswersRequest {
  answers: Record<string, unknown>;
}

export interface SessionDetailsResponse {
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  caseType: CaseType;
  overallScore?: number;
  riskLevel?: RiskLevel;
  completed: boolean;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitQuestionnaireRequest {
  calculateImmediately?: boolean;
}

export interface RiskFlagResponse {
  flagCode: FlagCode;
  severity: RiskSeverity;
  pointsDeducted: number;
  explanation: string;
  improvementSuggestions: string;
}

export interface ScoringResultsResponse {
  sessionId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  totalPossiblePoints: number;
  totalDeductedPoints: number;
  riskFlags: RiskFlagResponse[];
  summaryReasons: string[];
  improvementSuggestions: string[];
}

export interface DeleteSessionResponse {
  sessionId: string;
  deleted: boolean;
  message: string;
}

export interface QuestionStepProps {
  questionnaire: Questionnaire;
  section: Section;
  formData: Record<string, unknown>;
  error?: string;
  loading?: boolean;
  onChange: (id: string, value: unknown) => void;
  setFormData: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ReviewStepProps {
  questionnaire: Questionnaire;
  formData: Record<string, unknown>;
  error?: string;
  loading?: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onSaveToProfile?: () => void;
}