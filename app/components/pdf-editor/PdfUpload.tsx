"use client";

import type React from "react";
import { useState, useRef } from "react";
import { usePDFStore } from "@/lib/store";
import { loadPDF } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, FileCheck } from "lucide-react";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  pdfjsLib = pdfjs;
  return pdfjs;
}

interface UploadResult {
  originalSize: number;
  totalPages: number;
}

import { useLanguage } from "@/app/context/LanguageContext";

export function PDFUpload() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPdfFile, setPdfDoc, setTotalPages } = usePDFStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdfProcessing.errors.invalidFile"));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(t("pdfProcessing.errors.tooLarge"));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const pdfDoc = await loadPDF(file);

      const pdfjs = await initPdfJs();
      const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;

      setPdfFile(file);
      setPdfDoc(pdfDoc);
      setTotalPages(pdf.numPages);

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

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event("change", { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      const kb = bytes / 1024;
      return kb.toFixed(2) + " KB";
    }
    return mb.toFixed(2) + " MB";
  };

  return (
    <div className="w-full">
      <div className="bg-primary/90 p-6 md:p-10 text-white rounded-t-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-2 md:mb-3">
          {t("pdfProcessing.editor.title")}
        </h1>
        <p className="text-center text-white/90 text-base md:text-lg">
          {t("pdfProcessing.editor.uploadSubtitle")}
        </p>
      </div>

      <div className="p-6 md:p-12">
        {/* File Upload */}
        <div className="mb-6 md:mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t("pdfProcessing.compress.selectLabel")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <label
            htmlFor="file-upload"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              loading
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-primary/90 hover:border-primary hover:bg-primary/10 cursor-pointer"
            }`}
          >
            <Upload
              className={`mx-auto h-16 w-16 mb-3 ${result ? "text-primary/90" : "text-gray-400"}`}
            />
            {result ? (
              <div>
                <p className="text-primary/90 font-semibold text-lg mb-1">
                  {t("pdfProcessing.editor.successUpload")}
                </p>
                <p className="text-sm text-gray-500">
                  {formatBytes(result.originalSize)} • {result.totalPages} {t("pdfProcessing.merge.pages")}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {t("pdfProcessing.compress.changeFile")}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  {t("pdfProcessing.compress.dropzone")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("pdfProcessing.compress.pdffilesOnly")}
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Load Button */}
        <Button
          onClick={handleButtonClick}
          disabled={loading}
          className="w-full bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t("pdfProcessing.editor.loading")}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-6 w-6" />
              {t("pdfProcessing.editor.loadBtn")}
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-6 p-6 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center text-green-700 mb-4">
              <FileCheck className="h-6 w-6 mr-3" />
              <span className="font-bold text-lg">
                {t("pdfProcessing.editor.successUpload")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">
                  {t("pdfProcessing.compress.originalSize")}
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {formatBytes(result.originalSize)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">{t("pdfProcessing.merge.pages")}</p>
                <p className="text-gray-800 font-bold text-xl">
                  {result.totalPages}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
