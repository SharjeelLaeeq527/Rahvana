"use client";

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Loader2 } from "lucide-react";

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

interface GuidePageOverlayProps {
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
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
    <Loader2 size={32} className="text-primary animate-spin" />
    <span className="text-xs font-medium text-slate-500">Loading tool...</span>
  </div>
);

const GuideLoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
    <Loader2 size={32} className="text-primary animate-spin" />
    <span className="text-xs font-medium text-slate-500">Loading guide...</span>
  </div>
);

// Map of slug -> dynamically imported Guide/Tool React component
const GUIDE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // Tools mapped when opened via guide links
  passport: dynamic(() => import("@/components/tools/PassportPhotoTool"), {
    loading: ToolLoadingState,
  }),
  "passport-photos": dynamic(() => import("@/components/tools/PassportPhotoTool"), {
    loading: ToolLoadingState,
  }),
  "photo-booth": dynamic(() => import("@/components/tools/PassportPhotoTool"), {
    loading: ToolLoadingState,
  }),
  "document-translation": dynamic(
    () => import("@/components/tools/DocumentTranslationTool"),
    { loading: ToolLoadingState }
  ),
  translation: dynamic(
    () => import("@/components/tools/DocumentTranslationTool"),
    { loading: ToolLoadingState }
  ),
  "affidavit-support-calculator": dynamic(
    () => import("@/app/(tools)/affidavit-support-calculator/page"),
    { loading: ToolLoadingState }
  ),
  "signature-image-processing": dynamic(
    () => import("@/app/(tools)/signature-image-processing/page"),
    { loading: ToolLoadingState }
  ),
  "visa-forms": dynamic(
    () => import("@/app/(tools)/(visa)/visa-forms/page"),
    { loading: ToolLoadingState }
  ),
  "visa-checker": dynamic(
    () => import("@/app/(tools)/(visa)/visa-checker/page"),
    { loading: ToolLoadingState }
  ),
  "portal-wallet": dynamic(
    () => import("@/app/(tools)/document-vault/page"),
    { loading: ToolLoadingState }
  ),
  "document-vault": dynamic(
    () => import("@/app/(tools)/document-vault/page"),
    { loading: ToolLoadingState }
  ),
  "pdf-processing": dynamic(
    () => import("@/app/(tools)/pdf-processing/page"),
    { loading: ToolLoadingState }
  ),
  "case-status": dynamic(
    () => import("@/app/(tools)/case-status/page"),
    { loading: ToolLoadingState }
  ),
  "interview-prep": dynamic(
    () => import("@/app/(tools)/interview-prep/page"),
    { loading: ToolLoadingState }
  ),
  "visa-case-strength-checker": dynamic(
    () => import("@/app/(tools)/visa-case-strength-checker/page"),
    { loading: ToolLoadingState }
  ),
  "221g-action-planner": dynamic(
    () => import("@/app/(tools)/(visa)/221g-action-planner/page"),
    { loading: ToolLoadingState }
  ),
  "book-appointment": dynamic(
    () => import("@/app/(tools)/book-appointment/page"),
    { loading: ToolLoadingState }
  ),
  "police-verification": dynamic(
    () => import("@/app/(tools)/police-verification/page"),
    { loading: ToolLoadingState }
  ),
  "visa-eligibility": dynamic(
    () => import("@/app/(tools)/visa-eligibility/page"),
    { loading: ToolLoadingState }
  ),
  "passport-ocr": dynamic(
    () => import("@/components/tools/PassportOcrTool"),
    { loading: ToolLoadingState }
  ),

  // Guides
  "passport-guide": dynamic(() => import("@/app/(tools)/guides/passport-guide/page"), {
    loading: GuideLoadingState,
  }),
  "birth-certificate-guide": dynamic(
    () => import("@/app/(tools)/guides/birth-certificate-guide/page"),
    { loading: GuideLoadingState }
  ),
  "cnic-guide": dynamic(() => import("@/app/(tools)/guides/cnic-guide/page"), {
    loading: GuideLoadingState,
  }),
  "frc-guide": dynamic(() => import("@/app/(tools)/guides/frc-guide/page"), {
    loading: GuideLoadingState,
  }),
  "nikah-nama-guide": dynamic(() => import("@/app/(tools)/guides/nikah-nama-guide/page"), {
    loading: GuideLoadingState,
  }),
  "police-verification-guide": dynamic(
    () => import("@/app/(tools)/guides/police-verification-guide/page"),
    { loading: GuideLoadingState }
  ),
  "police-certificate": dynamic(
    () => import("@/app/(tools)/guides/police-certificate/page"),
    { loading: GuideLoadingState }
  ),
  "polio-vaccination-guide": dynamic(
    () => import("@/app/(tools)/guides/polio-vaccination-guide/page"),
    { loading: GuideLoadingState }
  ),
  "step-parent-guide": dynamic(() => import("@/app/(tools)/guides/step-parent-guide/page"), {
    loading: GuideLoadingState,
  }),
  "adoptive-parent-guide": dynamic(
    () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
    { loading: GuideLoadingState }
  ),
  "adoption-guide": dynamic(
    () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
    { loading: GuideLoadingState }
  ),
  "asset-document-guide": dynamic(
    () => import("@/app/(tools)/guides/asset-document-guide/page"),
    { loading: GuideLoadingState }
  ),
  "bona-marriage-guide": dynamic(
    () => import("@/app/(tools)/guides/bona-marriage-guide/page"),
    { loading: GuideLoadingState }
  ),
  "educational-certificates-us-visa": dynamic(
    () => import("@/app/(tools)/guides/educational-certificates-us-visa/page"),
    { loading: GuideLoadingState }
  ),
  "employment-certificate-guide": dynamic(
    () => import("@/app/(tools)/guides/employment-certificate-guide/page"),
    { loading: GuideLoadingState }
  ),
  "visa-strength-guide": dynamic(
    () => import("@/app/(tools)/guides/visa-strength-guide/page"),
    { loading: GuideLoadingState }
  ),
  "all-guides": dynamic(() => import("@/app/(tools)/guides/page"), {
    loading: GuideLoadingState,
  }),
};

function getInlineGuideProps(slug: string): Record<string, unknown> {
  if (slug === "passport" || slug === "passport-photos" || slug === "photo-booth") {
    return { showHeader: true, mode: "journey" };
  }
  if (slug === "document-translation" || slug === "translation") {
    return { showHeader: true, mode: "journey", showRequestsLink: false };
  }
  return {};
}

/**
 * Directly mounts and renders the selected Guide component inside the journey,
 * evaluating guide access against the current Journey's plan/tier.
 */
export const GuidePageOverlay: React.FC<GuidePageOverlayProps> = ({
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

  // Lock body scroll while guide is open
  useEffect(() => {
    if (!guideUrl) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [guideUrl]);

// ── DYNAMIC MULTI-STEP FORM ─────────────────────────────────────────────────
const DynamicMultiStepForm = dynamic(
  () =>
    import("@/app/components/forms/auto-visaform-filling/MultiStepForm").then(
      (mod) => mod.MultiStepForm
    ),
  {
    loading: () => (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
        <Loader2 size={32} className="text-primary animate-spin" />
        <span className="text-xs font-medium text-slate-500">Loading form wizard...</span>
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

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const detectedFormCode = useMemo(() => extractFormCode(guideUrl), [guideUrl]);

  const slug = useMemo(() => {
    if (!guideUrl) return "";
    const clean = guideUrl.split("?")[0].replace(/\/$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length === 0 || clean === "/guides") return "all-guides";
    return parts[parts.length - 1];
  }, [guideUrl]);

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
        className="fixed inset-0 z-[600] bg-[#f8fafc] overflow-y-auto font-sans animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={`Form ${detectedFormCode.toUpperCase()} Auto-Filler`}
      >
        {/* ── Close Button ── */}
        <button
          onClick={onClose}
          className="fixed top-4 right-5 z-[800] w-9 h-9 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200/90 backdrop-blur transition-all active:scale-95 cursor-pointer"
          aria-label="Close form wizard"
          title="Close (Esc)"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <div className="min-h-screen w-full">
          <PlanContext.Provider value={effectivePlan}>
            <main className="min-h-screen">
              <DynamicMultiStepForm formCode={detectedFormCode} />
            </main>
          </PlanContext.Provider>
        </div>
      </div>
    );
  }

  const GuideComponent = GUIDE_COMPONENTS[slug];
  const inlineProps = getInlineGuideProps(slug);

  return (
    <div
      className="fixed inset-0 z-[600] bg-[#f8fafc] overflow-y-auto font-sans animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTool ? "Tool View" : "Guide View"}
    >
      {/* ── Light Floating Close Button ── */}
      <button
        onClick={onClose}
        className="fixed top-4 right-5 z-[800] w-9 h-9 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200/90 backdrop-blur transition-all active:scale-95 cursor-pointer"
        aria-label={isTool ? "Close tool" : "Close guide"}
        title="Close (Esc)"
      >
        <X size={18} strokeWidth={2.2} />
      </button>

      {/* ── Guide Component Rendered Directly with Journey Plan Context ── */}
      <div className="min-h-screen w-full">
        {GuideComponent ? (
          <PlanContext.Provider value={effectivePlan}>
            <GuideComponent {...inlineProps} />
          </PlanContext.Provider>
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {isTool ? "Tool Not Found" : "Guide Not Found"}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Could not load {isTool ? "tool" : "guide"} for:{" "}
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
  );
};

export default GuidePageOverlay;
