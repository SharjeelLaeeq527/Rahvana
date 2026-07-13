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
export { validateReceiptNumber, checkFileQuality, USCIS_PORTAL_FILE_LIMITS } from "./validators";
export { detectRiskFlags, filterFlagsBySeverity } from "./risk-detector";
export { detectRiskFlagsFromEligibilityQuest } from "./eligibility-quest-detector";
export {
  classifyEvidence,
  missingTier1Documents,
  RECOMMENDED_TIER_1_FLOOR,
} from "./evidence-classifier";
export { analyzeCivilDocs } from "./civil-docs";
export type { CivilDocItem, CivilDocGroup, CivilDocIssue, CivilDocsContext } from "./civil-docs";
export { compareBaselines, compareFields, BASELINE_FIELDS } from "./consistency";
export type {
  BaselineDates,
  BaselineField,
  BaselineMismatch,
  CrossFormField,
  CrossFormMismatch,
} from "./consistency";
export {
  runStepChecks,
  IR1_STEP_CHECKERS,
  COMMON_STEP_CHECKERS,
  CATEGORY_SPECIFIC_STEP_KEYS,
  type StepCheck,
  type StepCheckContext,
  type StepChecker,
} from "./step-checkers";

// ─── Per-visa-category profiles (Strategy pattern) ──────────────────────────
// Resolve one of these from a journey's `journey_type` to make the whole engine
// category-aware. Unknown types fall back to IR-1 (today's behavior).
export {
  resolveCaseStrengthProfile,
  CASE_STRENGTH_PROFILES,
  IR1_PROFILE,
  IR5_PROFILE,
  IR5_STEP_CHECKERS,
  type CaseStrengthProfile,
} from "./categories";
export {
  aggregateChapter1Issues,
  aggregateChapter2Issues,
  aggregateChapter3Issues,
  aggregateConsistencyFindings,
  getConsistencyFindings,
  type AggregatedIssue,
} from "./aggregate-issues";

// Advanced Consistency Intelligence (Phase 1 + Phase 2)
export {
  runConsistencyIntelligence,
  runPhase2Checks,
  runSpousePhase2Checks,
  runCommonPhase2Checks,
  runFullConsistencyAnalysis,
  groupFindingsBySeverity,
  getConsistencySummary,
  PHASE2_QUESTIONS,
  SPOUSE_PHASE2_QUESTIONS,
  COMMON_PHASE2_QUESTIONS,
  type ConsistencyFinding,
  type FindingSeverity,
  type FindingCategory,
  type ConsistencyIntelligenceInput,
  type Phase2Question,
  type Phase2QuestionId,
  type Phase2Responses,
  type Phase2Runner,
} from "./consistency-intelligence";

// Case Narrative Generation (presentation layer over CSA outputs)
export {
  generateCaseNarrative,
  getCaseHealthStatus,
  computeOverallCaseScore,
  computeConsistencyScore,
  type CaseNarrative,
  type NarrativeBullet,
  type NarrativeInput,
} from "./case-narrative";
