"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Upload, AlertCircle, CheckCircle, X, FileText, Lock } from "lucide-react";
import SuccessState from "@/app/components/document-translation/SuccessState";
import { AuthRequiredModal } from "@/app/components/shared/AuthRequiredModal";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { useFeatureAccess } from "@/lib/usage/useFeatureAccess";
import { isUnlimited } from "@/lib/entitlements/config";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { CreditCard, ShoppingBag, Sparkles, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";

interface DocumentTranslationToolProps extends ToolModeProps {
  showHeader?: boolean;
  showRequirements?: boolean;
  showRequestsLink?: boolean;
  className?: string;
  onSuccess?: (data: any) => void;
  journeyTier?: string | null;
}

export default function DocumentTranslationTool({
  showHeader = true,
  showRequirements = true,
  showRequestsLink = true,
  className = "",
  onSuccess,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: DocumentTranslationToolProps) {
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [userNotes, setUserNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const { activeCandidate, activeCandidateId } = useCandidate();
  const { t } = useLanguage();
  const plan = usePlan();
  const { checkAccess, consumeAccess } = useFeatureAccess();
  const { user } = useAuth();

  // Determine effective plan tier: in journey mode, evaluate against the specific journey's tier, otherwise account tier
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const effectiveTier: PlanTier = React.useMemo(() => {
    if (isJourney) {
      if (rawJourneyTier) {
        return normalizePlanTier(rawJourneyTier);
      }
      if (
        journeyContext?.journeyCategory &&
        plan.journeyTiers[journeyContext.journeyCategory]
      ) {
        return plan.journeyTiers[journeyContext.journeyCategory];
      }
    }
    return plan.tier;
  }, [isJourney, rawJourneyTier, journeyContext, plan.journeyTiers, plan.tier]);

  // Credit balance (mirrors Medical / PCC): plan.canUse() reflects pool
  // existence, not remaining balance — displays read the server usage counter.
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setRemainingCredits(null);
      setCreditsLoading(false);
      return;
    }
    if (isUnlimited("document_translation", effectiveTier)) {
      setCreditsLoading(false);
      return;
    }
    let cancelled = false;
    setCreditsLoading(true);
    (async () => {
      const access = await checkAccess("document_translation");
      if (cancelled) return;
      const usage = access?.data?.data?.usage;
      setRemainingCredits(usage?.remaining ?? 0);
      setCreditsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, effectiveTier, checkAccess]);
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // const isLocked = !plan.isLoading && !plan.canUse("document_translation");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const reset = () => {
    setFile(null);
    setDocumentType("");
    setUserNotes("");
    setError(null);
    setUploadSuccess(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type (PDF only)
    if (!selected.type.includes("application/pdf")) {
      setError(t("documentTranslation.uploadPage.validation.invalidPdf"));
      return;
    }

    // Validate file size (max 50MB)
    if (selected.size > 50 * 1024 * 1024) {
      setError(t("documentTranslation.uploadPage.validation.fileTooLarge"));
      return;
    }

    setFile(selected);
    setError(null);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!file || !documentType) {
      setError(t("documentTranslation.uploadPage.validation.missingFileOrType"));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("candidateId", activeCandidateId || "candidate-1");
      formData.append("candidateName", activeCandidate.fullName || activeCandidate.label || "");
      if (userNotes) {
        formData.append("userNotes", userNotes);
      }

      const response = await fetch("/api/document-translation/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("documentTranslation.uploadPage.validation.uploadFailed"));
      }

      setUploadSuccess(true);
      if (onSuccess) onSuccess(data);

      // Scroll to the top when success state appears
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("documentTranslation.uploadPage.validation.unexpectedError")
      );
    } finally {
      setUploading(false);
    }
  };

  // interface CheckoutStepProps {
  //   file: File | null;
  //   documentType: string;
  //   userNotes: string;
  //   error: string | null;
  //   loading: boolean;
  //   canUseTranslation: boolean;
  //   onBack: () => void;
  //   onSubmit: () => void;
  // }

  const handleCheckoutSubmit = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!file || !documentType) {
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Create translation request first
      const requestData = new FormData();

      requestData.append("file", file);
      requestData.append("documentType", documentType);
      requestData.append("candidateId", activeCandidateId || "candidate-1");
      requestData.append("candidateName", activeCandidate.fullName || activeCandidate.label || "");

      if (userNotes) {
        requestData.append("userNotes", userNotes);
      }

      const response = await fetch("/api/document-translation/upload", {
        method: "POST",
        body: requestData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      // Free path: Executive (unlimited) or one available credit. The POST
      // endpoint checks + consumes atomically, so no separate pre-check here.
      const unlimited = isUnlimited("document_translation", plan.tier);

      if (!unlimited) {
        const reservation = await consumeAccess("document_translation");

        if (!reservation.allowed || reservation.data?.allowed === false) {
          // No credits left (or raced with another tab) — pay $25 via Stripe.
          try {
            // The upload API returns { documentId } (not id). Send that to Stripe.
            const stripeRes = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ documentTranslationId: String(result.documentId) }),
            });
            const stripeData = await stripeRes.json();
            if (stripeData.url) {
              window.location.href = stripeData.url;
              return;
            }
            setCheckoutError("Could not start the payment. Please try again.");
            return;
          } catch (stripeErr) {
            console.error("Checkout redirection failed:", stripeErr);
            setCheckoutError("Checkout redirection failed");
            return;
          }
        }

        // Credit applied — keep the displayed balance in sync.
        if (reservation.data?.remaining !== undefined) {
          setRemainingCredits(reservation.data.remaining);
        }
      }

      setUploadSuccess(true);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  interface CheckoutStepProps {
    file: File | null;
    documentType: string;
    // sourceLanguage: string;
    // targetLanguage: string;
    userNotes: string;
    error: string | null;
    loading: boolean;
    isUnlimitedAccess: boolean;
    hasCredit: boolean;
    remainingCredits: number | null;
    creditsLoading: boolean;
    onBack: () => void;
    onSubmit: () => void;
  }

  const CheckoutStep = ({
    file,
    documentType,
    // sourceLanguage,
    // targetLanguage,
    userNotes,
    error,
    loading,
    isUnlimitedAccess,
    hasCredit,
    remainingCredits,
    creditsLoading,
    onBack,
    onSubmit,
  }: CheckoutStepProps) => {
    const freeTranslation = isUnlimitedAccess || hasCredit;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">Checkout</div>

          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Payment & Confirmation</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* LEFT COLUMN */}
          <div className="space-y-4 md:col-span-3">
            {/* Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-xs font-bold tracking-tight text-slate-400 uppercase">
                Translation Request Summary
              </h4>

              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-slate-800">{file?.name}</p>

                <p className="text-xs text-slate-500">
                  Document Type: <span className="font-medium text-slate-700">{documentType}</span>
                </p>

                {/* <p className="text-xs text-slate-500">
                Source Language:{" "}
                <span className="font-medium text-slate-700">
                  {sourceLanguage}
                </span>
              </p>

              <p className="text-xs text-slate-500">
                Target Language:{" "}
                <span className="font-medium text-slate-700">
                  {targetLanguage}
                </span>
              </p> */}

                {userNotes && (
                  <p className="text-xs text-slate-500">
                    Notes: <span className="font-medium text-slate-700">{userNotes}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Secure Transaction Card */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-5">
              <CreditCard className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />

              <div>
                <h5 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                  Secure Transaction
                </h5>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Your details are handled securely. One-time card payments are processed securely
                  via Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/55 p-6">
              <div>
                <h4 className="mb-4 flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                  <ShoppingBag className="h-4 w-4 text-teal-600" />
                  Price Breakdown
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      1x Document Translation Service
                    </span>

                    <span className="font-bold text-slate-800">$25.00</span>
                  </div>

                  {isUnlimitedAccess && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <Crown className="h-3.5 w-3.5" />
                        Executive Plan Benefit
                      </span>

                      <span className="font-bold">-$25.00</span>
                    </div>
                  )}

                  {!isUnlimitedAccess && hasCredit && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <Sparkles className="h-3.5 w-3.5" />
                        Translation Credit
                      </span>

                      <span className="font-bold">-$25.00</span>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-base font-bold text-slate-900">Total Due</span>

                    <span className="text-xl font-black text-slate-900">
                      {freeTranslation ? "$0.00" : "$25.00"}
                    </span>
                  </div>
                </div>

                {isUnlimitedAccess ? (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <Crown className="h-4 w-4 flex-shrink-0 text-amber-500" />

                    <span className="text-[11px] font-bold text-amber-800">
                      Document translation is included free with your Executive plan.
                    </span>
                  </div>
                ) : hasCredit ? (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <Sparkles className="h-4 w-4 flex-shrink-0 text-teal-600" />

                    <span className="text-[11px] font-bold text-amber-800">
                      1 of your {remainingCredits} translation{" "}
                      {remainingCredits === 1 ? "credit" : "credits"} will be applied — no payment
                      needed.
                    </span>
                  </div>
                ) : !creditsLoading ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-100 p-3">
                    <span className="text-[11px] font-bold text-slate-600">
                      {remainingCredits === 0
                        ? "No translation credits left — a one-time $25 fee applies at secure checkout."
                        : "A one-time $25 fee applies at secure checkout. Buy the translation add-on to translate free with credits next time."}
                    </span>
                  </div>
                ) : null}
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 sm:w-auto"
                >
                  Back
                </Button>

                <Button
                  onClick={onSubmit}
                  disabled={loading}
                  className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                >
                  {loading
                    ? "Processing..."
                    : isUnlimitedAccess
                      ? "Confirm Request (Free)"
                      : hasCredit
                        ? "Confirm Request (Free)"
                        : "Proceed to Payment ($25)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex w-full flex-col items-center ${className}`}>
      {/* Header */}
      {showHeader && (
        <header className="mb-8 w-full max-w-4xl text-center md:mb-10">
          <h1 className="text-primary/90 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
            {t("documentTranslation.uploadPage.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
            {t("documentTranslation.uploadPage.subtitle")}
          </p>
          <div className="mt-4 flex justify-center">
            <QuickAccessButton
              item={{
                id: "service-urdu-→-english-translation",
                title:
                  t("documentTranslation.uploadPage.title") || "Certified Document Translation",
                href: "/document-translation",
                icon_name: "Files",
              }}
            />
          </div>

          {/* Credit visibility (mirrors Medical / PCC credit chips) */}
          {isUnlimited("document_translation", plan.tier) ? (
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                <Crown className="h-3.5 w-3.5" />
                Executive — unlimited document translations
              </span>
            </div>
          ) : isAuthenticated && !creditsLoading ? (
            <div className="mt-4 flex justify-center">
              {remainingCredits !== null && remainingCredits > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  {remainingCredits} translation {remainingCredits === 1 ? "credit" : "credits"}{" "}
                  available
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  {remainingCredits === 0
                    ? "No translation credits left — $25 per translation"
                    : "No translation credits — $25 per translation"}
                </span>
              )}
            </div>
          ) : null}
        </header>
      )}

      {/* Step indicator — orients the user across the 2-step flow */}
      {!uploadSuccess && (
        <div className="mx-auto mb-8 flex w-full max-w-sm items-center justify-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                currentStep >= 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
            </span>
            <span
              className={`text-sm font-semibold ${currentStep >= 1 ? "text-slate-900" : "text-slate-400"}`}
            >
              {t("documentTranslation.uploadPage.steps.details") !==
              "documentTranslation.uploadPage.steps.details"
                ? t("documentTranslation.uploadPage.steps.details")
                : "Details"}
            </span>
          </div>

          <div
            className={`h-0.5 min-w-[24px] flex-1 rounded-full transition-colors ${
              currentStep >= 2 ? "bg-teal-600" : "bg-slate-200"
            }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                currentStep >= 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </span>
            <span
              className={`text-sm font-semibold ${currentStep >= 2 ? "text-slate-900" : "text-slate-400"}`}
            >
              {t("documentTranslation.uploadPage.steps.checkout") !==
              "documentTranslation.uploadPage.steps.checkout"
                ? t("documentTranslation.uploadPage.steps.checkout")
                : "Checkout"}
            </span>
          </div>
        </div>
      )}

      {!uploadSuccess ? (
        currentStep === 1 ? (
          <>
            {/* Requirements Section */}
            {showRequirements && (
              <section className="mb-8 w-full max-w-4xl rounded-xl border border-slate-100 bg-white p-5 shadow-lg sm:p-6 md:mb-12 md:p-8">
                <h2 className="text-primary/90 mb-5 flex items-center gap-2 text-xl font-semibold sm:mb-6 sm:text-2xl">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  {t("documentTranslation.uploadPage.requirementsTitle")}
                </h2>

                <ul className="grid gap-4 text-gray-700 sm:grid-cols-2 sm:gap-6">
                  {[
                    t("documentTranslation.uploadPage.requirements.1"),
                    t("documentTranslation.uploadPage.requirements.2"),
                    t("documentTranslation.uploadPage.requirements.3"),
                    t("documentTranslation.uploadPage.requirements.4"),
                    t("documentTranslation.uploadPage.requirements.5"),
                    t("documentTranslation.uploadPage.requirements.6"),
                  ].map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <span className="text-sm sm:text-base">
                        <strong className="mr-1">{i + 1}.</strong> {req}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Upload Section - Constraints applied for compactness */}
            <section className="w-full max-w-2xl">
              <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-md sm:p-6">
                <label className="mb-3 block text-center text-sm font-medium text-gray-700 sm:text-left">
                  {t("documentTranslation.uploadPage.uploadSectionTitle")}
                </label>

                <div
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors sm:p-6 ${file ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <FileText className="h-10 w-10 shrink-0 text-indigo-600" />
                      <div className="overflow-hidden text-center sm:text-left">
                        <p className="max-w-[250px] truncate font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500 sm:text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Upload className="mb-2 h-10 w-10" />
                      <p className="text-sm font-medium">
                        {t("documentTranslation.uploadPage.clickDragDrop")}
                      </p>
                      <p className="mt-1 text-xs">
                        {t("documentTranslation.uploadPage.pdfOnlyMax")}
                      </p>
                    </div>
                  )}
                </div>

                {file && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="mx-auto mt-3 flex cursor-pointer items-center gap-1 rounded-md border-none bg-red-500 p-2 text-sm text-white outline-hidden hover:bg-red-600"
                  >
                    <X className="h-4 w-4" /> {t("documentTranslation.uploadPage.removeDocument")}
                  </button>
                )}

                {/* Document Type Selection */}
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("documentTranslation.uploadPage.documentTypeLabel")}
                  </label>
                  <CustomDropdown
                    value={documentType}
                    onChange={setDocumentType}
                    options={[
                      {
                        value: "marriage",
                        label: t("documentTranslation.uploadPage.types.marriage"),
                      },
                      { value: "birth", label: t("documentTranslation.uploadPage.types.birth") },
                      {
                        value: "divorce",
                        label: t("documentTranslation.uploadPage.types.divorce"),
                      },
                      { value: "death", label: t("documentTranslation.uploadPage.types.death") },
                    ]}
                    placeholder={t("documentTranslation.uploadPage.selectTypePlaceholder")}
                    className="w-full [&_button]:w-full [&_button]:min-w-0"
                  />
                </div>

                {/* Optional Notes */}
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("documentTranslation.uploadPage.additionalNotesLabel")}
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder={t("documentTranslation.uploadPage.notesPlaceholder")}
                    className="focus:ring-primary min-h-[80px] w-full rounded-md border p-2 outline-hidden focus:border-transparent focus:ring-2"
                    maxLength={500}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={() => {
                    // if (isLocked) {
                    //   setShowUpgradeModal(true);
                    //   return;
                    // }

                    if (!file || !documentType) {
                      setError(t("documentTranslation.uploadPage.validation.missingFileOrType"));
                      return;
                    }

                    setCurrentStep(2);
                  }}
                  // disabled={!isLocked && (!file || uploading)}
                  className={`mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none py-3 font-semibold outline-hidden transition-all ${
                    // isLocked
                    //   ? "bg-primary/90 text-white blur-[1.5px] opacity-80 hover:scale-[0.99]"
                    //   :
                    !file || uploading
                      ? "cursor-not-allowed bg-gray-300 text-gray-500"
                      : "bg-primary/90 hover:bg-primary text-white"
                  }`}
                >
                  {uploading ? (
                    <>{t("documentTranslation.uploadPage.processingBtn")}</>
                  ) : (
                    <>
                      {/* {isLocked ? <Lock className="w-5 h-5" /> :  */}
                      <Upload className="h-5 w-5" />
                      {/* } */}
                      {t("documentTranslation.uploadPage.uploadBtn")}
                    </>
                  )}
                </button>

                {showRequestsLink && isAuthenticated && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={
                        // isLocked
                        //   ? () => setShowUpgradeModal(true)
                        //   :
                        () => (window.location.href = "/document-translation/my-requests")
                      }
                      className={`text-primary mx-auto flex cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent text-sm outline-hidden hover:underline`}
                    >
                      {/* {isLocked && <Lock className="w-3.5 h-3.5" />} */}
                      {t("documentTranslation.uploadPage.seeMyRequestsBtn")}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <CheckoutStep
            file={file}
            documentType={documentType}
            // sourceLanguage={sourceLanguage}
            // targetLanguage={targetLanguage}
            userNotes={userNotes}
            error={checkoutError}
            loading={checkoutLoading}
            isUnlimitedAccess={isUnlimited("document_translation", effectiveTier)}
            hasCredit={remainingCredits !== null && remainingCredits > 0}
            remainingCredits={remainingCredits}
            creditsLoading={creditsLoading}
            onBack={() => setCurrentStep(1)}
            onSubmit={handleCheckoutSubmit}
          />
        )
      ) : (
        <SuccessState
          onGoToRequests={() => (window.location.href = "/document-translation/my-requests")}
        />
      )}

      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo="/document-translation"
      />
      {/* {showUpgradeModal && (
        <UpgradeModal feature="document_translation" onClose={() => setShowUpgradeModal(false)} />
      )} */}
    </div>
  );
}
