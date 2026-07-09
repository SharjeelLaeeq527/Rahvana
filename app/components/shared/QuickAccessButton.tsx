// app/components/shared/QuickAccessButton.tsx
"use client";

import React, { useState } from "react";
import { Pin, PinOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuickAccess, QuickAccessItem } from "@/app/context/QuickAccessContext";
import { useAuth } from "@/app/context/AuthContext";

interface QuickAccessButtonProps {
  /** The item to pin / unpin */
  item: QuickAccessItem;
  /**
   * "button" — full-width button with text (default, for tool pages)
   * "icon"   — compact icon-only variant (for cards / list rows)
   */
  mode?: "button" | "icon";
  className?: string;
}

/**
 * QuickAccessButton
 *
 * Drop this onto any tool page or card to give users a one-click "pin to
 * Pinned Items" toggle.
 *
 * Usage:
 *   <QuickAccessButton item={{ id: "pdf", title: "PDF Tools", href: "/pdf-processing" }} />
 */
export function QuickAccessButton({
  item,
  mode = "button",
  className = "",
}: QuickAccessButtonProps) {
  const { user } = useAuth();
  const { items, addItem, removeItem, isPending: contextPending } = useQuickAccess();
  const [localPending, setLocalPending] = useState(false);

  // Only show for signed-in users
  if (!user) return null;

  const pinned = items.some((i) => i.id === item.id);
  const isPending = contextPending || localPending;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    setLocalPending(true);
    try {
      if (pinned) {
        await removeItem(item.id);
      } else {
        await addItem(item);
      }
    } finally {
      setLocalPending(false);
    }
  };

  // ── Icon-only mode ─────────────────────────────────────────────────────────
  if (mode === "icon") {
    return (
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        disabled={isPending}
        title={pinned ? "Remove from Quick Access List" : "Add to Quick Access List"}
        aria-label={pinned ? "Remove from Quick Access List" : "Add to Quick Access List"}
        className={`group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d7377]/50 ${
          pinned
            ? "bg-[#0d7377]/10 text-[#0d7377] hover:bg-red-50 hover:text-red-500 border border-[#0d7377]/20 hover:border-red-200"
            : "bg-transparent text-muted-foreground hover:bg-[#0d7377]/10 hover:text-[#0d7377] border border-slate-200/80 dark:border-slate-800 hover:border-[#0d7377]/30"
        } ${isPending ? "opacity-60 cursor-wait" : "cursor-pointer"} ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {pinned ? (
            <motion.span
              key="pinned"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              <Pin className="w-4.5 h-4.5 fill-current rotate-45" />
            </motion.span>
          ) : (
            <motion.span
              key="unpinned"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              <Pin className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // ── Full button mode ───────────────────────────────────────────────────────
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={pinned ? "Remove from Quick Access List" : "Add to Quick Access List"}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d7377]/50 ${
        pinned
          ? "bg-[#0d7377]/10 text-[#0d7377] hover:bg-red-50 hover:text-red-500 border border-[#0d7377]/20 hover:border-red-200"
          : "bg-transparent text-muted-foreground hover:bg-[#0d7377]/10 hover:text-[#0d7377] border border-border hover:border-[#0d7377]/30"
      } ${isPending ? "opacity-60 cursor-wait" : "cursor-pointer"} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {pinned ? (
          <motion.span
            key="pinned-icon"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex shrink-0"
          >
            <PinOff className="w-3.5 h-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="unpinned-icon"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex shrink-0"
          >
            <Pin className="w-3.5 h-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={pinned ? "remove-label" : "add-label"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="whitespace-nowrap"
        >
          {pinned ? "Remove from Quick Access List" : "Add to Quick Access List"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
