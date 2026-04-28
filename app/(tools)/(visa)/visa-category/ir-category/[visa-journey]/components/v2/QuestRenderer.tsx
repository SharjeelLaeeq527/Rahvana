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

  const [suiteAnswers, setSuiteAnswers] = useState<
    Record<string, Record<string, string | string[]>>
  >(
    (state.answers?.[suiteId] as Record<
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

  // Sync state from prop if prop updates (e.g. after cloud load)
  useEffect(() => {
    if (state.metadata?.questResults) {
      setQuestResults((prev) => ({ ...state.metadata.questResults, ...prev }));
    }
  }, [state.metadata?.questResults]);

  const activeQuest: QuestData | undefined = suite.quests.find(
    (q) => q.id === activeQuestId,
  );

  // Sync results to metadata
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

    const logic =
      (activeQuest as any).result_logic || (activeQuest as any).resultLogic;
    const result = evaluateLogic(logic, tempAnswers);
    console.log(
      `[QuestRenderer] Result calculated for ${activeQuest.id}:`,
      result,
    );

    setQuestResults((prev) => {
      const next = { ...prev, [activeQuest.id]: result };
      console.log(`[QuestRenderer] Updating questResults local state:`, next);
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
        btnOutline: "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-primary hover:text-primary",
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

  if (view === "landing") {
    const completedCount = Object.keys(questResults).length;
    const progressPct = (completedCount / suite.quests.length) * 100;

    return (
      <div className="max-w-[740px] mx-auto w-full px-2 sm:px-4 md:px-8 pt-8 sm:pt-14 md:pt-20 animate-in fade-in duration-500 step-modal-spacing">
        <div className="px-0 pt-0 pb-0 step-modal-spacing">
          <div className="mb-9">
            <h1
              className={`text-[clamp(18px,7vw,32px)] sm:text-[clamp(24px,5vw,38px)] font-black mb-2.5 leading-[1.2] break-words mt-2 sm:mt-4 md:mt-6 ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#27192e]" : isChapter3 ? "text-[#0f1f38]" : "text-[#0f1f38]"}`}
            >
              {suite.title}
            </h1>
            <p
              className={`text-[14px] sm:text-[15px] max-w-full md:max-w-[540px] leading-[1.65] break-words ${isChapter1 ? "accent-rose" : isChapter2 ? "text-[#b48ad6]" : isChapter3 ? "text-[#3a4f63]" : "text-[#3a4f63]"}`}
            >
              {suite.subtitle}
            </p>
          </div>

          <div className="mb-9">
            <div
              className={`w-full h-[5px] rounded-[10px] overflow-hidden ${isChapter1 ? "bg-[#e6d6c3]" : isChapter2 ? "bg-[#ede6f6]" : isChapter3 ? "bg-[#e8f1fb]" : "bg-primary/30"}`}
            >
              <div
                className={`h-full rounded-[10px] transition-all duration-1000 ease-out ${isChapter1 ? "bg-[#a97c50]" : isChapter2 ? "bg-[#b48ad6]" : isChapter3 ? "bg-[#2f6fd4]" : "bg-primary"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            {suite.quests.map((q, idx) => {
              const meta = getStatusMeta(q.id);
              const isCompleted = ["Passed", "Completed"].includes(meta.label);
              // Status color mapping
              let statusTheme = {
                bg: isChapter1 ? "bg-[#f7f6f3]" : "bg-[#f7fafd]",
                border: isChapter1 ? "border-[#e2e0db]" : "border-[#c3d3e6]",
                iconBg: isChapter1 ? "bg-[#e2e0db]" : "bg-[#f7fafd]",
                iconBorder: isChapter1 ? "border-[#e2e0db]" : "border-[#c3d3e6]",
                iconText: isChapter1 ? "text-[#7a7a7a]" : "text-[#3a4f63]",
                badge: isChapter1 ? "bg-[#e2e0db] border-[#b0b0b0] text-[#7a7a7a]" : "bg-[#e3ecf7] border-[#b7c7db] text-[#3a4f63]",
              };
              if (meta.label === "Passed") {
                statusTheme = isChapter1 ? {
                  bg: "bg-[#eaf7ed]",
                  border: "border-[#b7e2c1]",
                  iconBg: "bg-[#b7e2c1]",
                  iconBorder: "border-[#b7e2c1]",
                  iconText: "text-[#2e7d32]",
                  badge: "bg-[#b7e2c1] text-[#2e7d32] border-[#b7e2c1] shadow-sm",
                } : {
                  bg: "bg-[#e3f1fa]",
                  border: "border-[#7bb6e3]",
                  iconBg: "bg-[#7bb6e3]",
                  iconBorder: "border-[#7bb6e3]",
                  iconText: "text-[#174c6f]",
                  badge: "bg-[#7bb6e3] text-[#174c6f] border-[#7bb6e3] shadow-sm",
                };
              } else if (meta.label === "Caution") {
                statusTheme = isChapter1 ? {
                  bg: "bg-[#f3e7d7]",
                  border: "border-[#a97c50]",
                  iconBg: "bg-[#a97c50]/10",
                  iconBorder: "border-[#a97c50]",
                  iconText: "text-[#a97c50]",
                  badge: "bg-[#a97c50]/10 text-[#a97c50] border-[#a97c50] shadow-sm",
                } : {
                  bg: "bg-[#f3e7d7]",
                  border: "border-[#a97c50]",
                  iconBg: "bg-[#a97c50]/10",
                  iconBorder: "border-[#a97c50]",
                  iconText: "text-[#a97c50]",
                  badge: "bg-[#a97c50]/10 text-[#a97c50] border-[#a97c50] shadow-sm",
                };
              } else if (meta.label === "Review") {
                statusTheme = isChapter1 ? {
                  bg: "bg-[#fff6ed]",
                  border: "border-[#ffd8b5]",
                  iconBg: "bg-[#ffd8b5]",
                  iconBorder: "border-[#ffd8b5]",
                  iconText: "text-[#b26a00]",
                  badge: "bg-[#ffd8b5] text-[#b26a00] border-[#ffd8b5] shadow-sm",
                } : {
                  bg: "bg-[#f9f3e7]",
                  border: "border-[#e6b97b]",
                  iconBg: "bg-[#e6b97b]",
                  iconBorder: "border-[#e6b97b]",
                  iconText: "text-[#7a4c1a]",
                  badge: "bg-[#e6b97b] text-[#7a4c1a] border-[#e6b97b] shadow-sm",
                };
              } else if (meta.label === "Blocked") {
                statusTheme = isChapter1 ? {
                  bg: "bg-[#fbeaea]",
                  border: "border-[#f7b8b8]",
                  iconBg: "bg-[#f7b8b8]",
                  iconBorder: "border-[#f7b8b8]",
                  iconText: "text-[#b71c1c]",
                  badge: "bg-[#f7b8b8] text-[#b71c1c] border-[#f7b8b8] shadow-sm",
                } : {
                  bg: "bg-[#f9e7e7]",
                  border: "border-[#e67b7b]",
                  iconBg: "bg-[#e67b7b]",
                  iconBorder: "border-[#e67b7b]",
                  iconText: "text-[#7a1a1a]",
                  badge: "bg-[#e67b7b] text-[#7a1a1a] border-[#e67b7b] shadow-sm",
                };
              } else if (meta.label === "Completed") {
                statusTheme = isChapter1 ? {
                  bg: "bg-[#eaf7ed]",
                  border: "border-[#b7e2c1]",
                  iconBg: "bg-[#b7e2c1]",
                  iconBorder: "border-[#b7e2c1]",
                  iconText: "text-[#2e7d32]",
                  badge: "bg-[#b7e2c1] text-[#2e7d32] border-[#b7e2c1] shadow-sm",
                } : {
                  bg: "bg-[#e3f1fa]",
                  border: "border-[#7bb6e3]",
                  iconBg: "bg-[#7bb6e3]",
                  iconBorder: "border-[#7bb6e3]",
                  iconText: "text-[#174c6f]",
                  badge: "bg-[#7bb6e3] text-[#174c6f] border-[#7bb6e3] shadow-sm",
                };
              }
              return (
                <button
                  key={q.id}
                  onClick={() => handleStartQuest(q.id)}
                  className={`w-full flex items-center gap-[16px] px-[20px] py-[18px] rounded-[14px] border-[1.5px] text-left transition-all group hover:border-[#340606] hover:shadow-[0_8px_32px_rgba(52,6,6,0.12),0_2px_8px_rgba(52,6,6,0.06)] shadow-[0_2px_12px_rgba(52,6,6,0.12),0_1px_3px_rgba(52,6,6,0.06)] hover:-translate-y-px active:translate-y-0 ${statusTheme.bg} ${statusTheme.border}`}
                >
                  <div
                    className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[18px] shrink-0 transition-all border ${statusTheme.iconBg} ${statusTheme.iconBorder}`}
                  >
                    {["Passed", "Completed"].includes(meta.label)
                      ? <CheckCircle2 className={`w-5 h-5 ${statusTheme.iconText}`} />
                      : <Circle className={`w-5 h-5 transition-all ${statusTheme.iconText}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-[15px] font-semibold mb-[4px] leading-[1.3] truncate ${["Passed", "Completed"].includes(meta.label) ? "opacity-90" : ""} ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#27192e]" : isChapter3 ? "text-[#0f1f38]" : "text-[#0f1f38]"}`}
                    >
                      {q.title}
                    </h3>
                    <p
                      className={`text-[13px] font-normal leading-[1.4] truncate ${["Passed", "Completed"].includes(meta.label) ? "opacity-80" : ""} ${isChapter1 ? "accent-rose" : isChapter2 ? "text-[#b48ad6]" : isChapter3 ? "text-[#2f6fd4]" : "text-[#3a4f63]"}`}
                    >
                      {q.subtitle}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-[5px] px-[11px] py-[5px] rounded-full border text-[12px] font-bold whitespace-nowrap transition-all shrink-0 ${statusTheme.badge}`}
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

          <div
            className={`mt-[48px] px-[20px] py-[16px] rounded-[9px] text-[12px] leading-[1.65] text-center ${isChapter1 ? "accent-rose bg-[#f7ede5]" : isChapter2 ? "bg-[#ede6f6] text-[#b48ad6]" : isChapter3 ? "bg-[#e8f1fb] text-[#2f6fd4]" : "bg-[#e8f1fb] text-[#6b8097]"}`}
          >
            Rahvana provides structured guidance only. This is not legal advice.
            <br />
            Consult a licensed immigration attorney for case-specific decisions.
          </div>
        </div>
      </div>
    );
  }

  if (view === "result" && activeQuest) {
    const result =
      questResults[activeQuest.id] ||
      (state.metadata?.questResults as any)?.[activeQuest.id];
    const meta = getStatusMeta(activeQuest.id, 36);

    return (
      <div className="max-w-[600px] mx-auto w-full p-0 animate-in zoom-in-95 fade-in duration-500 min-h-[600px] flex items-center justify-center step-modal-spacing">
        <div className="text-center w-full bg-wgitet border-none">
          <div
            className={`w-20 h-20 rounded-full ${meta.bg} ${meta.color} flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner border border-current/10`}
          >
            {meta.icon}
          </div>
          <div
            className={`inline-block px-4 py-1.5 rounded-full ${meta.bg} ${meta.color} text-[10px] font-bold uppercase tracking-[0.15em] border border-current/20 mb-6`}
          >
            {meta.label}
          </div>
          <h2
            className={`text-3xl md:text-4xl mb-4 tracking-tight italic ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#27192e]" : isChapter3 ? "text-[#0f1f38]" : "text-[#0f1f38]"}`}
          >
            {result?.title || "Evaluating Result..."}
          </h2>
          <p
            className={`mb-10 leading-relaxed max-w-[400px] mx-auto opacity-90 ${isChapter1 ? "accent-rose text-[16px]" : isChapter2 ? "text-[#b48ad6] text-[16px]" : isChapter3 ? "text-[#2f6fd4] text-[16px]" : "text-[#3a4f63] text-[16px]"}`}
          >
            {result?.body || "Please wait while we calculate your status."}
          </p>
          <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
            <button
              onClick={() => setView("landing")}
              className={`px-8 py-4 rounded-[16px] font-bold text-[15px] transition-all shadow-md active:scale-95 ${meta.btnSolid}`}
            >
              Back to Overview
            </button>
            <button
              onClick={() => setView("quest")}
              className={`px-8 py-3.5 rounded-[16px] font-medium text-[14px] transition-all ${meta.btnOutline}`}
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
      <div className="w-full h-full min-h-[700px] flex flex-col animate-in slide-in-from-right-4 fade-in duration-500 step-modal-spacing pt-8 sm:pt-14 md:pt-20">
        {/* Topbar */}
        <div
          className={`flex items-center p-[18px_24px] gap-[16px] shrink-0 border-b ${isChapter1 ? "border-[#c0596a]/40" : isChapter2 ? "border-[#b48ad6]" : isChapter3 ? "border-[#2f6fd4]" : "border-[#d0e4f7]"}`}
        >
          <button
            onClick={() => setView("landing")}
            className={`
              [36px] h-[36px] rounded-full border-none flex items-center justify-center cursor-pointer transition-colors shrink-0 ${isChapter1 ? "bg-[#e6d6c3] hover:bg-[#f7ede5]" : isChapter2 ? "bg-[#ede6f6] hover:bg-[#b48ad6]/10" : isChapter3 ? "bg-[#e8f1fb] hover:bg-[#2f6fd4]/10" : "bg-[#f5f7fa] hover:bg-[#e8f1fb]"}`}
            aria-label="Close quest"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-[16px] h-[16px] fill-none stroke-2 shrink-0 ${isChapter1 ? "stroke-[#c0596a]" : isChapter2 ? "stroke-[#b48ad6]" : isChapter3 ? "stroke-[#2f6fd4]" : "stroke-[#3a4f63]"}`}
              style={{ strokeLinecap: "round" }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className={`flex-1 h-[5px] rounded-[10px] overflow-hidden ${isChapter1 ? "bg-[#e6d6c3]" : isChapter2 ? "bg-[#ede6f6]" : isChapter3 ? "bg-[#e8f1fb]" : "bg-primary/30"}`}
          >
            <div
              className={`h-full rounded-[10px] transition-all duration-400 ease-out ${isChapter1 ? "bg-[#c0596a]" : isChapter2 ? "bg-[#b48ad6]" : isChapter3 ? "bg-[#2f6fd4]" : "bg-primary"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <span
            className={`text-[12px] font-medium whitespace-nowrap shrink-0 ${isChapter1 ? "accent-brown" : "text-[#6b8097]"}`}
          >
            {progressIdx} / {activeQuest.screens.length}
          </span>
        </div>
        {/* Quest Body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-2 sm:px-4 md:px-8 py-8 sm:py-12 step-modal-spacing">
          <div className="w-full max-w-[560px] flex flex-col">
            <div
              className={`text-[11px] font-semibold uppercase tracking-widest mb-[18px] ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#b48ad6]" : isChapter3 ? "text-[#2f6fd4]" : "text-primary"}`}
            >
              {activeQuest.title}
            </div>
            <h2
              className={`text-[clamp(16px,6vw,24px)] sm:text-[clamp(20px,3.5vw,28px)] mb-2.5 leading-[1.35] break-words mt-2 sm:mt-4 md:mt-6 ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#27192e]" : isChapter3 ? "text-[#0f1f38]" : "text-[#0f1f38]"}`}
            >
              {screen.question}
            </h2>
            {screen.helper && (
              <p
                className={`text-[14px] mb-7 leading-relaxed ${isChapter1 ? "accent-rose" : isChapter2 ? "text-[#b48ad6]" : isChapter3 ? "text-[#2f6fd4]" : "text-[#3a4f63]"}`}
              >
                {screen.helper}
              </p>
            )}

            {/* Expandable hint dialog before options if present */}
            {screen.hint && (
              <div className="mb-8 mt-2">
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className={`flex items-center gap-2 text-[14px] font-bold transition-opacity select-none ${isChapter1 ? "accent-brown hover:opacity-80" : "text-primary hover:opacity-80"}`}
                  aria-expanded={showHint}
                  aria-controls={`hint-panel-${screen.id}`}
                >
                  <span
                    className={`transition-transform duration-300 ${showHint ? "rotate-0" : "-rotate-90"}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                    className={`mt-4 p-5 rounded-[16px] animate-in slide-in-from-top-2 duration-300 ${isChapter1 ? "bg-[#f7ede5] border-[#a97c50]/40" : "bg-[#f0f7ff] border border-[#d0e4f7]"}`}
                  >
                    {screen.hint.intro && (
                      <p
                        className={`text-[13px] font-bold mb-2 ${isChapter1 ? "accent-brown" : "text-[#0f1f38]"}`}
                      >
                        {screen.hint.intro}
                      </p>
                    )}
                    <ul className="space-y-2">
                      {screen.hint.items.map((it, i) => (
                        <li
                          key={i}
                          className={`flex gap-2 text-[13.5px] leading-relaxed ${isChapter1 ? "accent-rose" : "text-[#3a4f63]"}`}
                        >
                          <span
                            className={`${isChapter1 ? "accent-brown" : "text-primary"} mt-1`}
                          >
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
                      ${
                        isSelected
                          ? isChapter1
                            ? "border-[#c0596a] bg-[#fbeaec] shadow-[0_0_0_3px_rgba(192,89,106,0.10)] accent-brown"
                            : isChapter2
                              ? "border-[#b48ad6] bg-[#ede6f6] shadow-[0_0_0_3px_rgba(180,138,214,0.10)]"
                              : isChapter3
                                ? "border-[#2f6fd4] bg-[#e8f1fb] shadow-[0_0_0_3px_rgba(47,111,212,0.10)]"
                                : "border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"
                          : isChapter1
                            ? "border-[#c0596a]/40 bg-white hover:border-[#c0596a] hover:bg-[#fbeaec]"
                            : isChapter2
                              ? "border-[#b48ad6]/40 bg-white hover:border-[#b48ad6] hover:bg-[#ede6f6]"
                              : isChapter3
                                ? "border-[#2f6fd4]/40 bg-white hover:border-[#2f6fd4] hover:bg-[#e8f1fb]"
                                : "border-[#d0e4f7] bg-white hover:border-primary hover:bg-primary/5"
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-px shrink-0 transition-all
                        ${
                          isSelected
                            ? isChapter1
                              ? "border-[#c0596a] bg-[#c0596a]"
                              : isChapter2
                                ? "border-[#b48ad6] bg-[#b48ad6]"
                                : isChapter3
                                  ? "border-[#2f6fd4] bg-[#2f6fd4]"
                                  : "border-primary bg-primary"
                            : isChapter1
                              ? "border-[#c0596a]/40 bg-white"
                              : isChapter2
                                ? "border-[#b48ad6]/40 bg-white"
                                : isChapter3
                                  ? "border-[#2f6fd4]/40 bg-white"
                                  : "border-[#d0e4f7] bg-white"
                        }`}
                    >
                      {isSelected && (
                        <div
                          className={`w-2 h-2 rounded-full animate-in zoom-in-50 ${isChapter1 ? "bg-white" : isChapter2 ? "bg-white" : isChapter3 ? "bg-white" : "bg-white"}`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[15px] font-medium leading-[1.4] ${isSelected ? (isChapter1 ? "accent-brown" : isChapter2 ? "text-[#b48ad6]" : isChapter3 ? "text-[#2f6fd4]" : "text-[#0f1f38]") : isChapter1 ? "accent-brown/80" : isChapter2 ? "text-[#b48ad6]/80" : isChapter3 ? "text-[#2f6fd4]/80" : "text-[#1c2b3a]"}`}
                      >
                        {opt.label}
                      </div>
                      {opt.sub && (
                        <div
                          className={`text-[13px] mt-0.5 leading-relaxed ${isChapter1 ? "accent-rose" : isChapter2 ? "text-[#b48ad6]" : isChapter3 ? "text-[#2f6fd4]" : "text-[#6b8097]"}`}
                        >
                          {opt.sub}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <button
                disabled={!isAnswered}
                onClick={handleNext}
                className={`w-full py-3 rounded-lg font-bold text-[16px] transition-all group flex items-center justify-center gap-2
                  ${isChapter1 ? "bg-[#a97c50] text-white shadow-lg shadow-[#a97c50]/20 hover:bg-[#7c5737]" : isChapter2 ? "bg-[#b48ad6] text-white shadow-lg shadow-[#b48ad6]/20 hover:bg-[#7c5737]" : isChapter3 ? "bg-[#2f6fd4] text-white shadow-lg shadow-[#2f6fd4]/20 hover:bg-[#0f1f38]" : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-[#0f1f38]"}
                  disabled:opacity-30 disabled:cursor-not-allowed`}
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
                  className={`w-full py-4 text-[14px] font-medium transition-all
                    ${isChapter1 ? "accent-brown/80 hover:accent-brown" : isChapter2 ? "text-[#b48ad6]/80 hover:text-[#b48ad6]" : isChapter3 ? "text-[#2f6fd4]/80 hover:text-[#2f6fd4]" : "text-[#6b8097] hover:text-[#0f1f38]"}`}
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
