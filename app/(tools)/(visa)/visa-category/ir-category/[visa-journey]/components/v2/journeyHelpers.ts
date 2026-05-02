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
 * Returns all steps for a given stage/chapter index that are applicable based on the filing method and state metadata.
 * Filters by visible_when conditions.
 */
export function getActiveStepsForStage(data: RoadmapData, index: number, metadata: any, filingMethodFallback?: string | null): RoadmapStep[] {
  const chapters = data.chapters || (data as any).stages;
  const chapter = chapters?.[index] as RoadmapChapter;
  if (!chapter) return [];
  
  const method = metadata?.filingMethod || filingMethodFallback || 'online'; // Default to online if not set
  // Filter steps by visibility and branch
  const filtered = chapter.steps.filter((step: RoadmapStep) => {
    const stepAny = step as any;
    // Check visible_when conditions (new priority system)
    const visibleWhen = stepAny.visible_when;
    if (visibleWhen && Object.keys(visibleWhen).length > 0) {
      let isVisible = true;
      for (const [key, value] of Object.entries(visibleWhen)) {
        if (key === 'filingMethod') {
          if (value !== method) isVisible = false;
        } else {
          const stateValue = metadata?.[key];
          if (Array.isArray(value)) {
            if (!value.includes(stateValue)) isVisible = false;
          } else {
            if (stateValue !== value) isVisible = false;
          }
        }
      }
      return isVisible;
    }
    // Fallback to legacy 'branch' field
    const branch = stepAny.branch;
    if (!branch || branch === 'both') return true;
    return branch === method;
  });

  // Sort by display_order, then step_number as fallback
  filtered.sort((a: any, b: any) => {
    const aOrder = a.display_order ?? a.step_number ?? 0;
    const bOrder = b.display_order ?? b.step_number ?? 0;
    return aOrder - bOrder;
  });
  return filtered;
}

/**
 * Returns all active steps across all chapters.
 */
export function getAllActiveSteps(data: RoadmapData, metadata: any, filingMethodFallback?: string | null): RoadmapStep[] {
  const chapters = data.chapters || (data as any).stages;
  if (!chapters) return [];
  return chapters.reduce((acc: RoadmapStep[], _: any, idx: number) => {
    return acc.concat(getActiveStepsForStage(data, idx, metadata, filingMethodFallback));
  }, [] as RoadmapStep[]);
}

/**
 * Finds the first uncompleted active step across the entire journey.
 */
export function getNextBestAction(data: RoadmapData, state: WizardState): { step: RoadmapStep; chapterIdx: number; stepIdxInChapter: number } | null {
  const allActive = getAllActiveSteps(data, state.metadata, state.filingType);
  
  const nextStep = allActive.find(s => {
    const sId = s.step_key || (s as any).id;
    return !state.completedSteps.has(sId);
  });
  
  if (!nextStep) return null;
  
  const chapters = data.chapters || (data as any).stages;
  for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
    const activeSteps = getActiveStepsForStage(data, cIdx, state.metadata, state.filingType);
    const stepInActiveIdx = activeSteps.findIndex((s: any) => 
      (s.step_key || s.id) === (nextStep.step_key || (nextStep as any).id)
    );
    if (stepInActiveIdx !== -1) {
      return { step: nextStep, chapterIdx: cIdx, stepIdxInChapter: stepInActiveIdx };
    }
  }
  
  return null;
}

/**
 * Calculates progress for a specific chapter.
 */
export function getStageProgress(data: RoadmapData, chapterIdx: number, state: WizardState) {
  const activeSteps = getActiveStepsForStage(data, chapterIdx, state.metadata, state.filingType);
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

/**
 * Calculates document review progress for a step.
 */
export function getDocumentReviewProgress(step: any, metadata: any) {
  const documentItems = step.document_items || [];
  
  // Tool-based doc steps (step 2.4, etc)
  let toolItems: any[] = [];
  if (step.tool_data?.doc_list?.groups) {
    toolItems = step.tool_data.doc_list.groups.flatMap((g: any) => g.items || []);
  } else if (step.tool_data?.groups) {
     toolItems = step.tool_data.groups.flatMap((g: any) => g.items || []);
  }
  
  const items = documentItems.length > 0 ? documentItems : toolItems;
  
  if (items.length === 0) {
    return { reviewed: 0, total: 0, requiredReviewed: 0, requiredTotal: 0, percentage: 0, isComplete: true };
  }
  
  // docReviewStatus is stored at metadata.docReviewStatus
  const docReviewStatus = (metadata?.docReviewStatus as Record<string, string>) || {};

  // Only required items block completion
  const requiredItems = items.filter((d: any) => 
    !d.group || d.group === 'Required Now' || d.group === 'USCIS Intake Order'
  );
  
  const reviewedCount = items.filter((d: any) => 
    docReviewStatus[d.id] === 'reviewed'
  ).length;

  const requiredReviewedCount = requiredItems.filter((d: any) => 
    docReviewStatus[d.id] === 'reviewed'
  ).length;

  const isComplete = requiredItems.length === 0 
    ? false // agar koi required item hi nahi hai, complete mat maano
    : requiredReviewedCount >= requiredItems.length;

  return { 
    reviewed: reviewedCount, 
    total: items.length, 
    requiredReviewed: requiredReviewedCount, 
    requiredTotal: requiredItems.length, 
    percentage: items.length > 0 ? Math.round((reviewedCount / items.length) * 100) : 0, 
    isComplete 
  };
}

/**
 * Calculates Quest progress for a suite.
 */
export function getQuestProgress(step: any, state: any) {
  const questData = step.quest_data;
  if (!questData) return { answered: 0, total: 0, percentage: 0, isComplete: true };

  // Quest ka step_key lo
  const stepKey = step.step_key || step.id;
  const answers = state.answers || {};
  const completedSteps = state.completedSteps;
  
  // Agar step already completed hai backend se, skip check
  if (completedSteps && completedSteps.has && completedSteps.has(stepKey)) {
    return { answered: 1, total: 1, percentage: 100, isComplete: true };
  }

  // Quest suites enumerate karo
  const suites = questData.suites || questData.quests || [];
  
  if (suites.length === 0) {
    // Single quest without suites — check if answers[stepKey] has any data
    const hasAnyAnswer = answers[stepKey] && Object.keys(answers[stepKey]).length > 0;
    return { 
      answered: hasAnyAnswer ? 1 : 0, 
      total: 1, 
      percentage: hasAnyAnswer ? 100 : 0, 
      isComplete: hasAnyAnswer 
    };
  }

  let totalRequired = 0;
  let totalAnswered = 0;

  suites.forEach((suite: any) => {
    const screens = suite.screens || [];
    screens.forEach((screen: any) => {
      if (screen.required === false) return;
      totalRequired++;
      
      // Answer keys jo QuestRenderer use karta hai: answers[questId][screenId]
      const questLevelAnswer = answers[questData.id]?.[screen.id];
      // Ya flat format: answers[stepKey_suiteId_screenId]
      const flatAnswer = answers[`${stepKey}_${suite.id}_${screen.id}`];
      // Ya suite level: answers[suite.id]?.[screen.id]
      const suiteLevelAnswer = answers[suite.id]?.[screen.id];
      
      if (
        (questLevelAnswer !== undefined && questLevelAnswer !== null && questLevelAnswer !== '') ||
        (flatAnswer !== undefined && flatAnswer !== null && flatAnswer !== '') ||
        (suiteLevelAnswer !== undefined && suiteLevelAnswer !== null && suiteLevelAnswer !== '')
      ) {
        totalAnswered++;
      }
    });
  });

  // Agar koi screens nahi mili lekin suites hain, check karo koi bhi answer hai
  if (totalRequired === 0) {
    const hasAnyAnswer = Object.keys(answers).some(k => k.includes(stepKey) || k.includes(questData.id || ''));
    return { answered: hasAnyAnswer ? 1 : 0, total: 1, percentage: hasAnyAnswer ? 100 : 0, isComplete: hasAnyAnswer };
  }

  const isComplete = totalAnswered >= totalRequired;
  return { 
    answered: totalAnswered, 
    total: totalRequired, 
    percentage: Math.round((totalAnswered / totalRequired) * 100), 
    isComplete 
  };
}
