"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import NextImage from "next/image";
import { Upload, AlertCircle, Download, CheckCircle, X } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useFeatureAccess } from "@/lib/usage/useFeatureAccess";
import { usePlan } from "@/app/context/PlanContext";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import FileUpload from "@/app/components/shared/FileUpload";
import { Loader } from "../ui/spinner";

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
  /** Whether the *current* result should be blurred — snapshot taken at generation
   *  time, not the live balance (spending the last credit must still unlock the
   *  photo that credit just paid for). */
  const [resultLocked, setResultLocked] = useState(false);
  const [creditStatusLoading, setCreditStatusLoading] = useState(true);

  const { checkAccess, consumeAccess } = useFeatureAccess();

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [result]);

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
    setResultLocked(false);
    setError(null);
    setProcessingStep("");
  };

  // Handle file selection
  const handleFileUpload = (fieldName: string, uploadedFile: File | File[] | null) => {
    if (!uploadedFile || Array.isArray(uploadedFile)) return;

    // Validate file type
    if (!uploadedFile.type.startsWith("image/")) {
      setError(t("passportPhoto.errors.invalid"));
      return;
    }

    // Validate file size (max 10MB)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError(t("passportPhoto.errors.large"));
      return;
    }

    setFile(uploadedFile);
    setPreview(URL.createObjectURL(uploadedFile));
    setResult(null);
    setResultLocked(false);
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
    let creditPaid = false;
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
      creditPaid = true;

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
      // Only blur when this generation did NOT pay (fail-open path above); never
      // penalize the user for the credit they just spent on this very result.
      setResultLocked(tier !== "executive" && !creditPaid);
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

  return (
    <div className={`w-full ${className}`}>
      {/* Page content */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 pt-1 pb-4 sm:py-6">
        {/* Header */}
        {showHeader && (
          <header className="mb-4 w-full max-w-2xl text-center sm:mb-8 md:mb-10">
            <h1
              className="text-primary/90 text-3xl leading-tight font-bold md:text-5xl"
              style={{
                color: "#4a7c8e",
                textShadow: "0 2px 8px rgba(74,124,142,0.3), 0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              {t("passportPhoto.title")}
            </h1>
            <p
              className="mt-3 px-2 text-base text-gray-600 md:mt-2 md:text-lg"
              style={{ color: "#6b8fa0" }}
            >
              {t("passportPhoto.subtitle")}
            </p>
            <div className="mt-4 flex justify-center">
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
            className="mb-8 w-full max-w-3xl rounded-xl bg-white p-5 shadow-lg md:mb-12 md:p-8"
            style={{
              backgroundColor: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(10px)",
              boxShadow:
                "0 8px 32px rgba(74,124,142,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
              border: "1px solid rgba(74,124,142,0.2)",
            }}
          >
            <h2 className="text-primary/90 mb-4 flex items-center gap-2 text-xl font-semibold md:mb-6 md:text-2xl">
              <AlertCircle className="hidden h-5 w-5 shrink-0 sm:block md:h-6 md:w-6" />
              {t("passportPhoto.requirementsTitle")}
            </h2>

            <ul className="grid gap-4 text-sm text-gray-700 md:grid-cols-2 md:gap-6 md:text-base">
              {["1", "2", "3", "4", "5", "6", "7"].map((key) => (
                <li key={key} className="flex items-start gap-3 md:col-span-1">
                  <CheckCircle
                    className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
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
          <section className="mb-6 w-full max-w-2xl">
            <div
              onClick={() => setShowUpgradeModal(true)}
              className="flex cursor-pointer flex-col items-start justify-between gap-4 rounded-xl border border-[#0d7377]/20 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm transition-all hover:border-[#0d7377]/40 hover:bg-white hover:shadow-md active:scale-[0.99] md:flex-row md:items-center"
              title="Click to view upgrade options"
            >
              <div>
                <p className="text-sm font-semibold text-[#0d7377]">Photo credits</p>
                <p className="text-xs text-gray-500">
                  {creditStatusLoading
                    ? "Checking your remaining credits..."
                    : remainingCredits !== null
                      ? remainingCredits > 0
                        ? `${remainingCredits} photo credit${remainingCredits === 1 ? "" : "s"} remaining`
                        : tier === "premium"
                          ? "No credits left. Buy more credits or upgrade to Executive."
                          : "No credits left. Buy more credits or upgrade to unlock."
                      : "Photo Booth is not included in your plan — buy credits or upgrade."}
                </p>
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
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
                      : "No credits left"
                    : "Locked"}
              </div>
            </div>
          </section>
        )}

        {/* Upload Section - Made more compact with max-w-2xl */}
        {/* Upload Section */}
        <section className="w-full max-w-2xl py-2 sm:py-4">
          <div
            className="rounded-xl bg-white p-4 shadow-md sm:p-6"
            style={{
              backgroundColor: "rgba(255,255,255,0.80)",
              backdropFilter: "blur(10px)",
              boxShadow:
                "0 8px 32px rgba(74,124,142,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
              border: "1px solid rgba(74,124,142,0.2)",
            }}
          >
            <FileUpload
              label={t("passportPhoto.uploadLabel")}
              fieldName="passportPhoto"
              accept="image/*"
              multiple={false}
              height="220px"
              onFileUpload={handleFileUpload}
            />

            {/* Preview */}
            {preview && (
              <div className="mt-5">
                <div className="relative mx-auto aspect-square w-full max-w-[200px]">
                  <NextImage
                    src={preview}
                    alt="Passport photo preview"
                    fill
                    className="rounded-lg object-cover"
                    style={{
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                    unoptimized
                  />
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto mt-3 flex items-center gap-1 text-sm text-[#c0756a] transition-colors hover:text-[#a85e54]"
                >
                  <X className="h-4 w-4" />
                  {t("passportPhoto.removePhoto")}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-4 flex items-center gap-2 rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  boxShadow: "0 2px 8px rgba(185,28,28,0.08)",
                }}
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Process Button */}
            <button
              onClick={handleProcess}
              disabled={!file || loading}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all ${
                !file || loading
                  ? "cursor-not-allowed bg-[#d1dde3] text-[#8aafc0]"
                  : "bg-[#0d7377] text-white shadow-[0_4px_18px_rgba(13,115,119,0.3)] hover:bg-[#0a5f63]"
              }`}
            >
              {loading ? (
                <>
                  <Loader size="sm" />
                  <span>{t("passportPhoto.processing")}</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />

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
              isLocked={resultLocked}
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
                  className="mb-4 flex items-center justify-center gap-2 text-xl font-semibold text-green-600"
                  style={{ color: "#4a8c6e" }}
                >
                  <CheckCircle className="h-6 w-6" />
                  {t("passportPhoto.ready")}
                </p>
                <div className="relative mx-auto flex aspect-square w-full max-w-50 justify-center">
                  <NextImage
                    src={result}
                    alt="Passport photo result"
                    fill
                    className="rounded-lg border-4 border-white object-cover shadow-xl"
                    unoptimized
                  />
                </div>
                <a
                  href={result}
                  download="passport-photo.jpg"
                  className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: "#4a8c6e",
                    color: "#ffffff",
                    boxShadow: "0 4px 18px rgba(74,140,110,0.4), 0 1px 4px rgba(0,0,0,0.10)",
                  }}
                >
                  <Download className="h-5 w-5" />
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
            if (action === "addon") {
              // Add-on ids are NOT plan ids — land on the pricing page's Tools
              // tab with this add-on pre-added to the order summary.
              const addonId = typeof target === "string" ? target : "photo";
              window.location.href = `/pricing?mode=tools&addons=${encodeURIComponent(addonId)}`;
              return;
            }
            // Redirect to pricing page with the selected plan pre-selected
            const plan = typeof target === "string" ? target : "premium";
            window.location.href = `/pricing?plan=${plan}`;
          }}
        />
      )}
    </div>
  );
}
