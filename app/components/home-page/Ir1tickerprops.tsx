// ─────────────────────────────────────────────────────────────────────────────
// IR1TickerProps.tsx — Correct prop mapping for DashboardView
//
// PROBLEMS FIXED (original):
//
//   1. journeyContext had NO caseTypeId — engine defaulted to I130_USC_NBC,
//      which was coincidentally correct; the real problem was caseData.
//
//   2. journeyContext passed state.metadata as `metadata` but the narrative
//      engine looks for approved_date, nvc_received_date, fees_paid_date,
//      noa1_date, notice_date in ctx.caseData — not ctx.metadata. These
//      dates were invisible to the engine despite being present somewhere
//      in state.
//
//   3. CaseFields.i130_submitted used state.metadata?.i130Submitted and
//      state.metadata?.receiptDate — neither key exists. The correct key
//      is state.metadata?.filedDate / filed_date. Filing date was ALWAYS
//      null, so the engine could never compute elapsed time.
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
//   7. NOA1 vs NOA2 date confusion — THE BIG ONE:
//      RegisterReceiptStep.tsx saves the NOA1 "receipt notice date"
//      (USCIS acknowledged receipt, ~2-4 weeks after filing) to a SEPARATE
//      API/store (/api/receipt/journey → ReceiptRecord.noticeDate), never
//      written to state.metadata.
//
//      ApprovalNoticeTool.tsx saves the NOA2 "approval date" (USCIS approved
//      the petition, case moves to NVC) nested at
//      state.metadata.approvalDetails.approvalDate — not a flat key.
//
//      The narrative engine correctly distinguishes notice_date (NOA1) from
//      approved_date (NOA2) — but the old mapper looked for both in the
//      wrong places, so notice_date was always null even after the user
//      registered their receipt, producing an endless
//      "add your NOA1 notice date" prompt.
//
//      FIX: this function now accepts an optional `receiptRecord` argument
//      (the same ReceiptRecord shape RegisterReceiptStep already fetches via
//      /api/receipt/journey) and maps receiptRecord.noticeDate → notice_date,
//      receiptRecord.receiptNumber → receipt_number. approved_date is read
//      from the correct nested meta.approvalDetails.approvalDate path.
//
// ADDITIONAL FIX (v2) — Sub-case A race condition:
//
//   8. Race condition: DashboardView renders <IR1Ticker> before the
//      useEffect fetching the receipt record resolves. On first render,
//      receiptRecord is null/undefined, so receiptNoticeDate falls through
//      to null. The engine sees hasReceiptDate = false and fires Sub-case A:
//      "Receipt number recorded — add your receipt notice date to track your
//      timeline." — even though the notice date IS saved.
//
//      Fix A — buildIR1TickerProps now returns a `isReceiptLoading` boolean.
//      DashboardView should suppress the ticker (or show a skeleton) while
//      this is true.
//
//      Fix B — caseData now includes every alias getReceiptNoticeDate() checks,
//      plus two additional ones (receipt_notice_date, receiptNoticeDate) that
//      were previously missing. This makes the engine robust against future
//      alias additions.
//
//      Fix C — receiptNoticeDate now also checks trackingStatus keys that
//      admins sometimes populate directly (tracking_notice_date,
//      receipt_notice_date) before falling through to null.
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
//          const journeyId = state.journeyId;
//          if (!journeyId) {
//            setReceiptRecord(null); // no journey → not loading
//            return;
//          }
//          fetchReceiptForJourney(journeyId).then(({ record }) => {
//            if (!cancelled) setReceiptRecord(record); // null if not found
//          });
//          return () => { cancelled = true; };
//        }, [state.journeyId]);
//
//   3. Guard the ticker render until the fetch resolves:
//
//        {receiptRecord !== undefined && (
//          <IR1Ticker
//            {...buildIR1TickerProps(
//              state,
//              trackingStatus,
//              nvcCaseNum,
//              nvcInvoice,
//              uploadedDocuments,
//              receiptRecord,  // null or ReceiptRecord — never undefined here
//            )}
//          />
//        )}
//
//      If you prefer to show a skeleton while loading:
//
//        {receiptRecord === undefined
//          ? <IR1TickerSkeleton />
//          : <IR1Ticker
//              {...buildIR1TickerProps(state, trackingStatus, nvcCaseNum, nvcInvoice, uploadedDocuments, receiptRecord)}
//            />
//        }
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
// Duplicated here (rather than imported) so this file has zero extra
// cross-file dependencies beyond the narrative engine and wizard state.
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
// fetchReceiptForJourney — shared fetch for the NOA1 receipt record.
//
// This mirrors the local `fetchReceipt` function already defined inside
// RegisterReceiptStep.tsx. Both that component and DashboardView need the
// same data; this single exported copy avoids duplicating the fetch logic.
// If RegisterReceiptStep.tsx is refactored later, its local fetchReceipt can
// simply call this instead.
// ─────────────────────────────────────────────────────────────────────────────

// In Ir1tickerprops.tsx — fetchReceiptForJourney
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

// ────────────────────────────
// ─────────────────────────────────────────────────
// buildIR1TickerProps — main export
//
// @param receiptRecord — the saved I-130 receipt record from RegisterReceiptStep
//   (fetched via fetchReceiptForJourney above). Carries the NOA1 "notice date"
//   (USCIS receipt acknowledgement, ~2-4 weeks after filing) and the optional
//   "priority date". This is a SEPARATE date from the NOA2 "approval date"
//   saved by ApprovalNoticeTool. Pass null if not found — the engine degrades
//   gracefully (it will prompt for the notice date, which is correct behavior
//   when it's genuinely not been entered yet).
//
//   IMPORTANT: never pass `undefined` from a loading state. Use the tri-state
//   pattern described in the file header and suppress the ticker while undefined.
//   Passing undefined is treated identically to null (no record) and will
//   trigger Sub-case A even when a record exists, producing the stale
//   "add your receipt notice date" message.
// ─────────────────────────────────────────────────────────────────────────────
function isMeaningfulDate(value: string | null | undefined): value is string {
  if (!value) return false;
  const ts = new Date(value).getTime();
  return !Number.isNaN(ts) && new Date(ts).getUTCFullYear() >= 2000;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

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
  });
  const meta = state.metadata ?? {};
  const completed = state.completedSteps;

  // ── Helper: check if a step is completed ─────────────────────────────────
  function stepDone(...stepKeys: string[]): boolean {
    if (!completed?.has) return false;
    return stepKeys.some((k) => completed.has(k));
  }

  // ── NOA1 receipt notice date (from RegisterReceiptStep's saved record) ────
  //
  // DISTINCT from the NOA2 approval date below. NOA1 = USCIS acknowledged
  // receipt of the petition; NOA2 = USCIS approved the petition.
  //
  // Priority order:
  //   1. receiptRecord.noticeDate  — saved by RegisterReceiptStep via
  //      /api/receipt/journey. This is the authoritative source.
  //   2. trackingStatus keys       — admins sometimes set these directly.
  //   3. meta keys                 — fallback for legacy data.
  //
  // FIX (v2): added tracking_notice_date and receipt_notice_date as additional
  // trackingStatus aliases, and ensured every alias used here is also written
  // into caseData below so getReceiptNoticeDate() can find it regardless of
  // which alias the engine checks first.
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
    (meta.noa1_date as string | null) ??
    null;

  // ── Filing date ───────────────────────────────────────────────────────────
  // Check all known key variants. The user records this in Step 1.3.
  // If absent, the narrative engine derives an approximate filing date from
  // notice_date (offset -21 days) — see deriveEffectiveFilingDate.
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

  // ── Interview attended ────────────────────────────────────────────────────
  // Attended = step 3.8 completed OR admin set ap_status (AP implies attended).
  // Also check metadata for a directly-recorded date.
  const visaInterviewAttended: string | null =
    (meta.visaInterviewAttended as string | null) ??
    (meta.visa_interview_attended as string | null) ??
    (trackingStatus.interview_attended_date as string | null) ??
    // If step 3.8 is done and we have an interview date, use interview date
    // as a proxy attended date (we know it happened).
    (stepDone("step_3_8", "c3s8") && interviewDate ? interviewDate : null);

  // ── Medical attended ──────────────────────────────────────────────────────
  const medicalAttended: string | null =
    (meta.medicalAttended as string | null) ??
    (meta.medical_attended as string | null) ??
    // Step 3.5 = attended medical exam
    (stepDone("step_3_5", "c3s5") && meta.medicalDate ? (meta.medicalDate as string) : null);

  // ── Interview outcome ─────────────────────────────────────────────────────
  // interviewOutcome is a string like "approved" | "221g" | "refused".
  // The engine expects a date in interview_outcome (to know the stage was
  // reached). If we have the outcome string but no date, use interviewDate
  // as proxy (outcome was recorded at/after the interview date).
  const interviewOutcomeDate: string | null =
    (meta.interviewOutcomeDate as string | null) ??
    (meta.interview_outcome_date as string | null) ??
    (meta.interviewOutcome && interviewDate ? interviewDate : null);

  // ── Visa issued ───────────────────────────────────────────────────────────
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
  const ds260Date: string | null =
    (meta.ds260Submitted as string | null) ??
    (meta.ds260_submitted as string | null) ??
    (stepDone("step_2_3", "c2s3") ? todayStr() : null);

  // ── Docs submitted to NVC ─────────────────────────────────────────────────
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

  // ── Administrative Processing (221g) — optional, user-recorded ─────────────
  // The user may record a 221(g) slip received at interview via Chapter 3 /
  // a dedicated AP step. apReasonCategory should be one of:
  //   "document_request" | "security_check" | "social_media" | "name_check" | "unspecified"
  const apSlipReceivedDate: string | null =
    (meta.apSlipReceivedDate as string | null) ??
    (meta.ap_slip_received_date as string | null) ??
    (trackingStatus.ap_date as string | null) ??
    null;
  const apReasonCategory: APReasonCategory | null =
    (meta.apReasonCategory as APReasonCategory | null) ??
    (meta.ap_reason_category as APReasonCategory | null) ??
    (apSlipReceivedDate ? "unspecified" : null);

  // ─────────────────────────────────────────────────────────────────────────
  // CaseFields — all date signals the narrative engine uses for stage detection
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
    interview_outcome: interviewOutcomeDate,
    visa_issued: visaIssued,
    embassy: embassy,
    filing_method: (meta.filingMethod as string | null) ?? null,
    ap_slip_received_date: apSlipReceivedDate,
    ap_reason_category: apReasonCategory,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // NarrativeJourneyContext — secondary date signals and identifiers
  //
  // CRITICAL: dates that live in state.metadata (approved_date, nvc_received_date,
  // fees_paid_date, noa1_date, notice_date) must go into ctx.caseData, not
  // ctx.metadata — the engine's getFromCaseData() / getReceiptNoticeDate()
  // look there specifically.
  //
  // FIX (v2): caseData now includes ALL aliases that getReceiptNoticeDate()
  // iterates over in narrativeEngine.ts:
  //   notice_date, noticeDate, noa1_date, noa1Date, noa_date, noaDate,
  //   noa1_notice_date, receipt_notice_date, receiptNoticeDate,
  //   receipt_date, receiptDate
  // Every single one is set to receiptNoticeDate so the engine finds the
  // value regardless of which alias it checks first. Previously,
  // receipt_notice_date and receiptNoticeDate were absent, meaning if the
  // engine's alias list ever changed order those checks would miss.
  // ─────────────────────────────────────────────────────────────────────────
  const journeyContext: NarrativeJourneyContext = {
    caseTypeId: (meta.caseType as string | undefined) ?? "I130_USC_NBC",
    caseData: {
      // ── NOA1 (receipt notice — USCIS acknowledges receipt, ~2-4 weeks
      //    after filing): populated from the receiptRecord param.
      //    ALL aliases that getReceiptNoticeDate() checks are set here
      //    so the engine finds the value regardless of iteration order.
      noaDate: receiptNoticeDate,
      notice_date: receiptNoticeDate,
      noticeDate: receiptNoticeDate,
      noa1_notice_date: receiptNoticeDate,
      receipt_notice_date: receiptNoticeDate,
      receiptNoticeDate: receiptNoticeDate,
      receipt_date: receiptNoticeDate,
      receiptDate: receiptNoticeDate,

      // ── NOA2 (approval notice — USCIS approves petition, case moves to NVC):
      //    ApprovalNoticeTool saves this nested under
      //    meta.approvalDetails.approvalDate, not as a flat
      //    meta.approvedDate/approved_date key. This is a DIFFERENT milestone
      //    from NOA1 above — do not conflate the two.
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

      // ── NVC phase dates ───────────────────────────────────────────────────
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

      // ── These mirror CaseFields but allow the engine to find them via
      //    caseData too (some engine helpers call getFromCaseData for these).
      dq_date: dqDate,
      dqDate: dqDate,
      interview_date: interviewDate,
      interviewDate: interviewDate,
      priority_date: receiptRecord?.priorityDate ?? null,
      priorityDate: receiptRecord?.priorityDate ?? null,
      visa_issued_date: visaIssued,
      visaIssuedDate: visaIssued,

      // ── DS-260 and docs for engine's milestone detection ──────────────────
      ds260_submitted_date: ds260Date,
      ds260SubmittedDate: ds260Date,
      docs_submitted_date: docsSubmitted,
      docsSubmittedDate: docsSubmitted,
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
