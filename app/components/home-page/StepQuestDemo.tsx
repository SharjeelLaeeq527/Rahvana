"use client";
import React, { useState } from "react";
import {
  User,
  Users,
  Scale,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Circle,
  ChevronRight,
} from "lucide-react";
import ir1Data from "@/data/visa-category/ir-1.json";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const suiteData = (ir1Data as any).chapters[0].steps[0].quest_data;

const iconMap: Record<string, React.ReactNode> = {
  q1: <User className="w-5 h-5" />,
  q2: <Users className="w-5 h-5" />,
  q3: <Scale className="w-5 h-5" />,
  q4: <MessageSquare className="w-5 h-5" />,
  q5: <ShieldCheck className="w-5 h-5" />,
};

function evaluateLogic(logicStr: string, answers: Record<string, any>) {
  try {
    return new Function("answers", `return ${logicStr}`)(answers);
  } catch {
    return { state: "review", title: "Error", body: "Could not evaluate." };
  }
}

function getStatusMeta(res: any, iconSize = 14) {
  if (!res)
    return {
      label: "Not started",
      color: "text-[#6b8097]",
      icon: <Circle size={iconSize} className="opacity-40" />,
      bg: "bg-white",
      border: "border-[#d0e4f7]",
      btnSolid: "bg-[#8284bf] text-white",
      btnOutline: "bg-white text-[#6b8097] border border-[#d0e4f7]",
      cardBg: "bg-[#f7f6f3]",
      cardBorder: "border-[#e2e0db]",
      iconBg: "bg-[#e2e0db]",
      iconBorder: "border-[#e2e0db]",
      iconText: "text-[#7a7a7a]",
      badge: "bg-[#e2e0db] border-[#b0b0b0] text-[#7a7a7a]",
    };
  switch (res.state) {
    case "pass":
      return {
        label: "Passed",
        color: "text-[#2e7d32]",
        icon: <CheckCircle2 size={iconSize} />,
        bg: "bg-[#eaf7ed]",
        border: "border-[#b7e2c1]",
        btnSolid: "bg-[#2e7d32] text-white",
        btnOutline: "bg-[#eaf7ed] text-[#2e7d32] border border-[#2e7d32]",
        cardBg: "bg-[#eaf7ed]",
        cardBorder: "border-[#b7e2c1]",
        iconBg: "bg-[#b7e2c1]",
        iconBorder: "border-[#b7e2c1]",
        iconText: "text-[#2e7d32]",
        badge: "bg-[#b7e2c1] text-[#2e7d32] border-[#b7e2c1]",
      };
    case "caution":
      return {
        label: "Caution",
        color: "text-[#a97c50]",
        icon: <AlertTriangle size={iconSize} />,
        bg: "bg-[#f3e7d7]",
        border: "border-[#a97c50]",
        btnSolid: "bg-[#a97c50] text-white",
        btnOutline: "bg-[#f3e7d7] text-[#a97c50] border border-[#a97c50]",
        cardBg: "bg-[#f3e7d7]",
        cardBorder: "border-[#a97c50]",
        iconBg: "bg-[#a97c50]/10",
        iconBorder: "border-[#a97c50]",
        iconText: "text-[#a97c50]",
        badge: "bg-[#a97c50]/10 text-[#a97c50] border-[#a97c50]",
      };
    case "review":
      return {
        label: "Review",
        color: "text-orange-600",
        icon: <Info size={iconSize} />,
        bg: "bg-orange-50",
        border: "border-orange-200",
        btnSolid: "bg-orange-600 text-white",
        btnOutline: "bg-white text-orange-600 border border-orange-600",
        cardBg: "bg-[#fff6ed]",
        cardBorder: "border-[#ffd8b5]",
        iconBg: "bg-[#ffd8b5]",
        iconBorder: "border-[#ffd8b5]",
        iconText: "text-[#b26a00]",
        badge: "bg-[#ffd8b5] text-[#b26a00] border-[#ffd8b5]",
      };
    case "stop":
      return {
        label: "Blocked",
        color: "text-red-600",
        icon: <XCircle size={iconSize} />,
        bg: "bg-red-50",
        border: "border-red-200",
        btnSolid: "bg-red-600 text-white",
        btnOutline: "bg-white text-red-600 border border-red-600",
        cardBg: "bg-[#fbeaea]",
        cardBorder: "border-[#f7b8b8]",
        iconBg: "bg-[#f7b8b8]",
        iconBorder: "border-[#f7b8b8]",
        iconText: "text-[#b71c1c]",
        badge: "bg-[#f7b8b8] text-[#b71c1c] border-[#f7b8b8]",
      };
    default:
      return {
        label: "Completed",
        color: "text-[#2e7d32]",
        icon: <CheckCircle2 size={iconSize} />,
        bg: "bg-[#eaf7ed]",
        border: "border-[#b7e2c1]",
        btnSolid: "bg-[#2e7d32] text-white",
        btnOutline: "bg-[#eaf7ed] text-[#2e7d32] border border-[#2e7d32]",
        cardBg: "bg-[#eaf7ed]",
        cardBorder: "border-[#b7e2c1]",
        iconBg: "bg-[#b7e2c1]",
        iconBorder: "border-[#b7e2c1]",
        iconText: "text-[#2e7d32]",
        badge: "bg-[#b7e2c1] text-[#2e7d32] border-[#b7e2c1]",
      };
  }
}

export function StepQuestDemo({ onComplete }: { onComplete: () => void }) {
  const quests: any[] = suiteData.quests;
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [currentScreenIdx, setCurrentScreenIdx] = useState(0);
  const [questResults, setQuestResults] = useState<Record<string, any>>({});
  const [suiteAnswers, setSuiteAnswers] = useState<Record<string, Record<string, any>>>({});
  const [tempAnswers, setTempAnswers] = useState<Record<string, any>>({});
  const [view, setView] = useState<"landing" | "quest" | "result">("landing");
  const [showHint, setShowHint] = useState(false);

  const activeQuest: any = quests.find((q) => q.id === activeQuestId);
  const completedCount = Object.keys(questResults).length;
  const progressPct = (completedCount / quests.length) * 100;
  const allDone = completedCount === quests.length;

  const handleStartQuest = (id: string) => {
    setActiveQuestId(id);
    setCurrentScreenIdx(0);
    setTempAnswers(suiteAnswers[id] || {});
    setShowHint(false);
    setView("quest");
  };

  const handleOptionSelect = (screenId: string, value: string, type: "single" | "multi") => {
    if (type === "multi") {
      const cur = (tempAnswers[screenId] as string[]) || [];
      setTempAnswers((p) => ({
        ...p,
        [screenId]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      }));
    } else {
      setTempAnswers((p) => ({ ...p, [screenId]: value }));
    }
  };

  const handleFinish = () => {
    if (!activeQuest) return;
    const finalAnswers = { ...suiteAnswers, [activeQuest.id]: tempAnswers };
    setSuiteAnswers(finalAnswers);
    const result = evaluateLogic(activeQuest.result_logic, tempAnswers);
    setQuestResults((prev) => ({ ...prev, [activeQuest.id]: result }));
    setView("result");
  };

  const handleNext = () => {
    if (!activeQuest) return;
    const screen = activeQuest.screens[currentScreenIdx];
    const val = tempAnswers[screen.id];
    if (screen.type === "single") {
      const opt = screen.options.find((o: any) => o.value === val);
      if (opt?.outcome === "stop" || opt?.outcome === "pass_direct") {
        handleFinish();
        return;
      }
    }
    if (currentScreenIdx < activeQuest.screens.length - 1) {
      setCurrentScreenIdx(currentScreenIdx + 1);
      setShowHint(false);
    } else handleFinish();
  };

  // ── LANDING ──────────────────────────────────────────────────────────────────
  if (view === "landing") {
    return (
      <div className="w-full max-w-[740px] mx-auto px-4 pt-10 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 accent-brown leading-tight">
            {suiteData.title}
          </h1>
          <p className="text-sm text-[#8284bf] leading-relaxed">{suiteData.subtitle}</p>
        </div>
        <div className="mb-6">
          <div className="w-full h-[5px] rounded-full bg-[#f3f0fb] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8284bf] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {quests.map((q: any) => {
            const res = questResults[q.id];
            const meta = getStatusMeta(res);
            return (
              <button
                key={q.id}
                onClick={() => handleStartQuest(q.id)}
                className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-[14px] border-[1.5px] text-left transition-all hover:shadow-md hover:-translate-y-px ${meta.cardBg} ${meta.cardBorder}`}
              >
                <div
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 border ${meta.iconBg} ${meta.iconBorder}`}
                >
                  {res?.state === "pass" ? (
                    <CheckCircle2 className={`w-5 h-5 ${meta.iconText}`} />
                  ) : (
                    <span className={meta.iconText}>{iconMap[q.id]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-[15px] font-semibold leading-snug accent-brown">
                    {q.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#8284bf] mt-0.5">{q.subtitle}</p>
                </div>
                <div
                  className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap shrink-0 ${meta.badge}`}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </div>
                <div className={`flex sm:hidden shrink-0 ${meta.color}`}>{meta.icon}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-8 px-4 py-3 rounded-[9px] text-[11px] text-center text-[#8284bf] bg-[#f3f0fb]">
          Rahvana provides structured guidance only. This is not legal advice.
        </div>
        {allDone && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onComplete}
            className="mt-6 w-full rounded-2xl bg-[#8284bf] py-4 text-base font-black uppercase tracking-widest text-white shadow-xl hover:bg-[#6b6fa8] transition-all"
          >
            Finish Step 1 & Continue
          </motion.button>
        )}
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────────
  if (view === "result" && activeQuest) {
    const result = questResults[activeQuest.id];
    const meta = getStatusMeta(result, 36);
    return (
      <div className="w-full max-w-[600px] mx-auto px-4 pt-16 pb-10 flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-center w-full">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${meta.bg} ${meta.color} flex items-center justify-center mx-auto mb-6 border border-current/10`}
          >
            {meta.icon}
          </div>
          <div
            className={`inline-block px-4 py-1.5 rounded-full ${meta.bg} ${meta.color} text-[10px] font-bold uppercase tracking-[0.15em] border border-current/20 mb-4`}
          >
            {meta.label}
          </div>
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl mb-3 tracking-tight italic accent-brown`}
          >
            {result?.title}
          </h2>
          <p className="mb-8 leading-relaxed max-w-[400px] mx-auto text-[14px] sm:text-[16px] text-[#8284bf]">
            {result?.body}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[280px] mx-auto">
            <button
              onClick={() => setView("landing")}
              className={`w-full px-6 py-3.5 rounded-[16px] font-bold text-[15px] transition-all shadow-md ${meta.btnSolid}`}
            >
              Back to Overview
            </button>
            <button
              onClick={() => {
                setCurrentScreenIdx(0);
                setView("quest");
              }}
              className={`w-full px-6 py-3.5 rounded-[16px] font-medium text-[14px] transition-all ${meta.btnOutline}`}
            >
              Review my answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUEST ────────────────────────────────────────────────────────────────────
  if (view === "quest" && activeQuest) {
    const screen = activeQuest.screens[currentScreenIdx];
    const progressIdx = currentScreenIdx + 1;
    const progressPctQ = (progressIdx / activeQuest.screens.length) * 100;
    const val = tempAnswers[screen.id];
    const isMulti = screen.type === "multi";
    const isAnswered = isMulti ? ((val as string[]) || []).length > 0 : !!val;

    return (
      <div className="w-full flex flex-col">
        {/* Topbar */}
        <div className="flex items-center gap-2 shrink-0 border-b border-[#8284bf]/40 px-4 h-10">
          <button
            onClick={() => setView("landing")}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f3f0fb] hover:bg-[#e6d6f5] transition-colors"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-none stroke-[#8284bf] stroke-2"
              style={{ strokeLinecap: "round" } as React.CSSProperties}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex-1 h-[3px] rounded-full bg-[#f3f0fb] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8284bf] transition-all duration-300"
              style={{ width: `${progressPctQ}%` }}
            />
          </div>
          <span className="text-[11px] font-medium accent-brown">
            {progressIdx} / {activeQuest.screens.length}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 pt-6 pb-10">
          <div className="w-full max-w-[560px]">
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-4 accent-brown">
              {activeQuest.title}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-[28px] mb-2 leading-snug accent-brown">
              {screen.question}
            </h2>
            {screen.helper && (
              <p className="text-sm text-[#8284bf] mb-6 leading-relaxed">{screen.helper}</p>
            )}

            {/* Hint */}
            {screen.hint && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="flex items-center gap-2 text-[14px] font-bold accent-brown hover:opacity-80"
                >
                  <span
                    className={`transition-transform duration-300 ${showHint ? "rotate-0" : "-rotate-90"}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M6 8L10 12L14 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Examples
                </button>
                {showHint && (
                  <div className="mt-3 p-4 rounded-[14px] bg-[#f7ede5] border border-[#a97c50]/40">
                    {screen.hint.intro && (
                      <p className="text-[13px] font-bold accent-brown mb-2">{screen.hint.intro}</p>
                    )}
                    <ul className="space-y-1.5">
                      {screen.hint.items.map((it: string, i: number) => (
                        <li key={i} className="flex gap-2 text-[13px] text-[#8284bf]">
                          <span className="accent-brown">•</span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-2.5 mb-6">
              {screen.options.map((opt: any) => {
                const isSelected = isMulti
                  ? ((val as string[]) || []).includes(opt.value)
                  : val === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(screen.id, opt.value, screen.type)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-[14px] border-[1.5px] text-left transition-all duration-200 ${isSelected ? "border-[#8284bf] bg-[#f0f1fb] shadow-[0_0_0_3px_rgba(130,132,191,0.10)]" : "border-[#8284bf]/40 bg-white hover:border-[#8284bf] hover:bg-[#f0f1fb]"}`}
                  >
                    <div
                      className={`w-5 h-5 ${isMulti ? "rounded-md" : "rounded-full"} border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${isSelected ? "border-[#8284bf] bg-[#8284bf]" : "border-[#8284bf]/40 bg-white"}`}
                    >
                      {isSelected && (
                        <div
                          className={`${isMulti ? "w-2.5 h-2.5 rounded-sm" : "w-2 h-2 rounded-full"} bg-white`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium leading-snug ${isSelected ? "accent-brown" : "accent-brown/80"}`}
                      >
                        {opt.label}
                      </div>
                      {opt.sub && <div className="text-xs text-[#8284bf] mt-0.5">{opt.sub}</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nav */}
            <div className="flex flex-col gap-3">
              <button
                disabled={!isAnswered}
                onClick={handleNext}
                className={`w-full py-3.5 rounded-lg font-bold text-[15px] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed ${isAnswered ? "bg-[#8284bf] text-white hover:bg-[#6b6fa8]" : "bg-[#8284bf]/40 text-white"}`}
              >
                {currentScreenIdx === activeQuest.screens.length - 1 ? "Get Results" : "Continue"}
                <ChevronRight size={18} />
              </button>
              {currentScreenIdx > 0 && (
                <button
                  onClick={() => {
                    setCurrentScreenIdx(currentScreenIdx - 1);
                    setShowHint(false);
                  }}
                  className="w-full py-3 text-[13px] font-medium accent-brown opacity-70 hover:opacity-100"
                >
                  ← Previous
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
