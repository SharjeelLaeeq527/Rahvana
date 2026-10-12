"use client";

import React, { useEffect, useMemo } from "react";
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

    /* Remove min-h-screen on the outer guide container so it fits naturally */
    .journey-guide-page div[class~="min-h-screen"]:not(:has(.animate-spin)) {
      min-height: 0 !important;
      padding-top: 0 !important;
    }

    /* Centered loader state */
    .journey-guide-page div:has(> .animate-spin),
    .journey-guide-page div:has(> * > .animate-spin) {
      min-height: 60vh !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding-top: 0 !important;
      margin: 0 auto !important;
    }
  `}</style>
);

function safeDynamic(importFn: () => Promise<any>, loadingComponent: React.ComponentType) {
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
    { loading: loadingComponent }
  );
}

// Map of slug -> dynamically imported Guide/Tool React component
const GUIDE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // Tools mapped when opened via guide links
  passport: safeDynamic(() => import("@/components/tools/PassportPhotoTool"), ToolLoadingState),
  "passport-photos": safeDynamic(() => import("@/components/tools/PassportPhotoTool"), ToolLoadingState),
  "photo-booth": safeDynamic(() => import("@/components/tools/PassportPhotoTool"), ToolLoadingState),
  "document-translation": safeDynamic(
    () => import("@/components/tools/DocumentTranslationTool"),
    ToolLoadingState
  ),
  translation: safeDynamic(
    () => import("@/components/tools/DocumentTranslationTool"),
    ToolLoadingState
  ),
  "affidavit-support-calculator": safeDynamic(
    () => import("@/app/(tools)/affidavit-support-calculator/page"),
    ToolLoadingState
  ),
  "signature-image-processing": safeDynamic(
    () => import("@/app/(tools)/signature-image-processing/page"),
    ToolLoadingState
  ),
  "visa-forms": safeDynamic(
    () => import("@/app/(tools)/(visa)/visa-forms/page"),
    ToolLoadingState
  ),
  "visa-checker": safeDynamic(
    () => import("@/app/(tools)/(visa)/visa-checker/page"),
    ToolLoadingState
  ),
  "portal-wallet": safeDynamic(
    () => import("@/app/(tools)/document-vault/page"),
    ToolLoadingState
  ),
  "document-vault": safeDynamic(
    () => import("@/app/(tools)/document-vault/page"),
    ToolLoadingState
  ),
  "pdf-processing": safeDynamic(
    () => import("@/app/(tools)/pdf-processing/page"),
    ToolLoadingState
  ),
  "case-status": safeDynamic(
    () => import("@/app/(tools)/case-status/page"),
    ToolLoadingState
  ),
  "interview-prep": safeDynamic(
    () => import("@/app/(tools)/interview-prep/page"),
    ToolLoadingState
  ),
  "visa-case-strength-checker": safeDynamic(
    () => import("@/app/(tools)/visa-case-strength-checker/page"),
    ToolLoadingState
  ),
  "221g-action-planner": safeDynamic(
    () => import("@/app/(tools)/(visa)/221g-action-planner/page"),
    ToolLoadingState
  ),
  "book-appointment": safeDynamic(
    () => import("@/app/(tools)/book-appointment/page"),
    ToolLoadingState
  ),
  "police-verification": safeDynamic(
    () => import("@/app/(tools)/police-verification/page"),
    ToolLoadingState
  ),
  "visa-eligibility": safeDynamic(
    () => import("@/app/(tools)/visa-eligibility/page"),
    ToolLoadingState
  ),
  "passport-ocr": safeDynamic(
    () => import("@/components/tools/PassportOcrTool"),
    ToolLoadingState
  ),

  // Guides
  "passport-guide": safeDynamic(() => import("@/app/(tools)/guides/passport-guide/page"), GuideLoadingState),
  "birth-certificate-guide": safeDynamic(
    () => import("@/app/(tools)/guides/birth-certificate-guide/page"),
    GuideLoadingState
  ),
  "cnic-guide": safeDynamic(() => import("@/app/(tools)/guides/cnic-guide/page"), GuideLoadingState),
  "frc-guide": safeDynamic(() => import("@/app/(tools)/guides/frc-guide/page"), GuideLoadingState),
  "nikah-nama-guide": safeDynamic(() => import("@/app/(tools)/guides/nikah-nama-guide/page"), GuideLoadingState),
  "police-verification-guide": safeDynamic(
    () => import("@/app/(tools)/guides/police-verification-guide/page"),
    GuideLoadingState
  ),
  "police-certificate": safeDynamic(
    () => import("@/app/(tools)/guides/police-certificate/page"),
    GuideLoadingState
  ),
  "polio-vaccination-guide": safeDynamic(
    () => import("@/app/(tools)/guides/polio-vaccination-guide/page"),
    GuideLoadingState
  ),
  "step-parent-guide": safeDynamic(() => import("@/app/(tools)/guides/step-parent-guide/page"), GuideLoadingState),
  "adoptive-parent-guide": safeDynamic(
    () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
    GuideLoadingState
  ),
  "adoption-guide": safeDynamic(
    () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
    GuideLoadingState
  ),
  "asset-document-guide": safeDynamic(
    () => import("@/app/(tools)/guides/asset-document-guide/page"),
    GuideLoadingState
  ),
  "bona-marriage-guide": safeDynamic(
    () => import("@/app/(tools)/guides/bona-marriage-guide/page"),
    GuideLoadingState
  ),
  "educational-certificates-us-visa": safeDynamic(
    () => import("@/app/(tools)/guides/educational-certificates-us-visa/page"),
    GuideLoadingState
  ),
  "employment-certificate-guide": safeDynamic(
    () => import("@/app/(tools)/guides/employment-certificate-guide/page"),
    GuideLoadingState
  ),
  "visa-strength-guide": safeDynamic(
    () => import("@/app/(tools)/guides/visa-strength-guide/page"),
    GuideLoadingState
  ),
  "all-guides": safeDynamic(() => import("@/app/(tools)/guides/page"), GuideLoadingState),
};

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
        className="journey-guide-page w-full bg-[#f8fafc] font-sans"
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
      className="journey-guide-page w-full bg-[#f8fafc] font-sans"
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

export default JourneyGuidePage;
