"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, {
  InfoPanelData,
} from "../../../components/guides/WizardInfoPanel";
import DocumentNeedStep from "../../../components/guides/steps/DocumentNeedStep";
// import LocationStep from "../../../components/guides/steps/LocationStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import OfficeFinderStep from "../../../components/guides/steps/OfficeFinderStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";
import WhatsThisModal from "../../../components/guides/WhatsThisModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/passport-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";

const STEP_IDS: WizardStepId[] = [
  "document_need",
  // "location",
  "roadmap",
  // "office_finder",
  "validation",
];

const STEP_LABELS: Record<string, string> = {
  document_need: "Application Type",
  // location: "Location",
  roadmap: "Roadmap",
  // office_finder: "Office Finder",
  validation: "Validation",
};

const INFO_PANEL_KEYS: Record<WizardStepId, any> = {
  document_need: "document_need",
  age_category: "document_need",
  birth_setting: "document_need",
  location: "roadmap",
  roadmap: "roadmap",
  office_finder: "roadmap",
  validation: "validation",
};

const PassportGuide = () => {
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

  const { saveWizardStep } = useWizardSession(
    "passport-guide",
    state,
    setState,
    STEP_IDS,
    setCurrentStep,
    (prev, stepsData) => ({
      ...prev,
      documentNeed: stepsData.document_need || prev.documentNeed,
      province: stepsData.location?.province || prev.province,
      district: stepsData.location?.district || prev.district,
      city: stepsData.location?.city || prev.city,
      checkedDocuments: stepsData.roadmap || prev.checkedDocuments,
      validationChecks: stepsData.validation?.checks || prev.validationChecks,
      uploadedFile: stepsData.validation?.uploaded || prev.uploadedFile,
    })
  );

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelKey = INFO_PANEL_KEYS[currentStepId];
  const infoPanelData = (guideData.wizard.info_panel as any)[
    infoPanelKey
  ] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        return !!state.documentNeed;
      // case "location":
      //   return !!state.province && !!state.district && !!state.city;
      case "roadmap":
        return true;
      // case "office_finder":
      //   return true;
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

  const handleDocumentNeedSelect = (id: string) => {
    setState((s: WizardState) => ({ ...s, documentNeed: id }));
    saveWizardStep("document_need", id, true);
    setTimeout(() => setCurrentStep(1), 400);
  };

  const toggleDocument = (id: string) => {
    const newDocs = state.checkedDocuments.includes(id)
      ? state.checkedDocuments.filter((d) => d !== id)
      : [...state.checkedDocuments, id];

    setState((s: WizardState) => ({
      ...s,
      checkedDocuments: newDocs,
    }));
    saveWizardStep("roadmap", newDocs);
  };

  const toggleValidationCheck = (label: string) => {
    const newChecks = state.validationChecks.includes(label)
      ? state.validationChecks.filter((l) => l !== label)
      : [...state.validationChecks, label];

    setState((s: WizardState) => ({
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
      // case "location":
      //   return (
      //     <LocationStep
      //       province={state.province}
      //       district={state.district}
      //       city={state.city}
      //       onProvinceChange={(v) => setState((s) => ({ ...s, province: v }))}
      //       onDistrictChange={(v) => setState((s) => ({ ...s, district: v }))}
      //       onCityChange={(v) => setState((s) => ({ ...s, city: v }))}
      //       data={guideData.wizard.location}
      //     />
      //   );
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
            onUpload={() => {
              setState((s: WizardState) => ({ ...s, uploadedFile: true }));
              saveWizardStep("validation", {
                checks: state.validationChecks,
                uploaded: true,
              });
            }}
            data={guideData.wizard.validation}
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
          stepLabels={STEP_LABELS}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          <div className="fixed inset-0 bg-[linear-gradient(hsl(168_80%_30%/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(168_80%_30%/0.02)_1px,transparent_1px)] bg-size-[48px_48px] pointer-events-none z-0" />

          <div className="relative z-10 max-w-full md:max-w-2xl mx-auto">
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

            <div className="flex flex-col justify-between items-center gap-4 mt-5 pb-6 w-full">
              {currentStep > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goBack}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </motion.button>
              ) : (
                <div />
              )}

              <span className="text-sm text-gray-500 font-medium">
                Step {currentStep + 1} of {STEP_IDS.length}
              </span>

              {currentStep < STEP_IDS.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className={`flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${
                    canGoNext()
                      ? "bg-linear-to-br from-[#14a0a6] to-[#0d7377] text-white shadow-md border-none"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </main>

        <WizardInfoPanel
          data={infoPanelData}
          lastVerified={guideData.wizard.last_verified}
          guideData={guideData}
          guideType="passport"
        />
      </div>

      <WhatsThisModal
        open={showWhatsThis}
        onClose={() => setShowWhatsThis(false)}
        data={guideData.wizard.whats_this}
        documentLabel="Pakistani Passport"
      />
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
      />
    </div>
  );
};

export default PassportGuide;
