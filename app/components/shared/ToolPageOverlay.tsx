"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
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

interface ToolPageOverlayProps {
  /** Internal route href that triggered this tool, e.g. "/passport", "/document-translation" */
  toolHref: string | null;
  /** Called when the user dismisses the overlay */
  onClose: () => void;
  /** Optional journey plan override so tool evaluates against journey tier */
  plan?: PlanContextValue;
  /** Optional journey tier override (e.g. "premium" | "executive") */
  tier?: PlanTier | string;
  /** Keep the roadmap navigation visible above the tool */
  showJourneyHeader?: boolean;
  /** Extra props forwarded to the tool component (e.g. journeyContext for PassportPhotoTool) */
  toolProps?: Record<string, unknown>;
}

const LoadingState = () => (
  <div className="flex min-h-[calc(100dvh-76px)] items-center justify-center bg-[#f8fafc]">
    <Loader size="md" text="Loading tool..." className="!gap-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-0" />
  </div>
);

function safeDynamic(
  importFn: () => Promise<any>,
  loadingComponent: React.ComponentType<any>
) {
  return dynamic(
    () =>
      importFn().catch((error) => {
        const msg = String(error?.message || "");
        if (
          typeof window !== "undefined" &&
          (msg.includes("ChunkLoadError") ||
            msg.includes("Loading chunk") ||
            msg.includes("Failed to fetch dynamically imported module"))
        ) {
          const reloadKey = "chunk_reload_" + window.location.pathname;
          if (!sessionStorage.getItem(reloadKey)) {
            sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
          }
        }
        throw error;
      }),
    { loading: loadingComponent }
  );
}

// ── TOOL_COMPONENTS ──────────────────────────────────────────────────────────
// Maps an href prefix to a dynamically imported tool component.
// External (https://) links are NOT handled here — those continue to open in a
// new tab in the callers.
// ─────────────────────────────────────────────────────────────────────────────
const TOOL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "/passport": safeDynamic(() => import("@/components/tools/PassportPhotoTool"), LoadingState),
  "/document-translation": safeDynamic(
    () => import("@/components/tools/DocumentTranslationTool"),
    LoadingState
  ),
  "/affidavit-support-calculator": safeDynamic(
    () => import("@/app/(tools)/affidavit-support-calculator/page"),
    LoadingState
  ),
  "/signature-image-processing": safeDynamic(
    () => import("@/app/(tools)/signature-image-processing/page"),
    LoadingState
  ),
  "/visa-forms": safeDynamic(
    () => import("@/app/(tools)/(visa)/visa-forms/page"),
    LoadingState
  ),
  "/visa-checker": safeDynamic(
    () => import("@/app/(tools)/(visa)/visa-checker/page"),
    LoadingState
  ),
  "/portal-wallet": safeDynamic(
    () => import("@/app/(tools)/document-vault/page"),
    LoadingState
  ),
  "/document-vault": safeDynamic(
    () => import("@/app/(tools)/document-vault/page"),
    LoadingState
  ),
  "/pdf-processing": safeDynamic(
    () => import("@/app/(tools)/pdf-processing/page"),
    LoadingState
  ),
  "/case-status": safeDynamic(
    () => import("@/app/(tools)/case-status/page"),
    LoadingState
  ),
  "/interview-prep/my-sessions": safeDynamic(
    () => import("@/app/(tools)/interview-prep/my-sessions/page"),
    LoadingState
  ),
  "/interview-prep/result": safeDynamic(
    () => import("@/app/(tools)/interview-prep/result/page"),
    LoadingState
  ),
  "/interview-prep": safeDynamic(
    () => import("@/app/(tools)/interview-prep/page"),
    LoadingState
  ),
  "/visa-case-strength-checker": safeDynamic(
    () => import("@/app/(tools)/visa-case-strength-checker/page"),
    LoadingState
  ),
  "/221g-action-planner": safeDynamic(
    () => import("@/app/(tools)/(visa)/221g-action-planner/page"),
    LoadingState
  ),
  "/book-appointment": safeDynamic(
    () => import("@/app/(tools)/book-appointment/page"),
    LoadingState
  ),
  "/police-verification": dynamic(
    () => import("@/app/(tools)/police-verification/page"),
    { loading: LoadingState }
  ),
  "/visa-eligibility": dynamic(
    () => import("@/app/(tools)/visa-eligibility/page"),
    { loading: LoadingState }
  ),
  "/passport-ocr": dynamic(
    () => import("@/components/tools/PassportOcrTool"),
    { loading: LoadingState }
  ),
};

// ── DYNAMIC MULTI-STEP FORM ─────────────────────────────────────────────────
const DynamicMultiStepForm = dynamic(
  () =>
    import("@/app/components/forms/auto-visaform-filling/MultiStepForm").then(
      (mod) => mod.MultiStepForm
    ),
  {
    loading: () => (
      <div className="flex min-h-[calc(100dvh-76px)] items-center justify-center bg-[#f8fafc]">
        <Loader size="md" text="Loading form wizard..." />
      </div>
    ),
  }
);

/**
 * Extracts a form code if the URL points to a specific form wizard
 * (e.g. /visa-forms/i130/wizard, /visa-forms/i130a, /visa-forms/g1450/wizard, /visa-forms/i912/wizard)
 */
function extractFormCode(href: string | null): string | null {
  if (!href) return null;
  const cleanHref = href.split("?")[0].replace(/\/$/, "");
  const match = cleanHref.match(/^\/(?:visa-forms|forms)\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const rawCode = match[1].toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["page", "all", "directory", "wizard"].includes(rawCode)) return null;
  return rawCode || null;
}

/**
 * Resolve the best tool component for a given href.
 * Tries exact match first, then longest-prefix match.
 */
function resolveToolComponent(href: string): React.ComponentType<any> | null {
  if (!href) return null;
  // Normalize by stripping query strings and trailing slashes for lookup
  const cleanHref = href.split("?")[0].replace(/\/$/, "");
  if (TOOL_COMPONENTS[cleanHref]) return TOOL_COMPONENTS[cleanHref];
  if (TOOL_COMPONENTS[href]) return TOOL_COMPONENTS[href];
  // Longest-prefix match (handles /passport-photos, /portal-wallet/..., etc.)
  const match = Object.entries(TOOL_COMPONENTS)
    .filter(([key]) => cleanHref.startsWith(key + "/") || cleanHref === key || href.startsWith(key + "/") || href === key)
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[1] : null;
}

/** Extra props injected into specific tools when running inside the journey. */
function getInlineProps(href: string, extra?: Record<string, unknown>): Record<string, unknown> {
  const base: Record<string, unknown> = { ...(extra || {}) };
  if (href.startsWith("/passport")) {
    return { showRequirements: true, ...base, showHeader: true, mode: "journey" };
  }
  if (href.startsWith("/document-translation")) {
    return { showRequirements: true, ...base, showHeader: true, mode: "journey", showRequestsLink: false };
  }
  if (href.startsWith("/interview-prep")) {
    const searchStr = href.includes("?") ? href.split("?")[1] : "";
    const params = new URLSearchParams(searchStr);
    const journeyId = params.get("journey_id") || (extra?.journeyId as string) || undefined;
    const sessionId = params.get("sessionId") || (extra?.sessionId as string) || undefined;
    const categorySlug = params.get("category_slug") || (extra?.categorySlug as string) || undefined;
    return {
      ...base,
      isEmbedded: true,
      mode: "journey",
      toolHref: href,
      journeyId,
      sessionId,
      categorySlug,
    };
  }
  return base;
}

/**
 * Directly mounts and renders the selected Tool component inside the journey,
 * evaluating access against the Journey's plan/tier rather than the account tier.
 */
export const ToolPageOverlay: React.FC<ToolPageOverlayProps> = ({
  toolHref,
  onClose,
  plan: passedPlan,
  tier: passedTier,
  showJourneyHeader = true,
  toolProps: extraProps,
}) => {
  const [journeyHeaderBottom, setJourneyHeaderBottom] = useState(112);
  const accountPlan = usePlan();

  useLayoutEffect(() => {
    if (!toolHref || !showJourneyHeader) return;
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
  }, [toolHref, showJourneyHeader]);

  // Evaluate tool plan based on the Journey tier
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

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (!toolHref) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [toolHref]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!toolHref || !showJourneyHeader) return;
    const closeFromJourneyHeader = () => onClose();
    window.addEventListener("journey-overlay-close", closeFromJourneyHeader);
    return () => window.removeEventListener("journey-overlay-close", closeFromJourneyHeader);
  }, [toolHref, showJourneyHeader, onClose]);

  const detectedFormCode = useMemo(() => extractFormCode(toolHref), [toolHref]);

  const overlayTitle = useMemo(() => {
    if (!toolHref) return null;
    if (detectedFormCode) return `Form ${detectedFormCode.toUpperCase()}`;
    const slug = toolHref.split("?")[0].split("/").filter(Boolean).at(-1) || "Tool";
    if (["passport", "passport-photos", "photo-booth"].includes(slug)) return "Photo Booth";
    if (slug === "interview-prep") return "Interview Prep";
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [toolHref, detectedFormCode]);

  useEffect(() => {
    if (!overlayTitle || !showJourneyHeader) return;
    window.dispatchEvent(new CustomEvent("journey-overlay-name", { detail: overlayTitle }));
    return () => window.dispatchEvent(new CustomEvent("journey-overlay-name", { detail: null }));
  }, [overlayTitle, showJourneyHeader]);

  if (!toolHref) return null;

  // Specific Form Wizard (e.g. /visa-forms/i130/wizard, /visa-forms/g1450/wizard, etc.)
  if (detectedFormCode) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-[30] overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f8fafc] font-sans animate-in fade-in duration-200"
        style={{ top: showJourneyHeader ? journeyHeaderBottom : 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Form ${detectedFormCode.toUpperCase()} Auto-Filler`}
      >
        {!showJourneyHeader && (
          <button
            onClick={onClose}
            className="fixed top-4 right-5 z-[800] w-9 h-9 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/90 backdrop-blur transition-all active:scale-95 cursor-pointer"
            aria-label="Close form wizard"
            title="Close (Esc)"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        )}

        <div className="min-h-full w-full">
          <PlanContext.Provider value={effectivePlan}>
            <main className="min-h-full">
              <DynamicMultiStepForm
                formCode={detectedFormCode}
                onClose={onClose}
                isEmbedded={true}
                {...(extraProps || {})}
              />
            </main>
          </PlanContext.Provider>
        </div>
      </div>
    );
  }

  const ToolComponent = resolveToolComponent(toolHref);
  const resolvedProps = getInlineProps(toolHref, extraProps);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[30] overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f8fafc] font-sans animate-in fade-in duration-200"
      style={{ top: showJourneyHeader ? journeyHeaderBottom : 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Tool View"
    >
      {!showJourneyHeader && (
        <button
          onClick={onClose}
          className="fixed top-4 right-5 z-[800] w-9 h-9 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/90 backdrop-blur transition-all active:scale-95 cursor-pointer"
          aria-label="Close tool"
          title="Close (Esc)"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      )}

      {/* ── Tool Component Rendered Directly with Journey Plan Context ── */}
      <div className="min-h-full w-full">
        {ToolComponent ? (
          <PlanContext.Provider value={effectivePlan}>
            <ToolComponent {...resolvedProps} />
          </PlanContext.Provider>
        ) : (
          <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Tool Not Available</h2>
            <p className="text-sm text-slate-500 mb-4">
              Could not load tool for:{" "}
              <code className="text-xs bg-slate-100 p-1 rounded">{toolHref}</code>
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

export default ToolPageOverlay;
