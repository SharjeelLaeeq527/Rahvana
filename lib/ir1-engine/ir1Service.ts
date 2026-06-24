// ─────────────────────────────────────────────────────────────────────────────
// IR-1 Service · Orchestrator · v2, June 2026
//
// PROBLEMS FIXED FROM v1:
//
//   FIX 1 — Wrong stage detection for sub-stages.
//     The old orchestrator used detectCurrentStage() from milestones.config,
//     which only knows about the 12 milestone IDs in MILESTONE_ORDER. It has
//     no knowledge of INTERVIEW_ATTENDED, INTERVIEW_OUTCOME, MEDICAL_SCHEDULED,
//     MEDICAL_ATTENDED, or VISA_ISSUED sub-stages — so a case with an interview
//     date would be detected as DQ or INTERVIEW_WAIT, producing a nonsensical
//     estimate when the user is clearly past that.
//     Fix: orchestrator now uses detectStage() from narrativeEngine, which
//     handles all 16 stage IDs and correctly prioritises real milestone dates
//     (visa_issued, interview_outcome, etc.) over the milestone engine.
//
//   FIX 2 — "Enter receipt number to get an estimate" shown at late stages.
//     The old summaryCard fallback returned "Estimate unavailable" for any
//     stage where estimate was null or certain milestone IDs were in a hardcoded
//     list. A case at INTERVIEW_SCHEDULED (interview date known) was hitting
//     this path and showing a nonsensical prompt for earlier data.
//     Fix: estimate is suppressed intelligently based on the narrative stage,
//     not a hardcoded milestone ID list. Post-interview stages never need an
//     estimate. The "no estimate" copy is stage-appropriate, not generic.
//
//   FIX 3 — Filing date fallback was today's date.
//     Old code: `filingDate = row.filed_date ?? row.filing_date ?? new Date().toISOString()`
//     This made the estimator think the case was just filed, producing a full
//     12–16 month USCIS remaining estimate even for cases at DQ or interview.
//     Fix: filing date is only passed to the engine when it is a real date.
//     When absent, undefined is passed — the estimator handles this correctly
//     per phase (if USCIS is complete, the filing date is irrelevant anyway).
//
//   FIX 4 — Orchestrator ignored narrativeEngine entirely.
//     The old runIR1WebsiteEngine() used buildSummaryCard() for copy, which
//     produced garbage like "I130_USC_NBC — DQ" as the headline. The narrative
//     engine (which has all the intelligent, stage-aware, sparse-data copy) was
//     never called from the orchestrator.
//     Fix: runIR1WebsiteEngine() now calls generateNarrative() and uses its
//     output as the primary source of copy. buildSummaryCard() is retained for
//     the raw IR1EngineOutput (used by advanced UI consumers) but is not used
//     for the website surface output.
//
//   FIX 5 — mapCaseRowToMilestoneDates didn't handle all field aliases.
//     Added: interview_date as fallback for interview_scheduled_date,
//     visa_interview_attended_date, interview_outcome_date (passed through
//     to CaseFields so the narrative engine can use them for sub-stage detection).
// ─────────────────────────────────────────────────────────────────────────────

import {
  detectCurrentStage,
  getNextMilestone,
  calculateProgress,
  isDelayedAtStage,
  MILESTONE_CONFIGS,
  MilestoneDates,
  MilestoneId,
} from "./milestones.config";

import {
  generateEstimate,
  calculateDelayImpact,
  DelayImpactComparison,
  EstimateOutput,
} from "./timelineEstimator";

import {
  generateNarrative,
  detectStage,
  CaseFields,
  NarrativeJourneyContext,
  StageId,
} from "../narrative/narrativeEngine";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface IR1EngineInput {
  caseTypeId: string;
  filingDate?: string; // undefined = not known; never substitute today's date
  milestoneDates: MilestoneDates;
  delayScenarioMonths?: number;
}

// Database row shape — all fields optional, engine derives what it can
export interface CaseDBRowInput {
  case_type?: string;
  // Filing date — either field name accepted
  filing_date?: string | null;
  filed_date?: string | null;
  // USCIS phase
  receipt_number?: string | null;
  notice_date?: string | null;
  receipt_notice_date?: string | null;
  noa1_date?: string | null;
  active_review_date?: string | null;
  approved_date?: string | null;
  // NVC phase
  nvc_received_date?: string | null;
  nvc_case_number?: string | null;
  nvc_invoice_id?: string | null;
  fees_paid_date?: string | null;
  ds260_submitted_date?: string | null;
  docs_submitted_date?: string | null;
  dq_date?: string | null;
  dq_status?: string | null;
  // Embassy / medical / interview
  medical_scheduled_date?: string | null;
  medical_attended_date?: string | null;
  interview_wait_date?: string | null;
  interview_scheduled_date?: string | null;
  interview_date?: string | null; // alias for interview_scheduled_date
  interview_time?: string | null;
  visa_interview_attended_date?: string | null;
  interview_outcome_date?: string | null;
  visa_issued_date?: string | null;
  // Administrative Processing (221g) — optional, user-recorded
  ap_slip_received_date?: string | null;
  ap_reason_category?:
    | "document_request"
    | "security_check"
    | "social_media"
    | "name_check"
    | "unspecified"
    | null;
  // Consulate / metadata
  interview_embassy?: string | null;
  embassy?: string | null;
  consulate?: string | null;
  location?: string | null;
  filing_method?: string | null;
  status_flags?: Record<string, boolean | string | null> | null;
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface IR1EngineOutput {
  currentStage: {
    id: MilestoneId;
    label: string;
    phase: "uscis" | "nvc" | "embassy";
    message: string;
    isDelayed: boolean;
    delayedMessage?: string;
  };
  nextStage: {
    id: MilestoneId | null;
    label: string | null;
    message: string | null;
    actionGuidance: string | null;
  };
  progressPercent: number;
  estimate: EstimateOutput | null;
  delayImpact: DelayImpactComparison | null;
  summaryCard: {
    headline: string;
    subheadline: string;
    typicalRangeLabel: string;
    confidenceLabel: string;
    officialNote: string;
  };
}

// Website-facing output — narrative engine drives all copy
export interface IR1WebsiteOutput {
  headline: string;
  context: string | null;
  action: string | null;
  estimate: string | null;
  badge: string | null;
  policyAlert: string | null;
  stage: StageId; // full 16-value StageId, not just MilestoneId
  raw: IR1EngineOutput;
}

// ─── Stage ID → MilestoneId coercion ─────────────────────────────────────────
// The milestone engine only knows 12 MilestoneIds. Sub-stages from the
// narrative engine (INTERVIEW_ATTENDED, INTERVIEW_OUTCOME, MEDICAL_SCHEDULED,
// MEDICAL_ATTENDED) map to the nearest milestone for progress/delay calculation.

const STAGE_TO_MILESTONE: Partial<Record<StageId, MilestoneId>> = {
  MEDICAL_SCHEDULED: "INTERVIEW_WAIT",
  MEDICAL_ATTENDED: "INTERVIEW_WAIT",
  INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
  INTERVIEW_ATTENDED: "INTERVIEW_SCHEDULED",
  INTERVIEW_OUTCOME: "INTERVIEW_SCHEDULED",
  VISA_ISSUED: "VISA_ISSUED",
};

function stageToMilestoneId(stage: StageId): MilestoneId {
  return (STAGE_TO_MILESTONE[stage] ?? stage) as MilestoneId;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMeaningfulDate(value: string | null | undefined): value is string {
  if (!value) return false;
  const ts = new Date(value).getTime();
  return !Number.isNaN(ts) && new Date(ts).getUTCFullYear() >= 2000;
}

// Stages where forward-looking estimates are irrelevant or impossible.
// These are either complete (VISA_ISSUED) or so close to the end that
// an estimate adds no value (INTERVIEW_ATTENDED, INTERVIEW_OUTCOME).
const NO_ESTIMATE_STAGES: StageId[] = [
  "PRE_FILING",
  "INTERVIEW_ATTENDED",
  "INTERVIEW_OUTCOME",
  "MEDICAL_ATTENDED",
  "VISA_ISSUED",
];

// ─── Map DB row → MilestoneDates ─────────────────────────────────────────────

export function mapCaseRowToMilestoneDates(row: CaseDBRowInput): MilestoneDates {
  return {
    FILED: row.filed_date ?? row.filing_date ?? null,
    NOA1: row.noa1_date ?? row.notice_date ?? row.receipt_notice_date ?? null,
    ACTIVE_REVIEW: row.active_review_date ?? null,
    APPROVED: row.approved_date ?? null,
    NVC_RECEIVED: row.nvc_received_date ?? null,
    FEES_PAID: row.fees_paid_date ?? null,
    DS260_SUBMITTED: row.ds260_submitted_date ?? null,
    DOCS_SUBMITTED: row.docs_submitted_date ?? null,
    DQ: row.dq_date ?? null,
    INTERVIEW_WAIT: row.interview_wait_date ?? null,
    INTERVIEW_SCHEDULED: row.interview_scheduled_date ?? row.interview_date ?? null,
    VISA_ISSUED: row.visa_issued_date ?? null,
  };
}

// Map DB row → CaseFields (narrative engine input).
// CaseFields carries the raw identifier fields (receipt_number, nvc_case_number,
// etc.) that the narrative engine uses for sparse-data stage detection.
export function mapCaseRowToCaseFields(row: CaseDBRowInput): CaseFields {
  return {
    i130_submitted: row.filed_date ?? row.filing_date ?? null,
    receipt_number: row.receipt_number ?? null,
    nvc_case_number: row.nvc_case_number ?? null,
    nvc_invoice_id: row.nvc_invoice_id ?? null,
    ds260_submitted: row.ds260_submitted_date ?? null,
    docs_submitted_nvc: row.docs_submitted_date ?? null,
    dq_date: row.dq_date ?? null,
    medical_scheduled: row.medical_scheduled_date ?? null,
    medical_attended: row.medical_attended_date ?? null,
    interview_date: row.interview_scheduled_date ?? row.interview_date ?? null,
    visa_interview_attended: row.visa_interview_attended_date ?? null,
    interview_outcome: row.interview_outcome_date ?? null,
    visa_issued: row.visa_issued_date ?? null,
    embassy: row.interview_embassy ?? row.embassy ?? row.consulate ?? row.location ?? null,
    filing_method: row.filing_method ?? null,
    ap_slip_received_date: row.ap_slip_received_date ?? null,
    ap_reason_category: row.ap_reason_category ?? null,
  };
}

// Build NarrativeJourneyContext from the DB row so the narrative engine
// can pick up date fields that live in caseData/metadata (approved_date,
// nvc_received_date, fees_paid_date, etc.) even when not in CaseFields directly.
function buildJourneyContext(row: CaseDBRowInput): NarrativeJourneyContext {
  return {
    caseTypeId: row.case_type ?? "I130_USC_NBC",
    caseData: {
      approved_date: row.approved_date ?? null,
      nvc_received_date: row.nvc_received_date ?? null,
      fees_paid_date: row.fees_paid_date ?? null,
      noa1_date: row.noa1_date ?? null,
      notice_date: row.notice_date ?? null,
      receipt_notice_date: row.receipt_notice_date ?? null,
      active_review_date: row.active_review_date ?? null,
      interview_date: row.interview_scheduled_date ?? row.interview_date ?? null,
      dq_date: row.dq_date ?? null,
      visa_issued_date: row.visa_issued_date ?? null,
    },
    metadata: {
      filingMethod: row.filing_method ?? "online",
    },
  };
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function detectStageFromCaseRow(row: CaseDBRowInput): StageId {
  const caseFields = mapCaseRowToCaseFields(row);
  const ctx = buildJourneyContext(row);
  return detectStage(caseFields, ctx);
}

// ─── runIR1Engine — low-level engine (used by advanced UI consumers) ───────────

export function runIR1Engine(input: IR1EngineInput): IR1EngineOutput {
  const {
    caseTypeId,
    filingDate, // may be undefined — never substitute today's date
    milestoneDates,
    delayScenarioMonths = 3,
  } = input;

  // Use milestone engine for progress/delay (it only needs the 12-milestone map)
  const milestoneStageId = detectCurrentStage(milestoneDates);
  const currentConfig = MILESTONE_CONFIGS[milestoneStageId];
  const currentDate = milestoneDates[milestoneStageId];
  const isDelayed = currentDate ? isDelayedAtStage(milestoneStageId, currentDate) : false;

  const nextStageId = getNextMilestone(milestoneStageId);
  const nextConfig = nextStageId ? MILESTONE_CONFIGS[nextStageId] : null;
  const progressPercent = calculateProgress(milestoneStageId);

  // Generate estimate — only pass filingDate when it is real
  const estimate = generateEstimate({
    caseTypeId,
    filingDate: isMeaningfulDate(filingDate) ? filingDate : undefined,
    milestoneDates,
  });

  // Delay impact — only meaningful when we have a real filing date
  let delayImpact: DelayImpactComparison | null = null;
  if (isMeaningfulDate(filingDate)) {
    try {
      delayImpact = calculateDelayImpact({
        caseTypeId,
        filingDate,
        milestoneDates,
        delayMonths: delayScenarioMonths,
      });
    } catch {
      delayImpact = null;
    }
  }

  return {
    currentStage: {
      id: milestoneStageId,
      label: currentConfig.label,
      phase: currentConfig.phase,
      message: isDelayed ? currentConfig.messages.delayed : currentConfig.messages.waiting,
      isDelayed,
      delayedMessage: isDelayed ? currentConfig.messages.delayed : undefined,
    },
    nextStage: nextConfig
      ? {
          id: nextStageId,
          label: nextConfig.label,
          message: nextConfig.messages.upcoming,
          actionGuidance: nextConfig.actionGuidance ?? null,
        }
      : { id: null, label: null, message: null, actionGuidance: null },
    progressPercent,
    estimate,
    delayImpact,
    summaryCard: buildSummaryCard(milestoneStageId, estimate),
  };
}

// ─── runIR1WebsiteEngine — website surface (uses narrative engine for copy) ───
//
// This is the primary function for the website ticker, dashboard cards, and
// any UI that needs human-readable copy. It calls generateNarrative() which
// handles all sparse-data scenarios and stage-appropriate messaging.
//
// The estimate field is:
//   - null  for stages where no estimate is meaningful (post-interview, pre-filing)
//   - a quarter range string (e.g. "Q2 2027 – Q3 2027") for active stages
//   - suffixed with " (up to interview — visa issuance paused)" when pause active

export function runIR1WebsiteEngine(
  row: CaseDBRowInput,
  delayScenarioMonths = 3
): IR1WebsiteOutput {
  const caseFields = mapCaseRowToCaseFields(row);
  const ctx = buildJourneyContext(row);
  const milestoneDates = mapCaseRowToMilestoneDates(row);
  const caseTypeId = row.case_type ?? "I130_USC_NBC";

  // Real filing date only — never substitute today
  const realFilingDate = isMeaningfulDate(row.filed_date ?? row.filing_date)
    ? (row.filed_date ?? row.filing_date)!
    : undefined;

  // Narrative engine drives all copy — handles sparse data, policy flags,
  // sub-stages, and all edge cases.
  const narrative = generateNarrative(caseFields, ctx);

  // Low-level engine output for consumers that need raw numbers
  const raw = runIR1Engine({
    caseTypeId,
    filingDate: realFilingDate,
    milestoneDates,
    delayScenarioMonths,
  });

  // Estimate: suppress entirely for stages where it adds no value
  const estimateValue = NO_ESTIMATE_STAGES.includes(narrative.stage) ? null : narrative.estimate;

  return {
    headline: narrative.headline,
    context: narrative.why,
    action: narrative.action,
    estimate: estimateValue,
    badge: narrative.badge,
    policyAlert: narrative.policyAlert,
    stage: narrative.stage,
    raw,
  };
}

// ─── buildSummaryCard — for raw IR1EngineOutput only ─────────────────────────
// Not used by the website surface — runIR1WebsiteEngine uses narrative engine.
// Retained for advanced UI consumers that want structured estimate data.

function buildSummaryCard(
  stage: MilestoneId,
  estimate: EstimateOutput | null
): IR1EngineOutput["summaryCard"] {
  if (!estimate) {
    return {
      headline: "Estimate not yet available",
      subheadline: "Add your filing date or NVC dates to generate a timeline estimate.",
      typicalRangeLabel: "",
      confidenceLabel: "Unknown",
      officialNote: "",
    };
  }

  const typicalRange =
    estimate.endToEnd.typicalMinQuarter.label === estimate.endToEnd.typicalMaxQuarter.label
      ? estimate.endToEnd.typicalMinQuarter.label
      : `${estimate.endToEnd.typicalMinQuarter.label} – ${estimate.endToEnd.typicalMaxQuarter.label}`;

  const pauseSuffix = estimate.endToEnd.visaIssuanceIndefinite
    ? " (visa issuance currently paused)"
    : "";

  return {
    headline: `Case — ${stage}`,
    subheadline: typicalRange + pauseSuffix,
    typicalRangeLabel: typicalRange + pauseSuffix,
    confidenceLabel: estimate.confidence.label,
    officialNote: estimate.official.note,
  };
}
