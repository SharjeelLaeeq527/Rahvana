// app/context/QuickAccessContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuickAccessItem {
  /** Unique stable identifier for the tool, e.g. "pdf", "interview_prep" */
  id: string;
  /** Display name shown in the dropdown */
  title: string;
  /** Navigation path, e.g. "/pdf-processing" or a journey route */
  href: string;
  /** Lucide icon name (string), optional */
  icon_name?: string;
}

export type QuickAccessScope = { type: "account" } | { type: "journey"; journeyId: string };

/** Stable identity for a scope; also used as the localStorage namespace. */
export function scopeKeyOf(scope: QuickAccessScope): string {
  return scope.type === "account" ? "account" : `journey:${scope.journeyId}`;
}

const ACCOUNT_SCOPE: QuickAccessScope = { type: "account" };
const BACKUP_PREFIX = "rahvana_quick_access_items";

// ─── Local backup (per-scope) ────────────────────────────────────────────────

const readBackup = (key: string): QuickAccessItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${BACKUP_PREFIX}:${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeBackup = (key: string, items: QuickAccessItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${BACKUP_PREFIX}:${key}`, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
};

// ─── Internal store shape ────────────────────────────────────────────────────

interface ScopeState {
  items: QuickAccessItem[];
  isLoading: boolean;
  isPending: boolean;
  loaded: boolean;
}

const EMPTY_STATE: ScopeState = {
  items: [],
  isLoading: false,
  isPending: false,
  loaded: false,
};

interface QuickAccessStore {
  states: Record<string, ScopeState>;
  ensureLoaded: (scope: QuickAccessScope) => void;
  addItem: (scope: QuickAccessScope, item: QuickAccessItem) => Promise<void>;
  removeItem: (scope: QuickAccessScope, id: string) => Promise<void>;
  clearAll: (scope: QuickAccessScope) => Promise<void>;
}

const StoreContext = createContext<QuickAccessStore | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function QuickAccessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [states, setStates] = useState<Record<string, ScopeState>>({});

  const loadedRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());

  // Reset everything when the signed-in user changes (or on logout).
  useEffect(() => {
    loadedRef.current = new Set();
    inFlightRef.current = new Set();
    setStates({});
  }, [user?.id]);

  // Persist each loaded scope back to its own localStorage namespace.
  useEffect(() => {
    Object.entries(states).forEach(([k, s]) => {
      if (s.loaded) writeBackup(k, s.items);
    });
  }, [states]);

  const patch = useCallback((key: string, updater: (s: ScopeState) => ScopeState) => {
    setStates((prev) => {
      const cur = prev[key] ?? EMPTY_STATE;
      return { ...prev, [key]: updater(cur) };
    });
  }, []);

  const ensureLoaded = useCallback(
    (scope: QuickAccessScope) => {
      if (!user) return;
      if (scope.type === "journey" && !scope.journeyId) return; // not ready yet
      const key = scopeKeyOf(scope);

      // Seed optimistically from this scope's backup so the tray opens instantly.
      setStates((prev) =>
        prev[key] ? prev : { ...prev, [key]: { ...EMPTY_STATE, items: readBackup(key) } }
      );

      if (loadedRef.current.has(key) || inFlightRef.current.has(key)) return;
      inFlightRef.current.add(key);
      patch(key, (s) => ({ ...s, isLoading: true }));

      (async () => {
        const url =
          scope.type === "account"
            ? "/api/quick-access?scope=account"
            : `/api/quick-access?scope=journey&journey_id=${encodeURIComponent(scope.journeyId)}`;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const data = await res.json();
            const mapped: QuickAccessItem[] = (data.items ?? []).map((row: any) => ({
              id: row.item_id,
              title: row.title,
              href: row.href,
              icon_name: row.icon_name ?? undefined,
            }));
            loadedRef.current.add(key);
            patch(key, (s) => ({ ...s, items: mapped, isLoading: false, loaded: true }));
          } else {
            patch(key, (s) => ({ ...s, isLoading: false }));
          }
        } catch (err: any) {
          if (err?.name !== "AbortError" && err?.name !== "TimeoutError") {
            console.warn("[QuickAccessContext] fetchItems fallback:", err?.message || err);
          }
          patch(key, (s) => ({ ...s, isLoading: false }));
        } finally {
          inFlightRef.current.delete(key);
        }
      })();
    },
    [user, patch]
  );

  const addItem = useCallback(
    async (scope: QuickAccessScope, item: QuickAccessItem) => {
      if (!user) return;
      const key = scopeKeyOf(scope);
      // Optimistic add
      patch(key, (s) => ({
        ...s,
        isPending: true,
        items: s.items.some((i) => i.id === item.id) ? s.items : [...s.items, item],
      }));
      try {
        const res = await fetch("/api/quick-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            href: item.href,
            icon_name: item.icon_name,
            scope_type: scope.type,
            journey_id: scope.type === "journey" ? scope.journeyId : null,
          }),
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) {
          // Roll back
          patch(key, (s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id) }));
          console.warn("[QuickAccessContext] addItem failed:", await res.text());
        }
      } catch (err) {
        patch(key, (s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id) }));
        console.warn("[QuickAccessContext] addItem error:", err);
      } finally {
        patch(key, (s) => ({ ...s, isPending: false }));
      }
    },
    [user, patch]
  );

  const removeItem = useCallback(
    async (scope: QuickAccessScope, id: string) => {
      if (!user) return;
      const key = scopeKeyOf(scope);
      let snapshot: QuickAccessItem[] = [];
      patch(key, (s) => {
        snapshot = s.items;
        return { ...s, isPending: true, items: s.items.filter((i) => i.id !== id) };
      });
      try {
        const res = await fetch("/api/quick-access", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            scope_type: scope.type,
            journey_id: scope.type === "journey" ? scope.journeyId : null,
          }),
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) {
          patch(key, (s) => ({ ...s, items: snapshot })); // roll back
          console.warn("[QuickAccessContext] removeItem failed:", await res.text());
        }
      } catch (err) {
        patch(key, (s) => ({ ...s, items: snapshot }));
        console.warn("[QuickAccessContext] removeItem error:", err);
      } finally {
        patch(key, (s) => ({ ...s, isPending: false }));
      }
    },
    [user, patch]
  );

  const clearAll = useCallback(
    async (scope: QuickAccessScope) => {
      if (!user) return;
      const key = scopeKeyOf(scope);
      let snapshot: QuickAccessItem[] = [];
      patch(key, (s) => {
        snapshot = s.items;
        return { ...s, isPending: true, items: [] };
      });
      try {
        const res = await fetch("/api/quick-access", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            all: true,
            scope_type: scope.type,
            journey_id: scope.type === "journey" ? scope.journeyId : null,
          }),
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) {
          patch(key, (s) => ({ ...s, items: snapshot }));
          console.warn("[QuickAccessContext] clearAll failed:", await res.text());
        }
      } catch (err) {
        patch(key, (s) => ({ ...s, items: snapshot }));
        console.warn("[QuickAccessContext] clearAll error:", err);
      } finally {
        patch(key, (s) => ({ ...s, isPending: false }));
      }
    },
    [user, patch]
  );

  const store: QuickAccessStore = {
    states,
    ensureLoaded,
    addItem,
    removeItem,
    clearAll,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// ─── Hook (scope-aware; defaults to account for backward compatibility) ───────

export function useQuickAccess(scope: QuickAccessScope = ACCOUNT_SCOPE) {
  const store = useContext(StoreContext);
  const key = scopeKeyOf(scope);
  const isValid = scope.type === "account" || (scope.type === "journey" && !!scope.journeyId);

  useEffect(() => {
    if (store && isValid) store.ensureLoaded(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key, isValid]);

  const state = store?.states[key] ?? EMPTY_STATE;

  const addItem = useCallback(
    (item: QuickAccessItem) => store?.addItem(scope, item),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, key]
  );
  const removeItem = useCallback(
    (id: string) => store?.removeItem(scope, id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, key]
  );
  const clearAll = useCallback(
    () => store?.clearAll(scope),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, key]
  );
  const isInQuickAccess = useCallback(
    (id: string) => state.items.some((i) => i.id === id),
    [state.items]
  );

  return {
    items: state.items,
    isLoading: state.isLoading,
    isPending: state.isPending,
    addItem,
    removeItem,
    clearAll,
    isInQuickAccess,
  };
}
