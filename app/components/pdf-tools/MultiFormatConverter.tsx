"use client";

import { useState, useRef } from "react";
import { Upload, Download, AlertCircle, FileCheck } from "lucide-react";
import { Loader } from "@/components/ui/spinner";

interface ConversionResult {
  originalSize: number;
  convertedSize: number;
  reduction: string;
}

import { useLanguage } from "@/app/context/LanguageContext";

export default function PDFConverterApp() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validExtensions = [
      ".txt",
      ".html",
      ".htm",
      ".md",
      ".markdown",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".bmp",
      ".docx",
    ];
    const fileExtension =
      "." + selectedFile.name.toLowerCase().split(".").pop();

    if (!validExtensions.includes(fileExtension)) {
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
    setSuccess(false);
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError("");
    setResult(null);
    setSuccess(false);

    try {
      const fileName = file.name.toLowerCase();
      let format: "text" | "html" | "markdown" | "image" | "docx" = "text";

      if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
        format = "html";
      } else if (fileName.endsWith(".md") || fileName.endsWith(".markdown")) {
        format = "markdown";
      } else if (/\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(fileName)) {
        format = "image";
      } else if (fileName.endsWith(".docx")) {
        format = "docx";
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);

      const response = await fetch("/api/convert-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t("pdfProcessing.errors.failed"));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `converted_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Calculate result stats
      const originalSize = file.size;
      const convertedSize = blob.size;
      const reduction =
        originalSize > 0
          ? (((originalSize - convertedSize) / originalSize) * 100).toFixed(2)
          : "0";

      setResult({
        originalSize,
        convertedSize,
        reduction,
      });

      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
        setError("");
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 3000);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("pdfProcessing.errors.failed");
      setError(message);
    } finally {
      setConverting(false);
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

  return (
    <div className="w-full">
      <div className="bg-primary/90 p-6 md:p-10 text-white rounded-t-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-2 md:mb-3">
          {t("pdfProcessing.convert.title")}
        </h1>
        <p className="text-center text-white/90 text-base md:text-lg">
          {t("pdfProcessing.convert.subtitle")}
        </p>
      </div>

      <div className="p-6 md:p-12">
        {/* Upload Area */}
        <div className="mb-6 md:mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t("pdfProcessing.convert.selectLabel")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.html,.htm,.md,.markdown,.jpg,.jpeg,.png,.webp,.gif,.bmp,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={converting}
          />
          <label
            htmlFor="file-upload"
            className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              converting
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-primary/90 hover:border-primary hover:bg-primary/10 cursor-pointer"
            }`}
          >
            <Upload
              className={`mx-auto h-16 w-16 mb-3 ${file ? "text-primary/90" : "text-gray-400"}`}
            />
            {file ? (
              <div>
                <p className="text-primary/90 font-semibold text-lg mb-1 truncate max-w-xs mx-auto">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatBytes(file.size)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {t("pdfProcessing.compress.changeFile")}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  {t("pdfProcessing.convert.dropzone")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("pdfProcessing.convert.supports")}
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!file || converting}
          className="w-full lg:w-1/2 mx-auto bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {converting ? (
            <>{t("pdfProcessing.convert.converting")}</>
          ) : (
            <>
              <Download className="mr-2 h-6 w-6" />
              {t("pdfProcessing.convert.convertBtn")}
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
          <div className="mt-6 p-6 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center text-green-700 mb-4">
              <FileCheck className="h-6 w-6 mr-3" />
              <span className="font-bold text-lg">
                {t("pdfProcessing.convert.success")}
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
                <p className="text-gray-500 text-xs font-medium mb-1">
                  {t("pdfProcessing.convert.convertedSize")}
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {formatBytes(result.convertedSize)}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-500 text-xs font-medium mb-1">
                {t("pdfProcessing.compress.spaceSaved")}
              </p>
              <div className="flex items-baseline">
                <p className="text-green-600 font-bold text-3xl">
                  {result.reduction}%
                </p>
                <p className="text-gray-500 text-sm ml-2">
                  ({formatBytes(result.originalSize - result.convertedSize)}{" "}
                  {t("pdfProcessing.compress.saved")})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
