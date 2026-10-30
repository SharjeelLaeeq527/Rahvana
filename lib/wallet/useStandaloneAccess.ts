"use client";

import { useSearchParams } from "next/navigation";
import {
  getCatalogItem,
  type WalletCatalogItem,
  type WalletResourceType,
} from "@/lib/wallet/catalog";
import { useWallet } from "@/app/context/WalletContext";
import { usePlan } from "@/app/context/PlanContext";
import { useAuth } from "@/app/context/AuthContext";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import {
  resolveStandaloneAccess,
  type StandaloneAccessStatus,
} from "@/lib/wallet/standaloneAccess";
import { getGuideByResourceId, getGuideById } from "@/lib/guides/guideRegistry";
import { hasJourneyEntitlementForGuide } from "@/lib/guides/guideAccessService";

export type { StandaloneAccessStatus };

/**
 * Shared hook for checking access to standalone resources.
 * Guides use it through <StandaloneAccessGate/>, while tools can call it directly from their ResultGate-style components.
 *
 * Keep the access rules in resolveStandaloneAccess() so every component follows the same logic instead of maintaining its own checks.
 */
export type StandaloneAccess = {
  /** Catalog details for this resource, or null if it isn't in the catalog. */
  catalogItem: WalletCatalogItem | null;
  /** Whether the URL contains ?mode=preview. Guides use this for display; access rules stay the same. */
  isPreview: boolean;
  /** Whether access comes from a wallet unlock instead of the user's plan. */
  unlockedByWallet: boolean;
  status: StandaloneAccessStatus;
  /** The visa category that granted the unlock if unlocked via a journey subscription */
  unlockedViaCategory?: string;
};

export function useStandaloneAccess(
  resourceType: WalletResourceType,
  resourceId: string,
  feature: string
): StandaloneAccess {
  const searchParams = useSearchParams();
  const catalogItem = getCatalogItem(resourceType, resourceId);
  const wallet = useWallet();
  const plan = usePlan();
  const { isAuthenticated } = useAuth();
  const { isInsideJourney } = useJourneyEnvironment();

  const walletUnlocked = !!catalogItem && wallet.isUnlocked(resourceId, resourceType);

  // Check if a guide is unlocked via the user's active journey subscription
  let hasEligibleJourneyPlan = false;
  let unlockedViaCategory: string | undefined = undefined;

  if (resourceType === "guide") {
    const guideMeta = getGuideByResourceId(resourceId) || getGuideById(resourceId);
    if (guideMeta) {
      const journeyAccess = hasJourneyEntitlementForGuide(guideMeta, plan.journeyTiers);
      hasEligibleJourneyPlan = journeyAccess.hasAccess;
      unlockedViaCategory = journeyAccess.unlockedViaCategory;
    }
  }

  // Inside a journey: the plan entitlement remains the source of truth.
  // Outside a journey: tools require credit unlock, while guides are also unlocked
  // if the user holds an eligible journey plan (Premium or Executive) for that guide's visa category.
  const planAllowed = (isInsideJourney && plan.canUse(feature)) || hasEligibleJourneyPlan;

  return {
    status: resolveStandaloneAccess({
      hasCatalogItem: !!catalogItem,
      isAuthenticated,
      planLoading: plan.isLoading,
      walletLoading: wallet.isLoading,
      planAllowed,
      walletUnlocked,
    }),
    catalogItem,
    isPreview: searchParams?.get("mode") === "preview",
    unlockedByWallet: walletUnlocked && !planAllowed,
    unlockedViaCategory,
  };
}

