/**
 * POST /api/journeys/[id]/sync-steps
 *
 * Syncs missing steps from the JSON config into an existing journey.
 * Used to "patch" journeys created before new steps were added to the config.
 *
 * Steps that already exist in the DB (by step_key) are left untouched.
 * Only truly missing steps are inserted.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConfigLoader } from "@/lib/journey/config-loader";
import { E, msg } from '@/lib/errors';
import * as db from "@/lib/journey/data-access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const journeyId = (await params).id;

    // Verify journey exists
    const journey = await db.getJourneyDB(journeyId);
    if (!journey) {
      return NextResponse.json(
        { success: false, error: msg(E.JOURNEY_NOT_FOUND) },
        { status: 404 }
      );
    }

    // Load the config JSON
    const configPath = `data/visa-category/ir-1.json`;
    const rawJSON = ConfigLoader.loadJourneyJSON(configPath);

    // Get existing chapters from DB
    const existingChapters = await db.getChaptersForJourneyDB(journeyId);

    // Get all existing steps from DB (by step_key)
    const existingSteps = await db.getStepsForJourneyDB(journeyId);
    const existingStepKeys = new Set(existingSteps.map((s) => s.step_key));

    let newStepsAdded = 0;
    const addedKeys: string[] = [];

    for (let ci = 0; ci < rawJSON.chapters.length; ci++) {
      const rawChapter = rawJSON.chapters[ci];
      const dbChapter = existingChapters.find(
        (ch) => ch.chapter_key === rawChapter.chapter_key
      );

      if (!dbChapter) {
        console.warn(
          `[sync-steps] Chapter ${rawChapter.chapter_key} not found in DB, skipping`
        );
        continue;
      }

      const stepsInput = ConfigLoader.transformStepsInput(
        rawChapter.steps,
        rawChapter.chapter_key
      );

      for (const stepInput of stepsInput) {
        if (!existingStepKeys.has(stepInput.step_key)) {
          // Step is missing from DB — insert it
          try {
            await db.createStepDB(dbChapter.id, stepInput);
            newStepsAdded++;
            addedKeys.push(stepInput.step_key);
            console.log(
              `[sync-steps] Added missing step: ${stepInput.step_key}`
            );
          } catch (err) {
            console.error(
              `[sync-steps] Failed to add step ${stepInput.step_key}:`,
              err
            );
          }
        }
      }
    }

    console.log(
      `[sync-steps] Journey ${journeyId}: ${newStepsAdded} new steps added`
    );

    return NextResponse.json({
      success: true,
      data: {
        journey_id: journeyId,
        steps_added: newStepsAdded,
        added_step_keys: addedKeys,
        message:
          newStepsAdded === 0
            ? "All steps already in sync"
            : `${newStepsAdded} missing steps added to journey`,
      },
    });
  } catch (error) {
    console.error(`[sync-steps] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to sync steps",
      },
      { status: 500 }
    );
  }
}
