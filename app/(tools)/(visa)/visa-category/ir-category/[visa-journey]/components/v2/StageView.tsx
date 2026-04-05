"use client";

import React, { useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage, getStageProgress } from "./journeyHelpers";

interface StageViewProps {
  data: RoadmapData;
  stageIdx: number;
  state: WizardState;
  onBack: () => void;
  onSelectStep: (stageIdx: number, stepIdx: number) => void;
}

export function StageView({
  data,
  stageIdx,
  state,
  onBack,
  onSelectStep,
}: StageViewProps) {
  const stage = data.stages[stageIdx];
  const activeSteps = useMemo(
    () => getActiveStepsForStage(data, stageIdx, state.metadata.filingMethod),
    [data, stageIdx, state.metadata.filingMethod],
  );

  const prog = useMemo(
    () => getStageProgress(data, stageIdx, state),
    [data, stageIdx, state],
  );

  const isDone = prog.done === prog.total && prog.total > 0;
  const isStarted = prog.done > 0;

  const badgeCls = isDone
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isStarted
      ? "bg-primary/5 text-primary border-primary/20"
      : "bg-slate-50 text-slate-500 border-slate-200";

  const badgeText = isDone
    ? "✓ Complete"
    : isStarted
      ? `${prog.done} of ${prog.total} done`
      : "Not started";

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-20 scrollbar-hide bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] font-bold text-primary hover:translate-x-[-4px] transition-transform mb-6 group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
          Back to Dashboard
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.12em] mb-4 ${badgeCls}`}
          >
            {badgeText}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {stage.name}
          </h1>
          <p className="text-slate-500 text-[14px] md:text-[15px] leading-relaxed mb-8 max-w-2xl font-medium">
            {stage.description}
          </p>

          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(13,115,119,0.3)]"
                style={{ width: `${prog.pct}%` }}
              />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[18px] font-black text-slate-900 leading-none">
                {prog.pct}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Total Progress
              </span>
            </div>
          </div>
        </div>

        {/* Branch Warning (Chapter 1 specific) */}
        {stageIdx === 0 && !state.metadata.filingMethod && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div className="text-[14px] leading-relaxed text-slate-800">
              <strong className="block mb-1 text-amber-900 text-[13px] uppercase tracking-wide">
                Action Required: Filing Method
              </strong>
              Filing method not yet chosen. Complete Step 3 to select Online or
              Paper filing. Steps 4 onward differ by branch.
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Step-by-Step Roadmap
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              {activeSteps.length} Steps Total
            </span>
          </div>

          {activeSteps.map((step, idx) => {
            const isCompleted = state.completedSteps.has(step.id);
            const isNext =
              !isCompleted &&
              activeSteps
                .slice(0, idx)
                .every((s) => state.completedSteps.has(s.id));
            const fullStepIdx = stage.steps.findIndex((s) => s.id === step.id);

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(stageIdx, fullStepIdx)}
                className={`group flex items-center gap-5 p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 delay-${idx * 50}
                  ${isCompleted ? "border-emerald-100 bg-emerald-50/20" : isNext ? "border-primary shadow-xl shadow-primary/5 ring-4 ring-primary/5 scale-[1.01]" : "border-slate-100 hover:border-slate-200 hover:shadow-md active:scale-[0.99]"}`}
              >
                {/* Visual indicator for completed step */}
                {isCompleted && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full flex items-center justify-center pointer-events-none">
                    <CheckCircle2
                      size={24}
                      className="text-emerald-500/20 translate-x-2 -translate-y-2"
                    />
                  </div>
                )}

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[14px] shrink-0 transition-all duration-500
                  ${isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rotate-3" : isNext ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[16px] font-bold truncate transition-colors ${isCompleted ? "text-slate-400" : "text-slate-900 group-hover:text-primary"}`}
                  >
                    {step.name}
                  </div>
                  {step.description && (
                    <div className="text-[12px] text-slate-500 truncate font-medium mt-0.5">
                      {step.description}
                    </div>
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${isNext ? "text-primary translate-x-0" : "text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-2"}`}
                >
                  <ChevronRight size={22} strokeWidth={3} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
