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

export default function PDFProcessingPage() {
  const { t } = useLanguage();
  const { pdfFile, reset } = usePDFStore();
  // Add "compress" and "convert" to tabs
  const [activeTab, setActiveTab] = useState<"upload" | "merge" | "compress" | "convert">("upload");

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
            <p className="text-gray-600 mb-4">
              Merge, compress, convert, and edit your PDF files easily.
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

          {/* Tabs — 2x2 grid on mobile, single pill row on larger screens */}
          <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-md sm:flex sm:w-auto sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-4 sm:rounded-full">
            <button
              onClick={() => setActiveTab("upload")}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition sm:w-auto md:px-6 md:py-3 md:text-base ${
                activeTab === "upload"
                  ? "bg-rahvana-primary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.edit")}
            </button>
            <button
              onClick={() => setActiveTab("merge")}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition sm:w-auto md:px-6 md:py-3 md:text-base ${
                activeTab === "merge"
                  ? "bg-rahvana-primary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.merge")}
            </button>
            <button
              onClick={() => setActiveTab("compress")}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition sm:w-auto md:px-6 md:py-3 md:text-base ${
                activeTab === "compress"
                  ? "bg-rahvana-primary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.compress")}
            </button>
            <button
              onClick={() => setActiveTab("convert")}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition sm:w-auto md:px-6 md:py-3 md:text-base ${
                activeTab === "convert"
                  ? "bg-rahvana-primary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.convert")}
            </button>
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
