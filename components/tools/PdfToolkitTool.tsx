"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePDFStore } from "@/lib/store";
import { useLanguage } from "@/app/context/LanguageContext";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { ToolLayout, TOOL_THEMES, type ToolRule } from "@/components/tools/layout";
import { PenLine, GitMerge, Shrink, RefreshCw } from "lucide-react";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";

import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";

// Dynamically import components (client-only)
const PDFUpload = dynamic(
  () => import("@/app/components/pdf-editor/PdfUpload").then((mod) => mod.PDFUpload),
  { ssr: false }
);
const PDFEditor = dynamic(
  () => import("@/app/components/pdf-editor/PdfEditor").then((mod) => mod.PDFEditor),
  { ssr: false }
);
const PDFMergeAdvanced = dynamic(() => import("@/app/components/pdf-tools/PdfMerge"), {
  ssr: false,
});
const CompressPDF = dynamic(() => import("@/app/components/pdf-tools/CompressPdf"), { ssr: false });
const MultiFormatConverter = dynamic(
  () => import("@/app/components/pdf-tools/MultiFormatConverter"),
  { ssr: false }
);

type PdfTab = "upload" | "merge" | "compress" | "convert";

const PDF_TOOLS: {
  id: PdfTab;
  title: string;
  desc: string;
  Icon: typeof PenLine;
}[] = [
  {
    id: "upload",
    title: "Edit PDF",
    desc: "Add text, shapes, signatures",
    Icon: PenLine,
  },
  {
    id: "merge",
    title: "Merge PDFs",
    desc: "Combine multiple files",
    Icon: GitMerge,
  },
  {
    id: "compress",
    title: "Compress PDF",
    desc: "Shrink file size fast",
    Icon: Shrink,
  },
  {
    id: "convert",
    title: "Convert to PDF",
    desc: "From Word, JPG and more",
    Icon: RefreshCw,
  },
];

const RULES: ToolRule[] = [
  { label: "Edit PDF", value: "Add text, shapes and signatures to a PDF" },
  { label: "Merge PDFs", value: "Combine several files into one, in your order" },
  { label: "Compress PDF", value: "Shrink a large file so a portal accepts it" },
  { label: "Convert to PDF", value: "Turn Word files, JPGs and more into a PDF" },
];

// Inside the shared tool layout the four tools pick up the toolkit theme: their own banners and
// buttons use the Rahvana brand variables, so point those at the tool accent for this subtree.
const THEMED_BRAND_VARS = {
  "--rahvana-primary": "var(--tool-accent)",
  "--rahvana-primary-light": "var(--tool-accent)",
  "--rahvana-primary-dark": "var(--tool-accent-dark)",
  "--rahvana-primary-pale": "var(--tool-accent-tint)",
} as React.CSSProperties;

const EDITOR_THEME_VARS = {
  "--tool-accent": TOOL_THEMES.pdf.accent,
  "--tool-accent-dark": TOOL_THEMES.pdf.accentDark,
} as React.CSSProperties;

export interface PdfToolkitToolProps extends ToolModeProps {
  showHeader?: boolean;
  className?: string;
}

export default function PdfToolkitTool({
  showHeader = true,
  className = "",
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: PdfToolkitToolProps) {
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  const { t } = useLanguage();
  const accountPlan = usePlan();
  const { pdfFile, reset } = usePDFStore();
  const [activeTab, setActiveTab] = useState<PdfTab>("upload");

  // Determine effective plan tier: in journey mode, evaluate against the specific journey's tier, otherwise account tier
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const effectiveTier: PlanTier = React.useMemo(() => {
    if (isJourney) {
      if (rawJourneyTier) {
        return normalizePlanTier(rawJourneyTier);
      }
      if (
        journeyContext?.journeyCategory &&
        accountPlan.journeyTiers[journeyContext.journeyCategory]
      ) {
        return accountPlan.journeyTiers[journeyContext.journeyCategory];
      }
    }
    return accountPlan.tier;
  }, [isJourney, rawJourneyTier, journeyContext, accountPlan.journeyTiers, accountPlan.tier]);

  const handleCloseEditor = () => reset();

  useEffect(() => {
    if (!isJourney) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isJourney]);

  const editorOverlay = pdfFile && (
    <div className="fixed inset-0 z-[100001] flex flex-col bg-white dark:bg-slate-900">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-slate-800">
        <button
          onClick={handleCloseEditor}
          className="rounded-lg bg-[var(--tool-accent,#0d7377)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--tool-accent-dark,#095457)]"
        >
          ← {t("pdfProcessing.back")}
        </button>
      </div>
      <div className="min-h-0 w-full flex-1">
        <ResultGate
          feature="pdf_toolkit"
          planTier={effectiveTier}
          standaloneToolId={isJourney ? undefined : "pdf-toolkit"}
        >
          <PDFEditor />
        </ResultGate>
      </div>
    </div>
  );

  const activeTool = (
    <ResultGate
      feature="pdf_toolkit"
      planTier={effectiveTier}
      standaloneToolId={isJourney ? undefined : "pdf-toolkit"}
    >
      {activeTab === "upload" && <PDFUpload />}
      {activeTab === "merge" && <PDFMergeAdvanced />}
      {activeTab === "compress" && <CompressPDF />}
      {activeTab === "convert" && <MultiFormatConverter />}
    </ResultGate>
  );

  // One layout for every entry point (standalone page and journey); the launcher sets the
  // placement (ToolSurfaceProvider) and the layout adapts its chrome.
  return (
    <>
      {/* The editor is a full-screen layer: keep it outside the layout's stacking context. */}
      {pdfFile && <div style={EDITOR_THEME_VARS}>{editorOverlay}</div>}
      <ToolLayout
        theme="pdf"
        showHeader={showHeader}
        title="PDF Toolkit"
        tagline="Edit, merge, compress or convert your documents before you upload them."
        priceOrDuration="4 tools in one"
        quickAccessItem={
          isJourney
            ? undefined
            : {
                id: "pdf-toolkit",
                title: "PDF Tool Kit",
                href: "/pdf-processing",
                icon_name: "Files",
              }
        }
        layout="single"
        rules={RULES}
        className={className}
      >
        <div style={THEMED_BRAND_VARS}>
          {/* Tool picker: one accent for all four, so the page reads as one tool */}
          <div
            role="tablist"
            aria-label="PDF tools"
            className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          >
            {PDF_TOOLS.map(({ id, title, desc, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
                    active
                      ? "border-[var(--tool-accent)] bg-[var(--tool-accent-tint)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      active
                        ? "bg-[var(--tool-accent)] text-white"
                        : "bg-[var(--tool-accent-tint)] text-[var(--tool-accent-dark)]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="w-full">
                    <span className="block text-sm font-bold text-slate-900 sm:text-base">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-slate-600">{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {!pdfFile && <div className="md:min-h-[50vh]">{activeTool}</div>}
        </div>
      </ToolLayout>
    </>
  );
}
