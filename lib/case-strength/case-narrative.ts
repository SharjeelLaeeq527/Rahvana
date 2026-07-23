// Case Narrative Generation Engine
// Transforms CSA findings into a human-readable case summary
//
// IMPORTANT: This engine does NOT perform new analysis.
// It consumes and summarizes existing Evidence Gap Analysis and
// Advanced Consistency Intelligence outputs.

import type {
  EvidenceGapAnalysis,
  CoverageLevel,
  EvidenceCategory,
} from "../journey/evidence-gap/types";
import type { ConsistencyFinding, FindingSeverity } from "./consistency-intelligence";
import type { RiskFlag, RiskSeverity } from "./types";

// ─── Output Types ──────────────────────────────────────────────────────────────

export interface CaseNarrative {
  /** Executive summary — 2-4 sentences overview */
  executiveSummary: string;
  /** Strengths — positive aspects of the case */
  strengths: NarrativeBullet[];
  /** Areas requiring attention — weaknesses and gaps */
  areasRequiringAttention: NarrativeBullet[];
  /** Recommended next steps — actionable guidance */
  recommendedNextSteps: NarrativeBullet[];
  /** Timestamp of generation */
  generatedAt: Date;
}

export interface NarrativeBullet {
  /** Primary statement */
  text: string;
  /** Optional supporting detail */
  detail?: string;
  /** Source category for traceability */
  source: "evidence" | "consistency";
  /** Priority for ordering (lower = more important) */
  priority: number;
}

// ─── Input Types ───────────────────────────────────────────────────────────────

export interface NarrativeInput {
  /** Evidence Gap Analysis results (from EvidenceGapEngine) */
  evidenceAnalysis: EvidenceGapAnalysis | null;
  /** Consistency Intelligence findings */
  consistencyFindings: ConsistencyFinding[];
  /**
   * When set, the executive summary uses THIS score (the weighted Case Health
   * score) and the calmer band-based phrasing (Weak/Moderate/Strong), instead of
   * the legacy evidence×0.6 + consistency×0.4 blend. Pass it for categories on
   * the weighted model (IR-5) so the drawer's summary matches the gauge and never
   * over-alarms a just-started user. Omit → legacy phrasing (IR-1), unchanged.
   */
  overallScoreOverride?: number;
}

// ─── Category Display Names ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  RELATIONSHIP: "relationship evidence",
  FINANCIAL: "financial sponsorship",
  COHABITATION: "shared residence",
  FAMILY_INTEGRATION: "family integration",
  COMMUNICATION: "communication history",
  IDENTITY: "identity documents",
  IMMIGRATION_HISTORY: "immigration history",
};

const CATEGORY_DISPLAY: Record<EvidenceCategory, string> = {
  RELATIONSHIP: "Relationship",
  FINANCIAL: "Financial",
  COHABITATION: "Cohabitation",
  FAMILY_INTEGRATION: "Family Integration",
  COMMUNICATION: "Communication",
  IDENTITY: "Identity",
  IMMIGRATION_HISTORY: "Immigration History",
};

// ─── Main Function ─────────────────────────────────────────────────────────────

/**
 * Generate a human-readable case narrative from existing CSA outputs.
 *
 * @param input - Evidence analysis and consistency findings
 * @returns CaseNarrative with four sections
 *
 * @example
 * ```ts
 * const narrative = generateCaseNarrative({
 *   evidenceAnalysis: evidenceGapEngine.analyze(input),
 *   consistencyFindings: runFullConsistencyAnalysis(state, phase2Responses),
 * });
 * ```
 */
export function generateCaseNarrative(input: NarrativeInput): CaseNarrative {
  const { evidenceAnalysis, consistencyFindings } = input;

  // Filter out resolved findings — they don't need attention
  const unresolvedFindings = consistencyFindings.filter((f) => !f.resolved);
  const resolvedFindings = consistencyFindings.filter((f) => f.resolved);

  // Compute overall combined score (evidence 60% + consistency 40%)
  const evidenceScore = evidenceAnalysis?.overallScore ?? 50;
  let consistencyPenalty = 0;
  for (const f of unresolvedFindings) {
    if (f.severity === "critical") consistencyPenalty += 20;
    else if (f.severity === "warning") consistencyPenalty += 8;
    else consistencyPenalty += 3;
  }
  const consistencyScore = Math.max(0, 100 - consistencyPenalty);
  const overallCombinedScore = Math.round(evidenceScore * 0.6 + consistencyScore * 0.4);

  // Build each section. When a weighted score is supplied, drive the summary tone
  // from it (band-based, calmer); otherwise fall back to the legacy blend.
  const executiveSummary = buildExecutiveSummary(
    evidenceAnalysis,
    unresolvedFindings,
    resolvedFindings.length,
    input.overallScoreOverride ?? overallCombinedScore,
    input.overallScoreOverride !== undefined
  );

  const strengths = buildStrengths(evidenceAnalysis, resolvedFindings);
  const areasRequiringAttention = buildAreasRequiringAttention(
    evidenceAnalysis,
    unresolvedFindings
  );
  const recommendedNextSteps = buildRecommendedNextSteps(evidenceAnalysis, unresolvedFindings);

  return {
    executiveSummary,
    strengths,
    areasRequiringAttention,
    recommendedNextSteps,
    generatedAt: new Date(),
  };
}

// ─── Executive Summary Builder ─────────────────────────────────────────────────

function buildExecutiveSummary(
  evidenceAnalysis: EvidenceGapAnalysis | null,
  unresolvedFindings: ConsistencyFinding[],
  resolvedCount: number,
  overallScore: number,
  bandBased = false
): string {
  const parts: string[] = [];

  if (bandBased) {
    // Weighted model (§6): calmer, band-based phrasing. A low score early in the
    // journey reads as "still building", not as something being wrong.
    const band = getScoreBand(overallScore);
    if (band === "strong") {
      parts.push("Your case is in strong shape — evidence and consistency are looking solid");
    } else if (band === "moderate") {
      parts.push("Your case is on track, with a few areas you can still strengthen");
    } else {
      parts.push(
        "You're still building your case — the key documents and details below are the ones to add next"
      );
    }
  } else {
    // Legacy blend (IR-1), unchanged.
    if (overallScore >= 80) {
      parts.push(
        "Your case is in strong shape overall — evidence coverage and consistency checks are solid"
      );
    } else if (overallScore >= 60) {
      parts.push("Your case shows moderate strength with room for improvement in key areas");
    } else if (overallScore >= 40) {
      parts.push("Your case has notable gaps in documentation or consistency that need attention");
    } else {
      parts.push(
        "Your case requires significant improvements in both evidence coverage and data consistency"
      );
    }
  }

  // Evidence-specific details
  if (evidenceAnalysis) {
    const stats = evidenceAnalysis.stats;

    // Highlight strong categories
    if (stats.strongCategories > 0) {
      const strongCats = getCategoriesByLevel(evidenceAnalysis, "STRONG");
      if (strongCats.length === 1) {
        parts.push(`${CATEGORY_DISPLAY[strongCats[0]]} evidence is strong`);
      } else if (strongCats.length === 2) {
        parts.push(
          `${CATEGORY_DISPLAY[strongCats[0]]} and ${CATEGORY_DISPLAY[strongCats[1]]} evidence are strong`
        );
      } else if (strongCats.length > 2) {
        parts.push(`${stats.strongCategories} evidence categories are strong`);
      }
    }

    // Highlight weak/missing categories
    const weakMissing = stats.weakCategories + stats.missingCategories;
    if (weakMissing > 0) {
      const weakCats = [
        ...getCategoriesByLevel(evidenceAnalysis, "WEAK"),
        ...getCategoriesByLevel(evidenceAnalysis, "MISSING"),
      ];
      if (weakCats.length === 1) {
        parts.push(`however, ${CATEGORY_LABELS[weakCats[0]]} evidence needs strengthening`);
      } else if (weakCats.length === 2) {
        parts.push(
          `however, ${CATEGORY_LABELS[weakCats[0]]} and ${CATEGORY_LABELS[weakCats[1]]} evidence need attention`
        );
      } else if (weakCats.length > 2) {
        parts.push(`however, ${weakMissing} evidence categories need attention`);
      }
    }

    // Required documents status
    const reqDocs = evidenceAnalysis.requiredDocuments;
    if (reqDocs.missing.length > 0) {
      // "to gather" reads as a normal to-do; "still missing" reads as a failure.
      const verb = bandBased ? "still to gather" : "still missing";
      parts.push(
        `${reqDocs.missing.length} required document${reqDocs.missing.length > 1 ? "s" : ""} ${verb}`
      );
    }
  }

  // Consistency findings summary
  const criticalCount = unresolvedFindings.filter((f) => f.severity === "critical").length;
  const warningCount = unresolvedFindings.filter((f) => f.severity === "warning").length;

  if (criticalCount > 0) {
    parts.push(
      `${criticalCount} critical consistency issue${criticalCount > 1 ? "s" : ""} require${criticalCount === 1 ? "s" : ""} immediate attention`
    );
  }

  if (warningCount > 0 && criticalCount === 0) {
    parts.push(
      `${warningCount} consistency warning${warningCount > 1 ? "s" : ""} should be reviewed`
    );
  }

  // Add note about resolved items if any
  if (resolvedCount > 0) {
    parts.push(
      `${resolvedCount} issue${resolvedCount > 1 ? "s have" : " has"} been successfully addressed`
    );
  }

  // Combine parts into coherent sentences
  if (parts.length === 0) {
    return "No case analysis data available yet. Complete your journey setup to see your case summary.";
  }

  // Build the summary with proper sentence structure
  // Each part is a clause that needs proper punctuation
  let summary = parts[0];

  // Ensure first part ends with proper punctuation
  if (!summary.match(/[.!?]$/)) {
    // If this is the only part, add period
    // If there are more parts, add period to end sentence
    summary += ".";
  }

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    // "however" clauses join with comma, others start new sentence
    if (part.startsWith("however")) {
      // Remove trailing period from current summary, add comma + however clause
      summary = summary.replace(/[.!?]$/, "");
      summary += `, ${part}${isLastPart ? "." : ""}`;
    } else {
      // Start new sentence with capitalized first letter
      const sentence = capitalize(part);
      summary += ` ${sentence}${isLastPart ? "." : ""}`;
    }
  }

  // Ensure it ends with exactly one period
  summary = summary.replace(/[.!?]*$/, ".");

  return summary;
}

// ─── Strengths Builder ─────────────────────────────────────────────────────────

function buildStrengths(
  evidenceAnalysis: EvidenceGapAnalysis | null,
  resolvedFindings: ConsistencyFinding[]
): NarrativeBullet[] {
  const strengths: NarrativeBullet[] = [];

  if (evidenceAnalysis) {
    // Strong categories
    const strongCategories = getCategoriesByLevel(evidenceAnalysis, "STRONG");
    for (const cat of strongCategories) {
      const assessment = evidenceAnalysis.categories[cat];
      strengths.push({
        text: `Strong ${CATEGORY_LABELS[cat]}`,
        detail: `${assessment.items.length} item${assessment.items.length !== 1 ? "s" : ""} documented`,
        source: "evidence",
        priority: 1,
      });
    }

    // Moderate categories (still a positive)
    const moderateCategories = getCategoriesByLevel(evidenceAnalysis, "MODERATE");
    for (const cat of moderateCategories) {
      const assessment = evidenceAnalysis.categories[cat];
      strengths.push({
        text: `${CATEGORY_DISPLAY[cat]} evidence documented`,
        detail: "Additional supporting evidence would strengthen this area",
        source: "evidence",
        priority: 2,
      });
    }

    // Required documents completion
    const reqDocs = evidenceAnalysis.requiredDocuments;
    if (reqDocs.completionPercentage >= 80) {
      strengths.push({
        text: "Required documentation substantially complete",
        detail: `${reqDocs.found} of ${reqDocs.total} required documents on file`,
        source: "evidence",
        priority: 1,
      });
    }
  }

  // Resolved consistency findings show progress
  if (resolvedFindings.length > 0) {
    strengths.push({
      text: `${resolvedFindings.length} consistency issue${resolvedFindings.length > 1 ? "s" : ""} resolved`,
      detail: "Previously identified issues have been addressed",
      source: "consistency",
      priority: 2,
    });
  }

  // No critical unresolved findings is a strength
  if (evidenceAnalysis && resolvedFindings.length === 0) {
    const hasNoIssues = evidenceAnalysis.overallScore >= 70;
    if (hasNoIssues) {
      strengths.push({
        text: "No critical consistency concerns detected",
        source: "consistency",
        priority: 3,
      });
    }
  }

  return strengths.slice(0, 5); // Limit to 5 bullets
}

// ─── Areas Requiring Attention Builder ─────────────────────────────────────────

function buildAreasRequiringAttention(
  evidenceAnalysis: EvidenceGapAnalysis | null,
  unresolvedFindings: ConsistencyFinding[]
): NarrativeBullet[] {
  const areas: NarrativeBullet[] = [];

  // Critical consistency findings first
  const criticalFindings = unresolvedFindings.filter((f) => f.severity === "critical");
  for (const finding of criticalFindings) {
    areas.push({
      text: finding.title,
      detail: finding.description,
      source: "consistency",
      priority: 0, // Highest priority
    });
  }

  // Warning findings
  const warningFindings = unresolvedFindings.filter((f) => f.severity === "warning");
  for (const finding of warningFindings) {
    areas.push({
      text: finding.title,
      detail: finding.description,
      source: "consistency",
      priority: 1,
    });
  }

  if (evidenceAnalysis) {
    // Missing categories
    const missingCategories = getCategoriesByLevel(evidenceAnalysis, "MISSING");
    for (const cat of missingCategories) {
      areas.push({
        text: `${CATEGORY_DISPLAY[cat]} evidence is missing`,
        detail: `No ${CATEGORY_LABELS[cat]} has been documented yet`,
        source: "evidence",
        priority: 2,
      });
    }

    // Weak categories
    const weakCategories = getCategoriesByLevel(evidenceAnalysis, "WEAK");
    for (const cat of weakCategories) {
      const assessment = evidenceAnalysis.categories[cat];
      areas.push({
        text: `Limited ${CATEGORY_LABELS[cat]}`,
        detail: `Only ${assessment.items.length} item${assessment.items.length !== 1 ? "s" : ""} documented — more evidence recommended`,
        source: "evidence",
        priority: 3,
      });
    }

    // Missing required documents
    const missingRequired = evidenceAnalysis.requiredDocuments.missing;
    if (missingRequired.length > 0 && missingRequired.length <= 3) {
      const docNames = missingRequired.map((d) => d.name).join(", ");
      areas.push({
        text: `Required documents missing: ${docNames}`,
        source: "evidence",
        priority: 1,
      });
    } else if (missingRequired.length > 3) {
      areas.push({
        text: `${missingRequired.length} required documents still missing`,
        detail:
          missingRequired
            .slice(0, 3)
            .map((d) => d.name)
            .join(", ") + ", and more",
        source: "evidence",
        priority: 1,
      });
    }
  }

  // Sort by priority and limit
  areas.sort((a, b) => a.priority - b.priority);
  return areas.slice(0, 5);
}

// ─── Recommended Next Steps Builder ────────────────────────────────────────────

function buildRecommendedNextSteps(
  evidenceAnalysis: EvidenceGapAnalysis | null,
  unresolvedFindings: ConsistencyFinding[]
): NarrativeBullet[] {
  const steps: NarrativeBullet[] = [];

  // Recommendations from evidence analysis (prioritized by the engine)
  if (evidenceAnalysis) {
    const recommendations = evidenceAnalysis.recommendations;

    // High priority recommendations first
    const highPriority = recommendations.filter((r) => r.priority === "HIGH");
    for (const rec of highPriority.slice(0, 2)) {
      steps.push({
        text: rec.title,
        detail: rec.actionItems[0],
        source: "evidence",
        priority: 0,
      });
    }

    // Medium priority
    const mediumPriority = recommendations.filter((r) => r.priority === "MEDIUM");
    for (const rec of mediumPriority.slice(0, 2)) {
      steps.push({
        text: rec.title,
        detail: rec.actionItems[0],
        source: "evidence",
        priority: 1,
      });
    }
  }

  // Resolution steps from consistency findings
  const criticalFindings = unresolvedFindings.filter((f) => f.severity === "critical");
  for (const finding of criticalFindings.slice(0, 2)) {
    steps.push({
      text: `Resolve: ${finding.title}`,
      detail: finding.resolution,
      source: "consistency",
      priority: 0,
    });
  }

  const warningFindings = unresolvedFindings.filter((f) => f.severity === "warning");
  for (const finding of warningFindings.slice(0, 2)) {
    steps.push({
      text:
        finding.resolution.startsWith("Review") || finding.resolution.startsWith("Verify")
          ? finding.resolution.split(".")[0]
          : `Address: ${finding.title}`,
      detail: finding.resolution,
      source: "consistency",
      priority: 1,
    });
  }

  // Deduplicate by text similarity
  const seen = new Set<string>();
  const deduped = steps.filter((step) => {
    const key = step.text.toLowerCase().slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by priority and limit
  deduped.sort((a, b) => a.priority - b.priority);
  return deduped.slice(0, 5);
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

function getCategoriesByLevel(
  analysis: EvidenceGapAnalysis,
  level: CoverageLevel
): EvidenceCategory[] {
  return Object.entries(analysis.categories)
    .filter(([_, assessment]) => assessment.level === level)
    .map(([cat]) => cat as EvidenceCategory);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Quick Assessment ──────────────────────────────────────────────────────────

/**
 * Get a quick case health assessment for badges/chips.
 * Returns a simple status indicator based on the narrative inputs.
 */
export function getCaseHealthStatus(input: NarrativeInput): {
  status: "excellent" | "good" | "needs-attention" | "critical";
  label: string;
  color: string;
} {
  const { evidenceAnalysis, consistencyFindings } = input;
  const unresolved = consistencyFindings.filter((f) => !f.resolved);

  // Critical if there are critical unresolved findings
  if (unresolved.some((f) => f.severity === "critical")) {
    return { status: "critical", label: "Needs Immediate Attention", color: "#ef4444" };
  }

  // Check evidence score
  const score = evidenceAnalysis?.overallScore ?? 50;
  const hasWarnings = unresolved.some((f) => f.severity === "warning");

  if (score >= 80 && !hasWarnings) {
    return { status: "excellent", label: "Excellent", color: "#10b981" };
  }

  if (score >= 60 && !hasWarnings) {
    return { status: "good", label: "Good", color: "#3b82f6" };
  }

  if (score >= 40 || hasWarnings) {
    return { status: "needs-attention", label: "Needs Attention", color: "#f59e0b" };
  }

  return { status: "critical", label: "Needs Immediate Attention", color: "#ef4444" };
}

/**
 * Compute the consistency sub-score (0–100) from unresolved findings.
 * Starts at 100 and deducts: critical −20, warning −8, informational −3.
 */
export function computeConsistencyScore(consistencyFindings: ConsistencyFinding[]): number {
  const unresolved = consistencyFindings.filter((f) => !f.resolved);
  let penalty = 0;
  for (const f of unresolved) {
    if (f.severity === "critical") penalty += 20;
    else if (f.severity === "warning") penalty += 8;
    else penalty += 3;
  }
  return Math.max(0, 100 - penalty);
}

/**
 * Compute an overall case score (0–100) that combines evidence coverage
 * and consistency intelligence into a single weighted metric.
 *
 * Weights:
 * - Evidence score: 50%
 * - Consistency score: 50%
 *
 * Both analyses are weighted equally — strong evidence and consistent
 * information are equally important for a healthy case.
 */
export function computeOverallCaseScore(input: NarrativeInput): number {
  const evidenceScore = input.evidenceAnalysis?.overallScore ?? 50;
  const consistencyScore = computeConsistencyScore(input.consistencyFindings);
  return Math.round(evidenceScore * 0.5 + consistencyScore * 0.5);
}

// ─── Weighted Case Score (4-ingredient model) ────────────────────────────────
//
// A quality/completeness meter — NOT deadline-related. It is a weighted average
// of four ingredients that already exist elsewhere in the system:
//   • Evidence Strength — user-provided, quality-graded documents (NOT autofill)
//   • Consistency       — do names/dates/addresses agree across documents
//   • Completeness      — % of required checklist items filled
//   • Risk flags        — negative weight; detected red flags pull the score down
//
// See CASE_STRENGTH_ALERT_ESCALATION_PLAN.md §6. Scoped to categories whose
// CaseStrengthProfile sets `caseScore` (IR-5 today); IR-1 keeps
// `computeOverallCaseScore` above, byte-for-byte unchanged.

/**
 * Ingredient weights. Single source of truth — tune here, nowhere else.
 * Confirmed starting point (2026-07-20); revisit against real outcomes later.
 * Weights sum to 1.0; risk is applied as an inverted "risk health" component
 * (100 = no flags) so a flawless, risk-free case can still reach 100.
 */
export const CASE_SCORE_WEIGHTS = {
  evidence: 0.4,
  consistency: 0.3,
  completeness: 0.2,
  risk: 0.1,
} as const;

/**
 * How many penalty points each risk flag contributes (0–100 scale, capped at
 * 100). A single critical flag maxes the risk penalty; the risk component can
 * therefore subtract at most `CASE_SCORE_WEIGHTS.risk * 100` (= 10) points.
 */
export const RISK_SEVERITY_PENALTY: Record<RiskSeverity, number> = {
  critical: 100,
  warning: 40,
  advisory: 15,
};

/** Score bands (§6B). Weak < 40, Moderate 40–70, Strong ≥ 70. */
export const SCORE_BANDS = { weakMax: 40, strongMin: 70 } as const;
export type ScoreBand = "weak" | "moderate" | "strong";

export function getScoreBand(score: number): ScoreBand {
  if (score < SCORE_BANDS.weakMax) return "weak";
  if (score < SCORE_BANDS.strongMin) return "moderate";
  return "strong";
}

const BAND_ORDER: Record<ScoreBand, number> = { weak: 0, moderate: 1, strong: 2 };

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  weak: "Weak",
  moderate: "Moderate",
  strong: "Strong",
};

export interface BandTransition {
  /** The current band. */
  band: ScoreBand;
  /** Movement vs the previous band: down, up, or none. */
  direction: "drop" | "rise" | "same";
}

/**
 * Classify how the score band moved (§6C). An ALERT should fire only on a
 * `"drop"` — never on a `"rise"` (improvements are silent) and never on `"same"`
 * (small fluctuations inside a band). A null previous band (fresh session) is
 * `"same"` so a just-started user is never alerted.
 */
export function classifyBandTransition(
  previous: ScoreBand | null,
  currentScore: number
): BandTransition {
  const band = getScoreBand(currentScore);
  if (previous === null) return { band, direction: "same" };
  const delta = BAND_ORDER[band] - BAND_ORDER[previous];
  return { band, direction: delta < 0 ? "drop" : delta > 0 ? "rise" : "same" };
}

/**
 * Band-based health status for the weighted model (§6B/§6C/§6F).
 *
 * Unlike `getCaseHealthStatus` (legacy), a merely-low score does NOT raise the
 * red "Needs Immediate Attention" alarm. That alarm is reserved for a genuine
 * critical issue (a critical risk flag or critical inconsistency). A low score
 * with no critical issue reads as a calm "building your case" state, so a user
 * who just started Chapter 1 is never told something is wrong.
 */
export function getWeightedCaseHealthStatus(
  score: number,
  opts: { hasCriticalIssue: boolean }
): {
  status: "excellent" | "good" | "needs-attention" | "critical";
  label: string;
  color: string;
} {
  if (opts.hasCriticalIssue) {
    return { status: "critical", label: "Needs Immediate Attention", color: "#ef4444" };
  }
  const band = getScoreBand(score);
  if (band === "strong") {
    return { status: "excellent", label: "Strong", color: "#10b981" };
  }
  if (band === "moderate") {
    return { status: "good", label: "Moderate", color: "#3b82f6" };
  }
  // Weak, but nothing critical → calm "in progress", never a red alarm (§6F).
  return { status: "needs-attention", label: "Building Your Case", color: "#f59e0b" };
}

export interface WeightedCaseScoreInput {
  /** Evidence Strength (0–100) — user-provided, quality-graded documents only. */
  evidenceStrength: number;
  /** Consistency score (0–100), e.g. from `computeConsistencyScore`. */
  consistencyScore: number;
  /** Completeness (0–100) — % of required checklist items filled. */
  completeness: number;
  /** Detected risk flags — pull the score down (negative weight). */
  riskFlags: RiskFlag[];
}

export interface WeightedCaseScoreResult {
  /** Final 0–100 score. */
  score: number;
  /** The four inputs after clamping — for the always-visible "why" breakdown. */
  breakdown: {
    evidenceStrength: number;
    consistencyScore: number;
    completeness: number;
    /** 0–100, higher = more risk (this is the penalty, not the health). */
    riskPenalty: number;
  };
}

const clampScore = (n: number): number => Math.max(0, Math.min(100, n));

/** Total risk penalty (0–100) from a set of flags, capped at 100. */
export function computeRiskPenalty(riskFlags: RiskFlag[]): number {
  let penalty = 0;
  for (const f of riskFlags) penalty += RISK_SEVERITY_PENALTY[f.severity] ?? 0;
  return Math.min(100, penalty);
}

/**
 * Compute the 4-ingredient weighted Case Strength score (0–100).
 * Risk is applied as an inverted health component so more/severe flags lower
 * the score, while a risk-free case still earns the full risk weight.
 */
export function computeWeightedCaseScore(
  input: WeightedCaseScoreInput
): WeightedCaseScoreResult {
  const evidenceStrength = clampScore(input.evidenceStrength);
  const consistencyScore = clampScore(input.consistencyScore);
  const completeness = clampScore(input.completeness);
  const riskPenalty = computeRiskPenalty(input.riskFlags);
  const riskHealth = 100 - riskPenalty;

  const raw =
    evidenceStrength * CASE_SCORE_WEIGHTS.evidence +
    consistencyScore * CASE_SCORE_WEIGHTS.consistency +
    completeness * CASE_SCORE_WEIGHTS.completeness +
    riskHealth * CASE_SCORE_WEIGHTS.risk;

  return {
    score: clampScore(Math.round(raw)),
    breakdown: { evidenceStrength, consistencyScore, completeness, riskPenalty },
  };
}
