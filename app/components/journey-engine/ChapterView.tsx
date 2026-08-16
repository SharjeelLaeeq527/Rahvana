"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, AlertTriangle, Lock } from "lucide-react";
import { RoadmapDataV3 } from "./types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage, getStageProgress } from "./journeyHelpers";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { getStepLockStatus, getModalFeatureForTier } from "@/lib/entitlements/hardLockRules";
// import Image from "next/image";

interface ChapterViewProps {
  data: RoadmapDataV3;
  chapterIdx: number;
  state: WizardState;
  onBack: () => void;
  onSelectStep: (chapterIdx: number, stepIdx: number) => void;
}

export function ChapterView({ data, chapterIdx, state, onBack, onSelectStep }: ChapterViewProps) {
  const plan = usePlan();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  const chapters = data.chapters;
  const chapter = chapters[chapterIdx];

  const filingMethod = state.metadata?.filingMethod || state.filingType;

  const activeSteps = useMemo(
    () => getActiveStepsForStage(data, chapterIdx, state.metadata, state.filingType),
    [data, chapterIdx, state.metadata, state.filingType]
  );

  const prog = useMemo(() => getStageProgress(data, chapterIdx, state), [data, chapterIdx, state]);

  const isDone = prog.pct === 100;
  const isInProgress = prog.pct > 0 && prog.pct < 100;

  const isChapter1 = chapterIdx === 0;
  
  const isChapter2 = chapterIdx === 1;
  const isChapter3 = chapterIdx === 2;

  // Determine if a step is selected (for substep background)
  const isChapter1Step =
    isChapter1 && typeof state.currentStep === "number" && state.currentStep >= 0;
  const isChapter2Step =
    isChapter2 && typeof state.currentStep === "number" && state.currentStep >= 0;
  const isChapter3Step =
    isChapter3 && typeof state.currentStep === "number" && state.currentStep >= 0;

  // Helper function to check if a step is locked and why
  const getStepLockStatusLocal = (idx: number, sId: string) => {
    return getStepLockStatus(sId, plan.tier, chapterIdx, idx);
  };

  return (
    <div
      className={`flex-1 overflow-y-auto py-8 px-4 sm:px-6 pb-20 scrollbar-hide relative`}
      style={isChapter1 || isChapter2 || isChapter3 ? { minHeight: "100vh" } : undefined}
    >
      <div className="w-full max-w-[680px] mx-auto animate-in fade-in duration-700 relative z-10 mt-6 sm:mt-12">
        <div
          className={`bg-gradient-to-br from-white via-white/95 to-neutral-50 border-[1.5px] rounded-3xl p-6 sm:p-8 mb-7
            shadow-[0_8px_40px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]
            transition-all duration-300 hover:scale-[1.018] hover:shadow-[0_16px_56px_rgba(36,42,66,0.22),0_6px_24px_rgba(44,62,80,0.18)]
            border-solid
            ${isChapter3 ? "border-[#051738]" : isChapter2 ? "border-[#520a50]" : "border-[#8284bf]"}
          `}
        >
          <div
            className={`inline-flex items-center gap-1.5 px-[13px] py-[4px] rounded-full text-[11px] font-bold tracking-[0.07em] uppercase mb-3 border
              ${
                isDone
                  ? isChapter3
                    ? "bg-[#e8ecf3] border-[#051738] text-[#051738]"
                    : isChapter2
                      ? "bg-[#f4e6f3] border-[#520a50] text-[#520a50]"
                      : "bg-[#f0f1fb] border-[#8284bf] text-[#8284bf]"
                  : isInProgress
                    ? isChapter3
                      ? "bg-[#e8ecf3] border-[#051738] text-[#051738]"
                      : isChapter2
                        ? "bg-[#f4e6f3] border-[#520a50] text-[#520a50]"
                        : "bg-[#f0f1fb] border-[#8284bf] text-[#8284bf]"
                    : isChapter3
                      ? "bg-[#e8ecf3] border-[#051738] text-[#051738]"
                      : isChapter2
                        ? "bg-[#f4e6f3] border-[#520a50] text-[#520a50]"
                        : "bg-[#f0f1fb] border-[#8284bf] text-[#8284bf]"
              }`}
          >
            {isDone ? "✓ Completed" : isInProgress ? "In Progress" : "Not Started"}
          </div>
          <h1 className="text-[clamp(22px,3vw,28px)] font-extrabold text-[#1a2236] mb-1 tracking-tight">
            {(chapter.chapter_name || (chapter as any).name).replace(/^Stage\s[IVX]+:\s/, "")}
          </h1>
          <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-4">
            {chapter.chapter_description || chapter.description}
          </p>

          <div className="flex items-center gap-2.5">
            <div
              className={`flex-1 h-[7px] rounded-[13px] overflow-hidden ${isChapter3 ? "bg-[#e8ecf3]" : isChapter2 ? "bg-[#f4e6f3]" : "bg-[#f0f1fb]"}`}
            >
              <div
                className="h-full rounded-[13px] transition-all duration-500 shadow-[0_2.5px_12px_rgba(36,42,66,0.18)]"
                style={{
                  width: `${prog.pct}%`,
                  background: isChapter3 ? "#051738" : isChapter2 ? "#520a50" : "#8284bf",
                }}
              />
            </div>
            <div
              className={`text-[12px] font-bold ${isChapter3 ? "text-[#051738]" : isChapter2 ? "text-[#2f062e]" : "text-[#4e518c]"}`}
            >
              {prog.pct}%
            </div>
          </div>
        </div>

        {/* Branch Warning (Chapter 1 specific) */}
        {isChapter1 && !filingMethod && (
          <div className="bg-[#fff6f6] border border-[#f7c6c6] rounded-[10px] p-[11px_14px] mb-3 text-[12.5px] text-[#c85a5a] flex gap-2 items-start animate-in slide-in-from-top-2 duration-500">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">
                Action Required: Filing Method Not Selected
              </strong>
              <span>
                You must complete &quot;Choose Filing Method&quot; to unlock specific instructions
                for Chapter 1.
              </span>
            </div>
          </div>
        )}

        {/* Plan Card */}
        <div
          className={`rounded-2xl px-4 sm:px-5 py-3 sm:py-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-[1.5px] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-[1.01]
            ${
              plan.tier === "free"
                ? "border-[#a8c4e0]"
                : plan.tier === "basic"
                  ? "border-[#7fbfba]"
                  : plan.tier === "premium"
                    ? "border-[#b399d8]"
                    : "border-[#d4a855]"
            }`}
        >
          <div
            className={`rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-[0_2px_8px_rgba(0,0,0,0.09)] transition-all
              ${
                plan.tier === "free"
                  ? "w-10 sm:w-12 h-10 sm:h-12 bg-[#f0f4fb] border-[#8fa8d4]"
                  : plan.tier === "basic"
                    ? "w-10 sm:w-12 h-10 sm:h-12 bg-[#eef9f8] border-[#bfe5e2]"
                    : plan.tier === "premium"
                      ? "w-10 sm:w-12 h-10 sm:h-12 bg-[#faf7fe] border-[#a088d8]"
                      : "w-10 sm:w-12 h-10 sm:h-12 bg-[#fef9f0] border-[#c9a855]"
              }`}
          >
            <span
              className={`plan-icon ${
                plan.tier === "free"
                  ? "plan-icon--free"
                  : plan.tier === "basic"
                    ? "plan-icon--basic"
                    : plan.tier === "premium"
                      ? "plan-icon--premium"
                      : "plan-icon--executive"
              }`}
              style={{
                fontSize: 23,
                fontWeight: 600,
              }}
              aria-hidden="true"
            />
          </div>

          <p
            className={`text-[12px] sm:text-[13px] leading-relaxed m-0 flex-1 font-semibold
              ${
                plan.tier === "free"
                  ? "text-[#2e4f72]"
                  : plan.tier === "basic"
                    ? "text-[#0f6f6d]"
                    : plan.tier === "premium"
                      ? "text-[#332d80]"
                      : "text-[#6b4a0d]"
              }`}
          >
            {plan.tier === "free"
              ? "Upgrade to unlock the full roadmap, step-by-step guidance, and tools for your next steps."
              : plan.tier === "basic"
                ? "Upgrade to Premium for step-by-step guidance, a document vault, and reminders."
                : plan.tier === "premium"
                  ? "Upgrade to Executive for expert consultation, document reviews, and hands-on support."
                  : "Full plan active, complete tools and end-to-end support throughout the process."}
          </p>

          {plan.tier !== "executive" && (
            <button
              onClick={() => setUpgradeModalFeature("checklist_engine")}
              className={`flex-shrink-0 inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12.5px] font-bold px-4 sm:px-5.5 py-2 sm:py-2.75 rounded-xl text-white transition-all active:scale-[0.96] shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-white/15 group relative overflow-hidden whitespace-nowrap
                ${
                  plan.tier === "free"
                    ? "bg-[#7fa8d8] hover:bg-[#6f98cc]"
                    : plan.tier === "basic"
                      ? "bg-[#2f9a95] hover:bg-[#257e7a]"
                      : "bg-[#9b7dd8] hover:bg-[#8b6dcf]"
                }`}
            >
              <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <span className="relative">Upgrade Plan</span>
              <ChevronRight
                size={14}
                strokeWidth={3}
                className="relative sm:w-[16px] sm:h-[16px]"
              />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {activeSteps.map((step, idx) => {
            const sId = step.step_key || (step as any).id;
            const isCompleted = state.completedSteps.has(sId);
            const isCurrent =
              !isCompleted &&
              activeSteps
                .slice(0, idx)
                .every((s) => state.completedSteps.has(s.step_key || (s as any).id));
            const fullStepIdx = chapter.steps.findIndex(
              (s) => (s.step_key || (s as any).id) === sId
            );

            // Check if step is locked
            const lockStatus = getStepLockStatusLocal(idx, sId);
            const isStepLocked = lockStatus.isLocked;
            const accessTier = lockStatus.requiredPlan || "basic";
            const accessTierLabel =
              accessTier === "basic" ? "Basic" : accessTier === "premium" ? "Premium" : "Executive";

            let borderColor = isChapter3
              ? "border-[#051738]"
              : isChapter2
                ? "border-[#520a50]"
                : "border-[#8284bf]";
            let bgColor = "bg-gradient-to-br from-white via-white/95 to-neutral-50";
            let textColor = isChapter3
              ? "text-[#051738]"
              : isChapter2
                ? "text-[#520a50]"
                : "text-[#8284bf]";
            let iconBg = "bg-white";
            let iconBorder = borderColor;
            let iconText = textColor;

            // If step is locked, keep content legible while indicating locked state
            if (isStepLocked) {
              borderColor = "border-[#d0d7e0]";
              bgColor = "bg-[#f7f8fa]";
              textColor = "text-[#8b94a5]";
              iconBg = "bg-[#e5eaef]";
              iconBorder = "border-[#c5cfd9]";
              iconText = "text-[#8b94a5]";
            } else if (isCompleted) {
              borderColor = isChapter3
                ? "border-[#051738]"
                : isChapter2
                  ? "border-[#520a50]"
                  : "border-[#8284bf]";
              bgColor = isChapter3 ? "bg-[#051738]" : isChapter2 ? "bg-[#520a50]" : "bg-[#8284bf]";
              textColor = "text-white";
              iconBg = "bg-white/20";
              iconBorder = isChapter3
                ? "border-[#b7c2d4]"
                : isChapter2
                  ? "border-[#d5abd2]"
                  : "border-[#c6c8ea]";
              iconText = "text-white";
            } else if (isCurrent) {
              borderColor = isChapter3
                ? "border-[#051738]"
                : isChapter2
                  ? "border-[#520a50]"
                  : "border-[#8284bf]";
              bgColor = "bg-white/80 backdrop-blur-sm";
              textColor = isChapter3
                ? "text-[#051738]"
                : isChapter2
                  ? "text-[#520a50]"
                  : "text-[#8284bf]";
              iconBg = "bg-white";
              iconBorder = borderColor;
              iconText = textColor;
            } else {
              borderColor = isChapter3
                ? "border-[#b7c2d4]"
                : isChapter2
                  ? "border-[#d5abd2]"
                  : "border-[#c6c8ea]";
              bgColor = "bg-white";
              textColor = isChapter3
                ? "text-[#051738]"
                : isChapter2
                  ? "text-[#520a50]"
                  : "text-[#8284bf]";
              iconBg = "bg-white";
              iconBorder = borderColor;
              iconText = textColor;
            }

            return (
              <div
                key={sId}
                onClick={() => {
                  if (isStepLocked) {
                    const feat = getModalFeatureForTier(lockStatus.requiredPlan!);
                    setUpgradeModalFeature(feat);
                    return;
                  }
                  onSelectStep(chapterIdx, fullStepIdx);
                }}
                className={`group flex items-center gap-3 px-4 py-3 rounded-[13px] cursor-pointer transition-all border-[1.5px] animate-in fade-in slide-in-from-right-2 duration-500 ${borderColor} ${bgColor} relative
                  ${
                    isCompleted
                      ? "shadow-[0_8px_32px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]"
                      : "shadow-[0_4px_20px_rgba(36,42,66,0.13),0_2px_8px_rgba(44,62,80,0.10)] hover:shadow-[0_8px_32px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]"
                  }
                  active:scale-[0.98]
                  ${!isStepLocked && isCurrent ? (isChapter3 ? "before:bg-[#051738]" : isChapter2 ? "before:bg-[#520a50]" : "before:bg-[#8284bf]") + ' before:content-[" "] before:absolute before:inset-y-1 before:left-0 before:w-1.5 before:rounded-full' : ""}
                `}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="relative shrink-0 flex items-center">
                  <div
                    className={`rounded-full border-2 flex items-center justify-center text-[10px] font-bold tracking-[0.04em] transition-all ${iconBg} ${iconBorder} ${iconText}
                      shadow-[0_1.5px_6px_rgba(36,42,66,0.10)]
                      w-7 h-7
                    `}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[14px] font-semibold leading-[1.3] ${textColor}`}>
                    {step.step_name || (step as any).name}
                  </div>
                  <div
                    className={`text-[11.5px] font-semibold mt-0.25 ${isStepLocked ? "text-[#a8b5c0]" : isCompleted ? "text-white" : "text-[#23232b]"}`}
                  >
                    {step.step_short_description || ""}
                  </div>
                </div>
                {isStepLocked ? (
                  <div
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.03em] ${
                      accessTier === "basic"
                        ? "bg-[#e7f7f5] border-[#7ecfc6] text-[#166b62]"
                        : accessTier === "premium"
                          ? "bg-[#f0ebff] border-[#c5b9ff] text-[#4b3587]"
                          : "bg-[#fff4cf] border-[#d8b95d] text-[#7a560f]"
                    }`}
                  >
                    <Lock size={10} strokeWidth={2.5} />
                    <span>{accessTierLabel}</span>
                  </div>
                ) : (
                  <ChevronRight
                    className="shrink-0 text-[#b3a6b3] opacity-30"
                    size={14}
                    strokeWidth={3}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}
    </div>
  );
}
