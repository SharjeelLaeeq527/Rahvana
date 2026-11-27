"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/app/components/theme-provider";
import { DARK_MODE_ENABLED } from "@/lib/feature-flags";
import { isDarkReadyRoute } from "@/lib/theme/darkReadyRoutes";

export const THEME_STORAGE_KEY = "rahvana-theme";

/**
 * Site-wide theme. The user's choice (light / dark / system) is saved, but a route
 * only renders dark when dark mode is enabled AND the route is in the dark-ready
 * list; otherwise it is forced light.
 */
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const canBeDark = DARK_MODE_ENABLED && isDarkReadyRoute(pathname);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      forcedTheme={canBeDark ? undefined : "light"}
    >
      {children}
    </ThemeProvider>
  );
}

/** True when the current route ignores the saved theme and stays light. */
export function useIsForcedLight(): boolean {
  const pathname = usePathname();
  return !(DARK_MODE_ENABLED && isDarkReadyRoute(pathname));
}
