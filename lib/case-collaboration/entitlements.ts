// lib/case-collaboration/entitlements.ts
// Entitlement resolution for the shared case (spec §6).
//
// MODEL: "best plan in the case wins" (owner decision 2026-06-19). Both spouses
// are self-sufficient — EITHER can buy/upgrade on their own account, and the
// whole shared case gets the BEST tier + the UNION of every member's add-ons.
// So if the beneficiary has Premium and the petitioner buys Executive, both see
// Executive. (Previously only the case OWNER's plan counted; that locked the
// partner out of upgrading.)
//
// This MUST run server-side with the service-role client: a member cannot read
// the other member's `user_profiles` row through RLS, so a client-side lookup
// would always fail. Resolution is LIVE (read on every call) — never snapshotted
// — so if a member downgrades or lapses, the effective plan recomputes at once.

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveActiveJourneyId } from "@/lib/case-collaboration/helpers";

// Tier ranking for the MAX comparison. DB stores either the canonical names or
// the legacy aliases (core/plus/pro), mirrored from PlanContext's DB_TIER_MAP.
const TIER_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  core: 1,
  premium: 2,
  plus: 2,
  executive: 3,
  pro: 3,
};
function tierRank(raw: string | null | undefined): number {
  return TIER_RANK[String(raw ?? "").trim().toLowerCase()] ?? 0;
}

export interface EffectivePlan {
  /** Raw DB tier string (e.g. "premium", "pro", "free"). Client normalizes. */
  subscriptionTier: string | null;
  /** Add-on IDs unlocked for this case (owner's, when inherited). */
  purchasedAddons: string[];
  /** True when these entitlements came from the case owner, not the user's own
   *  account (i.e. the caller is an invited partner). */
  isInherited: boolean;
}

const FREE_PLAN: EffectivePlan = {
  subscriptionTier: "free",
  purchasedAddons: [],
  isInherited: false,
};

/** Read a profile's tier + purchased add-ons. Returns FREE shape on any miss. */
async function readProfilePlan(
  admin: SupabaseClient,
  userId: string,
  isInherited: boolean
): Promise<EffectivePlan> {
  const { data, error } = await admin
    .from("user_profiles")
    .select("subscription_tier, profile_details")
    .eq("id", userId)
    .single();

  if (error || !data) return { ...FREE_PLAN, isInherited };

  const details = (data.profile_details ?? null) as Record<string, unknown> | null;
  const addons = details?.purchased_addons;

  return {
    subscriptionTier: data.subscription_tier ?? "free",
    purchasedAddons: Array.isArray(addons) ? (addons as string[]) : [],
    isInherited,
  };
}

/**
 * Resolve the plan that applies to `userId` right now using the "best plan in
 * the case wins" model:
 *   - Find the shared case the user belongs to (their own journey, else the case
 *     they were invited to — same resolution the rest of the app uses).
 *   - The effective plan = the HIGHEST tier among all active members + the UNION
 *     of every member's purchased add-ons.
 *   - Solo / no-case users just get their own plan.
 *
 * `isInherited` is true when the effective plan is BETTER than the user's own
 * account (i.e. a spouse's purchase is lifting them) — useful for a "shared with
 * your spouse" hint.
 *
 * `admin` must be a service-role client (bypasses RLS). Fails safe to the user's
 * own plan on any lookup error.
 */
export async function resolveEffectivePlan(
  admin: SupabaseClient,
  userId: string
): Promise<EffectivePlan> {
  // The user's own plan — baseline + the fallback if anything below fails.
  const ownPlan = await readProfilePlan(admin, userId, false);

  // Which shared case is this user part of? (own journey, else collaborator)
  let journeyId: string | null = null;
  try {
    journeyId = await resolveActiveJourneyId(admin, userId);
  } catch {
    journeyId = null;
  }
  if (!journeyId) return ownPlan;

  // Collect every member of the case: the user, the journey owner, and all
  // active collaborators. (Owner may not have a collaborators row yet, so add
  // it explicitly.)
  const memberIds = new Set<string>([userId]);
  try {
    const { data: jrow } = await admin
      .from("journeys")
      .select("user_id")
      .eq("id", journeyId)
      .maybeSingle();
    const ownerId = (jrow as { user_id: string } | null)?.user_id;
    if (ownerId) memberIds.add(ownerId);

    const { data: collabs } = await admin
      .from("case_collaborators")
      .select("user_id")
      .eq("journey_id", journeyId)
      .eq("status", "active");
    ((collabs as Array<{ user_id: string }>) || []).forEach((c) => memberIds.add(c.user_id));
  } catch {
    return ownPlan;
  }

  // Solo case (just this user) → nothing to merge.
  if (memberIds.size <= 1) return ownPlan;

  // Read every member's plan in one query and compute MAX tier + union add-ons.
  const { data: profiles, error } = await admin
    .from("user_profiles")
    .select("id, subscription_tier, profile_details")
    .in("id", Array.from(memberIds));

  if (error || !profiles) return ownPlan;

  let bestTier = "free";
  let bestRank = -1;
  const addonSet = new Set<string>();

  for (const p of profiles as Array<{
    id: string;
    subscription_tier: string | null;
    profile_details: Record<string, unknown> | null;
  }>) {
    const t = p.subscription_tier ?? "free";
    const r = tierRank(t);
    if (r > bestRank) {
      bestRank = r;
      bestTier = t;
    }
    const ad = p.profile_details?.purchased_addons;
    if (Array.isArray(ad)) (ad as string[]).forEach((a) => addonSet.add(a));
  }

  const purchasedAddons = Array.from(addonSet);

  // Inherited = the case plan beats the user's own account (a spouse is lifting
  // them), either by tier or by an add-on they don't personally own.
  const ownAddons = new Set(ownPlan.purchasedAddons);
  const gainedAddon = purchasedAddons.some((a) => !ownAddons.has(a));
  const isInherited = bestRank > tierRank(ownPlan.subscriptionTier) || gainedAddon;

  return { subscriptionTier: bestTier, purchasedAddons, isInherited };
}
