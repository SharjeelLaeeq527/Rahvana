import { Dispatch, SetStateAction } from "react";
import { Questionnaire, Section } from "@/lib/visa-checker/engine-types";

export type CaseType = string;

export interface FormData extends Record<string, unknown> {
  caseType: CaseType;
}

export interface CaseTypeStepProps {
  formData: { caseType: string };
  error?: string;
  onCaseTypeChange: (caseType: string) => void;
  isAuthenticated: boolean;
  loading?: boolean;
  onNext: () => void;
  onBack: () => void;
}

export interface QuestionStepProps {
  questionnaire: Questionnaire;
  section: Section;
  formData: Record<string, unknown>;
  error?: string;
  loading?: boolean;
  onChange: (id: string, value: unknown) => void;
  setFormData: Dispatch<SetStateAction<Record<string, unknown>>>;
  onNext: () => void;
  onBack: () => void;
}

export interface ReviewStepProps {
  questionnaire: Questionnaire;
  formData: Record<string, unknown>;
  error?: string;
  loading?: boolean;
  onSubmit: () => void | Promise<void>;
  onBack: () => void;
  onSaveToProfile?: () => Promise<void> | void;
}
