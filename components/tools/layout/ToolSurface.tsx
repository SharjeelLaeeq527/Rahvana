"use client";

import React, { createContext, useContext } from "react";

/**
 * Where a tool is being shown. A tool always renders the same `ToolLayout`; the launcher
 * (the standalone route, or the journey's `EmbeddedToolContainer` / `ToolPageOverlay`) says
 * where it sits, and the layout adapts its chrome instead of each tool keeping a second UI.
 *
 * - "page": its own route under the site header (default).
 * - "journey": inside a journey dashboard, under the journey breadcrumb. The layout drops the
 *   full-screen height and the Quick Access bookmark (bookmarks point at standalone routes),
 *   and uses a shorter hero band.
 */
export type ToolPlacement = "page" | "journey";

const ToolPlacementContext = createContext<ToolPlacement>("page");

export function ToolSurfaceProvider({
  placement,
  children,
}: {
  placement: ToolPlacement;
  children: React.ReactNode;
}) {
  return (
    <ToolPlacementContext.Provider value={placement}>{children}</ToolPlacementContext.Provider>
  );
}

export function useToolPlacement(): ToolPlacement {
  return useContext(ToolPlacementContext);
}

/**
 * Wrapper for a tool's standalone route: clears the fixed site header on its own page, and adds
 * nothing when the same page is mounted inside a journey (ToolPageOverlay), which has no site
 * header above it.
 */
export function ToolPageFrame({ children }: { children: React.ReactNode }) {
  const placement = useToolPlacement();
  return <div className={placement === "page" ? "mt-[55px]" : undefined}>{children}</div>;
}
