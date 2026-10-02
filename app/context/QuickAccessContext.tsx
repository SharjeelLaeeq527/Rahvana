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

const LOCAL_STORAGE_KEY = "rahvana_quick_access_items";

const readLocalBackup = (): QuickAccessItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalBackup = (items: QuickAccessItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
};

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

  // Initialize from local backup if available
  useEffect(() => {
    const local = readLocalBackup();
    if (local.length > 0) {
      setItems(local);
    }
  }, []);

  // ── Fetch all items on user login ──────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/quick-access", {
        signal: AbortSignal.timeout(6000),
      });
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
        writeLocalBackup(mapped);
      }
    } catch (err: any) {
      // Gracefully handle network timeouts / offline mode without crashing
      if (err?.name !== "AbortError" && err?.name !== "TimeoutError") {
        console.warn("[QuickAccessContext] fetchItems fallback:", err?.message || err);
      }
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
      setItems((prev) => {
        const updated = prev.some((i) => i.id === item.id) ? prev : [...prev, item];
        writeLocalBackup(updated);
        return updated;
      });
      try {
        const res = await fetch("/api/quick-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) {
          // Roll back on failure
          setItems((prev) => {
            const reverted = prev.filter((i) => i.id !== item.id);
            writeLocalBackup(reverted);
            return reverted;
          });
          console.warn("[QuickAccessContext] addItem failed:", await res.text());
        }
      } catch (err) {
        setItems((prev) => {
          const reverted = prev.filter((i) => i.id !== item.id);
          writeLocalBackup(reverted);
          return reverted;
        });
        console.warn("[QuickAccessContext] addItem error:", err);
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
      setItems((p) => {
        const updated = p.filter((i) => i.id !== id);
        writeLocalBackup(updated);
        return updated;
      });
      try {
        const res = await fetch("/api/quick-access", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) {
          // Roll back
          setItems(prev);
          writeLocalBackup(prev);
          console.warn("[QuickAccessContext] removeItem failed:", await res.text());
        }
      } catch (err) {
        setItems(prev);
        writeLocalBackup(prev);
        console.warn("[QuickAccessContext] removeItem error:", err);
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
