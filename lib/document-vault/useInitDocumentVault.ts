"use client";

import { useEffect, useRef } from "react";
import { useDocumentVaultStore } from "./store";
import type { VisaCategory } from "./types";
import { normalizeJourneyType } from "@/lib/questionnaire";

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
}

/**
 * Prefetch the document vault for a journey.
 *
 * Call this from the ALWAYS-MOUNTED journey layout (RoadmapLayoutV2 / RoadmapLayoutV3)
 * so the uploaded documents — and therefore the case-strength score — are loaded as
 * soon as the journey opens, while the user is still on the dashboard.
 *
 * Previously the fetch fired only when the lazy StepView mounted (i.e. the moment the
 * user reached a step). That made the "Get Required Documents" step show "Checking..."
 * and left the case-strength ring blank on arrival, because the network round-trip
 * started too late. Hoisting it to the parent means the data is ready before the user
 * navigates into any step.
 *
 * Idempotent per journey: the effect body runs once per backendId. The store's own
 * `hasLoadedDocsInitial` guard additionally prevents a "Checking..." flash on any later
 * background refetch of an already-loaded journey.
 */
export function useInitDocumentVault({
  journeyType,
  backendId,
  metadata,
  userId,
  visaCategory,
}: InitDocumentVaultArgs) {
  const setConfig = useDocumentVaultStore((s) => s.setConfig);
  const reloadDocuments = useDocumentVaultStore((s) => s.reloadDocuments);

  // Guard so the init runs once per journey even across re-renders.
  const initedJourneyRef = useRef<string | null>(null);
  // Keep the latest metadata without adding it to the effect deps (its object
  // identity changes every render, which would otherwise thrash the effect).
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  useEffect(() => {
    const journeyKey = backendId || "__no-journey__";
    if (initedJourneyRef.current === journeyKey) return;
    initedJourneyRef.current = journeyKey;

    const category =
      visaCategory ||
      (normalizeJourneyType(journeyType || "ir-1").toUpperCase() as VisaCategory);
    const md = metadataRef.current || {};

    // Config sets synchronously in the store; reloadDocuments does the network
    // fetch. Fire both together and let the store manage its loading flags.
    Promise.all([
      setConfig({
        userId: userId || "session",
        visaCategory: category,
        caseId: (md.caseId as string) || `ARACHNIE-${category.replace("-", "")}`,
        petitionerName: (md.petitionerName as string) || "Petitioner",
        beneficiaryName: (md.beneficiaryName as string) || "Beneficiary",
        jointSponsorName: (md.jointSponsorName as string) || "",
        scenarioFlags: {},
      }),
      reloadDocuments(backendId || undefined),
    ]).catch(() => {
      // Best-effort prefetch; the store logs its own errors and the StepView
      // still functions if this fails (it just won't be pre-warmed).
    });
  }, [backendId, journeyType, userId, visaCategory, setConfig, reloadDocuments]);
}
