// // components/RegisterReceiptStep.tsx
// import React, { useState, useEffect, useCallback } from "react";
// import { Globe } from "lucide-react";
// import { GuideTutorialOverlay } from "./GuideTutorialOverlays";
// import {
//   fmtDate,
//   fmtDateTime,
//   buildTimelineItems,
//   type ReceiptRecord,
//   type RegisterReceiptPayload,
//   type RegisterReceiptError,
// } from "@/lib/register-receipt";

// // ─── Tiny SVG helpers ──────────────────────────────────────────────────────────

// const CheckIcon = () => (
//   <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#15744f" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="20 6 9 17 4 12" />
//   </svg>
// );
// const BookIcon = () => (
//   <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#4a2d8a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
//     <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
//   </svg>
// );
// const ArrowRight = () => (
//   <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
//     <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
//   </svg>
// );

// // ─── Status Timeline (always-visible inline block) ─────────────────────────────

// const StatusTimelinePanel: React.FC<{ record: ReceiptRecord }> = ({ record }) => {
//   const items = buildTimelineItems(record);

//   const summaryCards = [
//     { k: "Receipt Number",    v: record.receiptNumber },
//     { k: "Tracking",          v: "Enabled" },
//     { k: "Notice Date",       v: record.noticeDate   ? fmtDate(record.noticeDate)   : "Not provided" },
//     { k: "Priority Date",     v: record.priorityDate ? fmtDate(record.priorityDate) : "Not provided" },
//     { k: "Last Known Status", v: record.lastKnownStatus },
//     { k: "Last Checked",      v: fmtDateTime(record.lastCheckedAt) },
//   ];

//   return (
//     <div
//       className="w-full rounded-2xl overflow-hidden flex flex-col mt-6"
//       style={{
//         background: "#28151c",
//         border: "1.5px solid #c0596a",
//         boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
//       }}
//     >
//       {/* HEADER */}
//       <div className="px-6 py-4" style={{ borderBottom: "1px solid #c0596a33" }}>
//         <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#c0596a" }}>
//           Post-Filing Checkpoint
//         </div>
//         <div className="text-[18px] font-semibold text-white">
//           Receipt Registered · Status Timeline
//         </div>
//       </div>

//       {/* BODY */}
//       <div className="px-6 py-5">

//         {/* Summary cards — values pulled directly from record */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
//           {summaryCards.map(({ k, v }) => (
//             <div
//               key={k}
//               className="rounded-xl p-3"
//               style={{ background: "#3a2328", border: "1px solid #c0596a55" }}
//             >
//               <div className="text-[10px] font-bold uppercase tracking-wider mb-1"
//                 style={{ color: "#c0596a99" }}>
//                 {k}
//               </div>
//               <div className="text-[13px] font-semibold text-white">
//                 {v}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="h-px mb-5" style={{ background: "#c0596a33" }} />

//         {/* Timeline items */}
//         <div className="flex flex-col gap-2">
//           {items.map((item, i) => (
//             <div
//               key={i}
//               className="flex gap-3 items-start rounded-xl p-3"
//               style={{ background: "#3a2328", border: "1px solid #c0596a55" }}
//             >
//               <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
//                 style={{ background: "#c0596a" }} />
//               <div>
//                 <div className="text-[13px] font-bold text-white">{item.title}</div>
//                 <div className="text-[12px] text-white/60">{item.sub}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ─────────────────────────────────────────────────────────────
//    API CALL
// ───────────────────────────────────────────────────────────── */

// async function postReceipt(
//   payload: RegisterReceiptPayload
// ): Promise<{ record: ReceiptRecord | null; error: string }> {
//   try {
//     const res = await fetch("/api/receipt/register", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const data = await res.json();

//     if (!res.ok || "error" in data) {
//       return { record: null, error: data.error ?? "Failed to save receipt." };
//     }

//     // DB column → UI field mapping
//     const record: ReceiptRecord = {
//       receiptNumber:    data.receipt_number,
//       noticeDate:       data.notice_date,
//       priorityDate:     data.priority_date,
//       caseLabel:        data.case_label,
//       source:           data.source,
//       trackingEnabled:  data.tracking_enabled,
//       lastKnownStatus:  data.last_known_status,
//       lastCheckedAt:    data.last_checked_at,
//       savedAt:          data.saved_at,
//     };

//     return { record, error: "" };
//   } catch {
//     return { record: null, error: "Network error — please try again." };
//   }
// }
// async function fetchReceipt(_receiptNumber: string) {
//   try {
//     const res = await fetch(`/api/receipt/me`); // ← placeholder segment, ignored server-side
//     const data = await res.json();

//     if (!res.ok || data.error) {
//       return { record: null, error: data.error || "Failed to fetch receipt" };
//     }

//     const record: ReceiptRecord = {
//       receiptNumber:   data.receipt_number,
//       noticeDate:      data.notice_date,
//       priorityDate:    data.priority_date,
//       caseLabel:       data.case_label,
//       source:          data.source,
//       trackingEnabled: data.tracking_enabled,
//       lastKnownStatus: data.last_known_status,
//       lastCheckedAt:   data.last_checked_at,
//       savedAt:         data.saved_at,
//     };

//     return { record, error: "" };
//   } catch {
//     return { record: null, error: "Network error while fetching receipt" };
//   }
// }
// // ─── Shared error banner ───────────────────────────────────────────────────────

// const ErrorBanner: React.FC<{ message: string }> = ({ message }) =>
//   message ? (
//     <div className="rounded-lg p-3 text-[13px] mb-4" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>
//       {message}
//     </div>
//   ) : null;

// // ─── Manual entry form ─────────────────────────────────────────────────────────

// interface ManualFormProps { onBack: () => void; onSaved: (r: ReceiptRecord) => void; }

// const ManualForm: React.FC<ManualFormProps> = ({ onBack, onSaved }) => {
//   const [fields, setFields] = useState({ receiptNumber: "", noticeDate: "", priorityDate: "", caseLabel: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
//     setFields((f) => ({ ...f, [k]: e.target.value }));

//   const focusBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#c0596a");
//   const blurBorder   = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#d0e4f7");

//   async function handleSubmit() {
//     setLoading(true); setError("");
//     const { record, error: err } = await postReceipt({ ...fields, source: "manual" });
//     setLoading(false);
//     if (err) { setError(err); return; }
//     if (record) onSaved(record); // ← passes record up; parent handles state transition
//   }

//   return (
//     <div className="rounded-2xl p-8 md:p-10 mb-6" style={{ background: "#fff", border: "1.5px solid rgba(192,89,106,0.4)" }}>
//       <div className="text-[22px] mb-2 font-semibold" style={{ color: "#28151c" }}>Register the receipt notice</div>
//       <div className="text-[14px] mb-6" style={{ color: "#28151c" }}>
//         Enter the receipt number and dates exactly as they appear on your USCIS notice.
//       </div>
//       <ErrorBanner message={error} />
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
//         <div className="md:col-span-2 flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Receipt Number</label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             placeholder="IOE1234567890" maxLength={13} value={fields.receiptNumber}
//             onChange={set("receiptNumber")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//         <div className="flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Notice Date</label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             type="date" value={fields.noticeDate} onChange={set("noticeDate")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//         <div className="flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Priority Date</label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             type="date" value={fields.priorityDate} onChange={set("priorityDate")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//         <div className="md:col-span-2 flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>
//             Case Label <span className="normal-case font-normal">(optional)</span>
//           </label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             placeholder="IR-1 I-130 · March 2026 filing" value={fields.caseLabel}
//             onChange={set("caseLabel")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//       </div>
//       <div className="rounded-lg p-3 text-[13px] mb-5" style={{ background: "#fbeaec", border: "1px solid rgba(192,89,106,0.3)", color: "#28151c" }}>
//         Always confirm the receipt number before saving — it is the primary key used for case tracking.
//       </div>
//       <div className="flex gap-2">
//         <button className="px-5 py-2 rounded-full text-[14px] font-semibold" style={{ background: "#fff", border: "1.5px solid #c0596a", color: "#c0596a" }}
//           onClick={onBack} disabled={loading}>Back</button>
//         <button className="px-5 py-2 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
//           style={{ background: "#c0596a" }} onClick={handleSubmit} disabled={loading}
//           onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#a13e4e")}
//           onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#c0596a")}>
//           {loading ? "Saving…" : "Save Receipt & Enable Tracking"}
//         </button>
//       </div>
//     </div>
//   );
// };

// // ─── Upload form ───────────────────────────────────────────────────────────────

// interface UploadFormProps { onBack: () => void; onSaved: (r: ReceiptRecord) => void; }

// const UploadForm: React.FC<UploadFormProps> = ({ onBack, onSaved }) => {
//   const [uploadFile, setUploadFile] = useState<File | null>(null);
//   const [fields, setFields] = useState({ receiptNumber: "", noticeDate: "", priorityDate: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
//     setFields((f) => ({ ...f, [k]: e.target.value }));

//   const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#c0596a");
//   const blurBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#d0e4f7");

//   async function handleSubmit() {
//     setLoading(true); setError("");
//     const { record, error: err } = await postReceipt({ ...fields, source: "upload" });
//     setLoading(false);
//     if (err) { setError(err); return; }
//     if (record) onSaved(record); // ← passes record up; parent handles state transition
//   }

//   return (
//     <div className="rounded-2xl p-8 md:p-10 mb-6" style={{ background: "#fff", border: "1.5px solid rgba(192,89,106,0.4)" }}>
//       <div className="text-[22px] mb-2 font-semibold" style={{ color: "#28151c" }}>Upload receipt notice</div>
//       <div className="text-[14px] mb-6" style={{ color: "#28151c" }}>
//         Upload your notice file, then confirm the key details below before saving.
//       </div>
//       <ErrorBanner message={error} />
//       <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "#6b8097" }}>
//         Receipt Notice File
//       </label>
//       <div className="flex items-center gap-3 mb-4">
//         <input type="file" accept=".pdf,.png,.jpg,.jpeg" id="receipt-upload-input" className="hidden"
//           onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
//         <label htmlFor="receipt-upload-input" className="px-4 py-2 rounded-lg text-[14px] font-semibold cursor-pointer"
//           style={{ background: "#fbeaec", border: "1px solid rgba(192,89,106,0.4)", color: "#c0596a" }}>
//           Choose File
//         </label>
//         <span className="text-[13px]" style={{ color: "#6b8097" }}>
//           {uploadFile ? uploadFile.name : "No file chosen"}
//         </span>
//       </div>
//       <div className="rounded-lg p-3 mb-5 text-[13px]" style={{ background: "#f4f7fb", border: "1px solid #d0e4f7", color: "#3a4f63" }}>
//         Accepted formats: PDF, PNG, JPG. Confirm the receipt number and dates below before saving.
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
//         <div className="md:col-span-2 flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Confirm Receipt Number</label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             placeholder="IOE1234567890" maxLength={13} value={fields.receiptNumber}
//             onChange={set("receiptNumber")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//         <div className="flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Notice Date</label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             type="date" value={fields.noticeDate} onChange={set("noticeDate")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//         <div className="flex flex-col gap-1">
//           <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Priority Date</label>
//           <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
//             type="date" value={fields.priorityDate} onChange={set("priorityDate")} onFocus={focusBorder} onBlur={blurBorder} />
//         </div>
//       </div>
//       <div className="rounded-lg p-3 text-[13px] mb-5" style={{ background: "#fbeaec", border: "1px solid rgba(192,89,106,0.3)", color: "#28151c" }}>
//         Always confirm the receipt number with the user before turning on tracking. Upload parsing can help, but values should never be saved silently without review.
//       </div>
//       <div className="flex gap-2 justify-end">
//         <button className="px-5 py-2 rounded-full text-[14px] font-semibold" style={{ background: "#fff", border: "1.5px solid #c0596a", color: "#c0596a" }}
//           onClick={onBack} disabled={loading}>Back</button>
//         <button className="px-5 py-2 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
//           style={{ background: "#c0596a" }} onClick={handleSubmit} disabled={loading}
//           onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#a13e4e")}
//           onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#c0596a")}>
//           {loading ? "Saving…" : "Save Receipt & Enable Tracking"}
//         </button>
//       </div>
//     </div>
//   );
// };

// // ─── Main component ────────────────────────────────────────────────────────────

// type UiState = "waiting" | "register" | "tracked";
// type TabMode  = "manual"  | "upload";

// const RegisterReceiptStep: React.FC<any> = ({ tool }) => {
//   const [uiState,     setUiState]     = useState<UiState>("waiting");
//   const [activeTab,   setActiveTab]   = useState<TabMode>("manual");
//   const [savedRecord, setSavedRecord] = useState<ReceiptRecord | null>(null);
//   const [isGuideOpen, setIsGuideOpen] = useState(false);
//   const [guideStep,   setGuideStep]   = useState(0);
//   const [guideSteps,  setGuideSteps]  = useState<any[]>([]);

//   useEffect(() => {
//     import("@/data/receipt-guide-steps.json").then((mod) => {
//       setGuideSteps(mod.default);
//     });
//   }, []);
// useEffect(() => {
//   const loadExisting = async () => {
//     const { record } = await fetchReceipt("");
//     if (record) {
//       setSavedRecord(record);
//       // Don't change uiState to "tracked" — just surface the timeline below the cards
//     }
//   };
//   loadExisting();
// }, []);
//   // FIX: single callback used by BOTH forms — sets record AND transitions state
// const handleSaved = useCallback(async (record: ReceiptRecord) => {
// setUiState("tracked");

//   const { record: freshRecord } = await fetchReceipt(record.receiptNumber);

//   if (freshRecord) {
//     setSavedRecord(freshRecord);
//   } else {
//     setSavedRecord(record); // fallback
//   }
// }, []);

//   return (
//     <div className="min-h-screen w-full ch1step-bg">
//       <div className="bg-cover bg-center w-full min-h-screen relative">
//         <div className="max-w-[720px] w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col step-modal-spacing">

//           {/* Eyebrow */}
//           <div className="flex flex-wrap items-center gap-2 mb-1">
//             <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">
//               Chapter 1 · USCIS Petition Filing
//             </span>
//             <span className="text-[11px]" style={{ color: "#b8d4f0" }}>›</span>
//             <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">{tool.title}</span>
//           </div>

//           <h1 className="text-[2rem] sm:text-[2.3rem] md:text-[2.4rem] lg:text-[2.5rem] leading-[1.15] tracking-tight mb-2 accent-brown">{tool.title}</h1>
//           <p className="text-[15px] md:text-[16px] leading-[1.7] max-w-full md:max-w-[560px] mb-6 accent-brown">{tool.subtitle}</p>

//           {/* Chips */}
//           <div className="flex gap-2 flex-wrap mb-9">
//             {["Petitioner", "Online Filing", "Tracking"].map((label) => (
//               <span key={label} className="text-[11px] font-semibold uppercase px-3 py-1 rounded-full"
//                 style={{ background: "#fff", color: "#28151c", border: "1px solid #28151c" }}>
//                 {label}
//               </span>
//             ))}
//           </div>

//           {/* Launch module */}
//           <div className="rounded-2xl mb-5 relative overflow-hidden w-full" style={{ background: "#28151c" }}>
//             <div className="absolute top-0 left-0 right-0 h-[2px]"
//               style={{ background: "linear-gradient(to right, #c0596a, #28151c, transparent)", opacity: 0.8 }} />
//             <div className="p-5 sm:p-8 md:p-[32px_34px_28px]">
//               <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
//                 <div className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#c0596a" }}>
//                   <Globe className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#c0596a" }}>
//                     Post-Filing Checkpoint · Receipt Registration
//                   </div>
//                   <div className="text-[clamp(19px,2.8vw,23px)] leading-tight" style={{ color: "#fff" }}>
//                     Wait for the notice, register it, then let Rahvana monitor the case
//                   </div>
//                 </div>
//               </div>
//               <div className="h-px mb-5" style={{ background: "#c0596a33" }} />
//               {tool.phases?.map((p: any, i: number) => (
//                 <div key={i} className="flex gap-2 items-start rounded-[10px] px-4 py-3 mb-2"
//                   style={{ background: "rgba(192,89,106,0.18)", border: "1px solid #c0596a55" }}>
//                   <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap"
//                     style={{ background: "#c0596a", color: "#fff" }}>{p.badge}</span>
//                   <span className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{p.copy}</span>
//                 </div>
//               ))}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-2">
//                 {tool.launch_cues?.map((cue: string, i: number) => (
//                   <div key={i} className="flex gap-3 items-center rounded-xl px-5 py-4"
//                     style={{ background: "#3a2328", border: "1.5px solid #c0596a55", minHeight: "60px" }}>
//                     <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "#c0596a" }} />
//                     <span className="text-[14px] font-normal leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>{cue}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* ── waiting ── */}
//           {uiState === "waiting" && (
//             <>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

//                 {/* Card 1 — green check */}
//                 <button
//                   className="rounded-2xl p-5 flex flex-col items-start text-left"
//                   style={{ background: "#fff", border: "1.5px solid #d0e4f7", transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s" }}
//                   onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2f6fd4"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(47,111,212,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
//                   onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d0e4f7"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
//                   onClick={() => setUiState("register")}
//                 >
//                   <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]"
//                     style={{ background: "#e8f5ef", border: "1px solid #a8d9be" }}>
//                     <CheckIcon />
//                   </div>
//                   <div className="text-[15px] font-semibold mb-[5px]" style={{ color: "#0c1b33" }}>
//                     I Received My Receipt Notice
//                   </div>
//                   <div className="text-[13px] leading-[1.55]" style={{ color: "#6b8097" }}>
//                     Move into the registration step and save the receipt details inside Rahvana.
//                   </div>
//                   <div className="flex items-center gap-[5px] font-semibold text-[12px] mt-[13px]" style={{ color: "#2f6fd4" }}>
//                     Register notice <ArrowRight />
//                   </div>
//                 </button>

//                 {/* Card 2 — purple book */}
//                 <button
//                   className="rounded-2xl p-5 flex flex-col items-start text-left"
//                   style={{ background: "#fff", border: "1.5px solid #d0e4f7", transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s" }}
//                   onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2f6fd4"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(47,111,212,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
//                   onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d0e4f7"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
//                   onClick={() => { setGuideStep(0); setIsGuideOpen(true); }}
//                 >
//                   <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]"
//                     style={{ background: "#f3f0fb", border: "1px solid #c9bef2" }}>
//                     <BookIcon />
//                   </div>
//                   <div className="text-[15px] font-semibold mb-[5px]" style={{ color: "#0c1b33" }}>
//                     Where Do I Find the Receipt Number?
//                   </div>
//                   <div className="text-[13px] leading-[1.55]" style={{ color: "#6b8097" }}>
//                     Open a short walkthrough that shows where to look and what information to bring back.
//                   </div>
//                   <div className="flex items-center gap-[5px] font-semibold text-[12px] mt-[13px]" style={{ color: "#2f6fd4" }}>
//                     Open guide <ArrowRight />
//                   </div>
//                 </button>

//               </div>
//               <p className="text-[11.5px] text-center mt-[6px]" style={{ color: "#6b8097", lineHeight: 1.6 }}>
//                 Best next move: wait until USCIS accepts the filing, then return here with the receipt number or receipt notice.
//               </p>
//             </>
//           )}

//           {/* ── register ── */}
//           {uiState === "register" && (
//             <>
//               <div className="flex gap-2 mb-4 flex-wrap" style={{ borderBottom: "1px solid #e5e7eb" }}>
//                 {(["manual", "upload"] as const).map((tab) => (
//                   <button
//                     key={tab}
//                     className="px-5 py-2 text-[15px] font-semibold transition-colors duration-150"
//                     style={{
//                       borderBottom: activeTab === tab ? "2px solid #c0596a" : "2px solid transparent",
//                       color: activeTab === tab ? "#c0596a" : "#6b8097",
//                       background: "transparent",
//                     }}
//                     onClick={() => setActiveTab(tab)}
//                   >
//                     {tab === "manual" ? "Enter Receipt Number" : "Upload Receipt Notice"}
//                   </button>
//                 ))}
//               </div>

//               {/* FIX: both forms now receive handleSaved, which sets record AND transitions to "tracked" */}
//               {activeTab === "manual" ? (
//                 <ManualForm
//                   onBack={() => setUiState("waiting")}
//                   onSaved={handleSaved}
//                 />
//               ) : (
//                 <UploadForm
//                   onBack={() => setActiveTab("manual")}
//                   onSaved={handleSaved}
//                 />
//               )}
//             </>
//           )}

//           {/* ── tracked ── timeline and modal are always visible if a record exists */}
//           {savedRecord && (
//             <>
//               {/* Confirmation header (Post-Filing Checkpoint modal) */}
//               <div className="rounded-2xl p-4 sm:p-6 mb-2" style={{ background: "#efe0e6", border: "1.5px solid #c0596a" }}>
//                 <div className="text-[24px] mb-1 font-semibold" style={{ color: "#28151c" }}>
//                   Receipt notice registered
//                 </div>
//                 <div className="text-[14px]" style={{ color: "#28151c" }}>
//                   Rahvana now has the core case reference needed to monitor status changes.
//                 </div>
//               </div>

//               {/* StatusTimelinePanel renders inline on the same page with all record values */}
//               <div className="w-full">
//                 <StatusTimelinePanel record={savedRecord} />
//               </div>

//               {/* Update action — returns to register tab without clearing the record */}
//               <div className="flex gap-2 flex-wrap mt-4">
//                 <button
//                   className="px-4 py-2 rounded-full text-[13px] font-semibold"
//                   style={{ background: "transparent", color: "#c0596a", border: "1.5px solid #c0596a" }}
//                   onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeaec")}
//                   onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
//                   onClick={() => setUiState("register")}
//                 >
//                   Update Receipt Info
//                 </button>
//               </div>
//             </>
//           )}

//           {/* ── Guide overlay — outside state blocks so it's always mountable ── */}
//           {isGuideOpen && (
//             <GuideTutorialOverlay
//               isOpen={isGuideOpen}
//               onClose={() => setIsGuideOpen(false)}
//               tutorial={guideSteps}
//               index={guideStep}
//               setIndex={setGuideStep}
//               title={tool.title || "Receipt Notice Guide"}
//             />
//           )}

//           {tool.footer_note && (
//             <div className="mt-8 text-xs border-t pt-4" style={{ color: "#6b8097" }}>{tool.footer_note}</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
// export default RegisterReceiptStep;


// components/RegisterReceiptStep.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Globe } from "lucide-react";
import { GuideTutorialOverlay } from "./GuideTutorialOverlays";
import {
  fmtDate,
  fmtDateTime,
  buildTimelineItems,
  type ReceiptRecord,
  type RegisterReceiptPayload,
  type RegisterReceiptError,
} from "@/lib/register-receipt";

// ─── Tiny SVG helpers ──────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#15744f" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const BookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#4a2d8a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
  </svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Vault document shape — mirrors uploadedDocs in DocumentChecklist ──────────

export interface VaultFile {
  file: File;
  uploadDate: Date;
  quality: "excellent" | "good" | "needs-review";
}

// ─── Status Timeline (always-visible inline block) ─────────────────────────────

const StatusTimelinePanel: React.FC<{ record: ReceiptRecord }> = ({ record }) => {
  const items = buildTimelineItems(record);

  const summaryCards = [
    { k: "Receipt Number",    v: record.receiptNumber },
    { k: "Tracking",          v: "Enabled" },
    { k: "Notice Date",       v: record.noticeDate   ? fmtDate(record.noticeDate)   : "Not provided" },
    { k: "Priority Date",     v: record.priorityDate ? fmtDate(record.priorityDate) : "Not provided" },
    { k: "Last Known Status", v: record.lastKnownStatus },
    { k: "Last Checked",      v: fmtDateTime(record.lastCheckedAt) },
  ];

  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col mt-6"
      style={{
        background: "#28151c",
        border: "1.5px solid #c0596a",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}
    >
      {/* HEADER */}
      <div className="px-6 py-4" style={{ borderBottom: "1px solid #c0596a33" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#c0596a" }}>
          Post-Filing Checkpoint
        </div>
        <div className="text-[18px] font-semibold text-white">
          Receipt Registered · Status Timeline
        </div>
      </div>

      {/* BODY */}
      <div className="px-6 py-5">

        {/* Summary cards — values pulled directly from record */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
          {summaryCards.map(({ k, v }) => (
            <div
              key={k}
              className="rounded-xl p-3"
              style={{ background: "#3a2328", border: "1px solid #c0596a55" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "#c0596a99" }}>
                {k}
              </div>
              <div className="text-[13px] font-semibold text-white">
                {v}
              </div>
            </div>
          ))}
        </div>

        <div className="h-px mb-5" style={{ background: "#c0596a33" }} />

        {/* Timeline items */}
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 items-start rounded-xl p-3"
              style={{ background: "#3a2328", border: "1px solid #c0596a55" }}
            >
              <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: "#c0596a" }} />
              <div>
                <div className="text-[13px] font-bold text-white">{item.title}</div>
                <div className="text-[12px] text-white/60">{item.sub}</div>
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
  payload: RegisterReceiptPayload
): Promise<{ record: ReceiptRecord | null; error: string }> {
  try {
    const res = await fetch("/api/receipt/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || "error" in data) {
      return { record: null, error: data.error ?? "Failed to save receipt." };
    }

    const record: ReceiptRecord = {
      receiptNumber:    data.receipt_number,
      noticeDate:       data.notice_date,
      priorityDate:     data.priority_date,
      caseLabel:        data.case_label,
      source:           data.source,
      trackingEnabled:  data.tracking_enabled,
      lastKnownStatus:  data.last_known_status,
      lastCheckedAt:    data.last_checked_at,
      savedAt:          data.saved_at,
    };

    return { record, error: "" };
  } catch {
    return { record: null, error: "Network error — please try again." };
  }
}

async function fetchReceipt(_receiptNumber: string) {
  try {
    const res = await fetch(`/api/receipt/me`);
    const data = await res.json();

    if (!res.ok || data.error) {
      return { record: null, error: data.error || "Failed to fetch receipt" };
    }

    const record: ReceiptRecord = {
      receiptNumber:   data.receipt_number,
      noticeDate:      data.notice_date,
      priorityDate:    data.priority_date,
      caseLabel:       data.case_label,
      source:          data.source,
      trackingEnabled: data.tracking_enabled,
      lastKnownStatus: data.last_known_status,
      lastCheckedAt:   data.last_checked_at,
      savedAt:         data.saved_at,
    };

    return { record, error: "" };
  } catch {
    return { record: null, error: "Network error while fetching receipt" };
  }
}

// ─── Shared error banner ───────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ message: string }> = ({ message }) =>
  message ? (
    <div className="rounded-lg p-3 text-[13px] mb-4" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>
      {message}
    </div>
  ) : null;

// ─── Manual entry form — UNCHANGED ────────────────────────────────────────────

interface ManualFormProps { onBack: () => void; onSaved: (r: ReceiptRecord) => void; }

const ManualForm: React.FC<ManualFormProps> = ({ onBack, onSaved }) => {
  const [fields, setFields] = useState({ receiptNumber: "", noticeDate: "", priorityDate: "", caseLabel: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const focusBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#c0596a");
  const blurBorder   = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#d0e4f7");

  async function handleSubmit() {
    setLoading(true); setError("");
    const { record, error: err } = await postReceipt({ ...fields, source: "manual" });
    setLoading(false);
    if (err) { setError(err); return; }
    if (record) onSaved(record);
  }

  return (
    <div className="rounded-2xl p-8 md:p-10 mb-6" style={{ background: "#fff", border: "1.5px solid rgba(192,89,106,0.4)" }}>
      <div className="text-[22px] mb-2 font-semibold" style={{ color: "#28151c" }}>Register the receipt notice</div>
      <div className="text-[14px] mb-6" style={{ color: "#28151c" }}>
        Enter the receipt number and dates exactly as they appear on your USCIS notice.
      </div>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Receipt Number</label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            placeholder="IOE1234567890" maxLength={13} value={fields.receiptNumber}
            onChange={set("receiptNumber")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Notice Date</label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date" value={fields.noticeDate} onChange={set("noticeDate")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Priority Date</label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date" value={fields.priorityDate} onChange={set("priorityDate")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>
            Case Label <span className="normal-case font-normal">(optional)</span>
          </label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            placeholder="IR-1 I-130 · March 2026 filing" value={fields.caseLabel}
            onChange={set("caseLabel")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
      </div>
      <div className="rounded-lg p-3 text-[13px] mb-5" style={{ background: "#fbeaec", border: "1px solid rgba(192,89,106,0.3)", color: "#28151c" }}>
        Always confirm the receipt number before saving — it is the primary key used for case tracking.
      </div>
      <div className="flex gap-2">
        <button className="px-5 py-2 rounded-full text-[14px] font-semibold" style={{ background: "#fff", border: "1.5px solid #c0596a", color: "#c0596a" }}
          onClick={onBack} disabled={loading}>Back</button>
        <button className="px-5 py-2 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "#c0596a" }} onClick={handleSubmit} disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#a13e4e")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#c0596a")}>
          {loading ? "Saving…" : "Save Receipt & Enable Tracking"}
        </button>
      </div>
    </div>
  );
};

// ─── Upload form ───────────────────────────────────────────────────────────────
// CHANGED: added onFileVault prop; the file input onChange now calls it in
// addition to setting local state. All other inputs are untouched.

/** The document-vault id that matches the definition added to documents-db.ts */
const RECEIPT_NOTICE_DOC_ID = "receipt-notice-uscis";

interface UploadFormProps {
  onBack: () => void;
  onSaved: (r: ReceiptRecord) => void;
  /** Called with (docId, FileList) whenever the user picks a file — same
   *  signature as onFileUpload in DocumentChecklist. Parent stores the file
   *  in vaultDocs state so it appears in the document vault. */
  onFileVault: (docId: string, files: FileList) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onBack, onSaved, onFileVault }) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  // These three fields are UNCHANGED
  const [fields, setFields] = useState({ receiptNumber: "", noticeDate: "", priorityDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#c0596a");
  const blurBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#d0e4f7");

  async function handleSubmit() {
    setLoading(true); setError("");
    const { record, error: err } = await postReceipt({ ...fields, source: "upload" });
    setLoading(false);
    if (err) { setError(err); return; }
    if (record) onSaved(record);
  }

  return (
    <div className="rounded-2xl p-8 md:p-10 mb-6" style={{ background: "#fff", border: "1.5px solid rgba(192,89,106,0.4)" }}>
      <div className="text-[22px] mb-2 font-semibold" style={{ color: "#28151c" }}>Upload receipt notice</div>
      <div className="text-[14px] mb-6" style={{ color: "#28151c" }}>
        Upload your notice file, then confirm the key details below before saving.
      </div>
      <ErrorBanner message={error} />
      <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "#6b8097" }}>
        Receipt Notice File
      </label>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          id="receipt-upload-input"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            // 1. existing local-state update — unchanged
            setUploadFile(file);
            // 2. NEW: forward to the document vault with the receipt-notice doc id
            if (e.target.files && e.target.files.length > 0) {
              onFileVault(RECEIPT_NOTICE_DOC_ID, e.target.files);
            }
          }}
        />
        <label htmlFor="receipt-upload-input" className="px-4 py-2 rounded-lg text-[14px] font-semibold cursor-pointer"
          style={{ background: "#fbeaec", border: "1px solid rgba(192,89,106,0.4)", color: "#c0596a" }}>
          Choose File
        </label>
        <span className="text-[13px]" style={{ color: "#6b8097" }}>
          {uploadFile ? uploadFile.name : "No file chosen"}
        </span>
      </div>
      <div className="rounded-lg p-3 mb-5 text-[13px]" style={{ background: "#f4f7fb", border: "1px solid #d0e4f7", color: "#3a4f63" }}>
        Accepted formats: PDF, PNG, JPG. Confirm the receipt number and dates below before saving.
      </div>
      {/* ── These three inputs are UNCHANGED ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Confirm Receipt Number</label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            placeholder="IOE1234567890" maxLength={13} value={fields.receiptNumber}
            onChange={set("receiptNumber")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Notice Date</label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date" value={fields.noticeDate} onChange={set("noticeDate")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b8097" }}>Priority Date</label>
          <input className="rounded-lg px-4 py-3 text-[15px] outline-none" style={{ border: "1.5px solid #d0e4f7", color: "#1c2b3a" }}
            type="date" value={fields.priorityDate} onChange={set("priorityDate")} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
      </div>
      <div className="rounded-lg p-3 text-[13px] mb-5" style={{ background: "#fbeaec", border: "1px solid rgba(192,89,106,0.3)", color: "#28151c" }}>
        Always confirm the receipt number with the user before turning on tracking. Upload parsing can help, but values should never be saved silently without review.
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-5 py-2 rounded-full text-[14px] font-semibold" style={{ background: "#fff", border: "1.5px solid #c0596a", color: "#c0596a" }}
          onClick={onBack} disabled={loading}>Back</button>
        <button className="px-5 py-2 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "#c0596a" }} onClick={handleSubmit} disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#a13e4e")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#c0596a")}>
          {loading ? "Saving…" : "Save Receipt & Enable Tracking"}
        </button>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

type UiState = "waiting" | "register" | "tracked";
type TabMode  = "manual"  | "upload";

const RegisterReceiptStep: React.FC<any> = ({ tool }) => {
  const [uiState,     setUiState]     = useState<UiState>("waiting");
  const [activeTab,   setActiveTab]   = useState<TabMode>("manual");
  const [savedRecord, setSavedRecord] = useState<ReceiptRecord | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStep,   setGuideStep]   = useState(0);
  const [guideSteps,  setGuideSteps]  = useState<any[]>([]);

  // ── Document vault state — same shape as uploadedDocs in DocumentChecklist ──
  // Key: docId (e.g. "receipt-notice-uscis")  Value: VaultFile[]
  const [vaultDocs, setVaultDocs] = useState<Record<string, VaultFile[]>>({});

  useEffect(() => {
    import("@/data/receipt-guide-steps.json").then((mod) => {
      setGuideSteps(mod.default);
    });
  }, []);

  useEffect(() => {
    const loadExisting = async () => {
      const { record } = await fetchReceipt("");
      if (record) {
        setSavedRecord(record);
      }
    };
    loadExisting();
  }, []);

  // Transition to tracked and refresh record from server
  const handleSaved = useCallback(async (record: ReceiptRecord) => {
    setUiState("tracked");
    const { record: freshRecord } = await fetchReceipt(record.receiptNumber);
    if (freshRecord) {
      setSavedRecord(freshRecord);
    } else {
      setSavedRecord(record);
    }
  }, []);

  /**
   * handleFileVault — stores files in vaultDocs state.
   * Signature is identical to onFileUpload in DocumentChecklist so the two
   * components can share the same parent-level vault store in future.
   *
   * quality is inferred from file size as a simple heuristic:
   *   > 500 KB  → "excellent"
   *   > 100 KB  → "good"
   *   otherwise → "needs-review"
   */
  const handleFileVault = useCallback((docId: string, files: FileList) => {
    const incoming: VaultFile[] = Array.from(files).map((file) => ({
      file,
      uploadDate: new Date(),
      quality:
        file.size > 500_000 ? "excellent"
        : file.size > 100_000 ? "good"
        : "needs-review",
    }));

    setVaultDocs((prev) => ({
      ...prev,
      // Append to any existing files for this docId (mirrors DocumentChecklist behaviour)
      [docId]: [...(prev[docId] ?? []), ...incoming],
    }));
  }, []);

  return (
    <div className="min-h-screen w-full ch1step-bg">
      <div className="bg-cover bg-center w-full min-h-screen relative">
        <div className="max-w-[720px] w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col step-modal-spacing">

          {/* Eyebrow */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">
              Chapter 1 · USCIS Petition Filing
            </span>
            <span className="text-[11px]" style={{ color: "#b8d4f0" }}>›</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">{tool.title}</span>
          </div>

          <h1 className="text-[2rem] sm:text-[2.3rem] md:text-[2.4rem] lg:text-[2.5rem] leading-[1.15] tracking-tight mb-2 accent-brown">{tool.title}</h1>
          <p className="text-[15px] md:text-[16px] leading-[1.7] max-w-full md:max-w-[560px] mb-6 accent-brown">{tool.subtitle}</p>

          {/* Chips */}
          <div className="flex gap-2 flex-wrap mb-9">
            {["Petitioner", "Online Filing", "Tracking"].map((label) => (
              <span key={label} className="text-[11px] font-semibold uppercase px-3 py-1 rounded-full"
                style={{ background: "#fff", color: "#28151c", border: "1px solid #28151c" }}>
                {label}
              </span>
            ))}
          </div>

          {/* Launch module */}
          <div className="rounded-2xl mb-5 relative overflow-hidden w-full" style={{ background: "#28151c" }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(to right, #c0596a, #28151c, transparent)", opacity: 0.8 }} />
            <div className="p-5 sm:p-8 md:p-[32px_34px_28px]">
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <div className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#c0596a" }}>
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#c0596a" }}>
                    Post-Filing Checkpoint · Receipt Registration
                  </div>
                  <div className="text-[clamp(19px,2.8vw,23px)] leading-tight" style={{ color: "#fff" }}>
                    Wait for the notice, register it, then let Rahvana monitor the case
                  </div>
                </div>
              </div>
              <div className="h-px mb-5" style={{ background: "#c0596a33" }} />
              {tool.phases?.map((p: any, i: number) => (
                <div key={i} className="flex gap-2 items-start rounded-[10px] px-4 py-3 mb-2"
                  style={{ background: "rgba(192,89,106,0.18)", border: "1px solid #c0596a55" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: "#c0596a", color: "#fff" }}>{p.badge}</span>
                  <span className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{p.copy}</span>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-2">
                {tool.launch_cues?.map((cue: string, i: number) => (
                  <div key={i} className="flex gap-3 items-center rounded-xl px-5 py-4"
                    style={{ background: "#3a2328", border: "1.5px solid #c0596a55", minHeight: "60px" }}>
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "#c0596a" }} />
                    <span className="text-[14px] font-normal leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>{cue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── waiting ── */}
          {uiState === "waiting" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

                {/* Card 1 — green check */}
                <button
                  className="rounded-2xl p-5 flex flex-col items-start text-left"
                  style={{ background: "#fff", border: "1.5px solid #d0e4f7", transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2f6fd4"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(47,111,212,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d0e4f7"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                  onClick={() => setUiState("register")}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]"
                    style={{ background: "#e8f5ef", border: "1px solid #a8d9be" }}>
                    <CheckIcon />
                  </div>
                  <div className="text-[15px] font-semibold mb-[5px]" style={{ color: "#0c1b33" }}>
                    I Received My Receipt Notice
                  </div>
                  <div className="text-[13px] leading-[1.55]" style={{ color: "#6b8097" }}>
                    Move into the registration step and save the receipt details inside Rahvana.
                  </div>
                  <div className="flex items-center gap-[5px] font-semibold text-[12px] mt-[13px]" style={{ color: "#2f6fd4" }}>
                    Register notice <ArrowRight />
                  </div>
                </button>

                {/* Card 2 — purple book */}
                <button
                  className="rounded-2xl p-5 flex flex-col items-start text-left"
                  style={{ background: "#fff", border: "1.5px solid #d0e4f7", transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2f6fd4"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(47,111,212,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d0e4f7"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                  onClick={() => { setGuideStep(0); setIsGuideOpen(true); }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]"
                    style={{ background: "#f3f0fb", border: "1px solid #c9bef2" }}>
                    <BookIcon />
                  </div>
                  <div className="text-[15px] font-semibold mb-[5px]" style={{ color: "#0c1b33" }}>
                    Where Do I Find the Receipt Number?
                  </div>
                  <div className="text-[13px] leading-[1.55]" style={{ color: "#6b8097" }}>
                    Open a short walkthrough that shows where to look and what information to bring back.
                  </div>
                  <div className="flex items-center gap-[5px] font-semibold text-[12px] mt-[13px]" style={{ color: "#2f6fd4" }}>
                    Open guide <ArrowRight />
                  </div>
                </button>

              </div>
              <p className="text-[11.5px] text-center mt-[6px]" style={{ color: "#6b8097", lineHeight: 1.6 }}>
                Best next move: wait until USCIS accepts the filing, then return here with the receipt number or receipt notice.
              </p>
            </>
          )}

          {/* ── register ── */}
          {uiState === "register" && (
            <>
              <div className="flex gap-2 mb-4 flex-wrap" style={{ borderBottom: "1px solid #e5e7eb" }}>
                {(["manual", "upload"] as const).map((tab) => (
                  <button
                    key={tab}
                    className="px-5 py-2 text-[15px] font-semibold transition-colors duration-150"
                    style={{
                      borderBottom: activeTab === tab ? "2px solid #c0596a" : "2px solid transparent",
                      color: activeTab === tab ? "#c0596a" : "#6b8097",
                      background: "transparent",
                    }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "manual" ? "Enter Receipt Number" : "Upload Receipt Notice"}
                  </button>
                ))}
              </div>

              {activeTab === "manual" ? (
                <ManualForm
                  onBack={() => setUiState("waiting")}
                  onSaved={handleSaved}
                />
              ) : (
                // CHANGED: pass handleFileVault so UploadForm can push the file to the vault
                <UploadForm
                  onBack={() => setActiveTab("manual")}
                  onSaved={handleSaved}
                  onFileVault={handleFileVault}
                />
              )}
            </>
          )}

          {/* ── tracked ── timeline and confirmation are always visible if a record exists */}
          {savedRecord && (
            <>
              <div className="rounded-2xl p-4 sm:p-6 mb-2" style={{ background: "#efe0e6", border: "1.5px solid #c0596a" }}>
                <div className="text-[24px] mb-1 font-semibold" style={{ color: "#28151c" }}>
                  Receipt notice registered
                </div>
                <div className="text-[14px]" style={{ color: "#28151c" }}>
                  Rahvana now has the core case reference needed to monitor status changes.
                </div>
              </div>

              <div className="w-full">
                <StatusTimelinePanel record={savedRecord} />
              </div>

              {/* Show vault confirmation if a file was stored */}
              {vaultDocs[RECEIPT_NOTICE_DOC_ID]?.length > 0 && (
                <div className="rounded-xl px-5 py-3 mt-3 flex items-center gap-3"
                  style={{ background: "#f4f7fb", border: "1px solid #d0e4f7" }}>
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

              <div className="flex gap-2 flex-wrap mt-4">
                <button
                  className="px-4 py-2 rounded-full text-[13px] font-semibold"
                  style={{ background: "transparent", color: "#c0596a", border: "1.5px solid #c0596a" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeaec")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setUiState("register")}
                >
                  Update Receipt Info
                </button>
              </div>
            </>
          )}

          {/* ── Guide overlay ── */}
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
            <div className="mt-8 text-xs border-t pt-4" style={{ color: "#6b8097" }}>{tool.footer_note}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterReceiptStep;