"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  Circle,
} from "lucide-react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { QuestSuite, QuestData } from "../types";

interface QuestRendererProps {
  quest: QuestSuite;
  onComplete: () => void;
  state: WizardState;
  actions: {
    updateAnswers: (
      answers: Record<
        string,
        Record<string, Record<string, string | string[]>>
      >,
    ) => void;
    updateMetadata: (data: Record<string, unknown>) => void;
  };
}

export function QuestRenderer({
  quest: suite,
  onComplete,
  state,
  actions,
}: QuestRendererProps) {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [currentScreenIdx, setCurrentScreenIdx] = useState(0);
  const [suiteAnswers, setSuiteAnswers] = useState<
    Record<string, Record<string, string | string[]>>
  >(
    (state.answers?.[suite.id] as Record<
      string,
      Record<string, string | string[]>
    >) || {},
  );
  const [questResults, setQuestResults] = useState<
    Record<string, { state: string; title: string; body: string }>
  >(
    (state.metadata?.questResults as Record<
      string,
      { state: string; title: string; body: string }
    >) || {},
  );
  const [showHint, setShowHint] = useState(false);
  const [tempAnswers, setTempAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [view, setView] = useState<"landing" | "quest" | "result">("landing");

  const activeQuest: QuestData | undefined = suite.quests.find(
    (q) => q.id === activeQuestId,
  );

  // Sync results to metadata
  useEffect(() => {
    actions.updateMetadata({ questResults });
  }, [questResults, actions]);

  const handleStartQuest = (id: string) => {
    setActiveQuestId(id);
    setCurrentScreenIdx(0);
    setTempAnswers(suiteAnswers[id] || {});
    setShowHint(false);
    setView("quest");
  };

  const handleOptionSelect = (
    screenId: string,
    value: string,
    type: "single" | "multi",
  ) => {
    if (type === "multi") {
      const current = (tempAnswers[screenId] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setTempAnswers((prev) => ({ ...prev, [screenId]: updated }));
    } else {
      setTempAnswers((prev) => ({ ...prev, [screenId]: value }));
    }
  };

  const evaluateLogic = (
    logicStr: string,
    answers: Record<string, string | string[]>,
  ) => {
    try {
      // Basic sandbox-lite for the JSON logic strings
      const fn = new Function("answers", `return ${logicStr}`);
      return fn(answers);
    } catch (e) {
      console.error("Logic evaluation error:", e);
      return {
        state: "review",
        title: "Error",
        body: "Could not evaluate results.",
      };
    }
  };

  const handleNext = () => {
    if (!activeQuest) return;
    const screen = activeQuest.screens[currentScreenIdx];
    const val = tempAnswers[screen.id];

    // Check results for immediate exit or next screen
    if (screen.type === "single") {
      const opt = screen.options.find((o) => o.value === val);
      if (opt?.outcome === "stop" || opt?.outcome === "pass_direct") {
        handleFinishQuest();
        return;
      }
    }

    if (currentScreenIdx < activeQuest.screens.length - 1) {
      setCurrentScreenIdx(currentScreenIdx + 1);
      setShowHint(false);
    } else {
      handleFinishQuest();
    }
  };

  const handleFinishQuest = () => {
    if (!activeQuest) return;
    const finalAnswers = { ...suiteAnswers, [activeQuest.id]: tempAnswers };
    setSuiteAnswers(finalAnswers);
    actions.updateAnswers({ [suite.id]: finalAnswers });

    const result = evaluateLogic(activeQuest.resultLogic, tempAnswers);
    setQuestResults((prev) => ({ ...prev, [activeQuest.id]: result }));
    setView("result");
  };

  const getStatusMeta = (id: string) => {
    const res = questResults[id];
    if (!res)
      return {
        label: "Not started",
        color: "text-[#6b8097]",
        icon: <Circle size={14} className="opacity-40" />,
        bg: "bg-transparent",
        border: "border-[#d0e4f7]",
      };

    switch (res.state) {
      case "pass":
        return {
          label: "Passed",
          color: "text-[#1a7a5e]",
          icon: <CheckCircle2 size={14} />,
          bg: "bg-[#f0faf6]",
          border: "border-[#b5e0d0]/50",
        };
      case "caution":
        return {
          label: "Caution",
          color: "text-amber-600",
          icon: <AlertTriangle size={14} />,
          bg: "bg-amber-50",
          border: "border-amber-200/50",
        };
      case "review":
        return {
          label: "Review",
          color: "text-orange-600",
          icon: <Info size={14} />,
          bg: "bg-orange-50",
          border: "border-orange-200/50",
        };
      case "stop":
        return {
          label: "Blocked",
          color: "text-red-600",
          icon: <XCircle size={14} />,
          bg: "bg-red-50",
          border: "border-red-200/50",
        };
      default:
        return {
          label: "Completed",
          color: "text-[#3b7dd8]",
          icon: <CheckCircle2 size={14} />,
          bg: "bg-[#f0f7ff]",
          border: "border-[#d0e4f7]",
        };
    }
  };

  if (view === "landing") {
    const completedCount = Object.keys(questResults).length;
    const progressPct = (completedCount / suite.quests.length) * 100;

    return (
      <div className="max-w-[740px] mx-auto w-full animate-in fade-in duration-500">
        <div className="px-6 pt-12 pb-[72px]">
          <div className="mb-9">
            {/* <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097] mb-1.5">
              Chapter 1 · USCIS Petition Filing
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#3b7dd8] mb-5">
              Step 1 — Determine Eligibility
            </div> */}
            <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] mb-2.5 leading-[1.2]">
              {suite.title}
            </h1>
            <p className="text-[#3a4f63] text-[15px] max-w-[540px] leading-[1.65]">
              {suite.subtitle}
            </p>
          </div>

          <div className="mb-9">
            <div className="w-full h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-[#3b7dd8] to-[#5b95e8] transition-all duration-1000 ease-out rounded-[10px]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            {suite.quests.map((q, idx) => {
              const meta = getStatusMeta(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => handleStartQuest(q.id)}
                  className={`w-full flex items-center gap-[16px] px-[20px] py-[18px] rounded-[14px] border-[1.5px] text-left transition-all hover:border-[#3b7dd8] hover:shadow-[0_8px_32px_rgba(15,31,56,0.12),0_2px_8px_rgba(15,31,56,0.06)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] group
                    ${meta.bg} ${meta.border} bg-white shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)]`}
                >
                  <div
                    className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[18px] shrink-0 transition-all border
                    ${meta.bg === "bg-transparent" ? "bg-[#e8f1fb] border-[#d0e4f7] text-[#2d4a6e]" : "bg-white " + meta.border + " " + meta.color}`}
                  >
                    {meta.bg === "bg-transparent" ? idx + 1 : meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#0f1f38] mb-[4px] leading-[1.3] truncate">
                      {q.title}
                    </h3>
                    <p className="text-[13px] text-[#6b8097] font-normal leading-[1.4] truncate">
                      {q.subtitle}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-[5px] px-[11px] py-[5px] rounded-full border text-[12px] font-medium whitespace-nowrap transition-all shrink-0 ${meta.color} ${meta.bg} ${meta.border}`}
                  >
                    <span className="text-[14px] leading-none mb-0.5">
                      {meta.icon}
                    </span>
                    {meta.label}
                  </div>
                </button>
              );
            })}
          </div>

          {completedCount === suite.quests.length && (
            <div className="mt-12 text-center">
              <button
                onClick={onComplete}
                className="px-12 py-5 bg-[#3b7dd8] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-[#3b7dd8]/20 hover:bg-[#0f1f38] transition-all"
              >
                Continue to Document Prep →
              </button>
            </div>
          )}

          <div className="mt-[48px] px-[20px] py-[16px] bg-[#e8f1fb] rounded-[9px] text-[12px] text-[#6b8097] leading-[1.65] text-center">
            Rahvana provides structured guidance only. This is not legal advice.
            <br />
            Consult a licensed immigration attorney for case-specific decisions.
          </div>
        </div>
      </div>
    );
  }

  if (view === "result" && activeQuest) {
    const result = questResults[activeQuest.id];
    const meta = getStatusMeta(activeQuest.id);

    return (
      <div className="max-w-[600px] mx-auto w-full p-6 animate-in zoom-in-95 fade-in duration-500 min-h-[600px] flex items-center justify-center">
        <div className="bg-white border border-[#d0e4f7] rounded-[24px] p-10 md:p-16 text-center shadow-xl w-full">
          <div
            className={`w-20 h-20 rounded-full ${meta.bg} ${meta.color} flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner`}
          >
            {meta.icon}
          </div>
          <div
            className={`inline-block px-4 py-1.5 rounded-full ${meta.bg} ${meta.color} text-[10px] font-bold uppercase tracking-[0.15em] border border-current/20 mb-6`}
          >
            {meta.label}
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#0f1f38] mb-4 tracking-tight italic">
            {result.title}
          </h2>
          <p className="text-[#3a4f63] text-[16px] mb-10 leading-relaxed max-w-[400px] mx-auto opacity-90">
            {result.body}
          </p>
          <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
            <button
              onClick={() => setView("landing")}
              className="px-8 py-4 bg-[#3b7dd8] text-white rounded-[16px] font-bold text-[15px] hover:bg-[#0f1f38] transition-all shadow-md active:scale-95"
            >
              Back to Overview
            </button>
            <button
              onClick={() => setView("quest")}
              className="px-8 py-3.5 bg-white text-[#6b8097] border border-[#d0e4f7] rounded-[16px] font-medium text-[14px] hover:border-[#3b7dd8] hover:text-[#3b7dd8] transition-all"
            >
              Review my answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "quest" && activeQuest) {
    const screen = activeQuest.screens[currentScreenIdx];
    const progressIdx = currentScreenIdx + 1;
    const progressPct = (progressIdx / activeQuest.screens.length) * 100;
    const isAnswered =
      tempAnswers[screen.id] &&
      (Array.isArray(tempAnswers[screen.id])
        ? tempAnswers[screen.id].length > 0
        : true);

    return (
      <div className="w-full h-full min-h-[700px] flex flex-col animate-in slide-in-from-right-4 fade-in duration-500 bg-white">
        {/* Topbar */}
        <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
          <button
            onClick={() => setView("landing")}
            className="w-[36px] h-[36px] rounded-full border-none bg-[#f5f7fa] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#e8f1fb] shrink-0"
            aria-label="Close quest"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[16px] h-[16px] stroke-[#3a4f63] fill-none stroke-2 shrink-0"
              style={{ strokeLinecap: "round" }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#3b7dd8] to-[#5b95e8] rounded-[10px] transition-all duration-400 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <span className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
            {progressIdx} / {activeQuest.screens.length}
          </span>
        </div>

        {/* Quest Body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_32px]">
          <div className="w-full max-w-[560px] flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[#3b7dd8] mb-[18px]">
              {activeQuest.title}
            </div>
            <h2 className="text-[clamp(20px,3.5vw,26px)] font-serif text-[#0f1f38] mb-2.5 leading-[1.35]">
              {screen.question}
            </h2>
            {screen.helper && (
              <p className="text-[#3a4f63] text-[14px] mb-7 leading-relaxed">
                {screen.helper}
              </p>
            )}

            <div className="flex flex-col gap-[10px] mb-6">
              {screen.options.map((opt) => {
                const val = tempAnswers[screen.id];
                const isSelected =
                  screen.type === "multi"
                    ? ((val as string[]) || []).includes(opt.value)
                    : val === opt.value;

                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      handleOptionSelect(screen.id, opt.value, screen.type)
                    }
                    className={`w-full flex items-start gap-3.5 px-5 py-4 rounded-[14px] border-[1.5px] text-left transition-all duration-200
                      ${isSelected ? "border-[#3b7dd8] bg-[#3b7dd8]/5 shadow-[0_0_0_3px_rgba(59,125,216,0.12)]" : "border-[#d0e4f7] bg-white hover:border-[#3b7dd8] hover:bg-[#3b7dd8]/5"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-px shrink-0 transition-all
                      ${isSelected ? "border-[#3b7dd8] bg-[#3b7dd8]" : "border-[#d0e4f7] bg-white"}`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[15px] font-medium leading-[1.4] ${isSelected ? "text-[#0f1f38]" : "text-[#1c2b3a]"}`}
                      >
                        {opt.label}
                      </div>
                      {opt.sub && (
                        <div className="text-[13px] text-[#6b8097] mt-0.5 leading-relaxed">
                          {opt.sub}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {screen.hint && (
              <div className="mb-8">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-[14px] font-bold text-[#3b7dd8] hover:opacity-80 transition-opacity"
                >
                  <span>{showHint ? "▾" : "▸"}</span>
                  <span>Examples & accepted documents</span>
                </button>
                {showHint && (
                  <div className="mt-4 p-5 bg-[#f0f7ff] border border-[#d0e4f7] rounded-[16px] animate-in slide-in-from-top-2 duration-300">
                    {screen.hint.intro && (
                      <p className="text-[13px] font-bold text-[#0f1f38] mb-2">
                        {screen.hint.intro}
                      </p>
                    )}
                    <ul className="space-y-2">
                      {screen.hint.items.map((it, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[13.5px] text-[#3a4f63] leading-relaxed"
                        >
                          <span className="text-[#3b7dd8] mt-1">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <button
                disabled={!isAnswered}
                onClick={handleNext}
                className="w-full py-5 bg-[#3b7dd8] text-white rounded-[18px] font-bold text-[16px] shadow-lg shadow-[#3b7dd8]/20 hover:bg-[#0f1f38] transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
              >
                {currentScreenIdx === activeQuest.screens.length - 1
                  ? "Get Results"
                  : "Continue"}
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              {currentScreenIdx > 0 && (
                <button
                  onClick={() => setCurrentScreenIdx(currentScreenIdx - 1)}
                  className="w-full py-4 text-[#6b8097] text-[14px] font-medium hover:text-[#0f1f38] transition-all"
                >
                  ← Previous screen
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
