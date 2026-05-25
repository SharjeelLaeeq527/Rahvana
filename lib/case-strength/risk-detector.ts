/**
 * Risk pattern detector for Chapter 1 case-strength analysis.
 *
 * Evaluates a set of advisory risk patterns against known case data and
 * returns the patterns that apply. Patterns whose required inputs are not
 * present in the data are silently skipped (never returned as false negatives).
 *
 * IMPORTANT: These patterns are advisory only. They reflect USCIS Policy
 * Manual guidance and commonly reported RFE patterns — not official USCIS
 * scoring criteria.
 */

import type { RiskDetectionInput, RiskFlag } from "./types";
import { IR1_STEP_REFS, type StepRefs } from "./eligibility-quest-detector";

function monthsBetween(fromIso: string, toIso: string): number | null {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return years * 12 + months;
}

/**
 * Evaluates all risk patterns against the supplied input and returns the
 * advisory flags that apply. Use `referenceDate` to override the comparison
 * date (useful for testing); defaults to "now".
 */
export function detectRiskFlags(
  input: RiskDetectionInput,
  referenceDate: Date = new Date(),
  stepRefs: StepRefs = IR1_STEP_REFS
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const refIso = referenceDate.toISOString();

  // Pattern 1: Marriage under 6 months
  if (input.marriage_date) {
    const months = monthsBetween(input.marriage_date, refIso);
    if (months !== null && months < 6) {
      flags.push({
        id: "short_marriage_duration",
        title: "New marriage — add extra proof",
        severity: "warning",
        advisory: `Your marriage is recent. Add joint accounts, joint tax filings, or shared lease/property in ${stepRefs.documents} to show the relationship is genuine.`,
        source_basis: "USCIS Policy Manual",
      });
    }
  }

  // Pattern 2: Never met in person
  if (input.never_met_in_person === true) {
    flags.push({
      id: "never_met_in_person",
      title: "Never met in person — add chat history",
      severity: "warning",
      advisory: `Add call logs, message history, video call records, and a relationship timeline to ${stepRefs.documents} (Relationship Evidence).`,
      source_basis: "AILA practice advisories",
    });
  }

  // Pattern 3: Prior I-130 for different spouse
  if (input.prior_i130_for_different_spouse === true) {
    flags.push({
      id: "prior_i130_for_different_spouse",
      title: "Past visa filing for ex-spouse",
      severity: "critical",
      advisory: `Disclose the prior filing in ${stepRefs.mainForm}. Add the prior marriage termination documents in ${stepRefs.documents}.`,
      source_basis: "INA 204(c)",
    });
  }

  // Pattern 4: Prior marriage termination missing
  const eitherHadPriorMarriage =
    input.petitioner_had_prior_marriage === true || input.beneficiary_had_prior_marriage === true;
  if (eitherHadPriorMarriage && input.prior_marriage_termination_documents_present === false) {
    flags.push({
      id: "missing_prior_marriage_termination",
      title: "Old marriage proof missing",
      severity: "critical",
      advisory: `Add divorce papers or death certificate from the previous marriage in ${stepRefs.documents}. Without this your case will be delayed.`,
      source_basis: "8 CFR 204.2(a)(2)",
    });
  }

  return flags;
}

/**
 * Convenience: filter detected flags by severity.
 */
export function filterFlagsBySeverity(
  flags: RiskFlag[],
  severity: RiskFlag["severity"]
): RiskFlag[] {
  return flags.filter((f) => f.severity === severity);
}
