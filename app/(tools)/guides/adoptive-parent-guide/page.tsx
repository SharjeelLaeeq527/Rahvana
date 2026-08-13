"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, { InfoPanelData } from "../../../components/guides/WizardInfoPanel";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/adoption-guide-data.json";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  Languages,
  Upload,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";

import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { NavigationGuard } from "@/lib/guides/useNavigationGuard";
import { useLanguage } from "@/app/context/LanguageContext";

const STEP_IDS: WizardStepId[] = [
  "document_need",
  "roadmap",
  "translation_standards" as WizardStepId,
  "validation",
];

const STEP_LABELS: Record<string, string> = {
  document_need: "Eligibility Check",
  roadmap: "Required Documents",
  translation_standards: "Translation Standards",
  validation: "Review & Finalize",
};

const INFO_PANEL_KEYS: Record<string, string> = {
  document_need: "document_need",
  roadmap: "roadmap",
  translation_standards: "translation_standards",
  validation: "validation",
};

const AdoptionGuidePage = () => {
  const { isUrdu } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(
    typeof window !== "undefined" && localStorage.getItem("dont_show_adoption_welcome") === "true"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [navigationHandled, setNavigationHandled] = useState(false);

  const [state, setState] = useState<WizardState>({
    documentNeed: { placementType: "", childAge: "", rulesMet: "" },
    ageCategory: null,
    birthSetting: null,
    province: null,
    district: null,
    city: null,
    checkedDocuments: [],
    validationChecks: [],
    uploadedFile: false,
    savedOffice: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedModal = useRef(false);

  const { saveWizardStep, session, loading } = useWizardSession(
    "adoption-guide",
    state,
    setState,
    STEP_IDS as string[],
    setCurrentStep,
    (prev, stepsData) => {
      // Restore state from database progress
      const docNeed = stepsData.document_need || prev.documentNeed;
      const checkedDocs = stepsData.roadmap?.checkedDocuments || prev.checkedDocuments;
      const valChecks = stepsData.validation?.checks || prev.validationChecks;
      const uploaded = stepsData.validation?.uploaded || prev.uploadedFile;

      return {
        ...prev,
        documentNeed: typeof docNeed === "string" ? JSON.parse(docNeed) : docNeed,
        checkedDocuments: checkedDocs,
        validationChecks: valChecks,
        uploadedFile: uploaded,
      };
    }
  );

  const { uploadFile: uploadFileHook } = useGuideUpload();
  const { submitFeedback: submitFeedbackHook } = useGuideFeedback();
  const { saveGuide, saving } = useGuideSave();

  // Wrapper functions for hook handlers
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadFileHook(file, "adoption-guide", "validation");
      setState((s) => ({ ...s, uploadedFile: true }));
      saveWizardStep("validation", {
        checks: state.validationChecks,
        uploaded: true,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.uploadedFile && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (state.uploadedFile || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
    e.target.value = "";
  };

  const handleSubmitFeedback = async (
    feedbackType: string,
    description: string,
    attachment?: File
  ) => {
    await submitFeedbackHook(
      "adoption-guide",
      currentStepId as string,
      feedbackType,
      description,
      attachment
    );
  };

  const hasProgress = useMemo(() => {
    const answers = state.documentNeed as Record<string, string> | null;
    const hasAnswers = !!(answers?.placementType || answers?.childAge || answers?.rulesMet);
    return (
      currentStep > 0 ||
      hasAnswers ||
      state.checkedDocuments.length > 0 ||
      state.validationChecks.length > 0 ||
      state.uploadedFile
    );
  }, [currentStep, state]);

  useEffect(() => {
    if (!session) return;
    if (hasInitializedModal.current) return;
    hasInitializedModal.current = true;

    const localHide =
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_adoption_welcome") === "true";

    if (!session.hide_intro_modal && !localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_adoption_welcome", "true");
    }
    setShowWhatsThis(false);
  };

  useEffect(() => {
    setHighestReachedStep((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  useEffect(() => {
    if (session?.saved) {
      setIsSaved(true);
    }
  }, [session]);

  // Before unload confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const answers = state.documentNeed as Record<string, string> | null;
      const hasAnyInput = !!(answers?.placementType || answers?.childAge || answers?.rulesMet);

      if ((currentStep > 0 || hasAnyInput) && !isSaved) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentStep, state.documentNeed, isSaved]);

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelKey = INFO_PANEL_KEYS[currentStepId as string];
  const infoPanelData = (guideData.wizard.info_panel as any)[
    infoPanelKey
  ] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need": {
        const answers = state.documentNeed as Record<string, string> | null;
        return !!(
          answers?.placementType &&
          answers?.childAge &&
          answers?.rulesMet &&
          answers.childAge !== "over16" &&
          answers.rulesMet !== "no"
        );
      }
      case "roadmap":
        return true;
      case "translation_standards":
        return true;
      case "validation":
        return false;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEP_IDS.length - 1 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Eligibility answer handler
  const handleEligibilitySelect = (qId: string, optId: string) => {
    const prevAnswers = (state.documentNeed as Record<string, string>) || {};
    const newAnswers = { ...prevAnswers, [qId]: optId };
    setState((s) => ({
      ...s,
      documentNeed: newAnswers,
    }));
    saveWizardStep("document_need", JSON.stringify(newAnswers));
  };

  // Document checklist handler
  const handleToggleDoc = (docId: string) => {
    const newDocs = state.checkedDocuments.includes(docId)
      ? state.checkedDocuments.filter((d) => d !== docId)
      : [...state.checkedDocuments, docId];

    setState((s) => ({
      ...s,
      checkedDocuments: newDocs,
    }));
    saveWizardStep("roadmap", { checkedDocuments: newDocs });
  };

  // Validation checks handler
  const handleToggleValidationCheck = (label: string) => {
    const newChecks = state.validationChecks.includes(label)
      ? state.validationChecks.filter((c) => c !== label)
      : [...state.validationChecks, label];

    setState((s) => ({
      ...s,
      validationChecks: newChecks,
    }));
    saveWizardStep("validation", {
      checks: newChecks,
      uploaded: state.uploadedFile,
    });
  };

  const renderStepContent = () => {
    const answers = (state.documentNeed as Record<string, string>) || {};
    const qualifies = answers.childAge === "under16" && answers.rulesMet === "yes";
    const showResults = !!(answers.placementType && answers.childAge && answers.rulesMet);

    switch (currentStepId) {
      case "document_need":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Determine Adoptive Parent Qualification
              </h2>
              <p className="text-sm text-slate-500">
                USCIS applies U.S. law to evaluate guardianships and adoptions from Pakistan.
                Complete these checks to review your eligibility status.
              </p>
            </div>

            {/* Question 1 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
              <h3 className="mb-4 flex items-start gap-2 text-base font-bold text-slate-800">
                <span className="mt-0.5 flex h-6 min-h-6 w-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs leading-none font-bold text-white">
                  1
                </span>

                <span className="flex-1 leading-6">
                  How was the child placed with the parent in Pakistan?
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("placementType", "guardianship")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.placementType === "guardianship"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">Guardianship Court Order</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The child was placed under legal guardianship by a Pakistani court decree.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("placementType", "full_adoption")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.placementType === "full_adoption"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">
                    Full Legal Adoption (Alternative)
                  </span>
                  <span className="text-xs leading-normal text-slate-500">
                    A full legal adoption process was completed under applicable rules.
                  </span>
                </button>
              </div>
            </div>

            {/* Question 2 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
            <h3 className="mb-4 flex items-start gap-2 text-base font-bold text-slate-800">
                <span className="mt-0.5 flex h-6 min-h-6 w-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs leading-none font-bold text-white">
                  2
                </span>

                <span className="flex-1 leading-6">
                How old was the child when this legal relationship was established?
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("childAge", "under16")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.childAge === "under16"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">Under 16 Years Old</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The relationship was legally created before the child's 16th birthday.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("childAge", "over16")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.childAge === "over16"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">16 Years Old or Older</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The relationship was established on or after the child's 16th birthday.
                  </span>
                </button>
              </div>
            </div>

            {/* Question 3 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
            <h3 className="mb-4 flex items-start gap-2 text-base font-bold text-slate-800">
                <span className="mt-0.5 flex h-6 min-h-6 w-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs leading-none font-bold text-white">
                  3
                </span>

                <span className="flex-1 leading-6">
                Have the 2-year legal custody and 2-year co-residence rules been met?
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("rulesMet", "yes")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.rulesMet === "yes"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">
                    Yes, both rules are fully met
                  </span>
                  <span className="text-xs leading-normal text-slate-500">
                    The parent has had legal custody and lived together with the child for at least
                    2 full years.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("rulesMet", "no")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.rulesMet === "no"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">
                    No, one or both rules are unmet
                  </span>
                  <span className="text-xs leading-normal text-slate-500">
                    Custody or co-residence is currently less than 2 years.
                  </span>
                </button>
              </div>
            </div>

            {/* Results alert banner */}
            <AnimatePresence mode="wait">
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {answers.placementType === "guardianship" && (
                    <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-blue-900">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-bold">Pakistan Guardianship Note</span>
                        <span className="opacity-90">
                          Guardianship alone does not automatically qualify as an adoption. USCIS
                          will evaluate the custody decree to determine if U.S. requirements are
                          satisfied.
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex gap-4 rounded-2xl border p-5 ${
                      qualifies
                        ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                        : "border-amber-200 bg-amber-50/40 text-amber-900"
                    }`}
                  >
                    <div className="mt-0.5">
                      {qualifies ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-bold">
                        {qualifies
                          ? "Relationship Generally Qualifies"
                          : "Adoptive Parent Ineligibility"}
                      </span>
                      <span className="text-xs leading-relaxed opacity-90">
                        {qualifies
                          ? "Based on your selections, the adoptive parent-child relationship meets the timing, custody, and residence requirements under U.S. immigration law."
                          : answers.childAge === "over16"
                            ? "Under U.S. immigration law, adoption petitions are ineligible if the adoption was completed after the child turned 16. Because your case does not meet this requirement, the relationship does not qualify, and the continue button has been disabled."
                            : "U.S. immigration law requires the child to have been in the legal custody of and resided with the adoptive parent for at least 2 years. Since these requirements are not met, the relationship does not qualify, and the continue button has been disabled."}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case "roadmap":
        const docList = [
          {
            id: "court_order",
            name: "Court-Issued Adoption or Guardianship Order",
            desc: "The official court document establishing the legal relationship. Upload the guardianship order if your case involves guardianship.",
            required: true,
          },
          {
            id: "custody_docs",
            name: "Legal Custody Documents",
            desc: "Upload court orders, adoption decrees, or guardianship papers showing that the parent has held legal custody for at least 2 years.",
            required: true,
          },
          {
            id: "residence_proof",
            name: "Evidence of Living Together",
            desc: "School records, medical records, household registries, or other official files showing the parent and child lived together for at least 2 years.",
            required: true,
          },
          {
            id: "birth_cert",
            name: "Child's Birth Certificate (If Available)",
            desc: "Submit the child's original birth certificate if available, alongside court records.",
            required: false,
          },
        ];

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Compile Your Documents
              </h2>
              <p className="text-sm text-slate-500">
                You must obtain the following records to substantiate the adoptive parent
                relationship. Check off each document as you acquire it.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {docList.map((doc) => {
                const isChecked = state.checkedDocuments.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleToggleDoc(doc.id)}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                      isChecked
                        ? "border-teal-500/40 bg-teal-50/15"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isChecked
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <span
                          className={`text-sm font-bold ${isChecked ? "text-teal-900" : "text-slate-800"}`}
                        >
                          {doc.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                            doc.required ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {doc.required ? "Required" : "If Available"}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${isChecked ? "text-slate-600" : "text-slate-500"}`}
                      >
                        {doc.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "translation_standards":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Ensure Translation Standards
              </h2>
              <p className="text-sm text-slate-500">
                All foreign-language documents submitted to USCIS must be accompanied by a certified
                English translation following strict statutory guidelines.
              </p>
            </div>

            <div className="flex gap-3 rounded-r-xl border-l-4 border-teal-600 bg-teal-50/40 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
              <p className="text-xs leading-relaxed text-teal-900">
                <strong>CRITICAL RULE:</strong> Do not translate the documents yourself. Even if you
                are bilingual, USCIS requires a third-party certifier to confirm the translation's
                completeness and accuracy.
              </p>
            </div>

            {/* Steps / checklist of translation rules */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  1
                </span>
                <div>
                  <h4 className="mb-0.5 text-sm font-bold text-slate-800">
                    Complete English Translation
                  </h4>
                  <p className="text-xs leading-normal text-slate-500">
                    The translation must map word-for-word to the original layout, including seals,
                    stamps, signatures, and margins.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  2
                </span>
                <div>
                  <h4 className="mb-0.5 text-sm font-bold text-slate-800">
                    Translator Certification Statement
                  </h4>
                  <p className="text-xs leading-normal text-slate-500">
                    A signed statement stating: "I certify that I am competent to translate from
                    [Language] into English, and that the translation is complete and accurate."
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  3
                </span>
                <div>
                  <h4 className="mb-0.5 text-sm font-bold text-slate-800">
                    Translator's Credentials
                  </h4>
                  <p className="text-xs leading-normal text-slate-500">
                    The statement must list the translator's printed name, signature, date, and
                    contact details (phone, email, and address).
                  </p>
                </div>
              </div>
            </div>

            {/* Document Unavailability Info */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h4 className="mb-1 text-sm font-bold text-slate-800">
                If a Required Document Is Unavailable
              </h4>
              <p className="text-xs leading-relaxed text-slate-500">
                If you cannot obtain a required document, try to obtain a written statement from the
                issuing authority confirming it is unavailable. If permitted, provide secondary
                evidence supporting the missing information. USCIS reviews secondary evidence on a
                case-by-case basis.
              </p>
            </div>

            {/* File upload zone simulation */}
            {/* <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {!state.uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-teal-500 bg-teal-50/15"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                      <p className="text-sm font-bold text-teal-900 text-center">
                        Analyzing document format...
                      </p>
                      <p className="text-slate-400 text-xs text-center">
                        Running verification checks
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700 text-center">
                        Upload Document to Validate Format
                      </p>
                      <p className="text-slate-400 text-xs text-center">
                        Supported formats: PDF, JPG, PNG (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-2xl flex items-center gap-4 text-emerald-900"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-bold text-sm">Document Uploaded!</span>
                    <span className="text-xs leading-normal opacity-90">
                      Our vault has successfully run verification checks and flagged no formatting errors.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setState((s) => ({ ...s, uploadedFile: false }))}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Reset
                  </button>
                </motion.div>
              )}
          </div> */}
          </div>
        );

      case "validation":
        const checkItems = [
          "All names are spelled consistently across every document.",
          "Every court document and legal custody order related to the adoption or guardianship is compiled.",
          "Proof of 2-year co-residence (school, medical, or government logs) is attached.",
          "Certified English translations are attached for every foreign-language document.",
        ];

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Review & Finalize
              </h2>
              <p className="text-sm text-slate-500">
                Review our checklists to ensure names, dates, and documentation align with USCIS
                policies.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Final USCIS Checklist
              </span>
              <div className="flex flex-col gap-3">
                {checkItems.map((item, idx) => {
                  const isChecked = state.validationChecks.includes(item);
                  return (
                    <label
                      key={idx}
                      className="flex cursor-pointer items-start gap-3 text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleValidationCheck(item)}
                        className="mt-1 h-4 w-4 cursor-pointer rounded accent-teal-600"
                      />
                      <span className="text-xs leading-relaxed">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 text-red-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-bold">Important Reminder</span>
                <span className="text-xs leading-relaxed opacity-90">
                  Providing these documents does not automatically establish eligibility. USCIS will
                  review your case to determine whether the adoptive parent-child relationship
                  qualifies under U.S. immigration law.
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] pt-14">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col bg-gray-50 pt-26 ${isUrdu ? "font-urdu-body" : ""}`}
    >
      {/* Header */}
      <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} title={guideData.wizard.title} />

      {/* Grid Layout Container matching other guides */}
      <div className="grid h-[calc(100vh-56px)] flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:p-6 xl:h-auto xl:grid-cols-[320px_minmax(0,1fr)_350px] xl:items-start xl:gap-6 xl:overflow-hidden">
        {/* Sidebar */}
        <WizardSidebar
          currentStep={STEP_IDS.indexOf(currentStepId)}
          steps={STEP_IDS}
          onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
          stepLabels={STEP_LABELS}
          guideSlug="adoption-guide"
          onSaveGuide={saveGuide}
          onGuideSaved={() => setIsSaved(true)}
          saving={saving}
          session={session}
          highestReachedStep={highestReachedStep}
        />

        {/* Main Work Area */}
        <main className="relative flex min-w-0 flex-col items-center justify-center p-4 sm:p-6 xl:items-start xl:justify-start xl:overflow-y-auto">
          {/* Subtle grid background pattern */}
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              backgroundImage:
                "linear-gradient(hsl(168 80% 30% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(168 80% 30% / 0.02) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 flex min-h-[500px] w-full flex-col items-center justify-start xl:items-start">
            <div className="w-full max-w-full md:max-w-3xl">
              {/* Active Step Content container card */}
              <div className="flex min-h-[420px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                <div>{renderStepContent()}</div>

                {/* Footer Navigation Buttons */}
                <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                  {currentStep > 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goBack}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden md:inline-block">Back</span>
                    </motion.button>
                  ) : (
                    <div />
                  )}

                  <span className="text-xs font-semibold text-slate-400">
                    Step {currentStep + 1} of {STEP_IDS.length}
                  </span>

                  {currentStep < STEP_IDS.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                        canGoNext()
                          ? "cursor-pointer bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-sm hover:from-teal-700 hover:to-teal-600"
                          : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                      } `}
                    >
                      <span className="hidden md:inline-block">Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Info Panel */}
        <WizardInfoPanel
          data={infoPanelData}
          lastVerified={guideData.wizard.last_verified}
          guideData={guideData as any}
          guideType="other"
        />
      </div>

      {/* Welcome Narrative Modal overlay */}
      <NarrativeModal
        isOpen={showWhatsThis}
        onClose={handleCloseIntro}
        onComplete={handleCloseIntro}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        variant="adoption"
      />

      {/* Navigation Block Guard */}
      <NavigationGuard
        shouldBlock={hasProgress && !isSaved}
        onSave={async () => {
          await saveGuide("adoption-guide");
          setIsSaved(true);
        }}
        navigationHandled={navigationHandled}
        setNavigationHandled={setNavigationHandled}
      />

      {/* Floating Feedback Button */}
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId as string] || ""}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};

export default AdoptionGuidePage;
