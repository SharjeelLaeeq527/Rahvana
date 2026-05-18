/**
 * Case Strength Analysis — Type Definitions
 *
 * The Case Strength engine provides advisory analysis of an IR-1 case across
 * three pillars: completeness, consistency, and evidence quality.
 *
 * IMPORTANT: USCIS does not publish a case-strength scoring formula. The
 * pillars, tiers, and risk patterns defined here are this tool's own framework,
 * grounded in USCIS Policy Manual guidance and practitioner-reported RFE
 * patterns — not official USCIS metrics. See case_strength_analysis.md for
 * full sourcing.
 */

export type RiskSeverity = "critical" | "warning" | "advisory";

export interface RiskFlag {
  id: string;
  title: string;
  severity: RiskSeverity;
  advisory: string;
  source_basis: string;
}

export type EvidenceTier = "tier_1_strong" | "tier_2_moderate" | "tier_3_supporting";

export interface EvidenceTierConfig {
  label: string;
  document_keys: string[];
}

export interface EvidenceTierMap {
  disclaimer: string;
  source_basis: string;
  guidance: string;
  tiers: Record<EvidenceTier, EvidenceTierConfig>;
}

export interface EvidenceClassificationResult {
  tier_1_count: number;
  tier_2_count: number;
  tier_3_count: number;
  by_tier: Record<EvidenceTier, string[]>;
  unclassified: string[];
  meets_recommended_tier_1_floor: boolean;
}

export interface ReceiptFormatValidation {
  valid: boolean;
  service_center?: string;
  service_center_code?: string;
  message?: string;
}

export interface FileQualityCheckResult {
  passes: boolean;
  issues: string[];
}

/**
 * Inputs that drive risk-pattern evaluation. All fields are optional — the
 * detector only evaluates patterns whose required inputs are present.
 */
export interface RiskDetectionInput {
  marriage_date?: string;
  petitioner_dob?: string;
  beneficiary_dob?: string;
  never_met_in_person?: boolean;
  prior_i130_for_different_spouse?: boolean;
  petitioner_had_prior_marriage?: boolean;
  beneficiary_had_prior_marriage?: boolean;
  prior_marriage_termination_documents_present?: boolean;
}
