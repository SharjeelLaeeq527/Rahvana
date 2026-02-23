"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "./components/guide/WizardHeader";
import WizardSidebar from "./components/guide/WizardSidebar";
import WizardInfoPanel from "./components/guide/WizardInfoPanel";
import WhatsThisModal from "./components/guide/WhatsThisModal";
import DocumentNeedStep from "./components/guide/steps/DocumentNeedStep";
import AgeCategoryStep from "./components/guide/steps/AgeCategoryStep";
import BirthSettingStep from "./components/guide/steps/BirthSettingStep";
import LocationStep from "./components/guide/steps/LocationStep";
import ParentalDetailsStep from "./components/guide/steps/ParentalDetailsStep";
import OfficeFinderStep from "./components/guide/steps/OfficeFinderStep";
import RoadmapStep from "./components/guide/steps/RoadmapStep";
import { type BirthStepId, type BirthWizardState } from "@/types/birth-certificate-wizard";
import guideData from "@/data/birth-certificate-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";

const STEP_IDS: BirthStepId[] = [
  "document_need",
  "age_category",
  "birth_setting",
  "location",
  "parental_details",
  "office_finder",
  "roadmap",
];

const INFO_PANEL_KEYS: Record<BirthStepId, string> = {
  document_need: "document_need",
  age_category: "age_category",
  birth_setting: "birth_setting",
  location: "location",
  parental_details: "parental_details",
  office_finder: "location", // reusing location tips for office finder
  roadmap: "roadmap",
};

const BirthCertificateGuidePage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [state, setState] = useState<BirthWizardState>({
    documentNeed: null,
    timing: null,
    ageCategory: null,
    birthSetting: null,
    province: null,
    district: null,
    city: null,
    parentalStatus: {
      hasCNICs: false,
      hasNikahNama: false,
      isSingleParent: false,
      hasOldRecords: false,
      hasSchoolRecord: false,
      hasResidenceProof: false,
    },
    savedOffice: null,
    checkedDocuments: [],
  });

  useEffect(() => {
    const hide = localStorage.getItem("hideBirthWhatsThis");
    if (!hide) {
      setShowWhatsThis(true);
    }
  }, []);

  const handleDontShowAgain = (val: boolean) => {
    if (val) {
      localStorage.setItem("hideBirthWhatsThis", "true");
    }
  };

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelData =
    (guideData.wizard.info_panel as any)[INFO_PANEL_KEYS[currentStepId]];

  const handleAgeSelect = (category: BirthWizardState['ageCategory']) => {
    let timing: BirthWizardState['timing'] = null;

    if (category === "0-3") timing = "timely";
    else if (category === "3-10") timing = "late";
    else timing = "very_late";

    setState(s => ({ ...s, ageCategory: category, timing }));
  };

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        return !!state.documentNeed;
      case "age_category":
        return !!state.ageCategory;
      case "birth_setting":
        return !!state.birthSetting;
      case "location":
        return !!state.province && !!state.district;
      case "parental_details":
        return true; // Optional selections
      case "office_finder":
        return true; // Optional finding
      case "roadmap":
        return true;
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

  const renderStep = () => {
    switch (currentStepId) {
      case "document_need":
        return (
          <DocumentNeedStep
            selected={state.documentNeed}
            onSelect={(v) => setState((s) => ({ ...s, documentNeed: v }))}
          />
        );
      case "age_category":
        return (
          <AgeCategoryStep
             selectedCategory={state.ageCategory}
             onSelect={(id) => handleAgeSelect(id as any)}
          />
        );
      case "birth_setting":
        return (
          <BirthSettingStep
            selected={state.birthSetting}
            onSelect={(v) => setState((s) => ({ ...s, birthSetting: v }))}
          />
        );
      case "location":
        return (
          <LocationStep
            province={state.province}
            district={state.district}
            city={state.city}
            onProvinceChange={(v) => setState((s) => ({ ...s, province: v, district: null, city: null }))}
            onDistrictChange={(v) => setState((s) => ({ ...s, district: v, city: null }))}
            onCityChange={(v) => setState((s) => ({ ...s, city: v }))}
          />
        );
      case "parental_details":
        return (
          <ParentalDetailsStep
            status={state.parentalStatus}
            onToggle={(key) => setState(s => ({
              ...s,
              parentalStatus: {
                ...s.parentalStatus,
                [key]: !((s.parentalStatus as any)[key])
              }
            }))}
          />
        );
      case "office_finder":
        return (
          <OfficeFinderStep
            location={{ province: state.province, district: state.district }}
            savedOffice={state.savedOffice}
            onSave={(office) => setState(s => ({ ...s, savedOffice: office }))}
          />
        );
      case "roadmap":
        return (
          <RoadmapStep
            birthSetting={state.birthSetting}
            ageCategory={state.ageCategory}
            documentNeed={state.documentNeed}
            timing={state.timing}
            province={state.province}
            district={state.district}
            parentalStatus={state.parentalStatus}
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={(id) => setState(s => ({
              ...s,
              checkedDocuments: s.checkedDocuments.includes(id)
                ? s.checkedDocuments.filter(d => d !== id)
                : [...s.checkedDocuments, id]
            }))}
          />
        );
      default:
        return null;
    }
  };


  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} />

      <div className="flex flex-1 overflow-hidden mt-14">
        {/* Left Sidebar */}
        <WizardSidebar
          currentStep={currentStep}
          steps={STEP_IDS}
          onStepClick={setCurrentStep}
          savedOffice={state.savedOffice}
        />

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto relative px-10 py-8 scroll-smooth">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm min-h-[500px]">
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
            <div className="flex justify-between items-center mt-6 pb-20">
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

export default BirthCertificateGuidePage;
