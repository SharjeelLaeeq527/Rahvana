import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanTier } from "@/lib/entitlements/config";
import { canUse } from "@/lib/entitlements/helpers";
import { resolveOwnedJourney } from "@/lib/journey/resolveOwnedJourney";

/** Live USCIS status inside a journey is the same plan feature as the roadmap step's tracking. */
export const USCIS_JOURNEY_FEATURE = "tracker_reminders";

/**
 * May this user run a live USCIS lookup FOR this journey (the dashboard's
 * "Check USCIS")? Uses the journey's own plan tier plus the account's add-ons,
 * like `useJourneyPlan`. Fails closed: an unknown or foreign journey is false.
 *
 * Lookups without a journey (the standalone Case Status tool) are not gated
 * here; that tool is free.
 */
export async function canCheckUscisForJourney(
  supabase: SupabaseClient,
  userId: string,
  journeyId: string
): Promise<boolean> {
  const journey = await resolveOwnedJourney(supabase, userId, { journeyId });
  if (!journey) return false;
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("profile_details")
    .eq("id", userId)
    .maybeSingle();
  const raw = profile?.profile_details?.purchased_addons;
  const addons = Array.isArray(raw) ? raw.filter((a: unknown): a is string => typeof a === "string") : [];
  return canUse(USCIS_JOURNEY_FEATURE, normalizePlanTier(journey.subscription_tier), addons);
}
