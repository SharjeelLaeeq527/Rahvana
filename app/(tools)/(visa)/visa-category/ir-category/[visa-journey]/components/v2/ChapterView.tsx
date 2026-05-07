"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage, getStageProgress } from "./journeyHelpers";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { PlanTier } from "@/lib/entitlements/config";
import { getStepLockStatus, HARD_LOCK_RULES, getModalFeatureForTier } from "@/lib/entitlements/hardLockRules";

interface ChapterViewProps {
  data: RoadmapData;
  chapterIdx: number;
  state: WizardState;
  onBack: () => void;
  onSelectStep: (chapterIdx: number, stepIdx: number) => void;
}

export function ChapterView({
  data,
  chapterIdx,
  state,
  onBack,
  onSelectStep,
}: ChapterViewProps) {
  const plan = usePlan();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(
    null,
  );

  const chapters = data.chapters || (data as any).stages;
  const chapter = chapters[chapterIdx];

  const filingMethod = state.metadata?.filingMethod || state.filingType;

  const activeSteps = useMemo(
    () => getActiveStepsForStage(data, chapterIdx, state.metadata, state.filingType),
    [data, chapterIdx, state.metadata, state.filingType],
  );

  const prog = useMemo(
    () => getStageProgress(data, chapterIdx, state),
    [data, chapterIdx, state],
  );

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
    isChapter1 &&
    typeof state.currentStep === "number" &&
    state.currentStep >= 0;
  const isChapter2Step =
    isChapter2 &&
    typeof state.currentStep === "number" &&
    state.currentStep >= 0;
  const isChapter3Step =
    isChapter3 &&
    typeof state.currentStep === "number" &&
    state.currentStep >= 0;

  // Helper function to check if a step is locked and why
  const getStepLockStatusLocal = (idx: number, sId: string) => {
    return getStepLockStatus(sId, plan.tier, chapterIdx, idx);
  };

  return (
    <div
      className={`flex-1 overflow-y-auto py-8 px-6 pb-20 scrollbar-hide relative`}
      style={
        isChapter1 || isChapter2 || isChapter3
          ? { minHeight: "100vh" }
          : undefined
      }
    >
      {/* Fullscreen background for Chapter 1, 2, 3 and their steps */}
      {/* Only show the special step background for Chapter 3 steps */}
      {isChapter3 && !isChapter3Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          // style={{
          //   backgroundImage: `url(${chapter3Bg})`,
          //   opacity: 0.5,
          // }}
        />
      )}
      {isChapter1 && !isChapter1Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
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
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          // style={{
          //   backgroundImage: `url(${chapter2Bg})`,
          //   opacity: 0.5,
          // }}
        />
      )}

      <div className="w-full max-w-[680px] mx-auto animate-in fade-in duration-700 relative z-10 mt-12">
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
          className={`bg-gradient-to-br from-white via-white/95 to-neutral-50 border-[1.5px] rounded-3xl p-[32px_32px] mb-7
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
            {isDone
              ? "✓ Completed"
              : isInProgress
                ? "In Progress"
                : "Not Started"}
          </div>
          <h1 className="text-[clamp(22px,3vw,28px)] font-extrabold text-[#1a2236] mb-1 tracking-tight">
            {(chapter.chapter_name || (chapter as any).name).replace(
              /^Stage\s[IVX]+:\s/,
              "",
            )}
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
                  background: isChapter3
                    ? "#051738"
                    : isChapter2
                      ? "#520a50"
                      : "#8284bf",
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
                You must complete &quot;Choose Filing Method&quot; to unlock
                specific instructions for Chapter 1.
              </span>
            </div>
          </div>
        )}

      {/* Plan Card */}
<div
  className={`
    relative overflow-hidden
    rounded-2xl border border-slate-200 ring-1 ring-slate-200/70
    bg-gradient-to-br from-white via-[#fbfbfc] to-[#f6f7fa]
    shadow-[0_14px_34px_rgba(15,23,42,0.08)] p-5 mb-4
  `}
>
  <div
    className={`
      absolute inset-0 pointer-events-none
      ${plan.tier === "free"
        ? "bg-[radial-gradient(circle_at_top_right,rgba(187,203,227,0.18),transparent_58%)]"
        : plan.tier === "basic"
          ? "bg-[radial-gradient(circle_at_top_right,rgba(143,209,203,0.18),transparent_58%)]"
          : plan.tier === "premium"
            ? "bg-[radial-gradient(circle_at_top_right,rgba(197,185,255,0.18),transparent_58%)]"
            : "bg-[radial-gradient(circle_at_top_right,rgba(242,216,152,0.22),transparent_58%)]"
      }
    `}
  />

  <div className={`absolute left-0 top-0 h-full w-1.5 ${plan.tier === "free" ? "bg-[#9bb3d3]" : plan.tier === "basic" ? "bg-[#4baea4]" : plan.tier === "premium" ? "bg-[#b9afeb]" : "bg-[#d2a43f]"}`} />

  {/* Icon (Top-right) */}
  <span
    title={`${plan.tier === "free" ? "Free Plan" : plan.tier === "basic" ? "Basic Plan" : plan.tier === "premium" ? "Premium Plan" : "Executive Plan"}`}
    aria-label={`${plan.tier === "free" ? "Free Plan" : plan.tier === "basic" ? "Basic Plan" : plan.tier === "premium" ? "Premium Plan" : "Executive Plan"}`}
    className={`absolute top-3 right-3 inline-flex items-center justify-center ${plan.tier === "executive" ? "w-9 h-9" : "w-11 h-11"} rounded-full border shadow-[0_8px_16px_rgba(15,23,42,0.08)] ring-1 ring-white/60
      ${plan.tier === "free"
        ? "bg-[#eef3fb] border-[#b8cae5]"
        : plan.tier === "basic"
          ? "bg-[#e7f7f5] border-[#7ecfc6]"
          : plan.tier === "premium"
            ? "bg-[#f0ebff] border-[#c5b9ff]"
            : "bg-[#fff4cf] border-[#d8b95d]"
      }
    `}
  >
    <span
      className={`plan-icon ${
        plan.tier === "free"
          ? "plan-icon--free"
          : plan.tier === "basic"
            ? "plan-icon--basic"
            : plan.tier === "premium"
              ? "plan-icon--premium"
              : "plan-icon--executive scale-[0.85]"
      }`}
      aria-hidden="true"
    />
  </span>

  <div className="pr-14">
    {/* Button */}
    {plan.tier !== "executive" && (
      <button
        onClick={() => setUpgradeModalFeature("checklist_engine")}
        className={`
          relative overflow-hidden
          inline-flex w-fit items-center justify-center px-5 py-2.5 rounded-xl
          font-semibold whitespace-nowrap text-sm
          shadow-sm hover:shadow-md
          active:scale-[0.98]
          transition-all duration-150
          group
          mb-2.5
          ${plan.tier === "free"
            ? "bg-[#e3ebf7] text-[#2f4a72] hover:bg-[#d5e0f1]"
            : plan.tier === "basic"
              ? "bg-[#dff5f2] text-[#166b62] hover:bg-[#d2ede8]"
              : plan.tier === "premium"
                ? "bg-[#ece6ff] text-[#4b3587] hover:bg-[#ded5fb]"
                : "bg-[#f6e3ae] text-[#7a560f] hover:bg-[#efd894]"
          }
        `}
      >
        <span className="text-[13px] font-semibold leading-none">Upgrade Plan</span>
      </button>
    )}

    {/* Description */}
    <p className="text-[13px] text-slate-600 leading-relaxed">
      {plan.tier === "free"
        ? "Access is limited right now. Upgrading unlocks the full roadmap, step-by-step guidance, and tools to make the next steps easier."
        : plan.tier === "basic"
          ? "Core roadmap is available. Premium adds step-by-step guidance, a document vault, reminders, and a more complete setup."
          : plan.tier === "premium"
            ? "Advanced toolkit included. Executive adds expert consultation, document reviews, interview preparation, and hands-on support."
            : "Full plan active with complete tools and end-to-end support for the entire process."}
    </p>
  </div>
</div>

        <div className="flex flex-col gap-1.5">
          {activeSteps.map((step, idx) => {
            const sId = step.step_key || (step as any).id;
            const isCompleted = state.completedSteps.has(sId);
            const isCurrent =
              !isCompleted &&
              activeSteps
                .slice(0, idx)
                .every((s) =>
                  state.completedSteps.has(s.step_key || (s as any).id),
                );
            const fullStepIdx = chapter.steps.findIndex(
              (s) => (s.step_key || (s as any).id) === sId,
            );

            // Check if step is locked
            const lockStatus = getStepLockStatusLocal(idx, sId);
            const isStepLocked = lockStatus.isLocked;
            const accessTier = lockStatus.requiredPlan || "basic";
            const accessTierLabel =
              accessTier === "basic"
                ? "Basic"
                : accessTier === "premium"
                  ? "Premium"
                  : "Executive";

            // Accent and border colors to match screenshot
            // Updated to a nicer shade of purple for Chapter 2, blue for Chapter 3
            // --- Enhanced accent color palette and depth for step cards ---
            // Harmonized, premium step card colors
            let borderColor = isChapter3
              ? "border-[#051738]"
              : isChapter2
                ? "border-[#520a50]"
                : "border-[#8284bf]";
            let bgColor =
              "bg-gradient-to-br from-white via-white/95 to-neutral-50";
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
              bgColor = isChapter3
                ? "bg-[#051738]"
                : isChapter2
                  ? "bg-[#520a50]"
                  : "bg-[#8284bf]";
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
                    const feat = getModalFeatureForTier(
                      lockStatus.requiredPlan!,
                    );
                    setUpgradeModalFeature(feat);
                    return;
                  }
                  // Step is accessible — open it normally
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
                <div className="relative shrink-0 flex items-center gap-2">
                  <div
                    className={`rounded-full border-2 flex items-center justify-center text-[10px] font-bold tracking-[0.04em] transition-all ${iconBg} ${iconBorder} ${iconText}
                      shadow-[0_1.5px_6px_rgba(36,42,66,0.10)]
                      ${isStepLocked ? "w-7 h-7" : "w-7 h-7"}
                    `}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  {isStepLocked && (
                    <div
                      className={`pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] opacity-0 shadow-sm transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-4px] ${
                        accessTier === "basic"
                          ? "bg-[#e7f7f5] border-[#7ecfc6] text-[#166b62]"
                          : accessTier === "premium"
                            ? "bg-[#f0ebff] border-[#c5b9ff] text-[#4b3587]"
                            : "bg-[#fff4cf] border-[#d8b95d] text-[#7a560f]"
                      }`}
                    >
                      Unlocks with {accessTierLabel}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-[14px] font-semibold leading-[1.3] ${textColor}`}
                  >
                    {step.step_name || (step as any).name}
                  </div>
                  <div
                    className={`text-[11.5px] font-semibold mt-0.25 ${isStepLocked ? "text-[#a8b5c0]" : isCompleted ? "text-white" : "text-[#23232b]"}`}
                  >
                    {step.step_short_description || ""}
                  </div>
                </div>
                <ChevronRight
                  className={`shrink-0 ${isStepLocked ? "text-[#c5cfd9] opacity-50" : "text-[#b3a6b3] opacity-30"}`}
                  size={14}
                  strokeWidth={3}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal for free tier step limit */}
      {upgradeModalFeature && (
        <UpgradeModal
          feature={upgradeModalFeature}
          onClose={() => setUpgradeModalFeature(null)}
        />
      )}
    </div>
  );
}
