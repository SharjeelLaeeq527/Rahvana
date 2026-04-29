"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, AlertTriangle, Lock, Crown } from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage, getStageProgress } from "./journeyHelpers";
import { usePlan } from "@/app/context/PlanContext";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { PlanTier } from "@/lib/entitlements/config";

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
    () => getActiveStepsForStage(data, chapterIdx, filingMethod),
    [data, chapterIdx, filingMethod],
  );

  const prog = useMemo(
    () => getStageProgress(data, chapterIdx, state),
    [data, chapterIdx, state],
  );

  const isDone = prog.pct === 100;
  const isInProgress = prog.pct > 0 && prog.pct < 100;

  const isChapter1 = chapterIdx === 0;
  const isFreeTier = plan.tier === "free";

  // Chapter backgrounds
  const chapter1Bg = "/assets/images/chapter1-bg.png";
  const chapter1StepBg = "/assets/images/ch1steps-bg.png";
  const chapter2Bg = "/assets/images/chapter-2-bg.png";
  const chapter2StepBg = "/assets/images/ch2steps-bg.png";
  const chapter3Bg = "/assets/images/chapter-3-bg.png";
  const chapter3StepBg = "/assets/images/ch3steps-bg.png";

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

  const HARD_LOCK_RULES: Record<string, PlanTier[]> = {
    step_1_16: ["free", "basic"],
    step_2_1: ["free"],
    step_2_2: ["free"],
    step_2_3: ["free"],
    step_2_4: ["free"],
    step_2_5: ["free"],
    step_2_6: ["free", "basic"],
    step_2_7: ["free"],
    step_2_8: ["free"],
    step_2_9: ["free"],
    step_2_10: ["free"],
    step_2_11: ["free"],
    step_2_12: ["free"],
    step_3_1: ["free", "basic"],
    step_3_2: ["free", "basic"],
    step_3_3: ["free"],
    step_3_4: ["free"],
    step_3_5: ["free"],
    step_3_6: ["free"],
    step_3_7: ["free"],
    step_3_8: ["free"],
    step_3_9: ["free"],
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
          style={{
            backgroundImage: `url(${chapter3Bg})`,
            opacity: 0.5,
          }}
        />
      )}
      {isChapter1 && !isChapter1Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(${chapter1Bg})`,
            opacity: 0.35,
          }}
        />
      )}
      {/* For Chapter 1 and 2, show only their main backgrounds, never the step backgrounds */}
      {/* Only one Chapter 1 background overlay, toned down */}
      {isChapter2 && !isChapter2Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(${chapter2Bg})`,
            opacity: 0.5,
          }}
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
            ${isChapter3 ? "border-[#2b6e7a]" : isChapter2 ? "border-[#7c5e8a]" : "border-[#b97c7c]"}
          `}
        >
          <div
            className={`inline-flex items-center gap-1.5 px-[13px] py-[4px] rounded-full text-[11px] font-bold tracking-[0.07em] uppercase mb-3 border
              ${
                isDone
                  ? isChapter3
                    ? "bg-[#eaf4f6] border-[#2b6e7a] text-[#2b6e7a]"
                    : isChapter2
                      ? "bg-[#f3f0fa] border-[#7c5e8a] text-[#7c5e8a]"
                      : "bg-[#f7e0ec] border-[#b97c7c] text-[#b97c7c]"
                  : isInProgress
                    ? isChapter3
                      ? "bg-[#eaf4f6] border-[#2b6e7a] text-[#2b6e7a]"
                      : isChapter2
                        ? "bg-[#f3f0fa] border-[#7c5e8a] text-[#7c5e8a]"
                        : "bg-[#f7e0ec] border-[#b97c7c] text-[#b97c7c]"
                    : isChapter3
                      ? "bg-[#eaf4f6] border-[#2b6e7a] text-[#2b6e7a]"
                      : isChapter2
                        ? "bg-[#f3f0fa] border-[#7c5e8a] text-[#7c5e8a]"
                        : "bg-[#f7e0ec] border-[#b97c7c] text-[#b97c7c]"
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
              className={`flex-1 h-[7px] rounded-[13px] overflow-hidden ${isChapter3 ? "bg-[#eaf4f6]" : isChapter2 ? "bg-[#f3f0fa]" : "bg-[#f7e0ec]"}`}
            >
              <div
                className="h-full rounded-[13px] transition-all duration-500 shadow-[0_2.5px_12px_rgba(36,42,66,0.18)]"
                style={{
                  width: `${prog.pct}%`,
                  background: isChapter3
                    ? "#2b6e7a"
                    : isChapter2
                      ? "#7c5e8a"
                      : "#b97c7c",
                }}
              />
            </div>
            <div
              className={`text-[12px] font-bold ${isChapter3 ? "text-[#217a8b]" : isChapter2 ? "text-[#7a326a]" : "text-[#a06ca7]"}`}
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

            // Accent and border colors to match screenshot
            // Updated to a nicer shade of purple for Chapter 2, blue for Chapter 3
            // --- Enhanced accent color palette and depth for step cards ---
            // Harmonized, premium step card colors
            let borderColor = isChapter3
              ? "border-[#2b6e7a]"
              : isChapter2
                ? "border-[#7c5e8a]"
                : "border-[#b97c7c]";
            let bgColor =
              "bg-gradient-to-br from-white via-white/95 to-neutral-50";
            let textColor = isChapter3
              ? "text-[#2b6e7a]"
              : isChapter2
                ? "text-[#7c5e8a]"
                : "text-[#b97c7c]";
            let iconBg = "bg-white";
            let iconBorder = borderColor;
            let iconText = textColor;

            if (isCompleted) {
              borderColor = isChapter3
                ? "border-[#2b6e7a]"
                : isChapter2
                  ? "border-[#7c5e8a]"
                  : "border-[#b97c7c]";
              bgColor = isChapter3
                ? "bg-[#2b6e7a]"
                : isChapter2
                  ? "bg-[#7c5e8a]"
                  : "bg-[#b97c7c]";
              textColor = "text-white";
              iconBg = "bg-white/20";
              iconBorder = isChapter3
                ? "border-[#b2dbe0]"
                : isChapter2
                  ? "border-[#d6cbe0]"
                  : "border-[#e7bfc2]";
              iconText = "text-white";
            } else if (isCurrent) {
              borderColor = isChapter3
                ? "border-[#2b6e7a]"
                : isChapter2
                  ? "border-[#7c5e8a]"
                  : "border-[#b97c7c]";
              bgColor = "bg-white/80 backdrop-blur-sm"; // softly transparent for all chapters
              textColor = isChapter3
                ? "text-[#217a8b]" // deep teal accent
                : isChapter2
                  ? "text-[#7c5e8a]" // deep lavender accent
                  : "text-[#b97c7c]"; // deep rose accent
              iconBg = "bg-white";
              iconBorder = borderColor;
              iconText = textColor;
            } else {
              borderColor = isChapter3
                ? "border-[#b2dbe0]"
                : isChapter2
                  ? "border-[#d6cbe0]"
                  : "border-[#e7bfc2]";
              bgColor = "bg-white";
              textColor = isChapter3
                ? "text-[#2b6e7a]"
                : isChapter2
                  ? "text-[#7c5e8a]"
                  : "text-[#b97c7c]";
              iconBg = "bg-white";
              iconBorder = borderColor;
              iconText = textColor;
            }

            return (
              <div
                key={sId}
                onClick={() => {
                  // Free tier restriction
                  if (isFreeTier && isChapter1 && idx > 1) {
                    setUpgradeModalFeature("step_guides");
                    return;
                  }

                  // Premium + Executive tier hard locks for specific steps
                  const restrictedTiers = HARD_LOCK_RULES[sId];

                  if (restrictedTiers && restrictedTiers.includes(plan.tier)) {
                    const feat = STEP_PRIMARY_FEATURE[sId] || "step_guides";
                    setUpgradeModalFeature(feat);
                    return;
                  }

                  // Allowed
                  onSelectStep(chapterIdx, fullStepIdx);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-[13px] ${isFreeTier && isChapter1 && idx > 1 ? "cursor-not-allowed" : "cursor-pointer"} transition-all border-[1.5px] animate-in fade-in slide-in-from-right-2 duration-500 ${borderColor} ${bgColor} relative
                  ${
                    isCompleted
                      ? "shadow-[0_8px_32px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]"
                      : "shadow-[0_4px_20px_rgba(36,42,66,0.13),0_2px_8px_rgba(44,62,80,0.10)] hover:shadow-[0_8px_32px_rgba(36,42,66,0.18),0_3px_16px_rgba(44,62,80,0.13)]"
                  }
                  active:scale-[0.98]
                  ${isCurrent ? (isChapter3 ? "before:bg-[#2b6e7a]" : isChapter2 ? "before:bg-[#7c5e8a]" : "before:bg-[#b97c7c]") + ' before:content-[" "] before:absolute before:inset-y-1 before:left-0 before:w-1.5 before:rounded-full' : ""}
                `}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11.5px] font-bold transition-all shrink-0 ${iconBg} ${iconBorder} ${iconText}
                    shadow-[0_1.5px_6px_rgba(36,42,66,0.10)]
                  `}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-[14px] font-semibold leading-[1.3] ${textColor}`}
                  >
                    {step.step_name || (step as any).name}
                  </div>
                  <div
                    className={`text-[11.5px] font-semibold mt-0.25 ${isCompleted ? "text-white" : "text-[#23232b]"}`}
                  >
                    {step.step_short_description || ""}
                  </div>
                </div>
                {/* Lock badge — shown when step's primary feature is locked OR free tier limit reached */}
                {(() => {
                  const feat = STEP_PRIMARY_FEATURE[sId];

                  // Free tier Chapter 1 lock for steps beyond first 2
                  if (isFreeTier && isChapter1 && idx > 1) {
                    return (
                      <div
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border bg-[#ede8f5] text-[#7c5e8a] border-[#c9b8d8]`}
                      >
                        <Lock size={9} strokeWidth={2.5} />
                        Locked
                      </div>
                    );
                  }

                  // Check if primary feature is locked
                  if (feat && plan.isLocked(feat)) {
                    const isExec =
                      feat === "polio_certificate" || feat === "action_221g";
                    const LockIcon = isExec ? Crown : Lock;
                    return (
                      <div
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                          isExec
                            ? "bg-[#fef3d8] text-[#a06000] border-[#f0c878]"
                            : "bg-[#ede8f5] text-[#7c5e8a] border-[#c9b8d8]"
                        }`}
                      >
                        <LockIcon size={9} strokeWidth={2.5} />
                        {isExec ? "Executive" : "Locked"}
                      </div>
                    );
                  }

                  return null;
                })()}
                <ChevronRight
                  className="text-[#b3a6b3] opacity-30 shrink-0"
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
