// Evidence Gap Analysis Module
// Reusable analysis engine for visa case evidence evaluation

export { EvidenceGapEngine, evidenceGapEngine } from "./engine";

export type {
  EvidenceCategory,
  EvidenceType,
  CoverageLevel,
  EvidenceItem,
  EvidenceCategoryAssessment,
  EvidenceRecommendation,
  EvidenceGapAnalysis,
  EvidenceRequirement,
  EvidenceRequirementItem,
  SupplementalQuestion,
  EvidenceGapInput,
  EvidenceQuestion,
  RequiredDocumentsSummary,
} from "./types";

export { EVIDENCE_QUESTIONNAIRE } from "./types";

// UI Components
export { EvidenceGapCard } from "./ui/EvidenceGapCard";
