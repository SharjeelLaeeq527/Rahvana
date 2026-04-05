"use client";

import React, { useMemo } from "react";
import {
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
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
  const stage = data.stages[chapterIdx];
  const activeSteps = useMemo(
    () => getActiveStepsForStage(data, chapterIdx, state.metadata.filingMethod),
    [data, chapterIdx, state.metadata.filingMethod],
  );

  const prog = useMemo(
    () => getStageProgress(data, chapterIdx, state),
    [data, chapterIdx, state],
  );

  const isDone = prog.pct === 100;
  const isInProgress = prog.pct > 0 && prog.pct < 100;

  return (
    <div className="flex-1 overflow-y-auto py-8 px-6 pb-20 scrollbar-hide bg-[#f4f7fb]">
      <div className="w-full max-w-[680px] mx-auto animate-in fade-in duration-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[12.5px] font-bold text-primary hover:text-primary/80 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          Back to Dashboard
        </button>

        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-2xl p-[22px_24px] mb-3.5 shadow-sm">
          <div className={`inline-flex items-center gap-1.25 px-[11px] py-[3px] rounded-full text-[10px] font-bold tracking-[0.07em] uppercase mb-2.5 border ${
            isDone 
              ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]" 
              : isInProgress 
                ? "bg-primary/8 border-[#d0e4f7] text-primary" 
                : "bg-[#e8f1fb] border-[#d0e4f7] text-[#2d4a6e]"
          }`}>
            {isDone ? "✓ Completed" : isInProgress ? "In Progress" : "Not Started"}
          </div>
          <h1 className="font-serif text-[clamp(20px,3vw,26px)] text-[#0c1b33] mb-1.5">{stage.name.replace(/^Stage\s[IVX]+:\s/, "")}</h1>
          <p className="text-[13.5px] text-[#3a4f63] leading-[1.7] mb-3.5">
            {stage.description}
          </p>

          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-[#6aa8f0] rounded-[10px] transition-all duration-500" 
                style={{ width: `${prog.pct}%` }} 
              />
            </div>
            <div className="text-[11px] font-bold text-[#6b8097]">{prog.pct}%</div>
          </div>
        </div>

        {/* Branch Warning (Chapter 1 specific) */}
        {chapterIdx === 0 && !state.metadata.filingMethod && (
          <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] mb-3 text-[12.5px] text-[#8a6200] flex gap-2 items-start animate-in slide-in-from-top-2 duration-500">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Action Required: Filing Method Not Selected</strong>
              <span>You must complete &quot;Choose Filing Method&quot; to unlock specific instructions for Chapter 1.</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {activeSteps.map((step, idx) => {
            const isCompleted = state.completedSteps.has(step.id);
            const isCurrent = !isCompleted && activeSteps.slice(0, idx).every(s => state.completedSteps.has(s.id));
            const fullStepIdx = stage.steps.findIndex(s => s.id === step.id);

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(chapterIdx, fullStepIdx)}
                className={`flex items-center gap-3 px-4 py-3 rounded-[10px] cursor-pointer transition-all border-[1.5px] animate-in fade-in slide-in-from-right-2 duration-500 ${
                  isCurrent 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : isCompleted 
                      ? "bg-white border-[#d0e4f7] opacity-65 hover:bg-[#e8f1fb] hover:border-[#b8d4f0]" 
                      : "bg-white border-[#d0e4f7] hover:bg-[#e8f1fb] hover:border-[#b8d4f0]"
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
                  isCompleted 
                    ? "bg-[#15744f] border-[#15744f] text-white" 
                    : isCurrent 
                      ? "bg-primary border-primary text-white" 
                      : "bg-white border-[#d0e4f7] text-[#6b8097]"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-[#1c2b3a] leading-[1.3]">{step.name}</div>
                  <div className="text-[11.5px] text-[#6b8097] mt-0.25">{step.who || "Applicant"}</div>
                </div>
                <ChevronRight className="text-[#1c2b3a] opacity-30 shrink-0" size={14} strokeWidth={3} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
