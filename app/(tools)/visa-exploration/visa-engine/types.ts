/**
 * visa-engine/types.ts
 *
 * Shared TypeScript interfaces for the entire visa engine.
 * Country-agnostic — no US-specific references here.
 */

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
export const T = {
  primary:      "#0D6E6E",
  primaryLight: "#E8F4F4",
  primaryDark:  "#095555",
  text:         "#1a2332",
  textMuted:    "#6b7280",
  textLight:    "#9ca3af",
  border:       "#e5e7eb",
  bg:           "#f8fafa",
  white:        "#ffffff",
  success:      "#059669",
  successLight: "#ecfdf5",
  warning:      "#d97706",
  warningLight: "#fffbeb",
};

// ─────────────────────────────────────────────────────────────
// VISA DEFINITION
// ─────────────────────────────────────────────────────────────
export interface VisaInfo {
  code: string;
  label: string;
  badge: string;
  color: string;
  description: string;
  criteria: string[];
  processing: string;
  forms: string[];
}

export type VisaDataMap = Record<string, VisaInfo>;

// ─────────────────────────────────────────────────────────────
// GATE QUESTIONS
// ─────────────────────────────────────────────────────────────
export interface GateQuestion {
  id: string;
  question: string;
  source: string;
  sourceUrl: string;
  passWith: string[];
  failMsg: string;
  options: { label: string; value: string }[];
}

export type GateQuestionsMap = Record<string, GateQuestion[]>;

// ─────────────────────────────────────────────────────────────
// CANDIDATE RULE  (data-driven, used by future countries)
// ─────────────────────────────────────────────────────────────
export interface CandidateRule {
  conditions: Record<string, string | string[]>;
  visaCodes: string[];
}

// ─────────────────────────────────────────────────────────────
// PURPOSE OPTION  (shown in step 3)
// ─────────────────────────────────────────────────────────────
export interface PurposeOption {
  label: string;
  value: string;
  sub?: string;
}

// ─────────────────────────────────────────────────────────────
// FULL COUNTRY DATA  (one object per country)
// ─────────────────────────────────────────────────────────────
export interface CountryData {
  country: string;
  code: string;      // ISO 2-letter: "US", "UK", "CA"
  flag: string;      // emoji
  purposes: PurposeOption[];
  visas: VisaDataMap;
  gateQuestions: GateQuestionsMap;
  /** getCandidateCodes function key — each country exports its own */
  getCandidateCodes: (answers: VisaExplorationAnswers) => string[];
  /** buildFollowUpSteps function key — each country exports its own wizard sequence */
  buildFollowUpSteps: (answers: VisaExplorationAnswers) => Step[];
}

// ─────────────────────────────────────────────────────────────
// WIZARD STATE
// ─────────────────────────────────────────────────────────────
export interface VisaExplorationAnswers {
  origin?: string;
  destination?: string;
  purpose?: string;
  sponsor?: string;
  relationship?: string;
  beneficiaryAge?: string;
  petitionerAge?: string;
  workBase?: string;
  tempType?: string;
  gateAnswers?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
// WIZARD STEP
// ─────────────────────────────────────────────────────────────
export interface Step {
  id: string;
  type: "country" | "options" | "grid" | "unsupported" | "gate_question" | "info";
  field?: string;
  title?: string;
  subtitle?: string;
  canProceed: boolean;
  isUnsupported?: boolean;
  isDestination?: boolean;
  options?: { label: string; value: string; sub?: string; disabled?: boolean; emoji?: string }[];
  visaCode?: string;
  visaLabel?: string;
  visaColor?: string;
  questionId?: string;
  passWith?: string[];
  failMsg?: string;
  sourceUrl?: string;
  hint?: string;
}
