import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanTier, type PlanTier } from "@/lib/entitlements/config";
import { resolveOwnedJourney } from "@/lib/journey/resolveOwnedJourney";

/**
 * Where a usage check runs. The client only says WHERE it is; the server decides
 * the tier from data the user owns, never from a tier the client sends.
 * - "journey": the journey's own plan tier (journey ownership verified).
 * - "standalone": no plan tier at all (standalone tools are paid with credits);
 *   legacy purchased add-on credit pools still apply. Photo Booth also counts
 *   the photos bought with credits (`walletPack`, lib/wallet/photoBoothPack.ts).
 * - "account" (default, old callers): the account plan tier.
 */
export type UsageScope = "journey" | "standalone" | "account";

export type UsageScopeInput = {
  scope?: string | null;
  journeyId?: string | null;
  journeyCategory?: string | null;
  candidateId?: string | null;
};

export type UsageTierResult =
  | { ok: true; scope: UsageScope; tier: PlanTier; walletPack: boolean }
  | { ok: false; status: 403; message: string };

/** Usage-metered features whose standalone uses are bought in credit packs. */
const STANDALONE_WALLET_PACK_FEATURES: ReadonlySet<string> = new Set(["photo_booth"]);

export function parseUsageScope(scope: unknown): UsageScope {
  return scope === "journey" || scope === "standalone" ? scope : "account";
}

export async function resolveUsageTier(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  accountTier: PlanTier,
  purchasedAddons: readonly unknown[],
  input: UsageScopeInput
): Promise<UsageTierResult> {
  const scope = parseUsageScope(input.scope);

  if (scope === "journey") {
    const journey = await resolveOwnedJourney(supabase, userId, input);
    if (!journey) return { ok: false, status: 403, message: "Journey not found" };
    return {
      ok: true,
      scope,
      tier: normalizePlanTier(journey.subscription_tier),
      walletPack: false,
    };
  }

  if (scope === "standalone") {
    return { ok: true, scope, tier: "free", walletPack: STANDALONE_WALLET_PACK_FEATURES.has(feature) };
  }

  return { ok: true, scope, tier: accountTier, walletPack: false };
}
