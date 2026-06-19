// lib/case-collaboration/entitlements.ts
// Phase 4 — entitlement inheritance for the shared case (spec §6).
//
// The invited spouse's OWN account is free with no add-ons. When they are an
// active *partner* on a shared case, their entitlements must resolve against the
// case OWNER's profile (tier + purchased add-ons) — NOT their own.
//
// This MUST run server-side with the service-role client: a partner cannot read
// the owner's `user_profiles` row through RLS, so a client-side lookup would
// always fail. Resolution is LIVE (read on every call) — never snapshotted —
// so if the owner downgrades or lapses, the partner immediately drops with them.

import type { SupabaseClient } from "@supabase/supabase-js";

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
 * Resolve the plan that applies to `userId` right now, accounting for shared-case
 * membership:
 *   - If the user is an ACTIVE PARTNER on a case → the case OWNER's plan.
 *   - Otherwise → the user's own plan.
 *
 * `admin` must be a service-role client (bypasses RLS). Fails safe to the user's
 * own plan if the partner/owner lookup errors.
 */
export async function resolveEffectivePlan(
  admin: SupabaseClient,
  userId: string
): Promise<EffectivePlan> {
  // 1. Is this user an active partner on someone else's case?
  const { data: membership, error: memberErr } = await admin
    .from("case_collaborators")
    .select("journey_id")
    .eq("user_id", userId)
    .eq("membership_role", "partner")
    .eq("status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // On lookup error, fall back to the user's own plan (fail safe, never crash).
  if (memberErr || !membership?.journey_id) {
    return readProfilePlan(admin, userId, false);
  }

  // 2. Find that case's owner and inherit their LIVE plan.
  const { data: journey, error: journeyErr } = await admin
    .from("journeys")
    .select("user_id")
    .eq("id", membership.journey_id)
    .single();

  if (journeyErr || !journey?.user_id) {
    return readProfilePlan(admin, userId, false);
  }

  // Defensive: if the owner row somehow points back at this user, that's not an
  // inherited plan — read it as their own.
  const ownerId = journey.user_id as string;
  if (ownerId === userId) {
    return readProfilePlan(admin, userId, false);
  }

  return readProfilePlan(admin, ownerId, true);
}
