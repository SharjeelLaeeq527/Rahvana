import { createClient } from "../supabase/server";
import { type PlanTier } from "../entitlements/config";
import { getEffectiveEntitlement } from "../entitlements/helpers";

export async function checkFeatureUsage(
  userId: string,
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[] = []
) {
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
