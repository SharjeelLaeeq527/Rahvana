-"use client";

import { useState, useCallback, useMemo } from "react";
import { usePlan } from "@/app/context/PlanContext";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";

/**
 * Hook that resolves the entitlement status for a specific journey step.
 *
 * Returns everything a component needs to:
 *  1. Decide whether content should be locked.
 *  2. Show the correct lock hint / CTA.
 *  3. Open the UpgradeModal on demand.
 */
export function useStepEntitlement(stepKey: string) {
  const plan = usePlan();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  const featureKey = STEP_PRIMARY_FEATURE[stepKey] ?? null;

  /** Whether the user can interact with the primary feature of this step. */
  const canUse = useMemo(
    () => (featureKey ? plan.canUse(featureKey) : true),
    [featureKey, plan],
  );

  /** Whether the primary feature is locked (needs upgrade or purchase). */
  const isLocked = useMemo(
    () => (featureKey ? plan.isLocked(featureKey) : false),
    [featureKey, plan],
  );

  /** Short explanation of why the feature is locked. */
  const lockHint = useMemo(
    () => (featureKey ? plan.lockHint(featureKey) : ""),
    [featureKey, plan],
  );

  /** CTA text for upgrading / purchasing. */
  const upgradeCTA = useMemo(
    () => (featureKey ? plan.upgradeCTA(featureKey) : null),
    [featureKey, plan],
  );

  /** Opens the UpgradeModal for this step's feature. */
  const openUpgradeModal = useCallback(() => {
    if (featureKey) setUpgradeModalFeature(featureKey);
  }, [featureKey]);

  /** Closes the UpgradeModal. */
  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalFeature(null);
  }, []);

  /**
   * Guard wrapper — use before opening overlays or launching tools.
   * Returns `true` if the action should proceed (user has access).
   * Returns `false` if the action is blocked (and opens upgrade modal).
   *
   * Usage:
   *   onClick={() => { if (guard()) setIsTutorialOpen(true); }}
   */
  const guard = useCallback((): boolean => {
    if (!featureKey) return true;        // No gating → always proceed
    if (plan.canUse(featureKey)) return true;
    setUpgradeModalFeature(featureKey);
    return false;
  }, [featureKey, plan]);

  return {
    /** Feature key from stepFeatureMap (null = no gating). */
    featureKey,
    /** True if user has access. */
    canUse,
    /** True if feature is locked (upgrade/buy required). */
    isLocked,
    /** Descriptive lock hint string. */
    lockHint,
    /** CTA label (e.g., "Upgrade to Premium"). */
    upgradeCTA,
    /** Opens the upgrade modal for this step's feature. */
    openUpgradeModal,
    /** Closes the upgrade modal. */
    closeUpgradeModal,
    /** The feature key currently shown in the modal (null = closed). */
    upgradeModalFeature,
    /**
     * Guard — returns true if action allowed, false + opens modal if locked.
     * Use before setIsTutorialOpen(true), vault opens, tool launches, etc.
     */
    guard,
  };
}
