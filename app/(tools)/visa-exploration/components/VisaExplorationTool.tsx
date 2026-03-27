"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Search,
  Globe, CheckCircle, Clock, FileText, X, Lock, AlertCircle, ExternalLink,
  Compass, ArrowRight,
} from "lucide-react";

// NEW MODULAR IMPORTS
import { T, VisaExplorationAnswers, Step } from "../visa-engine/types";
import { ALL_COUNTRIES } from "../visa-engine/data/countries";
import { SUPPORTED_DESTINATIONS, getCountryData } from "../visa-engine/data/registry";
import { buildSteps, DOWNSTREAM_CLEAR_MAP } from "../visa-engine/logic/step-builder";
import { 
  getEligibleVisas, 
  allGateAnswered, 
  evaluateGate 
} from "../visa-engine/logic/gate-engine";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function setNestedAnswer(answers: VisaExplorationAnswers, field: string, value: any): VisaExplorationAnswers {
  if (!field.startsWith("gateAnswers.")) return { ...answers, [field]: value };
  const [, visaCode, questionId] = field.split(".");
  return {
    ...answers,
    gateAnswers: {
      ...(answers.gateAnswers || {}),
      [visaCode]: {
        ...((answers.gateAnswers || {})[visaCode] || {}),
        [questionId]: value,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// STEP INDICATORS
// ─────────────────────────────────────────────────────────────
const PHASE_LABELS = ["Your Info", "Purpose", "Details", "Eligibility Check"];

function getPhase(step: Step | undefined, stepIndex: number): number {
  if (!step) return 0;
  if (step.id === "origin" || step.id === "destination") return 0;
  if (step.id === "purpose") return 1;
  if (step.type === "gate_question") return 3;
  return 2;
}

function PhaseIndicator({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {PHASE_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300 ${
            i < currentPhase ? "bg-emerald-100 text-emerald-700" :
            i === currentPhase ? "bg-[#0D6E6E]/10 text-[#0D6E6E]" :
            "bg-slate-100 text-slate-400"
          }`}>
            {i < currentPhase ? <CheckCircle size={11} /> : null}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
          {i < PHASE_LABELS.length - 1 && (
            <div className={`w-4 h-0.5 rounded-full transition-colors duration-300 ${
              i < currentPhase ? "bg-emerald-300" : "bg-slate-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COUNTRY INPUT (improved)
// ─────────────────────────────────────────────────────────────
function CountryInput({ value, onChange, placeholder, isDestination = false, hint }: {
  value: string; onChange: (v: string) => void; placeholder: string; isDestination?: boolean; hint?: string;
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value) setQuery(value); }, [value]);

  const filtered = query.length >= 1
    ? ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className={`border-2 rounded-2xl bg-white flex items-center gap-3 px-5 py-4 transition-all duration-200 ${
        open ? "border-[#0D6E6E] shadow-lg shadow-[#0D6E6E]/10" : value ? "border-emerald-400 shadow-sm" : "border-slate-200 hover:border-slate-300"
      }`}>
        {value ? (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-slate-400" />
          </div>
        )}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 border-none outline-none text-[16px] text-slate-800 bg-transparent placeholder:text-slate-400 font-medium"
        />
      </div>

      {!value && !open && hint && (
        <p className="text-[12px] text-slate-400 mt-2 ml-1 font-medium">{hint}</p>
      )}

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            {filtered.map((country) => {
              const comingSoon = isDestination && !SUPPORTED_DESTINATIONS.includes(country);
              return (
                <button key={country}
                  onClick={() => { onChange(country); setQuery(country); setOpen(false); }}
                  disabled={comingSoon}
                  className={`flex items-center justify-between w-full px-5 py-3.5 text-left transition-colors ${
                    comingSoon ? "text-slate-400 cursor-not-allowed" : "text-slate-700 hover:bg-[#0D6E6E]/5"
                  }`}
                >
                  <span className="text-[15px] font-semibold">{country}</span>
                  {comingSoon && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPTION CARD (improved with emoji support)
// ─────────────────────────────────────────────────────────────
function OptionCard({ label, sub, selected, onClick, disabled }: {
  label: string; sub?: string; selected: boolean; onClick: () => void; disabled?: boolean; emoji?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick} disabled={disabled}
      className={`w-full text-left p-5 rounded-2xl transition-all duration-200 flex items-start gap-4 border-2 group ${
        selected
          ? "border-[#0D6E6E] bg-[#0D6E6E]/5 shadow-md shadow-[#0D6E6E]/10"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.995]"}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className={`text-[15px] font-bold leading-snug ${selected ? "text-[#0D6E6E]" : "text-slate-800"}`}>{label}</h3>
        {sub && <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{sub}</p>}
      </div>
      <div className={`p-1 rounded-full flex-shrink-0 mt-0.5 transition-all ${
        selected ? "bg-[#0D6E6E] text-white scale-110" : "bg-slate-100 text-slate-300 group-hover:bg-slate-200"
      }`}>
        <CheckCircle size={18} className={selected ? "opacity-100" : "opacity-40"} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// OPTION GRID
// ─────────────────────────────────────────────────────────────
function OptionGrid({ options, value, onChange }: {
  options: any[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((opt: any) => (
        <button key={opt.value}
          onClick={opt.disabled ? undefined : () => onChange(opt.value)} disabled={opt.disabled}
          className={`p-6 rounded-2xl transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 border-2 ${
            value === opt.value
              ? "border-[#0D6E6E] bg-[#0D6E6E]/5 shadow-md shadow-[#0D6E6E]/10"
              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
          } ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
        >
          <span className={`text-[16px] font-black ${value === opt.value ? "text-[#0D6E6E]" : "text-slate-800"}`}>{opt.label}</span>
          {opt.sub && <span className="text-[12px] text-slate-500">{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GATE QUESTION (improved)
// ─────────────────────────────────────────────────────────────
function GateQuestion({ step, answers, onAnswer }: {
  step: Step; answers: VisaExplorationAnswers; onAnswer: (f: string, v: any) => void;
}) {
  const visaGate = (answers.gateAnswers || {})[step.visaCode!] || {};
  const current = visaGate[step.questionId!];
  const isPassing = current && step.passWith!.includes(current as string);
  const isFailing = current && !step.passWith!.includes(current as string);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-black px-3 py-1.5 rounded-full border"
          style={{ color: step.visaColor, background: step.visaColor + "12", borderColor: step.visaColor + "25" }}>
          {step.visaCode}
        </span>
        <span className="text-[11px] text-slate-400 font-medium">{step.visaLabel}</span>
      </div>

      <div className="flex flex-col gap-3">
        {step.options!.map((opt) => {
          const isPassOpt = step.passWith!.includes(opt.value);
          const isSel = current === opt.value;
          return (
            <button key={opt.value}
              onClick={() => onAnswer(step.field!, opt.value)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between gap-4 border-2 cursor-pointer active:scale-[0.995] ${
                isSel
                  ? (isPassOpt ? "border-emerald-400 bg-emerald-50/80 shadow-sm" : "border-red-300 bg-red-50/80 shadow-sm")
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className={`text-[14px] font-semibold flex-1 ${
                isSel ? (isPassOpt ? "text-emerald-700" : "text-red-700") : "text-slate-700"
              }`}>{opt.label}</span>
              {isSel && (
                <div className={`p-1 rounded-full ${isPassOpt ? "bg-emerald-500" : "bg-red-400"} text-white`}>
                  <CheckCircle size={14} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {isFailing && (
          <motion.div initial={{ opacity:0, y:-6, height:0 }} animate={{ opacity:1, y:0, height:"auto" }} exit={{ opacity:0, y:-6, height:0 }}
            className="flex gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 overflow-hidden">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700 leading-relaxed">{step.failMsg}</p>
          </motion.div>
        )}
        {isPassing && (
          <motion.div initial={{ opacity:0, y:-6, height:0 }} animate={{ opacity:1, y:0, height:"auto" }} exit={{ opacity:0, y:-6, height:0 }}
            className="flex gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 items-center overflow-hidden">
            <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
            <p className="text-[12px] text-emerald-700 font-semibold">This meets the requirement.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {step.sourceUrl && (
        <a href={step.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#0D6E6E] transition-colors no-underline mt-1">
          <ExternalLink size={10} /><span>{step.subtitle}</span>
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP CONTENT
// ─────────────────────────────────────────────────────────────
function StepContent({ step, answers, onAnswer }: {
  step: Step; answers: VisaExplorationAnswers; onAnswer: (f: string, v: any) => void;
}) {
  if (!step) return null;
  if (step.type === "country") return (
    <CountryInput value={(answers[step.field!] as string) || ""} onChange={(v) => onAnswer(step.field!, v)}
      placeholder={step.isDestination ? "Search destination country..." : "Search your country..."}
      isDestination={step.isDestination} hint={step.hint} />
  );
  if (step.type === "options") return (
    <div className="flex flex-col gap-3">
      {step.options!.map((opt) => (
        <OptionCard key={opt.value} label={opt.label} sub={opt.sub} disabled={opt.disabled}
          selected={answers[step.field!] === opt.value} onClick={() => onAnswer(step.field!, opt.value)} />
      ))}
    </div>
  );
  if (step.type === "grid") return (
    <OptionGrid options={step.options!} value={(answers[step.field!] as string) || ""} onChange={(v) => onAnswer(step.field!, v)} />
  );
  if (step.type === "gate_question") return (
    <GateQuestion step={step} answers={answers} onAnswer={onAnswer} />
  );
  return null;
}

// ─────────────────────────────────────────────────────────────
// VISA RESULT CARD
// ─────────────────────────────────────────────────────────────
function VisaResultCard({ visa, onClick }: { visa: any; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group w-full text-left p-6 rounded-2xl bg-white border-2 border-slate-100 hover:border-[#0D6E6E]/40 hover:shadow-xl hover:shadow-[#0D6E6E]/5 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl font-black tracking-tight text-[#0D6E6E] leading-none">{visa.code}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#0D6E6E]/10 group-hover:text-[#0D6E6E] transition-colors">
          {visa.badge}
        </span>
      </div>
      <h4 className="text-[16px] font-bold text-slate-800 mb-1.5">{visa.label}</h4>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-4 line-clamp-2">{visa.description}</p>
      <div className="flex items-center gap-1 text-[13px] font-bold text-[#0D6E6E]">
        View details &amp; forms <ChevronRight size={14} className="mt-0.5" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// VISA DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function VisaDetailModal({ visa, onClose }: { visa: any; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ y:20,opacity:0,scale:0.95 }} animate={{ y:0,opacity:1,scale:1 }}
        exit={{ y:20,opacity:0,scale:0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-[#0D6E6E] tracking-tight">{visa.code}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#0D6E6E]/10 text-[#0D6E6E]">{visa.badge}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">{visa.label}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-600">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <p className="text-sm text-slate-500 leading-relaxed italic">{visa.description}</p>
          <section className="space-y-3">
            <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Eligibility Requirements</h5>
            <div className="space-y-2.5">
              {visa.criteria.map((c: string, i: number) => (
                <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100/50">
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-slate-700 leading-normal font-medium">{c}</p>
                </div>
              ))}
            </div>
          </section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Processing</span>
              </div>
              <p className="text-[13px] font-bold text-slate-800 leading-snug">{visa.processing}</p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-teal-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Key Forms</span>
              </div>
              <p className="text-[13px] font-bold text-slate-800 leading-snug">{visa.forms.join(" · ")}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 py-5 border-t border-slate-100 leading-relaxed text-center">
            Source:{" "}
            <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer" className="text-[#0D6E6E] underline">USCIS.gov</a>
            {" / "}
            <a href="https://travel.state.gov" target="_blank" rel="noopener noreferrer" className="text-[#0D6E6E] underline">travel.state.gov</a>
            . General guidance only — not legal advice.
          </p>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all text-[14px]">
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// UNSUPPORTED DESTINATION
// ─────────────────────────────────────────────────────────────
function UnsupportedScreen({ destination, onChangeDestination, onReset }: {
  destination: string; onChangeDestination: () => void; onReset: () => void;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-[2rem] p-10 text-center shadow-2xl shadow-slate-200/50 border-2 border-slate-100/50">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>
        <span className="inline-block text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full mb-6">Coming Soon</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">Visa guidance for {destination}</h2>
        <p className="text-slate-500 text-[15px] leading-relaxed mb-10 max-w-md mx-auto">
          We're working on adding detailed visa guidance for {destination}. Right now this tool specializes in <strong>United States</strong> immigration.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={onChangeDestination} className="py-4 px-6 rounded-2xl border-2 border-[#0D6E6E] text-[#0D6E6E] font-bold hover:bg-[#0D6E6E]/5 transition-all">Change Destination</button>
          <button onClick={onReset} className="py-4 px-6 rounded-2xl bg-[#0D6E6E] text-white font-bold hover:bg-[#0D6E6E]/90 shadow-xl shadow-[#0D6E6E]/20 transition-all">Start Over</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────────────────────
function ResultsScreen({ answers, results, ineligibleCodes, onReset, onBack }: {
  answers: VisaExplorationAnswers; results: any[]; ineligibleCodes: string[]; onReset: () => void; onBack: () => void;
}) {
  const [modal, setModal] = useState<any>(null);
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border-2 border-slate-100/50 overflow-hidden flex flex-col mt-12 md:mt-2">
        {/* Header */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-[#0D6E6E]/5 to-emerald-50/30 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#0D6E6E] text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0D6E6E]/30">
              {results.length > 0 ? <CheckCircle size={28} /> : <Search size={28} />}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {results.length > 0
                  ? `Great news! ${results.length} visa ${results.length === 1 ? "category" : "categories"} may work for you`
                  : "We couldn't find a match this time"}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-slate-400">{answers.origin as string}</span>
                <ArrowRight size={14} className="text-slate-300" />
                <span className="text-[13px] font-bold text-[#0D6E6E] px-2 py-0.5 rounded-md border border-[#0D6E6E]/20 bg-[#0D6E6E]/5">{answers.destination as string}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-5 py-3 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex-shrink-0 flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={onReset} className="px-5 py-3 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex-shrink-0">
              Start Over
            </button>
          </div>
        </div>

        {/* Explanation */}
        {results.length > 0 && (
          <div className="px-8 sm:px-10 pt-6">
            <p className="text-[13px] text-slate-500 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              Based on your answers, these are the visa categories you may be eligible for. Tap on any card to see full details, requirements, processing times, and the forms you'll need.
            </p>
          </div>
        )}

        {/* Cards */}
        <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[55vh]">
          {results.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <Search size={32} />
              </div>
              <p className="text-slate-600 font-medium max-w-sm mx-auto leading-relaxed mb-2">
                Based on your answers, no visa category matched perfectly.
              </p>
              <p className="text-slate-500 text-[13px] max-w-sm mx-auto leading-relaxed">
                This doesn't mean there's no path for you — immigration is complex. We strongly recommend consulting a licensed immigration attorney who can review your full situation.
              </p>
            </div>
          ) : results.map((visa) => (
            <VisaResultCard key={visa.code} visa={visa} onClick={() => setModal(visa)} />
          ))}
        </div>

        {/* Did not qualify */}
        {ineligibleCodes.length > 0 && (
          <div className="px-8 sm:px-10 pb-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Didn't qualify for these</p>
              <div className="flex flex-wrap gap-2">
                {ineligibleCodes.map((code) => (
                  <span key={code} className="text-[12px] font-semibold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full line-through">{code}</span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Based on your answers to the eligibility questions. A lawyer may find additional options.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-medium text-slate-400">
            Sources:{" "}
            <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer" className="text-[#0D6E6E] underline">USCIS.gov</a>
            {" · "}
            <a href="https://travel.state.gov" target="_blank" rel="noopener noreferrer" className="text-[#0D6E6E] underline">travel.state.gov</a>
            {" · General guidance only — not legal advice."}
          </p>
        </div>
      </div>
      <AnimatePresence>
        {modal && <VisaDetailModal visa={modal} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
export default function VisaExplorationTool() {
  const [answers, setAnswersState] = useState<VisaExplorationAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (field: string, value: any) => {
    setAnswersState((prev) => {
      let next = setNestedAnswer(prev, field, value);
      if (!field.startsWith("gateAnswers.")) {
        (DOWNSTREAM_CLEAR_MAP[field] || []).forEach((k) => delete (next as any)[k]);
      }
      return next;
    });
    setShowResults(false);
  };

  const steps = buildSteps(answers);
  const currentStep = steps[stepIndex];
  
  // Get active country data
  const destination = answers.destination as string;
  const countryData = destination ? getCountryData(destination) : null;

  const gatesDone = countryData ? allGateAnswered(answers, countryData.getCandidateCodes, countryData.gateQuestions) : false;
  
  const eligibleVisas = (gatesDone && countryData) 
    ? getEligibleVisas(answers, countryData.getCandidateCodes, countryData.gateQuestions, countryData.visas) 
    : [];

  const candidates = countryData ? countryData.getCandidateCodes(answers) : [];
  const ineligibleCodes = (gatesDone && countryData)
    ? candidates.filter((code) => !evaluateGate(code, countryData.gateQuestions, (answers.gateAnswers || {})[code] || {}).eligible)
    : [];

  const isLastStep = stepIndex >= steps.length - 1;
  const progress = steps.length > 1 ? Math.round((stepIndex / (steps.length - 1)) * 100) : 3;
  const currentPhase = getPhase(currentStep, stepIndex);

  const handleNext = () => {
    if (!isLastStep) setStepIndex((i) => i + 1);
  };
  const handleBack = () => {
    if (showResults) { setShowResults(false); return; }
    setStepIndex((i) => Math.max(0, i - 1));
  };
  const handleReset = () => { setAnswersState({}); setStepIndex(0); setShowResults(false); };

  if (currentStep?.isUnsupported && !showResults) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center bg-transparent">
        <UnsupportedScreen destination={destination} onChangeDestination={() => setStepIndex(1)} onReset={handleReset} />
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center bg-transparent">
        <ResultsScreen answers={answers} results={eligibleVisas} ineligibleCodes={ineligibleCodes} onReset={handleReset} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center justify-center">
      <div className="w-full bg-white/95 rounded-[2rem] flex flex-col shadow-2xl shadow-slate-200/50 border border-slate-100/50 overflow-hidden">

        {/* Header */}
        <div className="px-8 sm:px-10 pt-8 sm:pt-10 pb-6 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0D6E6E] text-white flex items-center justify-center shadow-lg shadow-[#0D6E6E]/25">
                <Compass size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">
                  Visa <span className="text-[#0D6E6E]">Explorer</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Find the right visa for your journey</p>
              </div>
            </div>
            <PhaseIndicator currentPhase={currentPhase} />
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div layout className="h-full bg-gradient-to-r from-[#0D6E6E] to-emerald-500 rounded-full"
              initial={{ width:0 }} animate={{ width:`${Math.max(progress, 3)}%` }}
              transition={{ duration:0.5, ease:"circOut" }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 sm:px-10 pb-4">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep?.id || stepIndex}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.25, ease:"easeOut" }}
              className="max-w-2xl mx-auto py-2">

              <div className="mb-7">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3 tracking-tight leading-tight">
                  {currentStep?.title}
                </h2>
                {currentStep?.subtitle && currentStep.type !== "gate_question" && (
                  <p className="text-slate-500 text-[14px] sm:text-[15px] leading-relaxed font-medium">
                    {currentStep.subtitle}
                  </p>
                )}
              </div>

              <div className="w-full">
                <StepContent step={currentStep} answers={answers} onAnswer={handleAnswer} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 shrink-0 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            {stepIndex > 0 && (
              <button onClick={handleBack}
                className="flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-2 px-3 rounded-lg hover:bg-white">
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {stepIndex > 2 && (
              <button onClick={handleReset}
                className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors py-2 px-3 rounded-lg hover:bg-white">
                Start over
              </button>
            )}
            {isLastStep && gatesDone ? (
              <button onClick={() => setShowResults(true)}
                className="py-3.5 px-7 rounded-xl bg-[#0D6E6E] text-white font-bold text-[14px] hover:bg-[#095555] shadow-lg shadow-[#0D6E6E]/20 transition-all flex items-center gap-2.5">
                See My Results
              </button>
            ) : (
              <button onClick={handleNext} disabled={!currentStep?.canProceed}
                className={`py-3.5 px-7 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2.5 ${
                  currentStep?.canProceed
                    ? "bg-[#0D6E6E] text-white shadow-lg shadow-[#0D6E6E]/20 hover:bg-[#095555]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}>
                Continue <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}