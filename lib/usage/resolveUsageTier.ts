import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanTier, type PlanTier } from "@/lib/entitlements/config";
import { resolveOwnedJourney } from "@/lib/journey/resolveOwnedJourney";
import { hasStandaloneAccess } from "@/lib/wallet/state";

/**
 * Where a usage check runs. The client only says WHERE it is; the server decides
 * the tier from data the user owns, never from a tier the client sends.
 * - "journey": the journey's own plan tier (journey ownership verified).
 * - "standalone": no plan tier at all (standalone tools are paid with credits);
 *   legacy purchased add-on credit pools still apply, and a wallet unlock of the
 *   matching tool means unlimited.
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
  | { ok: true; scope: UsageScope; tier: PlanTier; walletUnlimited: boolean }
  | { ok: false; status: 403; message: string };

/** Usage-metered features that a standalone wallet unlock makes unlimited. */
const STANDALONE_WALLET_TOOL: Readonly<Record<string, string>> = {
  photo_booth: "photo-booth",
};

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
      walletUnlimited: false,
    };
  }

  if (scope === "standalone") {
    const toolId = STANDALONE_WALLET_TOOL[feature];
    const walletUnlimited = toolId
      ? await hasStandaloneAccess(supabase, userId, "tool", toolId, purchasedAddons)
      : false;
    return { ok: true, scope, tier: "free", walletUnlimited };
  }

  return { ok: true, scope, tier: accountTier, walletUnlimited: false };
}
