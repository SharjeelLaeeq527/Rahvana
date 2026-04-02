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
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

/* ─── USCIS API Response Structure ──────────────────────────── */
interface USCISCaseStatus {
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

interface CaseResult {
  receiptNumber: string;
  checkedAt: string;
  status: string;
  description: string;
  formType: string;
  modifiedDate: string;
  nextSteps: Array<{ date?: string; text: string }>;
  rawData: USCISCaseStatus;
}

/* ─── Service Centers ─────────────────────────────────────────── */
const SERVICE_CENTERS: Record<string, string> = {
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
type StatusTheme = {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
};

function getStatusTheme(status: string): StatusTheme {
  const s = status.toLowerCase();
  if (s.includes("approved"))
    return { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };
  if (s.includes("card was produced") || s.includes("mailed"))
    return { label: "Card Mailed", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };
  if (s.includes("denied") || s.includes("rejected") || s.includes("revoked") || s.includes("terminated"))
    return { label: "Denied", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" };
  if (s.includes("interview"))
    return { label: "Interview Scheduled", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
  if (s.includes("rfe") || s.includes("request for evidence"))
    return { label: "RFE Issued", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" };
  if (s.includes("received") || s.includes("initial review"))
    return { label: "Received", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" };
  if (s.includes("pending"))
    return { label: "Pending", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-500" };
  if (s.includes("transfer"))
    return { label: "Transferred", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" };
  return { label: "In Progress", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500" };
}

/* ─── Helpers ───────────────────────────────────────────────── */
function formatReceiptInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 13);
}

function decodePrefix(receipt: string) {
  if (receipt.length < 3) return null;
  const prefix = receipt.slice(0, 3).toUpperCase();
  const yr = receipt.slice(3, 5);
  return {
    prefix,
    center: SERVICE_CENTERS[prefix] ?? "Unknown Service Center",
    year: yr ? `FY 20${yr}` : null,
  };
}

function parseUSCISData(raw: USCISCaseStatus, receiptNumber: string): CaseResult {
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
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CaseResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("uscis_history");
      if (s) setHistory(JSON.parse(s));
    } catch { /* noop */ }
  }, []);

  const saveHistory = (item: CaseResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.receiptNumber !== item.receiptNumber);
      const next = [item, ...filtered].slice(0, 10);
      try { localStorage.setItem("uscis_history", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const handleCheck = async () => {
    const normalized = receipt.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!normalized) { setError("Please enter your USCIS receipt number."); return; }
    if (normalized.length !== 13) { setError("Receipt number must be 13 characters — 3 letters followed by 10 digits."); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/uscis-case-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptNumber: normalized }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Unable to retrieve case status. Please try again.");
        return;
      }

      const rawCaseStatus: USCISCaseStatus = json.data?.case_status ?? json.data ?? {};
      const parsed = parseUSCISData(rawCaseStatus, json.receiptNumber ?? normalized);
      setResult(parsed);
      saveHistory(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error. Please check your connection and try again.");
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

  const reset = () => { setReceipt(""); setResult(null); setError(null); inputRef.current?.focus(); };

  const decoded = decodePrefix(receipt);
  const theme = result ? getStatusTheme(result.status) : null;

  return (
    <div className="bg-linear-to-b from-primary/10 to-white site-main-px site-main-py">
      <div className="">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live Status Tracker
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-2 tracking-tight">
            USCIS Case Status
          </h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Enter your 13-character receipt number for an instant case update. Track your immigration progress with official data in real-time.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-primary/10 mb-8 mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Find My Status</h2>
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-bold transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                History ({history.length})
              </button>
            )}
          </div>

          {/* History Dropdown */}
          {showHistory && (
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Searches</span>
                <button onClick={() => { setHistory([]); localStorage.removeItem("uscis_history"); }}
                  className="text-xs text-red-500 hover:text-red-600 font-bold">Clear All</button>
              </div>
              {history.map((h) => {
                const t = getStatusTheme(h.status);
                return (
                  <button key={h.receiptNumber} onClick={() => loadHistory(h)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white transition-all border-b border-slate-100 last:border-0 text-left group">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-800 font-mono tracking-wider group-hover:text-primary transition-colors">{h.receiptNumber}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Checked {new Date(h.checkedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="receipt" className="block text-sm font-bold text-slate-700 mb-2">
                Receipt Number <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  id="receipt"
                  ref={inputRef}
                  type="text"
                  value={receipt}
                  onChange={(e) => { setReceipt(formatReceiptInput(e.target.value)); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder="e.g. MSC2490000001"
                  maxLength={13}
                  className={`w-full pl-12 pr-14 py-4 text-base font-mono font-bold rounded-xl border-2 outline-none transition-all
                    focus:ring-4 focus:ring-primary/5
                    ${error ? "border-red-300 bg-red-50/20 focus:border-red-400" : "border-slate-100 hover:border-slate-200 bg-slate-50 focus:border-primary focus:bg-white"}`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black font-mono tabular-nums px-2 py-0.5 rounded bg-white shadow-sm border
                  ${receipt.length === 13 ? "text-emerald-500 border-emerald-100" : "text-slate-400 border-slate-100"}`}>
                  {receipt.length}/13
                </span>
              </div>
              
              {/* Prefix Decoder */}
              {decoded && receipt.length >= 3 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/5 w-fit">
                  <Building2 className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[11px] font-bold text-primary tracking-tight">
                    {decoded.center} {decoded.year && <span className="text-primary/40 ml-1">({decoded.year})</span>}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheck}
              disabled={loading || receipt.length < 13}
              className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-black rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Retrieving Case Info...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Case Status
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Results Screen */}
        {result && theme && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2.5 mb-2">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Current Status</h3>
            </div>

            <div className={`bg-white rounded-2xl shadow-xl border overflow-hidden ${theme.border}`}>
              <div className={`px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme.bg} border-b ${theme.border}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 shrink-0 animate-pulse ${theme.dot}`} />
                  <div>
                    <h4 className={`text-xl md:text-2xl font-black leading-tight ${theme.color}`}>
                      {result.status || "Status Unavailable"}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" />
                      Updated {new Date(result.checkedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-black uppercase tracking-widest ${theme.bg} ${theme.color} ${theme.border}`}>
                  {theme.label}
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <ResultCell icon={<Hash className="w-4 h-4" />} label="Receipt Number" value={result.receiptNumber} mono />
                  {result.formType && <ResultCell icon={<FileText className="w-4 h-4" />} label="Form Type" value={result.formType} />}
                  {result.modifiedDate && <ResultCell icon={<Calendar className="w-4 h-4" />} label="Last Updated" value={result.modifiedDate} />}
                </div>

                {/* Case Description */}
                {result.description && (
                  <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Official Case Update
                    </h5>
                    <p className="text-[15px] font-medium text-slate-700 leading-relaxed italic">
                      "{result.description}"
                    </p>
                  </div>
                )}

                {/* Next Steps */}
                {result.nextSteps.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-primary" /> Roadmap Ahead
                    </h5>
                    <div className="space-y-3">
                      {result.nextSteps.map((step, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50 group hover:border-emerald-200 transition-all">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                          <p className="text-[15px] font-bold text-emerald-900 leading-relaxed">{step.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-50">
                  <a
                    href="https://egov.uscis.gov/casestatus/landing.do"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" /> Official USCIS Website
                  </a>
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                  >
                    <RefreshCcw className="w-4 h-4" /> Check Another Number
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm animate-pulse space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-50 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-50 rounded-xl w-full" />
              <div className="h-24 bg-slate-50 rounded-xl w-full" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-slate-50 rounded-xl" />
              <div className="h-16 bg-slate-50 rounded-xl" />
              <div className="h-16 bg-slate-50 rounded-xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCell({ label, value, icon, mono }: { label: string; value: React.ReactNode; icon: React.ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {icon} {label}
      </p>
      <p className={`text-[15px] font-extrabold text-slate-900 ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </p>
    </div>
  );
}
