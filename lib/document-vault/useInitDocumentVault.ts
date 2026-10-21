"use client";

import { useEffect, useRef } from "react";
import { useDocumentVaultStore } from "./store";
import type { VisaCategory } from "./types";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { useCandidate } from "@/app/context/CandidateContext";

interface InitDocumentVaultArgs {
  /** The journey's journey_type (e.g. "ir-1", "ir-5"). Used to derive the visa category. */
  journeyType?: string;
  /** This journey's backend id. Documents are fetched scoped to this journey. */
  backendId?: string | null;
  /** Wizard metadata (caseId, petitionerName, ...). Read at init time only. */
  metadata?: Record<string, unknown>;
  /** Auth user id. Local label only — the API resolves the real user from the session cookie. */
  userId?: string;
  /**
   * Explicit visa category override. When set, it wins over the value derived from
   * journeyType. V2 (IR-1/CR-1) passes "IR-1" to keep its existing single-category
   * behavior; V3 omits it so the category comes from the journey.
   */
  visaCategory?: VisaCategory;
  /**
   * Skip the init entirely (no config write, no document reload). Used by callers
   * that only want a *fallback* init — e.g. a step view that re-inits solely when the
   * store's config is missing, so it never clobbers a config already loaded upstream.
   */
  skip?: boolean;
}

/**
 * Prefetch the document vault for a journey.
 *
 * Call this from the ALWAYS-MOUNTED journey layout (RoadmapLayoutSpouse / RoadmapLayoutEngine)
 * so the uploaded documents — and therefore the case-strength score — are loaded as
 * soon as the journey opens, while the user is still on the dashboard.
 *
 * Scoped per candidate profile and backend journey ID.
 */
export function useInitDocumentVault({
  journeyType,
  backendId,
  metadata,
  userId,
  visaCategory,
  skip = false,
}: InitDocumentVaultArgs) {
  const setConfig = useDocumentVaultStore((s) => s.setConfig);
  const reloadDocuments = useDocumentVaultStore((s) => s.reloadDocuments);
  const { activeCandidate, activeCandidateId } = useCandidate();

  // Guard so the init runs once per journey & candidate even across re-renders.
  const initedJourneyRef = useRef<string | null>(null);
  // Keep the latest metadata without adding it to the effect deps (its object
  // identity changes every render, which would otherwise thrash the effect).
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  useEffect(() => {
    if (skip) return;
    const journeyKey = backendId || "__no-journey__";
    const initKey = `${journeyKey}_${activeCandidateId}`;
    if (initedJourneyRef.current === initKey) return;
    initedJourneyRef.current = initKey;

    const category =
      visaCategory ||
      getBaseVisaCategory(journeyType || activeCandidate?.visaCategory || "IR-5");
    const md = metadataRef.current || {};

    const beneficiaryDisplayName =
      activeCandidate?.fullName ||
      (md.beneficiaryName as string) ||
      activeCandidate?.label ||
      "Beneficiary";

    // Config sets synchronously in the store; reloadDocuments does the network
    // fetch. Fire both together and let the store manage its loading flags.
    Promise.all([
      setConfig({
        userId: userId || "session",
        journeyId: backendId || undefined,
        visaCategory: category,
        caseId:
          (md.caseId as string) ||
          activeCandidate?.caseNumber ||
          `ARACHNIE-${category.replace("-", "")}`,
        petitionerName: (md.petitionerName as string) || "Petitioner",
        beneficiaryName: beneficiaryDisplayName,
        jointSponsorName: (md.jointSponsorName as string) || "",
        scenarioFlags: {},
      }),
      reloadDocuments(backendId || undefined),
    ]).catch(() => {
      // Best-effort prefetch; the store logs its own errors and the StepView
      // still functions if this fails (it just won't be pre-warmed).
    });
  }, [
    backendId,
    journeyType,
    userId,
    visaCategory,
    skip,
    setConfig,
    reloadDocuments,
    activeCandidateId,
    activeCandidate,
  ]);
}
