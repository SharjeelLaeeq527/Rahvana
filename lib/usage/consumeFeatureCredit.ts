import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanTier } from "@/lib/entitlements/config";
import { addonPoolKey, getCreditPools, getEffectiveEntitlement } from "@/lib/entitlements/helpers";

export type ConsumeFeatureCreditResult =
  | { ok: true; unlimited: true }
  | { ok: true; unlimited: false; remaining: number }
  | { ok: false; reason: "not_included" | "limit_reached" | "rpc_failed" };

/**
 * Spends one use of a usage-limited feature on the server (e.g. the 2
 * consultations an Executive journey includes). Same counters as
 * POST /api/feature-usage: plan credits on the bare `feature` key first, then
 * purchased add-on credits on `${feature}:addon`. `full` access is unlimited.
 */
export async function consumeFeatureCredit(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[]
): Promise<ConsumeFeatureCreditResult> {
  const entitlement = getEffectiveEntitlement(feature, tier, purchasedAddons);
  if (entitlement.state === "full") return { ok: true, unlimited: true };
  if (entitlement.state !== "limited") return { ok: false, reason: "not_included" };

  const pools = getCreditPools(feature, tier, purchasedAddons);
  const attempts = pools
    ? [
        { key: feature, limit: pools.planCredits },
        { key: addonPoolKey(feature), limit: pools.purchasedCredits },
      ]
    : [{ key: feature, limit: entitlement.limit ?? 0 }];

  for (const attempt of attempts) {
    // The RPC inserts before enforcing, so it must never be called with p_limit = 0.
    if (attempt.limit <= 0) continue;
    const { data, error } = await supabase.rpc("increment_feature_usage_atomic", {
      p_user_id: userId,
      p_feature_key: attempt.key,
      p_limit: attempt.limit,
    });
    if (error) {
      console.error("[usage] increment failed:", error);
      return { ok: false, reason: "rpc_failed" };
    }
    if (data?.allowed) {
      return { ok: true, unlimited: false, remaining: Number(data.remaining ?? 0) };
    }
  }
  return { ok: false, reason: "limit_reached" };
}
