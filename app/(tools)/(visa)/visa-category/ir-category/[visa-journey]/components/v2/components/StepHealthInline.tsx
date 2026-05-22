"use client";

/**
 * StepHealthInline — renders step-specific case strength checks inline.
 *
 * Reads from the IR1_STEP_CHECKERS registry. Future visa categories can pass
 * their own registry without changing this component.
 *
 * Renders nothing when no checks apply (clean UI).
 */

import React from "react";
import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import {
  runStepChecks,
  type StepCheckContext,
  type StepChecker,
} from "@/lib/case-strength/step-checkers";

interface StepHealthInlineProps extends StepCheckContext {
  stepKey: string;
  registry?: Record<string, StepChecker>;
  /** Compact mode for side panels */
  compact?: boolean;
}

const LEVEL_STYLE = {
  critical: {
    bg: "#fef2f2",
    border: "#fecaca",
    title: "#991b1b",
    hint:  "#7f1d1d",
    Icon:  CircleAlert,
    iconColor: "#dc2626",
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    title: "#92400e",
    hint:  "#78350f",
    Icon:  AlertTriangle,
    iconColor: "#d97706",
  },
  info: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    title: "#1e40af",
    hint:  "#1e3a8a",
    Icon:  Info,
    iconColor: "#3b82f6",
  },
} as const;

export function StepHealthInline({ stepKey, registry, compact = false, ...ctx }: StepHealthInlineProps) {
  const results = runStepChecks(stepKey, ctx, registry);
  if (results.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${compact ? "" : "max-w-3xl w-full mx-auto px-2 md:px-4 pb-2"}`}>
      {results.map((r, i) => {
        const s = LEVEL_STYLE[r.level];
        return (
          <div
            key={i}
            className={`rounded-xl border flex items-start gap-2.5 ${compact ? "px-3 py-2.5" : "px-3.5 py-3"}`}
            style={{ background: s.bg, borderColor: s.border }}
          >
            <s.Icon size={compact ? 13 : 15} color={s.iconColor} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className={`font-semibold leading-snug ${compact ? "text-[11.5px]" : "text-[12.5px]"}`} style={{ color: s.title }}>
                {r.title}
              </div>
              {r.hint && (
                <div className={`leading-relaxed mt-0.5 ${compact ? "text-[10.5px]" : "text-[11.5px]"}`} style={{ color: s.hint, opacity: 0.9 }}>
                  {r.hint}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
