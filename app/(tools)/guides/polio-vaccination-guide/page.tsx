"use client";

import React from "react";
import { PolioWizardProvider, usePolioWizard } from "./PolioContext";
import { HelpCircle } from "lucide-react";
import ProgressTree from "./components/ProgressTree";
import ContextPanel from "./components/ContextPanel";
import WelcomeModal from "./components/WelcomeModal";
// import Step0 from "./components/steps/Step0";
import Step1 from "./components/steps/Step1";
import LocationStep from "./components/steps/LocationStep";
import RoadmapStep from "./components/steps/RoadmapStep";
import ValidationStep from "./components/steps/ValidationStep";
function WizardContent() {
  const { state, isMounted, setShowWelcomeModal } = usePolioWizard();

  const renderStep = () => {
    switch (state.currentStep) {
      // case 0:
      //   return <Step0 />;
      case 1:
        return <Step1 />;
      case 2:
        return <LocationStep />;
      case 3:
        return <RoadmapStep />;
      case 4:
        return <ValidationStep />;
      default:
        return <Step1 />;
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-center relative gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-center w-full">
              Polio Vaccination Guide Wizard
            </h1>
            <div className="md:absolute right-0">
              <button
                onClick={() => setShowWelcomeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors shrink-0"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden md:inline">What&apos;s this?</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-180px)]">
          {/* Left Panel - Progress Tree */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full lg:sticky lg:top-24 flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
              <ProgressTree />
            </div>
          </div>

          {/* Center Panel - Current Step */}
          <div className="lg:col-span-5 xl:col-span-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full p-6 md:p-8">
              {renderStep()}
            </div>
          </div>

          {/* Right Panel - Context */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full lg:sticky lg:top-24 flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
              <ContextPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Floating Elements */}
      <WelcomeModal />
    </div>
  );
}

export default function PolioVaccinationGuide() {
  return (
    <PolioWizardProvider>
      <WizardContent />
    </PolioWizardProvider>
  );
}
