// ─────────────────────────────────────────────────────────────────────────────
// narrativeEngine.ts · v6.2, June 2026
//
// CHANGES vs v6.1:
//
//   FIX 5 — FEES_PAID stage not detected:
//     buildRealMilestoneDates was only reading fees_paid_date / feesPaidDate
//     from caseData. Users who paid fees but didn't record a date stayed on
//     NVC_RECEIVED. Fix: also check ctx.metadata.nvcFeeStatus (written by the
//     step_2_2 checker) and ctx.metadata.feesPaidAt as fallback anchors.
//     When either is present and no explicit date exists, we synthesise today
//     as the FEES_PAID milestone so detectCurrentStage advances correctly.
//
//   COPY OVERHAUL — all stage messages rewritten for:
//     • Natural, conversational tone — less policy-manual, more human
//     • Chapter/step position awareness — we never know exactly which step
//       the user is currently on inside a chapter, so messages avoid saying
//       "begin Chapter 2" when they may already be mid-way through it
//     • Delay and pause framing is reassuring rather than alarming
//     • Pause-affected stages: removed "the pause does not affect this stage"
//       (unnecessary when the stage genuinely isn't affected); affected stages
//       give calm context instead of warnings
//     • Estimate suffix reworded: "(timeline to interview — visa stamping
//       timing depends on policy at that point)" instead of the blunt paused label
//     • Filing date prompt removed from NOA1/ACTIVE_REVIEW copy — we never ask
//       users to enter their filing date in the roadmap, so prompting them to
//       "add it" was confusing. Sub-cases that relied on it now give equally
//       useful copy without the ask.
// ─────────────────────────────────────────────────────────────────────────────

import { getConsulateForCaseType } from "../ir1-engine/caseTypes.config";
import { generateEstimate } from "../ir1-engine/timelineEstimator";
import { MilestoneDates, detectCurrentStage } from "../ir1-engine/milestones.config";
import { stageAffectedByPolicy, POLICY_FLAGS } from "../ir1-engine/policyFlags";
import { APReasonCategory, getAPResolutionGuidance, AP_ESCALATION_THRESHOLDS } from "./apTracking";

// ─── USCIS tier thresholds (Pakistan NBC, community-validated) ────────────────

const USCIS_TIERS = {
  bestCase: { min: 9, max: 11 },
  optimistic: { min: 11, max: 12 },
  typical: { min: 12, max: 16 },
  slowButCommon: { min: 16, max: 20 },
};

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CaseFields {
  i130_submitted: string | null;
  receipt_number: string | null;
  nvc_case_number: string | null;
  nvc_invoice_id: string | null;
  ds260_submitted: string | null;
  docs_submitted_nvc: string | null;
  dq_date: string | null;
  medical_scheduled: string | null;
  medical_attended: string | null;
  interview_date: string | null;
  visa_interview_attended: string | null;
  interview_outcome: string | null;
  visa_issued: string | null;
  embassy: string | null;
  filing_method: string | null;
  ap_slip_received_date: string | null;
  ap_reason_category: APReasonCategory | null;
}

export interface NarrativeJourneyContext {
  completedSteps?: Iterable<string> | string[];
  metadata?: Record<string, unknown>;
  answers?: Record<string, unknown>;
  caseData?: Record<string, unknown>;
  uploadedDocuments?: Array<{
    key?: string;
    documentDefId?: string;
    formCode?: string;
    status?: string;
  }>;
  toolSessions?: Record<
    string,
    { is_completed?: boolean; completed_at?: string | null; completion_percentage?: number } | null
  >;
  caseTypeId?: string;
}

// ─── Output shape ─────────────────────────────────────────────────────────────

export interface CaseNarrative {
  headline: string;
  why: string | null;
  action: string | null;
  estimate: string | null;
  badge: string | null;
  stage: StageId;
  policyAlert: string | null;
}

// ─── Stage IDs ────────────────────────────────────────────────────────────────

export type StageId =
  | "PRE_FILING"
  | "FILED"
  | "NOA1"
  | "ACTIVE_REVIEW"
  | "APPROVED"
  | "NVC_RECEIVED"
  | "FEES_PAID"
  | "DS260_SUBMITTED"
  | "DOCS_SUBMITTED"
  | "DQ"
  | "INTERVIEW_WAIT"
  | "MEDICAL_SCHEDULED"
  | "MEDICAL_ATTENDED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_ATTENDED"
  | "INTERVIEW_OUTCOME"
  | "VISA_ISSUED";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMeaningfulDate(value: string | null | undefined): value is string {
  if (!value) return false;
  const ts = new Date(value).getTime();
  return !Number.isNaN(ts) && new Date(ts).getUTCFullYear() >= 2000;
}

function monthsAgoRaw(dateStr: string): number {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function monthsAgoRounded(dateStr: string, isApprox: boolean): number | null {
  const raw = monthsAgoRaw(dateStr);
  const rounded = Math.round(raw);
  if (raw < 0.5 && isApprox) return null;
  return Math.max(1, rounded);
}

function weeksAgoRounded(dateStr: string): number {
  return Math.max(
    0,
    Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 7))
  );
}

function dqElapsed(dateStr: string): string {
  const days = daysAgoRounded(dateStr);
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const mo = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return pl(mo, "month");
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function getCaseData(ctx: NarrativeJourneyContext): Record<string, unknown> {
  return { ...(ctx.metadata ?? {}), ...(ctx.caseData ?? {}) };
}

function getFromCaseData(ctx: NarrativeJourneyContext, keys: string[]): string | null {
  const data = getCaseData(ctx);
  for (const key of keys) {
    const v = data[key];
    if (typeof v === "string" && isMeaningfulDate(v)) return v;
  }
  return null;
}

function getReceiptNoticeDate(ctx: NarrativeJourneyContext): string | null {
  const data = getCaseData(ctx);
  for (const key of ["notice_date", "noa1_date", "noa_date", "noa1_notice_date"]) {
    const v = data[key];
    if (typeof v === "string" && isMeaningfulDate(v)) return v;
  }
  const nested = data.uscis_receipt_number;
  if (nested && typeof nested === "object") {
    for (const key of ["noticeDate", "notice_date", "noa1_date", "noa_date"]) {
      const v = (nested as Record<string, unknown>)[key];
      if (typeof v === "string" && isMeaningfulDate(v)) return v;
    }
  }
  return null;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgoRounded(dateStr: string): number {
  return Math.max(
    0,
    Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  );
}

function deriveEffectiveFilingDate(
  user: CaseFields,
  ctx: NarrativeJourneyContext
): { date: string | null; isApprox: boolean } {
  if (isMeaningfulDate(user.i130_submitted)) {
    return { date: user.i130_submitted, isApprox: false };
  }
  const noticeDate = getReceiptNoticeDate(ctx);
  if (noticeDate) {
    return { date: offsetDate(noticeDate, -21), isApprox: true };
  }
  return { date: null, isApprox: false };
}

function buildRealMilestoneDates(
  user: CaseFields,
  ctx: NarrativeJourneyContext,
  filingDate: string | null
): MilestoneDates {
  const receiptDate = getReceiptNoticeDate(ctx);
  const approvalDate = getFromCaseData(ctx, ["approved_date", "approvalDate"]);
  let nvcReceivedDate = getFromCaseData(ctx, ["nvc_received_date", "nvcReceivedDate"]);

  if (!nvcReceivedDate && (user.nvc_case_number || user.nvc_invoice_id)) {
    nvcReceivedDate = approvalDate ?? todayStr();
  }

  // FIX 5: detect FEES_PAID from nvcFeeStatus written by handleSaveNvcFee.
  // Shape is { aos: string, iv: string, date?: string, note?: string }.
  // Both fees must be "Paid" to advance — partial payment is not enough to
  // unlock DS-260 in CEAC, so we require aos AND iv both equal "Paid".
  let feesPaidDate = getFromCaseData(ctx, ["fees_paid_date", "feesPaidDate"]);
  if (!feesPaidDate) {
    const feeStatus = ctx.metadata?.nvcFeeStatus as
      | { aos?: string; iv?: string; date?: string }
      | undefined;
    if (feeStatus?.aos === "Paid" && feeStatus?.iv === "Paid") {
      feesPaidDate =
        feeStatus.date && isMeaningfulDate(feeStatus.date) ? feeStatus.date : todayStr();
    }
  }

  const ds260Date = isMeaningfulDate(user.ds260_submitted)
    ? user.ds260_submitted
    : getFromCaseData(ctx, ["ds260_submitted_date", "ds260SubmittedDate"]);
  const docsDate = isMeaningfulDate(user.docs_submitted_nvc)
    ? user.docs_submitted_nvc
    : getFromCaseData(ctx, ["docs_submitted_date", "docsSubmittedDate"]);
  const dqDate = isMeaningfulDate(user.dq_date)
    ? user.dq_date
    : getFromCaseData(ctx, ["dq_date", "dqDate"]);
  const interviewDate = isMeaningfulDate(user.interview_date)
    ? user.interview_date
    : getFromCaseData(ctx, ["interview_date", "interviewDate"]);
  const visaDate = isMeaningfulDate(user.visa_issued)
    ? user.visa_issued
    : getFromCaseData(ctx, ["visa_issued_date", "visaIssuedDate"]);

  return {
    FILED: filingDate,
    NOA1: receiptDate ?? null,
    ACTIVE_REVIEW: user.receipt_number ? (receiptDate ?? filingDate) : null,
    APPROVED: approvalDate,
    NVC_RECEIVED: nvcReceivedDate,
    FEES_PAID: feesPaidDate ?? null,
    DS260_SUBMITTED: ds260Date,
    DOCS_SUBMITTED: docsDate,
    DQ: dqDate,
    INTERVIEW_WAIT: dqDate,
    INTERVIEW_SCHEDULED: interviewDate,
    VISA_ISSUED: visaDate,
  };
}

// ─── Stage detection ──────────────────────────────────────────────────────────

export function detectStage(u: CaseFields, ctx: NarrativeJourneyContext = {}): StageId {
  const effective = deriveEffectiveFilingDate(u, ctx);
  const dates = buildRealMilestoneDates(u, ctx, effective.date);

  if (isMeaningfulDate(u.visa_issued)) return "VISA_ISSUED";
  if (isMeaningfulDate(u.interview_outcome)) return "INTERVIEW_OUTCOME";
  if (isMeaningfulDate(u.visa_interview_attended)) return "INTERVIEW_ATTENDED";
  if (isMeaningfulDate(u.interview_date)) return "INTERVIEW_SCHEDULED";
  if (isMeaningfulDate(u.medical_attended)) return "MEDICAL_ATTENDED";
  if (isMeaningfulDate(u.medical_scheduled)) return "MEDICAL_SCHEDULED";

  const hasAnyDate = Object.values(dates).some(isMeaningfulDate);

  if (!hasAnyDate) {
    if (u.nvc_case_number || u.nvc_invoice_id) return "NVC_RECEIVED";
    if (u.receipt_number) return "ACTIVE_REVIEW";
    return "PRE_FILING";
  }

  const detected = detectCurrentStage(dates) as StageId;

  if (
    detected === "NVC_RECEIVED" &&
    !u.nvc_case_number &&
    !u.nvc_invoice_id &&
    getFromCaseData(ctx, ["approved_date", "approvalDate"])
  ) {
    return "APPROVED";
  }

  return detected;
}

// ─── Estimate label ───────────────────────────────────────────────────────────

function estimateLabel(
  user: CaseFields,
  stage: StageId,
  effective: { date: string | null; isApprox: boolean },
  caseTypeId: string,
  ctx: NarrativeJourneyContext
): string | null {
  const noEstimateStages: StageId[] = [
    "PRE_FILING",
    "VISA_ISSUED",
    "INTERVIEW_OUTCOME",
    "INTERVIEW_ATTENDED",
    "MEDICAL_ATTENDED",
  ];
  if (noEstimateStages.includes(stage)) return null;

  const milestoneDates = buildRealMilestoneDates(user, ctx, effective.date);
  const reliableFilingDate = effective.date && !effective.isApprox ? effective.date : undefined;

  const result = generateEstimate({
    caseTypeId,
    filingDate: reliableFilingDate,
    milestoneDates,
  });
  if (!result) return null;

  // Reworded suffix: factual about what the estimate covers, not alarming
  const pauseSuffix = result.endToEnd.visaIssuanceIndefinite
    ? " (estimated interview window —  visa timing subject to current pause)"
    : "";

  const minLabel = result.endToEnd.typicalMinQuarter.label;
  const maxLabel = result.endToEnd.typicalMaxQuarter.label;
  const rangeLabel = minLabel === maxLabel ? minLabel : `${minLabel} – ${maxLabel}`;
  return rangeLabel + pauseSuffix;
}

// ─── Policy alert — for genuinely affected stages only ────────────────────────

const PAUSE_AFFECTED_STAGES: StageId[] = [
  "DQ",
  "INTERVIEW_WAIT",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_ATTENDED",
  "INTERVIEW_OUTCOME",
  "VISA_ISSUED",
];

function buildPolicyAlert(stageId: StageId): string | null {
  if (!PAUSE_AFFECTED_STAGES.includes(stageId)) return null;
  const flag = stageAffectedByPolicy(stageId);
  if (!flag) return null;
  return flag.headline;
}

// ─── Pluralise helper ─────────────────────────────────────────────────────────

function pl(n: number, unit: string): string {
  const r = Math.round(n);
  return `${r} ${unit}${r !== 1 ? "s" : ""}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateNarrative(
  user: CaseFields,
  ctx: NarrativeJourneyContext = {}
): CaseNarrative {
  const caseTypeId = ctx.caseTypeId ?? "I130_USC_NBC";
  const effective = deriveEffectiveFilingDate(user, ctx);
  const stage = detectStage(user, ctx);
  const estimate = estimateLabel(user, stage, effective, caseTypeId, ctx);
  const policyAlert = buildPolicyAlert(stage);

  const filingMethod =
    (user.filing_method as string | undefined) ||
    (ctx.metadata?.filingMethod as string | undefined) ||
    "online";
  const uscisAccountReady =
    ctx.metadata?.uscisAccountReady === true || ctx.metadata?.uscisAccountReady === "true";
  const filingMethodNextStep =
    filingMethod === "paper"
      ? "prepare your package and mail it to the correct USCIS lockbox"
      : "submit your petition through your USCIS account";

  switch (stage) {
    // ─────────────────────────────────────────────────────────────────────────
    // PRE_FILING
    // ─────────────────────────────────────────────────────────────────────────
    case "PRE_FILING":
      if (filingMethod === "online" && uscisAccountReady) {
        return {
          stage,
          policyAlert: null,
          headline: "Your USCIS account is set up — almost ready to file.",
          why: "You're close to submitting your I-130. Finish the remaining prep steps and you can file directly from your USCIS account.",
          action: "Pick up where you left off in Chapter 1 and submit when everything is ready.",
          estimate: null,
          badge: "Pre-filing",
        };
      }
      return {
        stage,
        policyAlert: null,
        headline: "Your journey starts here — filing the I-130 petition.",
        why:
          `Chapter 1 walks you through everything you need to get your petition ready and submitted. ` +
          `You're working toward ${filingMethodNextStep}.`,
        action: "Open Chapter 1 and continue from where you left off.",
        estimate: null,
        badge: null,
      };

    // ─────────────────────────────────────────────────────────────────────────
    // FILED — petition submitted, waiting for NOA1
    // ─────────────────────────────────────────────────────────────────────────
    case "FILED": {
      const elapsed =
        !effective.isApprox && effective.date ? monthsAgoRounded(effective.date, false) : null;

      return {
        stage,
        policyAlert: null,
        headline:
          elapsed !== null && elapsed > 0
            ? `I-130 filed — ${pl(elapsed, "month")} in and waiting for your receipt notice.`
            : "I-130 filed — waiting for your USCIS receipt notice.",
        why:
          "USCIS typically sends a receipt notice (NOA1) within 2–4 weeks of receiving your petition. " +
          "It'll have your official case number on it, which is what you need to start tracking your case.",
        action:
          "Keep an eye on the mail and your USCIS online account. When the receipt notice arrives, save the receipt number in your roadmap.",
        estimate,
        badge: "Waiting for NOA1",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOA1 / ACTIVE_REVIEW
    // ─────────────────────────────────────────────────────────────────────────
    case "NOA1":
    case "ACTIVE_REVIEW": {
      const hasReceiptNumber = Boolean(user.receipt_number);
      const hasReceiptDate = Boolean(getReceiptNoticeDate(ctx));
      const hasRealFilingDate = isMeaningfulDate(user.i130_submitted);

      const elapsed = effective.date ? monthsAgoRounded(effective.date, effective.isApprox) : null;

      // ── Sub-case A: receipt number only, no dates ─────────────────────────
      if (hasReceiptNumber && !hasReceiptDate && !hasRealFilingDate) {
        return {
          stage,
          policyAlert: null,
          headline: "Receipt number saved — your case is with USCIS.",
          why:
            "You can check your case status anytime at egov.uscis.gov using your receipt number. " +
            "For Pakistan cases at the National Benefits Center, the typical USCIS review window is 12–16 months from filing.",
          action:
            "Check case status on egov.uscis.gov and keep your USCIS account notifications turned on so you don't miss any updates.",
          estimate: null,
          badge: "With USCIS",
        };
      }

      // ── Sub-case B: date unreliable (null elapsed) ────────────────────────
      // This happens when the NOA1 date was just entered and the derived
      // approximate filing date is too recent to be meaningful.
      if (elapsed === null) {
        return {
          stage,
          policyAlert: null,
          headline: "Your I-130 is with USCIS — review takes 12–16 months for Pakistan cases.",
          why:
            "USCIS is working through your petition at the National Benefits Center. " +
            "Pakistan cases typically see approval in the 12–16 month window after filing. " +
            "There's nothing to do right now except stay on top of your case status.",
          action:
            "Check egov.uscis.gov occasionally and make sure your USCIS account email is current — that's where any notices will land.",
          estimate: null,
          badge: "With USCIS",
        };
      }

      // ── Sub-case C: receipt notice date but no real filing date ───────────
      if (!hasRealFilingDate && hasReceiptDate) {
        const noticeDate = getReceiptNoticeDate(ctx)!;
        const monthsSinceNoa1 = monthsAgoRounded(noticeDate, false) ?? 1;
        return {
          stage,
          policyAlert: null,
          headline: `Receipt notice was ${pl(monthsSinceNoa1, "month")} ago — USCIS is reviewing your petition.`,
          why:
            `Pakistan cases at the National Benefits Center typically receive USCIS approval 12–16 months after filing. ` +
            `Your receipt notice was ${pl(monthsSinceNoa1, "month")} ago, so you're moving through that window.`,
          action:
            "Keep checking egov.uscis.gov and make sure your contact details in your USCIS account are up to date.",
          estimate,
          badge: "With USCIS",
        };
      }

      // ── Sub-case D: real filing date, reliable elapsed ────────────────────
      const approxNote = effective.isApprox ? " (estimated)" : "";
      let headline: string,
        why: string,
        action: string | null = null,
        badge: string;

      if (elapsed < USCIS_TIERS.typical.min) {
        headline = `${pl(elapsed, "month")} in${approxNote} — USCIS is working through your petition.`;
        why =
          `Pakistan I-130 cases at the National Benefits Center typically reach approval ` +
          `between months ${USCIS_TIERS.typical.min} and ${USCIS_TIERS.typical.max}. ` +
          `At ${elapsed} ${elapsed === 1 ? "month" : "months"} in, you're right in the normal waiting period — nothing to worry about.`;
        badge = "With USCIS";
      } else if (elapsed <= USCIS_TIERS.typical.max) {
        headline = `${pl(elapsed, "month")} in${approxNote} — you're right in the typical approval window.`;
        why =
          `Most Pakistan NBC cases get USCIS approval between months ` +
          `${USCIS_TIERS.typical.min} and ${USCIS_TIERS.typical.max}. ` +
          `At ${elapsed} months, your approval notice could arrive any time now.`;
        badge = "Approval expected soon";
      } else if (elapsed <= USCIS_TIERS.slowButCommon.max) {
        const pastTypical = elapsed - USCIS_TIERS.typical.max;
        headline = `${pl(elapsed, "month")} in${approxNote} — running a little longer than typical, but that's common.`;
        why =
          `The typical window for Pakistan cases is 12–16 months, but delays in the 16–20 month range ` +
          `happen regularly and usually come down to caseload spikes, service-center transfers, or an RFE — ` +
          `none of which mean anything is wrong with your petition. ` +
          (elapsed >= 18
            ? `At ${elapsed} months, you're entitled to submit a formal case inquiry through USCIS if you'd like a status update.`
            : `Once you cross 18 months, you can submit a formal case inquiry through USCIS.`);
        action =
          elapsed >= 18
            ? "Submit a case inquiry at egov.uscis.gov/e-request — you're entitled to a response at this stage."
            : "Keep an eye on your USCIS account and make sure your contact details are current.";
        badge = "Running a bit longer than typical";
      } else {
        headline = `${pl(elapsed, "month")} in${approxNote} — taking longer than usual, but your case is still moving.`;
        ((why = ""),
          `At ${elapsed} months, you've gone past the typical Pakistan NBC range (12–16 months). ` +
            `Cases that run this long usually involve an RFE, a service-center transfer, or a name/security check — ` +
            `all routine parts of the process, not signs that anything is wrong. ` +
            `You've been able to submit a formal case inquiry since month 18, and that's a reasonable step to take now.`);
        action =
          "Submit a formal case inquiry at egov.uscis.gov/e-request — it's a normal, available step that can help surface where things stand. " +
          "If you'd like a second opinion on your situation, booking a consultation is an option.";
        badge = "Taking longer than usual";
      }

      return { stage, policyAlert: null, headline, why, action, estimate, badge };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPROVED — NOA2 issued, case transferring to NVC
    // ─────────────────────────────────────────────────────────────────────────
    case "APPROVED": {
      const approvalDate = getFromCaseData(ctx, ["approved_date", "approvalDate"]);
      const weeksAgo = approvalDate ? weeksAgoRounded(approvalDate) : null;

      const timeStr =
        weeksAgo === null
          ? ""
          : weeksAgo === 0
            ? " — just approved"
            : weeksAgo === 1
              ? " — 1 week ago"
              : ` — ${weeksAgo} weeks ago`;

      return {
        stage,
        policyAlert: null,
        headline: `I-130 approved by USCIS${timeStr} — great milestone.`,
        why:
          "USCIS is transferring your approved petition to the National Visa Center (NVC), which usually takes 2–6 weeks. " +
          "NVC will send you a welcome letter with your NVC case number and invoice ID — it goes to both email and physical mail, " +
          "so watch both. That letter is what unlocks Chapter 2.",
        action:
          "Watch your email and mailbox for the NVC welcome letter. As soon as it arrives, save your NVC case number and invoice ID in your roadmap.",
        estimate,
        badge: "Approved — on the way to NVC",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NVC_RECEIVED — case at NVC, working through Chapter 2
    // ─────────────────────────────────────────────────────────────────────────
    case "NVC_RECEIVED": {
      const hasNvcDate = Boolean(getFromCaseData(ctx, ["nvc_received_date", "nvcReceivedDate"]));
      const hasNvcIdentifier = Boolean(user.nvc_case_number || user.nvc_invoice_id);

      if (hasNvcIdentifier && !hasNvcDate) {
        return {
          stage,
          policyAlert: null,
          headline: "Case is at NVC — working through the paperwork steps.",
          why:
            "Log into CEAC (ceac.state.gov) with your NVC case number to see exactly where things stand. " +
            "NVC is the gateway between USCIS approval and your Islamabad interview. " +
            "Fees, DS-260, and civil documents typically move through in about 2–3 months when you stay on top of each step.",
          action:
            "Chapter 2 walks you through each NVC step in order. Keep moving — every week you save here is a week closer to your interview.",
          estimate,
          badge: "At NVC",
        };
      }

      return {
        stage,
        policyAlert: null,
        headline: "Case is at NVC — you're into Chapter 2 now.",
        why:
          "NVC handles the paperwork between your USCIS approval and your Islamabad interview. " +
          "Fees, DS-260, and civil documents usually take about 2–3 months when you keep moving through each step. " +
          "Every week of delay here delays your interview by roughly the same amount, so it's worth staying on top of.",
        action:
          "Work through the NVC steps in Chapter 2 — start with CEAC access and pay your fees as soon as the case is ready.",
        estimate,
        badge: "At NVC",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FEES_PAID — fees recorded, DS-260 unlocking
    // ─────────────────────────────────────────────────────────────────────────
    case "FEES_PAID":
      return {
        stage,
        policyAlert: null,
        headline: "NVC fees paid — DS-260 should unlock in CEAC within a couple of days.",
        why:
          "The DS-260 is your formal immigrant visa application — it's one of the most important forms in this process. " +
          "Use the time while it unlocks to start pulling together your civil documents too, " +
          "rather than waiting until the DS-260 is done.",
        action:
          "As soon as the DS-260 unlocks in CEAC, start filling it in. Run the DS-260 and civil-document steps in Chapter 2 in parallel.",
        estimate,
        badge: "At NVC",
      };

    // ─────────────────────────────────────────────────────────────────────────
    // DS260_SUBMITTED — DS-260 in, uploading civil docs
    // ─────────────────────────────────────────────────────────────────────────
    case "DS260_SUBMITTED": {
      const wks = isMeaningfulDate(user.ds260_submitted)
        ? weeksAgoRounded(user.ds260_submitted)
        : null;
      const elapsedStr = wks !== null && wks > 0 ? ` — ${pl(wks, "week")} ago` : "";
      return {
        stage,
        policyAlert: null,
        headline: `DS-260 submitted${elapsedStr} — time to get your civil documents uploaded.`,
        why:
          "Rejected documents are the most common source of NVC delays for Pakistan cases. " +
          "Police clearances are needed for every city you've lived in for 6+ months since age 16 — not just your current city. " +
          "Upload what you have now and keep adding as the rest come in — you don't need everything ready at once.",
        action:
          "Upload to CEAC: Nikah Nama with certified English translation, NADRA MRC, police clearances from all qualifying cities, and birth certificate.",
        estimate,
        badge: "At NVC",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOCS_SUBMITTED — docs uploaded, waiting for DQ
    // ─────────────────────────────────────────────────────────────────────────
    case "DOCS_SUBMITTED":
      return {
        stage,
        policyAlert: null,
        headline: "Civil documents submitted — NVC is reviewing for Documentary Qualification.",
        why:
          "Documentary Qualification (DQ) is the green light that gets your case into the Islamabad interview queue. " +
          "When documents are accepted first time, DQ can follow within days of NVC completing their review. " +
          "If they send a checklist (a document was rejected or something's missing), resubmit the same day — each round adds 2–4 weeks.",
        action:
          "Check CEAC every few days. If a checklist comes through, deal with it immediately.",
        estimate,
        badge: "Waiting for DQ",
      };

    // ─────────────────────────────────────────────────────────────────────────
    // DQ — Documentarily Qualified (pause-aware)
    //
    // FIX (v6.3): no duplicate case, why: context, dqElapsedStr display,
    // unclamped dqMo for queue math, headline uses dqElapsedStr.
    // ─────────────────────────────────────────────────────────────────────────
    case "DQ": {
      const consulate = getConsulateForCaseType(caseTypeId);
      const hasDqDate = isMeaningfulDate(user.dq_date);

      // Unclamped float for queue math comparisons
      const dqRawMonths = hasDqDate
        ? (Date.now() - new Date(user.dq_date!).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        : 0;
      // Unclamped rounded months for queue math — NOT clamped to 1
      const dqMo = Math.round(dqRawMonths);
      // Human-readable elapsed string for display only
      const dqElapsedStr = hasDqDate ? dqElapsed(user.dq_date!) : "";

      const queueTypical = consulate.postDQTypical;
      const holdActive = stageAffectedByPolicy("DQ");

      let context: string, badge: string;

      if (holdActive) {
        context = hasDqDate
          ? `You reached Documentary Qualification ${dqElapsedStr} ago — that's a real milestone and your paperwork is complete. ` +
            `Under normal circumstances, Islamabad schedules interviews about ${pl(queueTypical, "month")} after DQ. ` +
            `Right now, NVC is holding DQ'd Pakistan cases rather than forwarding them to the embassy while a policy pause is in place. ` +
            `Your place in the queue is preserved — this is a temporary hold, not an issue with your case.`
          : `Documentary Qualification means your paperwork is complete — that's a real milestone. ` +
            `Normally, Islamabad schedules interviews about ${pl(queueTypical, "month")} after DQ, ` +
            `but NVC is currently holding Pakistan cases at this stage while a policy pause is in place. ` +
            `Your position is preserved and this has nothing to do with your individual case.`;
        badge = "DQ — scheduling paused";
      } else if (!hasDqDate) {
        context =
          `Islamabad is currently scheduling cases about ${pl(queueTypical, "month")} after DQ. ` +
          `Save your DQ date in your roadmap to track where you are in the queue.`;
        badge = "In Islamabad queue";
      } else if (dqMo < queueTypical - 1) {
        context =
          `Islamabad is scheduling cases about ${pl(queueTypical, "month")} after DQ. ` +
          `You're ${dqElapsedStr} in — your interview notice should arrive within the next ${pl(queueTypical - dqMo, "month")} or so.`;
        badge = "In Islamabad queue";
      } else if (dqMo <= queueTypical + 2) {
        context =
          `At ${dqElapsedStr} since DQ, you're right at the current Islamabad typical (~${queueTypical} months). ` +
          `Interview notices are going out for cases around your DQ date.`;
        badge = "Interview notice coming";
      } else {
        const past = dqMo - queueTypical;
        context =
          `You've been waiting ${dqElapsedStr} since DQ — ${pl(past, "month")} longer than the current typical, ` +
          `which is common when embassy volume is higher than usual. Islamabad also handles Afghanistan cases, ` +
          `which adds to the queue. Your place is preserved — no action needed beyond monitoring CEAC and your registered email.`;
        badge = "Queue taking a little longer";
      }

      return {
        stage,
        policyAlert,
        headline: hasDqDate
          ? `Documentarily qualified ${dqElapsedStr} ago — ${holdActive ? "waiting for scheduling to resume" : "in the Islamabad interview queue"}.`
          : `Documentarily qualified — ${holdActive ? "waiting for scheduling to resume" : "in the Islamabad interview queue"}.`,
        why: context,
        action: holdActive
          ? "Use this time well — book your medical exam if you haven't already (it's valid for 2 years, so there's no downside to doing it early) " +
            "and make sure your interview document packet is ready to go. " +
            "Keep an eye on pk.usembassy.gov for updates on when scheduling resumes."
          : "If you haven't booked your medical exam yet, do it now — slots fill up and it must be done before the interview. " +
            "Approved panel physicians include AMC Islamabad, IOM Islamabad, and Wilcare Lahore.",
        estimate,
        badge,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERVIEW_WAIT (pause-aware)
    //
    // FIX (v6.3): same elapsed fix as DQ — uses dqElapsed(), unclamped dqMo.
    // ─────────────────────────────────────────────────────────────────────────
    case "INTERVIEW_WAIT": {
      const consulate = getConsulateForCaseType(caseTypeId);
      const hasDqDate = isMeaningfulDate(user.dq_date);

      const dqRawMonths = hasDqDate
        ? (Date.now() - new Date(user.dq_date!).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        : 0;
      void dqRawMonths; // used in parent scope for queue math if needed
      const dqElapsedStr = hasDqDate ? dqElapsed(user.dq_date!) : "";
      const holdActive = stageAffectedByPolicy("INTERVIEW_WAIT");

      return {
        stage,
        policyAlert,
        headline: hasDqDate
          ? `In the Islamabad queue — ${dqElapsedStr} since DQ${holdActive ? " (scheduling currently paused)" : ""}.`
          : `In the Islamabad queue${holdActive ? " — scheduling currently paused" : " — interview date coming"}.`,
        why: holdActive
          ? `Islamabad normally schedules interviews about ${pl(consulate.postDQTypical, "month")} after DQ. ` +
            `A policy pause means NVC is holding cases rather than forwarding them to the embassy right now — ` +
            `your place in the queue is preserved and your case is in good order. ` +
            `This is a temporary situation and doesn't reflect anything about your individual file.`
          : `Islamabad is scheduling interviews about ${pl(consulate.postDQTypical, "month")} after DQ. ` +
            `Interview notices go out in batches — you'll get an email and see a CEAC update when your date is assigned.`,
        action: holdActive
          ? "This is a good time to get ahead on interview prep — book your medical exam now if you haven't (it's valid 2 years) " +
            "and get your interview document packet organised so you're ready the moment scheduling opens back up. " +
            "Monitor pk.usembassy.gov for pause updates."
          : "Book your medical exam if you haven't already — it needs to be done before your interview. Chapter 3 covers exactly what to do.",
        estimate,
        badge: holdActive ? "Queue paused — your place is held" : "In Islamabad queue",
      };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // MEDICAL_SCHEDULED
    // ─────────────────────────────────────────────────────────────────────────
    case "MEDICAL_SCHEDULED": {
      const intDate = isMeaningfulDate(user.interview_date) ? fmtDate(user.interview_date) : null;
      const days = isMeaningfulDate(user.interview_date) ? daysUntil(user.interview_date) : null;
      return {
        stage,
        policyAlert,
        headline: intDate
          ? `Medical exam booked — interview on ${intDate} (${pl(days!, "day")} away).`
          : "Medical exam booked — interview date will follow from NVC.",
        why:
          "Your medical report is valid for 2 years from the exam date. " +
          "The physician will hand you a sealed envelope — do not open it under any circumstances. " +
          "You'll present it sealed directly to the consular officer at your interview.",
        action:
          "Start building your interview packet now: passport, two passport photos, police clearances, Nikah Nama, birth certificate, and the sealed medical envelope. " +
          "Chapter 3 has the full checklist.",
        estimate,
        badge: intDate ? `Interview in ${pl(days!, "day")}` : "Interview coming",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEDICAL_ATTENDED
    // ─────────────────────────────────────────────────────────────────────────
    case "MEDICAL_ATTENDED": {
      const intDate = isMeaningfulDate(user.interview_date) ? fmtDate(user.interview_date) : null;
      const days = isMeaningfulDate(user.interview_date) ? daysUntil(user.interview_date) : null;
      return {
        stage,
        policyAlert,
        headline: intDate
          ? `Medical done — Islamabad interview on ${intDate}, ${pl(days!, "day")} away.`
          : "Medical exam done — waiting for your Islamabad interview date.",
        why:
          "Keep the sealed medical envelope as-is — it goes directly to the consular officer. " +
          "Opening it voids your medical clearance and means redoing the exam.",
        action:
          "Final checklist before your interview: original passport, Nikah Nama, CNIC, police clearances (all qualifying cities), birth certificate, sealed medical envelope, and two 2×2 passport photos.",
        estimate: null,
        badge: days !== null ? `Interview in ${pl(days, "day")}` : "Interview coming",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERVIEW_SCHEDULED — date assigned (pause-aware)
    // ─────────────────────────────────────────────────────────────────────────
    case "INTERVIEW_SCHEDULED": {
      const days = isMeaningfulDate(user.interview_date) ? daysUntil(user.interview_date) : null;
      const pauseActive = POLICY_FLAGS.PAKISTAN_IV_PAUSE?.active ?? false;

      return {
        stage,
        policyAlert,
        headline: isMeaningfulDate(user.interview_date)
          ? `Islamabad interview on ${fmtDate(user.interview_date)} — ${pl(days!, "day")} away.`
          : "Islamabad interview date assigned — getting ready.",
        why: pauseActive
          ? "Two things worth knowing right now. First, some Islamabad interviews scheduled after January 21, 2026 " +
            "have been cancelled — it's worth confirming yours is still on via CEAC or by contacting the embassy directly. " +
            "Second, even if your interview goes smoothly, cases are being placed into Administrative Processing rather than " +
            "receiving a visa stamp on the day — that's a policy situation, not anything to do with your case."
          : "After a successful interview, visa issuance usually takes 1–2 weeks. " +
            "Some Pakistan cases do go into Administrative Processing (221g) after the interview, which has no fixed timeline, " +
            "but the majority resolve within a few months.",
        action: pauseActive
          ? "First, confirm your interview is still scheduled — check CEAC or contact the embassy. " +
            "Either way, prepare fully: bring all originals — passport, Nikah Nama, CNIC, police clearances " +
            "(all qualifying cities), birth certificate, sealed medical envelope (do not open), and two passport photos. " +
            "Chapter 3 has the full checklist."
          : "Bring all originals: passport, Nikah Nama, CNIC, police clearances (all qualifying cities), " +
            "birth certificate, sealed medical envelope (do not open), and two passport photos. Chapter 3 has the full checklist.",
        estimate: null,
        badge:
          days !== null
            ? pauseActive
              ? `Interview in ${pl(days, "day")} — confirm it's still on`
              : `Interview in ${pl(days, "day")}`
            : "Interview scheduled",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERVIEW_ATTENDED — waiting for decision (pause-aware, AP-aware)
    // ─────────────────────────────────────────────────────────────────────────
    case "INTERVIEW_ATTENDED": {
      const pauseActive = POLICY_FLAGS.PAKISTAN_IV_PAUSE?.active ?? false;
      const hasApSlip = isMeaningfulDate(user.ap_slip_received_date) && user.ap_reason_category;

      if (pauseActive) {
        return {
          stage,
          policyAlert,
          headline: "Interview done — waiting for a decision.",
          why:
            "Even when an interview goes well, the U.S. Department of State is currently placing Pakistani applicant cases " +
            "into Administrative Processing rather than issuing visas while a policy pause is in effect. " +
            "This applies to everyone right now — it's not a reflection of your case or your interview. " +
            "Monitor pk.usembassy.gov for updates on when visa issuance resumes.",
          action:
            "If you received a 221(g) requesting additional documents, get those uploaded immediately — " +
            "responding now means you'll be ready the moment things open back up. " +
            "Keep an eye on pk.usembassy.gov and CEAC for any changes.",
          estimate: null,
          badge: "AP — policy pause in effect",
        };
      }

      if (hasApSlip) {
        const weeksWaiting = weeksAgoRounded(user.ap_slip_received_date!);
        const guidance = getAPResolutionGuidance(user.ap_reason_category!);

        let context: string, badge: string, action: string;

        if (weeksWaiting < AP_ESCALATION_THRESHOLDS.normalWeeks) {
          context =
            `Your case is in Administrative Processing (221g). ${guidance.description} ` +
            `You're ${pl(weeksWaiting, "week")} in — that's well within the early normal window, nothing to be concerned about.`;
          badge = "AP — in progress";
          action =
            "If the embassy requested any additional documents, get those in as quickly as you can — " +
            "that's the single biggest factor in how quickly AP resolves.";
        } else if (weeksWaiting <= AP_ESCALATION_THRESHOLDS.typicalMaxWeeks) {
          context =
            `Your case has been in Administrative Processing for ${pl(weeksWaiting, "week")}. ` +
            `That's right in line with the typical duration — the average across all 221(g) cases is around 4 months. ` +
            `There's nothing unusual about where things stand.`;
          badge = "AP — normal duration";
          action =
            "Keep checking CEAC and your email. If you haven't responded to any document requests yet, do that straight away.";
        } else if (weeksWaiting <= AP_ESCALATION_THRESHOLDS.extendedMaxWeeks) {
          context =
            `Your case has been in Administrative Processing for ${pl(weeksWaiting, "week")} — ` +
            `longer than average, but extended AP is genuinely common for Pakistan cases involving additional security review. ` +
            `${guidance.description}`;
          badge = "AP — extended (not unusual)";
          action =
            "Keep monitoring CEAC. If you haven't submitted a status inquiry yet, " +
            "NVC's public inquiry form is a reasonable next step — though responses rarely include a specific timeline.";
        } else {
          context =
            `Your case has been in Administrative Processing for ${pl(weeksWaiting, "week")} — ` +
            `well into the range associated with Security Advisory Opinion (SAO) review, which can run 12–18 months. ` +
            `This is a recognised category of delay, not a sign that something has gone wrong. ` +
            (weeksWaiting >= AP_ESCALATION_THRESHOLDS.mandamusConsiderationWeeks
              ? `At this duration, it may be worth getting a consultation to talk through what options exist — there's no guaranteed fix, but it can help to have someone review your specific situation.`
              : `If you reach the 18-month mark without a resolution, getting a consultation to talk through your options is something to consider.`);
          badge = "AP — extended (SAO range)";
          action =
            weeksWaiting >= AP_ESCALATION_THRESHOLDS.mandamusConsiderationWeeks
              ? "At this stage it may be worth booking a consultation to talk through your options — there's no guaranteed path to speed things up, but having a second set of eyes on your case can help you figure out if there's anything worth pursuing. Keep monitoring CEAC in the meantime."
              : "Keep monitoring CEAC. There's no action that reliably speeds up an SAO-stage review beyond responding quickly to any requests.";
        }

        return {
          stage,
          policyAlert,
          headline: "Interview done — case is in Administrative Processing.",
          why: "",
          action,
          estimate: null,
          badge,
        };
      }

      return {
        stage,
        policyAlert,
        headline: "Interview done — waiting for a decision.",
        why:
          "Without a 221(g) hold, visas are typically issued within 1–2 weeks of the interview. " +
          "If your case does go into Administrative Processing, most resolve within a couple of months — " +
          "check CEAC for any status changes.",
        action:
          "Monitor CEAC and your registered email. If you received a 221(g) notice, upload whatever's requested the same day " +
          "— and consider recording the slip type in your roadmap for more specific guidance on what to expect.",
        estimate: null,
        badge: "Awaiting decision",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERVIEW_OUTCOME — outcome recorded (pause-aware, AP-aware)
    // ─────────────────────────────────────────────────────────────────────────
    case "INTERVIEW_OUTCOME": {
      const pauseActive = POLICY_FLAGS.PAKISTAN_IV_PAUSE?.active ?? false;
      const hasApSlip = isMeaningfulDate(user.ap_slip_received_date) && user.ap_reason_category;

      // FIX (v6.3): read outcome string written by IR1TickerProps v4.
      // caseData.interviewOutcome = "approved" | "221g" | "refused" | null
      const outcomeStr =
        (getCaseData(ctx).interviewOutcome as string | null) ??
        (getCaseData(ctx).interview_outcome_str as string | null) ??
        null;

      const isApproved = outcomeStr === "approved";
      const is221g = outcomeStr === "221g";
      const isRefused = outcomeStr === "refused";

      // ── Branch A: approved outcome ────────────────────────────────────────
      // Show clean approved copy regardless of pause status.
      // The pause affects visa ISSUANCE (stamping/courier), not approval itself.
      // We mention the pause only as a brief note so users know their passport
      // courier may be delayed — not as the headline message.
      if (isApproved) {
        return {
          stage,
          policyAlert: null, // suppress the generic pause alert for approved cases
          headline: "Interview approved — visa issuance in progress.",
          why: pauseActive
            ? "Your interview was approved. Under normal circumstances the visa packet is " +
              "couriered within 1–2 weeks of approval. Right now, the Department of State has " +
              "a temporary pause on immigrant visa issuances for Pakistani nationals — your " +
              "case is fully approved and in the queue, just waiting for that pause to lift."
            : "Your interview was approved. The visa packet is typically couriered within " +
              "1–2 weeks of approval. Watch CEAC and your registered email for the issuance notice.",
          action: pauseActive
            ? "Monitor pk.usembassy.gov and CEAC for updates on when visa issuance resumes. " +
              "Make sure your delivery address in the courier portal is correct so there are no delays once things open up."
            : "Keep an eye on CEAC and your email. Once issued, you'll receive a courier tracking number. " +
              "Do not open the sealed visa packet — hand it to CBP at your port of entry.",
          estimate: null,
          badge: pauseActive ? "Approved — awaiting issuance" : "Visa being issued",
        };
      }

      // ── Branch B: pause active + not approved ─────────────────────────────
      // Show pause message for 221g / refused / unknown outcome cases.
      if (pauseActive && !isApproved) {
        // 221g packet submission state — read from caseData written by IR1TickerProps v5
        const packetSubmittedDate =
          (getCaseData(ctx).respond221gDate as string | null) ??
          (getCaseData(ctx).response221gDate as string | null) ??
          null;
        const packetSubmitted = isMeaningfulDate(packetSubmittedDate);
        const daysSinceSubmission = packetSubmitted
          ? Math.floor(
              (Date.now() - new Date(packetSubmittedDate!).getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;
        const submissionMethod = (getCaseData(ctx).response221gMethod as string | null) ?? null;
        const submissionMethodLabel = submissionMethod ? submissionMethod.replace(/_/g, " ") : null;

        const get221gWhy = () => {
          if (!packetSubmitted) {
            return (
              "A 221(g) means your case is still active — it's a request for additional review or " +
              "documents, not a final denial. The most important thing you can do right now is respond " +
              "to whatever the officer requested as quickly as possible. " +
              "Separately, there's a temporary pause on immigrant visa issuances for Pakistani nationals " +
              "— this affects everyone at this stage, so your case isn't being singled out. " +
              "Responding promptly means you'll be at the front of the queue when things resume."
            );
          }
          if (daysSinceSubmission! < 10) {
            return (
              `Your 221(g) response packet was submitted ${daysSinceSubmission === 0 ? "today" : `${daysSinceSubmission} day${daysSinceSubmission === 1 ? "" : "s"} ago`}` +
              (submissionMethodLabel ? ` via ${submissionMethodLabel}` : "") +
              ". The embassy typically needs at least 10 business days to process a response — " +
              "there's nothing more to do right now except wait. " +
              "There's also a temporary pause on immigrant visa issuances for Pakistani nationals, " +
              "which affects all cases at this stage."
            );
          }
          return (
            `Your 221(g) response packet was submitted ${daysSinceSubmission} days ago` +
            (submissionMethodLabel ? ` via ${submissionMethodLabel}` : "") +
            ". At this point it's reasonable to check CEAC for any status change. " +
            "If there's been no update, a polite status inquiry to the embassy is a reasonable next step — " +
            "it won't speed things up but it confirms your packet was received. " +
            "The temporary pause on Pakistani immigrant visas may also be a factor in the delay."
          );
        };

        const get221gAction = () => {
          if (!packetSubmitted) {
            return (
              "Continue in Chapter 3 — the next steps walk you through exactly what to submit and how. " +
              "Use the 221(g) Action Plan tool to build your response checklist."
            );
          }
          if (daysSinceSubmission! < 10) {
            return "Check CEAC in a few days for any status update. No further action needed right now.";
          }
          return (
            "Check CEAC for any status change. If nothing has moved, consider sending a brief " +
            "status inquiry to the embassy — keep it factual: your case number, submission date, " +
            "and a request for confirmation that your packet was received."
          );
        };

        const get221gBadge = () => {
          if (!packetSubmitted) return "221(g) — respond now";
          if (daysSinceSubmission! < 10) return "221(g) — packet submitted, allow time";
          return "221(g) — consider status inquiry";
        };

        return {
          stage,
          policyAlert,
          headline: is221g
            ? packetSubmitted
              ? "221(g) packet submitted — monitoring for a response."
              : "221(g) recorded — your next move matters most right now."
            : isRefused
              ? "Interview outcome recorded — review your written notice."
              : "Interview outcome recorded — visa issuance on hold.",
          why: is221g
            ? get221gWhy()
            : isRefused
              ? "Your written notice from the officer will state whether this is a 221(g) request " +
                "(case still active — you can submit the requested documents) or a final denial " +
                "under a specific INA ground. These two situations require completely different responses. " +
                "Read the notice carefully before taking any action."
              : "Your interview is done and the outcome is on file, but the U.S. Department of State " +
                "has paused immigrant visa issuances for Pakistani nationals while a policy review is in place. " +
                "Your case is ready — it's just waiting for that pause to lift. " +
                "Keep an eye on pk.usembassy.gov for the latest.",
          action: is221g
            ? get221gAction()
            : isRefused
              ? "Read your written refusal notice carefully. If it is a 221(g), gather the " +
                "requested items and submit them as directed. If it is a final denial, consider " +
                "consulting an immigration attorney before taking any next steps."
              : "If there are any outstanding document requests, respond to those immediately. " +
                "Monitor pk.usembassy.gov and CEAC for updates.",
          estimate: null,
          badge: is221g
            ? get221gBadge()
            : isRefused
              ? "Refused — review your notice"
              : "Outcome on file — waiting for pause to lift",
        };
      }

      // ── Branch C: 221g AP tracking (no pause / pause not active) ─────────
      if (hasApSlip) {
        const weeksWaiting = weeksAgoRounded(user.ap_slip_received_date!);
        const guidance = getAPResolutionGuidance(user.ap_reason_category!);

        let badge: string;

        if (weeksWaiting < AP_ESCALATION_THRESHOLDS.normalWeeks) {
          badge = "AP — in progress";
        } else if (weeksWaiting <= AP_ESCALATION_THRESHOLDS.typicalMaxWeeks) {
          badge = "AP — normal duration";
        } else if (weeksWaiting <= AP_ESCALATION_THRESHOLDS.extendedMaxWeeks) {
          badge = "AP — extended (not unusual)";
        } else {
          badge = "AP — extended (SAO range)";
        }

        return {
          stage,
          policyAlert,
          headline: "Interview outcome recorded — case in Administrative Processing.",
          why: "",
          action:
            "Monitor CEAC and your email. Respond to any document requests straight away — that's the most impactful thing you can do.",
          estimate: null,
          badge,
        };
      }

      // ── Branch D: refused without AP slip / generic fallthrough ──────────
      if (isRefused) {
        return {
          stage,
          policyAlert: null,
          headline: "Interview outcome recorded — review your written notice.",
          why:
            "Your written notice from the officer will state whether this is a 221(g) request " +
            "(case still active) or a final denial. These require completely different responses — " +
            "read the notice carefully before taking any action.",
          action:
            "If it's a 221(g), gather the requested items and submit them as directed. " +
            "If it's a final denial, consider consulting an immigration attorney.",
          estimate: null,
          badge: "Refused — review your notice",
        };
      }

      // ── Branch E: generic (outcome string not set or unrecognised) ────────
      return {
        stage,
        policyAlert,
        headline: "Interview outcome recorded — visa on the way.",
        why:
          "If your interview was approved without a hold, the visa is usually issued within 1–2 weeks. " +
          "Check CEAC — if additional documents come up, upload them the same day.",
        action: "Watch CEAC and your email closely. Respond to anything that comes in immediately.",
        estimate: null,
        badge: "Awaiting visa issuance",
      };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // VISA_ISSUED
    // ─────────────────────────────────────────────────────────────────────────
    case "VISA_ISSUED": {
      const visaDate = user.visa_issued ?? getFromCaseData(ctx, ["visa_issued_date"]);
      const issuedBeforePause =
        isMeaningfulDate(visaDate) &&
        new Date(visaDate).getTime() < new Date("2026-01-21").getTime();

      return {
        stage,
        policyAlert: issuedBeforePause ? null : policyAlert,
        headline: "Visa issued — you're nearly there.",
        why:
          "Your sealed immigrant visa packet will be couriered to your registered address. " +
          "Present it unopened to U.S. Customs and Border Protection at your port of entry — opening it voids the packet.",
        action:
          "Don't open the visa packet. Hand it sealed to CBP at the port of entry. " +
          "Double-check that the delivery address in your courier portal is correct.",
        estimate: null,
        badge: "Visa issued ✓",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Exhaustive fallback
    // ─────────────────────────────────────────────────────────────────────────
    default: {
      const _: never = stage;
      void _;
      return {
        stage,
        policyAlert: null,
        headline: "Your case is in progress.",
        why: "Keep working through your steps — each one moves you closer to your interview.",
        action: null,
        estimate: null,
        badge: null,
      };
    }
  }
}
