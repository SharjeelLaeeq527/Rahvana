"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import NextImage from "next/image";
import {
  Upload,
  AlertCircle,
  Download,
  CheckCircle,
  X,
  Trash2,
  Clock,
  RotateCcw,
  Sparkles,
  Camera,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useFeatureAccess } from "@/lib/usage/useFeatureAccess";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useStandaloneToolUnlock } from "@/lib/wallet/useStandaloneToolUnlock";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { PassportPhotoHistoryModal } from "@/components/tools/PassportPhotoHistoryModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useUserProfile } from "@/app/context/UserProfileContext";
import FileUpload from "@/app/components/shared/FileUpload";
import { Loader } from "../ui/spinner";

import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import {
  PassportPhotoItem,
  STANDALONE_PASSPORT_PHOTOS_KEY,
  getJourneyPassportPhotosKey,
} from "@/types/passport-photo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface PassportPhotoToolProps extends ToolModeProps {
  showHeader?: boolean;
  showRequirements?: boolean;
  className?: string;
  onResult?: (url: string) => void;
  onHistoryChange?: (history: PassportPhotoItem[]) => void;
  journeyTier?: string | null;
}

export default function PassportPhotoTool({
  showHeader = true,
  showRequirements = true,
  className = "",
  onResult,
  onHistoryChange,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: PassportPhotoToolProps) {
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });
  const { t } = useLanguage();
  const accountPlan = usePlan();
  const { profile, updateProfile } = useUserProfile();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);

  // Determine effective plan tier: in journey mode, evaluate against the specific journey's tier (matching RoadmapLayoutEngine), otherwise account tier
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const effectiveTier: PlanTier = useMemo(() => {
    if (isJourney) {
      if (rawJourneyTier) {
        return normalizePlanTier(rawJourneyTier);
      }
      if (
        journeyContext?.journeyCategory &&
        accountPlan.journeyTiers[journeyContext.journeyCategory]
      ) {
        return accountPlan.journeyTiers[journeyContext.journeyCategory];
      }
    }
    return accountPlan.tier;
  }, [isJourney, rawJourneyTier, journeyContext, accountPlan.journeyTiers, accountPlan.tier]);

  // Determine storage key for this specific mode/environment
  const effectiveHistoryKey = useMemo(() => {
    if (isJourney && journeyContext?.journeySlug) {
      return getJourneyPassportPhotosKey(journeyContext.journeySlug, journeyContext.candidateId);
    }
    return STANDALONE_PASSPORT_PHOTOS_KEY;
  }, [isJourney, journeyContext]);

  // Synchronously initialize history from storage on mount
  const getInitialHistory = useCallback((): PassportPhotoItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem(effectiveHistoryKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
      if (
        !isJourney &&
        profile?.standalonePassportPhotos &&
        Array.isArray(profile.standalonePassportPhotos)
      ) {
        return profile.standalonePassportPhotos;
      }
    } catch (e) {
      console.warn("Could not load passport photo history:", e);
    }
    return [];
  }, [effectiveHistoryKey, isJourney, profile]);

  const [history, setHistory] = useState<PassportPhotoItem[]>(() => getInitialHistory());
  const [activePhoto, setActivePhoto] = useState<PassportPhotoItem | null>(null);

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

  const [selectedSize] = useState(SIZE_PRESETS[0]);
  const [customWidth] = useState(600);
  const [customHeight] = useState(600);
  const [, setProcessingStep] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<PassportPhotoItem | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [resultLocked, setResultLocked] = useState(false);
  const [creditStatusLoading, setCreditStatusLoading] = useState(true);

  const { checkAccess, consumeAccess } = useFeatureAccess();

  // Journey mode follows the journey plan (Executive = unlimited). Standalone is
  // paid with credits even for plan holders: a wallet unlock = unlimited, else
  // only legacy purchased photo credits remain. Journey passes null so it never
  // reads wallet unlocks.
  const photoWallet = useStandaloneToolUnlock(isJourney ? null : "photo-booth");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const hasUnlimitedPhotos = isJourney ? effectiveTier === "executive" : photoWallet.unlocked;
  // The server resolves the tier from this scope; it never trusts a client tier.
  const usageOptions = useMemo(
    () =>
      isJourney
        ? {
            scope: "journey" as const,
            journeyId: journeyContext?.backendId || journeyContext?.journeySlug,
            journeyCategory: journeyContext?.journeyCategory,
            candidateId: journeyContext?.candidateId,
          }
        : { scope: "standalone" as const },
    [isJourney, journeyContext]
  );
  // Out of photo credits: offer the credit unlock in standalone mode, else the plan upgrade.
  const openPhotoUnlock = () =>
    photoWallet.item ? setShowCreditModal(true) : setShowUpgradeModal(true);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync history state if effective storage key changes (e.g. candidate switch)
  useEffect(() => {
    if (!mounted) return;
    const initial = getInitialHistory();
    setHistory(initial);
  }, [effectiveHistoryKey, mounted, getInitialHistory]);

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
      // Executive journey or a standalone wallet unlock: access is unlimited
      if (hasUnlimitedPhotos) {
        setRemainingCredits(null);
        setCreditStatusLoading(false);
        return;
      }

      setCreditStatusLoading(true);
      try {
        const access = await checkAccess("photo_booth", usageOptions);
        if (!isMounted) return;

        // The server counts the real pools for this scope, so no client-side guess.
        const usage = access.data?.data?.usage;
        if (access.allowed && usage?.remaining !== undefined) {
          setRemainingCredits(usage.remaining);
        } else if (access.allowed && usage?.limit !== undefined) {
          setRemainingCredits(usage.limit);
        } else {
          setRemainingCredits(null);
        }
      } catch {
        if (isMounted) setRemainingCredits(null);
      } finally {
        if (isMounted) {
          setCreditStatusLoading(false);
        }
      }
    };

    void loadCredits();

    return () => {
      isMounted = false;
    };
  }, [checkAccess, hasUnlimitedPhotos, usageOptions]);

  // Reset current upload form
  const reset = () => {
    if (preview) {
      try {
        URL.revokeObjectURL(preview);
      } catch {}
    }
    setFile(null);
    setPreview(null);
    setProcessingStep("");
  };

  // Handle file selection
  const handleFileUpload = (fieldName: string, uploadedFile: File | File[] | null) => {
    if (!uploadedFile) {
      reset();
      return;
    }

    if (Array.isArray(uploadedFile)) return;

    // Validate file type
    if (!uploadedFile.type.startsWith("image/")) {
      reset();
      showToast(t("passportPhoto.errors.invalid"), "error");
      return;
    }

    // Validate file size (max 10MB)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      reset();
      showToast(t("passportPhoto.errors.large"), "error");
      return;
    }

    if (preview) {
      try {
        URL.revokeObjectURL(preview);
      } catch {}
    }

    setFile(uploadedFile);
    setPreview(URL.createObjectURL(uploadedFile));
    setResult(null);
    setResultLocked(false);

    // Friendly reminder toast to verify front-facing orientation before generating
    showToast(
      t("passportPhoto.frontFacingToast") ||
        "Photo selected! Please verify your face is facing straight ahead with no tilt before generating.",
      "info"
    );
  };

  // Get final dimensions
  const getFinalDimensions = () => {
    if (selectedSize.name === t("passportPhoto.presets.custom")) {
      return { width: customWidth, height: customHeight };
    }
    return { width: selectedSize.width, height: selectedSize.height };
  };

  // Process image with passport-photo endpoint.
  // Order: check access, generate, then spend a credit only once the photo is
  // ready, so a failed generation never costs a credit. Unlimited users
  // (Executive, or a standalone wallet unlock) skip the credit pool entirely.
  const handleProcess = async () => {
    if (!file) return;

    if (!hasUnlimitedPhotos && (remainingCredits === null || remainingCredits <= 0)) {
      openPhotoUnlock();
      return;
    }

    setLoading(true);
    setProcessingStep(t("passportPhoto.steps.uploading"));

    // Guard against a hung request: abort after 120s so the failure always surfaces as a toast.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      // 1. Check access before spending any credit.
      if (!hasUnlimitedPhotos) {
        const access = await checkAccess("photo_booth", usageOptions);
        if (!access.allowed || access.data?.data?.usage?.allowed === false) {
          setProcessingStep("");
          openPhotoUnlock();
          return;
        }
      }

      // 2. Generate the image first. Validation/API failures cost no credit.
      const { width, height } = getFinalDimensions();
      const API_ENDPOINT = `${API_BASE}/passport-photo?width=${width}&height=${height}&quality=95`;

      const formData = new FormData();
      formData.append("file", file);

      setProcessingStep(t("passportPhoto.steps.removing"));

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        // Extract user-friendly message from structured backend response
        let friendlyMsg = t("passportPhoto.errors.general");
        try {
          const body = await res.json();
          const detail = body?.detail;
          if (typeof detail === "string" && detail.trim()) friendlyMsg = detail;
          else if (detail?.message) friendlyMsg = String(detail.message);
        } catch {
          // non-JSON response (gateway/proxy HTML) - keep generic message
        }
        throw new Error(friendlyMsg);
      }

      setProcessingStep(t("passportPhoto.steps.finalizing"));
      const blob = await res.blob();
      if (!blob.size) {
        throw new Error(t("passportPhoto.errors.general"));
      }

      // 3. Consume a credit only after successful image generation.
      if (!hasUnlimitedPhotos) {
        const reservation = await consumeAccess("photo_booth", usageOptions);
        if (!reservation.allowed || reservation.data?.allowed === false) {
          setProcessingStep("");
          openPhotoUnlock();
          return;
        }
        if (reservation.data?.remaining !== undefined) {
          setRemainingCredits(reservation.data.remaining);
        } else {
          setRemainingCredits((prev) => (typeof prev === "number" ? Math.max(prev - 1, 0) : 0));
        }
      }

      // 4. Save the paid photo to history (data URL so it survives reloads).
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const newPhotoItem: PassportPhotoItem = {
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        dataUrl: base64DataUrl,
        presetName: selectedSize.name,
        width,
        height,
        createdAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: blob.size,
      };

      const updatedHistory = [
        newPhotoItem,
        ...history.filter((p) => p.id !== newPhotoItem.id),
      ].slice(0, 10);
      setHistory(updatedHistory);
      setActivePhoto(newPhotoItem);
      setResult(base64DataUrl);
      setResultLocked(false);

      try {
        localStorage.setItem(effectiveHistoryKey, JSON.stringify(updatedHistory));
        if (!isJourney && updateProfile) {
          updateProfile({ standalonePassportPhotos: updatedHistory }, { silent: true });
        }
      } catch (e) {
        console.warn("Error saving photo history:", e);
      }

      if (onResult) onResult(base64DataUrl);
      onHistoryChange?.(updatedHistory);
      showToast("Passport photo generated and saved to history!", "success");
      setProcessingStep("");
    } catch (err) {
      console.error("Passport photo processing failed:", err);
      let message: string;
      if (err instanceof DOMException && err.name === "AbortError") {
        message = t("passportPhoto.errors.timeout");
      } else if (err instanceof TypeError) {
        // fetch rejects with TypeError on network failure (offline / DNS / CORS / refused)
        message = t("passportPhoto.errors.network");
      } else {
        const raw = err instanceof Error ? err.message.trim() : "";
        message = raw || t("passportPhoto.errors.general");
      }
      showToast(message, "error");
      setProcessingStep("");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Helper to trigger browser download
  const handleDownloadPhoto = (photo: PassportPhotoItem) => {
    try {
      const link = document.createElement("a");
      link.href = photo.dataUrl;
      const sanitizedPreset = photo.presetName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const dateStr = new Date(photo.createdAt).toISOString().slice(0, 10);
      link.download = `passport-photo-${sanitizedPreset}-${dateStr}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error downloading photo:", e);
    }
  };

  // Delete a single photo from history
  const handleDeletePhoto = (photoId: string) => {
    const updated = history.filter((p) => p.id !== photoId);
    setHistory(updated);
    try {
      localStorage.setItem(effectiveHistoryKey, JSON.stringify(updated));
      if (!isJourney && updateProfile) {
        updateProfile({ standalonePassportPhotos: updated }, { silent: true });
      }
    } catch (e) {
      console.warn("Error updating photo history after deletion:", e);
    }

    if (activePhoto?.id === photoId) {
      setActivePhoto(null);
      setResult(null);
    }
    onHistoryChange?.(updated);
    setPhotoToDelete(null);
    showToast("Photo removed from history.", "info");
  };

  // Clear entire photo history with modal confirmation
  const handleClearAllHistory = () => {
    try {
      localStorage.removeItem(effectiveHistoryKey);
      if (!isJourney && updateProfile) {
        updateProfile({ standalonePassportPhotos: undefined }, { silent: true });
      }
    } catch (e) {
      console.warn("Error clearing photo history:", e);
    }
    setHistory([]);
    setActivePhoto(null);
    setResult(null);
    setShowClearHistoryModal(false);
    setShowHistoryModal(false);
    onHistoryChange?.([]);
    showToast("All photo history cleared.", "info");
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Page content */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 pt-1 pb-4 sm:py-6">
        {/* Top Control Bar for when showHeader is false */}
        {!showHeader && (
          <div className="mb-4 flex w-full max-w-2xl items-center justify-end">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-[#0d7377]/50 hover:bg-white hover:text-[#0d7377] active:scale-95"
              title="View saved photo history"
            >
              <Clock className="h-3.5 w-3.5 text-[#0d7377]" />
              <span>My Album</span>
              {mounted && history.length > 0 && (
                <span className="rounded-full bg-[#0d7377] px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Header */}
        {showHeader && (
          <header className="mb-4 w-full max-w-2xl text-center sm:mb-8 md:mb-10">
            {/* Top Bar with Top-Right History Button */}
            <div className="mb-3 flex w-full items-center justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-[#0d7377]/50 hover:bg-white hover:text-[#0d7377] active:scale-95"
                title="View saved photo history"
              >
                <Clock className="h-3.5 w-3.5 text-[#0d7377]" />
                <span>Photo History</span>
                {mounted && history.length > 0 && (
                  <span className="rounded-full bg-[#0d7377] px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

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
            {!isJourney && (
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
            )}
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
        {!hasUnlimitedPhotos && !photoWallet.loading && (
          <section className="mb-6 w-full max-w-2xl">
            <div
              onClick={openPhotoUnlock}
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
                        : effectiveTier === "premium"
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
            {/* Front-Facing Reminder Callout */}
            {/* <div className="mb-4 rounded-xl border border-[#0d7377]/25 bg-gradient-to-r from-[#f0f9f9] to-[#e6f4f4] p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0d7377]/15 text-[#0d7377]">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#0d7377]">
                      {t("passportPhoto.frontFacingNotice.title") || "Front-Facing Photo Required"}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-[#0d7377]/10 px-2 py-0.5 text-[11px] font-medium text-[#0d7377]">
                      Biometric Spec
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#3a5860]">
                    {t("passportPhoto.frontFacingNotice.description") ||
                      "Please upload a clear picture facing directly towards the camera at eye level. Angled selfies, tilted heads, or side profile shots will be rejected by consular review."}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 font-medium text-[#2d5059] shadow-2xs border border-[#0d7377]/15">
                      <CheckCircle className="h-3 w-3 text-[#0d7377]" />
                      {t("passportPhoto.frontFacingNotice.tip1") || "Look straight at camera"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 font-medium text-[#2d5059] shadow-2xs border border-[#0d7377]/15">
                      <CheckCircle className="h-3 w-3 text-[#0d7377]" />
                      {t("passportPhoto.frontFacingNotice.tip2") || "No head tilt or angle"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 font-medium text-[#2d5059] shadow-2xs border border-[#0d7377]/15">
                      <CheckCircle className="h-3 w-3 text-[#0d7377]" />
                      {t("passportPhoto.frontFacingNotice.tip3") || "Full face centered"}
                    </span>
                  </div>
                </div>
              </div>
            </div> */}

            <FileUpload
              label={t("passportPhoto.uploadLabel")}
              fieldName="passportPhoto"
              accept="image/*"
              multiple={false}
              file={file}
              height="220px"
              helperText={
                t("passportPhoto.frontFacingHelper") ||
                "Upload a clear, front-facing photo (JPG or PNG up to 10MB)"
              }
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

                <div className="mt-2.5 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0d7377]/20 bg-[#e6f4f4] px-3 py-1 text-xs font-medium text-[#0d7377]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verify your head is upright and looking straight ahead
                  </span>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto mt-3 flex cursor-pointer items-center gap-1 text-sm text-[#c0756a] transition-colors hover:text-[#a85e54]"
                >
                  <X className="h-4 w-4" />
                  {t("passportPhoto.removePhoto")}
                </button>
              </div>
            )}

            {/* Process Button */}
            {!hasUnlimitedPhotos &&
            !photoWallet.loading &&
            (remainingCredits === null || remainingCredits <= 0) ? (
              <button
                type="button"
                onClick={openPhotoUnlock}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0d7377] py-3.5 font-semibold text-white shadow-[0_4px_18px_rgba(217,119,6,0.3)] transition-all hover:bg-[#0a5f63] active:scale-[0.99]"
                title="Credits required to generate photo"
              >
                <Lock className="h-5 w-5" />
                <span>
                  {photoWallet.item
                    ? `Unlock for ${photoWallet.item.credits} credits`
                    : effectiveTier === "premium"
                      ? "Upgrade to Executive"
                      : "Upgrade to continue"}
                </span>
              </button>
            ) : (
              <button
                onClick={handleProcess}
                disabled={!file || loading}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition-all ${
                  !file || loading
                    ? "cursor-not-allowed bg-[#d1dde3] text-[#8aafc0]"
                    : "cursor-pointer bg-[#0d7377] text-white shadow-[0_4px_18px_rgba(13,115,119,0.3)] hover:bg-[#0a5f63]"
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
                    <span>{t("passportPhoto.generate")}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Current Active Result */}
        {mounted && result && (
          <section
            ref={resultRef}
            className="animate-in fade-in mt-8 w-full max-w-2xl duration-500"
          >
            <ResultGate
              feature="photo_booth"
              isLocked={resultLocked}
              planTier={effectiveTier}
              standaloneToolId={isJourney ? undefined : "photo-booth"}
              standaloneGranted={!resultLocked}
            >
              <div
                className="rounded-2xl border border-[#0d7377]/30 bg-white/90 p-5 shadow-xl backdrop-blur-md sm:p-7"
                style={{
                  boxShadow: "0 12px 40px rgba(13,115,119,0.15), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-base font-semibold text-emerald-700 sm:text-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span>{t("passportPhoto.ready")}</span>
                  </div>
                  {activePhoto && (
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                      {activePhoto.presetName} ({activePhoto.width}×{activePhoto.height} px)
                    </span>
                  )}
                </div>

                <div className="relative mx-auto flex aspect-square w-full max-w-[220px] justify-center">
                  <NextImage
                    src={result}
                    alt="Passport photo result"
                    fill
                    className="rounded-xl border-4 border-white object-cover shadow-2xl"
                    unoptimized
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => activePhoto && handleDownloadPhoto(activePhoto)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#0d7377] px-6 py-3 font-semibold text-white shadow-lg shadow-[#0d7377]/30 transition-all hover:bg-[#0a5f63]"
                  >
                    <Download className="h-5 w-5" />
                    <span>{t("passportPhoto.download")}</span>
                  </button>

                  {activePhoto && (
                    <button
                      onClick={() => setPhotoToDelete(activePhoto)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100"
                      title="Remove this photo from history"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </ResultGate>
          </section>
        )}
      </div>

      {/* History Modal */}
      <PassportPhotoHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        history={history}
        activePhotoId={activePhoto?.id}
        onSelectPhoto={(photo) => {
          setActivePhoto(photo);
          setResult(photo.dataUrl);
          setResultLocked(false);
          showToast(`Loaded ${photo.presetName} photo.`, "info");
        }}
        onDownloadPhoto={handleDownloadPhoto}
        onRequestDeletePhoto={(photo) => setPhotoToDelete(photo)}
        onRequestClearAll={() => setShowClearHistoryModal(true)}
        isJourney={isJourney}
      />

      {showCreditModal && photoWallet.item && (
        <CreditLaunchModal
          item={photoWallet.item}
          onClose={() => setShowCreditModal(false)}
          onLaunched={() => setShowCreditModal(false)}
        />
      )}

      {/* UpgradeModal */}
      {showUpgradeModal && (
        <UpgradeModal
          feature={"photo_booth"}
          onClose={() => setShowUpgradeModal(false)}
          onConfirm={(_action, target?: string) => {
            const plan = typeof target === "string" ? target : "premium";
            window.location.href = `/pricing?plan=${plan}`;
          }}
        />
      )}

      {/* Single Photo Delete Modal */}
      <ConfirmationModal
        open={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
        title="Delete Photo?"
        description="Are you sure you want to remove this passport photo from your saved history? You will no longer be able to download it from here."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => photoToDelete && handleDeletePhoto(photoToDelete.id)}
      />

      {/* Clear All History Modal */}
      <ConfirmationModal
        open={showClearHistoryModal}
        onOpenChange={setShowClearHistoryModal}
        title="Clear All Photo History?"
        description="Are you sure you want to delete all saved passport photos in this session? This action cannot be undone."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleClearAllHistory}
      />
    </div>
  );
}
