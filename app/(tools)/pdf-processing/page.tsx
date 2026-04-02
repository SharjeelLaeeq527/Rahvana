"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePDFStore } from "@/lib/store";

// Dynamically import components (client-only)
const PDFUpload = dynamic(
  () =>
    import("@/app/components/pdf-editor/PdfUpload").then(
      (mod) => mod.PDFUpload,
    ),
  { ssr: false },
);
const PDFEditor = dynamic(
  () =>
    import("@/app/components/pdf-editor/PdfEditor").then(
      (mod) => mod.PDFEditor,
    ),
  { ssr: false },
);
const PDFMergeAdvanced = dynamic(
  () => import("@/app/components/pdf-tools/PdfMerge"),
  { ssr: false },
);
const CompressPDF = dynamic(
  () => import("@/app/components/pdf-tools/CompressPdf"),
  { ssr: false },
);
const MultiFormatConverter = dynamic(
  () => import("@/app/components/pdf-tools/MultiFormatConverter"),
  { ssr: false },
);
import { useLanguage } from "@/app/context/LanguageContext";

export default function PDFProcessingPage() {
  const { t } = useLanguage();
  const { pdfFile, reset } = usePDFStore();
  // Add "compress" and "convert" to tabs
  const [activeTab, setActiveTab] = useState<
    "upload" | "merge" | "compress" | "convert"
  >("upload");

  const handleCloseEditor = () => reset();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-gray-50 flex flex-col items-center justify-center site-main-py site-main-px">
      {/* Full Screen Editor (only for "Edit" flow) */}
      {pdfFile && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <button
              onClick={handleCloseEditor}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              ← {t("pdfProcessing.back")}
            </button>
          </div>
          <div className="h-[calc(100vh-64px)] w-full">
            <PDFEditor />
          </div>
        </div>
      )}

      {/* Normal UI - Tabs + Content */}
      {!pdfFile && (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 md:gap-4 mb-8 bg-white shadow-md rounded-full p-2 justify-center">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2.5 md:px-6 md:py-3 rounded-full font-semibold transition text-sm md:text-base ${
                activeTab === "upload"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.edit")}
            </button>
            <button
              onClick={() => setActiveTab("merge")}
              className={`px-4 py-2.5 md:px-6 md:py-3 rounded-full font-semibold transition text-sm md:text-base ${
                activeTab === "merge"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.merge")}
            </button>
            <button
              onClick={() => setActiveTab("compress")}
              className={`px-4 py-2.5 md:px-6 md:py-3 rounded-full font-semibold transition text-sm md:text-base ${
                activeTab === "compress"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.compress")}
            </button>
            <button
              onClick={() => setActiveTab("convert")}
              className={`px-4 py-2.5 md:px-6 md:py-3 rounded-full font-semibold transition text-sm md:text-base ${
                activeTab === "convert"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("pdfProcessing.tabs.convert")}
            </button>
          </div>

          {/* Content based on active tab */}
          <div className="w-full bg-white shadow-xl rounded-2xl p-6 md:p-8 md:min-h-[60vh]">
            {activeTab === "upload" && <PDFUpload />}
            {activeTab === "merge" && <PDFMergeAdvanced />}
            {activeTab === "compress" && <CompressPDF />}
            {activeTab === "convert" && <MultiFormatConverter />}
          </div>
        </>
      )}
    </main>
  );
}
