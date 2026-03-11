import React, { useState, useEffect } from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import { ChevronDown, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { RoadmapData, RoadmapStage, RoadmapStep } from "./types";

interface ProgressTreeProps {
  roadmapData: RoadmapData;
  state: WizardState;
  onSelectStep: (stageIdx: number, stepIdx: number) => void;
}

export function ProgressTree({ roadmapData, state, onSelectStep }: ProgressTreeProps) {
  const { t, language } = useLanguage();
  const isUrdu = language === "ur";
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>(
    {},
  );

  // Sync expanded state with active stage
  useEffect(() => {
    setExpandedStages((prev) => ({
      ...prev,
      [state.currentStage]: true,
    }));
  }, [state.currentStage]);

  const toggleStage = (sIdx: number) => {
    setExpandedStages((prev) => ({
      ...prev,
      [sIdx]: !prev[sIdx],
    }));
  };

  return (
    <div id="sidebar-stages" className="space-y-3">
      <div className="px-2 mb-6">
        <h3 className="text-[13px] font-black uppercase tracking-[0.1em] text-slate-800 mb-6 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-primary rounded-full" />
        {t("visaJourney.progressTree.journeyMap")}
      </h3>
        <p className="text-xs text-slate-500 font-medium font-['Plus_Jakarta_Sans',sans-serif]">
          {t("visaJourney.progressTree.track")}
        </p>
      </div>

      {roadmapData.stages.map((stage: RoadmapStage, sIdx: number) => {
        const isActiveStage = state.currentStage === sIdx;
        const isExpanded = expandedStages[sIdx];
        const completedInStage = stage.steps.filter((s: RoadmapStep) =>
          state.completedSteps.has(s.id),
        ).length;
        const stageProgress = Math.round(
          (completedInStage / stage.steps.length) * 100,
        );

        // Get stage name from JSON data
        const stageNameDisplay = language === "ur" && stage.nameUr ? stage.nameUr : stage.name;

        return (
          <div key={stage.id} className="group/stage">
            <div
              className={`p-3.5 rounded-xl cursor-pointer transition-all flex flex-col gap-2 relative border mb-1 ${
                isActiveStage
                  ? "bg-white border-primary/20 shadow-sm shadow-primary/5 ring-1 ring-primary/5"
                  : "bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
              }`}
              onClick={() => {
                toggleStage(sIdx);
                if (!isActiveStage) onSelectStep(sIdx, 0);
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${isActiveStage ? "text-primary" : "text-slate-400"}`}
                >
                  {t("visaJourney.progressTree.stage", { id: stage.id })}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${isActiveStage ? "text-primary" : "text-slate-300"}`}
                />
              </div>

              <h4
                className={`text-[13px] font-bold leading-tight pr-4 ${isActiveStage ? "text-slate-900" : "text-slate-600 group-hover/stage:text-slate-900"}`}
              >
                {stageNameDisplay}
              </h4>

              <div className="w-full bg-slate-100/80 rounded-full h-1 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${isActiveStage ? "bg-primary" : "bg-slate-300"}`}
                  style={{ width: `${stageProgress}%` }}
                ></div>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-1 mb-4 ml-3.5 border-l-2 border-slate-100 pl-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {stage.steps.map((step: RoadmapStep, stIdx: number) => {
                  const isCurrentStep =
                    state.currentStep === stIdx && isActiveStage;
                  const isStepCompleted = state.completedSteps.has(step.id);
                  const stepNameDisplay = isUrdu 
                    ? (step.nameUr || step.titleUr || step.name || step.title) 
                    : (step.name || step.title);

                  return (
                    <button
                      key={step.id}
                      onClick={() => onSelectStep(sIdx, stIdx)}
                      className={`w-full text-left py-2.5 px-3 rounded-lg transition-all flex items-center justify-between gap-3 group/step ${
                        isCurrentStep
                          ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                          : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isCurrentStep && (
                          <PlayCircle className="w-3.5 h-3.5 shrink-0 text-primary-light animate-pulse" />
                        )}
                        <span className="text-[12px] truncate leading-tight">
                          {stepNameDisplay}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {isStepCompleted ? (
                          <CheckCircle2
                            className={`w-4 h-4 ${isCurrentStep ? "text-emerald-400" : "text-emerald-500"}`}
                          />
                        ) : (
                          <Circle
                            className={`w-3.5 h-3.5 ${isCurrentStep ? "text-slate-600" : "text-slate-300"}`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
