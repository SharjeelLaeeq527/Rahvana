"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import NextImage from "next/image";
import { Upload, AlertCircle, Download, CheckCircle, X } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useFeatureAccess } from "@/lib/usage/useFeatureAccess";
import { usePlan } from "@/app/context/PlanContext";
import { Loader } from "../ui/spinner";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface PassportPhotoToolProps {
  showHeader?: boolean;
  showRequirements?: boolean;
  className?: string;
  onResult?: (url: string) => void;
}

export default function PassportPhotoTool({
  showHeader = true,
  showRequirements = true,
  className = "",
  onResult,
}: PassportPhotoToolProps) {
  const { t } = useLanguage();
  const { tier } = usePlan();

  // Photo size presets (width x height in pixels at 300 DPI)
  const SIZE_PRESETS = useMemo(
    () => [
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
    ],
    [t]
  );

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize] = useState(SIZE_PRESETS[0]);
  const [customWidth] = useState(600);
  const [customHeight] = useState(600);
  const [, setProcessingStep] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [creditStatusLoading, setCreditStatusLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [result]);

  const { checkAccess, consumeAccess } = useFeatureAccess();

  useEffect(() => {
    let isMounted = true;

    const loadCredits = async () => {
      setCreditStatusLoading(true);
      const access = await checkAccess("photo_booth");
      if (!isMounted) return;

      const usage = access.data?.data?.usage;
      if (tier === "executive") {
        setRemainingCredits(null);
      } else if (access.allowed && usage?.remaining !== undefined) {
        setRemainingCredits(usage.remaining);
      } else if (access.allowed && usage?.limit !== undefined) {
        setRemainingCredits(usage.limit);
      } else {
        setRemainingCredits(null);
      }

      setCreditStatusLoading(false);
    };

    void loadCredits();

    return () => {
      isMounted = false;
    };
  }, [checkAccess, tier]);

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

    if (remainingCredits !== null && remainingCredits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setProcessingStep(t("passportPhoto.steps.uploading"));

    // Verify and consume credit if the user has limited credits, blocking if exhausted
    try {
      const access = await checkAccess("photo_booth");
      if (!access.allowed || access.data?.data?.usage?.allowed === false) {
        setLoading(false);
        setProcessingStep("");
        setShowUpgradeModal(true);
        return;
      }

      const reservation = await consumeAccess("photo_booth");
      if (!reservation.allowed || reservation.data?.allowed === false) {
        setLoading(false);
        setProcessingStep("");
        setShowUpgradeModal(true);
        return;
      }

      if (tier === "executive") {
        setRemainingCredits(null);
      } else if (reservation.data?.remaining !== undefined) {
        setRemainingCredits(reservation.data.remaining);
      }
    } catch (err) {
      console.warn("Usage check/consumption failed, continuing with photo generation:", err);
    }

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
        throw new Error(`Server Error (${res.status}): ${errorText.substring(0, 100)}...`);
      }

      setProcessingStep(t("passportPhoto.steps.finalizing"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
      setProcessingStep("");
      if (onResult) onResult(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `${t("passportPhoto.errors.general")} API Base: ${API_BASE}`
      );
      setProcessingStep("");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Page content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 py-6">
        {/* Header */}
        {showHeader && (
          <header className="text-center mb-8 md:mb-10 w-full max-w-2xl">
            <h1
              className="text-3xl md:text-5xl font-bold text-primary/90 leading-tight"
              style={{
                color: "#4a7c8e",
                textShadow: "0 2px 8px rgba(74,124,142,0.3), 0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              {t("passportPhoto.title")}
            </h1>
            <p
              className="mt-3 md:mt-2 text-base md:text-lg text-gray-600 px-2"
              style={{ color: "#6b8fa0" }}
            >
              {t("passportPhoto.subtitle")}
            </p>
            <div className="flex justify-center mt-4">
              <QuickAccessButton
                item={{
                  id: "photo-booth",
                  title: "Photo Booth",
                  href: "/passport",
                  icon_name: "Camera",
                }}
              />
            </div>
          </header>
        )}

        {/* Official Guidelines */}
        {showRequirements && (
          <section
            className="w-full max-w-3xl mb-8 md:mb-12 bg-white rounded-xl shadow-lg p-5 md:p-8"
            style={{
              backgroundColor: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(10px)",
              boxShadow:
                "0 8px 32px rgba(74,124,142,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
              border: "1px solid rgba(74,124,142,0.2)",
            }}
          >
            <h2 className="flex items-center gap-2 text-xl md:text-2xl font-semibold text-primary/90 mb-4 md:mb-6">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              {t("passportPhoto.requirementsTitle")}
            </h2>

            <ul className="grid md:grid-cols-2 gap-4 md:gap-6 text-gray-700 text-sm md:text-base">
              {["1", "2", "3", "4", "5", "6", "7"].map((key) => (
                <li key={key} className="flex items-start gap-3 md:col-span-1">
                  <CheckCircle
                    className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                    style={{ color: "#7fb3c8" }}
                  />
                  <span>
                    <strong>{key}.</strong> {t(`passportPhoto.requirements.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Credit Status */}
        {tier !== "executive" && (
          <section className="w-full max-w-2xl mb-6">
            <div
              onClick={() => setShowUpgradeModal(true)}
              className="rounded-xl border border-[#0d7377]/20 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-white hover:border-[#0d7377]/40 hover:shadow-md transition-all active:scale-[0.99]"
              title="Click to view upgrade options"
            >
              <div>
                <p className="text-sm font-semibold text-[#0d7377]">Photo credits</p>
                <p className="text-xs text-gray-500">
                  {creditStatusLoading
                    ? "Checking your remaining credits..."
                    : remainingCredits !== null
                      ? remainingCredits > 0
                        ? `${remainingCredits} premium credit${remainingCredits === 1 ? "" : "s"} remaining`
                        : tier === "premium"
                          ? "No credits left. Click to upgrade to Executive."
                          : "No credits left. Upgrade required."
                      : "Upgrade required for premium photo credits"}
                </p>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor:
                    remainingCredits !== null
                      ? "rgba(13, 115, 119, 0.1)"
                      : "rgba(217, 119, 6, 0.1)",
                  color: remainingCredits !== null ? "#0d7377" : "#b45309",
                }}
              >
                {creditStatusLoading
                  ? "Loading"
                  : remainingCredits !== null
                    ? remainingCredits > 0
                      ? `${remainingCredits} left`
                      : tier === "premium"
                        ? "No credits left"
                        : "Locked"
                    : "Locked"}
              </div>
            </div>
          </section>
        )}

        {/* Upload Section - Made more compact with max-w-2xl */}
        <section className="w-full max-w-2xl py-2 sm:py-4">
          <div
            className="bg-white rounded-xl shadow-md p-4 sm:p-6"
            style={{
              backgroundColor: "rgba(255,255,255,0.80)",
              backdropFilter: "blur(10px)",
              boxShadow:
                "0 8px 32px rgba(74,124,142,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
              border: "1px solid rgba(74,124,142,0.2)",
            }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center sm:text-left">
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
                <div className="relative flex justify-center w-full max-w-50 aspect-square mx-auto">
                  <NextImage
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                    style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <Upload className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">{t("passportPhoto.dropzone")}</p>
                  <p className="text-xs mt-1">{t("passportPhoto.fileSize")}</p>
                </div>
              )}
            </div>

            {preview && (
              <button
                onClick={reset}
                className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mx-auto"
                style={{ color: "#c0756a" }}
              >
                <X className="w-4 h-4" /> {t("passportPhoto.removePhoto")}
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="mt-4 p-3 rounded-lg text-sm flex items-center gap-2"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  boxShadow: "0 2px 8px rgba(185,28,28,0.08)",
                }}
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Process Button - Centered or contained */}
            <button
              onClick={handleProcess}
              disabled={!file || loading}
              className="mt-6 w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={
                !file || loading
                  ? {
                      backgroundColor: "#d1dde3",
                      color: "#8aafc0",
                      cursor: "not-allowed",
                    }
                  : {
                      backgroundColor: "#5a9ab5",
                      color: "#ffffff",
                      boxShadow: "0 4px 18px rgba(90,154,181,0.45), 0 1px 4px rgba(0,0,0,0.10)",
                      cursor: "pointer",
                    }
              }
              onMouseEnter={(e) => {
                if (file && !loading)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#4a7c8e";
              }}
              onMouseLeave={(e) => {
                if (file && !loading)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#5a9ab5";
              }}
            >
              {loading ? (
                <>{t("passportPhoto.processing")}</>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {remainingCredits !== null && remainingCredits <= 0 && tier !== "executive"
                    ? tier === "premium"
                      ? "Upgrade to Executive"
                      : "Upgrade to continue"
                    : t("passportPhoto.generate")}
                </>
              )}
            </button>
          </div>
        </section>

        {/* Result */}
        {result && (
          <section ref={resultRef} className="mt-12 w-full max-w-2xl">
            <ResultGate
              feature="photo_booth"
              isLocked={tier !== "executive" && remainingCredits !== null && remainingCredits <= 0}
            >
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(10px)",
                  boxShadow:
                    "0 8px 32px rgba(74,124,142,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
                  border: "1px solid rgba(74,124,142,0.2)",
                }}
              >
                <p
                  className="text-xl font-semibold text-green-600 mb-4 flex items-center justify-center gap-2"
                  style={{ color: "#4a8c6e" }}
                >
                  <CheckCircle className="w-6 h-6" />
                  {t("passportPhoto.ready")}
                </p>
                <div className="relative flex justify-center w-full max-w-50 aspect-square mx-auto">
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
                  className="mt-6 mx-auto flex w-fit items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: "#4a8c6e",
                    color: "#ffffff",
                    boxShadow: "0 4px 18px rgba(74,140,110,0.4), 0 1px 4px rgba(0,0,0,0.10)",
                  }}
                >
                  <Download className="w-5 h-5" />
                  {t("passportPhoto.download")}
                </a>
              </div>
            </ResultGate>
          </section>
        )}
      </div>
      {/* UpgradeModal */}
      {showUpgradeModal && (
        <UpgradeModal
          feature={"photo_booth"}
          onClose={() => setShowUpgradeModal(false)}
          onConfirm={(action: "upgrade" | "addon", target?: string) => {
            // Redirect to pricing page with the selected plan pre-selected
            const plan = typeof target === "string" ? target : "premium";
            window.location.href = `/pricing?plan=${plan}`;
          }}
        />
      )}
    </div>
  );
}
