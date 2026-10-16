"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  FileText,
  Clock,
  Building2,
  CheckCircle2,
  RefreshCw,
  Hash,
  Calendar,
  Info,
  ArrowUpCircle,
  History,
  Check,
  ExternalLink,
  RefreshCcw,
  Loader2,
  ChevronDown,
  Landmark,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  X,
  FileUp,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
// import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { E, msg } from "@/lib/errors";
import { useToast } from "@/app/components/shared/ToastProvider";
import FileUpload from "@/app/components/shared/FileUpload";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";

/* ─── USCIS API Response Structure ──────────────────────────── */
export interface USCISCaseStatus {
  receiptNumber?: string;
  formType?: string;
  submittedDate?: string;
  modifiedDate?: string;
  current_case_status_text_en?: string;
  current_case_status_desc_en?: string;
  current_case_status_text_es?: string;
  current_case_status_desc_es?: string;
  next_case_status?: Array<{
    date?: string;
    completed_text_en?: string;
    completed_text_es?: string;
  }>;
  hist_case_status?: Array<{
    date?: string;
    completed_text_en?: string;
    completed_text_es?: string;
  }>;
}

export interface CaseResult {
  receiptNumber: string;
  checkedAt: string;
  status: string;
  description: string;
  formType: string;
  modifiedDate: string;
  nextSteps: Array<{ date?: string | undefined; text: string }>;
  caseHistory: Array<{ date?: string | undefined; text: string }>;
  rawData: USCISCaseStatus;
}

interface USCISHistoryRecord {
  id: string;
  receipt_number: string;
  status: string | null;
  description: string | null;
  form_type: string | null;
  modified_date: string | null;
  checked_at: string;
  raw_data: USCISCaseStatus | null;
}

/* ─── Service Centers ─────────────────────────────────────────── */
export const SERVICE_CENTERS: Record<string, string> = {
  IOE: "USCIS Electronic System",
  MSC: "National Benefits Center",
  EAC: "Vermont Service Center",
  WAC: "California Service Center",
  SRC: "Texas Service Center",
  LIN: "Nebraska Service Center",
  NBC: "National Benefits Center",
  YSC: "Potomac Service Center",
  VSC: "Vermont Service Center",
  NSC: "Nebraska Service Center",
  TSC: "Texas Service Center",
  CSC: "California Service Center",
};

/* ─── Status Theme ──────────────────────────────────────────── */
export type StatusTheme = {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
};

export function getStatusTheme(status: string): StatusTheme {
  const s = status.toLowerCase();
  if (s.includes("approved"))
    return {
      label: "Approved",
      color: "text-[#2f8f83]",
      bg: "bg-[#dff1ed]",
      border: "border-[#2f8f83]/20",
      dot: "bg-[#2f8f83]",
    };
  if (s.includes("card was produced") || s.includes("mailed"))
    return {
      label: "Card Mailed",
      color: "text-[#2f8f83]",
      bg: "bg-[#dff1ed]",
      border: "border-[#2f8f83]/20",
      dot: "bg-[#2f8f83]",
    };
  if (
    s.includes("denied") ||
    s.includes("rejected") ||
    s.includes("revoked") ||
    s.includes("terminated")
  )
    return {
      label: "Denied",
      color: "text-[#db8090]",
      bg: "bg-[#f8e4e8]",
      border: "border-[#db8090]/25",
      dot: "bg-[#db8090]",
    };
  if (s.includes("interview"))
    return {
      label: "Interview Scheduled",
      color: "text-[#b7791f]",
      bg: "bg-[#fff2d9]",
      border: "border-[#b7791f]/25",
      dot: "bg-[#b7791f]",
    };
  if (s.includes("rfe") || s.includes("request for evidence"))
    return {
      label: "RFE Issued",
      color: "text-[#b7791f]",
      bg: "bg-[#fff2d9]",
      border: "border-[#b7791f]/25",
      dot: "bg-[#b7791f]",
    };
  if (s.includes("received") || s.includes("initial review"))
    return {
      label: "Received",
      color: "text-[#0d7377]",
      bg: "bg-[#e0f1f1]",
      border: "border-[#0d7377]/25",
      dot: "bg-[#0d7377]",
    };
  if (s.includes("pending"))
    return {
      label: "Pending",
      color: "text-[#0d7377]",
      bg: "bg-[#e0f1f1]",
      border: "border-[#0d7377]/25",
      dot: "bg-[#0d7377]",
    };
  if (s.includes("transfer"))
    return {
      label: "Transferred",
      color: "text-[#7a5b96]",
      bg: "bg-[#eee6f4]",
      border: "border-[#7a5b96]/25",
      dot: "bg-[#7a5b96]",
    };
  return {
    label: "In Progress",
    color: "text-[#0d7377]",
    bg: "bg-[#0d7377]/8",
    border: "border-[#0d7377]/20",
    dot: "bg-[#0d7377]",
  };
}

/* ─── Helpers ───────────────────────────────────────────────── */
export function formatReceiptInput(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const letters = cleaned.slice(0, 3).replace(/[^A-Z]/g, "");
  const numbers = cleaned.slice(3).replace(/\D/g, "").slice(0, 10);

  return `${letters}${numbers}`;
}

export function decodePrefix(receipt: string) {
  if (receipt.length < 3) return null;
  const prefix = receipt.slice(0, 3).toUpperCase();
  const yr = receipt.slice(3, 5);
  return {
    prefix,
    center: SERVICE_CENTERS[prefix] ?? "Unknown Service Center",
    year: yr ? `FY 20${yr}` : null,
  };
}

// USCIS dates come as either ISO ("2023-09-05") or US ("09-05-2023 [hh:mm:ss]").
// Normalize to a timestamp so history timelines sort correctly either way.
function parseUSCISDate(d?: string): number {
  if (!d) return 0;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(d);
  if (iso) return Date.parse(d) || 0;
  const [mm, dd, rest] = d.split("-");
  const yyyy = rest?.slice(0, 4);
  if (mm && dd && yyyy) return Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd));
  return Date.parse(d) || 0;
}

export function parseUSCISData(raw: USCISCaseStatus, receiptNumber: string): CaseResult {
  const status = raw.current_case_status_text_en ?? "";
  const description = raw.current_case_status_desc_en ?? "";
  const formType = raw.formType ?? "";
  const modifiedDate = raw.modifiedDate ?? raw.submittedDate ?? "";

  const nextSteps = (raw.next_case_status ?? []).map((s) => ({
    date: s.date,
    text: s.completed_text_en ?? "",
  }));

  // Past events, oldest first so the timeline reads down toward the present.
  const caseHistory = (raw.hist_case_status ?? [])
    .map((s) => ({
      date: s.date,
      text: s.completed_text_en ?? "",
    }))
    .sort((a, b) => parseUSCISDate(a.date) - parseUSCISDate(b.date));

  return {
    receiptNumber,
    checkedAt: new Date().toISOString(),
    status,
    description,
    formType,
    modifiedDate,
    nextSteps,
    caseHistory,
    rawData: raw,
  };
}

/* ─── Portal document upload — client-side mirror of the criteria enforced by
    lib/uscis/documentUpload.ts (kept inline so Buffer never enters the bundle) ─── */
const DOC_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];
const DOC_NAME_PATTERN = /^[A-Za-z0-9 .()_-]+$/;
const DOC_MAX_MB = 15;

/* ─── Page Component ─────────────────────────────────────────── */
export default function CaseStatusPage() {
  const { t } = useLanguage();
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [history, setHistory] = useState<CaseResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<{
    code?: number;
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/uscis-case-history");

      if (!res.ok) return;

      const json = await res.json();

      const historyItems: CaseResult[] = (json.data ?? []).map((item: USCISHistoryRecord) => {
        const raw = item.raw_data ?? {};

        return {
          receiptNumber: item.receipt_number,
          checkedAt: item.checked_at,
          status: item.status ?? "",
          description: item.description ?? "",
          formType: item.form_type ?? "",
          modifiedDate: item.modified_date ?? "",
          nextSteps: (raw.next_case_status ?? []).map((step) => ({
            date: step.date,
            text: step.completed_text_en ?? "",
          })),
          caseHistory: (raw.hist_case_status ?? [])
            .map((step) => ({
              date: step.date,
              text: step.completed_text_en ?? "",
            }))
            .sort((a, b) => parseUSCISDate(a.date) - parseUSCISDate(b.date)),
          rawData: raw,
        };
      });

      setHistory(historyItems);
    } catch (error) {
      console.error("Error loading USCIS case history:", error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCheck = async () => {
    const normalized = receipt.trim().toUpperCase();

    if (!normalized) {
      showToast(
        msg(E.TOOL_CASE_MISSING_ANSWER, {
          questionLabel: "USCIS receipt number",
        }),
        "error"
      );
      return;
    }

    if (!/^[A-Z]{3}\d{10}$/.test(normalized)) {
      showToast("Receipt number must contain 3 letters followed by 10 digits.", "error");
      return;
    }

    setLoading(true);
    setResult(null);
    // Dismiss any stale error so it never lingers next to a newer result.
    setError(null);

    try {
      const res = await fetch("/api/uscis-case-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNumber: normalized,
        }),
      });

      const json = await res.json();

      // API / USCIS request failure
      if (!res.ok || json.error) {
        console.error("USCIS Case Status Error:", json.error ?? json);

        const errorCode = json.error?.code;
        const errorMessage = json.error?.message || msg(E.TOOL_CASE_FETCH_FAILED);

        setError({
          code: errorCode,
          message: errorMessage,
        });

        // showToast(errorMessage, "error");

        return;
      }

      const rawCaseStatus: USCISCaseStatus = json.data?.case_status ?? json.data ?? {};

      const parsed = parseUSCISData(rawCaseStatus, json.receiptNumber ?? normalized);

      setResult(parsed);
      setError(null);
      await fetchHistory();

      // Success toast
      showToast("Case status retrieved successfully.", "success");
    } catch (e) {
      console.error("Network error fetching case status:", e);

      showToast(msg(E.TOOL_CASE_FETCH_FAILED), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = (item: CaseResult) => {
    setReceipt(item.receiptNumber);
    setResult(item);
    // Selecting a past receipt resolves the previous failed lookup too.
    setError(null);
    setShowHistory(false);
  };

  const reset = () => {
    setReceipt("");
    setResult(null);
    inputRef.current?.focus();
  };

  // ── Portal document submission (Base64-encoded JSON upload) ──
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docResult, setDocResult] = useState<{ ok: boolean; message: string } | null>(null);

  const clearDoc = () => {
    setDocFile(null);
    setDocResult(null);
  };

  // Shared FileUpload contract: (fieldName, file | null). We pre-flight the
  // portal criteria so obvious rejects never hit the network.
  const handleDocFile = (_fieldName: string, uploaded: File | File[] | null) => {
    setDocResult(null);
    const file = Array.isArray(uploaded) ? (uploaded[0] ?? null) : uploaded;
    if (!file) {
      setDocFile(null);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!DOC_EXTENSIONS.includes(ext)) {
      showToast("Only standard PDF, PNG, or JPEG files can be attached.", "error");
      setDocFile(null);
      return;
    }
    if (!DOC_NAME_PATTERN.test(file.name)) {
      showToast(
        "File name can only contain letters, numbers, spaces, periods, hyphens, underscores, and parentheses.",
        "error"
      );
      setDocFile(null);
      return;
    }
    if (file.size > DOC_MAX_MB * 1024 * 1024) {
      showToast(`File is too large. Maximum size is ${DOC_MAX_MB} MB.`, "error");
      setDocFile(null);
      return;
    }
    setDocFile(file);
  };

  const handleDocSubmit = async () => {
    if (!docFile) return;
    setDocBusy(true);
    setDocResult(null);

    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(docFile);
      });

      const res = await fetch("/api/uscis-case-status/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: docFile.name,
          fileType: docFile.type,
          fileContent,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.ok) {
        setDocResult({
          ok: true,
          message: `"${json.fileName}" was encoded and submitted to the USCIS portal successfully.`,
        });
        clearDoc();
      } else {
        setDocResult({
          ok: false,
          message: json?.error?.message ?? "Document submission failed. Please try again.",
        });
      }
    } catch (e) {
      console.error("Document submission error:", e);
      setDocResult({ ok: false, message: "Network error while submitting the document." });
    } finally {
      setDocBusy(false);
    }
  };

  const decoded = decodePrefix(receipt);
  const theme = result ? getStatusTheme(result.status) : null;

  return (
    <div className="guide-grid-bg mt-10 min-h-screen px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ─────────────────────────────────── */}
        <div className="min-w-0">
          {/* Header */}
          <header className="mb-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0d7377]/15 bg-[#E0F8FE] px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[#157674] uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0d7377]/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0d7377]" />
              </span>
              Live Status Tracker
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-[#00595C] md:text-5xl">
                USCIS Case Status
              </h1>

              <QuickAccessButton
                item={{
                  id: "case-status",
                  title: "USCIS Case Status",
                  href: "/case-status",
                  icon_name: "FileText",
                }}
                mode="icon"
              />
            </div>

            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5f7777]">
              Enter your 13-character receipt number for an instant case update. Track your
              immigration progress with official data in real-time.
            </p>
          </header>

          {/* Search Card */}
          <section className="rounded-3xl bg-[#ffffff] p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-[#183b3b]">
                Find My Status
              </h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  aria-expanded={showHistory}
                  aria-controls="search-history"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0d7377]/15 bg-[#0d7377]/5 px-3 py-1.5 text-xs font-semibold text-[#087890] transition-colors hover:bg-[#0d7377]/10"
                >
                  <Clock className="h-3.5 w-3.5" />
                  History ({history.length})
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* History (collapsible, closed by default) */}
            {history.length > 0 && (
              <div
                id="search-history"
                className={`grid transition-all duration-300 ease-out ${
                  showHistory ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="rounded-2xl border border-[#c9dddd] bg-[#FFFFFF]">
                    <div className="flex items-center justify-between border-b border-[#c9dddd] px-4 py-2.5">
                      <span className="text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/uscis-case-history", {
                              method: "DELETE",
                            });

                            if (!res.ok) {
                              showToast("Failed to clear case history.", "error");
                              return;
                            }

                            setHistory([]);
                            setShowHistory(false);
                          } catch (error) {
                            console.error("Error clearing USCIS case history:", error);
                            showToast("Failed to clear case history.", "error");
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#BE211A] transition-opacity hover:opacity-75"
                      >
                        <Trash2 className="h-3 w-3" /> Clear All
                      </button>
                    </div>
                    {history.map((h) => {
                      const ht = getStatusTheme(h.status);
                      return (
                        <button
                          type="button"
                          key={h.receiptNumber}
                          onClick={() => loadHistory(h)}
                          className="group flex w-full items-center justify-between border-b border-[#c9dddd] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#ffffff]"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${ht.dot}`} />
                            <div>
                              <p className="font-mono text-sm font-semibold tracking-wider text-[#183b3b] transition-colors group-hover:text-[#0d7377]">
                                {h.receiptNumber}
                              </p>
                              <p className="text-[11px] text-[#5f7777]">
                                Checked {new Date(h.checkedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase sm:inline-flex ${ht.bg} ${ht.color} ${ht.border}`}
                          >
                            {ht.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="receipt"
                  className="mb-2 block text-sm font-semibold text-[#183b3b]"
                >
                  Receipt Number <span className="text-[#db8090]">*</span>
                </label>
                <div className="group relative">
                  <FileText className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-[#5f7777] transition-colors group-focus-within:text-[#0d7377]" />
                  <input
                    id="receipt"
                    ref={inputRef}
                    type="text"
                    value={receipt}
                    onChange={(e) => {
                      setReceipt(formatReceiptInput(e.target.value));
                      // Revising the receipt invalidates the prior failed lookup.
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                    placeholder="e.g. MSC2490000001"
                    maxLength={13}
                    className="w-full rounded-2xl border border-[#c9dddd] py-4 pr-16 pl-12 font-mono text-[15px] font-semibold tracking-wide transition-all outline-none placeholder:font-sans placeholder:font-normal placeholder:text-[#5f7777] hover:border-[#0d7377]/25 focus:border-[#0d7377] focus:ring-4 focus:ring-[#0d7377]/10"
                  />
                  <span
                    className={`absolute top-1/2 right-4 -translate-y-1/2 rounded-md border bg-[#ffffff] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                      receipt.length === 13
                        ? "border-[#2f8f83]/25 text-[#2f8f83]"
                        : "border-[#c9dddd] text-[#5f7777]"
                    }`}
                  >
                    {receipt.length}/13
                  </span>
                </div>

                {/* Prefix Decoder */}
                {decoded && receipt.length >= 3 && (
                  <div className="mt-3 flex w-fit items-center gap-2 rounded-xl border border-[#0d7377]/12 bg-[#EFF4FF] px-3 py-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#0d7377]" />
                    <span className="text-[11px] font-semibold tracking-tight text-[#0d7377]">
                      {decoded.center}
                      {decoded.year && (
                        <span className="ml-1.5 font-normal text-[#89a4a0]">({decoded.year})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheck}
                disabled={loading || receipt.length < 13}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0D7377] px-8 py-4 text-sm font-semibold tracking-wide text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Retrieving Case Info...
                  </>
                ) : (
                  <>
                    <Search className="h-4.5 w-4.5" />
                    Check Case Status
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Loading Skeleton */}
          {loading && (
            <div className="surface-card mt-8 animate-pulse space-y-6 rounded-3xl p-8">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#edf5f4]" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-4 w-1/3 rounded bg-[#edf5f4]" />
                  <div className="h-3 w-1/4 rounded bg-[#edf5f4]/70" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-10 w-full rounded-xl bg-[#edf5f4]/70" />
                <div className="h-24 w-full rounded-xl bg-[#edf5f4]/70" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 rounded-xl bg-[#edf5f4]/70" />
                <div className="h-16 rounded-xl bg-[#edf5f4]/70" />
                <div className="h-16 rounded-xl bg-[#edf5f4]/70" />
              </div>
            </div>
          )}

          {/* Results */}
          {result && theme && !loading && (
            // <ResultGate feature="dq_status_check">
            <section className="mt-8 overflow-hidden rounded-3xl border border-[#0d7377]/10 bg-[#ffffff] shadow-[0_12px_32px_rgba(13,115,119,0.12)]">
              <div
                className={`flex flex-col gap-4 border-b px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8 ${theme.bg} ${theme.border}`}
              >
                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full border bg-[#ffffff]/70 px-3.5 py-1.5 text-xs font-semibold ${theme.color} ${theme.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                  {theme.label}
                </span>
                <div className="md:text-right">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
                    Status Date
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#183b3b] md:justify-end">
                    <RefreshCw className="h-3.5 w-3.5 text-[#89a4a0]" />
                    {new Date(result.checkedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-8 p-6 md:p-8">
                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-6 border-b border-[#c9dddd] pb-7 sm:grid-cols-2 md:grid-cols-3">
                  <ResultCell
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Receipt Number"
                    value={result.receiptNumber}
                    mono
                  />
                  {result.formType && (
                    <ResultCell
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Form Type"
                      value={result.formType}
                    />
                  )}
                  {result.modifiedDate && (
                    <ResultCell
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="Last Updated"
                      value={new Date(result.modifiedDate).toLocaleString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    />
                  )}
                  {decodePrefix(result.receiptNumber) && (
                    <ResultCell
                      icon={<Building2 className="h-3.5 w-3.5" />}
                      label="Service Center"
                      value={decodePrefix(result.receiptNumber)!.center}
                    />
                  )}
                  {result.rawData.submittedDate && (
                    <ResultCell
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Submitted"
                      value={result.rawData.submittedDate}
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-[#0d7377]">
                    {result.status || "Status Unavailable"}
                  </h3>

                  {/* Case Description */}
                  {result.description && (
                    <div className="mt-4 rounded-2xl border border-[#0d7377]/10 bg-[#EFF4FF] p-5 md:p-6">
                      <h4 className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
                        <Info className="h-3.5 w-3.5" /> Official Case Update
                      </h4>
                      <p className="text-[15px] leading-relaxed text-[#183b3b]/80 italic">
                        &ldquo;{result.description}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Case History — completed USCIS events (hist_case_status) */}
                {result.caseHistory.length > 0 && (
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
                      <History className="h-3.5 w-3.5 text-[#0d7377]" /> Case History
                    </h4>
                    <ol className="relative space-y-3 border-l border-[#0d7377]/20 pl-6">
                      {result.caseHistory.map((event, i) => (
                        <li key={i} className="relative">
                          <span className="absolute top-3.5 -left-[1.9rem] flex h-4 w-4 items-center justify-center rounded-full border border-[#0d7377]/25 bg-[#0d7377]">
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          </span>
                          <div className="rounded-2xl border border-[#c9dddd] bg-[#ffffff] p-4 transition-colors hover:bg-[#edf5f4]/30">
                            {event.date && (
                              <p className="mb-1 text-[11px] font-semibold tracking-wider text-[#89a4a0] uppercase">
                                {event.date}
                              </p>
                            )}
                            <p className="text-[14px] leading-relaxed text-[#183b3b]/85">
                              {event.text}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Next Steps */}
                {result.nextSteps.length > 0 && (
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
                      <ArrowUpCircle className="h-3.5 w-3.5 text-[#0d7377]" /> Roadmap Ahead
                    </h4>
                    <ol className="relative space-y-3 border-l border-dashed border-[#0d7377]/25 pl-6">
                      {result.nextSteps.map((step, i) => (
                        <li key={i} className="relative">
                          <span className="absolute top-3.5 -left-[1.9rem] flex h-4 w-4 items-center justify-center rounded-full border border-[#0d7377]/25 bg-[#ffffff]">
                            <CheckCircle2 className="h-3 w-3 text-[#0d7377]" />
                          </span>
                          <div className="rounded-2xl border border-[#c9dddd] bg-[#edf5f4]/40 p-4">
                            {step.date && (
                              <p className="mb-1 text-[11px] font-semibold tracking-wider text-[#89a4a0] uppercase">
                                {step.date}
                              </p>
                            )}
                            <p className="text-[15px] leading-relaxed font-medium text-[#183b3b]">
                              {step.text}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap gap-3 border-t border-[#c9dddd] pt-7">
                  <a
                    href="https://egov.uscis.gov/casestatus/landing.do"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0d7377]/15 bg-[#0d7377]/5 px-5 py-2.5 text-sm font-semibold text-[#0d7377] transition-colors hover:bg-[#0d7377]/10 active:scale-[0.98]"
                  >
                    <ExternalLink className="h-4 w-4" /> Official USCIS Website
                  </a>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#c9dddd] bg-[#edf5f4]/50 px-5 py-2.5 text-sm font-semibold text-[#5f7777] transition-colors hover:bg-[#edf5f4] active:scale-[0.98]"
                  >
                    <RefreshCcw className="h-4 w-4" /> Check Another Number
                  </button>
                </div>
              </div>
            </section>
            // </ResultGate>
          )}

          {/* Error — styled to the page's card system (red-semantic, same anatomy as Results) */}
          {error && (
            <section
              role="alert"
              className="mt-8 overflow-hidden rounded-3xl border border-[#BE211A]/15 bg-[#ffffff] shadow-[0_12px_32px_rgba(190,33,26,0.08)]"
            >
              {/* Header strip */}
              <div className="flex items-center justify-between gap-4 border-b border-[#BE211A]/15 bg-[#FBECEB] px-6 py-5 md:px-8">
                <div className="flex items-center gap-3.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#BE211A]/15 bg-[#ffffff] text-[#BE211A]">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-[#BE211A]/70 uppercase">
                      Request Failed
                    </p>
                    <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-[#183b3b]">
                      USCIS Case Status Error
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* {error.code && (
                    <span className="hidden rounded-md border border-[#BE211A]/20 bg-[#ffffff]/70 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#BE211A] tabular-nums sm:inline-flex">
                      Error {error.code}
                    </span>
                  )} */}
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#BE211A]/60 transition-colors hover:bg-[#BE211A]/10 hover:text-[#BE211A]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-5 p-6 md:p-8">
                <div className="rounded-2xl border border-[#BE211A]/10 bg-[#FDF6F5] p-5">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
                    Details
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed font-medium text-[#183b3b]/85">
                    {error.message}
                  </p>
                  {error.code && (
                    <p className="mt-2 font-mono text-[11px] tracking-wider text-[#BE211A]/80 sm:hidden">
                      Error code: {error.code}
                    </p>
                  )}
                </div>

                {/* Footer Controls — same chip language as the results card */}
                <div className="flex flex-wrap gap-3 border-t border-[#c9dddd] pt-6">
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={loading || receipt.length < 13}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0D7377] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0a5a5d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </button>
                  <a
                    href="https://egov.uscis.gov/casestatus/landing.do"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0d7377]/15 bg-[#0d7377]/5 px-5 py-2.5 text-sm font-semibold text-[#0d7377] transition-colors hover:bg-[#0d7377]/10 active:scale-[0.98]"
                  >
                    <ExternalLink className="h-4 w-4" /> Check on USCIS.gov
                  </a>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#c9dddd] bg-[#edf5f4]/50 px-5 py-2.5 text-sm font-semibold text-[#5f7777] transition-colors hover:bg-[#edf5f4] active:scale-[0.98]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </section>
          )}
          {/* Attach a Document — USCIS portal encoded file upload
          <section className="mt-8 rounded-3xl bg-[#ffffff] p-6 md:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-[#183b3b]">
              Attach a Document
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f7777]">
              Submit a supporting document for your case. The file is Base64-encoded and sent as
              JSON, per the official USCIS Developer Portal upload specification.
            </p>

            File picker — shared uploader (drag & drop / browse / remove)
            <div className="mt-5">
              <FileUpload
                fieldName="uscis-doc"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple={false}
                height="170px"
                variant="default"
                title="Drag & drop your document here"
                description="or choose a file from your device"
                buttonText="Browse files"
                helperText={`PDF, PNG or JPEG · Max ${DOC_MAX_MB} MB · No password-protected files`}
                onFileUpload={handleDocFile}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDocSubmit}
                disabled={!docFile || docBusy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D7377] px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {docBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting Document...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" /> Encode &amp; Submit Document
                  </>
                )}
              </button>
            </div>

            Outcome banner — success/teal or failure/red, page card language
            {docResult && (
              <div
                role="status"
                className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
                  docResult.ok
                    ? "border-[#2f8f83]/20 bg-[#dff1ed]"
                    : "border-[#BE211A]/15 bg-[#FBECEB]"
                }`}
              >
                {docResult.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2f8f83]" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#BE211A]" />
                )}
                <p
                  className={`text-sm leading-relaxed font-medium ${
                    docResult.ok ? "text-[#183b3b]" : "text-[#7a1712]"
                  }`}
                >
                  {docResult.message}
                </p>
              </div>
            )}
          </section> */}
        </div>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="space-y-5 lg:pt-[8.5rem]">
          <div className="rounded-3xl border border-[#0d7377]/10 bg-[#EFF4FF] p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#0d7377]/15 bg-[#ffffff] text-[#0d7377]">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-[#183b3b]">
              Where to find your Receipt Number
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5f7777]">
              Your 13-character receipt number can be found on notices of action USCIS has sent you.
              It begins with three letters such as EAC, WAC, LIN, SRC, NBC, MSC or IOE.
            </p>
            <div className="mt-4 rounded-xl border border-[#0d7377]/10 bg-[#ffffff] px-4 py-3 text-center font-mono text-xs tracking-[0.2em] text-[#5f7777]">
              XXX-00-000-00000
            </div>
          </div>

          <div className="rounded-3xl border border-[#0d7377]/10 bg-[#EFF4FF] p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183b3b]">
              <Landmark className="h-4 w-4 text-[#0d7377]" /> Official Resources
            </h3>
            <div className="mt-4 space-y-3">
              <a
                href="https://www.uscis.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-[#0d7377] transition-opacity hover:opacity-75"
              >
                Visit uscis.gov <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://egov.uscis.gov/processing-times/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-[#0d7377] transition-opacity hover:opacity-75"
              >
                Processing Times <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-3xl border border-[#c9dddd] bg-[#ffffff]/60 p-5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#89a4a0]" />
            <p className="text-xs leading-relaxed text-[#5f7777]">
              Your case history is securely saved to your Rahvana account so you can access your
              recent searches across devices.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResultCell({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[#5f7777] uppercase">
        {icon} {label}
      </p>
      <p
        className={`text-[15px] font-semibold text-[#183b3b] ${mono ? "font-mono tracking-wider" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
