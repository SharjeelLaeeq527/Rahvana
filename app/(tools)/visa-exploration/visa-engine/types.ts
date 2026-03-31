/**
 * visa-engine/types.ts
 *
 * Central type definitions for the visa exploration engine.
 * Country-agnostic — no country-specific strings or logic here.
 *
 * CHANGELOG:
 *   March 2026 — Added `getCountryNotes` to CountryData interface.
 *     Optional method that returns origin-aware advisory strings
 *     (e.g. Pakistan polio vaccination requirement, diplomatic passport
 *     exemptions). Called by the UI layer (VisaDetailModal / ResultsScreen)
 *     to inject country-specific banners above visa criteria.
 */

// ─────────────────────────────────────────────────────────────
// THEME TOKENS
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
// VISA INFO
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
// COUNTRY STRUCTURE
// ─────────────────────────────────────────────────────────────
export interface CandidateRule {
  conditions: Record<string, string | string[]>;
  visaCodes: string[];
}

export interface PurposeOption {
  label: string;
  value: string;
  sub?: string;
}

export interface OfficialSource {
  label: string;
  url: string;
}

export interface CountryData {
  country: string;
  code: string;
  flag: string;
  purposes: PurposeOption[];
  visas: VisaDataMap;
  gateQuestions: GateQuestionsMap;

  /**
   * Optional list of official sources shown in the results footer
   * and visa detail modal. Each country data file provides its own.
   */
  officialSources?: OfficialSource[];

  /**
   * Optional origin-aware advisory notes.
   *
   * Returns an array of human-readable warning/info strings that
   * should be displayed prominently in the UI (e.g. as banner alerts
   * above visa criteria) when the user's origin matches specific rules.
   *
   * Examples of use:
   *   - Pakistan: mandatory polio vaccination certificate for all visas
   *   - Pakistan: diplomatic passport exemption from Italian visa requirement
   *   - India: biometric enrollment required at designated VACs only
   *
   * Returning an empty array (or omitting this method) means no
   * origin-specific notes apply — the UI should render nothing extra.
   *
   * The UI layer should call this AFTER the user has selected their
   * origin country and inject the notes into the results/detail views.
   *
   * @param answers - Full current VisaExplorationAnswers state
   * @returns string[] — Advisory strings (may contain emoji prefixes)
   */
  getCountryNotes?: (answers: VisaExplorationAnswers) => string[];

  /**
   * Returns the list of visa codes that are candidates given the
   * current answers. Called by both the step-builder and gate-engine.
   */
  getCandidateCodes: (answers: VisaExplorationAnswers) => string[];

  /**
   * Returns any country-specific intermediate steps to inject between
   * the purpose step and the gate questions. Return [] if none needed.
   */
  buildFollowUpSteps: (answers: VisaExplorationAnswers) => Step[];
}

// ─────────────────────────────────────────────────────────────
// ANSWERS STATE
// ─────────────────────────────────────────────────────────────
export interface VisaExplorationAnswers {
  origin?: string;
  destination?: string;
  purpose?: string;
  sponsor?: string;
  relationship?: string;
  sponsorStatus?: string;
  workType?: string;
  beneficiaryAge?: string;
  petitionerAge?: string;
  workBase?: string;
  workStage?: string;
  tempType?: string;
  gateAnswers?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
// STEP
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
  options?: {
    label: string;
    value: string;
    sub?: string;
    disabled?: boolean;
    emoji?: string;
  }[];
  visaCode?: string;
  visaLabel?: string;
  visaColor?: string;
  questionId?: string;
  passWith?: string[];
  failMsg?: string;
  sourceUrl?: string;
  hint?: string;
}