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
import { decrypt } from "@/lib/encryption";
import { E, msg } from "@/lib/errors";
import { getCandidateJourneyKey, getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";

// ── In-memory server cache (resets on cold start, fine for Vercel) ───────────
const serverCache = new Map<string, { data: any; cachedAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function normType(t: string) {
  return t.toLowerCase().replace(/[-:_]/g, "");
}

function configTypeFromJourneyType(journeyType: string) {
  const base = getBaseVisaCategory(journeyType);
  return base.toLowerCase();
}

// Runs to ensure all chapters and steps from the config JSON exist in the DB
async function syncChaptersAndSteps(
  journeyId: string,
  configType: string,
  dbClient?: { supabase: any; user: any }
) {
  try {
    const rawJSON = ConfigLoader.loadJourneyJSON(`data/visa-category/${configType}.json`);
    const [existingChapters, existingSteps] = await Promise.all([
      db.getChaptersForJourneyDB(journeyId, undefined, dbClient),
      db.getStepsForJourneyDB(journeyId, undefined, dbClient),
    ]);
    const existingKeys = new Set(existingSteps.map((s) => s.step_key));
    const chaptersInput = ConfigLoader.transformChaptersInput(rawJSON.chapters);

    for (let i = 0; i < rawJSON.chapters.length; i++) {
      const rawChapter = rawJSON.chapters[i];
      let dbChapter = existingChapters.find((ch) => ch.chapter_key === rawChapter.chapter_key);

      if (!dbChapter) {
        try {
          dbChapter = await db.createChapterDB(journeyId, chaptersInput[i], dbClient);
        } catch (chapterErr) {
          console.error(`[initialize] Failed to create chapter ${rawChapter.chapter_key}:`, chapterErr);
          continue;
        }
      }

      const stepsInput = ConfigLoader.transformStepsInput(rawChapter.steps, rawChapter.chapter_key);
      const newSteps = stepsInput.filter((s) => !existingKeys.has(s.step_key));

      if (newSteps.length > 0 && dbChapter) {
        await db.createStepsBatchDB(dbChapter.id, newSteps, dbClient).catch((err) => {
          console.error(`[initialize] Failed to batch create steps for chapter ${rawChapter.chapter_key}:`, err);
        });
      }
    }
  } catch (err) {
    console.error(`[initialize] syncChaptersAndSteps error for ${configType}:`, err);
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
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Shared context to avoid redundant auth calls in data-access
    const dbClient = { supabase, user };

    const { journey_type, candidate_id } = await req.json();
    if (!journey_type) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journey_type]" }) },
        { status: 400 }
      );
    }

    // Resolve effective journey type key (candidate-isolated)
    const effectiveJourneyType = getCandidateJourneyKey(journey_type, candidate_id);

    const bustCache = req.headers.get("x-cache-bust") === "1";
    const cacheKey = `${user.id}_${normType(effectiveJourneyType)}`;

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
    const normalizedQuery = normType(effectiveJourneyType);
    const existing = allJourneys.find((j) => {
      const normJ = normType(j.journey_type);
      if (normJ === normalizedQuery) return true;
      // Handle legacy match if journey_type had extra suffix
      if (candidate_id && candidate_id !== "candidate-1" && normJ.includes(normType(candidate_id))) {
        return true;
      }
      return false;
    });

    // ── Check if user has other than free journey plan for this specific journey ──
    const existingTier = (existing?.subscription_tier || "").toLowerCase();
    const isExistingPaid = Boolean(existing && existingTier && existingTier !== "free");

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", user.id)
      .maybeSingle();

    const candidates = (profileRow?.profile_details as any)?.candidates || [];
    const matchedCand =
      candidates.find((c: any) => c.id === candidate_id) ||
      (candidate_id === "candidate-1" ? candidates[0] : null);
    const candTier = (matchedCand?.tier || "").toLowerCase();
    const isCandPaid = Boolean(candTier && candTier !== "free");

    const isPaid = isExistingPaid || isCandPaid;

    // Free plan users can preview Step 1, but NO journey record should be added to the DB
    if (!isPaid) {
      // If a legacy empty free journey exists in DB, clean it up so it does not linger
      if (
        existing &&
        (!existing.subscription_tier || existing.subscription_tier === "free") &&
        (!existing.completed_steps_count || existing.completed_steps_count === 0)
      ) {
        try {
          await supabase.from("journeys").delete().eq("id", existing.id);
        } catch (delErr) {
          console.warn("[initialize] Cleaned up legacy default free journey:", delErr);
        }
      }

      const virtualJourney = {
        id: null,
        user_id: user.id,
        journey_type: effectiveJourneyType,
        subscription_tier: "free",
        filing_method: "online",
        status: "not_started",
        completed_steps_count: 0,
        total_steps_count: 0,
        completion_percentage: 0,
        metadata: {},
        tracking_status: {},
      };

      const responseData = {
        journey: virtualJourney,
        steps: [],
        case_data: [],
      };

      serverCache.set(cacheKey, { data: responseData, cachedAt: Date.now() });

      return NextResponse.json(
        { success: true, data: responseData },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          },
        }
      );
    }

    let journeyId: string;
    const configType = configTypeFromJourneyType(journey_type);

    if (existing) {
      journeyId = existing.id;
    } else {
      const configPath = `data/visa-category/${configType}.json`;
      try {
        const result = await journeyService.createJourneyFromConfig(
          configPath,
          {
            journey_type: effectiveJourneyType,
            subscription_tier: candTier || "diy",
          },
          dbClient
        );
        journeyId = result.journey.id;
      } catch (createErr: any) {
        // Race condition: another tab already created it
        if (createErr?.message?.includes("unique") || createErr?.message?.includes("duplicate")) {
          const retryJourneys = await db.getAllJourneysDB(undefined, dbClient);
          const retried = retryJourneys.find((j) => normType(j.journey_type) === normalizedQuery);
          if (!retried) throw createErr;
          journeyId = retried.id;
        } else {
          throw createErr;
        }
      }
    }

    // ── Fetch all needed data in parallel ─────────────────────────────────────
    let [journeyRow, stepsRows, caseDataRows] = await Promise.all([
      db.getJourneyDB(journeyId, dbClient),
      db.getStepsForJourneyDB(journeyId, undefined, dbClient),
      db.getCaseDataForJourneyDB(journeyId, undefined, dbClient),
    ]);

    // If journey existed but has 0 steps or missing chapters, sync synchronously so client gets full stepMap
    if (!stepsRows || stepsRows.length === 0) {
      await syncChaptersAndSteps(journeyId, configType, dbClient);
      stepsRows = await db.getStepsForJourneyDB(journeyId, undefined, dbClient);
    } else {
      // Otherwise schedule non-blocking background sync for any newly added steps
      after(() => syncChaptersAndSteps(journeyId, configType, dbClient));
    }

    // Decrypt sensitive fields in case_data before returning to client
    if (caseDataRows) {
      caseDataRows.forEach((item: any) => {
        if (item && typeof item.data_value === "string" && item.data_value.startsWith("gcm:")) {
          try {
            item.data_value = decrypt(item.data_value);
          } catch (e) {
            console.error("Failed to decrypt case data:", item.data_key, e);
          }
        }
      });
    }

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
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
