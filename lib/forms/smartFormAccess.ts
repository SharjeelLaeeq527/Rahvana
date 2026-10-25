import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanTier } from "@/lib/entitlements/config";
import { canUse } from "@/lib/entitlements/helpers";
import { resolveOwnedJourney, type JourneyRef } from "@/lib/journey/resolveOwnedJourney";
import { hasStandaloneAccess } from "@/lib/wallet/state";

export const SMART_FORM_FEATURE = "smart_form_filler";
export const SMART_FORM_WALLET_TOOL = "form-forge";

export type SmartFormScopeInput = JourneyRef & { scope?: unknown };

/**
 * Whether this user may generate the FULL filled PDF (otherwise page 1 only).
 * Same split as the client (MultiStepForm):
 * - journey: the journey's own plan tier (+ account add-ons, like useJourneyPlan);
 *   the journey must belong to the user.
 * - standalone (default): a wallet unlock or a permanent legacy "smart" add-on.
 *   The plan tier does not count: standalone tools are paid with credits.
 * Fails closed.
 */
export async function canGenerateFullSmartForm(
  supabase: SupabaseClient,
  userId: string,
  purchasedAddons: readonly unknown[],
  input: SmartFormScopeInput
): Promise<boolean> {
  if (input.scope === "journey") {
    const journey = await resolveOwnedJourney(supabase, userId, input);
    if (!journey) return false;
    const addons = purchasedAddons.filter((a): a is string => typeof a === "string");
    return canUse(SMART_FORM_FEATURE, normalizePlanTier(journey.subscription_tier), addons);
  }
  return hasStandaloneAccess(supabase, userId, "tool", SMART_FORM_WALLET_TOOL, purchasedAddons);
}
