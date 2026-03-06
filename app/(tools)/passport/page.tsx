// C:\Users\HP\Desktop\arachnie\Arachnie\app\passport\page.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import NextImage from "next/image";
import { Upload, AlertCircle, Download, CheckCircle, X } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function PassportPhoto() {
  const { t } = useLanguage();

  // Photo size presets (width x height in pixels at 300 DPI)
  const SIZE_PRESETS = useMemo(() => [
    {
      name: t("passportPhoto.presets.us"),
      width: 600,
      height: 600,
      description: t("passportPhoto.presets.usDesc"),
    },
    {
      name: t("passportPhoto.presets.uk"),
      width: 413,
      height: 531,
      description: t("passportPhoto.presets.ukDesc"),
    },
    {
      name: t("passportPhoto.presets.india"),
      width: 413,
      height: 413,
      description: t("passportPhoto.presets.indiaDesc"),
    },
    {
      name: t("passportPhoto.presets.canada"),
      width: 390,
      height: 567,
      description: t("passportPhoto.presets.canadaDesc"),
    },
    {
      name: t("passportPhoto.presets.custom"),
      width: 600,
      height: 600,
      description: t("passportPhoto.presets.customDesc"),
    },
  ], [t]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize] = useState(SIZE_PRESETS[0]);
  const [customWidth] = useState(600);
  const [customHeight] = useState(600);
  const [, setProcessingStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProcessingStep("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type
    if (!selected.type.startsWith("image/")) {
      setError(t("passportPhoto.errors.invalid"));
      return;
    }

    // Validate file size (max 10MB)
    if (selected.size > 10 * 1024 * 1024) {
      setError(t("passportPhoto.errors.large"));
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  // Get final dimensions
  const getFinalDimensions = () => {
    if (selectedSize.name === t("passportPhoto.presets.custom")) {
      return { width: customWidth, height: customHeight };
    }
    return { width: selectedSize.width, height: selectedSize.height };
  };

  // Process image with new passport-photo endpoint
  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setProcessingStep(t("passportPhoto.steps.uploading"));

    const { width, height } = getFinalDimensions();
    const API_ENDPOINT = `${API_BASE}/passport-photo?width=${width}&height=${height}&quality=95`;
    console.log(`Calling API: ${API_ENDPOINT}`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProcessingStep(t("passportPhoto.steps.removing"));

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Server Error (${res.status}): ${errorText.substring(0, 100)}...`,
        );
      }

      setProcessingStep(t("passportPhoto.steps.finalizing"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
      setProcessingStep("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `${t("passportPhoto.errors.general")} API Base: ${API_BASE}`,
      );
      setProcessingStep("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 flex flex-col items-center py-8 md:py-12 px-4">
      {/* Header */}
      <header className="text-center mb-8 md:mb-10 w-full max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-primary/90 leading-tight">
          {t("passportPhoto.title")}
        </h1>
        <p className="mt-3 md:mt-2 text-base md:text-lg text-gray-600 px-2">
          {t("passportPhoto.subtitle")}
        </p>
      </header>

      {/* Official Guidelines */}
      <section className="w-full max-w-4xl mb-8 md:mb-12 bg-white rounded-xl shadow-lg p-5 md:p-8">
        <h2 className="flex items-center gap-2 text-xl md:text-2xl font-semibold text-primary/90 mb-4 md:mb-6">
          <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
          {t("passportPhoto.requirementsTitle")}
        </h2>

        <ul className="grid md:grid-cols-2 gap-4 md:gap-6 text-gray-700 text-sm md:text-base">
          {["1", "2", "3", "4", "5", "6", "7"].map((key) => (
            <li key={key} className="flex items-start gap-3 md:col-span-1">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <span>
                <strong>{key}.</strong> {t(`passportPhoto.requirements.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Upload Section */}
      <section className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("passportPhoto.uploadLabel")}
          </label>

          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors cursor-pointer
              ${preview ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative flex justify-center w-full max-w-[256px] aspect-square mx-auto">
                <NextImage
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-lg shadow"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="w-10 h-10 mb-2" />
                <p className="text-sm">{t("passportPhoto.dropzone")}</p>
                <p className="text-xs mt-1">{t("passportPhoto.fileSize")}</p>
              </div>
            )}
          </div>

          {preview && (
            <button
              onClick={reset}
              className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mx-auto"
            >
              <X className="w-4 h-4" /> {t("passportPhoto.removePhoto")}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className={`mt-6 w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2
            ${
              !file || loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary/90 text-white hover:bg-primary"
            }`}
        >
          {loading ? (
            <>{t("passportPhoto.processing")}</>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              {t("passportPhoto.generate")}
            </>
          )}
        </button>
      </section>

      {/* Result */}
      {result && (
        <section className="mt-12 w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
            <p className="text-xl font-semibold text-green-600 mb-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6" />
              {t("passportPhoto.ready")}
            </p>
            <div className="relative flex justify-center w-full max-w-[256px] aspect-square mx-auto">
              <NextImage
                src={result}
                alt="Passport photo result"
                fill
                className="object-cover rounded-lg shadow-xl border-4 border-white"
                unoptimized
              />
            </div>
            <a
              href={result}
              download="passport-photo.jpg"
              className="mt-6 inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              {t("passportPhoto.download")}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
