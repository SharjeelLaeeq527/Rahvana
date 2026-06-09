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
  CaseDataInput,
  CaseDataValidationResult,
  CaseData,
  CaseDataResponse,
  CaseProfile,
  CaseDataBatchOperation,
} from "./types";
import * as db from "./data-access";
import { ConfigLoader } from "./config-loader";
import { detectDataType } from "./data-access";
import { CaseStrengthEngine } from "./CaseStrengthEngine";

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
      const totalSteps = chapters.reduce((sum, chapter) => sum + chapter.total_steps_count, 0);

      const completedSteps = chapters.reduce(
        (sum, chapter) => sum + chapter.completed_steps_count,
        0
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

        // Archive associated interview sessions (preserve journey_id for history)
        try {
          const { archiveJourneySessions } = await import("@/lib/interview-prep/data-access");
          await archiveJourneySessions(journeyId);
        } catch (archiveError) {
          console.warn("[JourneyService] Failed to archive interview sessions:", archiveError);
        }
      }

      return progressData;
    } catch (error) {
      console.error(`Error calculating journey progress for ${journeyId}:`, error);
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

      // Get journey to check filing method for filtering
      const journey = await db.getJourneyDB(chapter.journey_id);
      const filingMethod = journey?.filing_method || "online";

      // Filter steps based on branch/filing method
      const activeSteps = steps.filter((step) => {
        const branch = (step.metadata as any)?.branch;
        return !branch || branch === "both" || branch === filingMethod;
      });

      // Count completed steps
      const totalSteps = activeSteps.length;
      const completedSteps = activeSteps.filter((step) => step.status === "completed").length;

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
      console.error(`Error calculating chapter progress for ${chapterId}:`, error);
      throw error;
    }
  }

  //   Get progress summary for a journey
  async getJourneyProgressSummary(journeyId: string, client?: { supabase: any; user: any }) {
    try {
      const journey = await db.getJourneyDB(journeyId, client);
      if (!journey) throw new Error("Journey not found");

      const chapters = await db.getChaptersForJourneyDB(journeyId, undefined, client);
      const filingMethod = journey.filing_method || "online";

      // Optimized: Fetch ALL steps for the journey in ONE query instead of N (chapters) queries
      const allSteps = await db.getStepsForJourneyDB(journeyId, undefined, client);

      // Group steps by chapter ID in memory
      const stepsByChapter = allSteps.reduce(
        (acc, step) => {
          if (!acc[step.chapter_id]) acc[step.chapter_id] = [];
          acc[step.chapter_id].push(step);
          return acc;
        },
        {} as Record<string, Step[]>
      );

      // Build per-chapter progress from memory-grouped steps
      const chapterProgress = chapters.map((ch) => {
        const steps = stepsByChapter[ch.id] || [];
        const activeSteps = steps.filter((s) => {
          const branch = (s.metadata as any)?.branch;
          return !branch || branch === "both" || branch === filingMethod;
        });
        const completedCount = activeSteps.filter((s) => s.status === "completed").length;
        const total = activeSteps.length;
        const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);
        return { ch, activeSteps, completedCount, total, pct };
      });

      const completedChapters = chapterProgress.filter((c) => c.pct === 100).length;

      // Current chapter = first chapter that is NOT 100% complete
      let currentChapterIdx = chapterProgress.findIndex((c) => c.pct < 100);
      if (currentChapterIdx === -1) currentChapterIdx = chapters.length - 1;

      // Current step = first incomplete active step in that chapter
      let activeStepIdx = 0;
      const currentChapterData = chapterProgress[currentChapterIdx];
      if (currentChapterData) {
        const firstIncompleteIdx = currentChapterData.activeSteps.findIndex(
          (s) => s.status !== "completed"
        );
        activeStepIdx = firstIncompleteIdx === -1 ? 0 : firstIncompleteIdx;
      }

      return {
        journey_id: journeyId,
        journey_type: journey.journey_type,
        total_completion_percentage: journey.completion_percentage,
        total_chapters: chapters.length,
        completed_chapters: completedChapters,
        chapters_remaining: chapters.length - completedChapters,
        current_chapter_index: currentChapterIdx,
        current_step_index: activeStepIdx,
        all_chapters: chapterProgress.map(({ ch, pct }) => ({
          id: ch.id,
          chapter_key: ch.chapter_key,
          chapter_name: ch.chapter_name,
          completion_percentage: pct,
          status: pct === 100 ? "completed" : pct > 0 ? "in_progress" : "not_started",
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
      const chapter = await db.getChapterDB(chapterId);
      if (!chapter) return null;

      const journey = await db.getJourneyDB(chapter.journey_id);
      const filingMethod = journey?.filing_method || "online";

      const steps = await db.getStepsForChapterDB(chapterId);

      // Filter by branch
      const activeSteps = steps.filter((s) => {
        const branch = (s.metadata as any)?.branch;
        return !branch || branch === "both" || branch === filingMethod;
      });

      const currentStep = activeSteps.find((step) => step.status !== "completed");
      return currentStep || null;
    } catch (error) {
      console.error(`Error getting current step for chapter ${chapterId}:`, error);
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
    caseData: Record<string, unknown>
  ): VisibilityCheckResult {
    try {
      // If no visible_when condition, chapter is always visible
      if (!chapter.visible_when || Object.keys(chapter.visible_when).length === 0) {
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
              `${key} must be one of ${JSON.stringify(expectedValue)}, but was ${JSON.stringify(caseValue)}`
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
              `${key} must be ${JSON.stringify(expectedValue)}, but was ${JSON.stringify(caseValue)}`
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
      console.error(`Error checking chapter visibility for ${chapter.id}:`, error);
      throw error;
    }
  }

  // Get visible chapters for a journey based on case_data
  async getVisibleChapters(journeyId: string, caseData: Record<string, unknown>) {
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
  async getHiddenChaptersWithReasons(journeyId: string, caseData: Record<string, unknown>) {
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
  evaluateStepVisibility(step: Step, caseData: Record<string, unknown>): VisibilityCheckResult {
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
              `${key} must be one of ${expectedValue.join(", ")} (got ${actualValue})`
            );
          }
        } else {
          // Direct equality check
          if (actualValue !== expectedValue) {
            failedConditions.push(`${key} must be ${expectedValue} (got ${actualValue})`);
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
  evaluateBlockedStatus(step: Step, caseData: Record<string, unknown>): VisibilityCheckResult {
    try {
      // If step status is blocked
      if (step.status === "blocked") {
        return {
          is_visible: false,
          reason: "Step is currently blocked",
        };
      }

      // If step is skipped but marked as persistent, keep it visible
      if (step.status === "skipped" && step.substatus === "persistent") {
        return {
          is_visible: true,
          reason: "Step is optional but persistent - can be completed later",
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
  // Mark a step as completed — optimized for speed: 1 direct write + background recalc
  async completeStep(stepId: string, journeyId: string, completionData?: Record<string, unknown>) {
    try {
      const now = new Date().toISOString();
      const { createClient } = await import("@/lib/supabase/server");
      const client = await createClient();

      // 1. Mark step completed — single direct UPDATE, no pre-read
      const { data: updatedStep, error: updateError } = await client
        .from("steps")
        .update({ status: "completed", completion_percentage: 100, completed_at: now })
        .eq("id", stepId)
        .select("id, step_key, chapter_id, status")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 2. Fire-and-forget: mark journey in_progress
      client
        .from("journeys")
        .update({ status: "in_progress", updated_at: now })
        .eq("id", journeyId)
        .neq("status", "in_progress")
        .then(() => {});

      // 3. Background: recalculate chapter & journey progress (non-blocking)
      setImmediate(async () => {
        try {
          await new ProgressCalculationService().calculateChapterProgress(updatedStep.chapter_id);
          await new ProgressCalculationService().calculateJourneyProgress(journeyId);
        } catch (e) {
          console.warn("[completeStep] Background progress recalc failed:", e);
        }
      });

      return {
        step_id: stepId,
        was_completed: true,
        newly_unlocked_steps: [],
        chapter_completion_percentage: 0,
        journey_completion_percentage: 0,
      };
    } catch (error) {
      console.error(`Error completing step ${stepId}:`, error);
      throw error;
    }
  }

  // Check if all dependencies for a step are met
  async checkDependencies(stepId: string, journeyId: string): Promise<DependencyCheckResult> {
    try {
      // Get the step first to check its dependencies
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");

      if (!step.dependencies || step.dependencies.length === 0) {
        return {
          all_dependencies_met: true,
          pending_dependencies: [],
          reason: "No dependencies",
        };
      }

      // Fetch all dependency steps for this journey in one go
      const dependencySteps = await db.getStepsForJourneyByStepKeysDB(journeyId, step.dependencies);

      const pendingDependencies: string[] = [];

      // Check if all needed keys were found and are completed
      for (const depKey of step.dependencies) {
        const depStep = dependencySteps.find((s: Step) => s.step_key === depKey);
        if (!depStep || depStep.status !== "completed") {
          pendingDependencies.push(depKey);
        }
      }

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
      console.error(`Error checking dependencies for ${stepId}:`, error);
      throw error;
    }
  }

  // Validate that step can be completed
  async validateStepCompletion(
    step: Step,
    completionData?: Record<string, unknown>
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
  async unlockDependentSteps(completedStepId: string, journeyId: string): Promise<string[]> {
    try {
      // Get all steps for journey
      const allSteps = await db.getStepsForJourneyDB(journeyId);

      // Find steps that depend on completed step
      const dependentSteps = allSteps.filter(
        (s) =>
          s.dependencies && s.dependencies.includes(completedStepId) && s.status === "not_started"
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
      console.error(`Error unlocking dependent steps for ${completedStepId}:`, error);
      throw error;
    }
  }

  // Get all steps that depend on a specific step
  async getDependentSteps(stepId: string, journeyId: string): Promise<Step[]> {
    try {
      const allSteps = await db.getStepsForJourneyDB(journeyId);
      return allSteps.filter((s) => s.dependencies && s.dependencies.includes(stepId));
    } catch (error) {
      console.error(`Error getting dependent steps for ${stepId}:`, error);
      throw error;
    }
  }

  // Skip step but keep it visible and persistent on dashboard (for optional tasks like Police Certificate)
  async skipStepButKeepPersistent(stepId: string, journeyId: string, reason?: string) {
    try {
      // Get step and verify it exists
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");
      if (step.status === "completed") {
        return {
          step_id: stepId,
          was_completed: true,
          newly_unlocked_steps: [],
          chapter_completion_percentage: 0,
          journey_completion_percentage: 0,
        };
      }

      // Check if step is skippable (not required)
      if (step.is_required) {
        throw new Error("Cannot skip required step. This step must be completed.");
      }

      // Mark as skipped with "persistent" substatus
      // This keeps the step visible on dashboard but marks it as skipped
      await db.updateStepDB(stepId, {
        status: "skipped",
        substatus: "persistent", // Signals dashboard to keep visible
        completion_percentage: 0,
      });

      // Get chapter for progress calculation
      const chapter = await db.getChapterDB(step.chapter_id);

      if (chapter) {
        const chapterProgress = await new ProgressCalculationService().calculateChapterProgress(
          step.chapter_id
        );

        const journeyProgress = await new ProgressCalculationService().calculateJourneyProgress(
          journeyId
        );

        return {
          step_id: stepId,
          action: "skipped",
          substatus: "persistent",
          reason: reason || "User skipped this optional step",
          is_visible: true,
          is_persistent: true,
          chapter_completion_percentage: chapterProgress.completion_percentage,
          journey_completion_percentage: journeyProgress.completion_percentage,
          message: "Step skipped but will remain visible until completed or resolved",
        };
      }

      return {
        step_id: stepId,
        action: "skipped",
        substatus: "persistent",
        reason: reason || "User skipped this optional step",
        is_visible: true,
        is_persistent: true,
        chapter_completion_percentage: 0,
        journey_completion_percentage: 0,
      };
    } catch (error) {
      console.error(`Error skipping persistent step ${stepId}:`, error);
      throw error;
    }
  }

  // Mark an incomplete step as "passed" (for review-only or informational steps)
  // This is for steps that don't require completion but should be marked as reviewed
  async markStepAsIncompleteButPassed(stepId: string, journeyId: string, reviewNotes?: string) {
    try {
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");

      // Mark substatus to indicate review was done but not fully completed
      await db.updateStepDB(stepId, {
        status: "in_progress",
        substatus: "reviewed-incomplete",
        completion_percentage: 50, // Half-way progress for visual indicator
      });

      const chapter = await db.getChapterDB(step.chapter_id);
      if (chapter) {
        const chapterProgress = await new ProgressCalculationService().calculateChapterProgress(
          step.chapter_id
        );
        const journeyProgress = await new ProgressCalculationService().calculateJourneyProgress(
          journeyId
        );

        return {
          step_id: stepId,
          status: "incomplete-but-passed",
          substatus: "reviewed-incomplete",
          is_visible: true,
          completion_percentage: 50,
          review_notes: reviewNotes,
          chapter_completion_percentage: chapterProgress.completion_percentage,
          journey_completion_percentage: journeyProgress.completion_percentage,
          message: "Step marked as reviewed but incomplete (optional)",
        };
      }

      return {
        step_id: stepId,
        status: "incomplete-but-passed",
        substatus: "reviewed-incomplete",
        is_visible: true,
        completion_percentage: 50,
        review_notes: reviewNotes,
        message: "Step marked as reviewed but incomplete (optional)",
      };
    } catch (error) {
      console.error(`Error marking step as incomplete-but-passed ${stepId}:`, error);
      throw error;
    }
  }

  // Get skippable-but-persistent steps (for dashboard display)
  // Returns steps that are skipped but should remain visible
  async getSkippablePersistentSteps(journeyId: string): Promise<Step[]> {
    try {
      const allSteps = await db.getStepsForJourneyDB(journeyId);
      return allSteps.filter(
        (s) => s.status === "skipped" && s.substatus === "persistent" && !s.is_required
      );
    } catch (error) {
      console.error(`Error getting skippable-persistent steps for ${journeyId}:`, error);
      throw error;
    }
  }
}

/**
 * CASE DATA VALIDATION ENGINE
 * Responsible for:
 * - Validating case data against rules
 * - Checking data types and formats
 * - Tracking validation errors
 * - Determining data completeness
 */
export class CaseDataValidationEngine {
  // Validation rules for common case data keys
  private validationRules: Record<string, (value: any) => string[]> = {
    filing_method: (value) => {
      const valid = ["online", "paper"];
      return Array.isArray(value) || typeof value !== "string"
        ? ["Must be a single string value"]
        : !valid.includes(value)
          ? [`Must be one of: ${valid.join(", ")}`]
          : [];
    },

    visa_category: (value) => {
      const valid = ["IR-1"];
      return !valid.includes(value)
        ? [`Must be a valid visa category from: ${valid.join(", ")}`]
        : [];
    },

    beneficiary_age: (value) => {
      if (typeof value !== "number") return ["Must be a number"];
      if (value < 0 || value > 150) return ["Age must be between 0 and 150"];
      return [];
    },

    beneficiary_country_of_residence: (value) => {
      if (typeof value !== "string" || value.length < 2) return ["Must be a valid country name"];
      return [];
    },

    employer_state: (value) => {
      const validUSStates = [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
      ];
      return !validUSStates.includes(value?.toUpperCase()) ? ["Must be a valid US state code"] : [];
    },
  };

  // Validate a single case data item
  validateCaseData(dataKey: string, dataValue: any): CaseDataValidationResult {
    const errors: string[] = [];

    // Check if we have validation rules for this key
    if (this.validationRules[dataKey]) {
      const ruleErrors = this.validationRules[dataKey](dataValue);
      errors.push(...ruleErrors);
    }

    // Basic type checks
    if (dataValue === null || dataValue === undefined) {
      errors.push("Value cannot be null or undefined");
    }

    return {
      is_valid: errors.length === 0,
      data_key: dataKey,
      errors,
    };
  }

  // Validate complete case profile
  validateCaseProfile(
    caseData: Record<string, CaseData>
  ): Record<string, CaseDataValidationResult> {
    const results: Record<string, CaseDataValidationResult> = {};

    for (const [dataKey, caseDataItem] of Object.entries(caseData)) {
      results[dataKey] = this.validateCaseData(dataKey, caseDataItem.data_value);
    }

    return results;
  }

  // Add custom validation rule
  addValidationRule(dataKey: string, validator: (value: any) => string[]): void {
    this.validationRules[dataKey] = validator;
  }

  // Check if required data is complete
  checkDataCompleteness(
    caseData: Record<string, CaseData>,
    requiredKeys: string[]
  ): { complete: boolean; missing_keys: string[] } {
    const missing_keys = requiredKeys.filter(
      (key) =>
        !caseData[key] ||
        caseData[key].data_value === null ||
        caseData[key].data_value === undefined
    );

    return {
      complete: missing_keys.length === 0,
      missing_keys,
    };
  }
}

/**
 * JOURNEY SERVICE (High-level operations)
 * Orchestrates business logic for journey operations
 */

export class JourneyService {
  private progressService = new ProgressCalculationService();
  private conditionalEngine = new ConditionalLogicEngine();

  async createJourneyFromConfig(
    filePath: string,
    overrides?: {
      filing_method?: "online" | "paper";
      visa_category?: string;
    }
  ) {
    try {
      console.log(`Creating journey from config: ${filePath}`);

      // Load and transform JSON to database schema
      const rawJSON = ConfigLoader.loadJourneyJSON(filePath);
      const journeyInput = ConfigLoader.transformJourneyInput(rawJSON);
      const chaptersInput = ConfigLoader.transformChaptersInput(rawJSON.chapters);
      const caseDataKeys = ConfigLoader.extractCaseDataKeys(rawJSON);
      const caseDataInput = ConfigLoader.generateInitialCaseData(caseDataKeys);

      // Apply overrides if provided
      if (overrides?.filing_method) {
        journeyInput.filing_method = overrides.filing_method;
      }
      if (overrides?.visa_category) {
        journeyInput.visa_category = overrides.visa_category;
      }

      console.log(`Loaded: ${journeyInput.journey_name} with ${chaptersInput.length} chapters`);

      // Create journey in database
      const journey = await db.createJourneyDB(journeyInput);

      // Create chapters and steps
      const createdChapters: Chapter[] = [];
      let totalStepsCreated = 0;

      for (let i = 0; i < rawJSON.chapters.length; i++) {
        const rawChapter = rawJSON.chapters[i];
        const chapterInput = chaptersInput[i];

        const chapter = await db.createChapterDB(journey.id, chapterInput);
        createdChapters.push(chapter);

        const stepsInput = ConfigLoader.transformStepsInput(
          rawChapter.steps,
          rawChapter.chapter_key
        );

        const createdSteps = await Promise.all(
          stepsInput.map((stepInput) => db.createStepDB(chapter.id, stepInput))
        );

        totalStepsCreated += createdSteps.length;
      }

      // Initialize case data keys
      // const createdCaseData = await Promise.all(
      //   caseDataInput.map((caseInput) =>
      //     db.createOrUpdateCaseDataDB(journey.id, caseInput.data_key, caseInput),
      //   ),
      // );

      // Calculate initial progress
      const progressSummary = await this.progressService.calculateJourneyProgress(journey.id);

      // Auto-create interview session for IR-1 journeys
      // This creates a "ready" session without triggering questionnaire flow
      let interviewSessionCreated = false;
      if (journey.journey_type === "IR1" || journey.journey_type === "IR-1") {
        try {
          // Dynamically import to avoid circular dependencies
          const { createJourneyInterviewSession } = await import("@/lib/interview-prep/service");
          await createJourneyInterviewSession(journey.id, "ir-1-spouse");
          interviewSessionCreated = true;
          console.log(`[JourneyService] Auto-created interview session for journey ${journey.id}`);
        } catch (interviewError) {
          console.error(
            "[JourneyService] Failed to create interview session:",
            interviewError instanceof Error ? interviewError.message : String(interviewError)
          );
        }
      }

      return {
        journey,
        chapters: createdChapters,
        total_steps_created: totalStepsCreated,
        case_data_keys: caseDataKeys,
        // case_data_initialized: createdCaseData.length,
        progress_summary: progressSummary,
        interview_session_created: interviewSessionCreated,
        message: `Journey created: ${journeyInput.journey_name} (${createdChapters.length} chapters, ${totalStepsCreated} steps)`,
      };
    } catch (error) {
      console.error("Error creating journey from config:", error);
      throw error;
    }
  }

  /**
   * Create journey with manual chapter structure
   * (Legacy method - use createJourneyFromConfig instead)
   */
  async createJourneyWithChapters(journeyData: JourneyInput, chaptersData?: ChapterInput[]) {
    try {
      // Create journey first
      const journey = await db.createJourneyDB(journeyData);

      // Create chapters if provided
      let createdChapters: Chapter[] = [];
      if (chaptersData && chaptersData.length > 0) {
        createdChapters = await Promise.all(
          chaptersData.map((chapterData) => db.createChapterDB(journey.id, chapterData))
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
  async getJourneyDetails(journeyId: string, caseData?: Record<string, unknown>) {
    try {
      const journey = await db.getJourneyDB(journeyId);
      if (!journey) throw new Error("Journey not found");

      const chapters = await db.getChaptersForJourneyDB(journeyId);

      const progressSummary = await this.progressService.getJourneyProgressSummary(journeyId);

      // If case data provided, check chapter visibility
      let visibleChapters = chapters;
      if (caseData) {
        const checkResults = await this.conditionalEngine.getVisibleChapters(journeyId, caseData);
        visibleChapters = checkResults.map((res: any) => res.chapter);
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
      // Create a shared client for all sub-calls to avoid redundant auth/getUser overhead
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      const client = { supabase, user };

      const journeys = await db.getAllJourneysDB(undefined, client);

      const journeysWithProgress = await Promise.all(
        journeys.map(async (journey) => {
          const progressSummary = await this.progressService.getJourneyProgressSummary(
            journey.id,
            client
          );
          return {
            journey,
            progress_summary: progressSummary,
          };
        })
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
      const progressSummary = await this.progressService.getJourneyProgressSummary(journeyId);

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
  async createStep(chapterId: string, stepData: StepInput): Promise<StepResponse> {
    try {
      const step = await db.createStepDB(chapterId, stepData);

      // Get chapter for response
      const chapter = await db.getChapterDB(chapterId);

      return {
        ...step,
        chapter: chapter ?? undefined,
        dependencies_completed: true,
      };
    } catch (error) {
      console.error(`Error creating step:`, error);
      throw error;
    }
  }

  // Get step details with metadata (visibility, dependencies, next steps)
  async getStepDetails(stepId: string, caseData?: Record<string, unknown>): Promise<StepResponse> {
    try {
      const step = await db.getStepDB(stepId);
      if (!step) throw new Error("Step not found");

      // Check visibility
      const visibilityCheck = this.conditionalLogic.evaluateStepVisibility(step, caseData || {});

      // Check if blocked
      const blockedReason = this.conditionalLogic.evaluateBlockedStatus(step, caseData || {});

      // Check dependencies
      let dependenciesCompleted = true;
      if (step.dependencies && step.dependencies.length > 0) {
        const depCheck = await this.completionEngine.checkDependencies(stepId, step.chapter_id);
        dependenciesCompleted = depCheck.all_dependencies_met;
      }

      // Get dependent steps
      const nextSteps = await this.completionEngine.getDependentSteps(stepId, step.chapter_id);

      // Get chapter for context
      const chapter = await db.getChapterDB(step.chapter_id);
      const stepsInChapter = await db.getStepsForChapterDB(step.chapter_id);
      const stepPosition = stepsInChapter.findIndex((s) => s.id === stepId) + 1;

      return {
        ...step,
        chapter: chapter ?? undefined,
        dependencies_completed: dependenciesCompleted,
        blocked_reason: blockedReason.is_visible ? undefined : blockedReason.reason,
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
    completionData?: Record<string, unknown>
  ): Promise<StepCompletionResult> {
    try {
      return await this.completionEngine.completeStep(stepId, journeyId, completionData);
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
    caseData?: Record<string, unknown>
  ): Promise<StepResponse[]> {
    try {
      const steps = await db.getStepsForChapterDB(chapterId);

      // If caseData provided, filter by visibility
      if (caseData) {
        return steps
          .filter((step) => {
            const visibility = this.conditionalLogic.evaluateStepVisibility(step, caseData);
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

  // Skip an optional step but keep it visible on dashboard (persistent)
  // Used for tasks like Police Certificate that can be skipped but should remain visible
  async skipStepButKeepPersistent(stepId: string, journeyId: string, reason?: string) {
    try {
      return await this.completionEngine.skipStepButKeepPersistent(stepId, journeyId, reason);
    } catch (error) {
      console.error(`Error skipping persistent step ${stepId}:`, error);
      throw error;
    }
  }

  // Mark a step as reviewed/incomplete but passed
  // Used for informational or review-only steps
  async markStepAsIncompleteButPassed(stepId: string, journeyId: string, reviewNotes?: string) {
    try {
      return await this.completionEngine.markStepAsIncompleteButPassed(
        stepId,
        journeyId,
        reviewNotes
      );
    } catch (error) {
      console.error(`Error marking step as incomplete-but-passed ${stepId}:`, error);
      throw error;
    }
  }

  // Get persistent-skipped steps (for dashboard display)
  async getSkippablePersistentSteps(journeyId: string) {
    try {
      return await this.completionEngine.getSkippablePersistentSteps(journeyId);
    } catch (error) {
      console.error(`Error getting skippable-persistent steps for ${journeyId}:`, error);
      throw error;
    }
  }
}

export class CaseDataService {
  private validationEngine = new CaseDataValidationEngine();
  private strengthEngine = new CaseStrengthEngine(this);

  // Create or update case data for a journey
  async setCaseData(
    journeyId: string,
    dataKey: string,
    dataValue: any,
    options?: {
      is_verified?: boolean;
      source?: string;
      source_reference?: string;
    }
  ): Promise<CaseDataResponse> {
    // 1. Prevent recursion if the engine itself is updating the score
    const isInternalUpdate =
      options?.source === "CaseStrengthEngine" || dataKey === "case_strength_score";

    // 2. Validate
    const validation = this.validationEngine.validateCaseData(dataKey, dataValue);

    const response = await db.upsertCaseDataDB(journeyId, dataKey, {
      data_key: dataKey,
      data_value: dataValue,
      data_type: detectDataType(dataValue) as any,
      is_verified: options?.is_verified || false,
      source: (options?.source as any) || "user_input",
      source_reference: options?.source_reference,
    });

    // If validation failed, update with errors
    if (!validation.is_valid) {
      await db.updateCaseDataDB(journeyId, dataKey, {
        is_validated: false,
        validation_errors: validation.errors,
      });
    }

    // 3. Run Data-Driven Triggers & Re-calculate Case Strength (unless it's an internal update)
    if (!isInternalUpdate) {
      await this.runTriggersAndScoring(journeyId, dataKey, dataValue);
    }

    return {
      ...response,
      is_editable: true,
    };
  }

  /**
   * DATA TRIGGERS & SCORING
   * Handles automated actions based on data changes (e.g. NVC fee unlock)
   */
  private async runTriggersAndScoring(journeyId: string, dataKey: string, dataValue: any) {
    try {
      // TRIGGER 1: NVC Fee Auto-Unlock
      // Requirement §552: If NVC fee is posted, complete Step II.2 to unlock II.3 (DS-260)
      if (dataKey === "nvc_fee_status" && (dataValue === "posted" || dataValue === '"posted"')) {
        const steps = await db.getStepsForJourneyByStepKeyDB(journeyId, "II.2");
        if (steps && steps.length > 0 && steps[0].status !== "completed") {
          // We use the completion engine to ensure dependent steps are unlocked correctly
          await new StepCompletionEngine().completeStep(steps[0].id, journeyId, {
            source: "system_auto_unlock",
            trigger_data_key: "nvc_fee_status",
          });
        }
      }

      // TRIGGER 2: Update Case Strength Score
      // This runs on EVERY change to maintain live accuracy
      await this.strengthEngine.calculateJourneyStrength(journeyId);
    } catch (e) {
      console.error("[CaseDataService] Trigger execution failed:", e);
      // We don't throw here to ensure the original data-save succeeds even if triggers fail
    }
  }

  // Get case data with full details
  async getCaseData(journeyId: string, dataKey: string): Promise<CaseDataResponse> {
    const caseData = await db.getCaseDataByKeyDB(journeyId, dataKey);
    if (!caseData) throw new Error("Case data not found");

    return {
      ...caseData,
      is_editable: true,
    };
  }

  // Get complete case profile
  async getCaseProfile(journeyId: string): Promise<CaseProfile> {
    const allCaseData = await db.getCaseDataForJourneyDB(journeyId);

    const caseDataByKey: Record<string, CaseData> = {};
    allCaseData.forEach((item) => {
      caseDataByKey[item.data_key] = item;
    });

    // Count required data filled
    const requiredKeys = ["filing_method", "visa_category", "beneficiary_country_of_residence"];
    const completeness = this.validationEngine.checkDataCompleteness(caseDataByKey, requiredKeys);
    const completionPercentage = Math.round(
      ((requiredKeys.length - completeness.missing_keys.length) / requiredKeys.length) * 100
    );

    return {
      journey_id: journeyId,
      filing_method: caseDataByKey["filing_method"]?.data_value,
      visa_category: caseDataByKey["visa_category"]?.data_value,
      beneficiary_age: caseDataByKey["beneficiary_age"]?.data_value,
      beneficiary_relationship: caseDataByKey["beneficiary_relationship"]?.data_value,
      beneficiary_country_of_residence:
        caseDataByKey["beneficiary_country_of_residence"]?.data_value,
      employer_state: caseDataByKey["employer_state"]?.data_value,
      sponsor_type: caseDataByKey["sponsor_type"]?.data_value,
      case_status: caseDataByKey["case_status"]?.data_value,
      critical_data_keys: requiredKeys,
      optional_data_keys: allCaseData
        .filter((d) => !requiredKeys.includes(d.data_key))
        .map((d) => d.data_key),
      completion_percentage: completionPercentage,
      last_updated: allCaseData.length > 0 ? allCaseData[0].updated_at : new Date().toISOString(),
      all_data: caseDataByKey,
    };
  }

  // Validate all case data for a journey
  async validateAllCaseData(journeyId: string): Promise<Record<string, CaseDataValidationResult>> {
    const allCaseData = await db.getCaseDataForJourneyDB(journeyId);

    const caseDataByKey: Record<string, CaseData> = {};
    allCaseData.forEach((item) => {
      caseDataByKey[item.data_key] = item;
    });

    const validationResults = this.validationEngine.validateCaseProfile(caseDataByKey);

    // Update validation status in database
    for (const [dataKey, result] of Object.entries(validationResults)) {
      await db.updateCaseDataDB(journeyId, dataKey, {
        is_validated: result.is_valid,
        validation_errors: result.errors,
      });
    }

    return validationResults;
  }

  // Batch set case data
  async batchSetCaseData(
    journeyId: string,
    dataObject: Record<string, any>
  ): Promise<CaseDataResponse[]> {
    const operations: CaseDataBatchOperation[] = Object.entries(dataObject).map(([key, value]) => ({
      operation: "set",
      data_key: key,
      data_value: value,
    }));

    const results = await db.batchUpdateCaseDataDB(journeyId, operations);

    // After batch, trigger scoring (just once for the whole batch)
    try {
      // Check for fee status in the batch specifically
      const feeOp = operations.find((op) => op.data_key === "nvc_fee_status");
      if (feeOp) {
        await this.runTriggersAndScoring(journeyId, "nvc_fee_status", feeOp.data_value);
      } else {
        await this.strengthEngine.calculateJourneyStrength(journeyId);
      }
    } catch (e) {
      console.error("[BatchCaseData] Trigger error:", e);
    }

    return results.map((d) => ({
      ...d,
      is_editable: true,
    }));
  }

  // Delete case data
  async deleteCaseData(journeyId: string, dataKey: string): Promise<void> {
    await db.deleteCaseDataDB(journeyId, dataKey);
  }
}

// Export service instances for use in API routes
export const journeyService = new JourneyService();
export const stepService = new StepService();
export const caseDataService = new CaseDataService();

export const progressService = new ProgressCalculationService();
export const conditionalLogicEngine = new ConditionalLogicEngine();
export const stepCompletionEngine = new StepCompletionEngine();
export const caseDataValidationEngine = new CaseDataValidationEngine();
