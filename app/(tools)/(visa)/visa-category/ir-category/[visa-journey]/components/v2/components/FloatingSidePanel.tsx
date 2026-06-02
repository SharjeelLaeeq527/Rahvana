"use client";

/**
 * FloatingSidePanel — reusable wrapper for any fixed right-side panel.
 *
 * Positioning accounts for the IR-1 journey page layout:
 *   - Top navbar:       ~70px
 *   - Step breadcrumb:  52px  (sticky at top-[70px])
 *   - Bottom step nav:  58px
 *
 * So panel starts at 136px from top and ends 74px from bottom —
 * no overlap with header, breadcrumb, or progress/nav bar.
 *
 * Fades out automatically when footer enters viewport.
 * Only renders at xl+ screens (≥1280px).
 */

import React from "react";
import { useHideOnFooter } from "@/lib/hooks/useHideOnFooter";

interface FloatingSidePanelProps {
  children: React.ReactNode;
  /**
   * Top offset in px.
   * Default 136 = 70px navbar + 52px breadcrumb + 14px gap.
   */
  top?: number;
  /** Right offset in px (default 20) */
  right?: number;
  /** Panel width in px (default 272) */
  width?: number;
  /** z-index — below sticky header (z-40) so header covers on scroll (default 10) */
  zIndex?: number;
  /** Extra class names */
  className?: string;
}

export function FloatingSidePanel({
  children,
  top = 136,
  right = 20,
  width = 272,
  zIndex = 10,
  className,
}: FloatingSidePanelProps) {
  const hideForFooter = useHideOnFooter(80);

  return (
    <aside
      className={`hidden xl:flex flex-col ${className ?? ""}`}
      style={{
        position: "fixed",
        top,
        right,
        width,
        // Stop before the bottom step-nav bar (58px) + safe gap (16px)
        maxHeight: `calc(100vh - ${top}px - 74px)`,
        zIndex,
        opacity: hideForFooter ? 0 : 1,
        pointerEvents: hideForFooter ? "none" : "auto",
        transition: "opacity 0.25s ease",
      }}
    >
      <div className="panel-scrollbar overflow-y-auto overscroll-contain flex-1 min-h-0 flex flex-col gap-2.5 pr-1.5">
        {children}
      </div>
    </aside>
  );
}
