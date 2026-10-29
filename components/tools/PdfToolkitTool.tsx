"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePDFStore } from "@/lib/store";
import { useLanguage } from "@/app/context/LanguageContext";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
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
  iconWrap: string;
  activeCard: string;
}[] = [
  {
    id: "upload",
    title: "Edit PDF",
    desc: "Add text, shapes, signatures",
    Icon: PenLine,
    iconWrap: "bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300",
    activeCard: "border-teal-500 bg-teal-50/70 dark:bg-teal-950/30",
  },
  {
    id: "merge",
    title: "Merge PDFs",
    desc: "Combine multiple files",
    Icon: GitMerge,
    iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    activeCard: "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30",
  },
  {
    id: "compress",
    title: "Compress PDF",
    desc: "Shrink file size fast",
    Icon: Shrink,
    iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
    activeCard: "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30",
  },
  {
    id: "convert",
    title: "Convert to PDF",
    desc: "From Word, JPG and more",
    Icon: RefreshCw,
    iconWrap: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
    activeCard: "border-violet-500 bg-violet-50/70 dark:bg-violet-950/30",
  },
];

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

  return (
    <div className={`w-full ${className}`}>
      {/* Full Screen Editor (only for "Edit" flow) */}
      {pdfFile && (
        <div className="fixed inset-0 z-[100001] flex flex-col bg-white dark:bg-slate-900">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-slate-800">
            <button
              onClick={handleCloseEditor}
              className="rounded-lg bg-[#0d7377] px-4 py-2 font-semibold text-white transition hover:bg-[#095457]"
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
      )}

      {/* Normal UI - Tabs + Content */}
      {!pdfFile && (
        <div className="flex flex-col items-center justify-center">
          {/* Header */}
          {showHeader && (
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-slate-100">
                PDF Tool Kit
              </h1>
              <p className="mb-4 text-gray-600 dark:text-slate-400">
                Pick a tool below, then load your file.
              </p>
              <div className="flex justify-center">
                <QuickAccessButton
                  item={{
                    id: "pdf-toolkit",
                    title: "PDF Tool Kit",
                    href: "/pdf-processing",
                    icon_name: "Files",
                  }}
                />
              </div>
            </div>
          )}

          {/* Tool picker — accent-colored cards, 2x2 on mobile, 4-across on desktop */}
          <div className="mb-6 grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4 lg:max-w-4xl lg:grid-cols-4">
            {PDF_TOOLS.map(({ id, title, desc, Icon, iconWrap, activeCard }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800/80 ${
                    active
                      ? activeCard
                      : "border-gray-100 hover:border-gray-200 dark:border-slate-700/60 dark:hover:border-slate-600"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="w-full">
                    <span className="block text-sm font-bold text-gray-900 sm:text-base dark:text-slate-100">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-gray-500 dark:text-slate-400">
                      {desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content based on active tab */}
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:min-h-[50vh] md:p-8 dark:border-slate-800 dark:bg-slate-900">
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
          </div>
        </div>
      )}
    </div>
  );
}
