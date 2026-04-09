import { RoadmapData, RoadmapStep, RoadmapChapter } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

/**
 * Get the display number for a step, considering display_number_override.
 */
export function getDisplayStepNumber(step: RoadmapStep): number {
  const stepAny = step as any;
  // If display_number_override exists, use it (for paper path steps showing as 4-6 instead of 11-13)
  if (stepAny.display_number_override !== undefined) {
    return stepAny.display_number_override;
  }
  // Otherwise use the step_number
  return stepAny.step_number || 1;
}

/**
 * Returns all steps for a given stage/chapter index that are applicable based on the filing method.
 * Filters by visible_when conditions.
 */
export function getActiveStepsForStage(data: RoadmapData, index: number, filingMethod: string | null): RoadmapStep[] {
  const chapters = data.chapters || (data as any).stages;
  const chapter = chapters?.[index] as RoadmapChapter;
  if (!chapter) return [];
  
  const method = filingMethod || 'online'; // Default to online if not set
  return chapter.steps.filter((step: RoadmapStep) => {
    const stepAny = step as any;
    
    // Check visible_when conditions (new priority system)
    const visibleWhen = stepAny.visible_when;
    if (visibleWhen && Object.keys(visibleWhen).length > 0) {
      // If filingMethod condition exists, check it
      if (visibleWhen.filingMethod) {
        return visibleWhen.filingMethod === method;
      }
    }
    
    // Fallback to legacy 'branch' field
    const branch = stepAny.branch;
    if (!branch || branch === 'both') return true;
    return branch === method;
  });
}

/**
 * Returns all active steps across all chapters.
 */
export function getAllActiveSteps(data: RoadmapData, filingMethod: string | null): RoadmapStep[] {
  const chapters = data.chapters || (data as any).stages;
  if (!chapters) return [];
  return chapters.reduce((acc: RoadmapStep[], _: any, idx: number) => {
    return acc.concat(getActiveStepsForStage(data, idx, filingMethod));
  }, [] as RoadmapStep[]);
}

/**
 * Finds the first uncompleted active step across the entire journey.
 */
export function getNextBestAction(data: RoadmapData, state: WizardState): { step: RoadmapStep; chapterIdx: number; stepIdxInChapter: number } | null {
  const filingMethod = state.metadata?.filingMethod || state.filingType;
  const allActive = getAllActiveSteps(data, filingMethod);
  
  const nextStep = allActive.find(s => {
    const sId = s.step_key || (s as any).id;
    return !state.completedSteps.has(sId);
  });
  
  if (!nextStep) return null;
  
  const chapters = data.chapters || (data as any).stages;
  for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
    const stepInChapterIdx = chapters[cIdx].steps.findIndex((s: any) => 
      (s.step_key || s.id) === (nextStep.step_key || (nextStep as any).id)
    );
    if (stepInChapterIdx !== -1) {
      return { step: nextStep, chapterIdx: cIdx, stepIdxInChapter: stepInChapterIdx };
    }
  }
  
  return null;
}

/**
 * Calculates progress for a specific chapter.
 */
export function getStageProgress(data: RoadmapData, chapterIdx: number, state: WizardState) {
  const filingMethod = state.metadata?.filingMethod || state.filingType;
  const activeSteps = getActiveStepsForStage(data, chapterIdx, filingMethod);
  if (activeSteps.length === 0) return { done: 0, total: 0, pct: 0 };
  
  const done = activeSteps.filter(s => {
    const sId = s.step_key || (s as any).id;
    return state.completedSteps.has(sId);
  }).length;
  
  return {
    done,
    total: activeSteps.length,
    pct: Math.round((done / activeSteps.length) * 100)
  };
}

/**
 * Checks if a chapter should be unlocked (all steps in previous chapter completed).
 */
export function isStageUnlocked(data: RoadmapData, chapterIdx: number, state: WizardState): boolean {
  if (chapterIdx === 0) return true; // First chapter is always unlocked
  
  const prevChapterProgress = getStageProgress(data, chapterIdx - 1, state);
  return prevChapterProgress.done === prevChapterProgress.total && prevChapterProgress.total > 0;
}
