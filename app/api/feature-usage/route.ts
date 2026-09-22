import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { checkFeatureUsage } from "@/lib/usage/checkFeatureUsage";
import { type PlanTier, normalizePlanTier } from "@/lib/entitlements/config";
import { getEffectiveEntitlement, getCreditPools, addonPoolKey } from "@/lib/entitlements/helpers";

// GET /api/feature-usage?feature=xyz - Check feature usage for the authenticated user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: msg(E.AUTH_UNAUTHORIZED) },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature");

    if (!feature) {
      return NextResponse.json(
        { success: false, message: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[feature]" }) },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier, profile_details")
      .eq("id", user.id)
      .single();

    const userTier: PlanTier = normalizePlanTier(profile?.subscription_tier);
    const purchasedAddons: string[] = profile?.profile_details?.purchased_addons ?? [];

    const usage = await checkFeatureUsage(user.id, feature, userTier, purchasedAddons);

    return NextResponse.json(
      {
        success: true,
        data: {
          feature,
          usage,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/feature-usage - Increment feature usage for the authenticated user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { feature } = body;

    if (!feature) {
      return NextResponse.json({ success: false, message: "Feature is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier, profile_details")
      .eq("id", user.id)
      .single();

    const userTier: PlanTier = normalizePlanTier(profile?.subscription_tier);
    const purchasedAddons: string[] = profile?.profile_details?.purchased_addons ?? [];

    const entitlement = getEffectiveEntitlement(feature, userTier, purchasedAddons);

    // Handle access types
    if (entitlement.state === "locked_upgrade" || entitlement.state === "executive_only") {
      return NextResponse.json(
        {
          success: false,
          message: "Upgrade required",
          upgradeTarget: entitlement.upgradeTarget,
        },
        { status: 403 }
      );
    }

    if (entitlement.state === "locked_buy") {
      return NextResponse.json(
        {
          success: false,
          message: "Available as add-on",
          addon: entitlement.addon,
        },
        { status: 403 }
      );
    }

    // FULL access → no limit, just allow
    if (entitlement.state === "full") {
      return NextResponse.json({
        success: true,
        allowed: true,
        unlimited: true,
      });
    }

    // LIMITED access → enforce limit
    if (entitlement.state === "limited") {
      // Credit-pool features keep two independent counters: plan spend lives on
      // the bare key, paid add-on spend on `${feature}:addon`. Consume plan
      // credits first so purchased credits are never eroded by plan usage.
      const pools = getCreditPools(feature, userTier, purchasedAddons);

      if (pools) {
        // Zero-sized pools are skipped: the atomic RPC inserts before enforcing,
        // so it must never be called with p_limit = 0.
        const attempts = [
          ...(pools.planCredits > 0 ? [{ key: feature, limit: pools.planCredits }] : []),
          ...(pools.purchasedCredits > 0
            ? [{ key: addonPoolKey(feature), limit: pools.purchasedCredits }]
            : []),
        ];

        for (const attempt of attempts) {
          const { data: result, error } = await supabase.rpc("increment_feature_usage_atomic", {
            p_user_id: user.id,
            p_feature_key: attempt.key,
            p_limit: attempt.limit,
          });

          if (error) {
            console.error("Usage increment error:", error);
            return NextResponse.json(
              { success: false, message: msg(E.AUTH_UNEXPECTED_ERROR) },
              { status: 500 }
            );
          }

          if (result?.allowed) {
            // Report the combined pool state so the UI stays consistent
            const usage = await checkFeatureUsage(user.id, feature, userTier, purchasedAddons);
            return NextResponse.json({
              success: true,
              allowed: true,
              used: usage.used,
              limit: usage.limit,
              remaining: usage.remaining,
            });
          }
        }

        // Every wallet exhausted → buy more / upgrade
        const usage = await checkFeatureUsage(user.id, feature, userTier, purchasedAddons);
        return NextResponse.json({
          success: true,
          allowed: false,
          used: usage.used,
          limit: usage.limit,
          remaining: 0,
        });
      }

      const limit = entitlement.limit ?? 0;

      // Atomic upsert
      const { data, error } = await supabase.rpc("increment_feature_usage_atomic", {
        p_user_id: user.id,
        p_feature_key: feature,
        p_limit: limit,
      });

      if (error) {
        console.error("Usage increment error:", error);
        return NextResponse.json(
          { success: false, message: msg(E.AUTH_UNEXPECTED_ERROR) },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        allowed: data.allowed,
        used: data.used,
        limit: data.limit,
        remaining: data.remaining,
      });
    }

    // fallback
    return NextResponse.json(
      { success: false, message: "Unhandled entitlement state" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /feature-usage error:", error);
    return NextResponse.json(
      { success: false, message: msg(E.AUTH_UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}
