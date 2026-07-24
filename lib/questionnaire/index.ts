// ============================================================================
// Document Questionnaire Registry
// Central lookup: journey_type string → QuestionnaireConfig
//
// HOW TO ADD A NEW CATEGORY:
//   1. Create  lib/questionnaire/<category>-questionnaire.ts
//      (export a const that satisfies QuestionnaireConfig)
//   2. Import it below and add one entry to QUESTIONNAIRE_REGISTRY.
//   That's it — the engine, UI, and StepView need no changes.
// ============================================================================

import type { QuestionnaireConfig } from "./types";
import { IR1_QUESTIONNAIRE_CONFIG } from "./ir1-questionnaire";
import { IR5_QUESTIONNAIRE_CONFIG } from "./ir5-questionnaire";

// ── Registry ────────────────────────────────────────────────────────────────
// Keys are normalized `journey_type` values (e.g., "ir-1", "cr-1", "ir-5").
// ────────────────────────────────────────────────────────────────────────────
const QUESTIONNAIRE_REGISTRY: Record<string, QuestionnaireConfig> = {
  // ── Immediate Relative — Spouse ──────────────────────────────────
  "ir-1": IR1_QUESTIONNAIRE_CONFIG,
  "cr-1": IR1_QUESTIONNAIRE_CONFIG, // CR-1 shares the same doc list as IR-1

  // ── Immediate Relative — Parent ──────────────────────────────────
  "ir-5": IR5_QUESTIONNAIRE_CONFIG,

  // ── Future categories (uncomment + create the config file) ───────
  // "k-1":   K1_QUESTIONNAIRE_CONFIG,   // K-1: Fiancé(e) visa
  // "f-1":   F1_QUESTIONNAIRE_CONFIG,   // F-1: Student visa
  // "b-2":   B2_QUESTIONNAIRE_CONFIG,   // B-2: Tourist/visitor visa
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Normalizes a journey_type string to a standard canonical form
 * (e.g. "ir1-journey", "IR1", "ir-1" → "ir-1").
 */
export function normalizeJourneyType(type: string): string {
  let clean = type.toLowerCase().trim();
  // Remove "-journey" or "journey" suffix
  clean = clean.replace(/-?journey$/, "");
  // Insert a dash between letters and numbers if missing (e.g. ir1 -> ir-1, ir5 -> ir-5)
  clean = clean.replace(/^([a-z]+)(\d+)$/, "$1-$2");
  // Replace underscores or spaces with dashes
  return clean.replace(/[_\s]+/g, "-");
}

/**
 * Look up the questionnaire config for a given journey_type.
 *
 * @param journeyType - The `journey_type` field from RoadmapDataV3
 *                      (e.g. "ir1-journey", "k1-journey").
 *                      Comparison is case-insensitive and normalized.
 * @returns The matching QuestionnaireConfig, or `null` if the category
 *          has no questionnaire configured yet.
 */
export function getQuestionnaireConfig(
  journeyType: string | undefined | null
): QuestionnaireConfig | null {
  if (!journeyType) return null;
  const key = normalizeJourneyType(journeyType);
  return QUESTIONNAIRE_REGISTRY[key] ?? null;
}

// Re-export individual configs and all types for convenience
export { IR1_QUESTIONNAIRE_CONFIG };
export { IR5_QUESTIONNAIRE_CONFIG };
export type { QuestionnaireConfig } from "./types";
export type {
  QuestionnaireQuestion,
  QuestionnaireAnswers,
  QuestionnaireResult,
  ConditionalDocument,
  EligibilityDerivationMap,
  EligibilityDerivationEntry,
} from "./types";
