"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  AlertCircle,
  FileCheck,
  FileText,
  ArrowRightLeft,
  Zap,
} from "lucide-react";
import FileUpload from "@/app/components/shared/FileUpload";

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
        originalSize > 0 ? (((originalSize - convertedSize) / originalSize) * 100).toFixed(2) : "0";

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
      }, 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("pdfProcessing.errors.failed");
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
      <div className="from-rahvana-primary to-rahvana-primary-dark rounded-t-2xl bg-gradient-to-r p-6 text-white md:p-10">
        <h1 className="mb-2 text-center text-3xl font-bold md:mb-3 md:text-5xl">
          {t("pdfProcessing.convert.title")}
        </h1>
        <p className="text-center text-base text-white/90 md:text-lg">
          {t("pdfProcessing.convert.subtitle")}
        </p>
      </div>

      <div className="p-6 md:p-12">
        {/* Upload Area */}
        <div className="mb-6 md:mb-8">
          <FileUpload
            label={t("pdfProcessing.convert.selectLabel")}
            fieldName="pdf-converter-file"
            accept=".txt,.html,.htm,.md,.markdown,.jpg,.jpeg,.png,.webp,.gif,.bmp,.docx"
            onFileUpload={(_, uploadedFile) => {
              const selectedFile = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

              if (!selectedFile) {
                setFile(null);
                return;
              }

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

              const fileExtension = "." + selectedFile.name.toLowerCase().split(".").pop();

              if (!validExtensions.includes(fileExtension)) {
                setError(t("pdfProcessing.errors.invalidFile"));
                setFile(null);
                return;
              }

              if (selectedFile.size > 100 * 1024 * 1024) {
                setError(t("pdfProcessing.errors.tooLarge"));
                setFile(null);
                return;
              }

              setFile(selectedFile);
              setError("");
              setResult(null);
              setSuccess(false);
            }}
            title={t("pdfProcessing.convert.dropzone")}
            description="or choose a file from your device"
            buttonText="Browse files"
            helperText="Supported formats: TXT, HTML, MD, JPG, PNG, WEBP, GIF, BMP, DOCX • Max 100 MB"
            variant="default"
          />
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!file || converting}
          className="bg-rahvana-primary hover:bg-rahvana-primary-dark mx-auto flex w-full transform items-center justify-center rounded-xl py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none lg:w-1/2"
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
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="rounded-full bg-white/20 p-2">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {t("pdfProcessing.convert.success")}
                </h3>
                <p className="text-sm text-white/80">
                  Your file has been converted to PDF successfully
                </p>
              </div>
            </div>
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
                    <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    {t("pdfProcessing.convert.convertedSize")}
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatBytes(result.convertedSize)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mb-1 text-xs font-medium text-emerald-600">
                    {t("pdfProcessing.compress.spaceSaved")}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">{result.reduction}%</p>
                  <p className="mt-1 text-xs text-emerald-500">
                    {formatBytes(result.originalSize - result.convertedSize)}{" "}
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
