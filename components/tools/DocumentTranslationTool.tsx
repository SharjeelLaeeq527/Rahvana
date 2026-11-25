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
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import ServiceSkinShell from "@/components/tools/service-skin/ServiceSkinShell";
import {
  SERVICE_SKIN_FAQ,
  SERVICE_SKIN_TAGLINE,
} from "@/components/tools/service-skin/serviceSkinCopy";

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
  // The service skin always shows the service name in its pane; kept for callers.
  void showHeader;

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

  const trLabel = (key: string, fallback: string) => {
    const value = t(key);
    return value !== key ? value : fallback;
  };
  // Journey requests submit straight from the upload step (the plan covers them).
  const trSteps = isJourney
    ? [trLabel("documentTranslation.uploadPage.steps.details", "Details")]
    : [
        trLabel("documentTranslation.uploadPage.steps.details", "Details"),
        trLabel("documentTranslation.uploadPage.steps.checkout", "Checkout"),
      ];
  const trStepIndex = isJourney ? 0 : Math.min(currentStep, 2) - 1;
  const onUploadStep = currentStep === 1 || isJourney;

  return (
    <div className={`w-full ${className}`}>
      <ServiceSkinShell
        service="translate"
        title={t("documentTranslation.uploadPage.title") || "Document translation"}
        tagline={t("documentTranslation.uploadPage.subtitle") || SERVICE_SKIN_TAGLINE.translate}
        steps={trSteps}
        current={trStepIndex}
        onStepSelect={
          !isJourney && !uploadSuccess
            ? () => {
                // Same as the checkout Back button.
                pendingDraftRef.current = null;
                setCurrentStep(1);
              }
            : undefined
        }
        done={uploadSuccess}
        heading={!uploadSuccess && onUploadStep ? "Upload your Urdu document" : undefined}
        subheading={
          !uploadSuccess && onUploadStep ? "We return a certified English translation." : undefined
        }
        timeEstimate="2 min"
        faq={SERVICE_SKIN_FAQ.translate}
        layout={isJourney ? "embedded" : "page"}
        topOffset={isJourney ? 0 : 60}
        onRequests={
          showRequestsLink && isAuthenticated
            ? () => (window.location.href = "/document-translation/my-requests")
            : undefined
        }
        requestsLabel={t("documentTranslation.uploadPage.seeMyRequestsBtn") || "My requests"}
      >
        {!uploadSuccess ? (
          onUploadStep ? (
            <>
              {/* Requirements */}
              {showRequirements && (
                <section className="svk-need">
                  <b className="mb-2 block">
                    {t("documentTranslation.uploadPage.requirementsTitle")}
                  </b>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {[
                      t("documentTranslation.uploadPage.requirements.1"),
                      t("documentTranslation.uploadPage.requirements.2"),
                      t("documentTranslation.uploadPage.requirements.3"),
                      t("documentTranslation.uploadPage.requirements.4"),
                      t("documentTranslation.uploadPage.requirements.5"),
                      t("documentTranslation.uploadPage.requirements.6"),
                    ].map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Upload */}
              <section>
                <span className="mb-2 block text-sm font-semibold">
                  {t("documentTranslation.uploadPage.uploadSectionTitle")}
                </span>

                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer rounded-[14px] border-2 border-dashed border-teal-500 bg-teal-50 p-6 text-center transition-colors hover:brightness-[0.98]"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
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
                      <FileText className="h-10 w-10 shrink-0 text-teal-700" />
                      <div className="overflow-hidden text-center sm:text-left">
                        <p className="max-w-[250px] truncate font-semibold">{file.name}</p>
                        <p className="text-xs text-gray-500 sm:text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-teal-800">
                      <Upload className="mb-2 h-9 w-9" />
                      <p className="text-sm font-semibold">
                        {t("documentTranslation.uploadPage.clickDragDrop")}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
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
                    className="svk-btn svk-btn-gho mx-auto mt-2 flex !min-h-0 text-sm"
                  >
                    <X className="h-4 w-4" /> {t("documentTranslation.uploadPage.removeDocument")}
                  </button>
                )}

                {/* Document Type Selection */}
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold">
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
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold">
                    {t("documentTranslation.uploadPage.additionalNotesLabel")}
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder={t("documentTranslation.uploadPage.notesPlaceholder")}
                    className="w-full p-3"
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

                <div className="svk-actions">
                  <button
                    type="button"
                    onClick={() => {
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
                    className={`svk-btn svk-btn-pri ${!file || uploading ? "opacity-50" : ""}`}
                  >
                    {uploading ? (
                      <>{t("documentTranslation.uploadPage.processingBtn")}</>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        {t("documentTranslation.uploadPage.uploadBtn")}
                      </>
                    )}
                  </button>
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
      </ServiceSkinShell>

      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo="/document-translation"
      />
    </div>
  );
}
