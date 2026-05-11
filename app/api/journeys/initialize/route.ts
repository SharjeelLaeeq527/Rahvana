/**
 * POST /api/journeys/initialize
 *
 * Single endpoint replacing 4 sequential API calls:
 *   1. Find or create journey for this user + visa type
 *   2. Fetch journey, steps, and case_data in parallel
 *   3. Sync missing steps AFTER the response (non-blocking, using after())
 *
 * Server-side in-memory cache (30s TTL) makes repeat visits near-instant.
 * Cache busted when x-cache-bust: 1 header is sent (after mutations).
 */

import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { journeyService } from "@/lib/journey/service";
import * as db from "@/lib/journey/data-access";
import { ConfigLoader } from "@/lib/journey/config-loader";

// ── In-memory server cache (resets on cold start, fine for Vercel) ───────────
const serverCache = new Map<string, { data: any; cachedAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function normType(t: string) {
  return t.toLowerCase().replace(/-/g, "");
}

// Runs AFTER response is sent — never blocks the user
async function syncStepsBackground(journeyId: string, configType: string) {
  try {
    const rawJSON = ConfigLoader.loadJourneyJSON(
      `data/visa-category/${configType}.json`
    );
    const [existingChapters, existingSteps] = await Promise.all([
      db.getChaptersForJourneyDB(journeyId),
      db.getStepsForJourneyDB(journeyId),
    ]);
    const existingKeys = new Set(existingSteps.map((s) => s.step_key));

    for (const rawChapter of rawJSON.chapters) {
      const dbChapter = existingChapters.find(
        (ch) => ch.chapter_key === rawChapter.chapter_key
      );
      if (!dbChapter) continue;

      const stepsInput = ConfigLoader.transformStepsInput(
        rawChapter.steps,
        rawChapter.chapter_key
      );
      const newSteps = stepsInput.filter((s) => !existingKeys.has(s.step_key));

      // Batch inserts — parallel instead of sequential
      await Promise.all(
        newSteps.map((stepInput) =>
          db.createStepDB(dbChapter.id, stepInput).catch(() => {})
        )
      );
    }
  } catch {
    // sync is non-critical — ignore errors
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Shared context to avoid redundant auth calls in data-access
    const dbClient = { supabase, user };

    const { journey_type } = await req.json();
    if (!journey_type) {
      return NextResponse.json(
        { error: "journey_type is required" },
        { status: 400 }
      );
    }

    const bustCache = req.headers.get("x-cache-bust") === "1";
    const cacheKey = `${user.id}_${normType(journey_type)}`;

    // ── Server cache hit — return immediately (repeat visits ~200ms) ──────────
    if (!bustCache) {
      const cached = serverCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return NextResponse.json(
          { success: true, data: cached.data, fromCache: true },
          {
            headers: {
              "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
            },
          }
        );
      }
    } else {
      serverCache.delete(cacheKey);
    }

    // ── Find or create journey ────────────────────────────────────────────────
    const allJourneys = await db.getAllJourneysDB(undefined, dbClient);
    const normalizedQuery = normType(journey_type);
    const existing = allJourneys.find(
      (j) => normType(j.journey_type) === normalizedQuery
    );

    let journeyId: string;
    const configType =
      normalizedQuery === "ir1" ? "ir-1" : journey_type.toLowerCase();

    if (existing) {
      journeyId = existing.id;
    } else {
      const configPath = `data/visa-category/${configType}.json`;
      try {
        const result = await journeyService.createJourneyFromConfig(configPath);
        journeyId = result.journey.id;
      } catch (createErr: any) {
        // Race condition: another tab already created it
        if (
          createErr?.message?.includes("unique") ||
          createErr?.message?.includes("duplicate")
        ) {
          const retryJourneys = await db.getAllJourneysDB(undefined, dbClient);
          const retried = retryJourneys.find(
            (j) => normType(j.journey_type) === normalizedQuery
          );
          if (!retried) throw createErr;
          journeyId = retried.id;
        } else {
          throw createErr;
        }
      }
    }

    // ── Schedule sync AFTER response — does not block the user ───────────────
    after(() => syncStepsBackground(journeyId, configType));

    // ── Fetch all needed data in parallel ─────────────────────────────────────
    const [journeyRow, stepsRows, caseDataRows] = await Promise.all([
      db.getJourneyDB(journeyId, dbClient),
      db.getStepsForJourneyDB(journeyId, undefined, dbClient),
      db.getCaseDataForJourneyDB(journeyId, undefined, dbClient),
    ]);

    if (!journeyRow) {
      return NextResponse.json(
        { error: "Journey not found after initialization" },
        { status: 500 }
      );
    }

    const responseData = {
      journey: journeyRow,
      steps: stepsRows,
      case_data: caseDataRows,
    };

    // ── Update server cache ───────────────────────────────────────────────────
    serverCache.set(cacheKey, { data: responseData, cachedAt: Date.now() });

    return NextResponse.json(
      { success: true, data: responseData },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[/api/journeys/initialize] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Initialization failed",
      },
      { status: 500 }
    );
  }
}
