"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, { InfoPanelData } from "../../../components/guides/WizardInfoPanel";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/step-parent-guide-data.json";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
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

const StepParentGuidePage = () => {
  const { isUrdu } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(
    typeof window !== "undefined" && localStorage.getItem("dont_show_stepparent_welcome") === "true"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [navigationHandled, setNavigationHandled] = useState(false);

  const [state, setState] = useState<WizardState>({
    documentNeed: { legallyRecognized: "", childAge: "" },
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
  const hasInitializedModal = useRef(false);

  const { saveWizardStep, session, loading } = useWizardSession(
    "step-parent-guide",
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
      await uploadFileHook(file, "step-parent-guide", "validation");
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

  const handleSubmitFeedback = async (
    feedbackType: string,
    description: string,
    attachment?: File
  ) => {
    await submitFeedbackHook(
      "step-parent-guide",
      currentStepId as string,
      feedbackType,
      description,
      attachment
    );
  };

  const hasProgress = useMemo(() => {
    const answers = state.documentNeed as Record<string, string> | null;
    const hasAnswers = !!(answers?.legallyRecognized || answers?.childAge);
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
      localStorage.getItem("dont_show_stepparent_welcome") === "true";

    if (!session.hide_intro_modal && !localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_stepparent_welcome", "true");
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
      const hasAnyInput = !!(answers?.legallyRecognized || answers?.childAge);

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
        return !!(answers?.legallyRecognized && answers?.childAge && answers.childAge !== "over18");
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
    const qualifies = answers.legallyRecognized === "yes" && answers.childAge === "under18";
    const showResults = !!(answers.legallyRecognized && answers.childAge);

    switch (currentStepId) {
      case "document_need":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Determine Step-Parent Qualification
              </h2>
              <p className="text-sm text-slate-500">
                USCIS enforces strict conditions on step-parent petitions. Answer the following to
                determine if your relationship qualifies under U.S. immigration law.
              </p>
            </div>

            {/* Question 1 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
              <h3 className="mb-4 flex items-start gap-2 text-base font-bold text-slate-800">
                <span className="mt-0.5 flex h-6 min-h-6 w-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs leading-none font-bold text-white">
                  1
                </span>

                <span className="flex-1 leading-6">
                  Was the marriage between your biological parent and step-parent legally
                  recognized?
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("legallyRecognized", "yes")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.legallyRecognized === "yes"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">Yes, it is legally valid</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The marriage was legally registered and either spouse&apos;s previous marriages
                    legally ended beforehand.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("legallyRecognized", "no")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.legallyRecognized === "no"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">No or Unsure</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The marriage is not legally recognized, or we do not have proof of termination
                    of prior marriages.
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
                  How old was the child when this marriage took place?
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("childAge", "under18")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.childAge === "under18"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">Under 18 Years Old</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The marriage occurred before the child&apos;s 18th birthday.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEligibilitySelect("childAge", "over18")}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                    answers.childAge === "over18"
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800">18 Years Old or Older</span>
                  <span className="text-xs leading-normal text-slate-500">
                    The marriage took place on or after the child&apos;s 18th birthday.
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
                        : "Important Eligibility Note"}
                    </span>
                    <span className="text-xs leading-relaxed opacity-90">
                      {qualifies
                        ? "Based on your selections, the step-parent relationship meets the timing and validity rules under U.S. immigration law. You are ready to compile the required documents on the next step."
                        : answers.childAge === "over18"
                          ? "Under U.S. immigration law, the marriage creating the step-relationship must take place before the child turns 18. Because your case does not meet this timing requirement, the relationship does not qualify, and the continue button has been disabled."
                          : "To qualify, the marriage between the biological parent and the step-parent must be legally recognized, and all prior marriages must have been legally dissolved. Please review your documents before proceeding."}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case "roadmap":
        const docList = [
          {
            id: "child_birth",
            name: "Child's Birth Certificate",
            desc: "The child's birth certificate showing the names of both the child and their biological parent.",
            required: true,
          },
          {
            id: "marriage_cert",
            name: "Marriage Certificate",
            desc: "The marriage certificate showing that your biological parent married your step-parent before you turned 18.",
            required: true,
          },
          {
            id: "prev_marriage",
            name: "Proof That Previous Marriages Ended",
            desc: "If either parent was married before, papers showing how that marriage legally ended (like a divorce decree or death certificate).",
            required: false,
          },
          {
            id: "name_change",
            name: "Name Change Documents",
            desc: "Documents showing name changes (like court orders or marriage certificates) if names differ across your records.",
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
                You must obtain the following records to substantiate the step-parent connection.
                Check off each document as you acquire it.
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
                          {doc.required ? "Required" : "If Applicable"}
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
                are bilingual, USCIS requires a third-party certifier to confirm the
                translation&apos;s completeness and accuracy.
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
                    A signed statement stating: &quot;I certify that I am competent to translate
                    from [Language] into English, and that the translation is complete and
                    accurate.&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  3
                </span>
                <div>
                  <h4 className="mb-0.5 text-sm font-bold text-slate-800">
                    Translator&apos;s Credentials
                  </h4>
                  <p className="text-xs leading-normal text-slate-500">
                    The statement must list the translator&apos;s printed name, signature, date, and
                    contact details (phone, email, and address).
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "validation":
        const checkItems = [
          "Names match exactly across the child's birth certificate, parents' marriage certificate, and petition forms.",
          "Proof of termination for all prior marriages is compiled (if applicable).",
          "Certified English translations are attached for every foreign-language document.",
          "Scan quality is verified-all borders, text, stamps, and signatures are crisp and readable.",
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
                  Submitting these documents does not automatically guarantee petition approval.
                  USCIS officers review the complete file and verify the bona fide nature of the
                  family relationship under 8 CFR § 204.2 before approval.
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
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-[320px_minmax(0,1fr)_350px] xl:items-start xl:gap-6">
        {/* Sidebar */}
        <WizardSidebar
          currentStep={STEP_IDS.indexOf(currentStepId)}
          steps={STEP_IDS}
          onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
          stepLabels={STEP_LABELS}
          guideSlug="step-parent-guide"
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
        variant="step-parent"
      />

      {/* Navigation Block Guard */}
      <NavigationGuard
        shouldBlock={hasProgress && !isSaved}
        onSave={async () => {
          await saveGuide("step-parent-guide");
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

export default StepParentGuidePage;
