// lib/candidate/candidateProvisioningService.ts
// ============================================================================
// Multi-Candidate & Document Vault Auto-Provisioning Service
//
// Automatically provisions candidate profiles, their dedicated candidate journeys in
// Supabase, and their isolated Document Vault configurations upon successful journey
// checkout or plan activation.
// ============================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { createNewCandidate, isMultiCandidateCategory } from "./candidateSyncService";
import {
  canonicalJourneyKey,
  candidateIdNumber,
  categoryPrimaryOf,
  getCandidateSlot,
  getJourneyKeyForCandidate,
  isSamePool,
  journeyKeyForSlot,
  poolMembers,
} from "./candidateKeys";
import { CANDIDATE_ID_HIGH_WATER_KEY, loadAllocationState } from "./candidateAllocation";
import type { CandidateProfile, CandidateRelation, CandidateTier } from "@/types/candidate";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { journeyService } from "@/lib/journey/service";
import {
  hasJourneyConfig,
  journeyBaseCategory,
  journeyConfigPathFor,
} from "@/lib/journey/journeyConfig";

/**
 * Config a paid journey is seeded from. Categories without their own config keep the
 * historical default (ir-1.json) so nothing outside IR-1 / IR-2 / IR-5 changes.
 */
function provisioningConfigPath(canonicalVisa: string): string {
  return hasJourneyConfig(canonicalVisa)
    ? journeyConfigPathFor(canonicalVisa)
    : "data/visa-category/ir-1.json";
}

/** Defaults for a pool's first candidate (IR-1 / IR-5 values are unchanged). */
function primaryCandidateDefaults(canonicalVisa: string): {
  relation: CandidateRelation;
  colorTag: CandidateProfile["colorTag"];
} {
  if (canonicalVisa === "IR-5") return { relation: "Other", colorTag: "purple" };
  if (canonicalVisa === "IR-2") return { relation: "Child", colorTag: "blue" };
  return { relation: "Spouse", colorTag: "emerald" };
}

export interface ProvisionCandidatesParams {
  supabase: SupabaseClient;
  userId: string;
  visaCategory: string;
  candidateCount: number;
  tier: string;
  stripeSubscriptionId?: string;
  isAddCandidate?: boolean;
  targetCandidateId?: string;
  isUpgrade?: boolean;
}

export interface ProvisionResult {
  success: boolean;
  provisionedCandidates: CandidateProfile[];
  primaryJourneyId?: string;
  candidateJourneyIds: Record<string, string>;
  error?: string;
}

type JourneyRow = { id: string; journey_type: string; subscription_tier: string | null };

/**
 * Provisions candidates, journeys and vaults for a confirmed purchase. Runs with the
 * service-role client (verify-session / webhook).
 *
 * Everything is scoped to the purchased category's POOL (IR-5 | IR-2 + CR-2 | ...):
 *  - The plan is stamped on the target candidate's journey: `targetCandidateId` when it
 *    belongs to the pool, otherwise the pool's slot-1 candidate (base journey). A
 *    candidate of ANOTHER category is never touched, so buying IR-2 on an IR-5 account
 *    no longer upgrades IR-5 candidate 1.
 *  - A pool without candidates gets a new slot-1 candidate (new account-wide id), which
 *    adopts the purchased base journey.
 *  - Add-candidate purchases append new candidates with fresh ids and the lowest free
 *    slots (never a slot whose journey still holds data).
 *  - Every vault is created with the purchased category (CR-2 -> IR-2), never "IR-5".
 */
export async function provisionCandidateJourneysAndVaults({
  supabase,
  userId,
  visaCategory,
  candidateCount = 1,
  tier,
  stripeSubscriptionId,
  isAddCandidate = false,
  targetCandidateId,
  isUpgrade = false,
}: ProvisionCandidatesParams): Promise<ProvisionResult> {
  try {
    const isMultiCandidate = isMultiCandidateCategory(visaCategory);
    // CR-2 is provisioned as the IR-2 journey (same config, journey_type and candidate keys).
    const canonicalVisa = journeyBaseCategory(visaCategory);
    const baseKey = journeyKeyForSlot(canonicalVisa, 1);
    const effectiveCount = isMultiCandidate ? Math.max(1, candidateCount) : 1;
    const configPath = provisioningConfigPath(canonicalVisa);
    const now = () => new Date().toISOString();

    const dbStorage = new DocumentDatabaseStorage(supabase);

    // ── 0. Roster + existing rows ─────────────────────────────────────────────
    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", userId)
      .maybeSingle();

    const profileDetails = (profileRow?.profile_details || {}) as Record<string, unknown>;
    let roster: CandidateProfile[] = Array.isArray(profileDetails.candidates)
      ? [...(profileDetails.candidates as CandidateProfile[])]
      : [];

    const allocation = await loadAllocationState(supabase, userId, profileDetails, roster);
    let highWater = allocation.highWater;
    const blockedKeys = new Set(allocation.blockedKeys);
    const rows: JourneyRow[] = [...allocation.journeys];

    const rowForKey = (key: string): JourneyRow | undefined => {
      const matches = rows.filter((j) => canonicalJourneyKey(j.journey_type) === key);
      return (
        matches.find((j) => (j.subscription_tier || "free").toLowerCase() !== "free") ?? matches[0]
      );
    };

    /** Stamp the plan on the row for `key`, creating (and seeding) it when missing. */
    const stampJourney = async (key: string, resetSchedule: boolean): Promise<string | undefined> => {
      const payload: Record<string, unknown> = {
        subscription_tier: tier,
        stripe_subscription_id: stripeSubscriptionId || undefined,
        updated_at: now(),
      };
      // Reset the 12-month subscription schedule from the upgrade date.
      if (resetSchedule) payload.created_at = now();

      const existing = rowForKey(key);
      if (existing) {
        await supabase.from("journeys").update(payload).eq("id", existing.id);
        existing.subscription_tier = tier;
        return existing.id;
      }

      let journeyId: string | undefined;
      try {
        const created = await journeyService.createJourneyFromConfig(
          configPath,
          { journey_type: key },
          { supabase, user: { id: userId } }
        );
        journeyId = created?.journey?.id;
      } catch (err) {
        console.warn(`[provisioning] Error seeding journey config for ${key}:`, err);
      }

      if (!journeyId) {
        const { data: inserted } = await supabase
          .from("journeys")
          .insert({
            user_id: userId,
            journey_type: key,
            filing_method: "online",
            sponsor_structure: "individual",
            subscription_tier: tier,
            stripe_subscription_id: stripeSubscriptionId || undefined,
            status: "not_started",
          })
          .select("id")
          .single();
        journeyId = inserted?.id;
      } else {
        await supabase.from("journeys").update(payload).eq("id", journeyId);
      }
      if (journeyId) {
        rows.push({ id: journeyId, journey_type: key, subscription_tier: tier });
        blockedKeys.add(key);
      }
      return journeyId;
    };

    const ensureVault = async (journeyId: string, beneficiaryName: string) => {
      try {
        const existingVault = await dbStorage.getVaultConfig(userId, journeyId);
        if (!existingVault) {
          await dbStorage.saveVaultConfig({
            userId,
            visaCategory: canonicalVisa,
            journeyId,
            scenarioFlags: {},
            dynamicDocuments: {},
            beneficiaryName,
          });
        }
      } catch (err) {
        console.warn(`[provisioning] Vault init error for ${beneficiaryName} (non-fatal):`, err);
      }
    };

    const addPoolCandidate = (forcedSlot?: number): CandidateProfile => {
      const defaults = primaryCandidateDefaults(canonicalVisa);
      const candidate = createNewCandidate(roster, {
        relation: defaults.relation,
        visaCategory: canonicalVisa,
        highWater,
        blockedKeys,
        categorySlot: forcedSlot,
      });
      const added: CandidateProfile = {
        ...candidate,
        tier: tier as CandidateTier,
        colorTag: roster.length === 0 ? defaults.colorTag : candidate.colorTag,
      };
      roster = [...roster, added];
      highWater = Math.max(highWater, candidateIdNumber(added.id) ?? 0);
      return added;
    };

    const setRosterTier = (candidateId: string, resetSchedule: boolean) => {
      roster = roster.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              tier: tier as CandidateTier,
              isPreview: false,
              createdAt: resetSchedule ? now() : c.createdAt,
            }
          : c
      );
    };

    const candidateJourneyIds: Record<string, string> = {};

    // ── 1. The pool's base journey / the targeted candidate ───────────────────
    const baseRow = rowForKey(baseKey);
    const isBasePaid = Boolean(
      baseRow?.subscription_tier && baseRow.subscription_tier.toLowerCase() !== "free"
    );
    // Adding candidates to an existing roster happens only when requested AND the
    // pool's base journey is already paid; otherwise the purchase is for the target.
    const isAddingToExistingRoster = Boolean(isMultiCandidate && isAddCandidate && isBasePaid);

    let primaryJourneyId: string | undefined = baseRow?.id;

    if (!isAddingToExistingRoster) {
      const explicitTarget = targetCandidateId
        ? roster.find(
            (c) => c.id === targetCandidateId && isSamePool(c.visaCategory, canonicalVisa)
          )
        : undefined;
      let target: CandidateProfile | undefined =
        explicitTarget ?? categoryPrimaryOf(roster, canonicalVisa) ?? undefined;
      if (!target) {
        // No candidate in this pool yet (e.g. IR-2 bought before the child was added):
        // a new slot-1 candidate adopts the purchased base journey.
        target = addPoolCandidate(1);
      }
      const targetKey = getJourneyKeyForCandidate(target);
      const journeyId = await stampJourney(targetKey, isUpgrade);
      setRosterTier(target.id, isUpgrade);
      if (journeyId) {
        candidateJourneyIds[target.id] = journeyId;
        if (targetKey === baseKey) primaryJourneyId = journeyId;
        await ensureVault(journeyId, target.customName || target.label || "Candidate 1");
      }
    } else if (primaryJourneyId) {
      const owner = categoryPrimaryOf(roster, canonicalVisa);
      if (owner) candidateJourneyIds[owner.id] = primaryJourneyId;
      await ensureVault(primaryJourneyId, owner?.customName || owner?.label || "Candidate 1");
    }

    // ── 2. Additional candidates (multi-candidate categories) ─────────────────
    if (isMultiCandidate) {
      if (isAddingToExistingRoster) {
        // Append `effectiveCount` new candidates with fresh ids and free slots.
        for (let k = 0; k < effectiveCount; k++) {
          const added = addPoolCandidate();
          const journeyId = await stampJourney(getJourneyKeyForCandidate(added), false);
          if (journeyId) {
            candidateJourneyIds[added.id] = journeyId;
            await ensureVault(journeyId, added.label);
          }
        }
      } else if (effectiveCount > 1) {
        // A purchase covering N beneficiaries: the pool's slot-1 candidate was stamped
        // above; stamp the next existing pool members, then add new ones up to N.
        const others = poolMembers(roster, canonicalVisa)
          .filter((c) => getCandidateSlot(c) !== 1)
          .sort((a, b) => getCandidateSlot(a) - getCandidateSlot(b))
          .slice(0, effectiveCount - 1);
        for (const member of others) {
          const journeyId = await stampJourney(getJourneyKeyForCandidate(member), false);
          setRosterTier(member.id, false);
          if (journeyId) {
            candidateJourneyIds[member.id] = journeyId;
            await ensureVault(journeyId, member.customName || member.label);
          }
        }
        for (let k = others.length + 1; k < effectiveCount; k++) {
          const added = addPoolCandidate();
          const journeyId = await stampJourney(getJourneyKeyForCandidate(added), false);
          if (journeyId) {
            candidateJourneyIds[added.id] = journeyId;
            await ensureVault(journeyId, added.label);
          }
        }
      }
    }

    // ── 3. Save roster + account summary ──────────────────────────────────────
    const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };
    const highestRank = roster.reduce((max, c) => {
      const rank = TIER_RANK[(c.tier || "free").toLowerCase()] || 0;
      return Math.max(max, rank);
    }, TIER_RANK[(tier || "free").toLowerCase()] || 0);
    const highestTier =
      Object.keys(TIER_RANK).find((k) => TIER_RANK[k] === highestRank) || tier;

    await supabase
      .from("user_profiles")
      .update({
        subscription_tier: highestTier,
        subscription_status: "active",
        profile_details: {
          ...profileDetails,
          candidates: roster,
          activeCandidateId: profileDetails.activeCandidateId || roster[0]?.id || "candidate-1",
          [CANDIDATE_ID_HIGH_WATER_KEY]: highWater,
        },
        updated_at: now(),
      })
      .eq("id", userId);

    return {
      success: true,
      provisionedCandidates: roster,
      primaryJourneyId,
      candidateJourneyIds,
    };
  } catch (error: unknown) {
    console.error("[provisionCandidateJourneysAndVaults] Error:", error);
    return {
      success: false,
      provisionedCandidates: [],
      candidateJourneyIds: {},
      error: error instanceof Error ? error.message : "Unknown provisioning error",
    };
  }
}
