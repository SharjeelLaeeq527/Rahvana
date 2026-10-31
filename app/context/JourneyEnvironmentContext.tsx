"use client";

import React, { createContext, useContext, useMemo } from "react";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { useCandidate } from "@/app/context/CandidateContext";

// ── Types ────────────────────────────────────────────────────────────────────

export interface JourneyEnvironmentContextType {
  /** True when the current page is inside a journey (/visa-category/*-journey) */
  isInsideJourney: boolean;

  /** The raw journey URL slug (e.g., "ir5-journey", "ir1-journey"). Null outside. */
  journeySlug: string | null;

  /** The resolved visa-category key for data lookup (e.g., "ir-5", "ir-1"). Null outside. */
  journeyDataKey: string | null;

  /** The base visa category (e.g., "IR-5", "IR-1"). Null outside journey. */
  journeyCategory: string | null;

  /** The candidate ID scoped to this journey. Null outside journey. */
  candidateId: string | null;
}

// ── Default (standalone / outside journey) ───────────────────────────────────

const STANDALONE_DEFAULTS: JourneyEnvironmentContextType = {
  isInsideJourney: false,
  journeySlug: null,
  journeyDataKey: null,
  journeyCategory: null,
  candidateId: null,
};

// ── Slug Resolution ──────────────────────────────────────────────────────────
// Maps URL slug → data key. Mirrors page.tsx L125-130 mapping.

const SLUG_TO_DATA_KEY: Record<string, string> = {
  "ir1-journey": "ir-1",
  "ir5-journey": "ir-5",
  "ir2-journey": "ir-2",
  "f1": "f-1",
  "germany-student": "germany-student-journey",
  "ir-1": "ir-1",
  "ir-5": "ir-5",
  "ir-2": "ir-2",
};

function resolveDataKey(slug: string): string {
  return SLUG_TO_DATA_KEY[slug] ?? slug;
}

// ── Context ──────────────────────────────────────────────────────────────────

const JourneyEnvironmentContext =
  createContext<JourneyEnvironmentContextType>(STANDALONE_DEFAULTS);

// ── Provider ─────────────────────────────────────────────────────────────────

interface JourneyEnvironmentProviderProps {
  journeySlug: string;
  children: React.ReactNode;
}

export function JourneyEnvironmentProvider({
  journeySlug,
  children,
}: JourneyEnvironmentProviderProps) {
  const { activeCandidateId } = useCandidate();

  const value = useMemo<JourneyEnvironmentContextType>(() => {
    const dataKey = resolveDataKey(journeySlug);
    const category = getBaseVisaCategory(dataKey);

    return {
      isInsideJourney: true,
      journeySlug,
      journeyDataKey: dataKey,
      journeyCategory: category,
      candidateId: activeCandidateId || "candidate-1",
    };
  }, [journeySlug, activeCandidateId]);

  return (
    <JourneyEnvironmentContext.Provider value={value}>
      {children}
    </JourneyEnvironmentContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current journey environment. Safe to call from ANY component.
 *
 * Inside a journey URL → returns journey metadata (slug, category, candidateId).
 * Outside a journey URL → returns { isInsideJourney: false, ... nulls }.
 */
export function useJourneyEnvironment(): JourneyEnvironmentContextType {
  return useContext(JourneyEnvironmentContext);
}
