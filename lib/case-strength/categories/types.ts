/**
 * Case-strength "category profile" — the Strategy pattern that makes the whole
 * engine visa-category-agnostic.
 *
 * Every visa category (IR-1 spouse, IR-5 parent, and future ones like F-2A,
 * K-1…) is described by ONE object of this shape. The UI and aggregators no
 * longer hardcode `IR1_STEP_CHECKERS`; they resolve a profile from the
 * journey's `journey_type` and read everything they need from it.
 *
 * Adding a new category = adding one file that exports a `CaseStrengthProfile`
 * and registering it in `categories/index.ts`. No engine code changes.
 */

import type { StepChecker } from "../step-checkers";
import type { StepRefs } from "../eligibility-quest-detector";
import type { RiskFlag } from "../types";
import type { CrossFormField } from "../consistency";
import type { Phase2Question, Phase2Runner } from "../consistency-intelligence";
import type { EvidenceGapConfig } from "@/lib/journey/evidence-gap/engine";
import type { LookAheadRule, DocumentEscalationConfig } from "../alert-gating";

export interface CaseStrengthProfile {
  /** Stable slug, e.g. "ir-1" | "ir-5". */
  id: string;
  /** Human-readable name shown in dev tools / logs. */
  label: string;
  /**
   * Every `journey_type` string that should resolve to this profile. Matched
   * case-insensitively and ignoring `-`/`_`/space differences, so "IR1",
   * "IR-1", "ir_1" all map here.
   */
  journeyTypes: string[];
  /**
   * The step-checker registry for this category. By convention it is
   * `{ ...COMMON_STEP_CHECKERS, ...<category-specific checkers> }` so the shared
   * checks are never duplicated.
   */
  stepCheckers: Record<string, StepChecker>;
  /** Labels for the steps referenced inside advisory text (form names, etc.). */
  stepRefs: StepRefs;
  /**
   * The fields compared across forms (I-130 baseline vs DS-260 and later).
   * Spouse compares marriage date + both DOBs; parent compares the two DOBs.
   */
  baselineFields: CrossFormField[];
  /**
   * Maps eligibility-quest answers to advisory risk flags for this category.
   * Shares the common patterns; layers on category-specific ones.
   */
  detectEligibilityRisks: (
    answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined,
    stepRefs?: StepRefs
  ) => RiskFlag[];
  /**
   * Advanced Consistency Intelligence config for this category.
   *   - `phase2Questions`: which optional questionnaire items to SHOW. Spouse
   *     categories include the marriage-history questions; a parent (IR-5) does not.
   *   - `runPhase2Checks`: which Phase 2 runner to EXECUTE. Must match the shown
   *     questions so we never emit a finding for a question we never asked.
   * Phase 1 (timeline/medical/financial/…) is category-agnostic and shared.
   */
  consistency: {
    phase2Questions: readonly Phase2Question[];
    runPhase2Checks: Phase2Runner;
  };
  /**
   * Evidence-gap config for this category.
   *   - `requirements`: the categories + documents the Evidence Gap engine
   *     assesses. Spouse lists bona-fide-marriage categories (relationship,
   *     cohabitation, communication) and marriage certificates; a parent (IR-5)
   *     omits them and keeps only identity/financial/immigration/family.
   *   - `questionnaire`: which optional "do you have…?" items the modal shows.
   * A profile that predates this field can omit it; the UI falls back to IR-1.
   */
  evidence: EvidenceGapConfig;
  /**
   * The category-varying part of the legacy numeric CaseStrengthEngine score.
   * SIGNALs 1/2/5 (documents, financial, roadmap progress) are category-agnostic
   * and stay in the engine. Only the RELATIONSHIP signal differs:
   *   - Spouse (IR-1) scores marriage duration, shared children, and flags a
   *     large sponsor↔beneficiary age gap.
   *   - Parent (IR-5) has no marriage, and a large parent↔child age gap is
   *     EXPECTED — so its signal must not apply the spouse penalties.
   */
  strengthSignals: {
    relationship: RelationshipStrengthSignal;
  };
  /**
   * Which Case Health headline-score model this category uses.
   *   - omitted → legacy 50/50 evidence+consistency score (`computeOverallCaseScore`).
   *     IR-1/CR-1 stay here, unchanged.
   *   - `{ model: "weighted" }` → the 4-ingredient weighted meter
   *     (`computeWeightedCaseScore`): Evidence 40 / Consistency 30 /
   *     Completeness 20 / Risk 10, using user-provided-only evidence. Weights
   *     live in `CASE_SCORE_WEIGHTS` (single tuning point). See
   *     CASE_STRENGTH_ALERT_ESCALATION_PLAN.md §6. IR-5 opts in first.
   */
  caseScore?: CaseScoreProfileConfig;
  /**
   * Opt-in document-checklist escalation (§4–§5). When set, a missing required
   * document moves through the 3-stage lifecycle (to-do → due-soon → critical)
   * driven by proximity to the filing step (deadline-relative when a target date
   * is known, fixed-days fallback otherwise) instead of showing an instant red
   * critical. Omitted → legacy instant-critical behavior (IR-1). Thresholds
   * default to `DEFAULT_DOCUMENT_ESCALATION`; a category may override any of them.
   */
  documentEscalation?: DocumentEscalationConfig;
  /**
   * Deadline-driven deficiencies this category surfaces one chapter early on the
   * dashboard ("Plan ahead", never blocking). Family categories reuse
   * `COMMON_LOOK_AHEAD`; omit (or pass `[]`) for a category with none. Consumed
   * by the alert-gating engine via `GateContext.lookAheadRules`.
   */
  lookAhead?: LookAheadRule[];
}

/** Which headline Case Health score model a category uses. */
export interface CaseScoreProfileConfig {
  /** "weighted" = the 4-ingredient meter (§6). Presence enables opt-in. */
  model: "weighted";
}

/**
 * Normalized, DB-free inputs the engine feeds to a category's relationship
 * signal. The engine does all the date math; the signal is pure arithmetic so
 * profiles never depend on journey/DB types.
 */
export interface RelationshipStrengthInput {
  /** `children_together` case-data flag (spouse only; false for a parent). */
  hasChildrenTogether: boolean;
  /** Years since the marriage date, 0 when there's no marriage / date. */
  marriageYears: number;
  /** |sponsorAge − beneficiaryAge| in whole years, or null if a DOB is missing. */
  ageGapYears: number | null;
}

/** What a relationship signal contributes back to the running score. */
export interface StrengthSignalContribution {
  scoreDelta: number;
  positiveSignals: string[];
  riskFlags: Array<{ code: string; severity: "HIGH" | "MEDIUM" | "LOW"; message: string }>;
}

export type RelationshipStrengthSignal = (
  input: RelationshipStrengthInput
) => StrengthSignalContribution;
