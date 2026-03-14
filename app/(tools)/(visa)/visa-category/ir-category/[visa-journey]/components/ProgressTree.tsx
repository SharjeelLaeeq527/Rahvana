import React, { useState, useEffect } from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  ArrowRightCircle,
  ExternalLink,
} from "lucide-react";
import { RoadmapData, RoadmapStage, RoadmapStep, RoadmapSource } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressTreeProps {
  roadmapData: RoadmapData;
  state: WizardState;
  onSelectStep: (stageIdx: number, stepIdx: number) => void;
  onToggleComplete?: (stepId: string, e?: React.MouseEvent) => void;
  selectedScenario?: string; // Optional - only for journeys with scenario-specific steps
  hasScenarios?: boolean;
}

export function ProgressTree({
  roadmapData,
  state,
  onSelectStep,
  onToggleComplete,
  selectedScenario,
  hasScenarios = false,
}: ProgressTreeProps) {
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
    <div className="flex flex-col h-full max-h-inherit overflow-hidden">
      <div
        id="sidebar-stages"
        className="flex-1 overflow-y-auto space-y-3 p-4 md:p-6 pb-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      >
        <div className="px-2 mb-6">
          <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            {t("visaJourney.progressTree.journeyMap")}
          </h3>
          <p className="text-xs text-slate-500 font-medium font-['Plus_Jakarta_Sans',sans-serif]">
            {t("visaJourney.progressTree.track")}
          </p>
        </div>

        {roadmapData.stages
          .filter(
            (stage: RoadmapStage) =>
              !hasScenarios ||
              !stage.scenarioSpecific ||
              stage.scenarioSpecific === selectedScenario,
          )
          .map((stage: RoadmapStage, sIdx: number) => {
            // Find the actual index in the original roadmapData.stages for state.currentStage comparison
            const originalStageIdx = roadmapData.stages.findIndex(
              (s) => s.id === stage.id,
            );
            const isActiveStage = state.currentStage === originalStageIdx;
            const isExpanded = expandedStages[originalStageIdx];

            const visibleSteps = stage.steps.filter(
              (s: RoadmapStep) =>
                !hasScenarios ||
                !s.scenarioSpecific ||
                s.scenarioSpecific === selectedScenario,
            );
            const completedInStage = visibleSteps.filter((s: RoadmapStep) =>
              state.completedSteps.has(s.id),
            ).length;
            const stageProgress =
              visibleSteps.length > 0
                ? Math.round((completedInStage / visibleSteps.length) * 100)
                : 0;

            const stageNameDisplay =
              language === "ur" && stage.nameUr ? stage.nameUr : stage.name;

            return (
              <div key={stage.id} className="group/stage">
                <div
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex flex-col gap-2 relative border mb-1 ${
                    isActiveStage
                      ? "bg-white border-primary/20 shadow-sm shadow-primary/5 ring-1 ring-primary/5"
                      : "bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
                  }`}
                  onClick={() => {
                    toggleStage(originalStageIdx);
                    if (!isActiveStage) onSelectStep(originalStageIdx, 0);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${isActiveStage ? "text-primary" : "text-slate-400"}`}
                    >
                      {t("visaJourney.progressTree.stage")} {sIdx + 1}{" "}
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
                    {visibleSteps.map((step: RoadmapStep) => {
                      const actualStepIdx = stage.steps.findIndex(
                        (s) => s.id === step.id,
                      );
                      const isCurrentStep =
                        state.currentStep === actualStepIdx && isActiveStage;
                      const isStepCompleted = state.completedSteps.has(step.id);
                      const stepNameDisplay =
                        isUrdu && step.nameUr ? step.nameUr : step.name;

                      return (
                        <div
                          key={step.id}
                          onClick={() =>
                            onSelectStep(originalStageIdx, actualStepIdx)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectStep(sIdx, actualStepIdx);
                            }
                          }}
                          className={`w-full text-left py-2.5 px-3 rounded-lg transition-all flex items-center justify-between gap-3 group/step cursor-pointer ${
                            isCurrentStep
                              ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                              : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
                          }`}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isCurrentStep && (
                              <ArrowRightCircle className="w-3.5 h-3.5 shrink-0 text-primary-light" />
                            )}

                            <span className="text-[12px] truncate leading-tight">
                              {stepNameDisplay}
                            </span>
                          </div>

                          {(
                            isUrdu && step.outputUr
                              ? step.outputUr
                              : step.output || step.success
                          ) ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="shrink-0 p-1 hover:bg-slate-200/50 rounded-full transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleComplete?.(step.id, e);
                                    }}
                                  >
                                    {isStepCompleted ? (
                                      <CheckCircle2
                                        className={`w-4 h-4 ${isCurrentStep ? "text-emerald-400" : "text-emerald-500"}`}
                                      />
                                    ) : (
                                      <Circle
                                        className={`w-3.5 h-3.5 ${isCurrentStep ? "text-slate-600" : "text-slate-300"}`}
                                      />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-[250px] p-3 bg-white border-teal-100 shadow-xl rounded-xl z-50"
                                >
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">
                                      {t("visaJourney.successTitle")}
                                    </span>
                                    <div
                                      className="text-teal-900 text-[12px] font-bold leading-tight"
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          (isUrdu && step.outputUr
                                            ? step.outputUr
                                            : step.output || step.success) ||
                                          "",
                                      }}
                                    />
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <button
                              type="button"
                              className="shrink-0 p-1 hover:bg-slate-200/50 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete?.(step.id, e);
                              }}
                            >
                              {isStepCompleted ? (
                                <CheckCircle2
                                  className={`w-4 h-4 ${isCurrentStep ? "text-emerald-400" : "text-emerald-500"}`}
                                />
                              ) : (
                                <Circle
                                  className={`w-3.5 h-3.5 ${isCurrentStep ? "text-slate-600" : "text-slate-300"}`}
                                />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Official Sources - Fixed at bottom */}
      {roadmapData.stages[state.currentStage]?.sources &&
        roadmapData.stages[state.currentStage].sources.length > 0 && (
          <div className="mt-auto p-4 md:p-6 pt-4 border-t border-slate-200 bg-slate-50/80 backdrop-blur-sm">
            <h4 className="text-[11px] font-black mb-4 text-slate-500 uppercase tracking-widest">
              Official Sources
            </h4>
            <div className="flex flex-col gap-2">
              {roadmapData.stages[state.currentStage].sources.map(
                (source: RoadmapSource, idx: number) => (
                  <a
                    key={`source-${idx}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-xs group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="truncate">
                      {isUrdu && source.labelUr ? source.labelUr : source.label}
                    </span>
                  </a>
                ),
              )}
            </div>
          </div>
        )}
    </div>
  );
}
