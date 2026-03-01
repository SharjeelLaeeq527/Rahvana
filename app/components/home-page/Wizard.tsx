import React, { useState } from "react";
import { WizardState } from "../../(main)/dashboard/hooks/useWizard";
import { roadmapData } from "../../../data/roadmap";
import { useWizard } from "../../(main)/dashboard/hooks/useWizard";
import { ProgressTree } from "@/app/(tools)/(visa)/visa-category/ir-category/ir1-journey/components/ProgressTree";
import { StepDetail } from "@/app/(tools)/(visa)/visa-category/ir-category/ir1-journey/components/StepDetail";
import { DocumentVault } from "@/app/(tools)/(visa)/visa-category/ir-category/ir1-journey/components/DocumentVault";

type WizardActions = ReturnType<typeof useWizard>["actions"];

interface WizardProps {
  state: WizardState;
  actions: WizardActions;
  isLoaded: boolean;
}

export function Wizard({ state, actions, isLoaded }: WizardProps) {
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="p-20 text-center text-slate-400">
        Loading your journey...
      </div>
    );
  }

  const currentStage = roadmapData.stages[state.currentStage];
  const currentStep = currentStage.steps[state.currentStep || 0];
  const totalSteps = roadmapData.stages.reduce(
    (acc, s) => acc + s.steps.length,
    0,
  );
  const completedTotal = state.completedSteps.size;
  const progressPercent = Math.round((completedTotal / totalSteps) * 100);

  const handleNext = () => {
    const nextStepIdx = (state.currentStep || 0) + 1;
    if (nextStepIdx < currentStage.steps.length) {
      actions.setCurrentStep(nextStepIdx);
    } else if (state.currentStage + 1 < roadmapData.stages.length) {
      actions.setStage(state.currentStage + 1);
      actions.setCurrentStep(0);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    const prevStepIdx = (state.currentStep || 0) - 1;
    if (prevStepIdx >= 0) {
      actions.setCurrentStep(prevStepIdx);
    } else if (state.currentStage - 1 >= 0) {
      const prevStage = roadmapData.stages[state.currentStage - 1];
      actions.setStage(state.currentStage - 1);
      actions.setCurrentStep(prevStage.steps.length - 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Wizard Header (Mobile specific or General) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Overall Journey Progress
            </span>
            <span className="text-sm font-bold text-[#0d9488]">
              {progressPercent}% ({completedTotal}/{totalSteps} steps)
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0d9488] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <button
          onClick={() => setIsVaultOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:border-[#0d9488] hover:bg-[#ebf5f4] transition-all"
        >
          📁 Document Vault
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[600px] mb-12">
        {/* Sidebar */}
        <aside className="w-full md:w-[320px] bg-slate-50 border-r border-slate-200 p-4 md:p-6 overflow-y-auto max-h-[800px]">
          <ProgressTree
            state={state}
            onSelectStep={(stageIdx, stepIdx) => {
              actions.setStage(stageIdx);
              actions.setCurrentStep(stepIdx);
            }}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 bg-white overflow-y-auto">
          <StepDetail
            step={currentStep}
            stage={currentStage}
            state={state}
            onToggleComplete={actions.toggleComplete}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={state.currentStage === 0 && state.currentStep === 0}
            isLast={
              state.currentStage === roadmapData.stages.length - 1 &&
              state.currentStep === currentStage.steps.length - 1
            }
          />
        </main>
      </div>

      <DocumentVault
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        state={state}
        onToggleDocument={actions.toggleDocument}
        onUpdateNote={actions.updateNote}
        onUpload={actions.uploadDocument}
        onClearUpload={actions.clearDocument}
      />
    </div>
  );
}
