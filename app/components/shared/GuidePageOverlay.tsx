"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader } from "@/components/ui/spinner";

import {
  usePlan,
  PlanContext,
  PlanContextValue,
  normalizePlanTier,
} from "@/app/context/PlanContext";
import {
  getEffectiveEntitlement,
  canUse,
  isHidden,
  isLocked,
  lockHint,
  upgradeCTA,
} from "@/lib/entitlements/helpers";
import { PlanTier, isAccessible } from "@/lib/entitlements/config";

interface JourneyGuidePageProps {
  /** Relative URL of the guide page, e.g. "/guides/passport-guide" */
  guideUrl: string | null;
  /** Called when the user dismisses the overlay */
  onClose: () => void;
  /** Optional journey plan override so guide features evaluate against journey tier */
  plan?: PlanContextValue;
  /** Optional journey tier override (e.g. "premium" | "executive") */
  tier?: PlanTier | string;
}

const ToolLoadingState = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#f8fafc]">
    <Loader size="md" text="Loading tool..." className="!gap-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-0" />
  </div>
);

const GuideLoadingState = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#f8fafc]">
    <Loader size="md" text="Loading guide..." className="!gap-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-0" />
  </div>
);

const JourneyGuideLayoutStyles = () => (
  <style jsx global>{`
    /* ── Hide standalone WizardHeader inside the journey ── */
    /* The Journey Header already renders title, breadcrumbs, back button, and plan badge */
    .journey-guide-page header {
      display: none !important;
    }

    /* Kill standalone-mode pt-26 top-padding on the outer wrapper and content */
    .journey-guide-page div[class~="pt-26"],
    .journey-guide-page div[class~="pt-24"],
    .journey-guide-page div[class~="pt-20"] {
      padding-top: 0 !important;
    }

    /* Normalize standalone min-h-screen inside the journey overlay without touching inner loader elements */
    .journey-guide-page div[class~="min-h-screen"] {
      min-height: 60vh !important;
      padding-top: 0 !important;
    }
  `}</style>
);

function safeDynamic(
  importFn: () => Promise<any>,
  LoadingComponent: React.ComponentType<any>
) {
  return dynamic(
    () =>
      importFn().catch((error) => {
        if (
          typeof window !== "undefined" &&
          (error?.name === "ChunkLoadError" || String(error?.message).includes("Loading chunk"))
        ) {
          window.location.reload();
        }
        throw error;
      }),
    { loading: () => <LoadingComponent /> }
  );
}

import { preloadGuideSession } from "@/lib/guides/useGuideSession";

// Map of slug -> dynamic import function for preloading and dynamic component creation
const GUIDE_IMPORTERS: Record<string, () => Promise<any>> = {
  // Tools
  passport: () => import("@/components/tools/PassportPhotoTool"),
  "passport-photos": () => import("@/components/tools/PassportPhotoTool"),
  "photo-booth": () => import("@/components/tools/PassportPhotoTool"),
  "document-translation": () => import("@/components/tools/DocumentTranslationTool"),
  translation: () => import("@/components/tools/DocumentTranslationTool"),
  "affidavit-support-calculator": () => import("@/app/(tools)/affidavit-support-calculator/page"),
  "signature-image-processing": () => import("@/app/(tools)/signature-image-processing/page"),
  "visa-forms": () => import("@/app/(tools)/(visa)/visa-forms/page"),
  "visa-checker": () => import("@/app/(tools)/(visa)/visa-checker/page"),
  "portal-wallet": () => import("@/app/(tools)/document-vault/page"),
  "document-vault": () => import("@/app/(tools)/document-vault/page"),
  "pdf-processing": () => import("@/app/(tools)/pdf-processing/page"),
  "case-status": () => import("@/app/(tools)/case-status/page"),
  "interview-prep": () => import("@/app/(tools)/interview-prep/page"),
  "visa-case-strength-checker": () => import("@/app/(tools)/visa-case-strength-checker/page"),
  "221g-action-planner": () => import("@/app/(tools)/(visa)/221g-action-planner/page"),
  "book-appointment": () => import("@/app/(tools)/book-appointment/page"),
  "police-verification": () => import("@/app/(tools)/police-verification/page"),
  "visa-eligibility": () => import("@/app/(tools)/visa-eligibility/page"),
  "passport-ocr": () => import("@/components/tools/PassportOcrTool"),

  // Guides
  "passport-guide": () => import("@/app/(tools)/guides/passport-guide/page"),
  "birth-certificate-guide": () => import("@/app/(tools)/guides/birth-certificate-guide/page"),
  "cnic-guide": () => import("@/app/(tools)/guides/cnic-guide/page"),
  "frc-guide": () => import("@/app/(tools)/guides/frc-guide/page"),
  "nikah-nama-guide": () => import("@/app/(tools)/guides/nikah-nama-guide/page"),
  "police-verification-guide": () => import("@/app/(tools)/guides/police-verification-guide/page"),
  "police-certificate": () => import("@/app/(tools)/guides/police-certificate/page"),
  "polio-vaccination-guide": () => import("@/app/(tools)/guides/polio-vaccination-guide/page"),
  "step-parent-guide": () => import("@/app/(tools)/guides/step-parent-guide/page"),
  "adoptive-parent-guide": () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
  "adoption-guide": () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
  "asset-document-guide": () => import("@/app/(tools)/guides/asset-document-guide/page"),
  "bona-marriage-guide": () => import("@/app/(tools)/guides/bona-marriage-guide/page"),
  "educational-certificates-us-visa": () => import("@/app/(tools)/guides/educational-certificates-us-visa/page"),
  "employment-certificate-guide": () => import("@/app/(tools)/guides/employment-certificate-guide/page"),
  "visa-strength-guide": () => import("@/app/(tools)/guides/visa-strength-guide/page"),
  "all-guides": () => import("@/app/(tools)/guides/page"),
};

// Map of slug -> dynamically imported Guide/Tool React component
const GUIDE_COMPONENTS: Record<string, React.ComponentType<any>> = Object.fromEntries(
  Object.entries(GUIDE_IMPORTERS).map(([slug, importer]) => {
    const isGuide =
      slug.endsWith("-guide") ||
      slug === "police-certificate" ||
      slug === "all-guides" ||
      slug.includes("certificate");
    return [slug, safeDynamic(importer, isGuide ? GuideLoadingState : ToolLoadingState)];
  })
);

function getInlineGuideProps(slug: string): Record<string, unknown> {
  if (slug === "passport" || slug === "passport-photos" || slug === "photo-booth") {
    return { showHeader: false, mode: "journey" };
  }
  if (slug === "document-translation" || slug === "translation") {
    return { showHeader: false, mode: "journey", showRequestsLink: false };
  }
  return {};
}

/**
 * Directly mounts and renders the selected Guide component inside the journey,
 * evaluating guide access against the current Journey's plan/tier.
 */
export const JourneyGuidePage: React.FC<JourneyGuidePageProps> = ({
  guideUrl,
  onClose,
  plan: passedPlan,
  tier: passedTier,
}) => {
  const accountPlan = usePlan();

  // Evaluate guide plan based on the Journey tier
  const effectivePlan = useMemo<PlanContextValue>(() => {
    if (passedPlan) return passedPlan;
    if (passedTier) {
      const normalizedTier = normalizePlanTier(passedTier);
      const purchasedAddons = accountPlan?.purchasedAddons || [];
      return {
        ...accountPlan,
        tier: normalizedTier,
        realTier: normalizedTier,
        entitlement: (f: string) => getEffectiveEntitlement(f, normalizedTier, purchasedAddons),
        canUse: (f: string) => canUse(f, normalizedTier, purchasedAddons),
        isHidden: (f: string) => isHidden(f, normalizedTier),
        isLocked: (f: string) => isLocked(f, normalizedTier, purchasedAddons),
        isAccessible: (f: string) => isAccessible(f, normalizedTier),
        lockHint: (f: string) => lockHint(f, normalizedTier, purchasedAddons),
        upgradeCTA: (f: string) => upgradeCTA(f, normalizedTier, purchasedAddons),
      };
    }
    return accountPlan;
  }, [passedPlan, passedTier, accountPlan]);

// ── DYNAMIC MULTI-STEP FORM ─────────────────────────────────────────────────
const DynamicMultiStepForm = dynamic(
  () =>
    import("@/app/components/forms/auto-visaform-filling/MultiStepForm")
      .then((mod) => mod.MultiStepForm)
      .catch((error) => {
        if (
          typeof window !== "undefined" &&
          (error?.name === "ChunkLoadError" || String(error?.message).includes("Loading chunk"))
        ) {
          window.location.reload();
        }
        throw error;
      }),
  {
    loading: () => (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#f8fafc]">
        <Loader size="md" text="Loading form wizard..." />
      </div>
    ),
  }
);

function extractFormCode(href: string | null): string | null {
  if (!href) return null;
  const cleanHref = href.split("?")[0].replace(/\/$/, "");
  const match = cleanHref.match(/^\/(?:visa-forms|forms)\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const rawCode = match[1].toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["page", "all", "directory", "wizard"].includes(rawCode)) return null;
  return rawCode || null;
}

  const [journeyHeaderBottom, setJourneyHeaderBottom] = useState<number>(112);

  useLayoutEffect(() => {
    if (!guideUrl) return;
    const header = document.querySelector<HTMLElement>("[data-journey-header]");
    const updateHeaderBottom = () => {
      setJourneyHeaderBottom(header ? Math.max(0, header.getBoundingClientRect().bottom) : 112);
    };

    updateHeaderBottom();
    const observer = header ? new ResizeObserver(updateHeaderBottom) : null;
    if (header && observer) observer.observe(header);
    window.addEventListener("resize", updateHeaderBottom);
    window.addEventListener("scroll", updateHeaderBottom, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeaderBottom);
      window.removeEventListener("scroll", updateHeaderBottom, true);
    };
  }, [guideUrl]);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (!guideUrl) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [guideUrl]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!guideUrl) return;
    const closeFromJourneyHeader = () => onClose();
    window.addEventListener("journey-overlay-close", closeFromJourneyHeader);
    return () => window.removeEventListener("journey-overlay-close", closeFromJourneyHeader);
  }, [guideUrl, onClose]);

  const detectedFormCode = useMemo(() => extractFormCode(guideUrl), [guideUrl]);

  const slug = useMemo(() => {
    if (!guideUrl) return "";
    const clean = guideUrl.split("?")[0].replace(/\/$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length === 0 || clean === "/guides") return "all-guides";
    return parts[parts.length - 1];
  }, [guideUrl]);

  const overlayTitle = useMemo(() => {
    if (!guideUrl) return null;
    if (detectedFormCode) return `Form ${detectedFormCode.toUpperCase()}`;
    if (["passport", "passport-photos", "photo-booth"].includes(slug)) return "Photo Booth";
    if (slug === "interview-prep") return "Interview Prep";
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [guideUrl, detectedFormCode, slug]);

  useEffect(() => {
    if (!overlayTitle) return;
    window.dispatchEvent(new CustomEvent("journey-overlay-name", { detail: overlayTitle }));
    return () => {
      window.dispatchEvent(new CustomEvent("journey-overlay-name", { detail: null }));
    };
  }, [overlayTitle]);

  const isTool = useMemo(() => {
    if (detectedFormCode) return true;
    return [
      "passport",
      "passport-photos",
      "photo-booth",
      "document-translation",
      "translation",
      "affidavit-support-calculator",
      "signature-image-processing",
      "visa-forms",
      "visa-checker",
      "portal-wallet",
      "document-vault",
      "pdf-processing",
      "case-status",
      "interview-prep",
      "visa-case-strength-checker",
      "221g-action-planner",
      "book-appointment",
      "police-verification",
      "visa-eligibility",
      "passport-ocr",
    ].includes(slug);
  }, [slug, detectedFormCode]);

  if (!guideUrl) return null;

  // Specific Form Wizard (e.g. /visa-forms/i130/wizard, /visa-forms/g1450/wizard, etc.)
  if (detectedFormCode) {
    return (
      <div
        className="journey-guide-page fixed inset-x-0 bottom-0 z-[30] overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f8fafc] font-sans animate-in fade-in duration-200"
        style={{ top: journeyHeaderBottom }}
        role="dialog"
        aria-modal="true"
        aria-label={`Form ${detectedFormCode.toUpperCase()} Auto-Filler`}
      >
        <JourneyGuideLayoutStyles />
        <div className="min-h-full w-full">
          <div className="min-h-full w-full">
            <PlanContext.Provider value={effectivePlan}>
              <main className="min-h-full">
                <DynamicMultiStepForm
                  formCode={detectedFormCode}
                  onClose={onClose}
                  isEmbedded={true}
                />
              </main>
            </PlanContext.Provider>
          </div>
        </div>
      </div>
    );
  }

  const GuideComponent = GUIDE_COMPONENTS[slug];
  const inlineProps = getInlineGuideProps(slug);

  return (
    <div
      className="journey-guide-page fixed inset-x-0 bottom-0 z-[30] overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f8fafc] font-sans animate-in fade-in duration-200"
      style={{ top: journeyHeaderBottom }}
      role="dialog"
      aria-modal="true"
      aria-label={isTool ? "Tool View" : "Guide View"}
    >
      <JourneyGuideLayoutStyles />
      {/* ── Guide Component Rendered Directly with Journey Plan Context ── */}
      <div className="min-h-full w-full">
        <div className="min-h-full w-full">
          {GuideComponent ? (
            <PlanContext.Provider value={effectivePlan}>
              <GuideComponent {...inlineProps} />
            </PlanContext.Provider>
          ) : (
            <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {isTool ? "Tool Not Found" : "Guide Not Found"}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Could not load {isTool ? "tool" : "guide"} for: {" "}
                <code className="text-xs bg-slate-100 p-1 rounded">{guideUrl}</code>
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function preloadGuidePage(guideUrl: string | null, candidateId = "candidate-1") {
  if (!guideUrl) return;
  const clean = guideUrl.split("?")[0].replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  const slug = parts.length === 0 || clean === "/guides" ? "all-guides" : parts[parts.length - 1];

  // 1. Warm the JS chunk
  const importer = GUIDE_IMPORTERS[slug];
  if (importer) {
    void importer().catch(() => {});
  }

  // 2. Warm the guide session data from /api/guides/progress
  if (slug.endsWith("-guide") || slug === "police-certificate") {
    preloadGuideSession(slug, candidateId);
  }
}

export { JourneyGuidePage as GuidePageOverlay };
export default JourneyGuidePage;
