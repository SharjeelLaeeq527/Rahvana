import React from 'react';
import { WizardProvider, useWizard } from './context/WizardContext';
import WelcomeModal from './components/WelcomeModal';
import FeedbackButton from './components/FeedbackButton';
import ProgressTree from './components/ProgressTree';
import ContextPanel from './components/ContextPanel';
import Step1 from './components/steps/Step1';
import Step2 from './components/steps/Step2';
import Step3 from './components/steps/Step3';
import Step4 from './components/steps/Step4';
import Step5 from './components/steps/Step5';
import Step6 from './components/steps/Step6';
import { QuestionIcon } from './components/Icons';

function WizardContent() {
  const { state, setShowWelcomeModal } = useWizard();

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <div className="p-8"><Step1 /></div>;
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      case 5:
        return <Step5 />;
      case 6:
        return <Step6 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold">
                Pakistan Birth Certificate (Union Council) – Immigration Wizard
              </h1>
            </div>
            <button
              onClick={() => setShowWelcomeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
            >
              <QuestionIcon className="w-5 h-5" />
              <span className="hidden md:inline">What's this?</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Progress Tree */}
          <div className="lg:col-span-3">
            <div className="panel h-full sticky top-24">
              <ProgressTree />
            </div>
          </div>

          {/* Center Panel - Current Step */}
          <div className="lg:col-span-6">
            <div className="panel h-full overflow-y-auto p-8">
              {renderStep()}
            </div>
          </div>

          {/* Right Panel - Context */}
          <div className="lg:col-span-3">
            <div className="panel h-full sticky top-24">
              <ContextPanel currentStep={state.currentStep} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Floating Elements */}
      <WelcomeModal />
      <FeedbackButton />
    </div>
  );
}

function App() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}

export default App;
