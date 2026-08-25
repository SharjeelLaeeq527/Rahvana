"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePDFStore } from "@/lib/store";

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
import { useLanguage } from "@/app/context/LanguageContext";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { PenLine, GitMerge, Shrink, RefreshCw } from "lucide-react";

type PdfTab = "upload" | "merge" | "compress" | "convert";

// Each tool card carries its own light accent so the options are easy to tell apart.
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
    iconWrap: "bg-teal-100 text-teal-600",
    activeCard: "border-teal-500 bg-teal-50/70",
  },
  {
    id: "merge",
    title: "Merge PDFs",
    desc: "Combine multiple files",
    Icon: GitMerge,
    iconWrap: "bg-blue-100 text-blue-600",
    activeCard: "border-blue-500 bg-blue-50/70",
  },
  {
    id: "compress",
    title: "Compress PDF",
    desc: "Shrink file size fast",
    Icon: Shrink,
    iconWrap: "bg-amber-100 text-amber-600",
    activeCard: "border-amber-500 bg-amber-50/70",
  },
  {
    id: "convert",
    title: "Convert to PDF",
    desc: "From Word, JPG and more",
    Icon: RefreshCw,
    iconWrap: "bg-violet-100 text-violet-600",
    activeCard: "border-violet-500 bg-violet-50/70",
  },
];

export default function PDFProcessingPage() {
  const { t } = useLanguage();
  const { pdfFile, reset } = usePDFStore();
  // Add "compress" and "convert" to tabs
  const [activeTab, setActiveTab] = useState<PdfTab>("upload");

  const handleCloseEditor = () => reset();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-gray-50 flex flex-col items-center justify-center site-main-py site-main-px mt-[55px]">
      {/* Full Screen Editor (only for "Edit" flow) */}
      {pdfFile && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-white">
          <div className="flex shrink-0 justify-between items-center p-4 border-b border-gray-200">
            <button
              onClick={handleCloseEditor}
              className="bg-rahvana-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-rahvana-primary-dark transition"
            >
              ← {t("pdfProcessing.back")}
            </button>
          </div>
          <div className="min-h-0 w-full flex-1">
            <ResultGate feature="pdf_toolkit">
              <PDFEditor />
            </ResultGate>
          </div>
        </div>
      )}

      {/* Normal UI - Tabs + Content */}
      {!pdfFile && (
        <>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Tool Kit</h1>
            <p className="text-gray-600 mb-4">Pick a tool below, then load your file.</p>
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

          {/* Tool picker — accent-colored cards, 2x2 on mobile, 4-across on desktop */}
          <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4 lg:max-w-3xl lg:grid-cols-4">
            {PDF_TOOLS.map(({ id, title, desc, Icon, iconWrap, activeCard }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    active ? activeCard : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="w-full">
                    <span className="block text-sm font-bold text-gray-900 sm:text-base">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-gray-500">{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content based on active tab */}
          <div className="w-full bg-white shadow-xl rounded-2xl p-6 md:p-8 md:min-h-[60vh]">
            <ResultGate feature="pdf_toolkit">
              {activeTab === "upload" && <PDFUpload />}
              {activeTab === "merge" && <PDFMergeAdvanced />}
              {activeTab === "compress" && <CompressPDF />}
              {activeTab === "convert" && <MultiFormatConverter />}
            </ResultGate>
          </div>
        </>
      )}
    </main>
  );
}
