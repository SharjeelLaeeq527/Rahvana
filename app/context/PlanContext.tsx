"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  PlanTier,
  getEntitlement,
  isAccessible,
  FeatureEntitlement,
} from "@/lib/entitlements/config";
import {
  canUse,
  isHidden,
  isLocked,
  lockHint,
  upgradeCTA,
  getEffectiveEntitlement,
} from "@/lib/entitlements/helpers";

interface PlanContextValue {
  /** The real tier from DB (unaffected by dev override). */
  realTier: PlanTier;
  /** Effective tier — devOverride when set, otherwise realTier. */
  tier: PlanTier;
  isLoading: boolean;
  /** Dev-only: override the active tier for UI testing. null = use real tier. */
  devOverride: PlanTier | null;
  setDevOverride: (t: PlanTier | null) => void;
  /** Add-on IDs purchased by this user (e.g. ["sponsor", "interview-prep"]). */
  purchasedAddons: string[];
  /** True when the active plan is inherited from a shared-case owner (the
   *  current user is an invited partner, not the buyer). */
  isInheritedPlan: boolean;
  /** Re-fetch the user's plan from DB (call after successful payment). */
  refresh: () => void;
  /** Look up the full entitlement object for a feature, respecting purchased add-ons. */
  entitlement: (feature: string) => FeatureEntitlement;
  /** True when the user can take the primary action on a feature. */
  canUse: (feature: string) => boolean;
  /** True when the feature is completely hidden. */
  isHidden: (feature: string) => boolean;
  /** True when the feature is locked (upgrade/buy required). */
  isLocked: (feature: string) => boolean;
  /** True when the user has meaningful access (not hidden/locked). */
  isAccessible: (feature: string) => boolean;
  /** Short hint explaining the lock. */
  lockHint: (feature: string) => string;
  /** CTA label for locked feature upgrade action. */
  upgradeCTA: (feature: string) => string | null;
}

const PlanContext = createContext<PlanContextValue | null>(null);

const DB_TIER_MAP: Record<string, PlanTier> = {
  core: "basic",
  plus: "premium",
  pro: "executive",
  basic: "basic",
  premium: "premium",
  executive: "executive",
  free: "free",
};

function normalizeTier(raw: string | null | undefined): PlanTier {
  if (!raw) return "free";
  return DB_TIER_MAP[raw.toLowerCase()] ?? "free";
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [realTier, setRealTier] = useState<PlanTier>("free");
  const [purchasedAddons, setPurchasedAddons] = useState<string[]>([]);
  const [isInheritedPlan, setIsInheritedPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [devOverride, setDevOverride] = useState<PlanTier | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const tier = devOverride ?? realTier;

  const refresh = useCallback(() => setRefreshCounter((n) => n + 1), []);

  useEffect(() => {
    // If Auth is still loading, keep plan state loading to prevent intermediate
    // mock 'free' tier evaluation and restricted screen flickering.
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!user?.id) {
      setRealTier("free");
      setPurchasedAddons([]);
      setIsInheritedPlan(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    // 1. Defensive reconciliation: if user has a successful payment that
    //    hasn't been applied to subscription_tier yet, apply it. This acts on
    //    the user's OWN payments (no-op for a free invited partner).
    //    Fails open — if the endpoint errors, we still load the plan normally.
    const reconcile = fetch("/api/plan/reconcile", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    // 2. After reconcile settles, resolve the EFFECTIVE plan via the server.
    //    This is membership-aware (spec §6): an invited partner inherits the
    //    case owner's tier + add-ons, resolved live. Everyone else gets their
    //    own plan. Must be server-side — a partner can't read the owner's
    //    user_profiles row through RLS.
    reconcile
      .then(() => fetch("/api/plan/effective"))
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: {
          subscriptionTier?: string | null;
          purchasedAddons?: string[];
          isInherited?: boolean;
        } | null) => {
          if (cancelled) return;
          setRealTier(normalizeTier(data?.subscriptionTier));
          setPurchasedAddons(Array.isArray(data?.purchasedAddons) ? data.purchasedAddons : []);
          setIsInheritedPlan(Boolean(data?.isInherited));
        }
      )
      .catch(() => {
        if (!cancelled) {
          setRealTier("free");
          setPurchasedAddons([]);
          setIsInheritedPlan(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, refreshCounter]);

  const value: PlanContextValue = {
    realTier,
    tier,
    isLoading,
    devOverride,
    setDevOverride,
    purchasedAddons,
    isInheritedPlan,
    refresh,
    entitlement: useCallback(
      (f) => getEffectiveEntitlement(f, tier, purchasedAddons),
      [tier, purchasedAddons]
    ),
    canUse: useCallback((f) => canUse(f, tier, purchasedAddons), [tier, purchasedAddons]),
    isHidden: useCallback((f) => isHidden(f, tier), [tier]),
    isLocked: useCallback((f) => isLocked(f, tier, purchasedAddons), [tier, purchasedAddons]),
    isAccessible: useCallback((f) => isAccessible(f, tier), [tier]),
    lockHint: useCallback((f) => lockHint(f, tier, purchasedAddons), [tier, purchasedAddons]),
    upgradeCTA: useCallback((f) => upgradeCTA(f, tier, purchasedAddons), [tier, purchasedAddons]),
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside PlanProvider");
  return ctx;
}
