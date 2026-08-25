import React, { useState, useEffect } from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import { ChevronDown, CheckCircle2, Circle, ArrowRightCircle, ExternalLink } from "lucide-react";
import { RoadmapData, RoadmapStage, RoadmapStep, RoadmapSource } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SafeHtml } from "@/app/components/shared/SafeHTML";

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
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});

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
    <div className="max-h-inherit flex h-full flex-col overflow-hidden">
      <div
        id="sidebar-stages"
        className="flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent space-y-3 overflow-y-auto p-4 pb-0 md:p-6"
      >
        <div className="mb-6 px-2">
          <h3 className="mb-6 flex items-center gap-2 text-[13px] font-black tracking-widest text-slate-800 uppercase">
            <div className="bg-primary h-4 w-1.5 rounded-full" />
            {t("visaJourney.progressTree.journeyMap")}
          </h3>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-medium text-slate-500">
            {t("visaJourney.progressTree.track")}
          </p>
        </div>

        {(roadmapData.chapters || (roadmapData as any).stages || [])
          .filter(
            (stage: any) =>
              !hasScenarios ||
              !stage.scenarioSpecific ||
              stage.scenarioSpecific === selectedScenario
          )
          .map((stage: any, sIdx: number) => {
            // Find the actual index in the original roadmapData.stages for state.currentStage comparison
            const originalStageIdx = (
              roadmapData.chapters || (roadmapData as any).stages
            ).findIndex((s: any) => (s.chapter_key || s.id) === (stage.chapter_key || stage.id));
            const isActiveStage = state.currentStage === originalStageIdx;
            const isExpanded = expandedStages[originalStageIdx];

            const visibleSteps = stage.steps.filter(
              (s: RoadmapStep) =>
                !hasScenarios || !s.scenarioSpecific || s.scenarioSpecific === selectedScenario
            );
            const completedInStage = visibleSteps.filter((s: RoadmapStep) =>
              state.completedSteps.has(s.step_key || (s as any).id)
            ).length;
            const stageProgress =
              visibleSteps.length > 0
                ? Math.round((completedInStage / visibleSteps.length) * 100)
                : 0;

            const stageNameDisplay =
              language === "ur" && (stage.chapter_name_ur || stage.nameUr)
                ? stage.chapter_name_ur || stage.nameUr
                : stage.chapter_name || stage.name;

            return (
              <div key={stage.chapter_key || stage.id} className="group/stage">
                <div
                  className={`relative mb-1 flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 transition-all ${
                    isActiveStage
                      ? "border-primary/20 shadow-primary/5 ring-primary/5 bg-white shadow-sm ring-1"
                      : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white"
                  }`}
                  onClick={() => {
                    toggleStage(originalStageIdx);
                    if (!isActiveStage) onSelectStep(originalStageIdx, 0);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black tracking-widest uppercase ${isActiveStage ? "text-primary" : "text-slate-400"}`}
                    >
                      {t("visaJourney.progressTree.stage")} {sIdx + 1}{" "}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${isActiveStage ? "text-primary" : "text-slate-300"}`}
                    />
                  </div>

                  <h4
                    className={`pr-4 text-[13px] leading-tight font-bold ${isActiveStage ? "text-slate-900" : "text-slate-600 group-hover/stage:text-slate-900"}`}
                  >
                    {stageNameDisplay}
                  </h4>

                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100/80">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${isActiveStage ? "bg-primary" : "bg-slate-300"}`}
                      style={{ width: `${stageProgress}%` }}
                    ></div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="animate-in fade-in slide-in-from-top-1 mt-1 mb-4 ml-3.5 space-y-1.5 border-l-2 border-slate-100 pl-3 duration-200">
                    {visibleSteps.map((step: RoadmapStep) => {
                      const sId = step.step_key || (step as any).id;
                      const actualStepIdx = stage.steps.findIndex(
                        (s: any) => (s.step_key || s.id) === sId
                      );
                      const isCurrentStep = state.currentStep === actualStepIdx && isActiveStage;
                      const isStepCompleted = state.completedSteps.has(sId);
                      const stepNameDisplay = isUrdu && step.nameUr ? step.nameUr : step.name;

                      return (
                        <div
                          key={sId}
                          onClick={() => onSelectStep(originalStageIdx, actualStepIdx)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectStep(sIdx, actualStepIdx);
                            }
                          }}
                          className={`group/step flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                            isCurrentStep
                              ? "bg-primary shadow-primary/20 font-bold text-white shadow-md"
                              : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
                          }`}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {isCurrentStep && (
                              <ArrowRightCircle className="text-primary-light h-3.5 w-3.5 shrink-0" />
                            )}

                            <span className="truncate text-[12px] leading-tight">
                              {stepNameDisplay}
                            </span>
                          </div>

                          {(
                            isUrdu && step.outputUr ? step.outputUr : step.output || step.success
                          ) ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-full p-1 transition-colors hover:bg-slate-200/50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleComplete?.(step.id, e);
                                    }}
                                  >
                                    {isStepCompleted ? (
                                      <CheckCircle2
                                        className={`h-4 w-4 ${isCurrentStep ? "text-emerald-400" : "text-emerald-500"}`}
                                      />
                                    ) : (
                                      <Circle
                                        className={`h-3.5 w-3.5 ${isCurrentStep ? "text-slate-600" : "text-slate-300"}`}
                                      />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="z-50 max-w-[250px] rounded-xl border-teal-100 bg-white p-3 shadow-xl"
                                >
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black tracking-widest text-teal-700 uppercase">
                                      {t("visaJourney.successTitle")}
                                    </span>
                                    <SafeHtml
                                      className="text-[12px] leading-tight font-bold text-teal-900"
                                      html={
                                        (isUrdu && step.outputUr
                                          ? step.outputUr
                                          : step.output || step.success) || ""
                                      }
                                    />
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <button
                              type="button"
                              className="shrink-0 rounded-full p-1 transition-colors hover:bg-slate-200/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete?.(step.id, e);
                              }}
                            >
                              {isStepCompleted ? (
                                <CheckCircle2
                                  className={`h-4 w-4 ${isCurrentStep ? "text-emerald-400" : "text-emerald-500"}`}
                                />
                              ) : (
                                <Circle
                                  className={`h-3.5 w-3.5 ${isCurrentStep ? "text-slate-600" : "text-slate-300"}`}
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
      {(() => {
        const chapters = roadmapData.chapters || (roadmapData as any).stages || [];
        const currentChapter = chapters[state.currentStage];
        const currentStageSources = currentChapter?.sources;
        if (!currentStageSources || currentStageSources.length === 0) return null;

        return (
          <div className="mt-auto border-t border-slate-200 bg-slate-50/80 p-4 pt-4 backdrop-blur-sm md:p-6">
            <h4 className="mb-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">
              Official Sources
            </h4>
            <div className="flex flex-col gap-2">
              {currentStageSources.map((source: RoadmapSource, idx: number) => (
                <a
                  key={`source-${idx}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-xs transition-all hover:border-blue-200 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-blue-500" />
                  <span className="truncate">
                    {isUrdu && source.labelUr ? source.labelUr : source.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
