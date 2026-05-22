"use client";

/**
 * FloatingSidePanel — reusable wrapper for any fixed right-side panel
 * that should fade out when the footer enters the viewport.
 *
 * Use anywhere you'd otherwise write `position: fixed; top: 100; right: 24`.
 * Children get a clean shell, plus automatic footer-aware fade.
 *
 * Usage:
 *   <FloatingSidePanel>
 *     <YourCard />
 *   </FloatingSidePanel>
 */

import React from "react";
import { useHideOnFooter } from "@/lib/hooks/useHideOnFooter";

interface FloatingSidePanelProps {
  children: React.ReactNode;
  /** Position from top in pixels (default 100) */
  top?: number;
  /** Position from right in pixels (default 24) */
  right?: number;
  /** Width in pixels (default 280) */
  width?: number;
  /** z-index — keep low so footer can cover (default 10) */
  zIndex?: number;
  /** Show panel only at xl+ screens (default true) */
  desktopOnly?: boolean;
  /** Optional inline override class */
  className?: string;
}

export function FloatingSidePanel({
  children,
  top = 100,
  right = 24,
  width = 280,
  zIndex = 10,
  desktopOnly = true,
  className,
}: FloatingSidePanelProps) {
  const hideForFooter = useHideOnFooter();

  return (
    <aside
      className={`${desktopOnly ? "hidden xl:flex" : "flex"} flex-col gap-3 ${className ?? ""}`}
      style={{
        position: "fixed",
        top,
        right,
        width,
        maxHeight: `calc(100vh - ${top + 40}px)`,
        zIndex,
        opacity: hideForFooter ? 0 : 1,
        pointerEvents: hideForFooter ? "none" : "auto",
        transition: "opacity 0.2s ease",
      }}
    >
      <div className="overflow-y-auto scrollbar-hide flex-1 flex flex-col gap-3">
        {children}
      </div>
    </aside>
  );
}
