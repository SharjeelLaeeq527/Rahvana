/**
 * Reads the case facts the dashboard tracking ticket and calendar show, from
 * every place the journey tools actually save them. The step tools, the old
 * VisaTicker (`buildVisaTickerProps`) and admin-set `tracking_status` all use
 * different key names for the same fact, so each fact lists every alias here,
 * in priority order (admin / server values first, then what the user entered).
 *
 * Writers this mirrors (keep in sync when a tool changes its keys):
 * - RegisterReceiptStep: case_data `uscis_receipt_number` (object on the spouse
 *   UI, a plain string + `uscis_notice_date` / `uscis_priority_date` on the engine UI)
 * - ApprovalNoticeTool: `approvalDetails.{approvalDate, receiptNumber, priorityDate}`
 * - NVC welcome step: `nvcCaseNum`, `nvcInvoice`, `embassyCity`
 * - DqRecordingTool: `dqSaved`, `dqDate`, `dqPost`
 * - MedicalExamTool: `med_date`, `med_time`, `med_clinic`
 * - AppointmentReceivedTool: `interviewDate`, `consulateLocation`, `letterDate`
 * - Live USCIS lookups from the dashboard: `uscis_live_status`
 */
import type { ReceiptRecord } from "@/app/components/home-page/Visatickerprops";
import { parseDay } from "./personal";

type Meta = Record<string, unknown>;

const rec = (v: unknown): Meta => (v && typeof v === "object" && !Array.isArray(v) ? (v as Meta) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const firstStr = (...v: unknown[]): string | undefined => {
  for (const x of v) {
    const s = str(x);
    if (s) return s;
  }
  return undefined;
};
const firstDay = (...v: unknown[]): Date | null => {
  for (const x of v) {
    const d = parseDay(x);
    if (d) return d;
  }
  return null;
};
const yes = (v: unknown) => v === true || v === "true";

/** The last live USCIS lookup made from the dashboard (case_data `uscis_live_status`). */
export interface UscisLiveStatus {
  receiptNumber: string;
  status: string;
  description?: string;
  checkedAt: string;
}

export const USCIS_LIVE_STATUS_KEY = "uscis_live_status";

/** Fired on window after a receipt is registered, so an open dashboard refetches it. */
export const RECEIPT_SAVED_EVENT = "rv:receipt-saved";

export function parseUscisLiveStatus(v: unknown): UscisLiveStatus | null {
  const o = rec(v);
  const receiptNumber = str(o.receiptNumber);
  const status = str(o.status);
  const checkedAt = str(o.checkedAt);
  if (!receiptNumber || !status || !checkedAt) return null;
  return { receiptNumber, status, description: str(o.description), checkedAt };
}

/**
 * Turns a `/api/uscis-case-status` (USCIS Torch API) response into the record
 * the dashboard saves. Returns null when USCIS sent no status text.
 */
export function liveStatusFromUscisResponse(receiptNumber: string, json: unknown, now = new Date()): UscisLiveStatus | null {
  const data = rec(rec(json).data);
  const cs = Object.keys(rec(data.case_status)).length ? rec(data.case_status) : data;
  const status = str(cs.current_case_status_text_en);
  if (!status) return null;
  return {
    receiptNumber: receiptNumber.toUpperCase(),
    status,
    description: str(cs.current_case_status_desc_en),
    checkedAt: now.toISOString(),
  };
}

export interface CaseFacts {
  receiptNumber?: string;
  noticeDate: Date | null;
  priorityDate: Date | null;
  filedDate: Date | null;
  approvalDate: Date | null;
  /** Best known USCIS status text (live lookup for this receipt first). */
  uscisStatus?: string;
  uscisStatusDescription?: string;
  uscisCheckedAt: Date | null;
  trackingEnabled: boolean;

  nvcCaseNum?: string;
  nvcInvoice?: string;
  nvcReceivedDate: Date | null;
  feesPaid: boolean;
  feesPaidDate: Date | null;
  ds260Date: Date | null;
  docsSubmittedDate: Date | null;
  dqDate: Date | null;
  isDq: boolean;
  nvcReviewDate: Date | null;
  nvcReviewComplete: boolean;
  post?: string;

  medicalDate: Date | null;
  medicalTime?: string;
  medicalClinic?: string;
  medicalAttendedDate: Date | null;

  interviewDate: Date | null;
  interviewTime?: string;
  interviewPlace?: string;
  interviewLetterDate: Date | null;

  interviewOutcome?: string;
  apDate: Date | null;
  visaIssuedDate: Date | null;
}

export function readCaseFacts(metadata: Meta, receiptRecord?: ReceiptRecord | null, nvc?: { caseNum?: string; invoice?: string }): CaseFacts {
  const md = metadata || {};
  const ts = rec(md.tracking_status);
  const rr = receiptRecord || null;
  // Spouse UI stores the receipt record object; the engine UI overwrites the same key with the number.
  const receiptObj = rec(md.uscis_receipt_number);
  const approval = rec(md.approvalDetails);

  const receiptNumber = firstStr(
    rr?.receiptNumber,
    receiptObj.receiptNumber,
    md.uscis_receipt_number,
    md.receiptNum,
    md.receipt_number,
    md.receipt_num,
    ts.receipt_num,
    ts.receipt_number,
    ts.receiptNum,
    approval.receiptNumber
  )?.toUpperCase();

  const live = parseUscisLiveStatus(md[USCIS_LIVE_STATUS_KEY]);
  const liveForReceipt = live && receiptNumber && live.receiptNumber === receiptNumber ? live : null;

  const fs = rec(md.nvcFeeStatus);
  const feesPaidDate = firstDay(md.feesPaidDate, md.fees_paid_date, fs.date);
  const feesPaid = !!feesPaidDate || (fs.aos === "Paid" && fs.iv === "Paid");

  const submissionDate = parseDay(md.submissionDate);
  const dqDate = firstDay(ts.dq_date, md.dqDate, md.dq_date);

  const medicalDate = firstDay(md.med_date, md.medicalDate, md.medical_date);
  const interviewDate = firstDay(ts.interview_date, md.interviewDate, md.interview_date);

  return {
    receiptNumber,
    noticeDate: firstDay(
      rr?.noticeDate,
      receiptObj.noticeDate,
      md.uscis_notice_date,
      ts.notice_date,
      ts.noticeDate,
      ts.noa1_date,
      ts.noa1Date,
      ts.tracking_notice_date,
      ts.receipt_notice_date,
      md.noa1Date,
      md.noa1_date,
      md.noticeDate,
      md.notice_date,
      md.receiptDate
    ),
    priorityDate: firstDay(rr?.priorityDate, receiptObj.priorityDate, md.uscis_priority_date, approval.priorityDate, md.priorityDate),
    filedDate: firstDay(md.filedDate, md.filed_date, md.i130FiledDate, md.i130SubmittedDate),
    approvalDate: firstDay(approval.approvalDate, md.approvalDate, md.approvedDate, md.approved_date, ts.approved_date),
    uscisStatus: firstStr(liveForReceipt?.status, ts.uscis_status, rr?.lastKnownStatus, receiptObj.lastKnownStatus),
    uscisStatusDescription: liveForReceipt?.description,
    uscisCheckedAt: firstDay(liveForReceipt?.checkedAt, rr?.lastCheckedAt, receiptObj.lastCheckedAt),
    trackingEnabled: !!rr?.trackingEnabled || yes(receiptObj.trackingEnabled) || yes(md.uscis_tracking_enabled),

    nvcCaseNum: firstStr(nvc?.caseNum, md.nvcCaseNum, md.nvc_case_number),
    nvcInvoice: firstStr(nvc?.invoice, md.nvcInvoice),
    nvcReceivedDate: firstDay(md.nvcReceivedDate, md.nvc_received_date),
    feesPaid,
    feesPaidDate,
    ds260Date: firstDay(md.ds260Submitted, md.ds260_submitted, md.ds260SubmittedDate),
    docsSubmittedDate:
      firstDay(md.docsSubmittedNvc, md.docs_submitted_nvc) || (yes(md.submissionSaved) ? submissionDate : null),
    dqDate,
    isDq: !!dqDate || yes(md.dqSaved) || ts.dq_status === "qualified" || md.dqStatus === "qualified",
    nvcReviewDate: parseDay(ts.nvc_review_date),
    nvcReviewComplete: yes(ts.nvc_review_complete),
    post: firstStr(md.dqPost, md.post, md.embassyCity, ts.interview_embassy, md.consulateLocation),

    medicalDate,
    medicalTime: firstStr(md.med_time, md.medicalTime),
    medicalClinic: firstStr(md.med_clinic, md.medClinic),
    medicalAttendedDate: firstDay(md.medicalAttended, md.medical_attended),

    interviewDate,
    interviewTime: firstStr(ts.interview_time, md.interviewTime),
    interviewPlace: firstStr(ts.interview_embassy, md.interviewEmbassy, md.consulateLocation, md.embassy),
    interviewLetterDate: parseDay(md.letterDate),

    interviewOutcome: firstStr(md.interviewOutcome),
    apDate: firstDay(md.apSlipReceivedDate, md.ap_slip_received_date, ts.ap_date),
    visaIssuedDate: firstDay(md.visaIssued, md.visa_issued, md.visaIssuedDate, ts.visa_issued_date),
  };
}
