"use client";

import { useMemo } from "react";
import { useJourneyEnvironment } from "@/lib/hooks/useJourneyEnvironment";
import type { ToolMode, JourneyToolContext, ToolModeProps } from "@/types/tool-mode";

/**
 * Resolves the effective tool mode ('journey' vs 'standalone') and context.
 *
 * Priority order:
 * 1. Explicit `props.mode` if passed by parent
 * 2. Auto-detection from `useJourneyEnvironment()` (if inside /visa-category/*-journey)
 * 3. Default to 'standalone'
 */
export function useResolveToolMode(props?: ToolModeProps): {
  mode: ToolMode;
  isJourney: boolean;
  journeyContext: JourneyToolContext | null;
  journeyTier: string | null;
} {
  const env = useJourneyEnvironment();

  return useMemo(() => {
    const rawTier = props?.journeyTier ?? props?.journeyContext?.subscriptionTier ?? null;

    // 1. Explicit prop override takes precedence
    if (props?.mode) {
      const isJourney = props.mode === "journey";
      const journeyContext = isJourney
        ? props.journeyContext || {
            journeySlug: env.journeySlug || "",
            journeyCategory: env.journeyCategory || "",
            candidateId: env.candidateId || "candidate-1",
            subscriptionTier: rawTier,
          }
        : null;

      return { mode: props.mode, isJourney, journeyContext, journeyTier: rawTier };
    }

    // 2. Auto-detect from JourneyEnvironmentContext
    if (env.isInsideJourney && env.journeySlug) {
      return {
        mode: "journey" as ToolMode,
        isJourney: true,
        journeyContext: {
          journeySlug: env.journeySlug,
          journeyCategory: env.journeyCategory || "",
          candidateId: env.candidateId || "candidate-1",
          subscriptionTier: rawTier,
        },
        journeyTier: rawTier,
      };
    }

    // 3. Default to standalone
    return {
      mode: "standalone" as ToolMode,
      isJourney: false,
      journeyContext: null,
      journeyTier: null,
    };
  }, [props?.mode, props?.journeyContext, props?.journeyTier, env]);
}
