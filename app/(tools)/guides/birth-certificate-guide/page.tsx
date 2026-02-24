"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, {
  InfoPanelData,
} from "../../../components/guides/WizardInfoPanel";
import DocumentNeedStep from "../../../components/guides/steps/DocumentNeedStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";
import WhatsThisModal from "../../../components/guides/WhatsThisModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/birth-certificate-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FeedbackButton from "@/app/components/FeedbackButton";
import { useAuth } from "@/app/context/AuthContext";
import { useGuideSession } from "@/lib/guides/useGuideSession";

const STEP_IDS: WizardStepId[] = [
  "document_need",
  "age_category",
  "birth_setting",
  "roadmap",
  "validation",
];

const STEP_LABELS: Record<string, string> = {
  document_need: "Requirement",
  age_category: "Age Group",
  birth_setting: "Birth Setting",
  roadmap: "Roadmap",
  validation: "Validation",
};

const INFO_PANEL_KEYS: Record<
  WizardStepId,
  keyof typeof guideData.wizard.info_panel
> = {
  document_need: "document_need",
  age_category: "age_category",
  birth_setting: "birth_setting",
  roadmap: "roadmap",
  validation: "validation",
} as any;

const BirthCertificateGuidePage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(true);
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

  const [hasLoaded, setHasLoaded] = useState(false);

  const { user } = useAuth();
  const { session, stepsData, startSession, saveStep, loading } = useGuideSession("birth-certificate-guide");

  // Load backend data into state
  useEffect(() => {
    if (stepsData && Object.keys(stepsData).length > 0 && !hasLoaded) {
      setState((prev) => ({
        ...prev,
        documentNeed: stepsData.document_need || prev.documentNeed,
        ageCategory: stepsData.age_category || prev.ageCategory,
        birthSetting: stepsData.birth_setting || prev.birthSetting,
        checkedDocuments: stepsData.roadmap?.checkedDocuments || prev.checkedDocuments,
        validationChecks: stepsData.validation?.checks || prev.validationChecks,
        uploadedFile: stepsData.validation?.uploaded || prev.uploadedFile,
      }));

      // Set current step if available in session
      if (session?.current_step_key) {
        const stepIndex = STEP_IDS.indexOf(session.current_step_key as WizardStepId);
        if (stepIndex !== -1) {
          setCurrentStep(stepIndex);
        }
      }
      setHasLoaded(true);
    }
  }, [stepsData, session, hasLoaded]);

  // Sync state to backend
  useEffect(() => {
    if (user && !session && !loading) {
      startSession();
    }
  }, [user, session, loading, startSession]);

  useEffect(() => {
    const dontShow = localStorage.getItem("hideBirthWhatsThis_v3");
    if (!dontShow) setShowWhatsThis(true);
  }, []);

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelKey = INFO_PANEL_KEYS[currentStepId as WizardStepId];
  const infoPanelData = (guideData.wizard.info_panel as any)[infoPanelKey] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        return !!state.documentNeed;
      case "age_category":
        return !!state.ageCategory;
      case "birth_setting":
        return !!state.birthSetting;
      case "roadmap":
        return true;
      case "validation":
        return false;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEP_IDS.length - 1 && canGoNext())
      setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSelectionSelect = (id: string, stepId: string) => {
    if (stepId === "document_need") setState(s => ({ ...s, documentNeed: id }));
    if (stepId === "age_category") setState(s => ({ ...s, ageCategory: id }));
    if (stepId === "birth_setting") setState(s => ({ ...s, birthSetting: id }));
    
    // Save progress to backend if authenticated
    if (user && session) {
      const stepIdx = STEP_IDS.indexOf(stepId as WizardStepId);
      const progressPercent = Math.round(((stepIdx + 1) / STEP_IDS.length) * 100);
      saveStep(stepId, id, true, progressPercent);
    }

    setTimeout(() => {
      if (currentStep < STEP_IDS.length - 1) setCurrentStep(currentStep + 1);
    }, 400);
  };

  const toggleDocument = (id: string) => {
    const newState = state.checkedDocuments.includes(id)
      ? state.checkedDocuments.filter((d) => d !== id)
      : [...state.checkedDocuments, id];

    setState((s) => ({
      ...s,
      checkedDocuments: newState,
    }));

    if (user && session) {
      const progressPercent = Math.round(((STEP_IDS.indexOf("roadmap") + 1) / STEP_IDS.length) * 100);
      saveStep("roadmap", { checkedDocuments: newState }, false, progressPercent);
    }
  };

  const toggleValidationCheck = (label: string) => {
    const newState = state.validationChecks.includes(label)
      ? state.validationChecks.filter((l) => l !== label)
      : [...state.validationChecks, label];

    setState((s) => ({
      ...s,
      validationChecks: newState,
    }));

    if (user && session) {
      const progressPercent = Math.round(((STEP_IDS.indexOf("validation") + 1) / STEP_IDS.length) * 100);
      saveStep("validation", { 
        checks: newState,
        uploaded: state.uploadedFile 
      }, false, progressPercent);
    }
  };

  const renderStep = () => {
    switch (currentStepId) {
      case "document_need":
        return (
          <DocumentNeedStep
            selected={state.documentNeed}
            onSelect={(id) => handleSelectionSelect(id, "document_need")}
            data={guideData.wizard.document_need}
          />
        );
      case "age_category":
        return (
          <DocumentNeedStep
            selected={state.ageCategory}
            onSelect={(id) => handleSelectionSelect(id, "age_category")}
            data={guideData.wizard.age_category}
          />
        );
      case "birth_setting":
        return (
          <DocumentNeedStep
            selected={state.birthSetting}
            onSelect={(id) => handleSelectionSelect(id, "birth_setting")}
            data={guideData.wizard.birth_setting}
          />
        );
      case "roadmap":
        return (
          <RoadmapStep
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
            data={guideData.wizard.roadmap as any}
          />
        );
      case "validation":
        return (
          <ValidationStep
            validationChecks={state.validationChecks}
            onToggleCheck={toggleValidationCheck}
            uploadedFile={state.uploadedFile}
            onUpload={() => {
              setState((s) => ({ ...s, uploadedFile: true }));
              if (user && session) {
                const progressPercent = Math.round(((STEP_IDS.indexOf("validation") + 1) / STEP_IDS.length) * 100);
                saveStep("validation", { 
                  checks: state.validationChecks,
                  uploaded: true 
                }, false, progressPercent);
              }
            }}
            data={guideData.wizard.validation as any}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa] pt-14">
      <WizardHeader
        onWhatsThis={() => setShowWhatsThis(true)}
        title={guideData.wizard.title}
      />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)] flex-col lg:flex-row">
        <WizardSidebar
          currentStep={currentStep}
          steps={STEP_IDS}
          onStepClick={setCurrentStep}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(hsl(168 80% 30% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(168 80% 30% / 0.02) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 max-w-full md:max-w-3xl mx-auto">
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

            <div className="flex flex-col justify-between items-center gap-4 mt-5 pb-6 w-full sm:flex-row">
              {currentStep > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </motion.button>
              ) : (
                <div className="hidden sm:block w-20" />
              )}

              <span className="text-sm text-gray-500 font-medium">
                Step {currentStep + 1} of {STEP_IDS.length}
              </span>

              {currentStep < STEP_IDS.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer
                    ${
                      canGoNext()
                        ? "bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <div className="hidden sm:block w-20" />
              )}
            </div>
          </div>
        </main>

        <WizardInfoPanel
          data={infoPanelData}
          lastVerified={guideData.wizard.last_verified}
          guideData={guideData}
          guideType="other"
        />
      </div>

      <WhatsThisModal
        open={showWhatsThis}
        onClose={() => {
          setShowWhatsThis(false);
          localStorage.setItem("hideBirthWhatsThis_v3", "true");
        }}
        data={guideData.wizard.whats_this}
        documentLabel="Birth Certificate"
      />
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
      />
    </div>
  );
};

export default BirthCertificateGuidePage;