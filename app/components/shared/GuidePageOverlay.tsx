"use client";

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Loader2 } from "lucide-react";

interface GuidePageOverlayProps {
  /** Relative URL of the guide page, e.g. "/guides/passport-guide" */
  guideUrl: string | null;
  /** Called when the user dismisses the overlay */
  onClose: () => void;
}

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
    <Loader2 size={32} className="text-primary animate-spin" />
    <span className="text-xs font-medium text-slate-500">Loading guide...</span>
  </div>
);

// Map of slug -> dynamically imported Guide React component
const GUIDE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "passport-guide": dynamic(() => import("@/app/(tools)/guides/passport-guide/page"), {
    loading: LoadingState,
  }),
  "birth-certificate-guide": dynamic(
    () => import("@/app/(tools)/guides/birth-certificate-guide/page"),
    { loading: LoadingState }
  ),
  "cnic-guide": dynamic(() => import("@/app/(tools)/guides/cnic-guide/page"), {
    loading: LoadingState,
  }),
  "frc-guide": dynamic(() => import("@/app/(tools)/guides/frc-guide/page"), {
    loading: LoadingState,
  }),
  "nikah-nama-guide": dynamic(() => import("@/app/(tools)/guides/nikah-nama-guide/page"), {
    loading: LoadingState,
  }),
  "police-verification-guide": dynamic(
    () => import("@/app/(tools)/guides/police-verification-guide/page"),
    { loading: LoadingState }
  ),
  "police-certificate": dynamic(
    () => import("@/app/(tools)/guides/police-certificate/page"),
    { loading: LoadingState }
  ),
  "polio-vaccination-guide": dynamic(
    () => import("@/app/(tools)/guides/polio-vaccination-guide/page"),
    { loading: LoadingState }
  ),
  "step-parent-guide": dynamic(() => import("@/app/(tools)/guides/step-parent-guide/page"), {
    loading: LoadingState,
  }),
  "adoptive-parent-guide": dynamic(
    () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
    { loading: LoadingState }
  ),
  "adoption-guide": dynamic(
    () => import("@/app/(tools)/guides/adoptive-parent-guide/page"),
    { loading: LoadingState }
  ),
  "asset-document-guide": dynamic(
    () => import("@/app/(tools)/guides/asset-document-guide/page"),
    { loading: LoadingState }
  ),
  "bona-marriage-guide": dynamic(
    () => import("@/app/(tools)/guides/bona-marriage-guide/page"),
    { loading: LoadingState }
  ),
  "educational-certificates-us-visa": dynamic(
    () => import("@/app/(tools)/guides/educational-certificates-us-visa/page"),
    { loading: LoadingState }
  ),
  "employment-certificate-guide": dynamic(
    () => import("@/app/(tools)/guides/employment-certificate-guide/page"),
    { loading: LoadingState }
  ),
  "visa-strength-guide": dynamic(
    () => import("@/app/(tools)/guides/visa-strength-guide/page"),
    { loading: LoadingState }
  ),
  "all-guides": dynamic(() => import("@/app/(tools)/guides/page"), {
    loading: LoadingState,
  }),
};

/**
 * Directly mounts and renders the selected Guide component inside the journey,
 * avoiding iframe connection issues while keeping the current journey URL intact.
 */
export const GuidePageOverlay: React.FC<GuidePageOverlayProps> = ({
  guideUrl,
  onClose,
}) => {
  // Lock body scroll while guide is open
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

  const slug = useMemo(() => {
    if (!guideUrl) return "";
    const clean = guideUrl.split("?")[0].replace(/\/$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length === 0 || clean === "/guides") return "all-guides";
    return parts[parts.length - 1];
  }, [guideUrl]);

  if (!guideUrl) return null;

  const GuideComponent = GUIDE_COMPONENTS[slug];

  return (
    <div
      className="fixed inset-0 z-[600] bg-[#f8fafc] overflow-y-auto font-sans animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Guide View"
    >
      {/* ── Light Floating Close Button ── */}
      <button
        onClick={onClose}
        className="fixed top-4 right-5 z-[800] w-9 h-9 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200/90 backdrop-blur transition-all active:scale-95 cursor-pointer"
        aria-label="Close guide"
        title="Close (Esc)"
      >
        <X size={18} strokeWidth={2.2} />
      </button>

      {/* ── Guide Component Rendered Directly ── */}
      <div className="min-h-screen w-full">
        {GuideComponent ? (
          <GuideComponent />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Guide Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">
              Could not load guide for: <code className="text-xs bg-slate-100 p-1 rounded">{guideUrl}</code>
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
