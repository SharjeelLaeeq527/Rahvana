// app/components/forms/reusable/multi-step-form.tsx
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { getFormConfig } from "@/lib/formConfig";
import { ProgressBar } from "./ProgressBar";
import { FormStep } from "./FormStep";
import { ReviewPage } from "./ReviewPage";
import type { Field as ConfigField } from "@/lib/formConfig/types";
import { Menu, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { autoFillForm } from "@/lib/autoFill/mapper";
import type { MasterProfile } from "@/types/profile";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DocumentRole } from "@/lib/document-vault/types";
import { useToast } from "@/app/components/shared/ToastProvider";

const FORM_ID_MAPPING: Record<string, string> = {
  i130: "i-130-petition",
  i130a: "i-130a-supplemental",
  i129f: "i-129f-petition",
  i912: "i-912-waiver",
  i864: "i-864-affidavit",
  i864a: "i-864a-contract",
  i864ez: "i-864ez-affidavit",
  i693: "i-693-medical",
  ds260: "ds-260",
};

type ViewType = "form" | "review";

type MultiStepFormProps = {
  formCode: string;
};

export function MultiStepForm({ formCode }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewType>("form");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const { showToast } = useToast();
  const {
    config: vaultConfig,
    reloadDocuments,
    initialize: initializeVault,
  } = useDocumentVaultStore();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Hooks must always run in the same order
  const config = useMemo(() => getFormConfig(formCode), [formCode]);

  // Load initial form data

  useEffect(() => {
    if (config) setFormData(config.getInitialFormData());
  }, [config]);

  // Initialize vault store
  useEffect(() => {
    if (user && !vaultConfig) {
      initializeVault(user.id);
    }
  }, [user, vaultConfig, initializeVault]);

  // Auto-fill from user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || profileLoaded) return;

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('profile_details')
          .eq('id', user.id)
          .single();

        if (data?.profile_details) {
           setFormData(prev => {
             // Use current form structure as template for auto-fill
             const autoData = autoFillForm(data.profile_details as MasterProfile, prev) as Record<string, string>;
             return {
               ...prev,
               ...autoData // Merge auto-filled data on top of defaults
             };
           });
           setProfileLoaded(true);
        }

      } catch (err) {
        console.error("Auto-fill error:", err);
      }
    };
    loadProfile();
  }, [user, profileLoaded, supabase]);

  const sections = useMemo(() => {
    if (!config) return [];

    const sectionMap = new Map<string, ConfigField[]>();

    config.formFields.forEach((field: ConfigField) => {
      if (field.condition && !field.condition(formData)) return;

      const section = field.section ?? "General";
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)!.push(field);
    });

    return Array.from(sectionMap.entries())
      .filter(([, fields]) => fields.length > 0)
      .map(([title, fields]) => ({ title, fields }));
  }, [formData, config]);

  const totalSteps = sections.length;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const currentSection = sections[currentStep - 1];

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (checked ? "Yes" : "") : value,
      }));
    },
    []
  );

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else setView("review");
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
    setView("form");
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
    setView("form");
  };

  const buildPdfPayload = useCallback((): Record<string, string> => {
    if (!config) return {};

    const payload: Record<string, string> = {};

    config.formFields.forEach((field: ConfigField) => {
      const value = formData[field.key];
      if (!value || (field.condition && !field.condition(formData))) return;

      if (field.type === "radio" && field.options) {
        const selected = field.options.find(
          (opt: { value: string; pdfKey: string }) => opt.value === value
        );
        if (selected) {
          payload[selected.pdfKey] = "Yes";
          field.options
            .filter(
              (opt: { value: string; pdfKey: string }) => opt.value !== value
            )
            .forEach(
              (opt: { value: string; pdfKey: string }) =>
                (payload[opt.pdfKey] = "Off")
            );
        }
      } else if (field.type === "checkbox") {
        const isChecked =
          value === "Yes" || String(value) === "true" || value === "on";
        payload[field.pdfKey] = isChecked ? "Yes" : "Off";
      } else {
        payload[field.pdfKey] = value;
      }
    });

    return payload;
  }, [config, formData]);

  const handlePreviewPDF = async () => {
    const payload = buildPdfPayload();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    setIsPreviewing(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: unknown) {
      console.error("Preview error:", err);
      if (err instanceof Error)
        alert(`Preview failed: ${err.message}. Please check console.`);
      else alert("Preview failed. Please check console.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    const payload = buildPdfPayload();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    setIsDownloading(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formCode.toUpperCase()}-filled.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Download error:", err);
      if (err instanceof Error)
        alert(`Download failed: ${err.message}. Please check console.`);
      else alert("Download failed. Please check console.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToVault = useCallback(async () => {
    if (!user) {
      showToast("Please login to save to the Document Vault", "error");
      return;
    }

    if (!vaultConfig) {
      showToast("Document Vault is not ready. Please wait a moment.", "error");
      return;
    }

    const docDefId = FORM_ID_MAPPING[formCode.toLowerCase()];
    if (!docDefId) {
      showToast(
        `This form (${formCode}) cannot be saved to the vault automatically yet.`,
        "error"
      );
      return;
    }

    const payload = buildPdfPayload();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    setIsSavingToVault(true);

    try {
      // 1. Generate PDF
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();

      // 2. Prepare Upload
      const file = new File(
        [blob],
        `${formCode.toUpperCase()}-auto-filled.pdf`,
        {
          type: "application/pdf",
        }
      );

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("documentDefId", docDefId);

      // Default role based on form code if possible
      let role: DocumentRole = "PETITIONER";
      if (
        formCode.toLowerCase() === "i130a" ||
        formCode.toLowerCase() === "ds260" ||
        formCode.toLowerCase() === "i693"
      ) {
        role = "BENEFICIARY";
      } else if (formCode.toLowerCase() === "i864a") {
        role = "HOUSEHOLD_MEMBER";
      }

      formDataUpload.append("role", role);
      formDataUpload.append("caseId", vaultConfig.caseId || "CASE");

      let personName = "Unknown";
      if (role === "PETITIONER" && vaultConfig.petitionerName) {
        personName = vaultConfig.petitionerName;
      } else if (role === "BENEFICIARY" && vaultConfig.beneficiaryName) {
        personName = vaultConfig.beneficiaryName;
      } else if (role === "JOINT_SPONSOR" && vaultConfig.jointSponsorName) {
        personName = vaultConfig.jointSponsorName;
      }
      formDataUpload.append("personName", personName);
      formDataUpload.append(
        "notes",
        `Automatically generated via ${config?.formTitle || formCode} tool.`
      );

      // 3. Upload to vault
      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }

      showToast("Successfully saved to Document Vault!", "success");

      // Refresh vault documents list
      if (reloadDocuments) {
        await reloadDocuments();
      }
    } catch (err: unknown) {
      console.error("Save to vault error:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to save to vault",
        "error"
      );
    } finally {
      setIsSavingToVault(false);
    }
  }, [
    user,
    vaultConfig,
    formCode,
    buildPdfPayload,
    config?.formTitle,
    reloadDocuments,
  ]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-10 text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-800 mb-3">
            Form Not Found
          </h2>
          <p className="text-red-700">
            Sorry, the form &quot;<strong>{formCode.toUpperCase()}</strong>
            &quot; is not available yet.
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Available: I-130, I-130A, I-864, DS-260
          </p>
        </div>
      </div>
    );
  }

  if (totalSteps === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No questions in this form.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-linear-to-r from-primary to-primary text-white p-4 md:p-6 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          {view === "form" && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Open navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              {config.formTitle || `USCIS Form ${formCode.toUpperCase()}`}
            </h1>
            {config.formSubtitle && (
              <p className="text-white/90 mt-1 text-sm md:text-base">
                {config.formSubtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 lg:hidden ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Drawer Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Quick Navigation
            </h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Progress</h3>
            <ProgressBar
              current={currentStep}
              total={totalSteps}
              progress={progress}
            />
            <p className="text-sm text-gray-600 mt-3 text-center">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
            <div className="space-y-2">
              {sections.map((section, idx) => {
                const label =
                  section.title.split(".").pop()?.trim() || section.title;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      handleGoToStep(idx + 1);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                      currentStep === idx + 1
                        ? "bg-primary text-white shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep === idx + 1
                            ? "bg-white/20"
                            : "bg-gray-200"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Sidebar Layout */}
      <div className="flex gap-6 p-4 md:p-6">
        {/* Desktop Left Sidebar - Progress & Navigation */}
        {view === "form" && (
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-6 space-y-6">
              {/* Progress Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Progress</h3>
                <ProgressBar
                  current={currentStep}
                  total={totalSteps}
                  progress={progress}
                />
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>

              {/* Quick Navigation */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {sections.map((section, idx) => {
                    // const label = section.title.split(".").pop()?.trim() || section.title;
                    const label = section.title.replace(/^\d+\.\s*/, "");
                    return (
                      <button
                        key={idx}
                        onClick={() => handleGoToStep(idx + 1)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                          currentStep === idx + 1
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-50 text-gray-700 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              currentStep === idx + 1
                                ? "bg-white/20"
                                : "bg-gray-200"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">{label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {view === "form" && currentSection && (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
              <FormStep
                stepNumber={currentStep}
                sectionTitle={currentSection.title}
                fields={currentSection.fields}
                formData={formData}
                onInputChange={handleChange}
              />

              {/* Navigation Buttons */}
              <div className="flex flex-row justify-between gap-3 mt-10 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-6 md:px-8 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold rounded-lg transition"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 md:px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition shadow-sm"
                >
                  {currentStep === totalSteps ? "Review Answers" : "Next"}
                </button>
              </div>
            </div>
          )}

          {view === "review" && (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
              <ReviewPage
                formData={formData}
                sections={sections}
                onEditStep={handleEditStep}
                onBackToForm={() => setView("form")}
                onPreviewPDF={handlePreviewPDF}
                onDownloadPDF={handleDownloadPDF}
                onSaveToVault={handleSaveToVault}
                isPreviewing={isPreviewing}
                isDownloading={isDownloading}
                isSavingToVault={isSavingToVault}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
