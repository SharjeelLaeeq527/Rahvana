/**
 * IR-5 (parent of U.S. citizen) case-strength profile.
 *
 * IR-5 differs from IR-1 in exactly the places the spouse relationship shows up:
 *   - There is NO marriage, so no marriage date and no prior-marriage-termination
 *     evidence. The relationship proven is PARENT ↔ CHILD, documented by the
 *     petitioner's (the sponsoring child's) birth certificate naming the parent.
 *   - The cross-form (I-130 ↔ DS-260) baseline compares the petitioner's and the
 *     parent's dates of birth — not a marriage date.
 *   - Financials (I-864, 125% poverty guideline), civil documents, medical exam,
 *     police/polio certificates, and the interview are IDENTICAL to IR-1.
 *
 * Because of that, this file reuses `COMMON_STEP_CHECKERS` for everything and
 * only overrides the five relationship/consistency-sensitive steps. Every shared
 * algorithm (cross-form diff, eligibility disclosures) is imported, not copied.
 */

import {
  COMMON_STEP_CHECKERS,
  sharedDs260Disclosures,
  sharedInterviewDisclosures,
  type StepCheck,
  type StepChecker,
} from "../step-checkers";
import { detectCommonEligibilityRisks, type StepRefs } from "../eligibility-quest-detector";
import { compareFields, type CrossFormField } from "../consistency";
import { COMMON_PHASE2_QUESTIONS, runCommonPhase2Checks } from "../consistency-intelligence";
// UI-free submodule imports (see ir1.ts note).
import { IR5_EVIDENCE_REQUIREMENTS } from "@/lib/journey/evidence-gap/engine";
import { IR5_EVIDENCE_QUESTIONNAIRE } from "@/lib/journey/evidence-gap/types";
import type { RiskFlag } from "../types";
import type { CaseStrengthProfile, RelationshipStrengthSignal } from "./types";

/**
 * IR-5 relationship signal — deliberately a no-op.
 *
 * A parent case has NO marriage, so the spouse "marriage stability" bonus and
 * "short marriage" penalty don't apply. Critically, a large parent↔child age
 * gap is NORMAL (a parent is decades older than the sponsoring child), so the
 * spouse HIGH_AGE_GAP penalty must NOT fire — otherwise every IR-5 case would be
 * wrongly flagged and docked 5 points. The parent-child relationship is instead
 * proven by civil documents, which the engine already credits in SIGNAL 1
 * (required documents). So this signal contributes nothing and, importantly,
 * penalizes nothing.
 */
export const parentChildRelationshipSignal: RelationshipStrengthSignal = () => ({
  scoreDelta: 0,
  positiveSignals: [],
  riskFlags: [],
});

// ─── Category config ─────────────────────────────────────────────────────────

/** Cross-form fields checked for IR-5 (no marriage date — parent has none). */
export const IR5_BASELINE_FIELDS: CrossFormField[] = [
  { field: "petitionerDateOfBirth", label: "Petitioner (sponsoring child) date of birth" },
  { field: "beneficiaryDateOfBirth", label: "Parent (beneficiary) date of birth" },
];

/** Step labels used inside IR-5 advisory text. I-130A is spouse-only, so absent. */
export const IR5_STEP_REFS: StepRefs = {
  documents: "Chapter 1 Step 2 — Gather Documents",
  mainForm: "Chapter 1 Step 4 — Fill I-130",
  reviewSubmit: "Chapter 1 Step 10 — Review & Submit",
};

/**
 * IR-5 eligibility risks = the shared patterns only.
 *
 * A parent case has no marriage bona-fides, so the spouse-only
 * prior-marriage-termination pattern is dropped. The shared patterns (past visa
 * refusal, criminal history, unlawful presence, income concern) apply
 * identically. Parent-specific patterns — petitioner must be a U.S. citizen aged
 * 21+, and the parent-child link must be documented — can be layered here once
 * the IR-5 eligibility quest is authored with its own question ids.
 */
export function detectIr5EligibilityRisks(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined,
  stepRefs: StepRefs = IR5_STEP_REFS
): RiskFlag[] {
  return detectCommonEligibilityRisks(answers, stepRefs);
}

// ─── Category-specific checkers (the only 5 that differ from IR-1) ────────────

// Step 1.4 — capture the cross-form baseline + prove the parent-child link.
const step_1_4: StepChecker = ({ state }) => {
  const checks: StepCheck[] = [];
  const baseline = state.metadata?.consistencyBaseline as any;

  if (!baseline?.petitionerDateOfBirth || !baseline?.beneficiaryDateOfBirth) {
    checks.push({
      level: "warning",
      title: "Date of birth missing",
      hint: "Add both the petitioner's (sponsoring child) and the parent's date of birth — they'll be cross-checked against your civil documents and the DS-260.",
    });
  }

  // The IR-5 equivalent of a marriage certificate is the petitioner's birth
  // certificate naming the parent — this is what proves the qualifying
  // relationship (8 CFR 204.2(d)).
  checks.push({
    level: "info",
    title: "Prove the parent–child relationship",
    hint: "IR-5 approval hinges on documents that link you to your parent — above all your (the petitioner's) birth certificate naming this parent. If a name differs across records, add the affidavit or name-change document that reconciles them.",
  });

  return checks;
};

// Step 1.9 — unresolved eligibility blockers before online submission.
const step_1_9: StepChecker = ({ eligibilityAnswers }) => {
  const checks: StepCheck[] = [];
  const critical = detectIr5EligibilityRisks(eligibilityAnswers).filter(
    (f) => f.severity === "critical"
  );
  if (critical.length > 0) {
    checks.push({
      level: "critical",
      title: `${critical.length} unresolved blocker${critical.length === 1 ? "" : "s"} from eligibility`,
      hint: "Go back to Chapter 1 Step 2 and add the missing documents before submitting.",
    });
  }
  return checks;
};

// Step 1.10 — final pre-submission consistency gate.
const step_1_10: StepChecker = ({ state, eligibilityAnswers }) => {
  const checks: StepCheck[] = [];
  const baseline = state.metadata?.consistencyBaseline as any;

  if (!baseline?.petitionerDateOfBirth || !baseline?.beneficiaryDateOfBirth) {
    checks.push({
      level: "warning",
      title: "Key dates not captured",
      hint: "Go to Chapter 1 Step 4 and save the petitioner and parent dates of birth first.",
    });
  }

  if (detectIr5EligibilityRisks(eligibilityAnswers).some((f) => f.severity === "critical")) {
    checks.push({
      level: "critical",
      title: "Unresolved critical issues — do not submit yet",
      hint: "Fix the critical items in earlier steps first.",
    });
  }

  return checks;
};

// Step 2.3 — DS-260 must repeat the I-130 facts (parent-child version).
const step_2_3: StepChecker = ({ state, eligibilityAnswers }) => {
  const checks: StepCheck[] = [];
  const i130 = state.metadata?.consistencyBaseline as any;
  const ds260 = state.metadata?.ds260Baseline as any;

  if (!i130?.petitionerDateOfBirth && !i130?.beneficiaryDateOfBirth) {
    // No I-130 baseline captured yet — nothing to compare against.
    checks.push({
      level: "warning",
      title: "I-130 baseline not captured",
      hint: "Go to Chapter 1 Step 4 and save the petitioner and parent dates of birth so Rahvana can flag any DS-260 mismatch — inconsistencies are the #1 cause of NVC delays.",
    });
  } else if (!ds260?.capturedAt) {
    // Baseline exists but the DS-260 values haven't been confirmed here.
    const parts: string[] = [];
    if (i130.petitionerDateOfBirth) parts.push(`petitioner DOB ${i130.petitionerDateOfBirth}`);
    if (i130.beneficiaryDateOfBirth) parts.push(`parent DOB ${i130.beneficiaryDateOfBirth}`);
    checks.push({
      level: "info",
      title: "Match these on your DS-260",
      hint: `Keep these identical to your I-130: ${parts.join(", ")}. Names and spellings must match your birth certificate too. Enter your DS-260 dates above so Rahvana can compare the two forms.`,
    });
  } else {
    // Both baselines present — run the real cross-form diff via the shared engine.
    const mismatches = compareFields(i130, ds260, IR5_BASELINE_FIELDS);
    if (mismatches.length === 0) {
      checks.push({
        level: "info",
        title: "DS-260 dates match your I-130",
        hint: "Petitioner and parent dates of birth are consistent across both forms. Keep names and spellings identical too.",
      });
    } else {
      for (const m of mismatches) {
        checks.push({
          level: "critical",
          title: `DS-260 does not match I-130: ${m.label}`,
          hint: `I-130 says ${m.aValue}, DS-260 says ${m.bValue}. Correct one so both forms agree — form-to-form inconsistencies are a leading cause of NVC delays and interview RFEs (9 FAM 504.4).`,
        });
      }
    }
  }

  // Mandatory disclosures — shared across categories (no spouse prior-marriage).
  for (const d of sharedDs260Disclosures(eligibilityAnswers)) checks.push(d);

  return checks;
};

// Step 3.7 — interview readiness: answers must match the filed DS-260.
const step_3_7: StepChecker = ({ eligibilityAnswers }) => {
  const checks: StepCheck[] = [
    {
      level: "info",
      title: "Your interview answers must match your DS-260",
      hint: "Re-read every DS-260 section before interview day. The officer's questions about your relationship to your parent, dates, and history are checked against your filed answers — inconsistencies are the most common cause of 221(g) holds.",
    },
  ];
  for (const d of sharedInterviewDisclosures(eligibilityAnswers)) checks.push(d);
  return checks;
};

// ─── Registry + profile ──────────────────────────────────────────────────────

/** IR-5 registry = every shared checker + the five parent-specific overrides. */
export const IR5_STEP_CHECKERS: Record<string, StepChecker> = {
  ...COMMON_STEP_CHECKERS,
  step_1_4,
  step_1_9,
  step_1_10,
  step_2_3,
  step_3_7,
};

export const IR5_PROFILE: CaseStrengthProfile = {
  id: "ir-5",
  label: "IR-5 — Parent of U.S. Citizen",
  journeyTypes: ["IR5", "IR-5", "ir-5"],
  stepCheckers: IR5_STEP_CHECKERS,
  stepRefs: IR5_STEP_REFS,
  baselineFields: IR5_BASELINE_FIELDS,
  detectEligibilityRisks: detectIr5EligibilityRisks,
  // Parent case: NO marriage, so show/run ONLY the common Phase 2 questions.
  // The spouse prior-marriage questionnaire and its findings are dropped entirely.
  consistency: {
    phase2Questions: COMMON_PHASE2_QUESTIONS,
    runPhase2Checks: runCommonPhase2Checks,
  },
  // Parent case: marriage-free evidence set. Reuses FINANCIAL + IMMIGRATION_HISTORY
  // verbatim, keeps a parent-shaped IDENTITY (no Nikah Nama / MRC) and
  // FAMILY_INTEGRATION (no "children together"), and drops the three
  // bona-fide-marriage categories entirely. Questionnaire matches.
  evidence: {
    requirements: IR5_EVIDENCE_REQUIREMENTS,
    questionnaire: IR5_EVIDENCE_QUESTIONNAIRE,
  },
  // Parent numeric scoring: no marriage/age-gap signals (see note above).
  strengthSignals: {
    relationship: parentChildRelationshipSignal,
  },
};
