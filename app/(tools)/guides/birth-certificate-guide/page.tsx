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
import { ArrowLeft, ArrowRight, Save, Play, Loader2 } from "lucide-react";
import { useGuideSession } from "@/lib/guides/useGuideSession";

const STEP_IDS: BirthStepId[] = [
  "document_need",
  "age_category",
  "birth_setting",
  "location",
  "office_finder",
  "roadmap",
];

const INFO_PANEL_KEYS: Record<BirthStepId, string> = {
  document_need: "document_need",
  age_category: "age_category",
  birth_setting: "birth_setting",
  location: "location",
  office_finder: "location", // reusing location tips for office finder
  roadmap: "roadmap",
};

const BirthCertificateGuidePage = () => {
  const { session, stepsData, loading, saving, startSession, saveStep } = useGuideSession("birth-certificate-guide");
  
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

  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate state from session when loaded
  useEffect(() => {
    if (!hasHydrated && stepsData && Object.keys(stepsData).length > 0) {
      // Merge all step data into a single state object
      const hydratedState = { ...state };
      Object.keys(stepsData).forEach(key => {
        const data = stepsData[key];
        if (key === 'document_need') hydratedState.documentNeed = data.documentNeed;
        if (key === 'age_category') {
          hydratedState.ageCategory = data.ageCategory;
          hydratedState.timing = data.timing;
        }
        if (key === 'birth_setting') hydratedState.birthSetting = data.birthSetting;
        if (key === 'location') {
          hydratedState.province = data.province;
          hydratedState.district = data.district;
          hydratedState.city = data.city;
        }
        if (key === 'parental_details') hydratedState.parentalStatus = data.parentalStatus;
        if (key === 'office_finder') hydratedState.savedOffice = data.savedOffice;
        if (key === 'roadmap') hydratedState.checkedDocuments = data.checkedDocuments;
      });
      setState(hydratedState);
      
      // Also set current step if session has it
      if (session?.current_step_key) {
        const stepIndex = STEP_IDS.indexOf(session.current_step_key as any);
        if (stepIndex !== -1) setCurrentStep(stepIndex);
      }
      setHasHydrated(true);
    }
  }, [stepsData, session?.id, hasHydrated]);

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

    const newState = { ...state, ageCategory: category, timing };
    setState(newState);
    if (session) {
      saveStep("age_category", { ageCategory: category, timing }, true);
    }
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
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Auto-save current step progress when moving forward
      if (session) {
        const progress = Math.round(((nextStep) / (STEP_IDS.length - 1)) * 100);
        saveStep(currentStepId, getCurrentStepPayload(currentStepId), true, progress);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const getCurrentStepPayload = (stepId: BirthStepId) => {
    switch (stepId) {
      case "document_need": return { documentNeed: state.documentNeed };
      case "age_category": return { ageCategory: state.ageCategory, timing: state.timing };
      case "birth_setting": return { birthSetting: state.birthSetting };
      case "location": return { province: state.province, district: state.district, city: state.city };
      case "office_finder": return { savedOffice: state.savedOffice };
      case "roadmap": return { checkedDocuments: state.checkedDocuments };
      default: return {};
    }
  };

  const renderStep = () => {
    switch (currentStepId) {
      case "document_need":
        return (
          <DocumentNeedStep
            selected={state.documentNeed}
            onSelect={(v) => {
              setState((s) => ({ ...s, documentNeed: v }));
              if (session) saveStep("document_need", { documentNeed: v }, true);
            }}
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
            onSelect={(v) => {
              setState((s) => ({ ...s, birthSetting: v }));
              if (session) saveStep("birth_setting", { birthSetting: v }, true);
            }}
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
      case "office_finder":
        return (
          <OfficeFinderStep
            location={{ province: state.province, district: state.district }}
            savedOffice={state.savedOffice}
            onSave={(office) => {
              setState(s => ({ ...s, savedOffice: office }));
              if (session) saveStep("office_finder", { savedOffice: office }, true);
            }}
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
            onToggleDocument={(id) => setState(s => {
              const newDocs = s.checkedDocuments.includes(id)
                ? s.checkedDocuments.filter(d => d !== id)
                : [...s.checkedDocuments, id];
              if (session) saveStep("roadmap", { checkedDocuments: newDocs }, true);
              return { ...s, checkedDocuments: newDocs };
            })}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

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
            {/* Guide Session Banner */}
            {!session && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-teal-100 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div>
                  <h3 className="text-xl font-bold mb-1">Save Your Progress</h3>
                  <p className="text-teal-50 text-sm opacity-90">Sign in and start a secure session to save your roadmap and documents for later.</p>
                </div>
                <button 
                  onClick={startSession}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white text-teal-700 rounded-2xl font-black text-sm hover:bg-teal-50 transition-all shadow-lg shadow-teal-900/20 whitespace-nowrap"
                >
                  <Play size={18} fill="currentColor" />
                  Start Secure Session
                </button>
              </motion.div>
            )}

            {session && (
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700">
                    <Save size={14} className={saving ? "animate-bounce" : ""} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Session Active</p>
                    <p className="text-xs font-bold text-slate-700">{saving ? "Saving progress..." : `Progress: ${session.progress_percent}% Saved`}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm min-h-[500px] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / STEP_IDS.length) * 100}%` }}
                    className="h-full bg-teal-500"
                 />
              </div>
              
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
