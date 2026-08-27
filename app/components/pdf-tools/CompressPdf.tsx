"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Download,
  FileCheck,
  AlertCircle,
  FileText,
  Zap,
  TrendingDown,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import FileUpload from "@/app/components/shared/FileUpload";

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  reduction: string;
}

export default function Compress() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = (fieldName: string, uploadedFile: File | File[] | null) => {
    if (!uploadedFile || Array.isArray(uploadedFile)) return;

    if (!uploadedFile.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdfProcessing.errors.invalidFile"));
      return;
    }

    if (uploadedFile.size > 100 * 1024 * 1024) {
      setError(t("pdfProcessing.errors.tooLarge"));
      return;
    }

    setFile(uploadedFile);
    setError("");
    setResult(null);
  };

  const handleCompress = async () => {
    if (!file) {
      setError(t("pdfProcessing.errors.invalidFile"));
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/compress`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t("pdfProcessing.errors.failed"));
      }

      const originalSizeHeader = response.headers.get("x-original-size");
      const compressedSizeHeader = response.headers.get("x-compressed-size");
      const reductionHeader = response.headers.get("x-reduction");

      const originalSize = originalSizeHeader ? parseInt(originalSizeHeader, 10) : file.size;
      const compressedSizeFromHeader = compressedSizeHeader
        ? parseInt(compressedSizeHeader, 10)
        : 0;
      const reductionFromHeader = reductionHeader ? parseFloat(reductionHeader) : 0;

      const blob = await response.blob();
      const finalCompressedSize = compressedSizeFromHeader || blob.size;
      const finalReduction =
        reductionFromHeader || ((originalSize - finalCompressedSize) / originalSize) * 100;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `compressed_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setResult({
        originalSize,
        compressedSize: finalCompressedSize,
        reduction: finalReduction.toFixed(2),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("pdfProcessing.errors.failed");
      console.error("Compression error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
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

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="from-rahvana-primary to-rahvana-primary-dark rounded-t-2xl bg-gradient-to-r p-6 text-white md:p-10">
        <h1 className="mb-2 text-center text-3xl font-bold md:mb-3 md:text-5xl">
          {t("pdfProcessing.compress.title")}
        </h1>
      </div>

      <div className="p-6 md:p-12">
        {/* File Upload */}
        {/* File Upload */}
        <div className="mb-6 md:mb-8">
          <FileUpload
            label={t("pdfProcessing.compress.selectLabel")}
            fieldName="compress-file"
            onFileUpload={handleFileUpload}
            accept=".pdf"
            multiple={false}
            variant="default"
            title={t("pdfProcessing.compress.dropzone")}
            buttonText="Browse files"
            helperText="PDF files only • Max 100 MB"
            showPreview={false}
          />
        </div>

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={!file || loading}
          className="bg-rahvana-primary hover:bg-rahvana-primary-dark mx-auto flex w-full transform items-center justify-center rounded-xl py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none lg:w-1/2"
        >
          {loading ? (
            <>{t("pdfProcessing.compress.compressing")}</>
          ) : (
            <>
              <Download className="mr-2 h-6 w-6" />
              {t("pdfProcessing.compress.compressBtn")}
            </>
          )}
        </button>

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
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="rounded-full bg-white/20 p-2">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {t("pdfProcessing.compress.success")}
                </h3>
                <p className="text-sm text-white/80">Your PDF has been compressed successfully</p>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    {t("pdfProcessing.compress.originalSize")}
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    {t("pdfProcessing.compress.compressedSize")}
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mb-1 text-xs font-medium text-emerald-600">
                    {t("pdfProcessing.compress.spaceSaved")}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">{result.reduction}%</p>
                  <p className="mt-1 text-xs text-emerald-500">
                    {formatBytes(result.originalSize - result.compressedSize)}{" "}
                    {t("pdfProcessing.compress.saved")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
