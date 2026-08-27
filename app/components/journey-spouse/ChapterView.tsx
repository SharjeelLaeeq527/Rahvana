"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, AlertTriangle, Lock } from "lucide-react";
import { RoadmapData } from "@/app/(tools)/(visa)/visa-category/[visa-journey]/components/types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage, getStageProgress } from "./journeyHelpers";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { PlanTier } from "@/lib/entitlements/config";
import {
  getStepLockStatus,
  HARD_LOCK_RULES,
  getModalFeatureForTier,
} from "@/lib/entitlements/hardLockRules";

interface ChapterViewProps {
  data: RoadmapData;
  chapterIdx: number;
  state: WizardState;
  onBack: () => void;
  onSelectStep: (chapterIdx: number, stepIdx: number) => void;
}

export function ChapterView({ data, chapterIdx, state, onBack, onSelectStep }: ChapterViewProps) {
  const plan = usePlan();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  const chapters = data.chapters || (data as any).stages;
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
  const isFreeTier = plan.tier === "free";
  const upgradeIconClass =
    plan.tier === "free"
      ? "plan-icon--basic"
      : plan.tier === "basic"
        ? "plan-icon--premium"
        : "plan-icon--executive";

  // Chapter backgrounds
  // const chapter1Bg = "/assets/images/chapter1-bg.png";
  // const chapter1StepBg = "/assets/images/ch1steps-bg.png";
  // const chapter2Bg = "/assets/images/chapter-2-bg.png";
  // const chapter2StepBg = "/assets/images/ch2steps-bg.png";
  // const chapter3Bg = "/assets/images/chapter-3-bg.png";
  // const chapter3StepBg = "/assets/images/ch3steps-bg.png";

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
      className={`scrollbar-hide relative flex-1 overflow-y-auto px-4 py-8 pb-20 sm:px-6`}
      style={isChapter1 || isChapter2 || isChapter3 ? { minHeight: "100vh" } : undefined}
    >
      {/* Fullscreen background for Chapter 1, 2, 3 and their steps */}
      {/* Only show the special step background for Chapter 3 steps */}
      {isChapter3 && !isChapter3Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-fixed bg-center bg-no-repeat"
          // style={{
          //   backgroundImage: `url(${chapter3Bg})`,
          //   opacity: 0.5,
          // }}
        />
      )}
      {isChapter1 && !isChapter1Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-fixed bg-center bg-no-repeat"
          // style={{
          //   backgroundImage: `url(${chapter1Bg})`,
          //   opacity: 0.35,
          // }}
        />
      )}
      {/* For Chapter 1 and 2, show only their main backgrounds, never the step backgrounds */}
      {/* Only one Chapter 1 background overlay, toned down */}
      {isChapter2 && !isChapter2Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-fixed bg-center bg-no-repeat"
          // style={{
          //   backgroundImage: `url(${chapter2Bg})`,
          //   opacity: 0.5,
          // }}
        />
      )}

      <div className="animate-in fade-in relative z-10 mx-auto mt-6 w-full max-w-[680px] duration-700 sm:mt-12">
        {/* Removed Unlock Chapter 2 TEMP button */}
        {/* <button
          onClick={onBack}
          className="flex items-center gap-2 text-[12.5px] font-bold text-primary hover:text-primary/80 transition-colors mb-6 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
            strokeWidth={2.5}
          />
          Back to Dashboard
        </button> */}

        <div
          className={`mb-7 rounded-3xl border-[1.5px] border-solid bg-gradient-to-br from-white via-white/95 to-neutral-50 p-6 shadow-[0_8px_40px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)] transition-all duration-300 hover:scale-[1.018] hover:shadow-[0_16px_56px_rgba(36,42,66,0.22),0_6px_24px_rgba(44,62,80,0.18)] sm:p-8 ${isChapter3 ? "border-[#051738]" : isChapter2 ? "border-[#520a50]" : "border-[#8284bf]"} `}
        >
          <div
            className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-[13px] py-[4px] text-[11px] font-bold tracking-[0.07em] uppercase ${
              isDone
                ? isChapter3
                  ? "border-[#051738] bg-[#e8ecf3] text-[#051738]"
                  : isChapter2
                    ? "border-[#520a50] bg-[#f4e6f3] text-[#520a50]"
                    : "border-[#8284bf] bg-[#f0f1fb] text-[#8284bf]"
                : isInProgress
                  ? isChapter3
                    ? "border-[#051738] bg-[#e8ecf3] text-[#051738]"
                    : isChapter2
                      ? "border-[#520a50] bg-[#f4e6f3] text-[#520a50]"
                      : "border-[#8284bf] bg-[#f0f1fb] text-[#8284bf]"
                  : isChapter3
                    ? "border-[#051738] bg-[#e8ecf3] text-[#051738]"
                    : isChapter2
                      ? "border-[#520a50] bg-[#f4e6f3] text-[#520a50]"
                      : "border-[#8284bf] bg-[#f0f1fb] text-[#8284bf]"
            }`}
          >
            {isDone ? "✓ Completed" : isInProgress ? "In Progress" : "Not Started"}
          </div>
          <h1 className="mb-1 text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight text-[#1a2236]">
            {(chapter.chapter_name || (chapter as any).name).replace(/^Stage\s[IVX]+:\s/, "")}
          </h1>
          <p className="mb-4 text-[14px] leading-[1.7] text-[#3a4f63]">
            {chapter.chapter_description || chapter.description}
          </p>

          <div className="flex items-center gap-2.5">
            <div
              className={`h-[7px] flex-1 overflow-hidden rounded-[13px] ${isChapter3 ? "bg-[#e8ecf3]" : isChapter2 ? "bg-[#f4e6f3]" : "bg-[#f0f1fb]"}`}
            >
              <div
                className="h-full rounded-[13px] shadow-[0_2.5px_12px_rgba(36,42,66,0.18)] transition-all duration-500"
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
          <div className="animate-in slide-in-from-top-2 mb-3 flex items-start gap-2 rounded-[10px] border border-[#f7c6c6] bg-[#fff6f6] p-[11px_14px] text-[12.5px] text-[#c85a5a] duration-500">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong className="mb-0.5 block font-bold">
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
          className={`mb-4 flex flex-col gap-3 rounded-2xl border-[1.5px] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4 ${
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
            className={`flex flex-shrink-0 items-center justify-center rounded-full border-2 shadow-[0_2px_8px_rgba(0,0,0,0.09)] transition-all ${
              plan.tier === "free"
                ? "h-10 w-10 border-[#8fa8d4] bg-[#f0f4fb] sm:h-12 sm:w-12"
                : plan.tier === "basic"
                  ? "h-10 w-10 border-[#bfe5e2] bg-[#eef9f8] sm:h-12 sm:w-12"
                  : plan.tier === "premium"
                    ? "h-10 w-10 border-[#a088d8] bg-[#faf7fe] sm:h-12 sm:w-12"
                    : "h-10 w-10 border-[#c9a855] bg-[#fef9f0] sm:h-12 sm:w-12"
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
                fontSize: plan.tier === "executive" ? 23 : plan.tier === "basic" ? 23 : 23,
                color: plan.tier === "basic" ? "#296d6c" : undefined,
                fontWeight: 600,
              }}
              aria-hidden="true"
            />
          </div>

          <p
            className={`m-0 flex-1 text-[12px] leading-relaxed font-semibold sm:text-[13px] ${
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
              className={`group relative inline-flex flex-shrink-0 items-center gap-1 overflow-hidden rounded-xl border border-white/15 px-4 py-2 text-[11px] font-bold whitespace-nowrap text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.96] sm:gap-1.5 sm:px-5.5 sm:py-2.75 sm:text-[12.5px] ${
                plan.tier === "free"
                  ? "bg-[#7fa8d8] hover:bg-[#6f98cc]"
                  : plan.tier === "basic"
                    ? "bg-[#2f9a95] hover:bg-[#257e7a]"
                    : "bg-[#9b7dd8] hover:bg-[#8b6dcf]"
              }`}
            >
              <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-white/10 transition-transform duration-700 group-hover:translate-x-[100%]" />
              <span className="relative">Upgrade Plan</span>
              <ChevronRight
                size={14}
                strokeWidth={3}
                className="relative sm:h-[16px] sm:w-[16px]"
              />
            </button>
          )}
        </div>

        {/* Mobile Vertical Timeline Stepper View (< sm) */}
        <div className="relative flex flex-col gap-6 pl-10 sm:hidden">
          {/* Vertical Connecting Track Line */}
          <div
            className={`absolute top-3 bottom-3 left-[14px] w-[2px] ${
              isChapter3 ? "bg-[#051738]/25" : isChapter2 ? "bg-[#520a50]/25" : "bg-[#8284bf]/25"
            }`}
          />

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

            const lockStatus = getStepLockStatusLocal(idx, sId);
            const isStepLocked = lockStatus.isLocked;
            const accessTier = lockStatus.requiredPlan || "basic";
            const accessTierLabel =
              accessTier === "basic" ? "Basic" : accessTier === "premium" ? "Premium" : "Executive";

            const chapterBg = isChapter3
              ? "bg-[#051738]"
              : isChapter2
                ? "bg-[#520a50]"
                : "bg-[#8284bf]";
            const chapterText = isChapter3
              ? "text-[#051738]"
              : isChapter2
                ? "text-[#520a50]"
                : "text-[#8284bf]";
            const chapterBorder = isChapter3
              ? "border-[#051738]"
              : isChapter2
                ? "border-[#520a50]"
                : "border-[#8284bf]";
            const chapterSoftBg = isChapter3
              ? "bg-[#051738]/10 text-[#051738] border-[#051738]/20"
              : isChapter2
                ? "bg-[#520a50]/10 text-[#520a50] border-[#520a50]/20"
                : "bg-[#8284bf]/10 text-[#8284bf] border-[#8284bf]/20";

            return (
              <div
                key={`mobile-${sId}`}
                onClick={() => {
                  if (isStepLocked) {
                    const feat = getModalFeatureForTier(lockStatus.requiredPlan!);
                    setUpgradeModalFeature(feat);
                    return;
                  }
                  onSelectStep(chapterIdx, fullStepIdx);
                }}
                className="relative cursor-pointer select-none"
              >
                {/* Timeline Circle Node */}
                <div
                  className={`absolute top-0.5 -left-[37px] z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold shadow-xs transition-all ${
                    isCompleted
                      ? `${chapterBg} text-white`
                      : isCurrent
                        ? `${chapterBg} scale-105 text-white ring-4 ring-purple-900/15`
                        : isStepLocked
                          ? "border border-slate-300 bg-slate-200 text-slate-400"
                          : "border-2 border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  {isCompleted ? "✓" : isStepLocked ? <Lock size={10} /> : idx + 1}
                </div>

                {/* Content Box */}
                {isCurrent ? (
                  <div className={`rounded-2xl border-2 ${chapterBorder} bg-white p-3.5 shadow-md`}>
                    <h4 className={`text-[14.5px] font-extrabold ${chapterText}`}>
                      {step.step_name || (step as any).name}
                    </h4>
                    {step.step_short_description && (
                      <p className="mt-0.5 text-[12px] leading-relaxed font-semibold text-slate-600">
                        {step.step_short_description}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center">
                      <span
                        className={`rounded-md ${chapterBg} px-2.5 py-1 text-[9.5px] font-extrabold tracking-wider text-white uppercase shadow-xs`}
                      >
                        Current Step
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-0.5">
                    <h4
                      className={`text-[14px] leading-snug font-bold ${isCompleted ? "text-slate-900" : isStepLocked ? "text-slate-400" : "text-slate-800"}`}
                    >
                      {step.step_name || (step as any).name}
                    </h4>
                    {step.step_short_description && (
                      <p
                        className={`mt-0.5 text-[11.5px] leading-normal font-semibold ${isCompleted ? "text-slate-500" : isStepLocked ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {step.step_short_description}
                      </p>
                    )}

                    {isCompleted && (
                      <div className="mt-1.5 flex items-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border ${chapterSoftBg} px-2 py-0.5 text-[10px] font-bold`}
                        >
                          Completed
                        </span>
                      </div>
                    )}

                    {isStepLocked && (
                      <div className="mt-1.5 flex items-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            accessTier === "basic"
                              ? "border-[#7ecfc6] bg-[#e7f7f5] text-[#166b62]"
                              : accessTier === "premium"
                                ? "border-[#c5b9ff] bg-[#f0ebff] text-[#4b3587]"
                                : "border-[#d8b95d] bg-[#fff4cf] text-[#7a560f]"
                          }`}
                        >
                          <Lock size={10} />
                          <span>{accessTierLabel}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Step Cards View (sm:flex) */}
        <div className="hidden flex-col gap-2.5 sm:flex">
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

            // Accent and border colors to match screenshot
            // Updated to a nicer shade of purple for Chapter 2, blue for Chapter 3
            // --- Enhanced accent color palette and depth for step cards ---
            // Harmonized, premium step card colors
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
              textColor = "text-[#8b94a5]"; // darker title for legibility
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
              bgColor = "bg-white/80 backdrop-blur-sm"; // softly transparent for all chapters
              textColor = isChapter3
                ? "text-[#051738]" // deep blue accent
                : isChapter2
                  ? "text-[#520a50]" // deep purple accent
                  : "text-[#8284bf]"; // purple accent
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
                    // Show upgrade modal with tier-appropriate feature
                    const feat = getModalFeatureForTier(lockStatus.requiredPlan!);
                    setUpgradeModalFeature(feat);
                    return;
                  }
                  // Step is accessible — open it normally
                  onSelectStep(chapterIdx, fullStepIdx);
                }}
                className={`group animate-in fade-in slide-in-from-right-2 flex cursor-pointer items-center gap-5 rounded-[13px] border-[1.5px] px-5 py-3.5 transition-all duration-500 ${borderColor} ${bgColor} relative ${
                  isCompleted
                    ? "shadow-[0_8px_32px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]"
                    : "shadow-[0_4px_20px_rgba(36,42,66,0.13),0_2px_8px_rgba(44,62,80,0.10)] hover:shadow-[0_8px_32px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]"
                } active:scale-[0.98] ${!isStepLocked && isCurrent ? (isChapter3 ? "before:bg-[#051738]" : isChapter2 ? "before:bg-[#520a50]" : "before:bg-[#8284bf]") + ' before:content-[" "] before:absolute before:inset-y-1 before:left-0 before:w-1.5 before:rounded-full' : ""} `}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="relative flex shrink-0 items-center">
                  <div
                    className={`flex items-center justify-center rounded-full border-2 text-[10px] font-bold tracking-[0.04em] transition-all ${iconBg} ${iconBorder} ${iconText} h-7 w-7 shadow-[0_1.5px_6px_rgba(36,42,66,0.10)]`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[14px] leading-[1.3] font-semibold ${textColor}`}>
                    {step.step_name || (step as any).name}
                  </div>
                  <div
                    className={`mt-0.25 text-[11.5px] font-semibold ${isStepLocked ? "text-[#a8b5c0]" : isCompleted ? "text-white" : "text-[#23232b]"}`}
                  >
                    {step.step_short_description || ""}
                  </div>
                </div>
                {isStepLocked ? (
                  <div
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.03em] ${
                      accessTier === "basic"
                        ? "border-[#7ecfc6] bg-[#e7f7f5] text-[#166b62]"
                        : accessTier === "premium"
                          ? "border-[#c5b9ff] bg-[#f0ebff] text-[#4b3587]"
                          : "border-[#d8b95d] bg-[#fff4cf] text-[#7a560f]"
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

      {/* Upgrade Modal for free tier step limit */}
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}
    </div>
  );
}
