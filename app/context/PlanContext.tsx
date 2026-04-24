"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  PlanTier,
  getEntitlement,
  isAccessible,
  FeatureEntitlement,
} from "@/lib/entitlements/config";
import { canUse, isHidden, isLocked, lockHint, upgradeCTA } from "@/lib/entitlements/helpers";

interface PlanContextValue {
  /** The real tier from DB (unaffected by dev override). */
  realTier: PlanTier;
  /** Effective tier — devOverride when set, otherwise realTier. */
  tier: PlanTier;
  isLoading: boolean;
  /** Dev-only: override the active tier for UI testing. null = use real tier. */
  devOverride: PlanTier | null;
  setDevOverride: (t: PlanTier | null) => void;
  /** Look up the full entitlement object for a feature at the current tier. */
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
  core:      'basic',
  plus:      'premium',
  pro:       'executive',
  basic:     'basic',
  premium:   'premium',
  executive: 'executive',
  free:      'free',
};

function normalizeTier(raw: string | null | undefined): PlanTier {
  if (!raw) return 'free';
  return DB_TIER_MAP[raw.toLowerCase()] ?? 'free';
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [realTier, setRealTier] = useState<PlanTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [devOverride, setDevOverride] = useState<PlanTier | null>(null);

  const tier = devOverride ?? realTier;

  useEffect(() => {
    if (!user?.id) {
      setRealTier('free');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
      .then(({ data }: { data: { subscription_tier?: string } | null }) => {
        if (cancelled) return;
        setRealTier(normalizeTier(data?.subscription_tier));
      })
      .catch(() => {
        if (!cancelled) setRealTier('free');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  const value: PlanContextValue = {
    realTier,
    tier,
    isLoading,
    devOverride,
    setDevOverride,
    entitlement: useCallback((f) => getEntitlement(f, tier), [tier]),
    canUse:       useCallback((f) => canUse(f, tier), [tier]),
    isHidden:     useCallback((f) => isHidden(f, tier), [tier]),
    isLocked:     useCallback((f) => isLocked(f, tier), [tier]),
    isAccessible: useCallback((f) => isAccessible(f, tier), [tier]),
    lockHint:     useCallback((f) => lockHint(f, tier), [tier]),
    upgradeCTA:   useCallback((f) => upgradeCTA(f, tier), [tier]),
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside PlanProvider");
  return ctx;
}