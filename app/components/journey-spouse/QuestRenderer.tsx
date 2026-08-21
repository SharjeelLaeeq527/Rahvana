"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ChevronRight, CheckCircle2, XCircle, Info, Circle } from "lucide-react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  QuestSuite,
  QuestData,
} from "@/app/(tools)/(visa)/visa-category/[visa-journey]/components/types";
import { EligibilityRiskBanner } from "./components/EligibilityRiskBanner";
import { FloatingSidePanel } from "./components/FloatingSidePanel";
import { E, msg } from "@/lib/errors";

interface QuestRendererProps {
  quest: QuestSuite;
  onComplete: () => void;
  state: WizardState;
  actions: {
    updateAnswers: (
      answers: Record<string, Record<string, Record<string, string | string[]>>>
    ) => void;
    updateMetadata: (data: Record<string, unknown>) => void;
  };
  isChapter1?: boolean;
  isChapter2?: boolean;
  isChapter3?: boolean;
}

export function QuestRenderer({
  quest: suite,
  onComplete,
  state,
  actions,
  isChapter1 = false,
  isChapter2 = false,
  isChapter3 = false,
}: QuestRendererProps) {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [currentScreenIdx, setCurrentScreenIdx] = useState(0);

  const suiteId = (suite as any).id || (suite as any).step_key;

  // Answers key in metadata — used to persist across refreshes
  const metaAnswersKey = `questAnswers_${suiteId}`;

  const [suiteAnswers, setSuiteAnswers] = useState<
    Record<string, Record<string, string | string[]>>
  >(
    // Prefer in-memory answers, fall back to metadata (backend-persisted)
    (state.answers?.[suiteId] as Record<string, Record<string, string | string[]>>) ||
      (state.metadata?.[metaAnswersKey] as Record<string, Record<string, string | string[]>>) ||
      {}
  );
  const [questResults, setQuestResults] = useState<
    Record<string, { state: string; title: string; body: string }>
  >(
    (state.metadata?.questResults as Record<
      string,
      { state: string; title: string; body: string }
    >) || {}
  );
  const [showHint, setShowHint] = useState(false);
  const [tempAnswers, setTempAnswers] = useState<Record<string, string | string[]>>({});
  const [view, setView] = useState<"landing" | "quest" | "result">("landing");

  useEffect(() => {
    if (state.metadata?.questResults) {
      setQuestResults((prev) => ({ ...state.metadata.questResults, ...prev }));
    }
  }, [state.metadata?.questResults]);

  // Sync persisted answers into local state once backend data arrives
  useEffect(() => {
    const persisted = state.metadata?.[metaAnswersKey] as
      Record<string, Record<string, string | string[]>> | undefined;
    if (persisted && Object.keys(persisted).length > 0) {
      setSuiteAnswers((prev) => (Object.keys(prev).length === 0 ? persisted : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.metadata?.[metaAnswersKey]]);

  const activeQuest: QuestData | undefined = suite.quests.find((q) => q.id === activeQuestId);

  useEffect(() => {
    if (Object.keys(questResults).length > 0) {
      actions.updateMetadata({ questResults });
    }
  }, [questResults, actions]);

  const handleStartQuest = (id: string) => {
    setActiveQuestId(id);
    setCurrentScreenIdx(0);
    setTempAnswers(suiteAnswers[id] || {});
    setShowHint(false);
    setView("quest");
  };

  const handleOptionSelect = (screenId: string, value: string, type: "single" | "multi") => {
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

  const evaluateLogic = (logicStr: string, answers: Record<string, string | string[]>) => {
    try {
      const fn = new Function("answers", `return ${logicStr}`);
      return fn(answers);
    } catch (e) {
      console.error("Logic evaluation error:", e);
      return {
        state: "review",
        title: msg(E.TOOL_LOGIC_EVALUATION_FAILED),
        body: msg(E.TOOL_LOGIC_EVALUATION_FAILED),
      };
    }
  };

  const handleNext = () => {
    if (!activeQuest) return;
    const screen = activeQuest.screens[currentScreenIdx];
    const val = tempAnswers[screen.id];

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
    // Persist answers to backend so risk flags survive page refresh
    actions.updateMetadata({ [metaAnswersKey]: finalAnswers });

    const logic = (activeQuest as any).result_logic || (activeQuest as any).resultLogic;
    const result = evaluateLogic(logic, tempAnswers);

    setQuestResults((prev) => {
      const next = { ...prev, [activeQuest.id]: result };
      return next;
    });

    setView("result");
  };

  const getStatusMeta = (id: string, iconSize = 14) => {
    const res = questResults[id] || (state.metadata?.questResults as any)?.[id];
    if (!res)
      return {
        label: "Not started",
        color: "text-[#6b8097]",
        icon: <Circle size={iconSize} className="opacity-40" />,
        bg: "bg-white",
        border: "border-[#d0e4f7]",
        btnSolid: "bg-primary text-white hover:bg-[#0f1f38]",
        btnOutline:
          "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-primary hover:text-primary",
      };

    switch (res.state) {
      case "pass":
        return {
          label: "Passed",
          color: "text-primary",
          icon: <CheckCircle2 size={iconSize} />,
          bg: "bg-primary/10",
          border: "border-primary/20",
          btnSolid: "bg-primary text-white hover:bg-primary/90",
          btnOutline: "bg-white text-primary border border-primary hover:bg-primary/5",
        };
      case "caution":
        return {
          label: "Caution",
          color: "text-[#a97c50]",
          icon: <AlertTriangle size={iconSize} />,
          bg: "bg-[#f3e7d7]",
          border: "border-[#a97c50]",
          btnSolid: "bg-[#a97c50] text-white border border-[#a97c50]",
          btnOutline: "bg-[#f3e7d7] text-[#a97c50] border border-[#a97c50] hover:bg-[#a97c50]/10",
        };
      case "review":
        return {
          label: "Review",
          color: "text-orange-600",
          icon: <Info size={iconSize} />,
          bg: "bg-orange-50",
          border: "border-orange-200/50",
          btnSolid: "bg-orange-600 text-white hover:bg-orange-700",
          btnOutline: "bg-white text-orange-600 border border-orange-600 hover:bg-orange-50",
        };
      case "stop":
        return {
          label: "Blocked",
          color: "text-red-600",
          icon: <XCircle size={iconSize} />,
          bg: "bg-red-50",
          border: "border-red-200/50",
          btnSolid: "bg-red-600 text-white hover:bg-red-700",
          btnOutline: "bg-white text-red-600 border border-red-600 hover:bg-red-50",
        };
      default:
        return {
          label: "Completed",
          color: "text-primary",
          icon: <CheckCircle2 size={iconSize} />,
          bg: "bg-[#f0f7ff]",
          border: "border-[#d0e4f7]",
          btnSolid: "bg-primary text-white hover:bg-[#0f1f38]",
          btnOutline: "bg-white text-primary border border-primary hover:bg-primary/5",
        };
    }
  };

  // ─── LANDING VIEW ──────────────────────────────────────────────────────────
  if (view === "landing") {
    const completedCount = Object.keys(questResults).length;
    const progressPct = (completedCount / suite.quests.length) * 100;

    return (
      <div className="animate-in fade-in mx-auto flex w-full max-w-[680px] flex-col px-4 sm:px-6 md:px-8 pt-5 pb-10 duration-500 md:pt-8">
        {/* Header */}
        <div className="mb-6 pt-2 sm:mb-8">
          <h1 className="mt-4 mb-2 text-[clamp(28px,4vw,36px)] leading-[1.15] font-bold tracking-tight break-words text-[#0c1b33]">
            {suite.title}
          </h1>
          <p
            className={`text-sm leading-relaxed sm:text-base ${
              isChapter1 ? "text-[#8284bf]" : isChapter2 ? "text-[#2f062e]" : "text-[#020a1a]"
            }`}
          >
            {suite.subtitle}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div
            className={`h-[5px] w-full overflow-hidden rounded-full ${
              isChapter1
                ? "bg-[#f3f0fb]"
                : isChapter2
                  ? "bg-[#f4e6f3]"
                  : isChapter3
                    ? "bg-[#e8ecf3]"
                    : "bg-primary/30"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isChapter1
                  ? "bg-[#8284bf]"
                  : isChapter2
                    ? "bg-[#520a50]"
                    : isChapter3
                      ? "bg-[#051738]"
                      : "bg-primary"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Quest cards */}
        <div className="flex flex-col gap-2.5">
          {suite.quests.map((q) => {
            const meta = getStatusMeta(q.id);

            let statusTheme = {
              bg: isChapter1 ? "bg-[#f7f6f3]" : "bg-[#f7fafd]",
              border: isChapter1 ? "border-[#e2e0db]" : "border-[#c3d3e6]",
              iconBg: isChapter1 ? "bg-[#e2e0db]" : "bg-[#f7fafd]",
              iconBorder: isChapter1 ? "border-[#e2e0db]" : "border-[#c3d3e6]",
              iconText: isChapter1 ? "text-[#7a7a7a]" : "text-[#3a4f63]",
              badge: isChapter1
                ? "bg-[#e2e0db] border-[#b0b0b0] text-[#7a7a7a]"
                : "bg-[#e3ecf7] border-[#b7c7db] text-[#3a4f63]",
            };

            if (meta.label === "Passed" || meta.label === "Completed") {
              statusTheme = isChapter1
                ? {
                    bg: "bg-[#eaf7ed]",
                    border: "border-[#b7e2c1]",
                    iconBg: "bg-[#b7e2c1]",
                    iconBorder: "border-[#b7e2c1]",
                    iconText: "text-[#2e7d32]",
                    badge: "bg-[#b7e2c1] text-[#2e7d32] border-[#b7e2c1] shadow-sm",
                  }
                : {
                    bg: "bg-[#e3f1fa]",
                    border: "border-[#7bb6e3]",
                    iconBg: "bg-[#7bb6e3]",
                    iconBorder: "border-[#7bb6e3]",
                    iconText: "text-[#174c6f]",
                    badge: "bg-[#7bb6e3] text-[#174c6f] border-[#7bb6e3] shadow-sm",
                  };
            } else if (meta.label === "Caution") {
              statusTheme = {
                bg: "bg-[#f3e7d7]",
                border: "border-[#a97c50]",
                iconBg: "bg-[#a97c50]/10",
                iconBorder: "border-[#a97c50]",
                iconText: "text-[#a97c50]",
                badge: "bg-[#a97c50]/10 text-[#a97c50] border-[#a97c50] shadow-sm",
              };
            } else if (meta.label === "Review") {
              statusTheme = isChapter1
                ? {
                    bg: "bg-[#fff6ed]",
                    border: "border-[#ffd8b5]",
                    iconBg: "bg-[#ffd8b5]",
                    iconBorder: "border-[#ffd8b5]",
                    iconText: "text-[#b26a00]",
                    badge: "bg-[#ffd8b5] text-[#b26a00] border-[#ffd8b5] shadow-sm",
                  }
                : {
                    bg: "bg-[#f9f3e7]",
                    border: "border-[#e6b97b]",
                    iconBg: "bg-[#e6b97b]",
                    iconBorder: "border-[#e6b97b]",
                    iconText: "text-[#7a4c1a]",
                    badge: "bg-[#e6b97b] text-[#7a4c1a] border-[#e6b97b] shadow-sm",
                  };
            } else if (meta.label === "Blocked") {
              statusTheme = isChapter1
                ? {
                    bg: "bg-[#fbeaea]",
                    border: "border-[#f7b8b8]",
                    iconBg: "bg-[#f7b8b8]",
                    iconBorder: "border-[#f7b8b8]",
                    iconText: "text-[#b71c1c]",
                    badge: "bg-[#f7b8b8] text-[#b71c1c] border-[#f7b8b8] shadow-sm",
                  }
                : {
                    bg: "bg-[#f9e7e7]",
                    border: "border-[#e67b7b]",
                    iconBg: "bg-[#e67b7b]",
                    iconBorder: "border-[#e67b7b]",
                    iconText: "text-[#7a1a1a]",
                    badge: "bg-[#e67b7b] text-[#7a1a1a] border-[#e67b7b] shadow-sm",
                  };
            }

            return (
              <button
                key={q.id}
                onClick={() => handleStartQuest(q.id)}
                className={`group flex w-full items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-4 text-left shadow-[0_2px_12px_rgba(52,6,6,0.08),0_1px_3px_rgba(52,6,6,0.04)] transition-all hover:-translate-y-px hover:border-[#340606] hover:shadow-[0_8px_32px_rgba(52,6,6,0.12),0_2px_8px_rgba(52,6,6,0.06)] active:translate-y-0 sm:gap-4 sm:px-5 ${statusTheme.bg} ${statusTheme.border}`}
              >
                {/* Icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border sm:h-10 sm:w-10 ${statusTheme.iconBg} ${statusTheme.iconBorder}`}
                >
                  {["Passed", "Completed"].includes(meta.label) ? (
                    <CheckCircle2 className={`h-4 w-4 sm:h-5 sm:w-5 ${statusTheme.iconText}`} />
                  ) : (
                    <Circle className={`h-4 w-4 sm:h-5 sm:w-5 ${statusTheme.iconText}`} />
                  )}
                </div>

                {/* Text — allow wrapping on small screens */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-sm leading-snug font-semibold break-words sm:text-[15px] ${
                      isChapter1 ? "accent-brown" : isChapter2 ? "text-[#520a50]" : "text-[#051738]"
                    }`}
                  >
                    {q.title}
                  </h3>
                  <p
                    className={`mt-0.5 text-xs leading-relaxed break-words sm:text-[13px] ${
                      isChapter1
                        ? "text-[#8284bf]"
                        : isChapter2
                          ? "text-[#2f062e]"
                          : isChapter3
                            ? "text-[#020a1a]"
                            : "text-[#3a4f63]"
                    }`}
                  >
                    {q.subtitle}
                  </p>
                </div>

                {/* Badge — hidden on xs, visible from sm */}
                <div
                  className={`hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap sm:flex sm:text-[12px] ${statusTheme.badge}`}
                >
                  <span className="leading-none">{meta.icon}</span>
                  {meta.label}
                </div>

                {/* xs-only: just the icon */}
                <div className={`flex shrink-0 sm:hidden ${meta.color}`}>{meta.icon}</div>
              </button>
            );
          })}
        </div>

        {/* Risk advisories — eligibility-suite only
            Fixed right-side panel at xl, inline below xl */}
        {suiteId === "eligibility-suite" && (
          <>
            {/* Reusable floating panel — auto fades when footer enters viewport */}
            <FloatingSidePanel>
              <EligibilityRiskBanner
                answers={
                  Object.keys(suiteAnswers).length > 0
                    ? suiteAnswers
                    : ((state.metadata?.[metaAnswersKey] as any) ?? suiteAnswers)
                }
                compact={true}
              />
            </FloatingSidePanel>

            {/* Inline below content on smaller screens */}
            <div className="xl:hidden">
              <EligibilityRiskBanner
                answers={
                  Object.keys(suiteAnswers).length > 0
                    ? suiteAnswers
                    : ((state.metadata?.[metaAnswersKey] as any) ?? suiteAnswers)
                }
              />
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div
          className={`mt-10 rounded-[9px] px-4 py-3.5 text-center text-[11px] leading-relaxed sm:mt-12 sm:text-[12px] ${
            isChapter1
              ? "bg-[#f3f0fb] text-[#8284bf]"
              : isChapter2
                ? "bg-[#f4e6f3] text-[#520a50]"
                : "bg-[#e8ecf3] text-[#051738]"
          }`}
        >
          Rahvana provides structured guidance only. This is not legal advice.
          <br className="hidden sm:block" /> Consult a licensed immigration attorney for
          case-specific decisions.
        </div>
      </div>
    );
  }

  // ─── RESULT VIEW ───────────────────────────────────────────────────────────
  if (view === "result" && activeQuest) {
    const result =
      questResults[activeQuest.id] || (state.metadata?.questResults as any)?.[activeQuest.id];
    const meta = getStatusMeta(activeQuest.id, 36);

    return (
      <div className="animate-in zoom-in-95 fade-in mx-auto flex min-h-0 w-full max-w-[600px] flex-col items-center justify-center px-4 pt-8 pb-4 duration-500 sm:px-6 sm:pt-10 sm:pb-6">
        <div className="w-full text-center">
          <div
            className={`h-14 w-14 rounded-full sm:h-20 sm:w-20 ${meta.bg} ${meta.color} mx-auto mb-4 flex items-center justify-center border border-current/10 text-2xl sm:mb-6 sm:text-3xl`}
          >
            {meta.icon}
          </div>
          <div
            className={`inline-block rounded-full px-3.5 py-1 ${meta.bg} ${meta.color} mb-3 border border-current/20 text-[10px] font-bold tracking-[0.15em] uppercase sm:mb-5`}
          >
            {meta.label}
          </div>
          <h2
            className={`mb-2.5 text-xl tracking-tight break-words italic sm:mb-4 sm:text-3xl md:text-4xl ${
              isChapter1 ? "accent-brown" : isChapter2 ? "text-[#520a50]" : "text-[#051738]"
            }`}
          >
            {result?.title || "Evaluating Result..."}
          </h2>
          <p
            className={`mx-auto mb-5 max-w-[400px] text-[13px] leading-relaxed sm:mb-8 sm:text-[15px] ${
              isChapter1
                ? "text-[#8284bf]"
                : isChapter2
                  ? "text-[#2f062e]"
                  : isChapter3
                    ? "text-[#020a1a]"
                    : "text-[#3a4f63]"
            }`}
          >
            {result?.body || "Please wait while we calculate your status."}
          </p>
          <div className="mx-auto flex w-full max-w-[280px] flex-col gap-2.5 sm:gap-3">
            <button
              onClick={() => setView("landing")}
              className={`w-full rounded-[16px] px-6 py-3 text-[14px] font-bold shadow-md transition-all active:scale-95 sm:py-3.5 sm:text-[15px] ${meta.btnSolid}`}
            >
              Back to Overview
            </button>
            <button
              onClick={() => setView("quest")}
              className={`w-full rounded-[16px] px-6 py-3 text-[13px] font-medium transition-all sm:py-3.5 sm:text-[14px] ${meta.btnOutline}`}
            >
              Review my answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUEST VIEW ────────────────────────────────────────────────────────────
  if (view === "quest" && activeQuest) {
    const screen = activeQuest.screens[currentScreenIdx];
    const progressIdx = currentScreenIdx + 1;
    const progressPct = (progressIdx / activeQuest.screens.length) * 100;
    const isAnswered =
      tempAnswers[screen.id] &&
      (Array.isArray(tempAnswers[screen.id])
        ? (tempAnswers[screen.id] as string[]).length > 0
        : true);

    const accentColor = isChapter1
      ? {
          bar: "bg-[#8284bf]",
          barBg: "bg-[#f3f0fb]",
          border: "border-[#8284bf]/40",
          closeBg: "bg-[#f3f0fb] hover:bg-[#e6d6f5]",
          closeStroke: "stroke-[#8284bf]",
          label: "accent-brown",
          btn: "bg-[#8284bf] text-white shadow-[#8284bf]/20 hover:bg-[#6b6fa8]",
        }
      : isChapter2
        ? {
            bar: "bg-[#520a50]",
            barBg: "bg-[#f4e6f3]",
            border: "border-[#520a50]",
            closeBg: "bg-[#f4e6f3] hover:bg-[#520a50]/10",
            closeStroke: "stroke-[#520a50]",
            label: "text-[#520a50]",
            btn: "bg-[#520a50] text-white shadow-[#520a50]/20 hover:bg-[#2f062e]",
          }
        : {
            bar: "bg-[#051738]",
            barBg: "bg-[#e8ecf3]",
            border: "border-[#051738]",
            closeBg: "bg-[#e8ecf3] hover:bg-[#051738]/10",
            closeStroke: "stroke-[#051738]",
            label: "text-[#051738]",
            btn: "bg-[#051738] text-white shadow-[#051738]/20 hover:bg-[#020a1a]",
          };

    return (
      <div className="animate-in slide-in-from-right-4 fade-in flex w-full flex-col pt-6 duration-500">
        {/* Topbar */}
        <div
          className={`flex h-10 shrink-0 items-center gap-2 border-b px-3 sm:gap-3 sm:px-4 ${accentColor.border}`}
        >
          <button
            onClick={() => setView("landing")}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors sm:h-8 sm:w-8 ${accentColor.closeBg}`}
            aria-label="Close quest"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 shrink-0 fill-none stroke-2 sm:h-4 sm:w-4 ${accentColor.closeStroke}`}
              style={{ strokeLinecap: "round" } as React.CSSProperties}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className={`h-[3px] flex-1 overflow-hidden rounded-full ${accentColor.barBg}`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${accentColor.bar}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <span
            className={`shrink-0 text-[11px] font-medium whitespace-nowrap ${accentColor.label}`}
          >
            {progressIdx} / {activeQuest.screens.length}
          </span>
        </div>

        {/* Quest body */}
        <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-5 pb-8 sm:px-6 sm:pt-8 sm:pb-12">
          <div className="flex w-full max-w-[560px] flex-col">
            {/* Quest label */}
            <div
              className={`mb-4 text-[11px] font-semibold tracking-widest uppercase sm:mb-5 ${accentColor.label}`}
            >
              {activeQuest.title}
            </div>

            {/* Question */}
            <h2
              className={`mb-2 text-xl leading-snug break-words sm:text-2xl md:text-[28px] ${
                isChapter1 ? "accent-brown" : isChapter2 ? "text-[#520a50]" : "text-[#051738]"
              }`}
            >
              {screen.question}
            </h2>

            {screen.helper && (
              <p
                className={`mb-5 text-sm leading-relaxed sm:mb-7 sm:text-[14px] ${
                  isChapter1
                    ? "text-[#8284bf]"
                    : isChapter2
                      ? "text-[#2f062e]"
                      : isChapter3
                        ? "text-[#020a1a]"
                        : "text-[#3a4f63]"
                }`}
              >
                {screen.helper}
              </p>
            )}

            {/* Hint */}
            {screen.hint && (
              <div className="mt-2 mb-6 sm:mb-8">
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className={`flex items-center gap-2 text-[14px] font-bold transition-opacity select-none ${
                    isChapter1 ? "accent-brown hover:opacity-80" : "text-primary hover:opacity-80"
                  }`}
                  aria-expanded={showHint}
                  aria-controls={`hint-panel-${screen.id}`}
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
                  <span>Examples</span>
                </button>
                {showHint && (
                  <div
                    id={`hint-panel-${screen.id}`}
                    className={`animate-in slide-in-from-top-2 mt-4 rounded-[16px] p-4 duration-300 sm:p-5 ${
                      isChapter1
                        ? "border-[#a97c50]/40 bg-[#f7ede5]"
                        : isChapter2
                          ? "border border-[#d5abd2] bg-[#f4e6f3]"
                          : "border border-[#b7c2d4] bg-[#e8ecf3]"
                    }`}
                  >
                    {screen.hint.intro && (
                      <p
                        className={`mb-2 text-[13px] font-bold ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#520a50]" : "text-[#051738]"}`}
                      >
                        {screen.hint.intro}
                      </p>
                    )}
                    <ul className="space-y-2">
                      {screen.hint.items.map((it: string, i: number) => (
                        <li
                          key={i}
                          className={`flex gap-2 text-[13px] leading-relaxed sm:text-[13.5px] ${isChapter1 ? "text-[#8284bf]" : "text-[#3a4f63]"}`}
                        >
                          <span className={`${isChapter1 ? "accent-brown" : "text-primary"} mt-1`}>
                            •
                          </span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="mb-6 flex flex-col gap-2.5">
              {screen.options.map((opt: any) => {
                const val = tempAnswers[screen.id];
                const isSelected =
                  screen.type === "multi"
                    ? ((val as string[]) || []).includes(opt.value)
                    : val === opt.value;

                const selectedCls = isChapter1
                  ? "border-[#8284bf] bg-[#f0f1fb] shadow-[0_0_0_3px_rgba(130,132,191,0.10)]"
                  : isChapter2
                    ? "border-[#520a50] bg-[#f4e6f3] shadow-[0_0_0_3px_rgba(82,10,80,0.10)]"
                    : isChapter3
                      ? "border-[#051738] bg-[#e8ecf3] shadow-[0_0_0_3px_rgba(5,23,56,0.10)]"
                      : "border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(59,125,216,0.12)]";

                const defaultCls = isChapter1
                  ? "border-[#8284bf]/40 bg-white hover:border-[#8284bf] hover:bg-[#f0f1fb]"
                  : isChapter2
                    ? "border-[#520a50]/40 bg-white hover:border-[#520a50] hover:bg-[#f4e6f3]"
                    : isChapter3
                      ? "border-[#051738]/40 bg-white hover:border-[#051738] hover:bg-[#e8ecf3]"
                      : "border-[#b7c2d4] bg-white hover:border-primary hover:bg-primary/5";

                const radioCls = isSelected
                  ? isChapter1
                    ? "border-[#8284bf] bg-[#8284bf]"
                    : isChapter2
                      ? "border-[#520a50] bg-[#520a50]"
                      : isChapter3
                        ? "border-[#051738] bg-[#051738]"
                        : "border-primary bg-primary"
                  : isChapter1
                    ? "border-[#8284bf]/40 bg-white"
                    : isChapter2
                      ? "border-[#520a50]/40 bg-white"
                      : isChapter3
                        ? "border-[#051738]/40 bg-white"
                        : "border-[#b7c2d4] bg-white";

                const labelCls = isSelected
                  ? isChapter1
                    ? "accent-brown"
                    : isChapter2
                      ? "text-[#520a50]"
                      : isChapter3
                        ? "text-[#051738]"
                        : "text-[#051738]"
                  : isChapter1
                    ? "accent-brown/80"
                    : isChapter2
                      ? "text-[#520a50]/80"
                      : isChapter3
                        ? "text-[#051738]/80"
                        : "text-[#020a1a]";

                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(screen.id, opt.value, screen.type)}
                    className={`flex w-full items-start gap-3 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left transition-all duration-200 sm:px-5 sm:py-4 ${isSelected ? selectedCls : defaultCls}`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${radioCls}`}
                    >
                      {isSelected && (
                        <div className="animate-in zoom-in-50 h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm leading-snug font-medium break-words sm:text-[15px] ${labelCls}`}
                      >
                        {opt.label}
                      </div>
                      {opt.sub && (
                        <div
                          className={`mt-0.5 text-xs leading-relaxed break-words sm:text-[13px] ${isChapter1 ? "text-[#8284bf]" : isChapter2 ? "text-[#2f062e]" : isChapter3 ? "text-[#020a1a]" : "text-[#6b8097]"}`}
                        >
                          {opt.sub}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-auto flex flex-col gap-3 pt-4 sm:pt-6">
              <button
                disabled={!isAnswered}
                onClick={handleNext}
                className={`group flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-bold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:py-3.5 sm:text-[16px] ${accentColor.btn}`}
              >
                {currentScreenIdx === activeQuest.screens.length - 1 ? "Get Results" : "Continue"}
                <ChevronRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
              {currentScreenIdx > 0 && (
                <button
                  onClick={() => setCurrentScreenIdx(currentScreenIdx - 1)}
                  className={`w-full py-3 text-[13px] font-medium transition-all sm:text-[14px] ${accentColor.label} opacity-70 hover:opacity-100`}
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
