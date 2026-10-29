"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import type { WalletResourceType } from "@/lib/wallet/catalog";
import {
  fetchWalletSnapshot,
  newLaunchIdempotencyKey,
  newServiceBookingIdempotencyKey,
  requestLaunch,
  requestServiceBookingDeduction,
  unlockKey,
  type LaunchResponse,
  type ServiceBookingResponse,
  type WalletUnlock,
} from "@/lib/wallet/client";
import { WalletTopupModal } from "@/app/components/wallet/WalletTopupModal";

/**
 * Rahvana Wallet state for STANDALONE tools, guides and services. Journey-embedded
 * tools never spend credits (they follow the journey plan via useJourneyPlan), so
 * nothing inside a journey should read this to decide access.
 *
 * The balance shown here is a display copy; the server re-checks every launch.
 */

export type OpenTopupOptions = {
  /** Pre-selected amount, e.g. the exact deficit for a tool. */
  amount?: number;
  /** Same-origin path to return to after Stripe. Defaults to the current page. */
  returnUrl?: string;
};

interface WalletContextValue {
  /** Null while loading or when signed out. */
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  unlocks: WalletUnlock[];
  /** Resource ids usable without paying (wallet unlock or permanent legacy add-on). */
  unlockedResources: Set<string>;
  isUnlocked: (resourceId: string, resourceType?: WalletResourceType) => boolean;
  refreshWallet: () => Promise<void>;
  launchResource: (resourceType: WalletResourceType, resourceId: string) => Promise<LaunchResponse>;
  deductServiceBooking: (
    serviceId: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: Record<string, unknown>
  ) => Promise<ServiceBookingResponse>;
  openTopup: (options?: OpenTopupOptions) => void;
  closeTopup: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/** Re-read the wallet when the tab comes back, at most this often. */
const FOCUS_REFRESH_MS = 60_000;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? (user?.id ?? null) : null;

  const [balance, setBalance] = useState<number | null>(null);
  const [unlocks, setUnlocks] = useState<WalletUnlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topup, setTopup] = useState<OpenTopupOptions | null>(null);
  // User whose first wallet fetch has settled. Until then the wallet counts as
  // loading, so a gate never flashes "locked" for a user who owns the tool.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const lastFetchRef = useRef(0);
  // Ignores a response that arrives after the user changed (logout / switch).
  const userRef = useRef<string | null>(userId);
  useEffect(() => {
    userRef.current = userId;
  }, [userId]);

  const refreshWallet = useCallback(async () => {
    const forUser = userRef.current;
    if (!forUser) return;
    lastFetchRef.current = Date.now();
    setIsLoading(true);
    try {
      const snapshot = await fetchWalletSnapshot();
      if (userRef.current !== forUser) return;
      setBalance(snapshot ? snapshot.balance : null);
      setUnlocks(snapshot ? snapshot.unlocks : []);
      setError(null);
    } catch (e) {
      if (userRef.current !== forUser) return;
      setError(e instanceof Error ? e.message : "Could not load your wallet.");
    } finally {
      if (userRef.current === forUser) {
        setIsLoading(false);
        setLoadedFor(forUser);
      }
    }
  }, []);

  // Keyed on the user id, not the user object (AuthContext re-emits it on every event).
  useEffect(() => {
    setBalance(null);
    setUnlocks([]);
    setError(null);
    setTopup(null);
    if (userId) void refreshWallet();
  }, [userId, refreshWallet]);

  // Pick up a top-up paid in another tab, or a back-navigation from Stripe.
  useEffect(() => {
    if (!userId) return;
    const maybeRefresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchRef.current < FOCUS_REFRESH_MS) return;
      void refreshWallet();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void refreshWallet();
    };
    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [userId, refreshWallet]);

  const unlockedResources = useMemo(() => new Set(unlocks.map((u) => u.resourceId)), [unlocks]);
  const unlockedKeys = useMemo(
    () => new Set(unlocks.map((u) => unlockKey(u.resourceType, u.resourceId))),
    [unlocks]
  );

  const isUnlocked = useCallback(
    (resourceId: string, resourceType?: WalletResourceType) =>
      resourceType ? unlockedKeys.has(unlockKey(resourceType, resourceId)) : unlockedResources.has(resourceId),
    [unlockedKeys, unlockedResources]
  );

  const launchResource = useCallback(
    async (resourceType: WalletResourceType, resourceId: string): Promise<LaunchResponse> => {
      const result = await requestLaunch(resourceType, resourceId, newLaunchIdempotencyKey());
      const { body } = result;
      if (typeof body.balance === "number") setBalance(body.balance);
      else if (typeof body.available === "number") setBalance(body.available);
      if (body.success) {
        setUnlocks((prev) =>
          prev.some((u) => u.resourceType === resourceType && u.resourceId === resourceId)
            ? prev
            : [...prev, { resourceType, resourceId }]
        );
      }
      return result;
    },
    []
  );

  const deductServiceBooking = useCallback(
    async (
      serviceId: string,
      referenceId?: string,
      idempotencyKey?: string,
      metadata?: Record<string, unknown>
    ): Promise<ServiceBookingResponse> => {
      const result = await requestServiceBookingDeduction(
        serviceId,
        referenceId,
        idempotencyKey,
        metadata
      );
      const { body } = result;
      if (typeof body.balance === "number") setBalance(body.balance);
      else if (typeof body.available === "number") setBalance(body.available);
      // Consumable per booking: services never write to unlocks
      return result;
    },
    []
  );

  const openTopup = useCallback((options?: OpenTopupOptions) => setTopup(options ?? {}), []);
  const closeTopup = useCallback(() => setTopup(null), []);

  const walletLoading = isLoading || (userId !== null && loadedFor !== userId);

  const value = useMemo<WalletContextValue>(
    () => ({
      balance,
      isLoading: walletLoading,
      error,
      unlocks,
      unlockedResources,
      isUnlocked,
      refreshWallet,
      launchResource,
      deductServiceBooking,
      openTopup,
      closeTopup,
    }),
    [
      balance,
      // isLoading,
      walletLoading,
      error,
      unlocks,
      unlockedResources,
      isUnlocked,
      refreshWallet,
      launchResource,
      deductServiceBooking,
      openTopup,
      closeTopup,
    ]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      {topup && userId && (
        <WalletTopupModal
          balance={balance}
          initialAmount={topup.amount}
          returnUrl={topup.returnUrl}
          onClose={closeTopup}
        />
      )}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
