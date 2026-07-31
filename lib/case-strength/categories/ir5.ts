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
  COMMON_LOOK_AHEAD,
  type StepCheck,
  type StepChecker,
} from "../step-checkers";
import type { StepRefs } from "../eligibility-quest-detector";
import { DEFAULT_DOCUMENT_ESCALATION } from "../alert-gating";
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
  documents: "Chapter 1 Step 2, Gather Documents",
  mainForm: "Chapter 1 Step 4, Fill I-130",
  reviewSubmit: "Chapter 1 Step 10, Review & Submit",
};

/**
 * IR-5 eligibility risks.
 *
 * IMPORTANT: IR-5 must NOT reuse the IR-1 (`detectCommonEligibilityRisks`)
 * detector. The IR-5 eligibility quest (`data/visa-category/ir-5.json` → q5) uses
 * DIFFERENT screen ids AND different answer polarity than IR-1:
 *   - IR-1 q5s4 = unlawful presence; IR-5 q5s4 = HEALTH/vaccination.
 *   - IR-1 q5s3 is unused; IR-5 q5s3 = unlawful presence.
 *   - IR-1 q5s5 "yes" = "there IS an income concern" → flag;
 *     IR-5 q5s5 "yes" = "sponsorship is manageable" (GOOD) → must NOT flag.
 * Reusing the IR-1 detector therefore fired a false "income too low" warning on
 * every well-funded parent case and mislabeled a health answer as an overstay
 * waiver. This detector maps IR-5's real q5 screens (mirrors the json's
 * `risk_signals.patterns` + `result_logic`).
 */
export function detectIr5EligibilityRisks(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined,
  stepRefs: StepRefs = IR5_STEP_REFS
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (!answers) return flags;

  const get = (quest: string, screen: string): string | undefined => {
    const val = answers?.[quest]?.[screen];
    return typeof val === "string" ? val : undefined;
  };

  // q5s1 — parent's prior visa refusal / removal / fraud ("yes" = issue exists)
  if (get("q5", "q5s1") === "yes") {
    flags.push({
      id: "parent_immigration_or_fraud_history",
      title: "Parent's past immigration issue, disclose it",
      severity: "critical",
      advisory: `Disclose every prior refusal, removal, or immigration filing for the parent in ${stepRefs.mainForm} and add the records in ${stepRefs.documents}. Fraud or misrepresentation can create a permanent bar unless a waiver is available.`,
      source_basis: "INA 212(a)(6)(C); INA 212(a)(9)",
    });
  }

  // q5s2 — parent's criminal history ("yes" = issue exists)
  if (get("q5", "q5s2") === "yes") {
    flags.push({
      id: "parent_criminal_history",
      title: "Parent's court / police record, disclose it",
      severity: "critical",
      advisory: `Collect certified court and police records for every incident and add them in ${stepRefs.documents}. Also disclose them in ${stepRefs.mainForm}.`,
      source_basis: "INA 212(a)(2)",
    });
  }

  // q5s3 — parent's unlawful presence / status violation ("yes" = issue exists)
  // NOTE: this is q5s3 for IR-5 (it was q5s4 for IR-1).
  if (get("q5", "q5s3") === "yes") {
    flags.push({
      id: "unlawful_presence_history",
      title: "Parent's U.S. overstay, waiver may be needed",
      severity: "critical",
      advisory: `Departure after unlawful presence can trigger a 3- or 10-year bar (a Form I-601A waiver may be required before the interview). Review the parent's full entry/exit history and disclose it in ${stepRefs.mainForm}.`,
      source_basis: "INA 212(a)(9)(B)",
    });
  }

  // q5s4 — medical / vaccination concern ("yes" = a concern may arise)
  // IR-5-specific screen; the IR-1 detector has no equivalent here.
  if (get("q5", "q5s4") === "yes") {
    flags.push({
      id: "medical_vaccination_concern",
      title: "Medical or vaccination issue to plan for",
      severity: "warning",
      advisory:
        "A health or vaccination concern may come up at the immigrant-visa medical exam. The panel physician decides, a condition does not automatically make the parent ineligible. Gather medical/vaccination records ahead of the exam.",
      source_basis: "INA 212(a)(1)",
    });
  }

  // q5s5 — financial sponsorship. FIXED POLARITY: "yes" = manageable (no flag);
  // "possible" / "no" / "unsure" = sponsorship may be short → flag.
  const q5s5 = get("q5", "q5s5");
  if (q5s5 === "possible" || q5s5 === "no" || q5s5 === "unsure") {
    flags.push({
      id: "financial_sponsorship_concern",
      title: "Income may be too low",
      severity: "warning",
      advisory:
        "The petitioner's income may not meet the required level. Rahvana will handle the Affidavit of Support (I-864) at the NVC stage, review qualifying assets, household-member income, or start arranging a joint sponsor now if needed. A joint sponsor does not replace the petitioner's own I-864.",
      source_basis: "INA 213A, Form I-864",
    });
  }

  // q5s6 — U.S. domicile. "yes" = established (no flag); needs-a-plan values flag.
  const q5s6 = get("q5", "q5s6");
  if (q5s6 === "reestablish" || q5s6 === "no" || q5s6 === "unsure") {
    flags.push({
      id: "domicile_concern",
      title: "U.S. domicile needs attention",
      severity: "warning",
      advisory:
        "A petitioner living abroad must show an existing U.S. domicile or concrete steps to re-establish it no later than the parent's admission. Start gathering domicile evidence now.",
      source_basis: "INA 213A, Form I-864",
    });
  }

  // q5s7 — separate I-130 per parent. "no"/"unsure" = expected one petition to cover more.
  const q5s7 = get("q5", "q5s7");
  if (q5s7 === "no" || q5s7 === "unsure") {
    flags.push({
      id: "separate_petition_required",
      title: "File a separate I-130 for each parent",
      severity: "warning",
      advisory:
        "IR-5 petitions give no derivative status, a spouse or other relative cannot immigrate on the same petition. File a separate Form I-130 for each parent.",
      source_basis: "Immediate-relative classification rules",
    });
  }

  return flags;
}

// ─── IR-5-Specific Disclosure Functions ─────────────────────────────────────
// IR-5 (parent) has different q5 mapping than IR-1 (spouse):
//   - IR-1: q5s4 = overstay
//   - IR-5: q5s3 = overstay, q5s4 = health concern (not overstay)
// These functions use the correct IR-5 mapping.

function ir5Ds260Disclosures(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined
): StepCheck[] {
  if (!answers) return [];
  const checks: StepCheck[] = [];
  const get = (q: string, s: string) => {
    const v = answers?.[q]?.[s];
    return typeof v === "string" ? v : undefined;
  };
  if (get("q5", "q5s1") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose the past visa refusal on DS-260",
      hint: "Every prior U.S. visa refusal or application must be declared. Omitting it risks a misrepresentation finding.",
    });
  }
  if (get("q5", "q5s2") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose the court/police record on DS-260",
      hint: "Declare any arrest or charge. Bring certified court and police records to the interview.",
    });
  }
  if (get("q5", "q5s3") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose the prior U.S. overstay on DS-260",
      hint: "Declare any unlawful presence. A provisional waiver (I-601A) may be needed before the interview.",
    });
  }
  return checks;
}

function ir5InterviewDisclosures(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined
): StepCheck[] {
  if (!answers) return [];
  const checks: StepCheck[] = [];
  const get = (q: string, s: string) => {
    const v = answers?.[q]?.[s];
    return typeof v === "string" ? v : undefined;
  };
  if (get("q5", "q5s1") === "yes") {
    checks.push({
      level: "info",
      title: "Be ready to explain the past visa refusal",
      hint: "The officer can see prior U.S. visa refusals. Answer consistently with what you declared on the DS-260.",
    });
  }
  if (get("q5", "q5s2") === "yes") {
    checks.push({
      level: "info",
      title: "Bring originals for the court/police record",
      hint: "If you disclosed an arrest or charge, bring the certified court and police records and be ready to explain the outcome briefly and truthfully.",
    });
  }
  if (get("q5", "q5s3") === "yes") {
    checks.push({
      level: "info",
      title: "Be ready to explain the prior U.S. overstay",
      hint: "If you disclosed unlawful presence, be prepared to explain it. Confirm whether a waiver applies to your case before the interview.",
    });
  }
  return checks;
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
      hint: "Add both the petitioner's (sponsoring child) and the parent's date of birth, they'll be cross-checked against your civil documents and the DS-260.",
    });
  }

  // The IR-5 equivalent of a marriage certificate is the petitioner's birth
  // certificate naming the parent — this is what proves the qualifying
  // relationship (8 CFR 204.2(f) — Petition for a parent).
  checks.push({
    level: "info",
    title: "Prove the parent-child relationship",
    hint: "IR-5 approval hinges on documents that link you to your parent, above all your (the petitioner's) birth certificate naming this parent. If a name differs across records, add the affidavit or name-change document that reconciles them.",
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
      title: "Unresolved critical issues, do not submit yet",
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
      hint: "Go to Chapter 1 Step 4 and save the petitioner and parent dates of birth so Rahvana can flag any DS-260 mismatch, inconsistencies are the #1 cause of NVC delays.",
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
          hint: `I-130 says ${m.aValue}, DS-260 says ${m.bValue}. Correct one so both forms agree, form-to-form inconsistencies are a leading cause of NVC delays and interview RFEs (9 FAM 504.4).`,
        });
      }
    }
  }

  // Mandatory disclosures — IR-5 specific (q5s3 = overstay, not q5s4).
  for (const d of ir5Ds260Disclosures(eligibilityAnswers)) checks.push(d);

  return checks;
};

// Step 3.7 — interview readiness: answers must match the filed DS-260.
const step_3_7: StepChecker = ({ eligibilityAnswers }) => {
  const checks: StepCheck[] = [
    {
      level: "info",
      title: "Your interview answers must match your DS-260",
      hint: "Re-read every DS-260 section before interview day. The officer's questions about your relationship to your parent, dates, and history are checked against your filed answers, inconsistencies are the most common cause of 221(g) holds.",
    },
  ];
  for (const d of ir5InterviewDisclosures(eligibilityAnswers)) checks.push(d);
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
  label: "IR-5, Parent of U.S. Citizen",
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
  // IR-5 pilots the 4-ingredient weighted Case Health score (§6). IR-1 stays on
  // the legacy 50/50 model until this is validated on IR-5.
  caseScore: { model: "weighted" },
  // IR-5 pilots the document-checklist escalation (§4–§5): missing docs start as
  // a calm to-do and only turn red near the filing step, instead of instant red.
  documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
  // Same deadline-driven early-warnings as IR-1 (identical financial + PCC steps).
  lookAhead: COMMON_LOOK_AHEAD,
};
