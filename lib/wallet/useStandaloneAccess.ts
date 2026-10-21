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
import {
  resolveStandaloneAccess,
  type StandaloneAccessStatus,
} from "@/lib/wallet/standaloneAccess";

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

  const walletUnlocked = !!catalogItem && wallet.isUnlocked(resourceId, resourceType);
  const planAllowed = plan.canUse(feature);

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
  };
}