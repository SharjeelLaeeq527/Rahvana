"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { CandidateContext } from "./CandidateContext";
import { createClient } from "@/lib/supabase/client";
import {
  PlanTier,
  getEntitlement,
  isAccessible,
  normalizePlanTier,
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
import { getBaseVisaCategory, UNKNOWN_VISA_CATEGORY } from "@/lib/candidate/candidateSyncService";

export interface PlanContextValue {
  /** The real tier from DB for the active journey/category (unaffected by dev override). */
  realTier: PlanTier;
  /** Effective tier for the active journey — devOverride when set, otherwise realTier. */
  tier: PlanTier;
  /** Highest active subscription tier across the user's journeys / account summary. */
  maxActiveJourneyTier: PlanTier;
  /** Per-category tiers map, e.g. { "IR-5": "premium", "IR-1": "free" }. */
  journeyTiers: Record<string, PlanTier>;
  isLoading: boolean;
  /** Dev-only: override the active tier for UI testing. null = use real tier. */
  devOverride: PlanTier | null;
  setDevOverride: (t: PlanTier | null) => void;
  /** Add-on IDs purchased by this user (e.g. ["sponsor", "interview-prep"]). */
  purchasedAddons: string[];
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

export const PlanContext = createContext<PlanContextValue | null>(null);

/** Kept as a re-export for existing importers; the implementation lives in lib/entitlements/config. */
export { normalizePlanTier };

// Defensive plan reconciliation is expensive (reads `payments` + calls Stripe on
// every run). It only needs to run occasionally to self-heal a missed webhook —
// NOT on every page load. We gate it behind a per-user localStorage cooldown and
// always force it when the app explicitly asks (refresh(), e.g. after checkout).
const RECONCILE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // once per 24h per user

function shouldReconcile(userId: string, force: boolean): boolean {
  if (force) return true;
  try {
    const last = localStorage.getItem(`plan_reconciled_at_${userId}`);
    if (!last) return true;
    return Date.now() - Number(last) > RECONCILE_COOLDOWN_MS;
  } catch {
    return true; // localStorage unavailable -> fail open (old behavior)
  }
}

function markReconciled(userId: string) {
  try {
    localStorage.setItem(`plan_reconciled_at_${userId}`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const candidateCtx = useContext(CandidateContext);
  const [accountTier, setAccountTier] = useState<PlanTier>("free");
  const [journeyTiers, setJourneyTiers] = useState<Record<string, PlanTier>>({});
  const [purchasedAddons, setPurchasedAddons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [devOverride, setDevOverride] = useState<PlanTier | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Active category determination
  const activeCategory =
    candidateCtx?.activeCandidate?.visaCategory || candidateCtx?.activeJourneyBase;
  const normalizedCategory = activeCategory
    ? getBaseVisaCategory(activeCategory)
    : UNKNOWN_VISA_CATEGORY;

  // Derive the active journey's specific real tier from journeyTiers or fallback
  const realTier: PlanTier = useMemo(() => {
    if (normalizedCategory !== UNKNOWN_VISA_CATEGORY && journeyTiers[normalizedCategory]) {
      return journeyTiers[normalizedCategory];
    }
    // If user has journey records with explicit tiers, an unpurchased new category is "free"
    if (Object.keys(journeyTiers).length > 0) {
      return "free";
    }
    // Legacy single-journey fallback
    return accountTier;
  }, [normalizedCategory, journeyTiers, accountTier]);

  // If candidate is in Free Preview mode, force effective tier to 'free'
  const isCandidatePreview = Boolean(
    candidateCtx &&
      (candidateCtx.activeCandidate?.isPreview ||
        candidateCtx.activeCandidateTier === "free" ||
        candidateCtx.activeCandidate?.tier === "free")
  );

  const effectiveJourneyTier = isCandidatePreview ? "free" : realTier;
  const tier: PlanTier = devOverride ?? effectiveJourneyTier;
  const maxActiveJourneyTier = accountTier;

  const refresh = useCallback(() => setRefreshCounter((n) => n + 1), []);

  useEffect(() => {
    // If Auth is still loading, keep plan state loading to prevent intermediate
    // mock 'free' tier evaluation and restricted screen flickering.
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!user?.id) {
      setAccountTier("free");
      setJourneyTiers({});
      setPurchasedAddons([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const supabase = createClient();

    // 1. Defensive reconciliation: if user has a successful payment that
    //    hasn't been applied to subscription_tier yet, apply it.
    //    Fails open — if the endpoint errors, we still load from DB normally.
    //    Gated: only runs once per 24h per user, OR whenever refresh() was called
    //    explicitly (refreshCounter > 0, e.g. right after a successful checkout).
    //    This stops the per-page-load `payments` read + Stripe call storm that
    //    was a top Supabase Disk IO source.
    const forceReconcile = refreshCounter > 0;
    const reconcile = shouldReconcile(user.id, forceReconcile)
      ? fetch("/api/plan/reconcile", { method: "POST" })
          .then((r) => {
            if (r.ok) {
              markReconciled(user.id);
              return r.json();
            }
            return null;
          })
          .catch(() => null)
      : Promise.resolve(null);

    // 2. Wait for reconcile to settle, then query user_profiles and journeys in parallel
    reconcile
      .then(() =>
        Promise.all([
          supabase
            .from("user_profiles")
            .select("subscription_tier, profile_details")
            .eq("id", user.id)
            .single(),
          supabase
            .from("journeys")
            .select("journey_type, subscription_tier")
            .eq("user_id", user.id),
        ])
      )
      .then(([profileRes, journeysRes]) => {
        if (cancelled) return;
        const profileData = profileRes.data;
        const journeysData = journeysRes.data;

        setAccountTier(normalizePlanTier(profileData?.subscription_tier));
        const addons = profileData?.profile_details?.purchased_addons as string[] | undefined;
        setPurchasedAddons(Array.isArray(addons) ? addons : []);

        const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };
        const tiersMap: Record<string, PlanTier> = {};
        if (Array.isArray(journeysData)) {
          journeysData.forEach((j) => {
            if (j.journey_type && j.subscription_tier) {
              const tier = normalizePlanTier(j.subscription_tier);
              const rawKey = j.journey_type.toLowerCase();
              const cleanKey = rawKey.replace(/[^a-z0-9]/g, "");
              tiersMap[rawKey] = tier;
              tiersMap[cleanKey] = tier;

              const baseCat = getBaseVisaCategory(j.journey_type);
              if (baseCat !== UNKNOWN_VISA_CATEGORY) {
                const currentRank = TIER_RANK[tiersMap[baseCat] || "free"] ?? 0;
                const newRank = TIER_RANK[tier] ?? 0;
                if (newRank >= currentRank) {
                  tiersMap[baseCat] = tier;
                }
              }
            }
          });
        }
        setJourneyTiers(tiersMap);
      })
      .catch(() => {
        if (!cancelled) {
          setAccountTier("free");
          setJourneyTiers({});
          setPurchasedAddons([]);
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
    maxActiveJourneyTier,
    journeyTiers,
    isLoading,
    devOverride,
    setDevOverride,
    purchasedAddons,
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

