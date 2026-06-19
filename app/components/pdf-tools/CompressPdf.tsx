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
import { Loader } from "@/components/ui/spinner";

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError(t("pdfProcessing.errors.invalidFile"));
        return;
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        setError(t("pdfProcessing.errors.tooLarge"));
        return;
      }

      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type === "application/pdf") {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event("change", { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
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
      <div className="bg-gradient-to-r from-rahvana-primary to-rahvana-primary-dark p-6 md:p-10 text-white rounded-t-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-2 md:mb-3">
          {t("pdfProcessing.compress.title")}
        </h1>
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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              loading
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : isDragging
                  ? "border-rahvana-primary bg-rahvana-primary-pale scale-[1.02] cursor-copy"
                  : "border-rahvana-primary/40 hover:border-rahvana-primary hover:bg-rahvana-primary-pale/50 cursor-pointer"
            }`}
          >
            <Upload
              className={`mx-auto h-16 w-16 mb-3 ${file ? "text-rahvana-primary" : "text-gray-400"}`}
            />
            {file ? (
              <div>
                <p className="text-rahvana-primary font-semibold text-lg mb-1 truncate max-w-xs mx-auto">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {t("pdfProcessing.compress.changeFile")}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  {t("pdfProcessing.compress.dropzone")}
                </p>
                <p className="text-sm text-gray-500">{t("pdfProcessing.compress.pdffilesOnly")}</p>
              </div>
            )}
          </label>
        </div>

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={!file || loading}
          className="w-full lg:w-1/2 mx-auto bg-rahvana-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-rahvana-primary-dark disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {t("pdfProcessing.compress.success")}
                </h3>
                <p className="text-white/80 text-sm">Your PDF has been compressed successfully</p>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium mb-1">
                    {t("pdfProcessing.compress.originalSize")}
                  </p>
                  <p className="text-gray-800 font-bold text-lg">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium mb-1">
                    {t("pdfProcessing.compress.compressedSize")}
                  </p>
                  <p className="text-emerald-600 font-bold text-lg">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-emerald-600 text-xs font-medium mb-1">
                    {t("pdfProcessing.compress.spaceSaved")}
                  </p>
                  <p className="text-emerald-700 font-bold text-2xl">{result.reduction}%</p>
                  <p className="text-emerald-500 text-xs mt-1">
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
