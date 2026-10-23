import type { SupabaseClient } from "@supabase/supabase-js";
import { canUse } from "@/lib/entitlements/helpers";
import { normalizePlanTier, type PlanTier } from "@/lib/entitlements/config";
import { resolveOwnedJourney, type JourneyRef } from "@/lib/journey/resolveOwnedJourney";
import { getServiceRoleClient } from "@/lib/api/authGuards";
import { consumeFeatureCredit } from "@/lib/usage/consumeFeatureCredit";

export type JourneyServiceAccess =
  | { allowed: true; journeyId: string; journeyType: string; tier: PlanTier; addons: string[] }
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

  const tier = normalizePlanTier(journey.subscription_tier);
  if (!canUse(feature, tier, addons)) {
    return {
      allowed: false,
      status: 403,
      error: "This service is not included in your journey plan. Upgrade the journey to use it.",
    };
  }
  return { allowed: true, journeyId: journey.id, journeyType: journey.journey_type, tier, addons };
}

const INCLUDED_LABEL: Readonly<Record<string, string>> = {
  expert_consultation: "consultations",
  medical_booking: "medical bookings",
  pcc_filing: "PCC filings",
  document_translation: "translations",
};

export type JourneyServiceUseRefusal = { status: 403 | 500; error: string; code?: string };

/**
 * Spends one use of a journey service the plan includes a set number of (Executive:
 * 2 consultations; Premium and below: 1 per add-on bought). Unlimited access spends
 * nothing. Call it AFTER the request row is saved, so a failed save never costs a
 * use; on a refusal the caller removes the row it just saved. Returns null when the
 * request may stand.
 */
export async function spendJourneyServiceUse(
  userId: string,
  feature: string,
  access: { tier: PlanTier; addons: string[] }
): Promise<JourneyServiceUseRefusal | null> {
  const spent = await consumeFeatureCredit(
    getServiceRoleClient(),
    userId,
    feature,
    access.tier,
    access.addons
  );
  if (spent.ok) return null;
  if (spent.reason === "rpc_failed") {
    return { status: 500, error: "We could not save your request. Please try again." };
  }
  const label = INCLUDED_LABEL[feature] ?? "requests";
  return {
    status: 403,
    code: "SERVICE_LIMIT_REACHED",
    error: `You have used all the ${label} included in this journey plan. You can still request one from the Services page with credits.`,
  };
}
