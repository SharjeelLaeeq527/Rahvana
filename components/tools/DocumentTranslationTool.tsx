"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, X, FileText, Lock } from "lucide-react";
import SuccessState from "@/app/components/document-translation/SuccessState";
import { AuthRequiredModal } from "@/app/components/shared/AuthRequiredModal";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { CreditCard, ShoppingBag, Sparkles, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

interface DocumentTranslationToolProps {
  showHeader?: boolean;
  showRequirements?: boolean;
  showRequestsLink?: boolean;
  className?: string;
  onSuccess?: (data: any) => void;
}

export default function DocumentTranslationTool({
  showHeader = true,
  showRequirements = true,
  showRequestsLink = true,
  className = "",
  onSuccess,
}: DocumentTranslationToolProps) {
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
  const { t } = useLanguage();
  const plan = usePlan();
  const { user } = useAuth();
  const canUseTranslation = plan.canUse("document_translation");
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

      // if (!canUseTranslation) {
      //   const stripeRes = await fetch("/api/stripe/checkout", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       documentTranslationId: result.id,
      //     }),
      //   });

      //   const stripeData = await stripeRes.json();

      //   if (stripeData.url) {
      //     window.location.href = stripeData.url;
      //     return;
      //   }
      // }
      if (!canUseTranslation && user?.id) {
        try {
          // The upload API returns { documentId } (not id). Send that to Stripe.
          const payload = { documentTranslationId: String(result.documentId) };
          console.debug("/api/stripe/checkout payload:", payload);

          const stripeRes = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const stripeData = await stripeRes.json();

          if (!stripeRes.ok) {
            throw new Error(stripeData.error || "Failed to create checkout session");
          }

          if (!stripeData.url) {
            throw new Error("Stripe checkout URL was not returned");
          }
          window.location.href = stripeData.url;
          return;
        } catch (stripeErr: any) {
          console.error("Checkout redirection failed:", stripeErr);
          setCheckoutError(stripeErr.message || "Checkout redirection failed");
          return;
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
    canUseTranslation: boolean;
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
    canUseTranslation,
    onBack,
    onSubmit,
  }: CheckoutStepProps) => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">Checkout</div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Payment & Confirmation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* LEFT COLUMN */}
          <div className="md:col-span-3 space-y-4">
            {/* Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">
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
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />

              <div>
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Secure Transaction
                </h5>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your details are handled securely. One-time card payments are processed securely
                  via Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-2">
            <div className="bg-slate-50/55 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-teal-600" />
                  Price Breakdown
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">
                      1x Document Translation Service
                    </span>

                    <span className="text-slate-800 font-bold">$25.00</span>
                  </div>

                  {canUseTranslation && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="font-semibold flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Plan Benefit
                      </span>

                      <span className="font-bold">-$25.00</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 mt-2 flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">Total Due</span>

                    <span className="text-xl font-black text-slate-900">
                      {canUseTranslation ? "$0.00" : "$25.00"}
                    </span>
                  </div>
                </div>

                {canUseTranslation && (
                  <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />

                    <span className="text-[11px] font-bold text-amber-800">
                      Free document translation included with your plan.
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 mt-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-6 mt-6 border-t border-slate-200">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Back
                </Button>

                <Button
                  onClick={onSubmit}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading
                    ? "Processing..."
                    : canUseTranslation
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
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Header */}
      {showHeader && (
        <header className="text-center mb-8 md:mb-10 w-full max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary/90 leading-tight">
            {t("documentTranslation.uploadPage.title")}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {t("documentTranslation.uploadPage.subtitle")}
          </p>
          <div className="flex justify-center mt-4">
            <QuickAccessButton
              item={{
                id: "service-urdu-→-english-translation",
                title: t("documentTranslation.uploadPage.title") || "Certified Document Translation",
                href: "/document-translation",
                icon_name: "Files",
              }}
            />
          </div>
        </header>
      )}


      {!uploadSuccess ? (
        currentStep === 1 ? (
          <>
            {/* Requirements Section */}
            {showRequirements && (
              <section className="w-full max-w-4xl mb-8 md:mb-12 bg-white rounded-xl shadow-lg p-5 sm:p-6 md:p-8 border border-slate-100">
                <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-primary/90 mb-5 sm:mb-6">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  {t("documentTranslation.uploadPage.requirementsTitle")}
                </h2>

                <ul className="grid sm:grid-cols-2 gap-4 sm:gap-6 text-gray-700">
                  {[
                    t("documentTranslation.uploadPage.requirements.1"),
                    t("documentTranslation.uploadPage.requirements.2"),
                    t("documentTranslation.uploadPage.requirements.3"),
                    t("documentTranslation.uploadPage.requirements.4"),
                    t("documentTranslation.uploadPage.requirements.5"),
                    t("documentTranslation.uploadPage.requirements.6"),
                  ].map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
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
              <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-slate-100">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center sm:text-left">
                  {t("documentTranslation.uploadPage.uploadSectionTitle")}
                </label>

                <div
                  className={`border-2 border-dashed rounded-lg p-5 sm:p-6 text-center transition-colors cursor-pointer
                  ${file ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}
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
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-indigo-600 shrink-0" />
                      <div className="text-center sm:text-left overflow-hidden">
                        <p className="font-medium truncate max-w-[250px]">{file.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Upload className="w-10 h-10 mb-2" />
                      <p className="text-sm font-medium">
                        {t("documentTranslation.uploadPage.clickDragDrop")}
                      </p>
                      <p className="text-xs mt-1">
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
                    className="mt-3 text-sm text-white flex items-center gap-1 mx-auto bg-red-500 rounded-md p-2 cursor-pointer hover:bg-red-600 border-none outline-hidden"
                  >
                    <X className="w-4 h-4" /> {t("documentTranslation.uploadPage.removeDocument")}
                  </button>
                )}

                {/* Document Type Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("documentTranslation.uploadPage.additionalNotesLabel")}
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder={t("documentTranslation.uploadPage.notesPlaceholder")}
                    className="w-full border rounded-md p-2 min-h-[80px] focus:ring-2 focus:ring-primary focus:border-transparent outline-hidden"
                    maxLength={500}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
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
                  className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center cursor-pointer gap-2 border-none outline-hidden
                  ${
                    // isLocked
                    //   ? "bg-primary/90 text-white blur-[1.5px] opacity-80 hover:scale-[0.99]"
                    //   :
                    !file || uploading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary/90 text-white hover:bg-primary"
                  }`}
                >
                  {uploading ? (
                    <>{t("documentTranslation.uploadPage.processingBtn")}</>
                  ) : (
                    <>
                      {/* {isLocked ? <Lock className="w-5 h-5" /> :  */}
                      <Upload className="w-5 h-5" />
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
                      className={`text-primary hover:underline text-sm cursor-pointer bg-transparent border-none outline-hidden flex items-center justify-center gap-1.5 mx-auto 
                      `}
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
            canUseTranslation={canUseTranslation}
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
