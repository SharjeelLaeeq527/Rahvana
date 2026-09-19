"use client";

import { useMemo } from "react";
import { normalizePlanTier, usePlan } from "./PlanContext";
import { isAccessible, PlanTier } from "@/lib/entitlements/config";
import {
  canUse,
  getEffectiveEntitlement,
  isHidden,
  isLocked,
  lockHint,
  upgradeCTA,
} from "@/lib/entitlements/helpers";

/** The journey state shape intentionally accepts both persisted and client aliases. */
export type JourneyPlanState = {
  subscription_tier?: string | null;
  subscriptionTier?: string | null;
} | null | undefined;

/**
 * The plan API for a journey. Account-owned add-ons/loading state are retained,
 * but every tier-dependent decision is evaluated against this journey's tier.
 */
export function useJourneyPlan(state: JourneyPlanState) {
  const accountPlan = usePlan();
  const tier = useMemo<PlanTier>(
    () => normalizePlanTier(state?.subscription_tier ?? state?.subscriptionTier),
    [state?.subscription_tier, state?.subscriptionTier]
  );
  const purchasedAddons = accountPlan.purchasedAddons;

  return useMemo(
    () => ({
      ...accountPlan,
      tier,
      entitlement: (feature: string) => getEffectiveEntitlement(feature, tier, purchasedAddons),
      canUse: (feature: string) => canUse(feature, tier, purchasedAddons),
      isHidden: (feature: string) => isHidden(feature, tier),
      isLocked: (feature: string) => isLocked(feature, tier, purchasedAddons),
      isAccessible: (feature: string) => isAccessible(feature, tier),
      lockHint: (feature: string) => lockHint(feature, tier, purchasedAddons),
      upgradeCTA: (feature: string) => upgradeCTA(feature, tier, purchasedAddons),
    }),
    [accountPlan, purchasedAddons, tier]
  );
}
