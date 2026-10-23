import type { SupabaseClient } from "@supabase/supabase-js";
import { canUse } from "@/lib/entitlements/helpers";
import { normalizePlanTier } from "@/lib/entitlements/config";
import { resolveOwnedJourney, type JourneyRef } from "@/lib/journey/resolveOwnedJourney";

export type JourneyServiceAccess =
  | { allowed: true; journeyId: string; journeyType: string }
  | { allowed: false; status: 403 | 404; error: string };

/**
 * A request tagged `source: "journey"` is covered by that journey's plan instead of
 * being paid for, so the tag alone is never trusted: the journey must belong to the
 * user, still be active, and its tier (plus account add-ons, like useJourneyPlan)
 * must include `feature`. Fails closed.
 */
export async function verifyJourneyServiceAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  ref: JourneyRef
): Promise<JourneyServiceAccess> {
  const journey = await resolveOwnedJourney(supabase, userId, ref);
  if (!journey) {
    return { allowed: false, status: 404, error: "Journey not found" };
  }
  if (journey.status && !["in_progress", "not_started"].includes(journey.status)) {
    return { allowed: false, status: 403, error: "This journey is no longer active." };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("profile_details")
    .eq("id", userId)
    .maybeSingle();
  const raw = profile?.profile_details?.purchased_addons;
  const addons = Array.isArray(raw)
    ? raw.filter((a: unknown): a is string => typeof a === "string")
    : [];

  if (!canUse(feature, normalizePlanTier(journey.subscription_tier), addons)) {
    return {
      allowed: false,
      status: 403,
      error: "This service is not included in your journey plan. Upgrade the journey to use it.",
    };
  }
  return { allowed: true, journeyId: journey.id, journeyType: journey.journey_type };
}
