// Business Logic Engine for Journey Management
import {
  Journey,
  Chapter,
  JourneyInput,
  JourneyUpdate,
  ChapterInput,
  ChapterUpdate,
  ProgressData,
  VisibilityCheckResult,
  DependencyCheckResult,
  Step,
  StepResponse,
  StepInput,
  StepCompletionResult,
  StepUpdate,
} from "./types";
import * as db from "./data-access";

/**
 * PROGRESS CALCULATION SERVICE
 * Responsible for:
 * - Calculating journey/chapter completion based on steps
 * - Handling cascading progress updates (step→chapter→journey)
 * - Providing progress summaries for UI
 */
export class ProgressCalculationService {
  // Calculate progress for a journey based on its chapters and steps. Called after any step completion/uncomplete.
  async calculateJourneyProgress(journeyId: string): Promise<ProgressData> {
    try {
      const journey = await db.getJourneyDB(journeyId);
      if (!journey) {
        throw new Error("Journey not found");
      }

      // Get all chapters for journey (with their step counts)
      const chapters = await db.getChaptersForJourneyDB(journeyId);

      // Sum all steps across all chapters
      const totalSteps = chapters.reduce(
        (sum, chapter) => sum + chapter.total_steps_count,
        0,
      );

      const completedSteps = chapters.reduce(
        (sum, chapter) => sum + chapter.completed_steps_count,
        0,
      );

      const completionPercentage =
        totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

      const progressData: ProgressData = {
        total_steps_count: totalSteps,
        completed_steps_count: completedSteps,
        completion_percentage: completionPercentage,
      };

      //   Update journey with new progress
      await db.updateJourneyProgressDB(journeyId, progressData);

      // Auto-mark journey as completed if all steps are done
      if (completionPercentage === 100) {
        await db.updateJourneyDB(journeyId, { status: "completed" });
      }

      return progressData;
    } catch (error) {
      console.error(
        `Error calculating journey progress for ${journeyId}:`,
        error,
      );
      throw error;
    }
  }

  // Calculate progress for a chapter based on its steps. Called after any step completion/uncomplete.
  async calculateChapterProgress(chapterId: string): Promise<ProgressData> {
    try {
      const chapter = await db.getChapterDB(chapterId);
      if (!chapter) throw new Error("Chapter not found");

      // Get all steps in this chapter
      const steps = await db.getStepsForChapterDB(chapterId);

      // Count completed steps
      const totalSteps = steps.length;
      const completedSteps = steps.filter(
        (step) => step.status === "completed",
      ).length;

      const completionPercentage =
        totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

      const progressData: ProgressData = {
        total_steps_count: totalSteps,
        completed_steps_count: completedSteps,
        completion_percentage: completionPercentage,
      };

      // Update chapter with new progress
      await db.updateChapterProgressDB(chapterId, progressData);

      // Auto-mark chapter as completed if all steps are done
      if (completionPercentage === 100) {
        await db.updateChapterDB(chapterId, {
          status: "completed",
          completed_at: new Date().toISOString(),
        });
      } else if (completedSteps > 0) {
        // If some steps done, mark as in_progress
        await db.updateChapterDB(chapterId, { status: "in_progress" });
      }

      return progressData;
    } catch (error) {
      console.error(
        `Error calculating chapter progress for ${chapterId}:`,
        error,
      );
      throw error;
    }
  }

  //   Get progress summary for a journey
  async getJourneyProgressSummary(journeyId: string) {
    try {
      const journey = await db.getJourneyDB(journeyId);
      if (!journey) throw new Error("Journey not found");

      const chapters = await db.getChaptersForJourneyDB(journeyId);
      const completedChapters = chapters.filter(
        (chap) => chap.completion_percentage === 100,
      ).length;

      // Find current chapter (first not completed)
      const currentChapter = chapters.filter(
        (chap) => chap.completion_percentage < 100,
      );

      return {
        journey_id: journeyId,
        journey_type: journey.journey_type,
        total_completion_percentage: journey.completion_percentage,
        total_chapters: chapters.length,
        completed_chapters: completedChapters,
        chapters_remaining: chapters.length - completedChapters,
        current_chapter: currentChapter || null,
        all_chapters: chapters.map((ch) => ({
          id: ch.id,
          chapter_key: ch.chapter_key,
          chapter_name: ch.chapter_name,
          completion_percentage: ch.completion_percentage,
          status: ch.status,
        })),
      };
    } catch (error) {
      console.error(`Error getting progress summary for ${journeyId}:`, error);
      throw error;
    }
  }

  // Get current step in a chapter (first not completed)
  async getCurrentStepInChapter(chapterId: string): Promise<Step | null> {
    try {
      const steps = await db.getStepsForChapterDB(chapterId);
      const currentStep = steps.find((step) => step.status !== "completed");
      return currentStep || null;
    } catch (error) {
      console.error(
        `Error getting current step for chapter ${chapterId}:`,
        error,
      );
      throw error;
    }
  }
}

/**
 * CONDITIONAL LOGIC ENGINE
 * Responsible for:
 * - Evaluating visible_when JSONB conditions
 * - Determining if chapters/steps should be shown based on case_data
 * - Handling dependencies between chapters
 */
export class ConditionalLogicEngine {
  //  Check if a chapter should be visible based on its visible_when condition and the user's case_data
  checkChapterVisibility(
    chapter: Chapter,
    caseData: Record<string, unknown>,
  ): VisibilityCheckResult {
    try {
      // If no visible_when condition, chapter is always visible
      if (
        !chapter.visible_when ||
        Object.keys(chapter.visible_when).length === 0
      ) {
        return {
          is_visible: true,
          reason: "No visibility restrictions",
        };
      }

      // Evaluate each condition in visible_when
      const conditions = chapter.visible_when as Record<string, unknown>;
      const failedConditions: string[] = [];

      for (const [key, expectedValue] of Object.entries(conditions)) {
        const caseValue = caseData[key];

        // Handle array values (e.g., status: ["single", "married"])
        if (Array.isArray(expectedValue)) {
          if (!expectedValue.includes(caseValue)) {
            failedConditions.push(
              `${key} must be one of ${JSON.stringify(expectedValue)}, but was ${JSON.stringify(caseValue)}`,
            );
          }
        }

        // Handle boolean negation (e.g., not_have_spouse: false means "don't show if spouse")
        else if (typeof expectedValue === "boolean") {
          if (expectedValue && caseValue !== true) {
            failedConditions.push(`${key} must be true, but was ${caseValue}`);
          }
          if (!expectedValue && caseValue === true) {
            failedConditions.push(`${key} must be false, but was true`);
          }
        }

        // Handle exact value match
        else {
          if (caseValue !== expectedValue) {
            failedConditions.push(
              `${key} must be ${JSON.stringify(expectedValue)}, but was ${JSON.stringify(caseValue)}`,
            );
          }
        }
      }

      if (failedConditions.length > 0) {
        return {
          is_visible: false,
          reason: `Waiting for: ${failedConditions.join("; ")}`,
        };
      }

      return {
        is_visible: true,
        reason: "All visibility conditions met",
      };
    } catch (error) {
      console.error(
        `Error checking chapter visibility for ${chapter.id}:`,
        error,
      );
      throw error;
    }
  }

  // Get visible chapters for a journey based on case_data
  async getVisibleChapters(
    journeyId: string,
    caseData: Record<string, unknown>,
  ) {
    try {
      const chapters = await db.getChaptersForJourneyDB(journeyId);

      return chapters
        .map((chapter) => {
          const visibility = this.checkChapterVisibility(chapter, caseData);
          return {
            chapter,
            ...visibility,
          };
        })
        .filter((result) => result.is_visible);
    } catch (error) {
      console.error(`Error getting visible chapters for ${journeyId}:`, error);
      throw error;
    }
  }

  // Get hidden chapters with reasons (for admin debugging)
  async getHiddenChaptersWithReasons(
    journeyId: string,
    caseData: Record<string, unknown>,
  ) {
    try {
      const chapters = await db.getChaptersForJourneyDB(journeyId);

      return chapters
        .map((chapter) => {
          const visibility = this.checkChapterVisibility(chapter, caseData);
          return {
            chapter,
            ...visibility,
          };
        })
        .filter((result) => !result.is_visible);
    } catch (error) {
      console.error(`Error getting hidden chapters for ${journeyId}:`, error);
      throw error;
    }
  }

  // Check if step should be visible based on conditions
  evaluateStepVisibility(
    step: Step,
    caseData: Record<string, unknown>,
  ): VisibilityCheckResult {
    try {
      // If no visibility conditions, step is visible
      if (!step.visible_when || Object.keys(step.visible_when).length === 0) {
        return {
          is_visible: true,
          reason: "No visibility restrictions",
        };
      }

      // No case data provided - cannot determine visibility
      if (!caseData) {
        return {
          is_visible: false,
          reason: "Cannot determine visibility, missing case data",
        };
      }

      // Check each condition in visible_when
      const conditions = step.visible_when as Record<string, unknown>;
      const failedConditions: string[] = [];

      for (const [key, expectedValue] of Object.entries(conditions)) {
        const actualValue = caseData[key];

        // Check if condition matches
        if (Array.isArray(expectedValue)) {
          // If expected is array, check if actual is in array
          if (!expectedValue.includes(actualValue)) {
            failedConditions.push(
              `${key} must be one of ${expectedValue.join(", ")} (got ${actualValue})`,
            );
          }
        } else {
          // Direct equality check
          if (actualValue !== expectedValue) {
            failedConditions.push(
              `${key} must be ${expectedValue} (got ${actualValue})`,
            );
          }
        }
      }

      if (failedConditions.length > 0) {
        return {
          is_visible: false,
          reason: `Visibility conditions not met: ${failedConditions.join("; ")}`,
        };
      }

      return {
        is_visible: true,
        reason: "All visibility conditions met",
      };
    } catch (error) {
      console.error(`Error evaluating step visibility for ${step.id}:`, error);
      throw error;
    }
  }

  // Evaluate step status based on dependencies and case data
  evaluateBlockedStatus(
    step: Step,
    caseData: Record<string, unknown>,
  ): VisibilityCheckResult {
    try {
      // If step status is blocked
      if (step.status === "blocked") {
        return {
          is_visible: false,
          reason: "Step is currently blocked",
        };
      }

      // If step is not required and user has skipped it, it's in skipped status
      if (step.status === "skipped") {
        return {
          is_visible: true,
          reason: "Step is skipped (optional)",
        };
      }

      // Check visibility conditions
      const visibilityCheck = this.evaluateStepVisibility(step, caseData);

      return visibilityCheck;
    } catch (error) {
      console.error(`Error evaluating step status for ${step.id}:`, error);
      throw error;
    }
  }
}

/**
 * STEP COMPLETION ENGINE
 * Responsible for:
 * - Completing steps with validation
 * - Unlocking dependent steps
 * - Cascading progress updates (step→chapter→journey)
 * - Tracking step dependencies
 */
export class StepCompletionEngine {
  // Mark a step as completed, check dependencies, unlock next steps, and update progress
  async completeStep(
    stepId: string,
    journeyId: string,
    completionData?: Record<string, unknown>,
  ) {
    try {
      // 1. Get step and verify it exists, and is not completed already
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");
      if (step.status === "completed")
        throw new Error("Step is already completed");

      // 2. Check dependencies
      const dependencyCheck = await this.checkDependencies(stepId, journeyId);
      if (!dependencyCheck.all_dependencies_met) {
        throw new Error(
          `Cannot complete step: ${dependencyCheck.reason}. Pending: ${dependencyCheck.pending_dependencies.join(", ")}`,
        );
      }

      // 3. Validate completion data
      const validationResult = await this.validateStepCompletion(
        step,
        completionData,
      );
      if (!validationResult.valid) {
        throw new Error(
          `Validation failed: ${validationResult.errors?.join("; ")}`,
        );
      }

      // 4. Mark step as completed
      const completedStep = await db.completeStepDB(stepId);

      // 5. Unlock dependent steps
      const unlockedSteps = await this.unlockDependentSteps(stepId, journeyId);

      // 6. Recalculate chapter progress
      const chapter = await db.getChapterDB(step.chapter_id);
      if (chapter) {
        const chapterProgress =
          await new ProgressCalculationService().calculateChapterProgress(
            step.chapter_id,
          );

        // 7. Recalculate journey progress
        const journeyProgress =
          await new ProgressCalculationService().calculateJourneyProgress(
            journeyId,
          );

        // Get next step
        const nextStep = await db.getCurrentStepForJourneyDB(journeyId);

        return {
          step_id: stepId,
          was_completed: true,
          newly_unlocked_steps: unlockedSteps,
          chapter_completion_percentage: chapterProgress.completion_percentage,
          journey_completion_percentage: journeyProgress.completion_percentage,
          next_step: nextStep || undefined,
        };
      }

      return {
        step_id: stepId,
        was_completed: true,
        newly_unlocked_steps: unlockedSteps,
        chapter_completion_percentage: 0,
        journey_completion_percentage: 0,
      };
    } catch (error) {
      console.error(`Error completing step ${stepId}:`, error);
      throw error;
    }
  }

  // Check if all dependencies for a step are met
  async checkDependencies(
    stepId: string,
    journeyId: string,
  ): Promise<DependencyCheckResult> {
    try {
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");

      // If no dependencies found, return met
      if (!step.dependencies || step.dependencies.length === 0) {
        return {
          all_dependencies_met: true,
          pending_dependencies: [],
          reason: "No dependencies",
        };
      }

      // Check each dependency step status
      const dependencyStatuses = await Promise.all(
        step.dependencies.map(async (depId) => {
          const depStep = await db.getStepDB(depId);
          return {
            id: depId,
            status: depStep ? depStep.status : "not_found",
          };
        }),
      );

      const pendingDependencies = dependencyStatuses
        .filter((dep) => dep.status !== "completed")
        .map((dep) => dep.id);

      if (pendingDependencies.length > 0) {
        return {
          all_dependencies_met: false,
          pending_dependencies: pendingDependencies,
          reason: `Pending dependencies: ${pendingDependencies.join(", ")}`,
        };
      }

      return {
        all_dependencies_met: true,
        pending_dependencies: [],
        reason: "All dependencies met",
      };
    } catch (error) {
      console.error(`Error checking dependencies for step ${stepId}:`, error);
      throw error;
    }
  }

  // Validate that step can be completed
  async validateStepCompletion(
    step: Step,
    completionData?: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const errors: string[] = [];

      // Check if step is required
      if (!step.is_required) {
        return {
          valid: true,
          errors: undefined,
        };
      }

      // For required steps, just verify not already completed
      if (step.status === "completed") {
        errors.push("Step is already completed");
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error(`Error validating step ${step.id}:`, error);
      throw error;
    }
  }

  // Unlock steps that depend on the completed step
  async unlockDependentSteps(
    completedStepId: string,
    journeyId: string,
  ): Promise<string[]> {
    try {
      // Get all steps for journey
      const allSteps = await db.getStepsForJourneyDB(journeyId);

      // Find steps that depend on completed step
      const dependentSteps = allSteps.filter(
        (s) =>
          s.dependencies &&
          s.dependencies.includes(completedStepId) &&
          s.status === "not_started",
      );

      // Update them to visible and in_progress status if needed
      const unlockedIds: string[] = [];
      for (const depStep of dependentSteps) {
        // Only update if currently invisible/blocked
        if (!depStep.is_visible) {
          await db.updateStepDB(depStep.id, {
            is_visible: true,
            status: "in_progress",
          });
          unlockedIds.push(depStep.id);
        }
      }

      return unlockedIds;
    } catch (error) {
      console.error(
        `Error unlocking dependent steps for ${completedStepId}:`,
        error,
      );
      throw error;
    }
  }

  // Get all steps that depend on a specific step
  async getDependentSteps(stepId: string, journeyId: string): Promise<Step[]> {
    try {
      const allSteps = await db.getStepsForJourneyDB(journeyId);
      return allSteps.filter(
        (s) => s.dependencies && s.dependencies.includes(stepId),
      );
    } catch (error) {
      console.error(`Error getting dependent steps for ${stepId}:`, error);
      throw error;
    }
  }
}

/**
 * JOURNEY SERVICE (High-level operations)
 * Orchestrates business logic for journey operations
 */

export class JourneyService {
  private progressService = new ProgressCalculationService();
  private conditionalEngine = new ConditionalLogicEngine();

  //   Create a new journey with initial chapter structure. Called once per visa journey (IR-1, IR-5, F-1, etc.)
  async createJourneyWithChapters(
    journeyData: JourneyInput,
    chaptersData?: ChapterInput[],
  ) {
    try {
      // Create journey first
      const journey = await db.createJourneyDB(journeyData);

      // Create chapters if provided
      let createdChapters: Chapter[] = [];
      if (chaptersData && chaptersData.length > 0) {
        createdChapters = await Promise.all(
          chaptersData.map((chapterData) =>
            db.createChapterDB(journey.id, chapterData),
          ),
        );
      }

      return {
        journey,
        chapters: createdChapters,
        message: `Journey created with ${createdChapters.length} chapters`,
      };
    } catch (error) {
      console.error("Error creating journey with chapters:", error);
      throw error;
    }
  }

  //   Get complete journey details. Includes chapters, progress summary, visibility info
  async getJourneyDetails(
    journeyId: string,
    caseData?: Record<string, unknown>,
  ) {
    try {
      const journey = await db.getJourneyDB(journeyId);
      if (!journey) throw new Error("Journey not found");

      const chapters = await db.getChaptersForJourneyDB(journeyId);

      const progressSummary =
        await this.progressService.getJourneyProgressSummary(journeyId);

      // If case data provided, check chapter visibility
      let visibleChapters = chapters;
      if (caseData) {
        visibleChapters = await this.conditionalEngine.getVisibleChapters(
          journeyId,
          caseData,
        );
      }

      return {
        journey,
        chapters,
        visible_chapters: visibleChapters,
        progress_summary: progressSummary,
      };
    } catch (error) {
      console.error(`Error getting journey details for ${journeyId}:`, error);
      throw error;
    }
  }

  //   Get all journeys for current user with progress
  async getAllJourneysWithProgress() {
    try {
      const journeys = await db.getAllJourneysDB();

      const journeysWithProgress = await Promise.all(
        journeys.map(async (journey) => {
          const progressSummary =
            await this.progressService.getJourneyProgressSummary(journey.id);
          return {
            journey,
            progress_summary: progressSummary,
          };
        }),
      );

      return journeysWithProgress;
    } catch (error) {
      console.error("Error getting all journeys with progress:", error);
      throw error;
    }
  }

  //   Update journey and return updated details
  async updateJourney(journeyId: string, updates: JourneyUpdate) {
    try {
      const journey = await db.updateJourneyDB(journeyId, updates);
      const progressSummary =
        await this.progressService.getJourneyProgressSummary(journeyId);

      return {
        journey,
        progress_summary: progressSummary,
      };
    } catch (error) {
      console.error(`Error updating journey ${journeyId}:`, error);
      throw error;
    }
  }

  //   Delete journey (and all related chapters, steps, case_data via CASCADE)
  async deleteJourney(journeyId: string) {
    try {
      await db.deleteJourneyDB(journeyId);
      return {
        success: true,
        message: `Journey deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting journey ${journeyId}:`, error);
      throw error;
    }
  }

  //   Delete all journeys
  async deleteAllUserJourneys() {
    try {
      await db.deleteAllJourneysDB();
      return {
        success: true,
        message: `All journeys deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting all journeys:`, error);
      throw error;
    }
  }
}

// Step Service for handling step-specific operations (creation, retrieval with visibility, completion, etc.)
export class StepService {
  private completionEngine = new StepCompletionEngine();
  private conditionalLogic = new ConditionalLogicEngine();

  // Create step in a chapter
  async createStep(
    chapterId: string,
    stepData: StepInput,
  ): Promise<StepResponse> {
    try {
      const step = await db.createStepDB(chapterId, stepData);

      // Get chapter for response
      const chapter = await db.getChapterDB(chapterId);

      return {
        ...step,
        chapter,
        dependencies_completed: true,
      };
    } catch (error) {
      console.error(`Error creating step:`, error);
      throw error;
    }
  }

  // Get step details with metadata (visibility, dependencies, next steps)
  async getStepDetails(
    stepId: string,
    caseData?: Record<string, unknown>,
  ): Promise<StepResponse> {
    try {
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");

      // Check visibility
      const visibilityCheck = this.conditionalLogic.evaluateStepVisibility(
        step,
        caseData,
      );

      // Check if blocked
      const blockedReason = this.conditionalLogic.evaluateBlockedStatus(
        step,
        caseData,
      );

      // Check dependencies
      let dependenciesCompleted = true;
      if (step.dependencies && step.dependencies.length > 0) {
        const depCheck = await this.completionEngine.checkDependencies(
          stepId,
          step.chapter_id,
        );
        dependenciesCompleted = depCheck.all_dependencies_met;
      }

      // Get dependent steps
      const nextSteps = await this.completionEngine.getDependentSteps(
        stepId,
        step.chapter_id,
      );

      // Get chapter for context
      const chapter = await db.getChapterDB(step.chapter_id);
      const stepsInChapter = await db.getStepsForChapterDB(step.chapter_id);
      const stepPosition = stepsInChapter.findIndex((s) => s.id === stepId) + 1;

      return {
        ...step,
        chapter,
        dependencies_completed: dependenciesCompleted,
        blocked_reason: blockedReason || undefined,
        next_steps: nextSteps,
        progress_in_chapter: {
          step_position: stepPosition,
          total_steps_in_chapter: stepsInChapter.length,
        },
      };
    } catch (error) {
      console.error(`Error getting step details for ${stepId}:`, error);
      throw error;
    }
  }

  // Complete a step with all validations
  async completeStep(
    stepId: string,
    journeyId: string,
    completionData?: Record<string, unknown>,
  ): Promise<StepCompletionResult> {
    try {
      return await this.completionEngine.completeStep(
        stepId,
        journeyId,
        completionData,
      );
    } catch (error) {
      console.error(`Error completing step ${stepId}:`, error);
      throw error;
    }
  }

  // Update step details
  async updateStep(stepId: string, updates: StepUpdate): Promise<Step> {
    try {
      return await db.updateStepDB(stepId, updates);
    } catch (error) {
      console.error(`Error updating step ${stepId}:`, error);
      throw error;
    }
  }

  // Get all steps in a chapter with visibility filtering
  async getChapterSteps(
    chapterId: string,
    caseData?: Record<string, unknown>,
  ): Promise<StepResponse[]> {
    try {
      const steps = await db.getStepsForChapterDB(chapterId);

      // If caseData provided, filter by visibility
      if (caseData) {
        return steps
          .filter((step) => {
            const visibility = this.conditionalLogic.evaluateStepVisibility(
              step,
              caseData,
            );
            return visibility.is_visible;
          })
          .map((step) => ({
            ...step,
            dependencies_completed: true,
          }));
      }

      return steps.map((step) => ({
        ...step,
        dependencies_completed: true,
      }));
    } catch (error) {
      console.error(`Error getting chapter steps for ${chapterId}:`, error);
      throw error;
    }
  }
}

//   Export service instances for use in API routes
export const journeyService = new JourneyService();
export const stepService = new StepService();
export const progressService = new ProgressCalculationService();
export const conditionalLogicEngine = new ConditionalLogicEngine();
export const stepCompletionEngine = new StepCompletionEngine();
