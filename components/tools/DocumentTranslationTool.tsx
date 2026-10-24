"use client";

import { useState, useRef } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  CreditCard,
  ShoppingBag,
  Coins,
} from "lucide-react";
import SuccessState from "@/app/components/document-translation/SuccessState";
import { AuthRequiredModal } from "@/app/components/shared/AuthRequiredModal";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useWallet } from "@/app/context/WalletContext";
import { serviceBookingErrorMessage } from "@/lib/wallet/client";
import { normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";

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
  const wallet = useWallet();
  // Standalone draft whose payment failed: a retry pays for this same request
  // (never a second one). Cleared once paid or when the user goes back to edit.
  const pendingDraftRef = useRef<string | null>(null);
  const { user } = useAuth();

  // Effective tier — journey tier when embedded, null otherwise
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const journeyTierEffective: PlanTier | null =
    isJourney && rawJourneyTier ? normalizePlanTier(rawJourneyTier) : null;
  void journeyTierEffective;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const reset = () => {
    setFile(null);
    setDocumentType("");
    setUserNotes("");
    setError(null);
    setCheckoutError(null);
    setUploadSuccess(false);
    setCurrentStep(1);
    pendingDraftRef.current = null;

    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
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

  // Origin tag: journey-embedded requests are kept out of standalone My Resources (mirrors PCC / Medical).
  // A journey request also names its journey, which the server checks for ownership + plan.
  const buildUploadFormData = (selected: File, type: string) => {
    const requestData = new FormData();
    requestData.append("file", selected);
    requestData.append("documentType", type);
    requestData.append("candidateId", activeCandidateId || "candidate-1");
    requestData.append("candidateName", activeCandidate.fullName || activeCandidate.label || "");
    if (isJourney) {
      requestData.append("source", "journey");
      requestData.append("journey_slug", journeyContext?.journeySlug || "");
      requestData.append("journey_id", journeyContext?.backendId || "");
      requestData.append("journey_category", journeyContext?.journeyCategory || "");
    } else {
      requestData.append("source", "standalone");
    }
    if (userNotes) {
      requestData.append("userNotes", userNotes);
    }
    return requestData;
  };

  // Journey submit: covered by the journey plan, so no checkout step and no credits.
  const handleUpload = async () => {
    if (uploading) return;
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
      const response = await fetch("/api/document-translation/upload", {
        method: "POST",
        body: buildUploadFormData(file, documentType),
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

      // Standalone only (journeys submit from step 1): deduct 25 wallet credits ($25)
      // Check wallet balance first
      if (wallet.balance === null || wallet.balance < 25) {
        const deficit = Math.max(25, 25 - (wallet.balance ?? 0));
        wallet.openTopup({ amount: deficit });
        setCheckoutError(
          `You need 25 credits for document translation (Balance: ${wallet.balance ?? 0} credits). Please top up to proceed.`
        );
        setCheckoutLoading(false);
        return;
      }

      // Upload file and create pending request row (reused on a retry)
      let docId = pendingDraftRef.current;
      let uploadData: unknown = { documentId: docId };
      if (!docId) {
        const uploadRes = await fetch("/api/document-translation/upload", {
          method: "POST",
          body: buildUploadFormData(file, documentType),
        });
        uploadData = await uploadRes.json();
        const created = uploadData as { documentId?: string; error?: string };
        if (!uploadRes.ok || !created.documentId) {
          throw new Error(created.error || t("documentTranslation.uploadPage.validation.uploadFailed"));
        }
        docId = created.documentId;
        pendingDraftRef.current = docId;
      }

      // Deduct 25 credits atomically for service booking
      try {
        const deductResult = await wallet.deductServiceBooking("document-translation", docId);

        if (deductResult.body.success) {
          pendingDraftRef.current = null;
          setUploadSuccess(true);
          if (onSuccess) onSuccess(uploadData);
          return;
        }

        if (deductResult.status === 402) {
          const deficit = deductResult.body.deficit ?? 25;
          wallet.openTopup({ amount: deductResult.body.topupAmount ?? deficit });
          setCheckoutError(
            `Insufficient credits. Please top up ${deficit} credits to complete your translation request.`
          );
          setCheckoutLoading(false);
          return;
        }

        console.error("Credit deduction failed:", deductResult.body.error);
        setCheckoutError(serviceBookingErrorMessage(deductResult.body.error));
        setCheckoutLoading(false);
        return;
      } catch (deductErr: unknown) {
        console.error("Credit deduction failed:", deductErr);
        setCheckoutError(serviceBookingErrorMessage("NETWORK_ERROR"));
        setCheckoutLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  interface CheckoutStepProps {
    file: File | null;
    documentType: string;
    userNotes: string;
    error: string | null;
    loading: boolean;
    walletBalance: number | null;
    walletLoading: boolean;
    onTopup: (deficit: number) => void;
    onBack: () => void;
    onSubmit: () => void;
  }

  const CheckoutStep = ({
    file,
    documentType,
    userNotes,
    error,
    loading,
    walletBalance,
    walletLoading,
    onTopup,
    onBack,
    onSubmit,
  }: CheckoutStepProps) => {
    const costCredits = 25;
    const hasWalletCredits = walletBalance !== null && walletBalance >= costCredits;
    const deficit = Math.max(costCredits, costCredits - (walletBalance ?? 0));

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
                  Document Type: <span className="font-medium text-slate-700 capitalize">{documentType}</span>
                </p>

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
                  Standalone requests are paid with your Rahvana Wallet credits ($1 = 1 credit). If your balance is short, you can top up instantly via Stripe.
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

                    <span className="font-bold text-slate-800">25 Credits ($25.00)</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">Wallet Balance</span>
                    <span className="font-bold text-slate-800">
                      {walletLoading ? "..." : `${walletBalance ?? 0} Credits`}
                    </span>
                  </div>

                  {hasWalletCredits && (
                    <div className="flex items-center justify-between text-sm text-[#0d7377]">
                      <span className="font-medium">Balance After Booking</span>
                      <span className="font-bold">{(walletBalance ?? 25) - costCredits} Credits</span>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-base font-bold text-slate-900">Total Due</span>

                    <span className="text-xl font-black text-slate-900">
                      25 Credits ($25.00)
                    </span>
                  </div>
                </div>

                {hasWalletCredits ? (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3">
                    <Coins className="h-4 w-4 flex-shrink-0 text-[#0d7377]" />
                    <span className="text-[11px] font-bold text-teal-800">
                      25 credits will be deducted from your Rahvana Wallet upon confirmation.
                    </span>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <div className="flex items-start gap-2">
                      <Coins className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          Insufficient Wallet Balance
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          You have {walletBalance ?? 0} credits. 25 credits are required to submit this translation request.
                        </p>
                        <button
                          type="button"
                          onClick={() => onTopup(deficit)}
                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#0d7377] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0a5c5f]"
                        >
                          <Coins size={12} /> Top up {deficit} Credits (${deficit})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                  onClick={hasWalletCredits ? onSubmit : () => onTopup(deficit)}
                  disabled={loading}
                  className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                >
                  {loading
                    ? "Processing..."
                    : hasWalletCredits
                      ? "Pay 25 Credits & Confirm"
                      : `Top up ${deficit} Credits to Submit`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex w-full flex-col items-center ${
        uploadSuccess ? "flex-1 justify-center" : ""
      } ${className}`}
    >
      {/* Header */}
      {showHeader && (
        <header className="mb-8 w-full max-w-4xl text-center md:mb-10">
          <h1 className="text-primary/90 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
            {t("documentTranslation.uploadPage.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
            {t("documentTranslation.uploadPage.subtitle")}
          </p>
          {!isJourney && (
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
          )}

          {/* Credit visibility for standalone */}
          {/* {!isJourney && isAuthenticated && (
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                <Coins size={14} className="text-[#0d7377]" />
                25 Credits ($25) per translation • Balance: {wallet.isLoading ? "..." : `${wallet.balance ?? 0} Credits`}
              </span>
            </div>
          )} */}
        </header>
      )}

      {/* Step indicator: orients the user across the 2-step flow (standalone only) */}
      {!uploadSuccess && !isJourney && (
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
        currentStep === 1 || isJourney ? (
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

                    if (isJourney) {
                      void handleUpload();
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
            userNotes={userNotes}
            error={checkoutError}
            loading={checkoutLoading}
            walletBalance={wallet.balance}
            walletLoading={wallet.isLoading}
            onTopup={(deficit) => wallet.openTopup({ amount: deficit })}
            onBack={() => {
              pendingDraftRef.current = null;
              setCurrentStep(1);
            }}
            onSubmit={handleCheckoutSubmit}
          />
        )
      ) : (
        <SuccessState
          onGoToRequests={() => (window.location.href = "/document-translation/my-requests")}
          onUploadAnother={reset}
          isJourney={isJourney}
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
