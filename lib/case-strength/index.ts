/**
 * Case Strength Analysis — public API.
 *
 * The Case Strength engine provides advisory analysis for an IR-1/CR-1 visa
 * case. Currently scoped to Chapter 1 (USCIS Petition Filing) helpers.
 *
 * Disclaimer: USCIS does not publish a case-strength scoring formula. The
 * tiers and risk patterns here are this tool's framework, grounded in USCIS
 * Policy Manual guidance and practitioner-reported RFE patterns. See
 * case_strength_analysis.md for full sourcing.
 */

export * from "./types";
export {
  validateReceiptNumber,
  checkFileQuality,
  USCIS_PORTAL_FILE_LIMITS,
} from "./validators";
export { detectRiskFlags, filterFlagsBySeverity } from "./risk-detector";
export { detectRiskFlagsFromEligibilityQuest } from "./eligibility-quest-detector";
export {
  classifyEvidence,
  missingTier1Documents,
  RECOMMENDED_TIER_1_FLOOR,
} from "./evidence-classifier";
