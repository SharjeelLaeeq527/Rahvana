// components/RegisterReceiptStep.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { E, msg } from "@/lib/errors";
import { Globe, Lock } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { GuideTutorialOverlay } from "../GuideTutorialOverlays";
import {
  fmtDate,
  fmtDateTime,
  buildTimelineItems,
  type ReceiptRecord,
  type RegisterReceiptPayload,
  type RegisterReceiptError,
} from "@/lib/register-receipt";
import { ReceiptFormatChip } from "./ReceiptFormatChip";
import { useLanguage } from "@/app/context/LanguageContext";

// ─── Tiny SVG helpers ──────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[18px] h-[18px]"
    fill="none"
    stroke="#15744f"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const BookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[18px] h-[18px]"
    fill="none"
    stroke="#4a2d8a"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const ArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[11px] h-[11px]"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[14px] h-[14px]"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ─── Inline upgrade nudge banner ───────────────────────────────────────────────

interface UpgradeNudgeProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}

const UpgradeNudge: React.FC<UpgradeNudgeProps> = ({
  title,
  description,
  onUpgrade,
  onDismiss,
}) => (
  <div
    className="rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200"
    style={{
      background: "#f0f1fb",
      border: "1.5px solid rgba(130,132,191,0.3)",
    }}
  >
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "#8284bf" }}
      >
        <span className="plan-icon plan-icon--premium scale-110" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold mb-1" style={{ color: "#8284bf" }}>
          {title}
        </div>
        <div className="text-[13px] leading-[1.6]" style={{ color: "#4a2f55" }}>
          {description}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={onUpgrade}
            className="px-4 py-1.5 rounded-full text-[13px] font-bold text-white transition-colors"
            style={{ background: "#8284bf" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6d5fb0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#8284bf")}
          >
            Upgrade Plan
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              border: "1.5px solid rgba(130,132,191,0.3)",
              color: "#8284bf",
              background: "transparent",
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Vault document shape ──────────────────────────────────────────────────────

export interface VaultFile {
  file: File;
  uploadDate: Date;
  quality: "excellent" | "good" | "needs-review";
}

// ─── Status Timeline ───────────────────────────────────────────────────────────

const StatusTimelinePanel: React.FC<{ record: ReceiptRecord }> = ({ record }) => {
  const items = buildTimelineItems(record);

  const summaryCards = [
    { k: "Receipt Number", v: record.receiptNumber },
    { k: "Tracking", v: "Enabled" },
    {
      k: "Notice Date",
      v: record.noticeDate ? fmtDate(record.noticeDate) : "Not provided",
    },
    {
      k: "Priority Date",
      v: record.priorityDate ? fmtDate(record.priorityDate) : "Not provided",
    },
    { k: "Last Known Status", v: record.lastKnownStatus },
    { k: "Last Checked", v: fmtDateTime(record.lastCheckedAt) },
  ];

  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col mt-6"
      style={{
        background: "#8284bf",
        border: "1.5px solid #c6c8ea",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="px-6 py-4" style={{ borderBottom: "1px solid #8284bf33" }}>
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#8284bf" }}
        >
          Post-Filing 
        </div>
        <div className="text-[18px] font-semibold text-white">
          Receipt Registered · Status Timeline
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
          {summaryCards.map(({ k, v }) => (
            <div
              key={k}
              className="rounded-xl p-3"
              style={{ background: "#f0f1fb", border: "1px solid #c6c8ea" }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "#8284bf" }}
              >
                {k}
              </div>
              <div className="text-[13px] font-semibold" style={{ color: "#28151c" }}>
                {v}
              </div>
            </div>
          ))}
        </div>
        <div className="h-px mb-5" style={{ background: "#8284bf33" }} />
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 items-start rounded-xl p-3"
              style={{ background: "#f0f1fb", border: "1px solid #c6c8ea" }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: "#8284bf" }}
              />
              <div>
                <div className="text-[13px] font-bold" style={{ color: "#28151c" }}>
                  {item.title}
                </div>
                <div className="text-[12px]" style={{ color: "#5c6570" }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   API CALLS
───────────────────────────────────────────────────────────── */

async function postReceipt(
  journeyId: string,
  payload: RegisterReceiptPayload
): Promise<{ record: ReceiptRecord | null; error: string }> {
  console.log("[RegisterReceiptStep v2] postReceipt initiated", { journeyId, payload });
  try {
    const res = await fetch(`/api/receipt/journey?journeyId=${encodeURIComponent(journeyId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("[RegisterReceiptStep v2] postReceipt raw response:", data);
    if (!res.ok || "error" in data) {
      return { record: null, error: msg(E.JOURNEY_RECEIPT_SAVE_FAILED) };
    }
    const record: ReceiptRecord = {
      receiptNumber: data.receipt_number || data.receiptNumber || "",
      noticeDate: data.notice_date || data.noticeDate || null,
      priorityDate: data.priority_date || data.priorityDate || null,
      caseLabel: data.case_label || data.caseLabel || null,
      source: data.source || "manual",
      trackingEnabled: !!(data.tracking_enabled ?? data.trackingEnabled),
      lastKnownStatus: data.last_known_status || data.lastKnownStatus || null,
      lastCheckedAt: data.last_checked_at || data.lastCheckedAt || null,
      savedAt: data.saved_at || data.savedAt || null,
    };
    return { record, error: "" };
  } catch {
    console.error("[RegisterReceiptStep v2] postReceipt network error");
    return { record: null, error: "Network error while saving receipt, please try again." };
  }
}

async function fetchReceipt(journeyId: string) {
  console.log("[RegisterReceiptStep v2] fetchReceipt initiated for journeyId:", journeyId);
  try {
    const res = await fetch(`/api/receipt/journey?journeyId=${encodeURIComponent(journeyId)}`);
    const data = await res.json();
    console.log("[RegisterReceiptStep v2] fetchReceipt raw response:", data);
    if (!res.ok || data.error) return { record: null, error: msg(E.JOURNEY_RECEIPT_FETCH_FAILED) };
    const record: ReceiptRecord = {
      receiptNumber: data.receipt_number || data.receiptNumber || "",
      noticeDate: data.notice_date || data.noticeDate || null,
      priorityDate: data.priority_date || data.priorityDate || null,
      caseLabel: data.case_label || data.caseLabel || null,
      source: data.source || "manual",
      trackingEnabled: !!(data.tracking_enabled ?? data.trackingEnabled),
      lastKnownStatus: data.last_known_status || data.lastKnownStatus || null,
      lastCheckedAt: data.last_checked_at || data.lastCheckedAt || null,
      savedAt: data.saved_at || data.savedAt || null,
    };
    return { record, error: "" };
  } catch {
    console.error("[RegisterReceiptStep v2] fetchReceipt network error");
    return { record: null, error: "Network error while fetching receipt" };
  }
}

// ─── Shared error banner ───────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ message: string }> = ({ message }) =>
  message ? (
    <div
      className="rounded-lg p-3 text-[13px] mb-4"
      style={{
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        color: "#9f1239",
      }}
    >
      {message}
    </div>
  ) : null;

// ─── Manual entry form ─────────────────────────────────────────────────────────

interface ManualFormProps {
  onBack: () => void;
  onSaved: (r: ReceiptRecord) => void;
  existingRecord: ReceiptRecord | null;
  guard?: () => boolean;
  /** If true, the Save button shows an upgrade nudge instead of saving */
  trackingLocked?: boolean;
  onTrackingLocked?: () => void;
}

const ManualForm: React.FC<ManualFormProps & { journeyId: string }> = ({
  onBack,
  onSaved,
  existingRecord,
  journeyId,
  guard,
  trackingLocked,
  onTrackingLocked,
}) => {
  const isUpdate = existingRecord !== null;
  const [fields, setFields] = useState({
    receiptNumber: existingRecord?.receiptNumber ?? "",
    noticeDate: existingRecord?.noticeDate ?? "",
    priorityDate: existingRecord?.priorityDate ?? "",
    caseLabel: existingRecord?.caseLabel ?? "",
  });
  console.log("[RegisterReceiptStep] current journeyId:", journeyId); // Add this line
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));
  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "#8284bf");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "#d0e4f7");

  useEffect(() => {
    console.log("[ManualForm v2] noticeDate state updated:", fields.noticeDate);
  }, [fields.noticeDate]);

  async function handleSubmit() {
    // If tracking is locked for this tier, show the upgrade nudge instead
    if (trackingLocked && !isUpdate) {
      onTrackingLocked?.();
      return;
    }
    if (guard && !guard()) return;
    // Client-side validation — all required fields
    const rn = fields.receiptNumber.trim();
    if (!rn || !fields.noticeDate || !fields.priorityDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (rn.length !== 13) {
      setError(msg(E.TOOL_CASE_RECEIPT_LENGTH));
      return;
    }
    setLoading(true);
    setError("");
    const { record, error: err } = await postReceipt(journeyId, {
      ...fields,
      receiptNumber: rn,
      source: "manual",
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (record) onSaved(record);
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-10 mb-6"
      style={{
        background: "#fff",
        border: "1.5px solid rgba(130,132,191,0.4)",
      }}
    >
      <div className="text-[22px] mb-2 font-semibold" style={{ color: "#28151c" }}>
        {isUpdate ? "Update receipt details" : "Register the receipt notice"}
      </div>
      <div className="text-[14px] mb-6" style={{ color: "#28151c" }}>
        {isUpdate
          ? "You can update dates and the case label. The receipt number is locked to prevent accidental re-registration."
          : "Enter the receipt number and dates exactly as they appear on your USCIS notice."}
      </div>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Receipt Number
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{
              border: "1.5px solid #d0e4f7",
              color: "#1c2b3a",
              background: "#fff",
              cursor: "text",
            }}
            placeholder="IOE1234567890"
            maxLength={13}
            value={fields.receiptNumber}
            onChange={set("receiptNumber")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <ReceiptFormatChip value={fields.receiptNumber} />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Notice Date
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date"
            value={fields.noticeDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={set("noticeDate")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Priority Date
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date"
            value={fields.priorityDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={set("priorityDate")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Case Label <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            placeholder="IR-1 I-130 · March 2026 filing"
            value={fields.caseLabel}
            onChange={set("caseLabel")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
      </div>
      <div
        className="rounded-lg p-3 text-[13px] mb-5"
        style={{
          background: "#f0f1fb",
          border: "1px solid rgba(130,132,191,0.3)",
          color: "#28151c",
        }}
      >
        Always confirm the receipt number before saving, it is the primary key used for case
        tracking.
      </div>

      {/* Tracking locked notice for Basic tier (new registration only) */}
      {trackingLocked && !isUpdate && (
        <div
          className="rounded-xl p-3 mb-4 flex items-start gap-2.5"
          style={{ background: "#fef9e7", border: "1px solid #f0d98a" }}
        >
          <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8a6200" }} />
          <p className="text-[12.5px] leading-[1.6]" style={{ color: "#8a6200" }}>
            <strong>Tracking is not included in your current plan.</strong> Your details will be
            saved, but automatic case status monitoring requires a higher tier. You can upgrade any
            time to enable tracking.
          </p>
        </div>
      )}

      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-2">
        <button
          className="px-5 py-2 rounded-full text-[14px] font-semibold"
          style={{
            background: "#fff",
            border: "1.5px solid #8284bf",
            color: "#8284bf",
          }}
          onClick={onBack}
          disabled={loading}
        >
          Back
        </button>
        <button
          className="px-5 py-2 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: "#8284bf" }}
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#6d5fb0")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#8284bf")}
        >
          {trackingLocked && !isUpdate && <Lock className="w-3.5 h-3.5" />}
          {loading
            ? "Saving..."
            : isUpdate
              ? "Save Changes"
              : trackingLocked
                ? "Save Receipt (Tracking Locked)"
                : "Save Receipt & Enable Tracking"}
        </button>
      </div>

      {/* Mobile Buttons */}
      <div className="flex md:hidden flex-col gap-2 w-full mt-2">
        <button
          className="w-full py-3 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "#8284bf" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {trackingLocked && !isUpdate && <Lock className="w-3.5 h-3.5" />}
          {loading
            ? "Saving..."
            : isUpdate
              ? "Save Changes"
              : trackingLocked
                ? "Save Receipt"
                : "Save & Enable Tracking"}
        </button>
        <button
          className="w-full py-2.5 text-[14px] font-medium"
          style={{
            background: "transparent",
            color: "#6b8097",
          }}
          onClick={onBack}
          disabled={loading}
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
};

// ─── Upload form ───────────────────────────────────────────────────────────────

const RECEIPT_NOTICE_DOC_ID = "receipt-notice-uscis";

interface UploadFormProps {
  onBack: () => void;
  onSaved: (r: ReceiptRecord) => void;
  onFileVault: (docId: string, files: FileList) => void;
  existingRecord: ReceiptRecord | null;
  guard?: () => boolean;
}

const UploadForm: React.FC<UploadFormProps & { journeyId: string }> = ({
  onBack,
  onSaved,
  onFileVault,
  existingRecord,
  journeyId,
  guard,
}) => {
  const { t, isUrdu } = useLanguage();
  const isUpdate = existingRecord !== null;
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fields, setFields] = useState({
    receiptNumber: existingRecord?.receiptNumber ?? "",
    noticeDate: existingRecord?.noticeDate ?? "",
    priorityDate: existingRecord?.priorityDate ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrRawResponse, setOcrRawResponse] = useState<any>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));
  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "#8284bf");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "#d0e4f7");

  useEffect(() => {
    console.log("[UploadForm v2] noticeDate state updated:", fields.noticeDate);
  }, [fields.noticeDate]);

  const ocrRequestIdRef = useRef(0);

  useEffect(() => {
    console.log("DEBUG [UploadForm v2] noticeDate changed in state:", fields.noticeDate);
  }, [fields.noticeDate]);

  async function runOCR(file: File) {
    const currentRequestId = Date.now();

    ocrRequestIdRef.current = currentRequestId;

    setOcrLoading(true);
    setOcrError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/receipt/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "OCR failed");
      }

      // Ignore stale responses
      if (currentRequestId !== ocrRequestIdRef.current) {
        return;
      }

      setOcrRawResponse(data);

      // Prefer fresh OCR values on each run; keep previous only when API returns null.
      setFields((prev) => ({
        ...prev,
        receiptNumber: data.receiptNumber || "",
        noticeDate: data.noticeDate || "",
        priorityDate: data.priorityDate || "",
      }));
    } catch (err: any) {
      if (currentRequestId === ocrRequestIdRef.current) {
        setOcrError(err?.message || "OCR request failed");
      }
    } finally {
      if (currentRequestId === ocrRequestIdRef.current) {
        setOcrLoading(false);
      }
    }
  }

  async function applySelectedFiles(files: FileList | null) {
    const file = files?.[0] ?? null;
    setUploadFile(file);
    if (files && files.length > 0) {
      onFileVault(RECEIPT_NOTICE_DOC_ID, files);
    }
    if (file) {
      await runOCR(file);
    }
  }

  async function handleSubmit() {
    if (guard && !guard()) return;
    // Client-side validation — all required fields
    const rn = fields.receiptNumber.trim();
    if (!rn || !fields.noticeDate || !fields.priorityDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (rn.length !== 13) {
      setError(msg(E.TOOL_CASE_RECEIPT_LENGTH));
      return;
    }
    if (!uploadFile) {
      setError(msg(E.UPLOAD_NO_FILE));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("documentDefId", RECEIPT_NOTICE_DOC_ID);
      formData.append("role", "PETITIONER");
      formData.append("personName", "Petitioner");
      formData.append("caseId", rn);
      formData.append("notes", "Uploaded via receipt registration step");
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(msg(E.JOURNEY_RECEIPT_SAVE_FAILED));
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(msg(E.JOURNEY_RECEIPT_SAVE_FAILED));
      setLoading(false);
      return;
    }
    const { record, error: err2 } = await postReceipt(journeyId, {
      ...fields,
      receiptNumber: rn,
      source: "upload",
    });
    setLoading(false);
    if (err2) {
      setError(err2);
      return;
    }
    if (record) onSaved(record);
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-10 mb-6"
      style={{
        background: "#fff",
        border: "1.5px solid rgba(130,132,191,0.4)",
      }}
    >
      <div className="text-[22px] mb-2 font-semibold" style={{ color: "#28151c" }}>
        {isUpdate ? "Upload a new notice file" : "Upload receipt notice"}
      </div>
      <div className="text-[14px] mb-3" style={{ color: "#28151c" }}>
        {isUpdate
          ? "You can replace the notice file on record. The receipt number below is locked."
          : "Upload your notice file, then confirm the key details below before saving."}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mb-6">
        <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className={isUrdu ? "font-urdu-body" : ""}>
          {t("documentVaultPage.components.uploadModal.securityNotice")}
        </span>
      </div>
      <ErrorBanner message={error} />
      <label
        className="text-[11px] font-semibold uppercase tracking-wider block mb-1"
        style={{ color: "#6b8097" }}
      >
        Receipt Notice File
      </label>
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          id="receipt-upload-input"
          className="sr-only"
          onChange={async (e) => {
            await applySelectedFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <label
          htmlFor="receipt-upload-input"
          className="flex flex-col items-center justify-center rounded-xl px-6 py-10 cursor-pointer transition-colors"
          style={{
            background: isDropActive ? "#e8eafd" : "#f8f9fd",
            border: `2px dashed ${
              isDropActive ? "rgba(130,132,191,0.85)" : "rgba(130,132,191,0.45)"
            }`,
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDropActive(false);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropActive(false);
            const dropped = e.dataTransfer.files?.[0];
            if (!dropped) return;
            const lower = dropped.name.toLowerCase();
            const ok =
              lower.endsWith(".pdf") ||
              lower.endsWith(".png") ||
              lower.endsWith(".jpg") ||
              lower.endsWith(".jpeg");
            if (!ok) {
              setError(msg(E.TOOL_FILE_TYPE_UNSUPPORTED));
              return;
            }
            setError("");
            const dt = new DataTransfer();
            dt.items.add(dropped);
            await applySelectedFiles(dt.files);
          }}
        >
          <span className="text-[15px] font-semibold mb-1 text-center" style={{ color: "#28151c" }}>
            Drag & drop your receipt notice here
          </span>
          <span className="text-[13px] mb-4 text-center" style={{ color: "#6b8097" }}>
            or click anywhere in this area to choose a file
          </span>
          <span
            className="px-4 py-2 rounded-lg text-[14px] font-semibold pointer-events-none"
            style={{
              background: "#f0f1fb",
              border: "1px solid rgba(130,132,191,0.4)",
              color: "#8284bf",
            }}
          >
            Choose File
          </span>
          <span
            className="text-[13px] mt-4 text-center truncate max-w-full px-2"
            style={{ color: "#6b8097" }}
          >
            {uploadFile ? uploadFile.name : "No file chosen"}
          </span>
        </label>
      </div>
      {ocrLoading && (
        <div className="text-[13px] mt-2" style={{ color: "#8284bf" }}>
          Extracting receipt details...
        </div>
      )}
      {ocrError && (
        <div
          className="rounded-lg p-3 text-[13px] mb-4 mt-3"
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#9f1239",
          }}
        >
          {ocrError}
        </div>
      )}
      <div
        className="rounded-lg p-3 mb-5 text-[13px]"
        style={{
          background: "#f4f7fb",
          border: "1px solid #d0e4f7",
          color: "#3a4f63",
        }}
      >
        Accepted formats: PDF, PNG, JPG. Confirm the receipt number and dates below before saving.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Confirm Receipt Number
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{
              border: "1.5px solid #d0e4f7",
              color: "#1c2b3a",
              background: "#fff",
              cursor: "text",
            }}
            placeholder="IOE1234567890"
            maxLength={13}
            value={fields.receiptNumber}
            onChange={set("receiptNumber")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <ReceiptFormatChip value={fields.receiptNumber} />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Notice Date
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date"
            value={fields.noticeDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={set("noticeDate")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#6b8097" }}
          >
            Priority Date
          </label>
          <input
            className="rounded-lg px-4 py-3 text-[15px] outline-none"
            style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date"
            value={fields.priorityDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={set("priorityDate")}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
      </div>
      <div
        className="rounded-lg p-3 text-[13px] mb-5"
        style={{
          background: "#f0f1fb",
          border: "1px solid rgba(130,132,191,0.3)",
          color: "#28151c",
        }}
      >
        Please confirm the receipt number before enabling tracking.
      </div>
      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-2 justify-end">
        <button
          className="px-5 py-2 rounded-full text-[14px] font-semibold"
          style={{
            background: "#fff",
            border: "1.5px solid #8284bf",
            color: "#8284bf",
          }}
          onClick={onBack}
          disabled={loading}
        >
          Back
        </button>
        <button
          className="px-5 py-2 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "#8284bf" }}
          onClick={handleSubmit}
          disabled={loading || ocrLoading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#6d5fb0")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#8284bf")}
        >
          {loading ? "Saving..." : isUpdate ? "Save Changes" : "Save Receipt & Enable Tracking"}
        </button>
      </div>

      {/* Mobile Buttons */}
      <div className="flex md:hidden flex-col gap-2 w-full mt-2">
        <button
          className="w-full py-3 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "#8284bf" }}
          onClick={handleSubmit}
          disabled={loading || ocrLoading}
        >
          {loading ? "Saving..." : isUpdate ? "Save Changes" : "Save & Enable Tracking"}
        </button>
        <button
          className="w-full py-2.5 text-[14px] font-medium"
          style={{
            background: "transparent",
            color: "#6b8097",
          }}
          onClick={onBack}
          disabled={loading}
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

type UiState = "idle" | "register" | "update";
type TabMode = "manual" | "upload";

import { useStepEntitlement } from "../useStepEntitlement";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";

interface RegisterReceiptStepProps {
  tool: any;
  journeyId: string;
  state: any;
  actions: any;
}

const RegisterReceiptStep: React.FC<RegisterReceiptStepProps> = ({
  tool,
  journeyId,
  state,
  actions,
}) => {
  console.log("DEBUG [RegisterReceiptStep v2] Root render with journeyId:", journeyId);

  const stepEntitlement = useStepEntitlement("step_1_15");
  const plan = usePlan();

  // Basic tier cannot use upload or guide; tracking is locked on save
  const isBasic = plan.tier === "basic";

  const [uiState, setUiState] = useState<UiState>("idle");
  const [activeTab, setActiveTab] = useState<TabMode>("manual");
  const [savedRecord, setSavedRecord] = useState<ReceiptRecord | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [guideSteps, setGuideSteps] = useState<any[]>([]);
  const [vaultDocs, setVaultDocs] = useState<Record<string, VaultFile[]>>({});

  // ── Upgrade modal state ─────────────────────────────────────────────────────
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  // Inline nudge: shown inside the manual form when user clicks Save with locked tracking
  const [showTrackingNudge, setShowTrackingNudge] = useState(false);

  useEffect(() => {
    const fromTool = tool?.tutorial_steps;
    if (Array.isArray(fromTool) && fromTool.length > 0) {
      setGuideSteps(fromTool);
      return;
    }
    import("@/data/receipt-guide-steps.json").then((mod) => setGuideSteps(mod.default));
  }, [tool]);

  useEffect(() => {
    if (!journeyId) return;
    fetchReceipt(journeyId).then(({ record }) => {
      if (record) setSavedRecord(record);
    });
  }, [journeyId]);

  const handleSaved = useCallback(
    async (record: ReceiptRecord) => {
      setUiState("idle");
      setShowTrackingNudge(false);
      const { record: fresh } = await fetchReceipt(journeyId);
      setSavedRecord(fresh ?? record);
    },
    [journeyId]
  );

  const handleFileVault = useCallback((docId: string, files: FileList) => {
    const incoming: VaultFile[] = Array.from(files).map((file) => ({
      file,
      uploadDate: new Date(),
      quality: file.size > 500_000 ? "excellent" : file.size > 100_000 ? "good" : "needs-review",
    }));
    setVaultDocs((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] ?? []), ...incoming],
    }));
  }, []);

  const hasExistingReceipt = savedRecord !== null;

  const formRef = useRef<HTMLDivElement>(null);

  const handleRegisterCardClick = () => {
    setShowTrackingNudge(false);
    setActiveTab("manual");
    setUiState(hasExistingReceipt ? "update" : "register");
    setTimeout(() => {
      if (window.innerWidth < 768) {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Called when Basic user clicks "Upload Receipt Notice" tab or upload button
  const handleUploadLocked = () => setUpgradeModalFeature("receipt_upload");

  // Called when Basic user clicks Save (tracking locked)
  const handleTrackingLocked = () => setShowTrackingNudge(true);

  return (
    //<div className="min-h-screen w-full ch1step-bg">
    <div className="min-h-screen w-full">
      <div className="bg-cover bg-center w-full min-h-screen relative">
        <div className="max-w-[720px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-5 pb-4 md:py-8 2xl:py-12 flex flex-col">
          {/* Eyebrow */}
          {/* <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">
              Chapter 1 · USCIS Petition Filing
            </span>
            <span className="text-[11px]" style={{ color: "#b8d4f0" }}>
              ›
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">
              {tool.title}
            </span>
          </div> */}

          <h1 className="page-title text-[clamp(28px,4vw,36px)] font-bold text-[#0c1b33] leading-[1.15] tracking-tight mb-1">
            {tool.title}
          </h1>
          <p className="text-[15px] md:text-[16px] leading-[1.7] max-w-full md:max-w-[560px] mb-3.5 sm:mb-6 text-[#3a4f63]">
            {tool.subtitle}
          </p>

          {/* Chips */}
          <div className="flex gap-[7px] flex-wrap mb-3.5 sm:mb-8">
            {[
              { label: "Petitioner", type: "role" },
              { label: "Online Filing", type: "path" },
              { label: "Tracking", type: "track" },
            ].map((chip) => (
              <span
                key={chip.label}
                className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border ${
                  chip.type === "role"
                    ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                    : chip.type === "path"
                      ? "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]"
                      : "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>

          {/* Launch module */}
          <div
            className="rounded-2xl mb-5 relative overflow-hidden w-full"
            style={{ background: "#251f32" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: "linear-gradient(to right, #8284bf, #4e518c, transparent)",
                opacity: 0.8,
              }}
            />
            <div className="p-5 sm:p-8 md:p-[32px_34px_28px]">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center shrink-0"
                    style={{ background: "#8284bf" }}
                  >
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#8284bf" }}
                  >
                    Post-Filing Checkpoint
                    <span className="hidden sm:inline"> · </span>
                    <br className="sm:hidden" />
                    Receipt Registration
                  </div>
                </div>
                <div
                  className="text-[clamp(19px,2.8vw,23px)] leading-tight"
                  style={{ color: "#fff" }}
                >
                  Wait for the notice, register it, then let Rahvana monitor the case
                </div>
              </div>
              <div className="h-px mb-5" style={{ background: "#8284bf33" }} />
              {tool.phases?.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-col gap-2.5 items-start rounded-[10px] px-4 py-3 mb-2"
                  style={{
                    background: "rgba(130,132,191,0.18)",
                    border: "1px solid #8284bf55",
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: "#8284bf", color: "#fff" }}
                  >
                    {p.badge}
                  </span>
                  <span
                    className="text-[13px] leading-snug"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {p.copy}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-2">
                {tool.launch_cues?.map((cue: string, i: number) => (
                  <div
                    key={i}
                    className="flex gap-3 items-center rounded-xl px-5 py-4"
                    style={{
                      background: "#4e518c",
                      border: "1.5px solid #8284bf55",
                      minHeight: "60px",
                    }}
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full shrink-0"
                      style={{ background: "#8284bf" }}
                    />
                    <span
                      className="text-[14px] font-normal leading-snug"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {cue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Two action cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Card 1 — Register / Update */}
            <div className="relative">
              <button
                className="rounded-2xl p-5 flex flex-col items-start text-left w-full"
                style={{
                  background: "#fff",
                  border: "1.5px solid #d0e4f7",
                  transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s",
                  ...(stepEntitlement.isLocked ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2f6fd4";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(47,111,212,0.10)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d0e4f7";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onClick={handleRegisterCardClick}
                disabled={stepEntitlement.isLocked}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]"
                  style={{ background: "#e8f5ef", border: "1px solid #a8d9be" }}
                >
                  <CheckIcon />
                </div>
                <div className="text-[15px] font-semibold mb-[5px]" style={{ color: "#0c1b33" }}>
                  {hasExistingReceipt
                    ? "Receipt Notice Registered"
                    : "I Received My Receipt Notice"}
                </div>
                <div className="text-[13px] leading-[1.55]" style={{ color: "#6b8097" }}>
                  {hasExistingReceipt
                    ? `Tracking active for ${savedRecord!.receiptNumber}. Tap to update dates or the case label.`
                    : "Move into the registration step and save the receipt details inside Rahvana."}
                </div>
                <div
                  className="flex items-center gap-[5px] font-semibold text-[12px] mt-[13px]"
                  style={{ color: "#2f6fd4" }}
                >
                  {hasExistingReceipt ? (
                    <>
                      <EditIcon />
                      &nbsp;Update details
                    </>
                  ) : (
                    <>
                      Register notice <ArrowRight />
                    </>
                  )}
                </div>
              </button>
              {plan.tier === "basic" && (
                <span
                  className="absolute top-2 right-2 plan-icon plan-icon--premium scale-110"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Card 2 — Guide (locked for Basic) */}
            <div className="relative">
              <button
                className="rounded-2xl p-5 flex flex-col items-start text-left w-full"
                style={{
                  background: isBasic ? "#f9f9fb" : "#fff",
                  border: `1.5px solid ${isBasic ? "#e2e8f0" : "#d0e4f7"}`,
                  transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s",
                  opacity: isBasic ? 0.72 : 1,
                  cursor: isBasic ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isBasic) {
                    e.currentTarget.style.borderColor = "#2f6fd4";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(47,111,212,0.10)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isBasic) {
                    e.currentTarget.style.borderColor = "#d0e4f7";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
                onClick={() => {
                  if (isBasic) {
                    setUpgradeModalFeature("receipt_guide");
                    return;
                  }
                  if (!stepEntitlement.isLocked) {
                    setGuideStep(0);
                    setIsGuideOpen(true);
                  }
                }}
                disabled={stepEntitlement.isLocked && !isBasic}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]"
                  style={{
                    background: "#f3f0fb",
                    border: "1px solid #c9bef2",
                    position: "relative",
                  }}
                >
                  <BookIcon />
                </div>
                <div className="text-[15px] font-semibold mb-[5px]" style={{ color: "#0c1b33" }}>
                  Where Do I Find the Receipt Number?
                </div>
                <div className="text-[13px] leading-[1.55]" style={{ color: "#6b8097" }}>
                  {isBasic
                    ? "Step-by-step walkthrough included in Premium and above."
                    : "Open a short walkthrough that shows where to look and what information to bring back."}
                </div>
                <div
                  className="flex items-center gap-[5px] font-semibold text-[12px] mt-[13px]"
                  style={{ color: isBasic ? "#8284bf" : "#2f6fd4" }}
                >
                  {isBasic ? (
                    <>
                      <span className="plan-icon plan-icon--premium scale-110" aria-hidden="true" />
                      Upgrade to unlock
                    </>
                  ) : (
                    <>
                      Open guide <ArrowRight />
                    </>
                  )}
                </div>
              </button>
              {isBasic && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "#f0f1fb",
                    border: "1px solid rgba(130,132,191,0.3)",
                  }}
                >
                  <Lock size={11} style={{ color: "#8284bf" }} />
                </div>
              )}
            </div>
          </div>

          <p
            className="text-[11.5px] text-center mt-[6px] mb-4"
            style={{ color: "#6b8097", lineHeight: 1.6 }}
          >
            {hasExistingReceipt
              ? "One receipt number per case. Use (Update details)"
              : "Best next move: wait until USCIS accepts the filing, then return here with the receipt number or receipt notice."}
          </p>

          {/* Tracking nudge — shown inline after Save is clicked with locked tracking */}
          {showTrackingNudge && (
            <UpgradeNudge
              title="Case tracking requires an upgrade"
              description="Your receipt details have been saved. Automatic case status monitoring, where Rahvana checks USCIS on your behalf and alerts you to changes, is available on Premium and Executive plans."
              onUpgrade={() => {
                setShowTrackingNudge(false);
                setUpgradeModalFeature("receipt_tracking");
              }}
              onDismiss={() => setShowTrackingNudge(false)}
            />
          )}

          {/* ── Registration / update form ── */}
          {(uiState === "register" || uiState === "update") && (
            <div ref={formRef}>
              {hasExistingReceipt ? (
                savedRecord?.source === "manual" ? (
                  <ManualForm
                    onBack={() => setUiState("idle")}
                    onSaved={handleSaved}
                    existingRecord={savedRecord}
                    journeyId={journeyId}
                    guard={stepEntitlement.guard}
                  />
                ) : (
                  <UploadForm
                    onBack={() => setUiState("idle")}
                    onSaved={handleSaved}
                    onFileVault={handleFileVault}
                    existingRecord={savedRecord}
                    journeyId={journeyId}
                    guard={stepEntitlement.guard}
                  />
                )
              ) : (
                <>
                  {/* Tab bar — Upload tab locked for Basic */}
                  <div
                    className="flex flex-nowrap gap-2 mb-4 overflow-x-auto"
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    {(["manual", "upload"] as const).map((tab) => {
                      const tabLocked = tab === "upload" && isBasic;
                      return (
                        <button
                          key={tab}
                          className="flex-1 min-w-0 whitespace-nowrap px-3 sm:px-5 py-2 text-[13px] sm:text-[15px] font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5"
                          style={{
                            borderBottom:
                              activeTab === tab ? "2px solid #8284bf" : "2px solid transparent",
                            color: tabLocked
                              ? "#a0aec0"
                              : activeTab === tab
                                ? "#8284bf"
                                : "#6b8097",
                            background: "transparent",
                            cursor: tabLocked ? "pointer" : "pointer",
                          }}
                          onClick={() => {
                            if (tabLocked) {
                              handleUploadLocked();
                              return;
                            }
                            setActiveTab(tab);
                          }}
                        >
                          {tabLocked && <Lock size={12} style={{ color: "#a0aec0" }} />}
                          {tab === "manual" ? "Enter Receipt Number" : "Upload Receipt Notice"}
                          {tabLocked && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "#f0f1fb",
                                color: "#8284bf",
                              }}
                            >
                              Premium
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === "manual" ? (
                    <ManualForm
                      onBack={() => setUiState("idle")}
                      onSaved={handleSaved}
                      existingRecord={savedRecord}
                      journeyId={journeyId}
                      guard={stepEntitlement.guard}
                      trackingLocked={isBasic}
                      onTrackingLocked={handleTrackingLocked}
                    />
                  ) : (
                    /* Should never reach here for Basic since tab click opens modal, but guard anyway */
                    <UploadForm
                      onBack={() => setActiveTab("manual")}
                      onSaved={handleSaved}
                      onFileVault={handleFileVault}
                      existingRecord={savedRecord}
                      journeyId={journeyId}
                      guard={stepEntitlement.guard}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Confirmation + timeline ── */}
          {savedRecord && uiState === "idle" && (
            <>
              <div
                className="rounded-2xl p-4 sm:p-6 mb-2"
                style={{ background: "#f0f1fb", border: "1.5px solid #8284bf" }}
              >
                <div className="text-[24px] mb-1 font-semibold" style={{ color: "#0c1b33" }}>
                  Receipt notice registered
                </div>
                <div className="text-[14px]" style={{ color: "#3a4f63" }}>
                  Rahvana now has the core case reference needed to monitor status changes.
                </div>
              </div>
              <div className="w-full">
                <StatusTimelinePanel record={savedRecord} />
              </div>
              {vaultDocs[RECEIPT_NOTICE_DOC_ID]?.length > 0 && (
                <div
                  className="rounded-xl px-5 py-3 mt-3 flex items-center gap-3"
                  style={{ background: "#f4f7fb", border: "1px solid #d0e4f7" }}
                >
                  <span style={{ color: "#2f6fd4", fontSize: 18 }}>📄</span>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: "#1c2b3a" }}>
                      Receipt notice saved to document vault
                    </div>
                    <div className="text-[11px]" style={{ color: "#6b8097" }}>
                      {vaultDocs[RECEIPT_NOTICE_DOC_ID].map((v) => v.file.name).join(", ")}
                      {" · "}
                      {vaultDocs[RECEIPT_NOTICE_DOC_ID][0].quality}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Guide overlay */}
          {isGuideOpen && (
            <GuideTutorialOverlay
              isOpen={isGuideOpen}
              onClose={() => setIsGuideOpen(false)}
              tutorial={guideSteps}
              index={guideStep}
              setIndex={setGuideStep}
              title={tool.title || "Receipt Notice Guide"}
            />
          )}

          {tool.footer_note && (
            <div className="mt-8 text-xs border-t pt-4" style={{ color: "#6b8097" }}>
              {tool.footer_note}
            </div>
          )}
        </div>
      </div>

      {/* ── Upgrade modal ── */}
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}
    </div>
  );
};

export default RegisterReceiptStep;
