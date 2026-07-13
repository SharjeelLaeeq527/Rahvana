import React from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { RoadmapStepV3 } from "./types";

interface StepCompletionFooterProps {
  currentStep: RoadmapStepV3;
  isCompleted: boolean;
  incompletePrerequisite: RoadmapStepV3 | null;
  onToggleComplete: () => void;
}

export const StepCompletionFooter: React.FC<StepCompletionFooterProps> = ({
  currentStep,
  isCompleted,
  incompletePrerequisite,
  onToggleComplete,
}) => {
  // Only render for specific step types, just like StepView did
  const type = currentStep.step_type;
  if (type !== "docs" && type !== "tool" && type !== "action" && type !== "filing") {
    return null;
  }

  return (
    <div className="mt-8 pb-12 w-full max-w-[680px] mx-auto px-4">
      <button
        disabled={!!incompletePrerequisite && !isCompleted}
        onClick={onToggleComplete}
        className={`w-full p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group ${
          isCompleted
            ? "bg-[#e8f5ef] text-[#15744f] hover:bg-[#d0efe1]"
            : incompletePrerequisite
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed grayscale"
              : "bg-primary text-white hover:bg-primary/90 shadow-[0_4px_20px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0"
        }`}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 size={18} />
            <span>Completed — Well Done!</span>
          </>
        ) : incompletePrerequisite ? (
          <>
            <Lock size={16} strokeWidth={2.5} />
            <span>Finish "{incompletePrerequisite.step_name.slice(0, 20)}..." first</span>
          </>
        ) : (
          <span>Mark Step as Done</span>
        )}
      </button>
    </div>
  );
};
