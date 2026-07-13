// app/context/QuickAccessContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuickAccessItem {
  /** Unique stable identifier for the tool, e.g. "pdf", "interview-prep" */
  id: string;
  /** Display name shown in the dropdown */
  title: string;
  /** Navigation path, e.g. "/pdf-processing" */
  href: string;
  /** Lucide icon name (string), optional */
  icon_name?: string;
}

interface QuickAccessContextType {
  items: QuickAccessItem[];
  isLoading: boolean;
  addItem: (item: QuickAccessItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  isInQuickAccess: (id: string) => boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const QuickAccessContext = createContext<QuickAccessContextType>({
  items: [],
  isLoading: false,
  addItem: async () => {},
  removeItem: async () => {},
  isInQuickAccess: () => false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function QuickAccessProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<QuickAccessItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Prevent double-fetching on strict-mode double effects
  const fetchedForUser = useRef<string | null>(null);

  // ── Fetch all items on user login ──────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/quick-access");
      if (res.ok) {
        const data = await res.json();
        // Map DB columns → QuickAccessItem shape
        const mapped: QuickAccessItem[] = (data.items ?? []).map((row: any) => ({
          id: row.item_id,
          title: row.title,
          href: row.href,
          icon_name: row.icon_name ?? undefined,
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error("[QuickAccessContext] fetchItems:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      fetchedForUser.current = null;
      return;
    }
    // Only fetch once per user session to avoid request storms
    if (fetchedForUser.current === user.id) return;
    fetchedForUser.current = user.id;
    fetchItems();
  }, [user, authLoading, fetchItems]);

  // ── Add item ──────────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (item: QuickAccessItem) => {
      if (!user) return;
      // Optimistic update
      setItems((prev) =>
        prev.some((i) => i.id === item.id) ? prev : [...prev, item]
      );
      try {
        const res = await fetch("/api/quick-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          // Roll back on failure
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          console.error("[QuickAccessContext] addItem failed:", await res.text());
        }
      } catch (err) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        console.error("[QuickAccessContext] addItem:", err);
      }
    },
    [user]
  );

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItem = useCallback(
    async (id: string) => {
      if (!user) return;
      // Optimistic update
      const prev = items;
      setItems((p) => p.filter((i) => i.id !== id));
      try {
        const res = await fetch("/api/quick-access", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          // Roll back
          setItems(prev);
          console.error("[QuickAccessContext] removeItem failed:", await res.text());
        }
      } catch (err) {
        setItems(prev);
        console.error("[QuickAccessContext] removeItem:", err);
      }
    },
    [user, items]
  );

  // ── Helper ────────────────────────────────────────────────────────────────
  const isInQuickAccess = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  return (
    <QuickAccessContext.Provider
      value={{ items, isLoading, addItem, removeItem, isInQuickAccess }}
    >
      {children}
    </QuickAccessContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuickAccess() {
  return useContext(QuickAccessContext);
}
