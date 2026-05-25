/**
 * Eligibility-quest answer mapper.
 *
 * Maps answers from the IR-1 eligibility-suite quest (step_1_1) to a list of
 * risk flags. Each detected pattern includes its source basis (INA / 8 CFR /
 * USCIS Policy Manual section) so the user can see where the advisory comes
 * from. Pure function — no side effects.
 *
 * Quest answer shape (from useWizard state.answers["eligibility-suite"]):
 *   {
 *     q1: { q1s1: "citizen", q1s2: "naturalized", ... },
 *     q2: { q2s1: "married", ... },
 *     q3: { q3s1: "petitioner" | "beneficiary" | "both" | "none", q3s3: "yes" | "partial" | "no", ... },
 *     q4: { q4s1: "yes", q4s2: ["address", "finances"], ... },
 *     q5: { q5s1: "yes", q5s2: "no", q5s4: "yes", q5s5: "yes", ... },
 *   }
 */

import type { RiskFlag } from "./types";

type EligibilityAnswers = Record<string, Record<string, string | string[]> | undefined>;

/**
 * Step reference config — maps logical step roles to category-specific step labels.
 * To support a new visa category (IR-2, F-2A, K-1, etc.):
 *   1. Pass a custom StepRefs object when calling detectRiskFlagsFromEligibilityQuest
 *   2. Or add a new config under `lib/case-strength/categories/<category>-step-refs.ts`
 *
 * The detector logic itself stays the same — only the labels change per category.
 */
export interface StepRefs {
  documents: string; // doc gathering step
  mainForm: string; // primary form (e.g., I-130, I-129F)
  beneForm?: string; // secondary beneficiary form (e.g., I-130A)
  reviewSubmit: string; // final review/submit step
}

export const IR1_STEP_REFS: StepRefs = {
  documents: "Chapter 1 Step 2 — Gather Documents",
  mainForm: "Chapter 1 Step 4 — Fill I-130",
  beneForm: "Chapter 1 Step 5 — Fill I-130A",
  reviewSubmit: "Chapter 1 Step 10 — Review & Submit",
};

function get(answers: EligibilityAnswers, quest: string, screen: string): string | undefined {
  const val = answers?.[quest]?.[screen];
  return typeof val === "string" ? val : undefined;
}

/**
 * Evaluates the eligibility-quest answers and returns advisory risk flags.
 * Patterns whose required answers are not present are silently skipped.
 */
export function detectRiskFlagsFromEligibilityQuest(
  answers: EligibilityAnswers | null | undefined,
  stepRefs: StepRefs = IR1_STEP_REFS
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (!answers) return flags;

  // ── Missing prior-marriage termination evidence ─────────────────────────────
  const q3s1 = get(answers, "q3", "q3s1");
  const q3s3 = get(answers, "q3", "q3s3");
  const hadPriorMarriage = q3s1 === "petitioner" || q3s1 === "beneficiary" || q3s1 === "both";
  if (hadPriorMarriage && (q3s3 === "no" || q3s3 === "partial")) {
    flags.push({
      id: "missing_prior_marriage_termination",
      title: "Old marriage proof missing",
      severity: "critical",
      advisory: `You said there was a previous marriage. Add the divorce papers or death certificate in ${stepRefs.documents}.`,
      source_basis: "8 CFR 204.2(a)(2)",
    });
  }

  // ── Prior visa refusal / fraud ──────────────────────────────────────────────
  if (get(answers, "q5", "q5s1") === "yes") {
    flags.push({
      id: "prior_visa_refusal_or_fraud",
      title: "Past visa issue — disclose it",
      severity: "critical",
      advisory: `Disclose every past visa refusal or issue in ${stepRefs.mainForm} and add supporting documents in ${stepRefs.documents}. Hiding it will hurt your case.`,
      source_basis: "INA 212(a)(6)(C)",
    });
  }

  // ── Criminal history ───────────────────────────────────────────────────────
  if (get(answers, "q5", "q5s2") === "yes") {
    flags.push({
      id: "beneficiary_criminal_history",
      title: "Court / police record — disclose it",
      severity: "critical",
      advisory: `Upload certified court documents and police records in ${stepRefs.documents}. Also mention them in ${stepRefs.mainForm}.`,
      source_basis: "INA 212(a)(2)",
    });
  }

  // ── Unlawful presence ──────────────────────────────────────────────────────
  if (get(answers, "q5", "q5s4") === "yes") {
    flags.push({
      id: "unlawful_presence_history",
      title: "U.S. overstay — waiver needed",
      severity: "critical",
      advisory: `A provisional waiver (Form I-601A) will be needed before the interview. Disclose the overstay in ${stepRefs.mainForm} and Rahvana will guide you through the waiver later.`,
      source_basis: "INA 212(a)(9)(B)",
    });
  }

  // ── Financial sponsorship ──────────────────────────────────────────────────
  if (get(answers, "q5", "q5s5") === "yes") {
    flags.push({
      id: "financial_sponsorship_concern",
      title: "Income may be too low",
      severity: "warning",
      advisory:
        "The petitioner's income may not meet the required level. Rahvana will handle the Affidavit of Support (I-864) at NVC stage — start arranging a joint sponsor now if needed.",
      source_basis: "INA 213A — Form I-864",
    });
  }

  return flags;
}
