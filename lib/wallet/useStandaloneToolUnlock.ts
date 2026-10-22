"use client";

import { getCatalogItem, type WalletCatalogItem } from "@/lib/wallet/catalog";
import { useWallet } from "@/app/context/WalletContext";

export type StandaloneToolUnlock = {
  /** Catalog entry for the tool, or null in journey mode / for unpriced tools. */
  item: WalletCatalogItem | null;
  /** The user owns standalone access (wallet unlock or permanent legacy add-on). */
  unlocked: boolean;
  /** The wallet is still loading, so `unlocked` is not final yet. */
  loading: boolean;
};

/**
 * Wallet unlock state for a standalone tool. Pass `null` in journey mode:
 * journey tools follow the journey plan only and must never read wallet unlocks.
 * The server re-checks every paid action; this is display/gating state only.
 */
export function useStandaloneToolUnlock(resourceId: string | null | undefined): StandaloneToolUnlock {
  const wallet = useWallet();
  const item = resourceId ? getCatalogItem("tool", resourceId) : null;
  return {
    item,
    unlocked: !!item && wallet.isUnlocked(item.resourceId, "tool"),
    loading: !!item && wallet.isLoading,
  };
}
