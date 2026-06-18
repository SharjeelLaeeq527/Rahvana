// ─────────────────────────────────────────────────────────────────────────────
// IR1TickerProps.tsx — Correct prop mapping for DashboardView
//
// PROBLEMS FIXED (original):
//
//   1. journeyContext had NO caseTypeId.
//
//   2. journeyContext passed state.metadata as `metadata` but the narrative
//      engine looks for approved_date, nvc_received_date, fees_paid_date,
//      noa1_date, notice_date in ctx.caseData — not ctx.metadata.
//
//   3. CaseFields.i130_submitted used wrong metadata keys. Filing date was
//      ALWAYS null.
//
//   4. interview_date only used state.metadata?.interviewDate but the
//      admin-set interview date lives in trackingStatus.interview_date.
//
//   5. visa_interview_attended used state.metadata?.visaInterviewAttended
//      but the actual signal is step completion (step_3_8) in
//      state.completedSteps — not metadata.
//
//   6. medical_attended had no mapping from completedSteps (step_3_5).
//
//   7. NOA1 vs NOA2 date confusion:
//      RegisterReceiptStep saves NOA1 notice date to /api/receipt/journey.
//      ApprovalNoticeTool saves NOA2 approval date nested at
//      state.metadata.approvalDetails.approvalDate.
//      Old mapper looked for both in wrong places, so notice_date was always
//      null producing an endless "add your NOA1 notice date" prompt.
//
//      FIX: accepts optional `receiptRecord` (from fetchReceiptForJourney)
//      and maps receiptRecord.noticeDate → notice_date.
//      approved_date is read from meta.approvalDetails.approvalDate.
//
// ADDITIONAL FIX (v2) — Sub-case A race condition:
//
//   8. Race condition where DashboardView renders IR1Ticker before receipt
//      fetch resolves, triggering Sub-case A "add your receipt notice date"
//      even when the date IS saved.
//
//      Fix A — DashboardView should suppress the ticker while receiptRecord
//      is undefined (tri-state: undefined = loading, null = not found).
//      Fix B — caseData includes all NOA1 aliases.
//      Fix C — receiptNoticeDate checks trackingStatus admin keys too.
//
// ADDITIONAL FIX (v3) — docs_submitted_nvc / ds260_submitted:
//
//   9. "step-completed" sentinel fails isMeaningfulDate() in the engine.
//      Use todayStr() as proxy — passes isMeaningfulDate() and correctly
//      advances stage detection.
//
//  10. SubmissionReviewTool saves submissionSaved / submissionDate to metadata.
//      docs_submitted_nvc now reads those before falling back to step
//      completion.
//
// ADDITIONAL FIX (v4) — InterviewOutcomeTool + Respond221gTool wiring:
//
//  11. InterviewOutcomeTool saves interviewOutcome ("approved" | "221g" |
//      "refused") and outcome221gSubtype to metadata.
//      Previously interview_outcome in CaseFields was always null because
//      the mapper only read meta.interviewOutcomeDate (a date field that
//      almost nobody fills in) — so the INTERVIEW_OUTCOME stage never fired,
//      including the "visa approved" narrative.
//
//      FIX: interviewOutcomeDate now synthesises a proxy date when
//      meta.interviewOutcome is set but no explicit outcome date exists,
//      using interviewDate (or todayStr() as last resort) as the anchor.
//      This means:
//        - outcome "approved"  → INTERVIEW_OUTCOME fires → "visa on the way"
//        - outcome "221g"      → INTERVIEW_OUTCOME fires → AP branch
//        - outcome "refused"   → INTERVIEW_OUTCOME fires → generic outcome copy
//
//  12. Respond221gTool saves response221gDate and response221gMethod to
//      metadata. ap_slip_received_date now reads response221gDate as a
//      fallback so the AP escalation timer starts correctly.
//
//  13. ap_reason_category now also reads outcome221gSubtype saved by
//      InterviewOutcomeTool and maps the known subtype strings to the engine's
//      APReasonCategory values:
//        "docs_requested"  → "document_request"
//        "further_review"  → "security_check"
//        "security_check"  → "security_check"
//        "social_media"    → "social_media"
//        "name_check"      → "name_check"
//
//  14. visa_interview_attended date derivation broadened: now also fires when
//      meta.interviewOutcome is set (any recorded outcome implies the
//      interview happened) even if step_3_8 is not marked complete.
//
// HOW TO USE in DashboardView.tsx:
//
//   1. Add the imports:
//        import {
//          buildIR1TickerProps,
//          fetchReceiptForJourney,
//          type ReceiptRecord,
//        } from "./IR1TickerProps";
//
//   2. Fetch the receipt record with a tri-state to distinguish
//      "loading" from "loaded but empty":
//
//        const [receiptRecord, setReceiptRecord] = useState<
//          ReceiptRecord | null | undefined
//        >(undefined); // undefined = still loading
//
//        useEffect(() => {
//          let cancelled = false;
//          const journeyId = state.backendId;
//          if (!journeyId) { setReceiptRecord(null); return; }
//          fetchReceiptForJourney(journeyId).then(({ record }) => {
//            if (!cancelled) setReceiptRecord(record ?? null);
//          });
//          return () => { cancelled = true; };
//        }, [state.backendId]);
//
//   3. Guard the ticker render until the fetch resolves:
//
//        {receiptRecord !== undefined && (
//          <IR1Ticker
//            {...buildIR1TickerProps(
//              state, trackingStatus, nvcCaseNum, nvcInvoice,
//              uploadedDocuments, receiptRecord,
//            )}
//          />
//        )}
// ─────────────────────────────────────────────────────────────────────────────

import { CaseFields, NarrativeJourneyContext } from "@/lib/narrative/narrativeEngine";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

// ── 221(g) AP reason category — kept in sync with apTracking.config.ts ────────
export type APReasonCategory =
  | "document_request"
  | "security_check"
  | "social_media"
  | "name_check"
  | "unspecified";

// ── ReceiptRecord shape — kept in sync with lib/register-receipt.ts ───────────
export interface ReceiptRecord {
  receiptNumber: string;
  noticeDate: string | null;
  priorityDate: string | null;
  caseLabel: string | null;
  source: "manual" | "upload" | string;
  trackingEnabled: boolean;
  lastKnownStatus: string | null;
  lastCheckedAt: string | null;
  savedAt: string | null;
}

interface UploadedDoc {
  documentDefId?: string;
  id?: string;
  originalFilename?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local date helpers — mirrors narrativeEngine.ts (not exported from there)
// ─────────────────────────────────────────────────────────────────────────────

function isMeaningfulDate(value: string | null | undefined): value is string {
  if (!value) return false;
  const ts = new Date(value).getTime();
  return !Number.isNaN(ts) && new Date(ts).getUTCFullYear() >= 2000;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// mapOutcomeSubtypeToAPCategory
//
// InterviewOutcomeTool saves outcome221gSubtype using its own string values.
// Map those to the engine's APReasonCategory enum.
// ─────────────────────────────────────────────────────────────────────────────

function mapOutcomeSubtypeToAPCategory(
  subtype: string | null | undefined
): APReasonCategory | null {
  if (!subtype) return null;
  switch (subtype) {
    case "docs_requested":
      return "document_request";
    case "further_review":
      return "security_check";
    case "security_check":
      return "security_check";
    case "social_media":
      return "social_media";
    case "name_check":
      return "name_check";
    // Already-mapped values (in case metadata was set directly with engine values)
    case "document_request":
      return "document_request";
    case "unspecified":
      return "unspecified";
    default:
      return "unspecified";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchReceiptForJourney — shared fetch for the NOA1 receipt record.
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchReceiptForJourney(
  journeyId: string
): Promise<{ record: ReceiptRecord | null; error: string }> {
  console.log("DEBUG [fetchReceiptForJourney] CALLED with journeyId:", journeyId);

  try {
    const url = `/api/receipt/journey?journeyId=${encodeURIComponent(journeyId)}`;
    console.log("DEBUG [fetchReceiptForJourney] Fetching URL:", url);

    const res = await fetch(url);
    console.log("DEBUG [fetchReceiptForJourney] Response status:", res.status, "ok:", res.ok);

    let data: any;
    try {
      data = await res.json();
      console.log("DEBUG [fetchReceiptForJourney] Response body:", JSON.stringify(data));
    } catch (jsonErr) {
      console.error("DEBUG [fetchReceiptForJourney] Failed to parse JSON:", jsonErr);
      return { record: null, error: "JSON parse failed" };
    }

    if (!res.ok || data.error) {
      console.warn("DEBUG [fetchReceiptForJourney] Non-OK or data.error:", data.error);
      return { record: null, error: "Failed to fetch receipt record" };
    }

    const record: ReceiptRecord = {
      receiptNumber: data.receipt_number || data.receiptNumber || data.receipt_num || "",
      noticeDate: data.notice_date || data.noticeDate || data.noa1_date || data.noa1Date || null,
      priorityDate: data.priority_date || data.priorityDate || null,
      caseLabel: data.case_label || data.caseLabel || null,
      source: data.source || "manual",
      trackingEnabled: !!(data.tracking_enabled ?? data.trackingEnabled),
      lastKnownStatus: data.last_known_status || data.lastKnownStatus || null,
      lastCheckedAt: data.last_checked_at || data.lastCheckedAt || null,
      savedAt: data.saved_at || data.savedAt || null,
    };

    console.log("DEBUG [fetchReceiptForJourney] Parsed record:", JSON.stringify(record));
    return { record, error: "" };
  } catch (err) {
    console.error("DEBUG [fetchReceiptForJourney] Network/unexpected error:", err);
    return { record: null, error: "Network error while fetching receipt" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildIR1TickerProps — main export
// ─────────────────────────────────────────────────────────────────────────────

export function buildIR1TickerProps(
  state: WizardState,
  trackingStatus: Record<string, any>,
  nvcCaseNum: string | undefined,
  nvcInvoice: string | undefined,
  uploadedDocuments: UploadedDoc[],
  receiptRecord?: ReceiptRecord | null
): { user: CaseFields; journeyContext: NarrativeJourneyContext } {
  console.log("DEBUG [buildIR1TickerProps] Inputs:", {
    receiptRecord_type: typeof receiptRecord,
    receiptRecord_value:
      receiptRecord === undefined
        ? "UNDEFINED (still loading!)"
        : receiptRecord === null
          ? "NULL (loaded, not found)"
          : JSON.stringify(receiptRecord),
    receiptRecord_noticeDate: receiptRecord?.noticeDate ?? "(none)",
    trackingStatus_notice_date: trackingStatus?.notice_date ?? "(none)",
    metadataDate: state.metadata?.noticeDate ?? "(none)",
    interviewOutcome: state.metadata?.interviewOutcome ?? "(none)",
    outcome221gSubtype: state.metadata?.outcome221gSubtype ?? "(none)",
    response221gDate: state.metadata?.response221gDate ?? "(none)",
  });

  const meta = state.metadata ?? {};
  const completed = state.completedSteps;

  // ── Helper: check if a step is completed ─────────────────────────────────
  function stepDone(...stepKeys: string[]): boolean {
    if (!completed?.has) return false;
    return stepKeys.some((k) => completed.has(k));
  }

  // ── NOA1 receipt notice date ──────────────────────────────────────────────
  // Priority: receiptRecord.noticeDate → trackingStatus keys → meta keys
  const receiptNoticeDate: string | null =
    receiptRecord?.noticeDate ??
    (trackingStatus.notice_date as string | null) ??
    (trackingStatus.noticeDate as string | null) ??
    (trackingStatus.noa1_date as string | null) ??
    (trackingStatus.noa1Date as string | null) ??
    (trackingStatus.tracking_notice_date as string | null) ??
    (trackingStatus.receipt_notice_date as string | null) ??
    (meta.noa1Date as string | null) ??
    (meta.noa1_date as string | null) ??
    (meta.noticeDate as string | null) ??
    (meta.notice_date as string | null) ??
    null;

  // ── Filing date ───────────────────────────────────────────────────────────
  const filingDate: string | null =
    (meta.filedDate as string | null) ??
    (meta.filed_date as string | null) ??
    (meta.i130FiledDate as string | null) ??
    (meta.i130SubmittedDate as string | null) ??
    null;

  // ── Interview date ────────────────────────────────────────────────────────
  // Admin-set (trackingStatus) takes priority over user-recorded (metadata).
  const interviewDate: string | null =
    (trackingStatus.interview_date as string | null) ??
    (meta.interviewDate as string | null) ??
    (meta.interview_date as string | null) ??
    null;

  // ── Interview outcome string from InterviewOutcomeTool ────────────────────
  // "approved" | "221g" | "refused" | "" | null
  const interviewOutcomeStr = (meta.interviewOutcome as string | null) ?? null;

  // ── visa_interview_attended ───────────────────────────────────────────────
  // FIX (v4): any recorded outcome from InterviewOutcomeTool implies the
  // interview happened, even if step_3_8 is not marked complete.
  const visaInterviewAttended: string | null =
    (meta.visaInterviewAttended as string | null) ??
    (meta.visa_interview_attended as string | null) ??
    (trackingStatus.interview_attended_date as string | null) ??
    // Step 3.8 done + interview date → use interview date as proxy
    (stepDone("step_3_8", "c3s8") && interviewDate ? interviewDate : null) ??
    // Any recorded outcome → interview happened; use interview date or today
    (interviewOutcomeStr ? (isMeaningfulDate(interviewDate) ? interviewDate : todayStr()) : null);

  // ── interview_outcome (DATE field for engine stage detection) ─────────────
  //
  // FIX (v4): The engine's detectStage() calls isMeaningfulDate(u.interview_outcome)
  // — it expects a DATE string, not the "approved"/"221g" string label that
  // InterviewOutcomeTool saves. Since almost no users fill in a separate
  // "outcome date" field, this was always null and INTERVIEW_OUTCOME never fired.
  //
  // Resolution: synthesise a proxy date whenever interviewOutcomeStr is set.
  // Priority:
  //   1. Explicit date field (interviewOutcomeDate) — rare but respect it
  //   2. interviewOutcomeStr set → use interviewDate as proxy
  //   3. Last resort: todayStr() if outcome string present but no dates at all
  const interviewOutcomeDate: string | null =
    (meta.interviewOutcomeDate as string | null) ??
    (meta.interview_outcome_date as string | null) ??
    (interviewOutcomeStr ? (isMeaningfulDate(interviewDate) ? interviewDate : todayStr()) : null);

  // ── medical attended ──────────────────────────────────────────────────────
  const medicalAttended: string | null =
    (meta.medicalAttended as string | null) ??
    (meta.medical_attended as string | null) ??
    (stepDone("step_3_5", "c3s5") && meta.medicalDate ? (meta.medicalDate as string) : null);

  // ── visa issued ───────────────────────────────────────────────────────────
  const visaIssued: string | null =
    (meta.visaIssued as string | null) ??
    (meta.visa_issued as string | null) ??
    (meta.visaIssuedDate as string | null) ??
    (trackingStatus.visa_issued_date as string | null) ??
    null;

  // ── DQ date ───────────────────────────────────────────────────────────────
  const dqDate: string | null =
    (meta.dqDate as string | null) ??
    (meta.dq_date as string | null) ??
    (trackingStatus.dq_date as string | null) ??
    null;

  // ── DS-260 submitted ──────────────────────────────────────────────────────
  // FIX (v3): "step-completed" sentinel fails isMeaningfulDate().
  const ds260Date: string | null =
    (meta.ds260Submitted as string | null) ??
    (meta.ds260_submitted as string | null) ??
    (stepDone("step_2_3", "c2s3") ? todayStr() : null);

  // ── Docs submitted to NVC ─────────────────────────────────────────────────
  // FIX (v3): same sentinel bug + SubmissionReviewTool data.
  const _submissionDate = (meta.submissionDate as string | null) ?? null;
  const _submissionSaved = meta.submissionSaved === true || meta.submissionSaved === "true";

  const docsSubmitted: string | null =
    (meta.docsSubmittedNvc as string | null) ??
    (meta.docs_submitted_nvc as string | null) ??
    (isMeaningfulDate(_submissionDate) ? _submissionDate : null) ??
    (_submissionSaved ? (_submissionDate ?? todayStr()) : null) ??
    (stepDone("step_2_5", "c2s5") ? todayStr() : null);

  // ── Medical scheduled ─────────────────────────────────────────────────────
  const medicalScheduled: string | null =
    (meta.medicalDate as string | null) ?? (meta.medical_date as string | null) ?? null;

  // ── Embassy ───────────────────────────────────────────────────────────────
  const embassy: string | null =
    (trackingStatus.interview_embassy as string | null) ??
    (meta.interviewEmbassy as string | null) ??
    (meta.embassy as string | null) ??
    null;

  // ── ap_slip_received_date ─────────────────────────────────────────────────
  // The slip was received AT the interview — so the interview date is the
  // correct AP start anchor, not the packet submission date.
  // Do NOT use response221gDate here — that's when they submitted their
  // response packet, which is later and tracked separately below.
  const apSlipReceivedDate: string | null =
    (meta.apSlipReceivedDate as string | null) ??
    (meta.ap_slip_received_date as string | null) ??
    (trackingStatus.ap_date as string | null) ??
    // 221g outcome + interview date → slip was given at interview
    (interviewOutcomeStr === "221g" && isMeaningfulDate(interviewDate) ? interviewDate : null);

  // ── 221g packet submission date (Respond221gTool) ─────────────────────────
  // Saved by Respond221gTool when the user logs their response submission.
  // Distinct from ap_slip_received_date (when the slip was received at
  // interview). Used in the engine to branch post-submission messaging.
  const respond221gDate: string | null = (meta.response221gDate as string | null) ?? null;

  // ── ap_reason_category ────────────────────────────────────────────────────
  // FIX (v4): map InterviewOutcomeTool's outcome221gSubtype to engine enum.
  const _rawCategory =
    (meta.apReasonCategory as string | null) ?? (meta.ap_reason_category as string | null) ?? null;
  const _mappedSubtype = mapOutcomeSubtypeToAPCategory(
    (meta.outcome221gSubtype as string | null) ?? null
  );

  const apReasonCategory: APReasonCategory | null =
    (_rawCategory as APReasonCategory | null) ??
    _mappedSubtype ??
    (apSlipReceivedDate ? "unspecified" : null);

  // ─────────────────────────────────────────────────────────────────────────
  // CaseFields
  // ─────────────────────────────────────────────────────────────────────────
  const user: CaseFields = {
    i130_submitted: filingDate,
    receipt_number:
      (receiptRecord?.receiptNumber || (meta.receiptNum as string | null)) ??
      (meta.receipt_number as string | null) ??
      (trackingStatus.receipt_num as string | null) ??
      (trackingStatus.receipt_number as string | null) ??
      (meta.receipt_num as string | null) ??
      (trackingStatus.receiptNum as string | null) ??
      null,
    nvc_case_number: nvcCaseNum ?? null,
    nvc_invoice_id: nvcInvoice ?? null,
    ds260_submitted: ds260Date,
    docs_submitted_nvc: docsSubmitted,
    dq_date: dqDate,
    medical_scheduled: medicalScheduled,
    medical_attended: medicalAttended,
    interview_date: interviewDate,
    visa_interview_attended: visaInterviewAttended,
    interview_outcome: interviewOutcomeDate, // synthesised date, not the label string
    visa_issued: visaIssued,
    embassy: embassy,
    filing_method: (meta.filingMethod as string | null) ?? null,
    ap_slip_received_date: apSlipReceivedDate,
    ap_reason_category: apReasonCategory,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // NarrativeJourneyContext
  // ─────────────────────────────────────────────────────────────────────────
  const journeyContext: NarrativeJourneyContext = {
    caseTypeId: (meta.caseType as string | undefined) ?? "I130_USC_NBC",
    caseData: {
      // ── NOA1 — all aliases getReceiptNoticeDate() checks ─────────────────
      noaDate: receiptNoticeDate,
      notice_date: receiptNoticeDate,
      noticeDate: receiptNoticeDate,
      noa1_notice_date: receiptNoticeDate,
      receipt_notice_date: receiptNoticeDate,
      receiptNoticeDate: receiptNoticeDate,
      receipt_date: receiptNoticeDate,
      receiptDate: receiptNoticeDate,

      // ── NOA2 — ApprovalNoticeTool saves nested at approvalDetails.approvalDate
      approved_date:
        ((meta.approvalDetails as Record<string, unknown> | undefined)?.approvalDate as
          | string
          | null) ??
        (meta.approvedDate as string | null) ??
        (meta.approved_date as string | null) ??
        (trackingStatus.approved_date as string | null) ??
        null,
      approvalDate:
        ((meta.approvalDetails as Record<string, unknown> | undefined)?.approvalDate as
          | string
          | null) ??
        (meta.approvedDate as string | null) ??
        null,

      // ── NVC phase ────────────────────────────────────────────────────────
      nvc_received_date:
        (meta.nvcReceivedDate as string | null) ??
        (meta.nvc_received_date as string | null) ??
        null,
      nvcReceivedDate:
        (meta.nvcReceivedDate as string | null) ??
        (meta.nvc_received_date as string | null) ??
        null,

      fees_paid_date: (() => {
        const explicit =
          (meta.feesPaidDate as string | null) ?? (meta.fees_paid_date as string | null) ?? null;
        if (explicit) return explicit;
        const fs = meta.nvcFeeStatus as { aos?: string; iv?: string; date?: string } | undefined;
        if (fs?.aos === "Paid" && fs?.iv === "Paid")
          return fs.date ?? new Date().toISOString().split("T")[0];
        return null;
      })(),
      feesPaidDate: (() => {
        const explicit =
          (meta.feesPaidDate as string | null) ?? (meta.fees_paid_date as string | null) ?? null;
        if (explicit) return explicit;
        const fs = meta.nvcFeeStatus as { aos?: string; iv?: string; date?: string } | undefined;
        if (fs?.aos === "Paid" && fs?.iv === "Paid")
          return fs.date ?? new Date().toISOString().split("T")[0];
        return null;
      })(),

      // ── Mirrors for engine helpers ────────────────────────────────────────
      dq_date: dqDate,
      dqDate: dqDate,
      interview_date: interviewDate,
      interviewDate: interviewDate,
      priority_date: receiptRecord?.priorityDate ?? null,
      priorityDate: receiptRecord?.priorityDate ?? null,
      visa_issued_date: visaIssued,
      visaIssuedDate: visaIssued,

      // ── DS-260 and docs (v3 fix: real dates, no "step-completed") ─────────
      ds260_submitted_date: ds260Date,
      ds260SubmittedDate: ds260Date,
      docs_submitted_date: docsSubmitted,
      docsSubmittedDate: docsSubmitted,

      // ── Interview outcome string (v4) ─────────────────────────────────────
      // Passed through for any engine helpers that read it directly.
      // Stage detection itself uses the synthesised date in user.interview_outcome.
      interviewOutcome: interviewOutcomeStr,
      interview_outcome_str: interviewOutcomeStr,

      // ── 221g packet submission (v5) ───────────────────────────────────────
      // response221gDate = when the user submitted their 221(g) response
      // packet (logged via Respond221gTool). Distinct from ap_slip_received_date
      // which anchors the AP start. The engine uses this to branch:
      //   - not set   → "submit your packet"
      //   - set < 10d → "packet submitted — allow time before following up"
      //   - set ≥ 10d → "consider submitting a status inquiry"
      respond221gDate: respond221gDate,
      response221gDate: respond221gDate,
      response221gMethod: (meta.response221gMethod as string | null) ?? null,
    },
    metadata: {
      filingMethod: (meta.filingMethod as string | undefined) ?? "online",
      uscisAccountReady: meta.uscisAccountReady ?? false,
      nvcFeeStatus: meta.nvcFeeStatus ?? null,
      // Pass tracking status through so the engine has the full admin picture
      ...trackingStatus,
    },
    answers: state.answers ?? {},
    completedSteps: state.completedSteps,
    uploadedDocuments: uploadedDocuments.map((doc) => ({
      key: doc.documentDefId ?? doc.id ?? doc.originalFilename,
    })),
  };

  return { user, journeyContext };
}
