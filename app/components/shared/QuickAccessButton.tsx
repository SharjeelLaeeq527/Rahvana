// app/components/shared/QuickAccessButton.tsx
"use client";

import React, { useState } from "react";
import { Star, StarOff, Heart, HeartOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useQuickAccess,
  QuickAccessItem,
  QuickAccessScope,
} from "@/app/context/QuickAccessContext";
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
  /**
   * Which favorites list this button reads/writes.
   * Omit for account-wide (existing standalone behavior).
   * Inside a journey, pass { type: "journey", journeyId }.
   */
  scope?: QuickAccessScope;
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
  scope,
}: QuickAccessButtonProps) {
  const { user } = useAuth();
  const { items, addItem, removeItem, isPending: contextPending } = useQuickAccess(scope);
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
      <div className="group relative inline-flex">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          disabled={isPending}
          aria-label={pinned ? "Remove from Favorites" : "Add to Favorites"}
          className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d7377]/50 ${
            pinned
              ? "text-[#0d7377] hover:text-red-500"
              : "text-muted-foreground bg-transparent hover:text-[#0d7377]"
          } ${isPending ? "cursor-wait opacity-60" : "cursor-pointer"} ${className}`}
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
                <Heart className="h-5.5 w-5.5 fill-current" />
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
                <Heart className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }

  // ── Full button mode ───────────────────────────────────────────────────────
  return (
    <div className="group relative inline-flex">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleToggle}
        disabled={isPending}
        aria-label={pinned ? "Remove from Favorites" : "Add to Favorites"}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d7377]/50 ${
          pinned
            ? "border border-[#0d7377]/20 bg-[#0d7377]/10 text-[#0d7377] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            : "text-muted-foreground border-border border bg-transparent hover:border-[#0d7377]/30 hover:bg-[#0d7377]/10 hover:text-[#0d7377]"
        } ${isPending ? "cursor-wait opacity-60" : "cursor-pointer"} ${className}`}
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
              <HeartOff className="h-3.5 w-3.5" />
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
              <Heart className="h-3.5 w-3.5" />
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
            {pinned ? "Remove from Favorites" : "Add to Favorites"}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      <div
        className={`absolute top-full z-[999] mt-3 hidden w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-white shadow-xl group-hover:block ${
          className.includes("!text-white") ? "right-0" : "left-0"
        }`}
      >
        <div className="mb-1 flex items-center gap-1 font-medium text-[#afdbdb]">
          <Heart size={14} className="text-[#afdbdb]" />

          {pinned ? `Remove ${item.title} from Favorites` : `Save ${item.title}`}
        </div>

        <p className="text-left leading-relaxed text-slate-200">
          {pinned
            ? "Remove this resource from your Favorites. You can save it again anytime."
            : "Save this resource to your Favorites for quick access from the header menu."}
        </p>

        <div
          className={`absolute bottom-full border-8 border-transparent border-b-slate-800 ${
            className.includes("!text-white") ? "right-6" : "left-6"
          }`}
        />
      </div>
    </div>
  );
}
