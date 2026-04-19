"use client";

import React, { useMemo } from "react";
import { ArrowLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage, getStageProgress } from "./journeyHelpers";

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


  // Chapter backgrounds
  const chapter1Bg = "/assets/images/chapter1-bg.png";
  const chapter1StepBg = "/assets/images/ch1steps-bg.png";
  const chapter2Bg = "/assets/images/chapter-2-bg.png";
  const chapter2StepBg = "/assets/images/ch2steps-bg.png";
  const chapter3Bg = "/assets/images/chapter-3-bg.png";
  const chapter3StepBg = "/assets/images/ch3steps-bg.png";

  const isChapter1 = chapterIdx === 0;
  const isChapter2 = chapterIdx === 1;
  const isChapter3 = chapterIdx === 2;

  // Determine if a step is selected (for substep background)
  const isChapter1Step = isChapter1 && typeof state.currentStep === "number" && state.currentStep >= 0;
  const isChapter2Step = isChapter2 && typeof state.currentStep === "number" && state.currentStep >= 0;
  const isChapter3Step = isChapter3 && typeof state.currentStep === "number" && state.currentStep >= 0;

  return (
    <div
      className={`flex-1 overflow-y-auto py-8 px-6 pb-20 scrollbar-hide relative`}
      style={isChapter1 || isChapter2 || isChapter3 ? { minHeight: "100vh" } : undefined}
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
      {/* For Chapter 1 and 2, show only their main backgrounds, never the step backgrounds */}
      {isChapter1 && !isChapter1Step && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(${chapter1Bg})`,
            opacity: 0.5,
          }}
        />
      )}
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

        <div className={`bg-white/95 border-[1.5px] rounded-2xl p-[18px_20px] mb-3.5 shadow-[0_8px_32px_rgba(44,62,80,0.13),0_1.5px_6px_rgba(108,90,167,0.07)] backdrop-blur-md ${
          isChapter3
            ? "border-[#b3d6f7]"
            : isChapter2
              ? "border-[#d1c6e7]"
              : "border-[#ecdbe7]"
        }`}>
          <div
            className={`inline-flex items-center gap-1.25 px-[11px] py-[3px] rounded-full text-[10px] font-bold tracking-[0.07em] uppercase mb-2.5 border ${
              isDone
                ? isChapter3
                  ? "bg-[#e3f2fd] border-[#b3d6f7] text-[#2176c7]"
                  : isChapter2
                    ? "bg-[#f2f7f7] border-[#c6c8e0] text-[#6c5aa7]"
                    : "bg-[#f2f7f2] border-[#c8e0d0] text-[#15744f]"
                : isInProgress
                  ? isChapter3
                    ? "bg-[#e3f2fd] border-[#b3d6f7] text-[#2176c7]"
                    : isChapter2
                      ? "bg-[#f7f3fa] border-[#d1c6e7] text-[#6c5aa7]"
                      : "bg-[#f7f3fa] border-[#ecdbe7] text-[#a06ca7]"
                  : isChapter3
                    ? "bg-[#e3f2fd] border-[#b3d6f7] text-[#2176c7]"
                    : isChapter2
                      ? "bg-[#f7f3fa] border-[#d1c6e7] text-[#6c5aa7]"
                      : "bg-[#f7f3fa] border-[#ecdbe7] text-[#a06ca7]"
            }`}
          >
            {isDone
              ? "✓ Completed"
              : isInProgress
                ? "In Progress"
                : "Not Started"}
          </div>
          <h1 className="text-[clamp(20px,3vw,26px)] font-black text-[#0c1b33] mb-1">
            {(chapter.chapter_name || (chapter as any).name).replace(
              /^Stage\s[IVX]+:\s/,
              "",
            )}
          </h1>
          <p className="text-[13.5px] text-[#3a4f63] leading-[1.7] mb-3.5">
            {chapter.chapter_description || chapter.description}
          </p>

          <div className="flex items-center gap-2.5">
            <div className={`flex-1 h-[5px] rounded-[10px] overflow-hidden ${isChapter3 ? "bg-[#d0e8fa]" : isChapter2 ? "bg-[#e0def3]" : "bg-[#f3e0e4]"}`}>
              <div
                className="h-full rounded-[10px] transition-all duration-500"
                style={{ width: `${prog.pct}%`, background: isChapter3 ? '#2176c7' : isChapter2 ? '#6c5aa7' : '#c0596a' }}
              />
            </div>
            <div className={`text-[11px] font-bold ${isChapter3 ? "text-[#2176c7]" : isChapter2 ? "text-[#6c5aa7]" : "text-[#c0596a]"}`}>
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
          {activeSteps
            .filter(
              (step) =>
                step.step_key !== "step_1_15" &&
                step.step_key !== "step_1_16"
            )
            .map((step, idx) => {
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
              let borderColor = isChapter3
              ? "border-[#7fc1f9]"
              : isChapter2
                ? "border-[#8f6be9]"
                : "border-[#e7bfc2]";
            let bgColor = "bg-white";
            let textColor = isChapter3
              ? "text-[#2176c7]"
              : isChapter2
                ? "text-[#7c4dce]"
                : "text-[#a06ca7]";
            let iconBg = "bg-white";
            let iconBorder = isChapter3
              ? "border-[#7fc1f9]"
              : isChapter2
                ? "border-[#8f6be9]"
                : "border-[#e7bfc2]";
            let iconText = isChapter3
              ? "text-[#2176c7]"
              : isChapter2
                ? "text-[#7c4dce]"
                : "text-[#e06a6a]";
            if (isCompleted) {
              borderColor = isChapter3
                ? "border-[#b3d6f7]"
                : isChapter2
                  ? "border-[#b7a6f7]"
                  : "border-[#b7e0c3]";
              bgColor = "bg-white";
              textColor = isChapter3
                ? "text-[#2176c7]"
                : isChapter2
                  ? "text-[#7c4dce]"
                  : "text-[#15744f]";
              iconBg = "bg-white";
              iconBorder = isChapter3
                ? "border-[#b3d6f7]"
                : isChapter2
                  ? "border-[#b7a6f7]"
                  : "border-[#b7e0c3]";
              iconText = isChapter3
                ? "text-[#2176c7]"
                : isChapter2
                  ? "text-[#7c4dce]"
                  : "text-[#15744f]";
            } else if (isCurrent) {
              borderColor = isChapter3
                ? "border-[#2176c7]"
                : isChapter2
                  ? "border-[#7c4dce]"
                  : "border-[#c0596a]";
              bgColor = "bg-white";
              textColor = isChapter3
                ? "text-[#2176c7]"
                : isChapter2
                  ? "text-[#7c4dce]"
                  : "text-[#c0596a]";
              iconBg = "bg-white";
              iconBorder = isChapter3
                ? "border-[#2176c7]"
                : isChapter2
                  ? "border-[#7c4dce]"
                  : "border-[#c0596a]";
              iconText = isChapter3
                ? "text-[#2176c7]"
                : isChapter2
                  ? "text-[#7c4dce]"
                  : "text-[#c0596a]";
            } else {
              borderColor = isChapter3
                ? "border-[#d0e8fa]"
                : isChapter2
                  ? "border-[#e0def3]"
                  : "border-[#e7dbe7]";
              bgColor = "bg-white";
              textColor = isChapter3
                ? "text-[#b3d6f7]"
                : isChapter2
                  ? "text-[#b3a6d3]"
                  : "text-[#b3a6b3]";
              iconBg = "bg-white";
              iconBorder = isChapter3
                ? "border-[#d0e8fa]"
                : isChapter2
                  ? "border-[#e0def3]"
                  : "border-[#e7dbe7]";
              iconText = isChapter3
                ? "text-[#b3d6f7]"
                : isChapter2
                  ? "text-[#b3a6d3]"
                  : "text-[#b3a6b3]";
            }

            return (
              <div
                key={sId}
                onClick={() => onSelectStep(chapterIdx, fullStepIdx)}
                className={`flex items-center gap-3 px-4 py-3 rounded-[10px] cursor-pointer transition-all border-[1.5px] animate-in fade-in slide-in-from-right-2 duration-500 ${borderColor} ${bgColor}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${iconBg} ${iconBorder} ${iconText}`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <div className={`text-[13.5px] font-semibold leading-[1.3] ${textColor}`}>
                    {step.step_name || (step as any).name}
                  </div>
                  <div className="text-[11.5px] text-[#b3a6b3] mt-0.25">
                    {step.step_short_description || ""}
                  </div>
                </div>
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
    </div>
  );
}
