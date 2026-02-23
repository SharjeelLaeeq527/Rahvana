"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "./components/guide/WizardHeader";
import WizardSidebar from "./components/guide/WizardSidebar";
import WizardInfoPanel from "./components/guide/WizardInfoPanel";
import WhatsThisModal from "./components/guide/WhatsThisModal";
import CaseTypeStep from "./components/guide/steps/CaseTypeStep";
import LocationStep from "./components/guide/steps/LocationStep";
import RoadmapStep from "./components/guide/steps/RoadmapStep";
import OfficeFinderStep from "./components/guide/steps/OfficeFinderStep";
import ValidationStep from "./components/guide/steps/ValidationStep";
import { type NikahStepId, type NikahWizardState } from "@/types/nikah-nama-wizard";
import guideData from "@/data/nikah-nama-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";

const STEP_IDS: NikahStepId[] = [
  "case_type",
  "location",
  "roadmap",
  "office_finder",
  "validation",
];

const INFO_PANEL_KEYS: Record<
  NikahStepId,
  keyof typeof guideData.wizard.info_panel
> = {
  case_type: "case_type",
  location: "location",
  roadmap: "roadmap",
  office_finder: "office_finder",
  validation: "validation",
};

const NikahNamaGuidePage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [state, setState] = useState<NikahWizardState>({
    caseType: null,
    province: null,
    district: null,
    city: null,
    checkedDocuments: [],
    validationChecks: [],
    uploadedFile: false,
  });

  useEffect(() => {
    const hide = localStorage.getItem("hideNikahWhatsThis");
    if (!hide) {
      setShowWhatsThis(true);
    }
  }, []);

  const handleDontShowAgain = (val: boolean) => {
    if (val) {
      localStorage.setItem("hideNikahWhatsThis", "true");
    }
  };

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelData =
    guideData.wizard.info_panel[INFO_PANEL_KEYS[currentStepId] as keyof typeof guideData.wizard.info_panel];

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "case_type":
        return !!state.caseType;
      case "location":
        return !!state.province && !!state.district && !!state.city;
      case "roadmap":
        return true;
      case "office_finder":
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
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const toggleDocument = (id: string) => {
    setState((s) => ({
      ...s,
      checkedDocuments: s.checkedDocuments.includes(id)
        ? s.checkedDocuments.filter((d) => d !== id)
        : [...s.checkedDocuments, id],
    }));
  };

  const toggleValidationCheck = (label: string) => {
    setState((s) => ({
      ...s,
      validationChecks: s.validationChecks.includes(label)
        ? s.validationChecks.filter((l) => l !== label)
        : [...s.validationChecks, label],
    }));
  };

  const renderStep = () => {
    switch (currentStepId) {
      case "case_type":
        return (
          <CaseTypeStep
            selected={state.caseType}
            onSelect={(v) => setState((s) => ({ ...s, caseType: v }))}
          />
        );
      case "location":
        return (
          <LocationStep
            province={state.province}
            district={state.district}
            city={state.city}
            onProvinceChange={(v) => setState((s) => ({ ...s, province: v }))}
            onDistrictChange={(v) => setState((s) => ({ ...s, district: v }))}
            onCityChange={(v) => setState((s) => ({ ...s, city: v }))}
          />
        );
      case "roadmap":
        return (
          <RoadmapStep
            caseType={state.caseType}
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
          />
        );
      case "office_finder":
        return (
          <OfficeFinderStep
            province={state.province}
            district={state.district}
          />
        );
      case "validation":
        return (
          <ValidationStep
            validationChecks={state.validationChecks}
            onToggleCheck={toggleValidationCheck}
            uploadedFile={state.uploadedFile}
            onUpload={() => setState((s) => ({ ...s, uploadedFile: true }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-14 flex flex-col bg-slate-50 font-sans">
      <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
        {/* Left Sidebar */}
        <WizardSidebar
          currentStep={currentStep}
          steps={STEP_IDS}
          onStepClick={setCurrentStep}
        />

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto relative px-10 py-8">
          {/* Grid background */}
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(13,115,119,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(13,115,119,0.02) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Wizard Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm min-h-120">
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

            {/* Navigation Footer */}
            <div className="flex justify-between items-center mt-6 pb-8">
              {currentStep > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-bold cursor-pointer font-['Plus_Jakarta_Sans',system-ui]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>
              ) : (
                <div />
              )}

              <span className="text-sm text-slate-400 font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans',system-ui]">
                Step {currentStep + 1} of {STEP_IDS.length}
              </span>

              {currentStep < STEP_IDS.length - 1 && (
                <motion.button
                  whileHover={{ scale: canGoNext() ? 1.03 : 1 }}
                  whileTap={{ scale: canGoNext() ? 0.97 : 1 }}
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className={`flex items-center gap-1.5 px-8 py-3 rounded-xl text-sm font-bold shadow-md transition font-['Plus_Jakarta_Sans',system-ui]
                    ${
                      canGoNext()
                        ? "bg-teal-600 text-white cursor-pointer hover:bg-teal-700"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    }
                  `}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </main>

        {/* Right Info Panel */}
        <WizardInfoPanel
          data={infoPanelData as any}
          lastVerified={guideData.wizard.last_verified}
        />
      </div>

      <WhatsThisModal
        open={showWhatsThis}
        onClose={() => setShowWhatsThis(false)}
        onDontShowAgain={handleDontShowAgain}
      />
    </div>
  );
};

export default NikahNamaGuidePage;
