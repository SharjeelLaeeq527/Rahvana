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
  referenceDate: Date = new Date()
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const refIso = referenceDate.toISOString();

  // Pattern 1: Marriage duration under 6 months at filing time
  if (input.marriage_date) {
    const months = monthsBetween(input.marriage_date, refIso);
    if (months !== null && months < 6) {
      flags.push({
        id: "short_marriage_duration",
        title: "Marriage under 6 months at filing time",
        severity: "warning",
        advisory:
          "USCIS may apply additional scrutiny to short-duration marriages. " +
          "Strengthen the filing with multiple Tier 1 bona fide evidence items " +
          "(joint financial accounts, joint tax filings, joint property/lease) " +
          "and consider including a relationship timeline cover letter.",
        source_basis:
          "USCIS Policy Manual Vol. 12, Part G, Ch. 2 — bona fide marriage adjudication",
      });
    }
  }

  // Pattern 2: Never met in person before marriage
  if (input.never_met_in_person === true) {
    flags.push({
      id: "never_met_in_person",
      title: "Spouses never met in person before marriage",
      severity: "warning",
      advisory:
        "Document the communication history thoroughly (call logs, messaging records, " +
        "video calls) and add a relationship timeline to the petition. Cases involving " +
        "no in-person meeting commonly face RFEs.",
      source_basis: "AILA practice advisories; commonly reported RFE pattern",
    });
  }

  // Pattern 3: Prior I-130 for different spouse (potential INA 204(c) bar)
  if (input.prior_i130_for_different_spouse === true) {
    flags.push({
      id: "prior_i130_for_different_spouse",
      title: "Petitioner previously filed I-130 for a different spouse",
      severity: "critical",
      advisory:
        "Under INA Section 204(c), if any prior marriage was found to be entered into " +
        "for the purpose of evading immigration laws, all future I-130 petitions by " +
        "the same petitioner are barred. Consult an immigration attorney before filing.",
      source_basis: "INA Section 204(c) — 8 USC Section 1154(c)",
    });
  }

  // Pattern 4: Prior marriage termination evidence missing
  const eitherHadPriorMarriage =
    input.petitioner_had_prior_marriage === true ||
    input.beneficiary_had_prior_marriage === true;
  if (
    eitherHadPriorMarriage &&
    input.prior_marriage_termination_documents_present === false
  ) {
    flags.push({
      id: "missing_prior_marriage_termination",
      title: "Prior marriage termination evidence missing",
      severity: "critical",
      advisory:
        "If either party had a prior marriage, proof of legal termination is required " +
        "(divorce decree, annulment order, or death certificate). Without this, USCIS " +
        "will issue an RFE.",
      source_basis: "8 CFR Section 204.2(a)(2) — I-130 documentation requirements",
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
