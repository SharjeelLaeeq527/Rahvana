import React from "react";
import { WizardState } from "../../(main)/dashboard/hooks/useWizard";
import { roadmapData } from "../../../data/roadmap";

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
    <div id="step-content">
      <div className="mb-8">
        <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[13px] font-semibold mb-3">
          Stage {stage.id} • Step {step.id}
        </div>
        <div className="flex justify-between items-center gap-4 mb-4">
          <h2 className="text-3xl font-bold text-slate-900">{step.name}</h2>
          <button
            onClick={(e) => onToggleComplete(step.id, e)}
            className={`px-5 py-3 rounded-lg font-bold text-base transition-all whitespace-nowrap ${
              isCompleted
                ? "bg-slate-100 text-slate-500 border border-slate-200"
                : "bg-primary text-white hover:bg-primary/90 shadow-sm active:scale-95"
            }`}
          >
            {isCompleted ? "✓ Completed" : "Mark Complete"}
          </button>
        </div>
        <div className="text-slate-500 text-base leading-relaxed border-b border-slate-200 pb-6 mb-8">
          {step.notes ||
            `This step involves preparing and submitting the necessary ${step.name} documents.`}
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold">
            <span className="text-base">👤</span> Both
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
            <span className="text-base">📍</span> Self-assessment
          </div>
        </div>

        {/* Checklist / Actions */}
        <div className="mb-10">
          <h4 className="text-[13px] font-bold mb-4 text-slate-500 uppercase tracking-widest">
            Actions Required:
          </h4>
          <ul className="space-y-3 list-none">
            {step.actions?.map((action: string, idx: number) => (
              <li
                key={`action-${idx}`}
                className="flex gap-3 items-start text-[16px] text-slate-700 font-medium"
              >
                <span className="text-slate-400 mt-0.5">•</span>
                <div>{action}</div>
              </li>
            ))}
            {step.documents?.map((doc: string, idx: number) => (
              <li
                key={`doc-${idx}`}
                className="flex gap-3 items-start text-[16px] text-slate-700 font-medium"
              >
                <span className="text-slate-400 mt-0.5">•</span>
                <div>{doc} (Document)</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Succession Condition */}
        {step.output && (
          <div className="mb-10">
            <h4 className="text-[13px] font-bold mb-4 text-slate-500 uppercase tracking-wider">
              Success Condition:
            </h4>
            <p className="text-slate-800 text-[16px] font-medium">
              {step.output}
            </p>
          </div>
        )}

        {/* Step Notes Tooltip replaced highlighted box */}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`px-6 py-3 rounded-lg font-bold transition-all border border-slate-200 ${
            isFirst
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          ← Previous Step
        </button>
        <div className="flex gap-4">
          <button
            onClick={(e) => onToggleComplete(step.id, e)}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              isCompleted
                ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                : "bg-[#0d9488] text-white hover:bg-[#0f766e] shadow-md hover:-translate-y-px"
            }`}
          >
            {isCompleted ? "✓ Completed" : "Mark Step Complete"}
          </button>
          {!isLast && (
            <button
              onClick={onNext}
              className="px-6 py-3 bg-[#334155] text-white rounded-lg font-bold hover:bg-[#1e293b] transition-all shadow-md hover:-translate-y-px"
            >
              Next Step →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
