import { RoadmapData, RoadmapStep } from "./types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

/**
 * Returns all steps for a given stage index that are applicable based on the filing method.
 */
export function getActiveStepsForStage(data: RoadmapData, stageIdx: number, filingMethod: string | null): RoadmapStep[] {
  const stage = data.stages[stageIdx];
  if (!stage) return [];
  
  const method = filingMethod || 'online'; // Default to online if not set
  return stage.steps.filter(step => {
    // If step branch is 'both', it's always included.
    // If step branch matches current method, it's included.
    // In our JSON, branch is optional or 'both' | 'online' | 'paper'
    if (!step.branch || step.branch === 'both') return true;
    return step.branch === method;
  });
}

/**
 * Returns all active steps across all stages.
 */
export function getAllActiveSteps(data: RoadmapData, filingMethod: string | null): RoadmapStep[] {
  return data.stages.reduce((acc, _, idx) => {
    return acc.concat(getActiveStepsForStage(data, idx, filingMethod));
  }, [] as RoadmapStep[]);
}

/**
 * Finds the first uncompleted active step across the entire journey.
 */
export function getNextBestAction(data: RoadmapData, state: WizardState): { step: RoadmapStep; stageIdx: number; stepIdxInStage: number } | null {
  const allActive = getAllActiveSteps(data, state.metadata.filingMethod);
  const nextStep = allActive.find(s => !state.completedSteps.has(s.id));
  
  if (!nextStep) return null;
  
  // Find where this step lives to help navigation
  for (let sIdx = 0; sIdx < data.stages.length; sIdx++) {
    const stepInStageIdx = data.stages[sIdx].steps.findIndex(s => s.id === nextStep.id);
    if (stepInStageIdx !== -1) {
      return { step: nextStep, stageIdx: sIdx, stepIdxInStage: stepInStageIdx };
    }
  }
  
  return null;
}

/**
 * Calculates progress for a specific stage.
 */
export function getStageProgress(data: RoadmapData, stageIdx: number, state: WizardState) {
  const activeSteps = getActiveStepsForStage(data, stageIdx, state.metadata.filingMethod);
  if (activeSteps.length === 0) return { done: 0, total: 0, pct: 0 };
  
  const done = activeSteps.filter(s => state.completedSteps.has(s.id)).length;
  return {
    done,
    total: activeSteps.length,
    pct: Math.round((done / activeSteps.length) * 100)
  };
}

/**
 * Checks if a stage should be unlocked (all steps in previous stage completed).
 */
export function isStageUnlocked(data: RoadmapData, stageIdx: number, state: WizardState): boolean {
  if (stageIdx === 0) return true; // First chapter is always unlocked
  
  const prevStageProgress = getStageProgress(data, stageIdx - 1, state);
  return prevStageProgress.done === prevStageProgress.total && prevStageProgress.total > 0;
}
