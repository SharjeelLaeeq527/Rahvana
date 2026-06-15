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

  // Build each section
  const executiveSummary = buildExecutiveSummary(
    evidenceAnalysis,
    unresolvedFindings,
    resolvedFindings.length
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
  resolvedCount: number
): string {
  const parts: string[] = [];

  // Overall assessment from evidence score
  if (evidenceAnalysis) {
    const score = evidenceAnalysis.overallScore;
    const stats = evidenceAnalysis.stats;

    if (score >= 80) {
      parts.push("Your case appears to be well-documented overall.");
    } else if (score >= 60) {
      parts.push("Your case appears moderately strong.");
    } else if (score >= 40) {
      parts.push("Your case documentation has some gaps that need attention.");
    } else {
      parts.push("Your case requires significant documentation improvements.");
    }

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
      parts.push(
        `${reqDocs.missing.length} required document${reqDocs.missing.length > 1 ? "s are" : " is"} still missing`
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
