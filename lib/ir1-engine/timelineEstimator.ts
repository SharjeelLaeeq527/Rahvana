import {
  getCaseTypeConfig,
  getConsulateForCaseType,
  ConfidenceLevel,
  COMMUNITY_DATASET_STATS,
} from "./caseTypes.config";
import {
  MilestoneId,
  detectCurrentStage,
  MilestoneDates,
  MILESTONE_ORDER,
} from "./milestones.config";
import { effectiveVisaIssuanceMonths, stageAffectedByPolicy } from "./policyFlags";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuarterLabel {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  label: string; // "Q3 2027"
  humanLabel: string; // "mid-2027"
}

export interface EstimateOutput {
  caseTypeId: string;
  currentStage: MilestoneId;

  official: {
    months: number | null;
    note: string;
  };

  scenarios: {
    optimistic: { months: number; quarterLabel: QuarterLabel };
    typical: {
      minMonths: number;
      maxMonths: number;
      minQuarter: QuarterLabel;
      maxQuarter: QuarterLabel;
    };
    delayRisk: { months: number | null; quarterLabel: QuarterLabel | null };
  };

  endToEnd: {
    optimisticMonths: number;
    typicalMin: number;
    typicalMax: number;
    worstCaseMonths: number;
    optimisticQuarter: QuarterLabel;
    typicalMinQuarter: QuarterLabel;
    typicalMaxQuarter: QuarterLabel;
    worstCaseQuarter: QuarterLabel;
    // True when PAKISTAN_IV_PAUSE (or similar) makes visa issuance indefinite.
    // When true, the above months cover up-to-interview only, not visa issuance.
    visaIssuanceIndefinite: boolean;
  };

  confidence: {
    level: ConfidenceLevel;
    label: string;
    explanation: string;
  };

  // Active policy flags that materially affect this estimate
  activePolicyFlags: Array<{
    id: string;
    headline: string;
    detail: string;
    sourceUrl: string;
  }>;

  provenance: {
    computedAt: string;
    monthsElapsed: number;
    dominantFactor: string;
    stagesRemaining: number;
    sourceNote: string;
    uscisPhaseComplete: boolean;
    nvcPhaseComplete: boolean;
    filingDatePresent: boolean;
    breakdown: {
      uscisRemainingMin: number;
      uscisRemainingMax: number;
      nvcRemainingTypical: number;
      nvcRemainingWorstCase: number;
      embassyRemainingTypical: number;
      embassyRemainingWorstCase: number;
      visaIssuanceMonths: number | null;
    };
  };

  monthsElapsed: number;
  remainingTypicalMin: number;
  remainingTypicalMax: number;

  consulateInfo: {
    label: string;
    ivToolDQMonth: string;
    postDQTypical: number;
    queueVelocityKnown: boolean;
    note: string;
  };
}

const NVC_DQ_REVIEW = { optimistic: 0.25, typical: 0.75, worstCase: 2.0 };

const NVC_REMAINING: Record<string, { optimistic: number; typical: number; worstCase: number }> = {
  APPROVED: { optimistic: 1.5, typical: 2.5, worstCase: 6.0 },
  NVC_RECEIVED: { optimistic: 1.5, typical: 2.5, worstCase: 6.0 },
  FEES_PAID: { optimistic: 1.25, typical: 2.0, worstCase: 5.0 },
  DS260_SUBMITTED: { optimistic: 1.0, typical: 1.5, worstCase: 4.0 },
  DOCS_SUBMITTED: {
    optimistic: NVC_DQ_REVIEW.optimistic,
    typical: NVC_DQ_REVIEW.typical,
    worstCase: NVC_DQ_REVIEW.worstCase,
  },
  DQ: { optimistic: 0, typical: 0, worstCase: 0 },
};

const NVC_FULL = { optimistic: 1.5, typical: 2.5, worstCase: 6.0 };

// Default visa issuance time (no policy flags). Overridden by policyFlags.ts.
const VISA_ISSUANCE_MONTHS_DEFAULT = 0.5;

// ─── Confidence label map ─────────────────────────────────────────────────────

const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; explanation: string }> = {
  high: {
    label: "High confidence",
    explanation: "Stable stage with consistent historical data.",
  },
  medium: {
    label: "Moderate confidence",
    explanation:
      "Some variability in processing times. The typical range is realistic but individual cases differ.",
  },
  low: {
    label: "Low confidence",
    explanation:
      "The Islamabad queue is the dominant variable and shifts month to month. Treat this as a rough guide.",
  },
  very_low: {
    label: "Very low confidence",
    explanation:
      "Highly unpredictable. Active policy changes or severe backlogs mean the estimate is a rough floor, not a forecast.",
  },
};

// ─── Quarter utilities ────────────────────────────────────────────────────────

export function monthsFromNowToQuarter(months: number): QuarterLabel {
  const now = new Date();
  const future = new Date(now.getFullYear(), now.getMonth() + Math.round(months), 1);
  const month = future.getMonth();
  const year = future.getFullYear();
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  const humanLabels: Record<number, string> = {
    1: `early ${year}`,
    2: `mid-${year}`,
    3: `mid-${year}`,
    4: `late ${year}`,
  };
  return { quarter, year, label: `Q${quarter} ${year}`, humanLabel: humanLabels[quarter] };
}

export function monthsElapsedSince(dateStr: string): number {
  const past = new Date(dateStr).getTime();
  return Math.max(0, (Date.now() - past) / (1000 * 60 * 60 * 24 * 30.44));
}

function floorMonths(n: number): number {
  return Math.max(0, n);
}

const CONF_PRIORITY: ConfidenceLevel[] = ["very_low", "low", "medium", "high"];
function worstConfidence(a: ConfidenceLevel, b: ConfidenceLevel): ConfidenceLevel {
  return CONF_PRIORITY[Math.min(CONF_PRIORITY.indexOf(a), CONF_PRIORITY.indexOf(b))];
}

function stagesRemainingCount(current: MilestoneId): number {
  const idx = MILESTONE_ORDER.indexOf(current);
  return Math.max(0, MILESTONE_ORDER.length - 1 - idx);
}

// ─── Phase completion helpers ─────────────────────────────────────────────────

function isUscisComplete(stage: MilestoneId): boolean {
  return [
    "APPROVED",
    "NVC_RECEIVED",
    "FEES_PAID",
    "DS260_SUBMITTED",
    "DOCS_SUBMITTED",
    "DQ",
    "INTERVIEW_WAIT",
    "INTERVIEW_SCHEDULED",
    "VISA_ISSUED",
  ].includes(stage);
}

function isNvcComplete(stage: MilestoneId): boolean {
  return ["DQ", "INTERVIEW_WAIT", "INTERVIEW_SCHEDULED", "VISA_ISSUED"].includes(stage);
}

// ─── Main Estimate Engine ─────────────────────────────────────────────────────

export interface EstimateInput {
  caseTypeId: string;
  filingDate?: string;
  milestoneDates: MilestoneDates;
}

export function generateEstimate(input: EstimateInput): EstimateOutput | null {
  const config = getCaseTypeConfig(input.caseTypeId);
  if (!config) return null;

  const consulate = getConsulateForCaseType(input.caseTypeId);
  const { estimate } = config;

  const currentStage = detectCurrentStage(input.milestoneDates);
  const uscisPhaseComplete = isUscisComplete(currentStage);
  const nvcPhaseComplete = isNvcComplete(currentStage);

  // monthsElapsed is only meaningful when USCIS is not yet done.
  // When USCIS IS done, the filing date is irrelevant to remaining estimates.
  const monthsElapsed =
    input.filingDate && !uscisPhaseComplete ? monthsElapsedSince(input.filingDate) : 0;
  const hasFilingDate = Boolean(input.filingDate);

  // Queue velocity: needs 3+ IV Tool snapshots to be meaningful
  const queueVelocityKnown =
    consulate.ivToolHistory.filter((s) => Boolean(s.pulledDate)).length >= 3;

  // Active policy flags that affect this estimate
  const flagsForCurrentStage = (() => {
    // Check current stage and all remaining stages in the journey
    const remainingStages = MILESTONE_ORDER.slice(MILESTONE_ORDER.indexOf(currentStage));
    const seen = new Set<string>();
    const flags = [];
    for (const stageId of remainingStages) {
      const flag = stageAffectedByPolicy(stageId);
      if (flag && !seen.has(flag.id)) {
        seen.add(flag.id);
        flags.push(flag);
      }
    }
    // Also check the sub-stages that aren't in MILESTONE_ORDER
    for (const extraStage of ["INTERVIEW_ATTENDED", "INTERVIEW_OUTCOME", "INTERVIEW_SCHEDULED"]) {
      const flag = stageAffectedByPolicy(extraStage);
      if (flag && !seen.has(flag.id)) {
        seen.add(flag.id);
        flags.push(flag);
      }
    }
    return flags;
  })();

  // Effective visa issuance months (null = indefinite due to policy flag)
  const visaIssuanceMonths = (() => {
    if (currentStage === "VISA_ISSUED") return 0;
    return effectiveVisaIssuanceMonths(VISA_ISSUANCE_MONTHS_DEFAULT);
  })();
  const visaIssuanceIndefinite = visaIssuanceMonths === null;

  let uscisOpt = 0,
    uscisMin = 0,
    uscisMax = 0,
    uscisDelay: number | null = null;

  if (!uscisPhaseComplete) {
    if (hasFilingDate) {
      uscisOpt = floorMonths(estimate.optimisticMonths - monthsElapsed);
      uscisMin = floorMonths(estimate.typicalMin - monthsElapsed);
      uscisMax = floorMonths(estimate.typicalMax - monthsElapsed);
      uscisDelay =
        estimate.delayRiskMonths !== null
          ? floorMonths(estimate.delayRiskMonths - monthsElapsed)
          : null;
    } else {
      // No filing date and USCIS not done — full duration, confidence penalty
      uscisOpt = estimate.optimisticMonths;
      uscisMin = estimate.typicalMin;
      uscisMax = estimate.typicalMax;
      uscisDelay = estimate.delayRiskMonths;
    }
  }

  let nvcOpt = 0,
    nvcTyp = 0,
    nvcWorstCase = 0;

  if (!nvcPhaseComplete) {
    const nvcEntry = NVC_REMAINING[currentStage];
    if (nvcEntry) {
      nvcOpt = nvcEntry.optimistic;
      nvcTyp = nvcEntry.typical;
      nvcWorstCase = nvcEntry.worstCase;
    } else if (!uscisPhaseComplete) {
      // Pre-NVC: full NVC journey ahead
      nvcOpt = NVC_FULL.optimistic;
      nvcTyp = NVC_FULL.typical;
      nvcWorstCase = NVC_FULL.worstCase;
    } else if (uscisPhaseComplete && !nvcPhaseComplete) {
      const fallback = NVC_REMAINING["NVC_RECEIVED"];
      nvcOpt = fallback.optimistic;
      nvcTyp = fallback.typical;
      nvcWorstCase = fallback.worstCase;
    }
  }

  // ── 3. Embassy Queue Remaining ───────────────────────────────────────────

  let embassyOpt = 0,
    embassyTyp = 0,
    embassyWorstCase = 0;

  if (currentStage === "VISA_ISSUED") {
    // done
  } else if (currentStage === "INTERVIEW_SCHEDULED") {
    const interviewDateStr = input.milestoneDates.INTERVIEW_SCHEDULED;
    if (interviewDateStr) {
      const daysUntil = Math.round(
        (new Date(interviewDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const mo = floorMonths(daysUntil / 30.44);
      embassyOpt = embassyTyp = embassyWorstCase = mo;
    } else {
      embassyOpt = embassyTyp = embassyWorstCase = 0.5;
    }
  } else {
    const dqDateStr = input.milestoneDates.DQ;
    if (dqDateStr) {
      const dqElapsed = monthsElapsedSince(dqDateStr);
      embassyOpt = floorMonths(consulate.postDQMin - dqElapsed);
      embassyTyp = floorMonths(consulate.postDQTypical - dqElapsed);
      embassyWorstCase = floorMonths(consulate.postDQMax - dqElapsed);
    } else {
      embassyOpt = consulate.postDQMin;
      embassyTyp = consulate.postDQTypical;
      embassyWorstCase = consulate.postDQMax;
    }
  }

  const visaMo = visaIssuanceMonths ?? 0; // 0 contribution when indefinite

  const e2eOpt = uscisOpt + nvcOpt + embassyOpt + visaMo;
  const e2eMin = uscisMin + nvcTyp + embassyTyp + visaMo;
  const e2eMax = uscisMax + nvcTyp + embassyTyp + visaMo;
  const e2eWorstCase = uscisMax + nvcWorstCase + embassyWorstCase + visaMo;

  // ── 5. Confidence ─────────────────────────────────────────────────────────

  let overallConfidence = worstConfidence(estimate.confidenceLevel, consulate.confidenceLevel);

  // Penalise for missing filing date ONLY when USCIS is not done
  if (!hasFilingDate && !uscisPhaseComplete) {
    overallConfidence = worstConfidence(overallConfidence, "low");
  }

  // Penalise for unknown queue velocity
  if (!queueVelocityKnown) {
    overallConfidence = worstConfidence(overallConfidence, "low");
  }

  // Force very_low when visa issuance is indefinite (policy pause)
  if (visaIssuanceIndefinite) {
    overallConfidence = "very_low";
  }

  // ── 6. Dominant factor ────────────────────────────────────────────────────

  let dominantFactor: string;
  if (visaIssuanceIndefinite) {
    dominantFactor = "Active policy: immigrant visa issuance paused";
  } else if (embassyTyp > 0 && embassyTyp >= uscisMin && embassyTyp >= nvcTyp) {
    dominantFactor = "Consulate queue (Islamabad)";
  } else if (uscisMin > 0 && uscisMin >= nvcTyp) {
    dominantFactor = "USCIS processing backlog";
  } else if (nvcTyp > 0) {
    dominantFactor = "NVC processing";
  } else {
    dominantFactor = "Near completion";
  }

  // ── 7. Source note ────────────────────────────────────────────────────────

  const sourceNote =
    `USCIS estimate: Tier 1 (official processing times) + Tier 2 (attorney analysis: Kulen Law, Modern Law Group). ` +
    `Pakistan community data (Tier 3, n=${COMMUNITY_DATASET_STATS.n} used for USCIS validation only; insufficient for primary forecasting). ` +
    `Embassy queue: Tier 1 (DoS IV Tool ${consulate.ivToolPulledDate}). ` +
    (!queueVelocityKnown
      ? `Queue velocity: unknown (<3 IV Tool snapshots on record, add monthly captures to enable velocity tracking).`
      : `Queue velocity: derivable from ivToolHistory.`);

  return {
    caseTypeId: input.caseTypeId,
    currentStage,

    official: {
      months: estimate.uscisOfficialMonths,
      note: estimate.uscisNote,
    },

    scenarios: {
      optimistic: {
        months: uscisOpt,
        quarterLabel: monthsFromNowToQuarter(uscisOpt),
      },
      typical: {
        minMonths: uscisMin,
        maxMonths: uscisMax,
        minQuarter: monthsFromNowToQuarter(uscisMin),
        maxQuarter: monthsFromNowToQuarter(uscisMax),
      },
      delayRisk: {
        months: uscisDelay,
        quarterLabel: uscisDelay !== null ? monthsFromNowToQuarter(uscisDelay) : null,
      },
    },

    endToEnd: {
      optimisticMonths: e2eOpt,
      typicalMin: e2eMin,
      typicalMax: e2eMax,
      worstCaseMonths: e2eWorstCase,
      optimisticQuarter: monthsFromNowToQuarter(e2eOpt),
      typicalMinQuarter: monthsFromNowToQuarter(e2eMin),
      typicalMaxQuarter: monthsFromNowToQuarter(e2eMax),
      worstCaseQuarter: monthsFromNowToQuarter(e2eWorstCase),
      visaIssuanceIndefinite,
    },

    confidence: {
      level: overallConfidence,
      ...CONFIDENCE_META[overallConfidence],
    },

    activePolicyFlags: flagsForCurrentStage.map((f) => ({
      id: f.id,
      headline: f.headline,
      detail: f.detail,
      sourceUrl: f.sourceUrl,
    })),

    monthsElapsed,
    remainingTypicalMin: uscisMin,
    remainingTypicalMax: uscisMax,

    consulateInfo: {
      label: consulate.label,
      ivToolDQMonth: consulate.ivToolDQMonth,
      postDQTypical: consulate.postDQTypical,
      queueVelocityKnown,
      note: consulate.note,
    },

    provenance: {
      computedAt: new Date().toISOString(),
      monthsElapsed,
      dominantFactor,
      stagesRemaining: stagesRemainingCount(currentStage),
      sourceNote,
      uscisPhaseComplete,
      nvcPhaseComplete,
      filingDatePresent: hasFilingDate,
      breakdown: {
        uscisRemainingMin: uscisMin,
        uscisRemainingMax: uscisMax,
        nvcRemainingTypical: nvcTyp,
        nvcRemainingWorstCase: nvcWorstCase,
        embassyRemainingTypical: embassyTyp,
        embassyRemainingWorstCase: embassyWorstCase,
        visaIssuanceMonths,
      },
    },
  };
}

// ─── Delay Impact Engine ──────────────────────────────────────────────────────

export interface DelayImpactComparison {
  fileNow: { interviewQuarter: QuarterLabel; visaQuarter: QuarterLabel | null; message: string };
  fileLater: {
    delayMonths: number;
    interviewQuarter: QuarterLabel;
    visaQuarter: QuarterLabel | null;
    message: string;
  };
  summaryMessage: string;
  crossesYearBoundary: boolean;
  visaIssuanceIndefinite: boolean;
}

export interface DelayImpactInput {
  caseTypeId: string;
  filingDate: string;
  milestoneDates: MilestoneDates;
  delayMonths?: number;
}

export function calculateDelayImpact(input: DelayImpactInput): DelayImpactComparison {
  const delayMonths = input.delayMonths ?? 3;
  const config = getCaseTypeConfig(input.caseTypeId);
  if (!config) throw new Error(`Unknown case type: ${input.caseTypeId}`);

  const consulate = getConsulateForCaseType(input.caseTypeId);
  const monthsElapsed = monthsElapsedSince(input.filingDate);

  const remainingUscis = floorMonths(config.estimate.typicalMin - monthsElapsed);
  const nowInterviewMonths = remainingUscis + NVC_FULL.typical + consulate.postDQTypical;

  const visaIssuanceMonths = effectiveVisaIssuanceMonths(VISA_ISSUANCE_MONTHS_DEFAULT);
  const visaIssuanceIndefinite = visaIssuanceMonths === null;

  const nowVisaMonths = visaIssuanceIndefinite ? null : nowInterviewMonths + visaIssuanceMonths!;
  const laterInterviewMonths = nowInterviewMonths + delayMonths;
  const laterVisaMonths = visaIssuanceIndefinite
    ? null
    : nowInterviewMonths + delayMonths + visaIssuanceMonths!;

  const nowIQ = monthsFromNowToQuarter(nowInterviewMonths);
  const nowVQ = nowVisaMonths !== null ? monthsFromNowToQuarter(nowVisaMonths) : null;
  const laterIQ = monthsFromNowToQuarter(laterInterviewMonths);
  const laterVQ = laterVisaMonths !== null ? monthsFromNowToQuarter(laterVisaMonths) : null;

  const crossesYearBoundary = nowIQ.year !== laterIQ.year;

  const summaryMessage = visaIssuanceIndefinite
    ? `A ${delayMonths}-month delay may shift your Islamabad interview from ${nowIQ.label} to ${laterIQ.label}. ` +
      `Note: immigrant visa issuances for Pakistan are currently paused, interview timing matters less than the policy lift date.`
    : crossesYearBoundary
      ? `Waiting ${delayMonths} months could push your Islamabad interview from ${nowIQ.label} into ${laterIQ.year} a significant shift.`
      : `A ${delayMonths}-month delay may move your estimated interview from ${nowIQ.label} to ${laterIQ.label}.`;

  return {
    fileNow: {
      interviewQuarter: nowIQ,
      visaQuarter: nowVQ,
      message: `Acting now may position your Islamabad interview around ${nowIQ.label}.`,
    },
    fileLater: {
      delayMonths,
      interviewQuarter: laterIQ,
      visaQuarter: laterVQ,
      message: `Waiting ${delayMonths} months may shift your interview from ${nowIQ.label} to ${laterIQ.label}.`,
    },
    summaryMessage,
    crossesYearBoundary,
    visaIssuanceIndefinite,
  };
}

// ─── Milestone delay messages ─────────────────────────────────────────────────

export type DelayableMilestone = "FILED" | "FEES_PAID" | "DS260_SUBMITTED" | "DOCS_SUBMITTED";

const MILESTONE_DELAY_MESSAGES: Record<DelayableMilestone, (months: number) => string> = {
  FILED: (m) =>
    `Filing ${m} month${m !== 1 ? "s" : ""} later shifts your entire timeline, including your Islamabad queue position, by roughly the same amount.`,
  FEES_PAID: (m) =>
    `Delaying NVC fee payment by ${m} month${m !== 1 ? "s" : ""} directly delays when your case enters the Islamabad scheduling queue.`,
  DS260_SUBMITTED: (m) =>
    `Submitting your DS-260 ${m} month${m !== 1 ? "s" : ""} later may delay documentary qualification and push your Islamabad interview window back accordingly.`,
  DOCS_SUBMITTED: (m) =>
    `Delaying civil documents by ${m} month${m !== 1 ? "s" : ""} can stall DQ, the gate to Islamabad scheduling. ` +
    `When documents are clean, DQ follows within days; each rejected round adds 2-4 weeks. ` +
    `Document rejection is the most common NVC delay for Pakistan cases.`,
};

export function getMilestoneDelayMessage(milestone: DelayableMilestone, delayMonths = 1): string {
  return MILESTONE_DELAY_MESSAGES[milestone](delayMonths);
}
