"use client";

import { useState } from "react";
import { usePDFStore } from "@/lib/store";
import { loadPDF } from "@/lib/pdf-utils";
import { AlertCircle, FileCheck } from "lucide-react";
import FileUpload from "@/app/components/shared/FileUpload";
import { useLanguage } from "@/app/context/LanguageContext";

import { loadPdfDocument } from "@/lib/pdfjs/client";

interface UploadResult {
  originalSize: number;
  totalPages: number;
}

export function PDFUpload() {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const { setPdfFile, setPdfDoc, setTotalPages } = usePDFStore();

  const handleFile = async (file: File) => {
    if (!file) return;

    // Prevent selecting another file while processing
    if (loading) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdfProcessing.errors.invalidFile"));
      return;
    }

    // Validate file size
    if (file.size > 100 * 1024 * 1024) {
      setError(t("pdfProcessing.errors.tooLarge"));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Load PDF using existing PDF utility
      const pdfDoc = await loadPDF(file);

      // Load PDF using pdf.js to get page count
      const pdf = await loadPdfDocument(await file.arrayBuffer());

      // Update PDF store
      setPdfFile(file);
      setPdfDoc(pdfDoc);
      setTotalPages(pdf.numPages);

      // Set upload result
      setResult({
        originalSize: file.size,
        totalPages: pdf.numPages,
      });
    } catch (error) {
      console.error("Error loading PDF:", error);

      setError(t("pdfProcessing.editor.errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const mb = bytes / 1024 / 1024;

    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(2)} KB`;
    }

    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="from-rahvana-primary to-rahvana-primary-dark rounded-t-2xl bg-gradient-to-r p-6 text-white md:p-10">
        <h1 className="mb-2 text-center text-3xl font-bold md:mb-3 md:text-5xl">
          {t("pdfProcessing.editor.title")}
        </h1>

        <p className="text-center text-base text-white/90 md:text-lg">
          {t("pdfProcessing.editor.uploadSubtitle")}
        </p>
      </div>

      <div className="p-6 md:p-12">
        {/* File Upload */}
        <div className="mb-6 md:mb-8">
          <div className={`relative ${loading ? "pointer-events-none opacity-60" : ""}`}>
            <FileUpload
              fieldName="pdf"
              accept="application/pdf,.pdf"
              multiple={false}
              variant="default"
              title={t("pdfProcessing.compress.dropzone")}
              buttonText={t("pdfProcessing.editor.loadBtn")}
              helperText={t("pdfProcessing.compress.pdffilesOnly")}
              onFileUpload={(_, file) => {
                if (file instanceof File) {
                  handleFile(file);
                }
              }}
            />

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="border-t-rahvana-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200" />

                  <p className="text-sm font-semibold text-gray-700">
                    {t("pdfProcessing.editor.loading")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-5">
            <div className="flex items-start">
              <AlertCircle className="mt-0.5 mr-3 h-6 w-6 shrink-0 text-red-500" />

              <div>
                <h3 className="mb-1 font-semibold text-red-800">Error</h3>

                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            {/* Success Header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="rounded-full bg-white/20 p-2">
                <FileCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {t("pdfProcessing.editor.successUpload")}
                </h3>

                <p className="text-sm text-white/80">Your PDF is ready to edit</p>
              </div>
            </div>

            {/* Result Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Original Size */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    {t("pdfProcessing.compress.originalSize")}
                  </p>

                  <p className="text-lg font-bold text-gray-800">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>

                {/* Total Pages */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <p className="mb-1 text-xs font-medium text-emerald-600">
                    {t("pdfProcessing.merge.pages")}
                  </p>

                  <p className="text-2xl font-bold text-emerald-700">{result.totalPages}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
