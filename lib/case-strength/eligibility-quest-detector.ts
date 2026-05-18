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

type EligibilityAnswers = Record<
  string,
  Record<string, string | string[]> | undefined
>;

function get(answers: EligibilityAnswers, quest: string, screen: string): string | undefined {
  const val = answers?.[quest]?.[screen];
  return typeof val === "string" ? val : undefined;
}

/**
 * Evaluates the eligibility-quest answers and returns advisory risk flags.
 * Patterns whose required answers are not present are silently skipped.
 */
export function detectRiskFlagsFromEligibilityQuest(
  answers: EligibilityAnswers | null | undefined
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (!answers) return flags;

  // ── Missing prior-marriage termination evidence (q3s1 + q3s3) ──────────────
  const q3s1 = get(answers, "q3", "q3s1");
  const q3s3 = get(answers, "q3", "q3s3");
  const hadPriorMarriage =
    q3s1 === "petitioner" || q3s1 === "beneficiary" || q3s1 === "both";
  if (hadPriorMarriage && (q3s3 === "no" || q3s3 === "partial")) {
    flags.push({
      id: "missing_prior_marriage_termination",
      title: "Prior marriage termination evidence missing",
      severity: "critical",
      advisory:
        "If either party had a prior marriage, proof of legal termination is required " +
        "(divorce decree, annulment order, or death certificate). Without complete " +
        "documentation, USCIS will issue an RFE.",
      source_basis: "8 CFR Section 204.2(a)(2) — I-130 documentation requirements",
    });
  }

  // ── Prior visa refusal / fraud / misrepresentation (q5s1) ──────────────────
  if (get(answers, "q5", "q5s1") === "yes") {
    flags.push({
      id: "prior_visa_refusal_or_fraud",
      title: "Prior U.S. visa refusal, deportation, or fraud allegation",
      severity: "critical",
      advisory:
        "Any prior visa refusal, deportation, removal order, or fraud/misrepresentation " +
        "allegation must be disclosed and documented. Misrepresentation under INA 212(a)(6)(C) " +
        "creates a permanent inadmissibility bar unless waived. Consult an immigration " +
        "attorney before filing — this is not a DIY scenario.",
      source_basis:
        "INA Section 212(a)(6)(C) — 8 USC Section 1182(a)(6)(C) — misrepresentation bar",
    });
  }

  // ── Beneficiary criminal history (q5s2) ────────────────────────────────────
  if (get(answers, "q5", "q5s2") === "yes") {
    flags.push({
      id: "beneficiary_criminal_history",
      title: "Beneficiary has arrest, charge, or conviction",
      severity: "critical",
      advisory:
        "Any arrest, charge, or conviction — anywhere in the world — must be disclosed " +
        "and may trigger an inadmissibility bar under INA 212(a)(2). Certified court " +
        "dispositions and police records will be required. Some convictions are waivable; " +
        "others are permanent bars. Consult an immigration attorney to evaluate impact " +
        "before filing.",
      source_basis:
        "INA Section 212(a)(2) — 8 USC Section 1182(a)(2) — criminal-related grounds of inadmissibility",
    });
  }

  // ── Unlawful presence in the U.S. (q5s4) ───────────────────────────────────
  if (get(answers, "q5", "q5s4") === "yes") {
    flags.push({
      id: "unlawful_presence_history",
      title: "Beneficiary has accumulated unlawful presence in the U.S.",
      severity: "critical",
      advisory:
        "Unlawful presence triggers the 3-year or 10-year bar under INA 212(a)(9)(B) once " +
        "the beneficiary departs the U.S. for consular processing. A provisional unlawful " +
        "presence waiver (Form I-601A) may be required before the visa interview. Consult " +
        "an immigration attorney to determine the correct path before filing.",
      source_basis:
        "INA Section 212(a)(9)(B) — 8 USC Section 1182(a)(9)(B) — unlawful presence bars",
    });
  }

  // ── Financial sponsorship concern (q5s5) ───────────────────────────────────
  if (get(answers, "q5", "q5s5") === "yes") {
    flags.push({
      id: "financial_sponsorship_concern",
      title: "Petitioner income may not meet the 125% poverty guideline",
      severity: "warning",
      advisory:
        "The Affidavit of Support (Form I-864) requires the petitioner to demonstrate " +
        "income at or above 125% of the federal poverty guideline for the household size. " +
        "If the petitioner cannot meet this on their own, a joint sponsor or qualifying " +
        "assets will be needed. Plan for this now to avoid an RFE at the NVC stage.",
      source_basis:
        "INA Section 213A — 8 USC Section 1183a — Affidavit of Support requirement",
    });
  }

  return flags;
}
