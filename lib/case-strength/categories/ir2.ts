/**
 * IR-2 / CR-2 (child of U.S. citizen) case-strength profile.
 *
 * IR-2 differs from IR-1 in exactly the places child immigration law governs:
 *   - The qualifying relationship is PARENT ↔ CHILD (INA § 101(b)(1)), proven
 *     by the child's birth certificate naming the petitioner, legitimation records
 *     (father out of wedlock), stepchild marriage certificate before age 18, or
 *     final adoption decree before age 16 with 2 years legal custody + residence.
 *   - There is NO marriage between petitioner and beneficiary, so no spouse
 *     bonuses/penalties apply. A large parent-child age gap is expected and normal.
 *   - Cross-form (I-130 ↔ DS-260) baseline checks petitioner DOB, child DOB, and
 *     child marital status (must remain unmarried).
 *   - Financials (I-864 or I-864W Child Citizenship Act exemption), civil documents,
 *     police clearance (for children 16+), and interview prep reflect child rules.
 *
 * Checkers reuse COMMON_STEP_CHECKERS for shared steps and override the 5
 * relationship/consistency steps, mapped to IR-2's 24-step Chapter 1 layout (no I-130A).
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
import { IR2_EVIDENCE_REQUIREMENTS } from "@/lib/journey/evidence-gap/engine";
import { IR2_EVIDENCE_QUESTIONNAIRE } from "@/lib/journey/evidence-gap/types";
import type { RiskFlag } from "../types";
import type { CaseStrengthProfile, RelationshipStrengthSignal } from "./types";

/**
 * IR-2 child relationship signal — deliberately a no-op.
 *
 * A child case has NO marriage between sponsor and beneficiary, so spouse bonuses
 * and penalties do not apply. A large parent-child age gap is expected and must
 * not be penalized. Qualifying parent-child relationships are documented via civil
 * records assessed in SIGNAL 1 (required documents).
 */
export const childRelationshipSignal: RelationshipStrengthSignal = () => ({
  scoreDelta: 0,
  positiveSignals: [],
  riskFlags: [],
});

// ─── Category config ─────────────────────────────────────────────────────────

/** Cross-form fields checked for IR-2 (petitioner DOB, child DOB, marital status). */
export const IR2_BASELINE_FIELDS: CrossFormField[] = [
  { field: "petitionerDateOfBirth", label: "Petitioner (sponsoring parent) date of birth" },
  { field: "beneficiaryDateOfBirth", label: "Child (beneficiary) date of birth" },
  { field: "childMaritalStatus", label: "Child marital status (must be unmarried)" },
];

/** Step labels used inside IR-2 advisory text (no I-130A step). */
export const IR2_STEP_REFS: StepRefs = {
  documents: "Chapter 1 Step 2, Gather Required Documents",
  mainForm: "Chapter 1 Step 4, Fill Form I-130",
  reviewSubmit: "Chapter 1 Step 9, Review & Submit",
};

/**
 * IR-2 eligibility risks.
 *
 * Directly maps screens and polarities from `data/visa-category/ir-2.json`
 * `quest_data` (q1..q5) and `risk_signals.patterns`.
 */
export function detectIr2EligibilityRisks(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined,
  stepRefs: StepRefs = IR2_STEP_REFS
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (!answers) return flags;

  const get = (quest: string, screen: string): string | undefined => {
    const val = answers?.[quest]?.[screen];
    return typeof val === "string" ? val : undefined;
  };

  // q1s1 — Petitioner citizenship (value != "citizen")
  const q1s1 = get("q1", "q1s1");
  if (q1s1 && q1s1 !== "citizen") {
    flags.push({
      id: "petitioner_not_us_citizen",
      title: "Petitioner is not a U.S. citizen",
      severity: "critical",
      advisory: `Only a U.S. citizen parent can file an IR-2 petition. A permanent resident (green card holder) parent must file in the F-2A preference category instead.`,
      source_basis: "INA 201(b)(2)(A)(i); INA 203(a)(2)(A)",
    });
  }

  // q2s1 — Relationship category risks
  const q2s1 = get("q2", "q2s1");
  if (q2s1 === "bio_father_unmarried") {
    flags.push({
      id: "father_born_out_of_wedlock",
      title: "Father's petition for a child born outside marriage",
      severity: "warning",
      advisory: `When a biological father petitions for a child born out of wedlock, USCIS requires proof of legitimation prior to age 18 or documentary evidence of an ongoing bona fide father-child relationship before age 21. Add relationship records in ${stepRefs.documents}.`,
      source_basis: "INA 101(b)(1)(C) and (D); Form I-130 Instructions",
    });
  } else if (q2s1 === "guardian_other") {
    flags.push({
      id: "guardian_not_parent",
      title: "Petitioner is only a guardian, foster parent, or relative",
      severity: "critical",
      advisory: `Legal guardianship, custody orders, or raising a child does not create a qualifying parent-child relationship for IR-2. Consult a qualified U.S. immigration attorney before filing.`,
      source_basis: "INA 101(b); USCIS family-based relationship rules",
    });
  }

  // q2s2 — Child age / CSPA age-out
  const q2s2 = get("q2", "q2s2");
  if (q2s2 === "21_plus") {
    flags.push({
      id: "child_21_or_older",
      title: "Child is 21 or older",
      severity: "critical",
      advisory: `A son or daughter aged 21 or older does not qualify as an IR-2 immediate relative unless Form I-130 was filed prior to their 21st birthday under CSPA. Review the filing date and CSPA rules.`,
      source_basis: "INA 101(b)(1); INA 201(f)(1)",
    });
  } else if (q2s2 === "18_20") {
    flags.push({
      id: "child_close_to_21",
      title: "Child is close to 21",
      severity: "warning",
      advisory: `File Form I-130 as soon as possible. Under the Child Status Protection Act (CSPA), an immediate-relative child's age is locked on the date USCIS receives the properly filed Form I-130.`,
      source_basis: "INA 201(f)(1)",
    });
  }

  // q2s3 — Child marital status (must remain unmarried)
  const q2s3 = get("q2", "q2s3");
  if (q2s3 === "married") {
    flags.push({
      id: "child_married",
      title: "Child is married",
      severity: "critical",
      advisory: `IR-2 classification is strictly for unmarried children. A married son or daughter of a U.S. citizen falls into the F-3 family preference category. If the child marries at any point prior to consular admission or green card issuance, the IR-2 petition becomes invalid.`,
      source_basis: "INA 101(b)(1); INA 203(a)(3)",
    });
  } else if (q2s3 === "previously_married") {
    flags.push({
      id: "prior_marriage_termination_needed",
      title: "Child was previously married, termination proof required",
      severity: "warning",
      advisory: `The child is currently unmarried, but civil proof of the legal termination of any prior marriage (divorce decree, annulment, or death certificate) must be gathered in ${stepRefs.documents} and declared in ${stepRefs.mainForm}.`,
      source_basis: "INA 101(b)(1); 8 CFR 204.2",
    });
  }

  // q2s4 — Birth record availability / consistency
  const q2s4 = get("q2", "q2s4");
  if (q2s4 === "mismatch" || q2s4 === "unavailable" || q2s4 === "no") {
    flags.push({
      id: "birth_record_missing_or_mismatch",
      title: "Birth record is missing or inconsistent",
      severity: "warning",
      advisory: `If the civil birth certificate is missing or lists different parent/child names, obtain a NADRA Child Registration Certificate (CRC / B-Form), Family Registration Certificate (FRC), early hospital/school records, and an official non-availability certificate from the issuing union council.`,
      source_basis: "Form I-130 Instructions; USCIS Policy Manual Vol. 6, Part B",
    });
  }

  // q3s3 — Stepchild: marriage creating relationship occurred after 18th birthday
  const q3s3 = get("q3", "q3s3");
  if (q3s3 === "no") {
    flags.push({
      id: "late_step_relationship",
      title: "Step-relationship created after age 18",
      severity: "critical",
      advisory: `Under INA § 101(b)(1)(B), the marriage creating the step-relationship must take place before the child turns 18. If the marriage occurred on or after the child's 18th birthday, the child does not qualify as a stepchild for immigration purposes.`,
      source_basis: "INA 101(b)(1)(B); Form I-130 Instructions",
    });
  }

  // q3s4 — Parents' marriage duration < 2 years (Conditional CR-2 status)
  const q3s4 = get("q3", "q3s4");
  if (q3s4 === "no") {
    flags.push({
      id: "stepchild_conditional_cr2",
      title: "Child may receive a conditional CR-2 visa",
      severity: "advisory",
      advisory: `When the parents' marriage is less than two years old at the time of consular admission, the stepchild receives conditional permanent residence (CR-2). Form I-751 must be filed before the 2-year anniversary of admission to remove conditions.`,
      source_basis: "INA 216",
    });
  }

  // q3s5 / q3s6 — Adoption age, custody, residence requirements
  const q3s5 = get("q3", "q3s5");
  const q3s6 = get("q3", "q3s6");
  if (q3s5 === "no" || q3s6 === "no") {
    flags.push({
      id: "adoption_requirements_unclear",
      title: "Adoption age, custody, or residence requirements not met",
      severity: "critical",
      advisory: `An adoption-based IR-2 petition requires that the adoption was finalized prior to the child's 16th birthday (or 18th for natural siblings) and that the petitioner has held legal custody and resided with the child for at least 2 full years. Obtain specialist legal advice before filing.`,
      source_basis: "INA 101(b)(1)(E); Form I-130 Instructions",
    });
  }

  // q3s7 — Pakistani Guardianship order vs Adoption decree
  const q3s7 = get("q3", "q3s7");
  if (q3s7 === "guardianship") {
    flags.push({
      id: "guardianship_not_adoption",
      title: "Guardianship order instead of an adoption decree",
      severity: "critical",
      advisory: `A guardianship decree from a Pakistani family court (under the Guardians and Wards Act, 1890) is NOT recognized as a legal adoption for IR-2 immigrant visa purposes under INA § 101(b)(1)(E). Consult an experienced U.S. immigration attorney before filing Form I-130.`,
      source_basis: "INA 101(b)(1)(E); USCIS Adoption Policy Manual",
    });
  }

  // q3s8 — Custody documentation or non-accompanying parent consent
  const q3s8 = get("q3", "q3s8");
  if (q3s8 === "no") {
    flags.push({
      id: "custody_consent_missing",
      title: "Custody papers or other parent's consent may be missing",
      severity: "warning",
      advisory: `When a child immigrates with only one parent or following a parental divorce, the consular post frequently requires a certified custody decree granting legal permission to immigrate, or formal written consent from the other biological parent.`,
      source_basis: "Department of State Immigrant Visa Guidelines",
    });
  }

  // q5s1 — Child's past visa refusal, removal, or fraud history
  if (get("q5", "q5s1") === "yes") {
    flags.push({
      id: "child_immigration_or_fraud_history",
      title: "Child's past immigration issue, disclose it",
      severity: "critical",
      advisory: `Disclose all prior U.S. visa refusals, removal orders, or immigration proceedings for the child in ${stepRefs.mainForm} and attach records in ${stepRefs.documents}. Any misrepresentation or fraud creates a permanent inadmissibility bar unless a waiver is granted.`,
      source_basis: "INA 212(a)(6)(C); INA 212(a)(9)",
    });
  }

  // q5s2 — Child's court or police record
  if (get("q5", "q5s2") === "yes") {
    flags.push({
      id: "child_criminal_history",
      title: "Child's court / police record, disclose it",
      severity: "critical",
      advisory: `Collect certified court dispositions and police records for any arrests, charges, or juvenile findings, and disclose them in ${stepRefs.mainForm}.`,
      source_basis: "INA 212(a)(2)",
    });
  }

  // q5s3 — Child's unlawful presence / status violation
  if (get("q5", "q5s3") === "yes") {
    flags.push({
      id: "unlawful_presence_history",
      title: "Child's prior U.S. overstay or status violation",
      severity: "critical",
      advisory: `Unlawful presence accrued after age 18 can trigger a 3- or 10-year bar upon departure. Review the child's complete entry and departure records before proceeding with consular processing.`,
      source_basis: "INA 212(a)(9)(B)",
    });
  }

  // q5s5 — Financial sponsorship
  const q5s5 = get("q5", "q5s5");
  if (q5s5 === "possible" || q5s5 === "no" || q5s5 === "unsure") {
    flags.push({
      id: "financial_sponsorship_concern",
      title: "Income may be too low",
      severity: "warning",
      advisory: `The petitioner must demonstrate income at or above 125% of the poverty guidelines on Form I-864 (or qualify for exemption under Form I-864W Child Citizenship Act rules). If income is insufficient, consider joint sponsors or household member income early.`,
      source_basis: "INA 213A; Form I-864 / I-864W Instructions",
    });
  }

  // q5s6 — U.S. domicile
  const q5s6 = get("q5", "q5s6");
  if (q5s6 === "reestablish" || q5s6 === "no" || q5s6 === "unsure") {
    flags.push({
      id: "domicile_concern",
      title: "U.S. domicile needs attention",
      severity: "warning",
      advisory: `A petitioner residing abroad must maintain a U.S. principal domicile or establish concrete steps to re-establish domicile no later than the child's admission into the U.S.`,
      source_basis: "INA 213A; Form I-864 Instructions",
    });
  }

  // q5s7 — Multiple children / separate petition requirement
  const q5s7 = get("q5", "q5s7");
  if (q5s7 === "no" || q5s7 === "unsure") {
    flags.push({
      id: "separate_petition_required",
      title: "File a separate Form I-130 for each child",
      severity: "warning",
      advisory: `Immediate relative categories (IR-2) have no derivative beneficiaries. A separate Form I-130 petition, fee, and civil document packet must be filed for each child.`,
      source_basis: "INA 201(b)(2)(A)(i); Form I-130 Instructions",
    });
  }

  return flags;
}

// ─── IR-2 Specific Disclosure Functions ─────────────────────────────────────

function ir2Ds260Disclosures(
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
      title: "Disclose the past visa refusal on Form DS-260",
      hint: "Every prior U.S. visa refusal, cancellation, or application for the child must be declared. Omitting it risks an ineligibility finding for misrepresentation.",
    });
  }
  if (get("q5", "q5s2") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose court/police records on Form DS-260",
      hint: "Declare any arrest, charge, or juvenile court proceeding. Bring certified court records to the interview.",
    });
  }
  if (get("q5", "q5s3") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose prior U.S. unlawful presence on Form DS-260",
      hint: "Accurately disclose all previous entries, exits, and stays in the United States. Confirm whether a waiver applies.",
    });
  }
  if (get("q2", "q2s3") === "previously_married") {
    checks.push({
      level: "warning",
      title: "Declare previous marriage termination on DS-260",
      hint: "List the previous marriage and attach the certified divorce decree or dissolution record showing the child is currently unmarried.",
    });
  }

  return checks;
}

function ir2InterviewDisclosures(
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
      hint: "The consular officer can view prior visa refusals. Answer consistently with what was disclosed on Form DS-260.",
    });
  }
  if (get("q5", "q5s2") === "yes") {
    checks.push({
      level: "info",
      title: "Bring certified court/police records to interview",
      hint: "Bring certified copies of all court dispositions and police records, and be prepared to explain the matter clearly.",
    });
  }
  if (get("q2", "q2s3") === "previously_married") {
    checks.push({
      level: "info",
      title: "Bring original proof of prior marriage dissolution",
      hint: "The child must present original civil proof of divorce, annulment, or death of former spouse confirming they remain unmarried.",
    });
  }
  if (get("q3", "q3s8") === "no") {
    checks.push({
      level: "warning",
      title: "Bring custody decree or non-accompanying parent consent",
      hint: "Consular officers routinely request legal custody orders or notarized consent from the other biological parent before issuing a minor's visa.",
    });
  }

  return checks;
}

// ─── Category-specific checkers (the 5 that differ from IR-1) ───────────────

// Step 1.4 — Capture cross-form baseline + guidance for qualifying child relationship
const step_1_4: StepChecker = ({ state }) => {
  const checks: StepCheck[] = [];
  const baseline = state.metadata?.consistencyBaseline as any;

  if (!baseline?.petitionerDateOfBirth || !baseline?.beneficiaryDateOfBirth) {
    checks.push({
      level: "warning",
      title: "Date of birth missing",
      hint: "Save both the petitioner's and the child's dates of birth. These are cross-checked against civil records and Form DS-260 to prevent NVC delays.",
    });
  }

  checks.push({
    level: "info",
    title: "Document the qualifying parent-child relationship",
    hint: "IR-2 approval depends on proving the legal parent-child link under INA § 101(b)(1): official birth certificate naming the petitioner, legitimation evidence for an unmarried biological father, marriage before age 18 for stepchildren, or final decree with 2 years custody/residence for adopted children.",
  });

  return checks;
};

// Step 1.9 (Review & Submit, online path): final pre-submission gate
const reviewAndSubmit: StepChecker = ({ state, eligibilityAnswers }) => {
  const checks: StepCheck[] = [];
  const baseline = state.metadata?.consistencyBaseline as any;

  if (!baseline?.petitionerDateOfBirth || !baseline?.beneficiaryDateOfBirth) {
    checks.push({
      level: "warning",
      title: "Key dates not captured",
      hint: "Return to Chapter 1 Step 4 and save the petitioner and child dates of birth first.",
    });
  }

  if (detectIr2EligibilityRisks(eligibilityAnswers).some((f) => f.severity === "critical")) {
    checks.push({
      level: "critical",
      title: "Unresolved critical issues, do not submit yet",
      hint: "Resolve the critical items identified in eligibility screening before filing Form I-130.",
    });
  }

  return checks;
};

// Step 2.3 — DS-260 must match Form I-130 baseline facts
const step_2_3: StepChecker = ({ state, eligibilityAnswers }) => {
  const checks: StepCheck[] = [];
  const i130 = state.metadata?.consistencyBaseline as any;
  const ds260 = state.metadata?.ds260Baseline as any;

  if (!i130?.petitionerDateOfBirth && !i130?.beneficiaryDateOfBirth) {
    checks.push({
      level: "warning",
      title: "I-130 baseline not captured",
      hint: "Save the petitioner and child dates of birth in Chapter 1 Step 4 so Rahvana can verify consistency on Form DS-260.",
    });
  } else if (!ds260?.capturedAt) {
    const parts: string[] = [];
    if (i130.petitionerDateOfBirth) parts.push(`petitioner DOB ${i130.petitionerDateOfBirth}`);
    if (i130.beneficiaryDateOfBirth) parts.push(`child DOB ${i130.beneficiaryDateOfBirth}`);
    checks.push({
      level: "info",
      title: "Match these on your DS-260",
      hint: `Keep these identical to Form I-130: ${parts.join(", ")}. Names and spellings must match the birth certificate and passport exactly.`,
    });
  } else {
    // Both baselines present — run cross-form diff
    const mismatches = compareFields(i130, ds260, IR2_BASELINE_FIELDS);
    if (mismatches.length === 0) {
      checks.push({
        level: "info",
        title: "DS-260 dates match your I-130",
        hint: "Petitioner and child dates of birth are consistent across both forms.",
      });
    } else {
      for (const m of mismatches) {
        checks.push({
          level: "critical",
          title: `DS-260 does not match I-130: ${m.label}`,
          hint: `Form I-130 states ${m.aValue}, whereas DS-260 states ${m.bValue}. Correct the discrepancy so both records agree (9 FAM 504.4).`,
        });
      }
    }
  }

  // Form DS-260 child disclosures
  for (const d of ir2Ds260Disclosures(eligibilityAnswers)) checks.push(d);

  return checks;
};

// Step 3.8 (Prepare for Interview) — child interview guidance
const step_3_8: StepChecker = ({ eligibilityAnswers }) => {
  const checks: StepCheck[] = [
    {
      level: "info",
      title: "Your interview answers must match your DS-260",
      hint: "Review all Form DS-260 sections prior to interview day. The officer's questions regarding family background, parent-child relationship, and residence history will be checked against filed answers.",
    },
  ];
  for (const d of ir2InterviewDisclosures(eligibilityAnswers)) checks.push(d);
  return checks;
};

// ─── Registry + profile ──────────────────────────────────────────────────────

// Drop shared checkers whose IR-1 key means something else in IR-2
const IR1_KEYS_WITH_OTHER_MEANING = new Set(["step_1_6", "step_1_8", "step_1_14"]);
const COMMON_FOR_IR2: Record<string, StepChecker> = Object.fromEntries(
  Object.entries(COMMON_STEP_CHECKERS).filter(([key]) => !IR1_KEYS_WITH_OTHER_MEANING.has(key))
);

// IR-2 has no Form I-130A step, so Chapter 1 steps sit one key lower than IR-1:
//   step_1_5  Create USCIS Account  <- IR-1 step_1_6
//   step_1_6  Start Form I-130      <- none (IR-1's step_1_5 is I-130A)
//   step_1_7  Upload Forms          <- IR-1 step_1_8 (12 MB / file format check)
//   step_1_8  Pay Filing Fee        <- none
//   step_1_9  Review & Submit       <- IR-2 pre-submission gate
//   step_1_10 Print Hard Copy       <- none
//   step_1_11..13 paper path        <- IR-1 step_1_12..14
export const IR2_STEP_CHECKERS: Record<string, StepChecker> = {
  ...COMMON_FOR_IR2,
  step_1_4,
  step_1_5: COMMON_STEP_CHECKERS.step_1_6, // Create USCIS Account
  step_1_7: COMMON_STEP_CHECKERS.step_1_8, // Upload Forms & Evidence
  step_1_9: reviewAndSubmit, // Review & Submit: final pre-submission gate
  step_1_11: COMMON_STEP_CHECKERS.step_1_12, // Prepare Filing Fee
  step_1_12: COMMON_STEP_CHECKERS.step_1_13, // Assemble Filing Packet
  step_1_13: COMMON_STEP_CHECKERS.step_1_14, // Mail Packet & Track Delivery
  step_2_3,
  step_3_8,
};

export const IR2_PROFILE: CaseStrengthProfile = {
  id: "ir-2",
  label: "IR-2 / CR-2, Child of U.S. Citizen",
  journeyTypes: ["IR2", "IR-2", "ir-2", "CR2", "CR-2", "cr-2"],
  stepCheckers: IR2_STEP_CHECKERS,
  stepRefs: IR2_STEP_REFS,
  baselineFields: IR2_BASELINE_FIELDS,
  detectEligibilityRisks: detectIr2EligibilityRisks,
  // Child case: no marriage, run common Phase 2 questions
  consistency: {
    phase2Questions: COMMON_PHASE2_QUESTIONS,
    runPhase2Checks: runCommonPhase2Checks,
  },
  // Child evidence requirements and questionnaire
  evidence: {
    requirements: IR2_EVIDENCE_REQUIREMENTS,
    questionnaire: IR2_EVIDENCE_QUESTIONNAIRE,
  },
  // Child relationship signal: no marriage scoring, no age-gap penalty
  strengthSignals: {
    relationship: childRelationshipSignal,
  },
  // 4-ingredient weighted Case Health score
  caseScore: { model: "weighted" },
  // Proximity-based document escalation
  documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
  // Shared deadline-driven look-ahead rules (financial + PCC)
  lookAhead: COMMON_LOOK_AHEAD,
};
