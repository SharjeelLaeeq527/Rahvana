import { createClient } from "../supabase/server";
import { type PlanTier } from "../entitlements/config";
import { getEffectiveEntitlement, getCreditPools, addonPoolKey } from "../entitlements/helpers";

export type FeatureUsageResult = {
  allowed: boolean;
  reason?: string;
  used?: number;
  limit?: number;
  remaining?: number;
};

export async function checkFeatureUsage(
  userId: string,
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[] = []
): Promise<FeatureUsageResult> {
  const supabase = await createClient();

  const entitlement = getEffectiveEntitlement(feature, tier, purchasedAddons);

  // Full Access: No limits
  if (entitlement.state === "full") {
    return { allowed: true, reason: "Full access" };
  }

  // Not Limited
  if (entitlement.state !== "limited") {
    return { allowed: false };
  }

  const limit = entitlement.limit ?? 0;

  // Credit-pool feature: plan credits and purchased credits are tracked in
  // separate counters so spent plan credits can never erode a paid pool.
  // The bare `feature` key holds plan spend; `${feature}:addon` holds paid spend.
  const pools = getCreditPools(feature, tier, purchasedAddons);
  if (pools) {
    const { data: rows, error: rowsError } = await supabase
      .from("feature_usage")
      .select("feature_key, usage_count")
      .eq("user_id", userId)
      .in("feature_key", [feature, addonPoolKey(feature)]);

    if (rowsError && rowsError.code !== "PGRST116") {
      throw rowsError;
    }

    const usedBy = new Map<string, number>(
      (rows ?? []).map((r: { feature_key: string; usage_count: number }) => [
        r.feature_key,
        r.usage_count,
      ])
    );
    const planUsed = usedBy.get(feature) ?? 0;
    const addonUsed = usedBy.get(addonPoolKey(feature)) ?? 0;
    const remaining =
      Math.max(pools.planCredits - planUsed, 0) + Math.max(pools.purchasedCredits - addonUsed, 0);

    return {
      allowed: remaining > 0,
      used: planUsed + addonUsed,
      limit,
      remaining,
    };
  }

  const { data, error } = await supabase
    .from("feature_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("feature_key", feature)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const used = data?.usage_count ?? 0;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}
