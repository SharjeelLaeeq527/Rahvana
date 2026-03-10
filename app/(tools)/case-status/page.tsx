"use client";

import { useState, useEffect, useRef } from "react";

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

/* ─── SVG Icons ──────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const DocIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ExtIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ErrIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ─── Page Component ─────────────────────────────────────────── */
export default function CaseStatusPage() {
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

      // Parse the actual USCIS fields
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #08494c 0%, #0d7377 55%, #15979d 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: "radial-gradient(ellipse 700px 400px at 80% 50%, rgba(255,255,255,0.06), transparent)" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-14 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-white/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Status Tracker
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            USCIS Case Status
          </h1>
          <p className="text-[15px] text-white/60 max-w-xl mx-auto leading-relaxed">
            Enter your receipt number for an instant case update. Track your immigration progress in real-time.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-5 pb-16 space-y-5">

        {/* ── Search Card ── */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 mt-10">
          <div className="p-6 sm:p-8">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 ">Enter Receipt Number</h2>
                <p className="text-xs text-slate-400 mt-1">3 letters + 10 digits · e.g. MSC2490000001</p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                >
                  <ClockIcon />
                  Recent ({history.length})
                </button>
              )}
            </div>

            {/* Recent panel */}
            {showHistory && (
              <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Searches</span>
                  <button onClick={() => { setHistory([]); localStorage.removeItem("uscis_history"); }}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold">Clear</button>
                </div>
                {history.map((h) => {
                  const t = getStatusTheme(h.status);
                  return (
                    <button key={h.receiptNumber} onClick={() => loadHistory(h)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 text-left">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 font-mono tracking-wider">{h.receiptNumber}</p>
                          <p className="text-xs text-slate-400">{new Date(h.checkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${t.bg} ${t.color} ${t.border}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input + Button */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><DocIcon /></span>
                <input
                  ref={inputRef}
                  type="text"
                  value={receipt}
                  onChange={(e) => { setReceipt(formatReceiptInput(e.target.value)); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder="e.g. MSC2490000001"
                  maxLength={13}
                  spellCheck={false}
                  autoComplete="off"
                  className={`w-full pl-12 pr-14 py-4 text-[15px] font-mono rounded-xl border-2 outline-none transition-all
                    focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10
                    ${error ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-slate-300 bg-slate-50"}`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold tabular-nums
                  ${receipt.length === 13 ? "text-emerald-500" : "text-slate-400"}`}>
                  {receipt.length}/13
                </span>
              </div>
              <button
                onClick={handleCheck}
                disabled={loading || receipt.length === 0}
                className="px-6 py-4 rounded-xl font-bold text-white text-sm
                  bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                  shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Checking
                  </>
                ) : (
                  <><SearchIcon /> Check</>
                )}
              </button>
            </div>

            {/* Prefix decoder */}
            {decoded && receipt.length >= 3 && (
              <p className="mt-2.5 text-xs text-slate-500">
                <span className="font-bold font-mono text-teal-700">{decoded.prefix}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                {decoded.center}
                {decoded.year && <span className="text-slate-400 ml-1.5">({decoded.year})</span>}
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <ErrIcon />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Skeleton ── */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-pulse">
            <div className="flex gap-4 mb-6">
              <div className="w-3 h-3 rounded-full bg-slate-200 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/5" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-2.5 mb-6">
              <div className="h-3 bg-slate-100 rounded" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <div className="h-3 bg-slate-100 rounded w-4/6" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {!loading && result && theme && (
          <div
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${theme.border}`}
            style={{ animation: "slideUp .35s ease both" }}
          >
            {/* Status bar */}
            <div className={`px-6 sm:px-8 py-5 flex items-start justify-between gap-4 ${theme.bg} border-b ${theme.border}`}>
              <div className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${theme.dot}`} />
                <div>
                  <p className={`text-base font-bold leading-snug ${theme.color}`}>
                    {result.status || "Status Unavailable"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Retrieved{" "}
                    {new Date(result.checkedAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${theme.bg} ${theme.color} ${theme.border}`}>
                {theme.label}
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                <InfoCell label="Receipt Number" value={<span className="font-mono tracking-wider">{result.receiptNumber}</span>} />
                {result.formType && <InfoCell label="Form Type" value={result.formType} />}
                {(() => {
                  const d = decodePrefix(result.receiptNumber);
                  return d ? <InfoCell label="Service Center" value={d.center} /> : null;
                })()}
                {result.modifiedDate && (
                  <InfoCell label="Last Updated" value={result.modifiedDate} />
                )}
              </div>

              {/* Case update description */}
              {result.description && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Case Update</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.description}</p>
                </div>
              )}

              {/* Next steps */}
              {result.nextSteps.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What Happens Next</p>
                  <div className="space-y-2">
                    {result.nextSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-teal-50 border border-teal-100">
                        <span className="text-teal-600 mt-0.5 shrink-0"><CheckCircleIcon /></span>
                        <p className="text-sm text-teal-800 leading-relaxed">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                <a
                  href="https://egov.uscis.gov/casestatus/landing.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                >
                  <ExtIcon /> View on USCIS.gov
                </a>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <RefreshIcon /> Check Another
                </button>
              </div>
            </div>
          </div>
        )}



      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
