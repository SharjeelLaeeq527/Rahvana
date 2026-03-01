import React from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { roadmapData } from "@/data/roadmap";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Info,
  ClipboardList,
} from "lucide-react";

type RoadmapStage = (typeof roadmapData.stages)[number];
type RoadmapStep = RoadmapStage["steps"][number];

interface StepDetailProps {
  step: RoadmapStep;
  stage: RoadmapStage;
  state: WizardState;
  onToggleComplete: (id: string, e: React.MouseEvent) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function StepDetail({
  step,
  stage,
  state,
  onToggleComplete,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: StepDetailProps) {
  const isCompleted = state.completedSteps.has(step.id);

  return (
    <div
      id="step-content"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 text-slate-500 rounded-full text-[12px] font-bold uppercase tracking-wider mb-4 border border-slate-200/50">
          <Info className="w-3.5 h-3.5" />
          Stage {stage.id} • Step {step.id}
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {step.name}
          </h2>
          <button
            onClick={(e) => onToggleComplete(step.id, e)}
            className={`w-full md:w-auto flex items-center justify-center space-x-2 md:justify-start gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all whitespace-nowrap active:scale-95 shadow-sm ${
              isCompleted
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Completed
              </>
            ) : (
              <>
                <Circle className="w-5 h-5" />
                Mark Complete
              </>
            )}
          </button>
        </div>

        <div className="text-slate-600 text-[15px] md:text-[17px] leading-relaxed pb-6 md:pb-8 mb-6 md:mb-8 border-b border-slate-100 max-w-3xl">
          {step.notes ||
            `This step involves preparing and submitting the necessary ${step.name} documents.`}
        </div>

        {/* Professional Badges */}
        <div className="flex flex-wrap gap-3 mb-10">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">
            <Users className="w-4 h-4 text-slate-400" /> Both
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold border border-indigo-100">
            <MapPin className="w-4 h-4 text-indigo-400" /> Self-assessment
          </div>
        </div>

        {/* Actions Required */}
        <div className="bg-slate-50/50 rounded-2xl p-5 md:p-8 mb-8 md:mb-10 border border-slate-100">
          <h4 className="flex items-center gap-2 text-[14px] font-black mb-6 text-slate-900 uppercase tracking-widest">
            <ClipboardList className="w-4 h-4 text-primary" />
            Actions Required
          </h4>
          <ul className="space-y-4">
            {step.actions?.map((action: string, idx: number) => (
              <li
                key={`action-${idx}`}
                className="flex gap-4 items-start text-[16px] text-slate-700 font-medium group"
              >
                <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                </div>
                <div className="leading-snug">{action}</div>
              </li>
            ))}
            {step.documents?.map((doc: string, idx: number) => (
              <li
                key={`doc-${idx}`}
                className="flex gap-4 items-start text-[16px] text-slate-700 font-medium group"
              >
                <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                </div>
                <div className="leading-snug">
                  {doc}{" "}
                  <span className="text-slate-400 text-sm font-normal ml-2">
                    (Document Required)
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Success Condition */}
        {step.output && (
          <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100 mb-10">
            <h4 className="text-[13px] font-black mb-3 text-emerald-700 uppercase tracking-widest">
              Success Condition
            </h4>
            <p className="text-emerald-900 text-[16px] font-bold leading-relaxed">
              {step.output}
            </p>
          </div>
        )}
      </div>

      {/* Modern Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${
            isFirst
              ? "text-slate-300 border-slate-100 cursor-not-allowed"
              : "text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Previous Step
        </button>

        {!isLast && (
          <button
            onClick={onNext}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-extrabold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 whitespace-nowrap"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
