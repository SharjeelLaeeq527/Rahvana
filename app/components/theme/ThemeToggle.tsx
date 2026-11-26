"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { DARK_MODE_ENABLED } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { useIsForcedLight } from "./AppThemeProvider";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

/**
 * Light / Dark / System picker. Renders nothing while dark mode is disabled.
 * On a route that is not dark-ready yet the choice is still saved, and a note
 * explains why the page stays light.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const forcedLight = useIsForcedLight();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!DARK_MODE_ENABLED) return null;

  // The saved theme is only known on the client; render no selection until mount.
  const current = mounted ? theme : undefined;

  return (
    <div className={cn("px-5 py-2.5", className)}>
      <div className="text-subtle mb-2 text-xs font-semibold tracking-wide uppercase">Theme</div>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="border-line bg-surface-sunken grid grid-cols-3 gap-1 rounded-lg border p-1"
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const selected = current === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                selected
                  ? "bg-surface-raised text-strong shadow-sm"
                  : "text-subtle hover:text-strong",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      {mounted && forcedLight && theme !== "light" && (
        <p className="text-subtle mt-2 text-xs">This page is light only for now.</p>
      )}
    </div>
  );
}
