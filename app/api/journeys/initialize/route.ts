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
import {
  canonicalJourneyKey,
  resolveCandidateJourneyKey,
} from "@/lib/candidate/candidateKeys";
import { journeyConfigKeyFor } from "@/lib/journey/journeyConfig";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasPaidTierHint, verifyJourneyTierWithStripe } from "@/lib/plan/journeyTierRepair";
import type { CandidateProfile } from "@/types/candidate";

// ── In-memory server cache (resets on cold start, fine for Vercel) ───────────
const serverCache = new Map<string, { data: any; cachedAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

// A paid-tier hint that Stripe did not confirm is not re-checked for a while, so a
// forged hint cannot turn every page load into a Stripe API call.
const unverifiedHints = new Map<string, number>();
const UNVERIFIED_TTL_MS = 10 * 60_000;
function recentlyUnverified(userId: string, key: string): boolean {
  const at = unverifiedHints.get(`${userId}:${key}`);
  return at !== undefined && Date.now() - at < UNVERIFIED_TTL_MS;
}
function markUnverified(userId: string, key: string): void {
  unverifiedHints.set(`${userId}:${key}`, Date.now());
}

// Shared with post-payment provisioning so every seeding path loads the same config
// (CR-2 reuses ir-2.json instead of looking for a cr-2.json that does not exist).
function configTypeFromJourneyType(journeyType: string) {
  return journeyConfigKeyFor(journeyType);
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

    const { journey_type, candidate_id, journey_db_id } = await req.json();
    if (!journey_type) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journey_type]" }) },
        { status: 400 }
      );
    }

    // ── Resolve the journey key from the roster (server backstop) ─────────────
    // The URL category is authoritative. A candidate from the same pool selects its own
    // slot key; a candidate from another pool (stale active candidate, forged id) is
    // resolved to the category's slot-1 key, so no stray row such as `ir5_candidate3`
    // is ever created for an IR-2 child.
    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", user.id)
      .maybeSingle();
    const profileDetails = (profileRow?.profile_details || {}) as Record<string, unknown>;
    const roster: CandidateProfile[] = Array.isArray(profileDetails.candidates)
      ? (profileDetails.candidates as CandidateProfile[])
      : [];

    const effectiveJourneyType = resolveCandidateJourneyKey(roster, journey_type, candidate_id);
    if (!effectiveJourneyType) {
      return NextResponse.json({ error: "Unknown journey type." }, { status: 400 });
    }

    const bustCache = req.headers.get("x-cache-bust") === "1";
    const cacheKey = `${user.id}_${effectiveJourneyType}_${journey_db_id || ""}`;

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

    // ── Find the journey row: exact canonical key only ────────────────────────
    // Variant rows of the same journey ("ir5", "ir5-journey", "IR5", "ir5_candidate-1")
    // share one canonical key; other candidates' rows never match.
    const allJourneys = await db.getAllJourneysDB(undefined, dbClient);
    const sameKey = (j: { journey_type: string }) =>
      canonicalJourneyKey(j.journey_type) === effectiveJourneyType;

    let existing: (typeof allJourneys)[number] | undefined;

    // 1. Direct DB id (My Journeys) - only when it is the resolved journey.
    if (journey_db_id) {
      existing = allJourneys.find((j) => j.id === journey_db_id && sameKey(j));
    }

    // 2. Canonical key lookup. Prefer a paid row, then one with progress.
    if (!existing) {
      const matches = allJourneys.filter(sameKey);
      existing =
        matches.find(
          (j) => j.subscription_tier && j.subscription_tier.toLowerCase() !== "free"
        ) ||
        matches.find((j) => (j.completed_steps_count ?? 0) > 0) ||
        matches[0];
    }

    // ── Plan tier: the journey row is the only source of access ───────────────
    // The roster tier and the legacy stored journeyTiers map are client-writable
    // history, so they are only a hint to ask Stripe. A tier is written only when a
    // live Stripe plan confirms it, and only with the service-role client (S1).
    let resolvedPaidTier: string | null = null;
    const existingTier = (existing?.subscription_tier || "").toLowerCase();
    if (existing && existingTier && existingTier !== "free") {
      resolvedPaidTier = existingTier;
    } else if (
      hasPaidTierHint(profileDetails, roster, effectiveJourneyType) &&
      !recentlyUnverified(user.id, effectiveJourneyType)
    ) {
      try {
        const verified = await verifyJourneyTierWithStripe({
          admin: supabaseAdmin,
          userId: user.id,
          journeyKey: effectiveJourneyType,
          journeyRowId: existing?.id ?? null,
          roster,
        });
        if (!verified) {
          markUnverified(user.id, effectiveJourneyType);
        } else {
          let rowId = existing?.id ?? null;
          if (!rowId) {
            const created = await journeyService.createJourneyFromConfig(
              `data/visa-category/${configTypeFromJourneyType(journey_type)}.json`,
              { journey_type: effectiveJourneyType },
              dbClient
            );
            rowId = created?.journey?.id ?? null;
          }
          if (rowId) {
            const { error: repairError } = await supabaseAdmin
              .from("journeys")
              .update({
                subscription_tier: verified.tier,
                stripe_subscription_id: verified.subscriptionId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", rowId)
              .eq("user_id", user.id);
            if (!repairError) {
              resolvedPaidTier = verified.tier;
              const refreshed = await db.getAllJourneysDB(undefined, dbClient);
              existing = refreshed.find((j) => j.id === rowId) ?? existing;
              if (existing) existing.subscription_tier = verified.tier;
            }
          }
        }
      } catch (repairErr) {
        console.warn("[initialize] Stripe tier repair skipped:", repairErr);
      }
    }

    const isPaid = Boolean(resolvedPaidTier);

    // Free plan users can preview Step 1, but NO journey record should be added to the DB
    if (!isPaid) {
      // Do NOT cache virtual free journeys in serverCache so subsequent visits check freshly
      serverCache.delete(cacheKey);

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

      return NextResponse.json(
        { success: true, data: responseData },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
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
          { journey_type: effectiveJourneyType },
          dbClient
        );
        journeyId = result.journey.id;
      } catch (createErr: any) {
        // Race condition: another tab already created it
        if (createErr?.message?.includes("unique") || createErr?.message?.includes("duplicate")) {
          const retryJourneys = await db.getAllJourneysDB(undefined, dbClient);
          const retried = retryJourneys.find(sameKey);
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

    if (
      resolvedPaidTier &&
      (!journeyRow.subscription_tier || journeyRow.subscription_tier.toLowerCase() === "free")
    ) {
      journeyRow.subscription_tier = resolvedPaidTier;
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
