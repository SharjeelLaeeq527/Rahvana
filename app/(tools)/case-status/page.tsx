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
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { E, msg } from "@/lib/errors";
import { useToast } from "@/app/components/shared/ToastProvider";
import { SafeHtml } from "@/app/components/shared/SafeHTML";
import { ToolLayout } from "@/components/tools/layout";

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

export const getStatusTheme = (status: string | null | undefined): StatusTheme => {
  const s = (status || "").toLowerCase();

  if (
    s.includes("approved") ||
    s.includes("produced") ||
    s.includes("mailed") ||
    s.includes("delivered")
  ) {
    return {
      label: "Approved / Complete",
      color: "text-[#2e7d32]",
      bg: "bg-[#e8f5e9]",
      border: "border-[#c8e6c9]",
      dot: "bg-[#2e7d32]",
    };
  }

  if (
    s.includes("received") ||
    s.includes("accepted") ||
    s.includes("actively reviewed") ||
    s.includes("fingerprint")
  ) {
    return {
      label: "In Progress",
      color: "text-[#3D5A80]",
      bg: "bg-[#E5EBF3]",
      border: "border-[#3D5A80]/20",
      dot: "bg-[#3D5A80]",
    };
  }

  if (
    s.includes("evidence") ||
    s.includes("request") ||
    s.includes("notice") ||
    s.includes("rfe")
  ) {
    return {
      label: "Action Required",
      color: "text-[#ed6c02]",
      bg: "bg-[#fff3e0]",
      border: "border-[#ffe0b2]",
      dot: "bg-[#ed6c02]",
    };
  }

  if (
    s.includes("denied") ||
    s.includes("rejected") ||
    s.includes("revoked") ||
    s.includes("terminated")
  ) {
    return {
      label: "Denied / Closed",
      color: "text-[#d32f2f]",
      bg: "bg-[#ffebee]",
      border: "border-[#ffcdd2]",
      dot: "bg-[#d32f2f]",
    };
  }

  return {
    label: "Case Update",
    color: "text-[#3D5A80]",
    bg: "bg-[#E5EBF3]",
    border: "border-[#3D5A80]/20",
    dot: "bg-[#3D5A80]",
  };
};

/* ─── Receipt Prefix Decoding ────────────────────────────────── */
export const decodePrefix = (receipt: string) => {
  const clean = receipt.trim().toUpperCase();
  if (clean.length < 3) return null;

  const prefix = clean.slice(0, 3);
  const center = SERVICE_CENTERS[prefix];
  if (!center) return null;

  let year: string | null = null;
  if (clean.length >= 5) {
    const yrDigits = clean.slice(3, 5);
    if (/^\d{2}$/.test(yrDigits)) {
      year = `Fiscal Year 20${yrDigits}`;
    }
  }

  return { prefix, center, year };
};

/* ─── Format input to 13-char uppercase ──────────────────────── */
export const formatReceiptInput = (value: string): string => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 13);
};

export default function USCISCaseStatusPage() {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [history, setHistory] = useState<CaseResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const parseUSCISData = useCallback(
    (data: USCISCaseStatus, receiptNum: string): CaseResult => {
      const isEs = language === "es";

      const status =
        (isEs ? data.current_case_status_text_es : data.current_case_status_text_en) ||
        data.current_case_status_text_en ||
        "";

      const description =
        (isEs ? data.current_case_status_desc_es : data.current_case_status_desc_en) ||
        data.current_case_status_desc_en ||
        "";

      const nextSteps = (data.next_case_status || []).map((item) => ({
        date: item.date,
        text:
          (isEs ? item.completed_text_es : item.completed_text_en) || item.completed_text_en || "",
      }));

      const caseHistory = (data.hist_case_status || []).map((item) => ({
        date: item.date,
        text:
          (isEs ? item.completed_text_es : item.completed_text_en) || item.completed_text_en || "",
      }));

      return {
        receiptNumber: data.receiptNumber || receiptNum,
        checkedAt: new Date().toISOString(),
        status,
        description,
        formType: data.formType || "",
        modifiedDate: data.modifiedDate || "",
        nextSteps,
        caseHistory,
        rawData: data,
      };
    },
    [language]
  );

  const fetchHistory = useCallback(async () => {
    let serverItems: CaseResult[] = [];
    try {
      const res = await fetch("/api/uscis-case-history");
      if (res.ok) {
        const json = await res.json();
        // The API returns { data: [...] }
        const records: USCISHistoryRecord[] = json.data || json.history || [];

        serverItems = records.map((r) => {
          if (r.raw_data) {
            return parseUSCISData(r.raw_data, r.receipt_number);
          }
          return {
            receiptNumber: r.receipt_number,
            checkedAt: r.checked_at,
            status: r.status || "",
            description: r.description || "",
            formType: r.form_type || "",
            modifiedDate: r.modified_date || "",
            nextSteps: [],
            caseHistory: [],
            rawData: {},
          };
        });
      }
    } catch (e) {
      console.error("Error fetching USCIS case history from server:", e);
    }

    // Also load from localStorage (support offline, unauthenticated, or legacy sessions)
    let localItems: CaseResult[] = [];
    if (typeof window !== "undefined") {
      try {
        const s = localStorage.getItem("uscis_history");
        if (s) {
          const parsedLocal = JSON.parse(s);
          if (Array.isArray(parsedLocal)) {
            localItems = parsedLocal;
          }
        }
      } catch {
        /* noop */
      }
    }

    // Merge server and local history items by receiptNumber, keeping the newest checked_at
    const historyMap = new Map<string, CaseResult>();
    [...localItems, ...serverItems].forEach((item) => {
      if (!item || !item.receiptNumber) return;
      const existing = historyMap.get(item.receiptNumber);
      if (
        !existing ||
        new Date(item.checkedAt).getTime() > new Date(existing.checkedAt).getTime()
      ) {
        historyMap.set(item.receiptNumber, item);
      }
    });

    const merged = Array.from(historyMap.values()).sort(
      (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
    );

    setHistory(merged);
  }, [parseUSCISData]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCheck = async () => {
    const normalized = formatReceiptInput(receipt);

    if (normalized.length !== 13) {
      setError({
        message: "Receipt number must be exactly 13 characters (e.g. MSC2490000001).",
      });
      return;
    }

    setLoading(true);
    setResult(null);
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

      if (!res.ok || json.error) {
        console.error("USCIS Case Status Error:", json.error ?? json);

        const errorCode = json.error?.code;
        const errorMessage = json.error?.message || msg(E.TOOL_CASE_FETCH_FAILED);

        setError({
          code: errorCode,
          message: errorMessage,
        });

        return;
      }

      const rawCaseStatus: USCISCaseStatus = json.data?.case_status ?? json.data ?? {};
      const parsed = parseUSCISData(rawCaseStatus, json.receiptNumber ?? normalized);

      setResult(parsed);
      setError(null);

      // Save to localStorage as well
      if (typeof window !== "undefined") {
        try {
          const s = localStorage.getItem("uscis_history");
          const existing: CaseResult[] = s ? JSON.parse(s) : [];
          const filtered = existing.filter((h) => h.receiptNumber !== parsed.receiptNumber);
          const next = [parsed, ...filtered].slice(0, 15);
          localStorage.setItem("uscis_history", JSON.stringify(next));
        } catch {
          /* noop */
        }
      }

      await fetchHistory();

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
    setError(null);
    setShowHistory(false);
  };

  const handleClearHistory = async () => {
    // Clear localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("uscis_history");
      } catch {
        /* noop */
      }
    }

    // Clear server history
    try {
      await fetch("/api/uscis-case-history", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error clearing USCIS case history on server:", error);
    }

    setHistory([]);
    setShowHistory(false);
    showToast("Case search history cleared.", "info");
  };

  const reset = () => {
    setReceipt("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  const decoded = decodePrefix(receipt);
  const theme = result ? getStatusTheme(result.status) : null;

  // ── Work Section (Left Column) ─────────────────────────────────────────
  const workContent = (
    <div className="flex h-full flex-col">
      {/* Kicker & Title */}
      <div className="mb-6">
        <div className="text-xs font-bold tracking-wider text-[#3D5A80] uppercase">
          Your receipt
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#16302C] sm:text-3xl">
          Check your case with USCIS
        </h2>
      </div>

      {/* Input Field and Action */}
      <div className="space-y-3">
        <label htmlFor="receipt" className="block text-sm font-semibold text-[#183b3b]">
          Receipt number <span className="text-[#db8090]">*</span>
        </label>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <FileText className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="receipt"
              ref={inputRef}
              type="text"
              value={receipt}
              onChange={(e) => {
                setReceipt(formatReceiptInput(e.target.value));
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="e.g. IOE0912345678"
              maxLength={13}
              autoComplete="off"
              className="w-full rounded-xl border border-[#c9dddd] bg-white py-3 pr-14 pl-10 font-mono text-sm font-semibold tracking-wider text-[#16302C] uppercase transition-all outline-none placeholder:font-sans placeholder:text-slate-400 placeholder:normal-case focus:border-[#3D5A80] focus:ring-3 focus:ring-[#3D5A80]/15 sm:text-base"
            />
            <span
              className={`absolute top-1/2 right-3 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                receipt.length === 13
                  ? "bg-emerald-50 font-bold text-emerald-700"
                  : "text-slate-400"
              }`}
            >
              {receipt.length}/13
            </span>
          </div>

          <button
            type="button"
            onClick={handleCheck}
            disabled={loading || receipt.length < 13}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B2B44] px-6 py-3 text-sm font-bold text-white shadow transition-all hover:bg-[#121e30] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Check
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          13 characters, printed at the top left of your Form I-797 notice
        </p>

        {/* Prefix Decoder Badge */}
        {decoded && receipt.length >= 3 && (
          <div className="mt-2 flex w-fit items-center gap-2 rounded-lg border border-[#3D5A80]/20 bg-[#E5EBF3] px-3 py-1.5 text-xs text-[#1B2B44]">
            <Building2 className="h-3.5 w-3.5 text-[#3D5A80]" />
            <span className="font-semibold">{decoded.center}</span>
            {decoded.year && <span className="font-normal text-slate-500">({decoded.year})</span>}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-5 rounded-2xl border border-[#BE211A]/20 bg-[#FBECEB] p-4 text-xs text-[#183b3b] sm:text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#BE211A]" />
              <div>
                <p className="font-bold text-[#BE211A]">USCIS Query Notice</p>
                <p className="mt-1 leading-relaxed text-slate-700">{error.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="mt-6 animate-pulse rounded-2xl border border-dashed border-[#DDD9CE] bg-[#F6F4EF]/50 p-6 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#3D5A80]" />
          <p className="mt-3 text-xs font-semibold text-slate-600">
            Querying official USCIS servers in real time...
          </p>
        </div>
      )}

      {/* Detailed Milestone History & Roadmap (when result is present) */}
      {result && !loading && (
        <div className="mt-8 space-y-6">
          {/* Case History (Completed events from USCIS) */}
          {result.caseHistory.length > 0 && (
            <div className="rounded-2xl border border-[#DDD9CE] bg-[#F6F4EF]/40 p-5">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-[#1B2B44] uppercase">
                <History className="h-4 w-4 text-[#3D5A80]" /> Completed Case Milestones
              </h4>
              <ol className="relative ml-2 space-y-3 border-l border-[#3D5A80]/25 pl-5">
                {result.caseHistory.map((event, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-2 -left-[1.65rem] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#3D5A80] text-white">
                      <Check className="h-2 w-2" strokeWidth={3} />
                    </span>
                    <div className="rounded-xl border border-[#DDD9CE]/80 bg-white p-3 shadow-2xs">
                      {event.date && (
                        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                          {event.date}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs leading-relaxed text-[#183b3b] sm:text-sm">
                        {event.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Next Steps (Roadmap Ahead) */}
          {result.nextSteps.length > 0 && (
            <div className="rounded-2xl border border-[#DDD9CE] bg-white p-5 shadow-2xs">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-[#1B2B44] uppercase">
                <ArrowUpCircle className="h-4 w-4 text-emerald-700" /> Roadmap Ahead
              </h4>
              <ol className="relative ml-2 space-y-3 border-l border-dashed border-emerald-600/30 pl-5">
                {result.nextSteps.map((step, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-2 -left-[1.65rem] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-700 text-white">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </span>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                      {step.date && (
                        <p className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                          {step.date}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs leading-relaxed font-medium text-emerald-950 sm:text-sm">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Earlier Checks Section (Option C mockup lines 417-421) */}
      <div id="earlier-checks" className="mt-8 border-t border-[#DDD9CE] pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-[#16302C] italic">
            Earlier checks
          </h3>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-xs font-medium text-[#BE211A] hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No previous searches yet.</p>
        ) : (
          <div className="divide-y divide-[#DDD9CE]/70 border-t border-b border-[#DDD9CE]/70">
            {history.slice(0, 10).map((h, idx) => {
              const ht = getStatusTheme(h.status);
              return (
                <button
                  key={`${h.receiptNumber}-${h.checkedAt || idx}`}
                  type="button"
                  onClick={() => loadHistory(h)}
                  className="group flex w-full items-center justify-between px-1 py-2.5 text-left text-xs transition-colors hover:bg-[#F6F4EF]/70 sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${ht.dot}`} />
                    <span className="font-mono font-semibold text-[#1B2B44] group-hover:text-[#3D5A80]">
                      {h.receiptNumber}
                    </span>
                    <span className="hidden text-xs text-slate-400 sm:inline">
                      {new Date(h.checkedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <b className="max-w-[180px] truncate text-right font-medium text-slate-700 sm:max-w-[240px]">
                    {h.status || "Status Unavailable"}
                  </b>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Answer / Verdict Aside (Right Column) ──────────────────────────────
  const answerContent = (
    <div className="flex h-full flex-col justify-between gap-6" aria-live="polite">
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3D5A80]" />
          <h3 className="mt-4 text-base font-semibold text-[#16302C]">Retrieving case info...</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Querying official USCIS terminal records in real-time.
          </p>
        </div>
      ) : result && theme ? (
        <div className="space-y-6">
          {/* Verdict Header (Option C line 424) */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Status from USCIS
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.bg} ${theme.color} ${theme.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                {theme.label}
              </span>
            </div>
            <h3 className="mt-2 text-2xl leading-snug font-extrabold tracking-tight text-[#16302C] sm:text-3xl">
              {result.status || "Status Unavailable"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Last updated on{" "}
              {new Date(result.modifiedDate || result.checkedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Status Breakdown Rows (Option C lines 425-429 #u-rows) */}
          <div className="divide-y divide-[#16302C]/10 border-t border-b border-[#16302C]/10 text-sm">
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Receipt</span>
              <b className="font-mono font-semibold tracking-wider text-slate-800">
                {result.receiptNumber}
              </b>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Form</span>
              <b className="font-semibold text-slate-800">
                {result.formType || "Immigration Petition"}
              </b>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">What happens next</span>
              <b className="font-semibold text-slate-800">
                NVC sends a welcome letter
                {/* {decodePrefix(result.receiptNumber)?.center || "USCIS Center"} */}
              </b>
            </div>
            {result.nextSteps.length > 0 && (
              <div className="flex items-baseline justify-between py-2.5 text-emerald-800">
                <span className="text-slate-600">What happens next</span>
                <b className="max-w-[60%] text-right font-semibold text-emerald-700">
                  {result.nextSteps[0].text}
                </b>
              </div>
            )}
          </div>

          {/* Official Description */}
          {result.description && (
            <div className="rounded-xl border border-[#3D5A80]/15 bg-white/75 p-4 text-xs leading-relaxed text-slate-700 shadow-2xs sm:text-sm">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <Info className="h-3 w-3 text-[#3D5A80]" /> Official Case Update
              </div>
              <SafeHtml
                as="div"
                html={result.description}
                className="font-medium [&_a]:text-[#3D5A80] [&_a]:underline"
              />
            </div>
          )}

          {/* Action Buttons (Option C line 430) */}
          <div className="mt-auto flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2B44] px-5 py-3 text-sm font-bold text-white shadow transition-colors hover:bg-[#121e30]"
            >
              <RefreshCcw className="h-4 w-4" />
              Check another receipt
            </button>
            <a
              href="https://egov.uscis.gov/casestatus/landing.do"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDD9CE] bg-white/80 px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-400 hover:bg-white sm:text-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on official USCIS.gov
            </a>
          </div>
        </div>
      ) : (
        /* Empty / Initial State before search */
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Status from USCIS
            </div>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[#16302C] sm:text-3xl">
              Awaiting receipt
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Enter your 13-character receipt number on the left to check case status directly with
              USCIS.
            </p>
          </div>

          <div className="divide-y divide-[#16302C]/10 border-t border-b border-[#16302C]/10 text-sm">
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Source</span>
              <b className="font-semibold text-slate-800">Official USCIS Portal</b>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Query Mode</span>
              <b className="font-semibold text-slate-800">Real-time lookup</b>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Receipt format</span>
              <b className="font-semibold text-slate-800">3 letters + 10 digits</b>
            </div>
          </div>

          <div className="rounded-xl border border-[#3D5A80]/15 bg-white/70 p-4 text-xs leading-relaxed text-slate-700 shadow-2xs sm:text-sm">
            <strong className="font-bold text-[#1B2B44]">Where to find it:</strong> Look at the top
            left of your Form I-797C Notice of Action receipt notice. Common prefixes include{" "}
            <code>IOE</code>, <code>MSC</code>, <code>EAC</code>, <code>WAC</code>, <code>LIN</code>
            , and <code>SRC</code>.
          </div>

          <div className="mt-auto pt-2">
            <a
              href="https://egov.uscis.gov/casestatus/landing.do"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDD9CE] bg-white/80 px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-400 hover:bg-white sm:text-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              USCIS.gov Case Status Portal
            </a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      theme="uscis"
      title="USCIS Case Status"
      tagline="Enter your 13-character receipt number for an instant case update with official data in real-time."
      category="Live Status Tracker"
      priceOrDuration="Free · under 1 min"
      quickAccessItem={{
        id: "case-status",
        title: "USCIS Case Status",
        href: "/case-status",
        icon_name: "FileText",
      }}
      historyAction={{
        count: history.length,
        isOpen: showHistory,
        onClick: () => {
          setShowHistory((v) => !v);
          const el = document.getElementById("earlier-checks");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        },
      }}
      rules={[
        { label: "Receipt number", value: "3 letters + 10 digits" },
        { label: "Where to find it", value: "Top left of Form I-797 notice" },
        { label: "Check frequency", value: "Once a week is recommended" },
        { label: "Service Center prefix", value: "IOE, MSC, EAC, WAC, LIN, SRC, etc." },
      ]}
      faqs={[
        {
          question: "Why has my status not changed?",
          answer:
            "USCIS updates status only when action is taken on your case. Periods of several weeks or months without change are completely normal.",
        },
        {
          question: "Is this official USCIS data?",
          answer:
            "Yes, status data is retrieved directly in real-time from official USCIS terminal records. Your search history is securely saved to your Rahvana account.",
        },
        {
          question: "What does my receipt prefix mean?",
          answer:
            "The 3-letter prefix identifies the USCIS service center processing your petition (e.g. IOE for Electronic Processing, MSC for National Benefits Center, EAC for Vermont, WAC for California).",
        },
      ]}
      sources={[
        {
          title: "USCIS Case Status Online",
          domain: "egov.uscis.gov",
          url: "https://egov.uscis.gov",
        },
        {
          title: "USCIS Historical Processing Times",
          domain: "egov.uscis.gov",
          url: "https://egov.uscis.gov/processing-times/",
        },
        {
          title: "Official USCIS Homepage",
          domain: "uscis.gov",
          url: "https://www.uscis.gov",
        },
      ]}
      disclaimer="Status data is retrieved from official USCIS portals. Rahvana is not affiliated with USCIS or the U.S. government."
      layout="split"
      answer={answerContent}
    >
      {workContent}
    </ToolLayout>
  );
}
