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

      // TODO: Steps implementation - I'll query the steps table when reach there.

      // For now, return current progress from chapter itself
      const progressData: ProgressData = {
        total_steps_count: chapter.total_steps_count,
        completed_steps_count: chapter.completed_steps_count,
        completion_percentage: chapter.completion_percentage,
      };

      // If chapter is 100% complete, mark as completed
      if (progressData.completion_percentage === 100) {
        await db.updateChapterDB(chapterId, { status: "completed" });
      } else if (progressData.completed_steps_count > 0) {
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

//   Export service instances for use in API routes
export const journeyService = new JourneyService();
export const progressService = new ProgressCalculationService();
export const conditionalLogicEngine = new ConditionalLogicEngine();
