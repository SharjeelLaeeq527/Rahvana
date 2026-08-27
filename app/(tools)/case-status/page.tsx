"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  FileText,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Hash,
  Calendar,
  Info,
  ArrowUpCircle,
  ExternalLink,
  RefreshCcw,
  Loader2,
  ChevronDown,
  Landmark,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
// import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { E, msg } from "@/lib/errors";
import { useToast } from "@/app/components/shared/ToastProvider";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";

/* ─── USCIS API Response Structure ──────────────────────────── */
export interface USCISCaseStatus {
  receiptNumber?: string;
  formType?: string;
  submittedDate?: string;
  modifiedDate?: string;
  current_case_status_en?: string;
  current_case_status_desc_en?: string;
  current_case_status_text_es?: string;
  current_case_status_desc_es?: string;
  next_case_status?: Array<{
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
  rawData: USCISCaseStatus;
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
  return value
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 13);
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

export function parseUSCISData(raw: USCISCaseStatus, receiptNumber: string): CaseResult {
  const status = raw.current_case_status_en ?? "";
  const description = raw.current_case_status_desc_en ?? "";
  const formType = raw.formType ?? "";
  const modifiedDate = raw.modifiedDate ?? raw.submittedDate ?? "";

  const nextSteps = (raw.next_case_status ?? []).map((s) => ({
    date: s.date,
    text: s.completed_text_en ?? "",
  }));

  return {
    receiptNumber,
    checkedAt: new Date().toISOString(),
    status,
    description,
    formType,
    modifiedDate,
    nextSteps,
    rawData: raw,
  };
}

/* ─── Page Component ─────────────────────────────────────────── */
export default function CaseStatusPage() {
  const { t } = useLanguage();
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [history, setHistory] = useState<CaseResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    try {
      const s = localStorage.getItem("uscis_history");
      if (s) setHistory(JSON.parse(s));
    } catch {
      /* noop */
    }
  }, []);

  const saveHistory = (item: CaseResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.receiptNumber !== item.receiptNumber);
      const next = [item, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("uscis_history", JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const handleCheck = async () => {
    const normalized = receipt.trim().toUpperCase().replace(/[-\s]/g, "");

    // Missing receipt number
    if (!normalized) {
      showToast(
        msg(E.TOOL_CASE_MISSING_ANSWER, {
          questionLabel: "USCIS receipt number",
        }),
        "error"
      );
      return;
    }

    // Invalid receipt number length
    if (normalized.length !== 13) {
      showToast(msg(E.TOOL_CASE_RECEIPT_LENGTH), "error");
      return;
    }

    setLoading(true);
    setResult(null);

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
        console.error("Error fetching case status:", json.error ?? json);

        showToast(msg(E.TOOL_CASE_FETCH_FAILED), "error");

        return;
      }

      const rawCaseStatus: USCISCaseStatus = json.data?.case_status ?? json.data ?? {};

      const parsed = parseUSCISData(rawCaseStatus, json.receiptNumber ?? normalized);

      setResult(parsed);
      saveHistory(parsed);

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
    setShowHistory(false);
  };

  const reset = () => {
    setReceipt("");
    setResult(null);
    inputRef.current?.focus();
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
                        onClick={() => {
                          setHistory([]);
                          localStorage.removeItem("uscis_history");
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
                        value={result.modifiedDate}
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
              Searches stay on your device. We never store your receipt number on our servers.
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
