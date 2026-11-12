/**
 * Generic (fallback) case-strength profile.
 *
 * Returned by `resolveCaseStrengthProfile` for any journey whose visa category
 * has no registered profile yet (for example IR-2 before its own profile ships,
 * or a brand-new category). It replaces the old "unknown -> IR-1" fallback,
 * which silently applied SPOUSE rules (marriage evidence, spouse risk flags,
 * marriage-date consistency) to journeys that have nothing to do with a spouse.
 *
 * Rule: "unknown" means "only what is true for every category", never "spouse".
 *   - stepCheckers: none. Checkers are keyed by `step_key`, and step keys are
 *     positional (IR-5's step_1_5 is "Create USCIS Account" while IR-1's is
 *     "Fill I-130A"). Running another category's checkers on an unknown layout
 *     would put advice on the wrong step, so a generic journey gets none.
 *   - detectEligibilityRisks: none. Eligibility quest screen ids and answer
 *     polarity differ per category (see the IR-5 note in `ir5.ts`).
 *   - lookAhead: none (its rules are keyed by step_key too).
 *   - baselineFields: petitioner + beneficiary date of birth only (every
 *     family category has both people; only spouse cases have a marriage date).
 *   - consistency: the common Phase 2 questions only (no marriage history).
 *   - evidence: the two passports only (identity of both people).
 *   - relationship signal: neutral (no marriage bonus, no age-gap penalty).
 *
 * A category that needs real checks gets its own `categories/<slug>.ts` and a
 * registry entry; see docs/case_strength_analysis.md section 3.
 */

import { COMMON_PHASE2_QUESTIONS, runCommonPhase2Checks } from "../consistency-intelligence";
import { DEFAULT_DOCUMENT_ESCALATION } from "../alert-gating";
import type { CrossFormField } from "../consistency";
import type { StepRefs } from "../eligibility-quest-detector";
// UI-free submodule imports (see ir1.ts note).
import { IR5_EVIDENCE_REQUIREMENTS } from "@/lib/journey/evidence-gap/engine";
import type { EvidenceRequirementsConfig } from "@/lib/journey/evidence-gap/engine";
import type { CaseStrengthProfile, RelationshipStrengthSignal } from "./types";

/** Contributes nothing and penalizes nothing. */
export const neutralRelationshipSignal: RelationshipStrengthSignal = () => ({
  scoreDelta: 0,
  positiveSignals: [],
  riskFlags: [],
});

/** Cross-form fields every family category has: both people's dates of birth. */
export const GENERIC_BASELINE_FIELDS: CrossFormField[] = [
  { field: "petitionerDateOfBirth", label: "Petitioner date of birth" },
  { field: "beneficiaryDateOfBirth", label: "Beneficiary date of birth" },
];

/** Neutral step labels (no chapter/step numbers, since the layout is unknown). */
export const GENERIC_STEP_REFS: StepRefs = {
  documents: "the Gather Documents step",
  mainForm: "the main petition form step",
  reviewSubmit: "the Review & Submit step",
};

/** Neutral names: the IR-5 source says "Parent's Passport". */
const GENERIC_PASSPORT_NAMES: Record<string, string> = {
  passport_beneficiary: "Beneficiary Passport",
  passport_petitioner: "Petitioner Passport/US Citizenship",
};

/** Identity evidence only: both passports, no category-specific civil documents. */
export const GENERIC_EVIDENCE_REQUIREMENTS: EvidenceRequirementsConfig = {
  IDENTITY: {
    category: "IDENTITY",
    label: "Identity Documents",
    description: "Passports or citizenship proof for the petitioner and the beneficiary",
    items: IR5_EVIDENCE_REQUIREMENTS.IDENTITY!.items
      .filter((i) => i.id in GENERIC_PASSPORT_NAMES)
      .map((i) => ({ ...i, name: GENERIC_PASSPORT_NAMES[i.id] })),
  },
};

export const GENERIC_PROFILE: CaseStrengthProfile = {
  id: "generic",
  label: "Unregistered category (common checks only)",
  journeyTypes: [],
  stepCheckers: {},
  stepRefs: GENERIC_STEP_REFS,
  baselineFields: GENERIC_BASELINE_FIELDS,
  detectEligibilityRisks: () => [],
  consistency: {
    phase2Questions: COMMON_PHASE2_QUESTIONS,
    runPhase2Checks: runCommonPhase2Checks,
  },
  evidence: {
    requirements: GENERIC_EVIDENCE_REQUIREMENTS,
    questionnaire: [],
  },
  strengthSignals: {
    relationship: neutralRelationshipSignal,
  },
  caseScore: { model: "weighted" },
  documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
  lookAhead: [],
};
