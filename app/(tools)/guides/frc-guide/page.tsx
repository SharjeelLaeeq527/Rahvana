"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, { InfoPanelData } from "../../../components/guides/WizardInfoPanel";
import DocumentNeedStep from "../../../components/guides/steps/DocumentNeedStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/frc-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Loader } from "@/components/ui/spinner";

import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { NavigationGuard } from "@/lib/guides/useNavigationGuard";

const STEP_IDS: WizardStepId[] = ["document_need", "roadmap", "validation"];

const STEP_LABELS: Record<string, string> = {
  document_need: "Application Type",
  roadmap: "Roadmap",
  validation: "Validation",
};

const INFO_PANEL_KEYS: Record<string, keyof typeof guideData.wizard.info_panel> = {
  document_need: "document_need",
  roadmap: "roadmap",
  validation: "validation",
};

const FrcGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(
    typeof window !== "undefined" && localStorage.getItem("dont_show_frc_welcome") === "true"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [navigationHandled, setNavigationHandled] = useState(false);
  const [state, setState] = useState<WizardState>({
    documentNeed: null,
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

  const hasInitializedModal = useRef(false);

  const { saveWizardStep, session, loading } = useWizardSession(
    "frc-guide",
    state,
    setState,
    STEP_IDS,
    setCurrentStep,
    (prev, stepsData) => ({
      documentNeed: stepsData.document_need || prev.documentNeed,
      ageCategory: prev.ageCategory, // Not used in FRC guide
      birthSetting: prev.birthSetting, // Not used in FRC guide
      province: stepsData.location?.province || prev.province,
      district: stepsData.location?.district || prev.district,
      city: stepsData.location?.city || prev.city,
      checkedDocuments: stepsData.roadmap || prev.checkedDocuments,
      validationChecks: stepsData.validation?.checks || prev.validationChecks,
      uploadedFile: stepsData.validation?.uploaded || prev.uploadedFile,
      savedOffice: prev.savedOffice, // Not used in FRC guide
    })
  );

  const { uploadFile: uploadFileHook } = useGuideUpload();
  const { submitFeedback: submitFeedbackHook } = useGuideFeedback();
  const { saveGuide, saving } = useGuideSave();

  // Wrapper functions to match expected signatures
  const handleUploadFile = async (file: File) => {
    await uploadFileHook(file, "frc-guide", "validation");
    // Update local state to reflect the upload
    setState((s) => ({ ...s, uploadedFile: true }));
    saveWizardStep("validation", {
      checks: state.validationChecks,
      uploaded: true,
    });
  };

  const handleSubmitFeedback = async (
    feedbackType: string,
    description: string,
    attachment?: File
  ) => {
    await submitFeedbackHook("frc-guide", currentStepId, feedbackType, description, attachment);
  };

  const hasProgress = useMemo(() => {
    return (
      currentStep > 0 ||
      !!state.documentNeed ||
      state.checkedDocuments.length > 0 ||
      state.validationChecks.length > 0 ||
      state.uploadedFile
    );
  }, [currentStep, state]);

  useEffect(() => {
    if (!session) return;

    // Only run once per page load
    if (hasInitializedModal.current) return;

    hasInitializedModal.current = true;

    const localHide =
      typeof window !== "undefined" && localStorage.getItem("dont_show_frc_welcome") === "true";

    if (!session.hide_intro_modal && !localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_frc_welcome", "true");
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

  // Navigation guard handled by NavigationGuard component in render

  // Before unload confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show confirmation if user has made progress beyond the first step
      if (currentStep > 0 || (state.documentNeed && state.documentNeed !== "")) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentStep, state.documentNeed]);

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelKey = INFO_PANEL_KEYS[currentStepId];
  const infoPanelData = guideData.wizard.info_panel[infoPanelKey] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        return !!state.documentNeed;
      case "roadmap":
        return true;
      case "validation":
        return false;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEP_IDS.length - 1 && canGoNext()) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleDocumentNeedSelect = (id: string) => {
    setState((s) => ({ ...s, documentNeed: id }));
    saveWizardStep("document_need", id, true);
  };

  const toggleDocument = (id: string) => {
    const newChecked = state.checkedDocuments.includes(id)
      ? state.checkedDocuments.filter((d) => d !== id)
      : [...state.checkedDocuments, id];
    setState((s) => ({
      ...s,
      checkedDocuments: newChecked,
    }));
    saveWizardStep("roadmap", newChecked);
  };

  const toggleValidationCheck = (label: string) => {
    const newChecks = state.validationChecks.includes(label)
      ? state.validationChecks.filter((l) => l !== label)
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

  const renderStep = () => {
    switch (currentStepId) {
      case "document_need":
        return (
          <DocumentNeedStep
            selected={state.documentNeed}
            onSelect={handleDocumentNeedSelect}
            data={guideData.wizard.document_need}
          />
        );
      case "roadmap":
        return (
          <RoadmapStep
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
            data={guideData.wizard.roadmap}
          />
        );
      case "validation":
        return (
          <ValidationStep
            validationChecks={state.validationChecks}
            onToggleCheck={toggleValidationCheck}
            uploadedFile={state.uploadedFile}
            onUpload={handleUploadFile}
            data={guideData.wizard.validation}
          />
        );
      default:
        return null;
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] pt-14">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa] pt-26">
      <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} title={guideData.wizard.title} />

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto xl:overflow-hidden h-[calc(100vh-56px)] xl:h-auto xl:grid-cols-[320px_minmax(0,1fr)_350px] xl:gap-6 xl:items-start">
        <WizardSidebar
          currentStep={STEP_IDS.indexOf(currentStepId)}
          steps={STEP_IDS}
          onStepClick={handleStepClick}
          stepLabels={STEP_LABELS}
          guideSlug="frc-guide"
          onSaveGuide={saveGuide}
          onGuideSaved={() => setIsSaved(true)}
          saving={saving}
          session={session}
          highestReachedStep={highestReachedStep}
        />

        <main className="min-w-0 xl:overflow-y-auto p-4 sm:p-8 relative flex flex-col xl:items-start items-center xl:justify-start justify-center">
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(hsl(168 80% 30% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(168 80% 30% / 0.02) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="w-full flex flex-col xl:items-start items-center min-h-137.5 xl:min-h-137.5 justify-center">
            <div className="relative z-10 w-full max-w-full md:max-w-3xl">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 shadow-sm min-h-100">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5 pb-6 w-full">
                {/* Back Button */}
                {currentStep > 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </motion.button>
                ) : (
                  <div className="hidden sm:block w-20" />
                )}

                {/* Step Indicator */}
                <span className="text-sm text-gray-500 font-medium">
                  Step {currentStep + 1} of {STEP_IDS.length}
                </span>

                {/* Continue Button */}
                {currentStep < STEP_IDS.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={goNext}
                    disabled={!canGoNext()}
                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition
        ${
          canGoNext()
            ? "bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-md"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <div className="hidden sm:block w-20" />
                )}
              </div>
            </div>
          </div>
        </main>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <WizardInfoPanel
            data={infoPanelData}
            lastVerified={guideData.wizard.last_verified}
            guideData={guideData as Record<string, unknown>}
            guideType="frc"
          />
        </div>
      </div>

      <NarrativeModal
        isOpen={showWhatsThis}
        onClose={handleCloseIntro}
        onComplete={handleCloseIntro}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        variant="frc"
      />
      <NavigationGuard
        shouldBlock={hasProgress && !isSaved}
        onSave={async () => {
          await saveGuide("frc-guide");
          setIsSaved(true);
        }}
        navigationHandled={navigationHandled}
        setNavigationHandled={setNavigationHandled}
      />
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};

export default FrcGuide;
