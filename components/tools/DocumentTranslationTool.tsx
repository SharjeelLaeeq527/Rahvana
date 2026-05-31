"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, X, FileText, Lock } from "lucide-react";
import SuccessState from "@/app/components/document-translation/SuccessState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthRequiredModal } from "@/app/components/shared/AuthRequiredModal";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";

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

  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isLocked = !plan.isLoading && !plan.canUse("document_translation");

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
        </header>
      )}

      {!uploadSuccess ? (
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
                    <p className="text-xs mt-1">{t("documentTranslation.uploadPage.pdfOnlyMax")}</p>
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
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("documentTranslation.uploadPage.selectTypePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="marriage">
                      {t("documentTranslation.uploadPage.types.marriage")}
                    </SelectItem>
                    <SelectItem value="birth">
                      {t("documentTranslation.uploadPage.types.birth")}
                    </SelectItem>
                    <SelectItem value="divorce">
                      {t("documentTranslation.uploadPage.types.divorce")}
                    </SelectItem>
                    <SelectItem value="death">
                      {t("documentTranslation.uploadPage.types.death")}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                onClick={isLocked ? () => setShowUpgradeModal(true) : handleUpload}
                disabled={!isLocked && (!file || uploading)}
                className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center cursor-pointer gap-2 border-none outline-hidden
                  ${
                    isLocked
                      ? "bg-primary/90 text-white blur-[1.5px] opacity-80 hover:scale-[0.99]"
                      : !file || uploading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary/90 text-white hover:bg-primary"
                  }`}
              >
                {uploading ? (
                  <>{t("documentTranslation.uploadPage.processingBtn")}</>
                ) : (
                  <>
                    {isLocked ? <Lock className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    {t("documentTranslation.uploadPage.uploadBtn")}
                  </>
                )}
              </button>

              {showRequestsLink && isAuthenticated && (
                <div className="mt-4 text-center">
                  <button
                    onClick={
                      isLocked
                        ? () => setShowUpgradeModal(true)
                        : () => (window.location.href = "/document-translation/my-requests")
                    }
                    className={`text-primary hover:underline text-sm cursor-pointer bg-transparent border-none outline-hidden flex items-center justify-center gap-1.5 mx-auto ${
                      isLocked ? "blur-[1px] opacity-80" : ""
                    }`}
                  >
                    {isLocked && <Lock className="w-3.5 h-3.5" />}
                    {t("documentTranslation.uploadPage.seeMyRequestsBtn")}
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="w-full flex justify-center">
          <SuccessState
            onGoToRequests={() => (window.location.href = "/document-translation/my-requests")}
          />
        </div>
      )}

      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo="/document-translation"
      />
      {showUpgradeModal && (
        <UpgradeModal
          feature="document_translation"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
