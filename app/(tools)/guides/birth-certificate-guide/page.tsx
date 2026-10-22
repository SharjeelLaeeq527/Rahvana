"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, { InfoPanelData } from "../../../components/guides/WizardInfoPanel";
import DocumentNeedStep from "../../../components/guides/steps/DocumentNeedStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { StandaloneAccessGate } from "@/app/components/wallet/StandaloneAccessGate";
import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { NavigationGuard } from "@/lib/guides/useNavigationGuard";
import { useLanguage } from "@/app/context/LanguageContext";

const STEP_IDS: WizardStepId[] = ["document_need", "roadmap", "validation"];

const BirthCertificateGuidePage = () => {
  const { t, tRaw, isUrdu } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem("dont_show_birth_certificate_welcome") === "true"
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
    "birth-certificate-guide",
    state,
    setState,
    STEP_IDS,
    setCurrentStep,
    (prev, stepsData) => ({
      ...prev,
      documentNeed: stepsData.document_need || prev.documentNeed,
      checkedDocuments: stepsData.roadmap?.checkedDocuments || prev.checkedDocuments,
      validationChecks: stepsData.validation?.checks || prev.validationChecks,
      uploadedFile: stepsData.validation?.uploaded || prev.uploadedFile,
    })
  );

  const { uploadFile: uploadFileHook } = useGuideUpload();
  const { submitFeedback: submitFeedbackHook } = useGuideFeedback();
  const { saveGuide, saving } = useGuideSave();

  // Wrapper functions to match expected signatures
  const handleUploadFile = async (file: File) => {
    await uploadFileHook(file, "birth-certificate-guide", "validation");
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
    await submitFeedbackHook(
      "birth-certificate-guide",
      currentStepId,
      feedbackType,
      description,
      attachment
    );
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
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_birth_certificate_welcome") === "true";

    if (!session.hide_intro_modal && !localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_birth_certificate_welcome", "true");
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
      const hasAnyInput =
        typeof state.documentNeed === "object" && state.documentNeed !== null
          ? Object.keys(state.documentNeed).length > 0
          : !!state.documentNeed;

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
  const localizedBirthCertData = tRaw("birthCertificate");
  const wizardData = localizedBirthCertData.wizard;

  const infoPanelData = (wizardData.infoPanel as any)?.[currentStepId] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        if (wizardData.documentNeed?.questions) {
          const numQuestions = Object.keys(wizardData.documentNeed.questions).length;
          const answers = state.documentNeed;
          if (typeof answers === "object" && answers !== null) {
            return Object.keys(answers).length === numQuestions;
          }
          return false;
        }
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

  const handleDocumentNeedSelect = (id: string, questionId?: string) => {
    if (questionId) {
      setState((s) => ({
        ...s,
        documentNeed: {
          ...(typeof s.documentNeed === "object" && s.documentNeed !== null ? s.documentNeed : {}),
          [questionId]: id,
        },
      }));
      // Save progress to backend
      saveWizardStep("document_need", {
        ...(typeof state.documentNeed === "object" && state.documentNeed !== null
          ? state.documentNeed
          : {}),
        [questionId]: id,
      });
    } else {
      setState((s: WizardState) => ({ ...s, documentNeed: id }));
      saveWizardStep("document_need", id, true);
    }
  };

  const toggleDocument = (id: string) => {
    const newState = state.checkedDocuments.includes(id)
      ? state.checkedDocuments.filter((d) => d !== id)
      : [...state.checkedDocuments, id];

    setState((s: WizardState) => ({
      ...s,
      checkedDocuments: newState,
    }));

    // Save progress to backend
    saveWizardStep("roadmap", { checkedDocuments: newState });
  };

  const toggleValidationCheck = (label: string) => {
    const newState = state.validationChecks.includes(label)
      ? state.validationChecks.filter((l) => l !== label)
      : [...state.validationChecks, label];

    setState((s: WizardState) => ({
      ...s,
      validationChecks: newState,
    }));

    // Save progress to backend
    saveWizardStep("validation", {
      checks: newState,
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
            data={wizardData.documentNeed as any}
            onNext={goNext}
          />
        );
      case "roadmap":
        return (
          <RoadmapStep
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
            data={wizardData.roadmap as any}
          />
        );
      case "validation":
        return (
          <ValidationStep
            validationChecks={state.validationChecks}
            onToggleCheck={toggleValidationCheck}
            uploadedFile={state.uploadedFile}
            onUpload={handleUploadFile}
            data={wizardData.validation as any}
          />
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
    <StandaloneAccessGate
      feature="guide_birth_cert"
      resourceType="guide"
      resourceId="guide-birth-cert"
      title="Birth Certificate Guide Locked"
      description="Unlock step-by-step guidance on obtaining your birth certificate — with wallet credits or a plan upgrade."
    >
      <div
        className={`flex min-h-screen flex-col bg-[#f5f7fa] pt-26 ${isUrdu ? "font-urdu-body" : ""}`}
        dir={isUrdu ? "rtl" : "ltr"}
      >
        <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} title={wizardData.title} />

        <div className="grid h-[calc(100vh-56px)] flex-1 grid-cols-1 gap-4 overflow-y-auto xl:h-auto xl:grid-cols-[320px_minmax(0,1fr)_350px] xl:items-start xl:gap-6 xl:overflow-hidden">
          <WizardSidebar
            currentStep={STEP_IDS.indexOf(currentStepId)}
            steps={STEP_IDS}
            onStepClick={(index) => setCurrentStep(index)}
            stepLabels={{
              document_need: t("wizard.common.applicationType"),
              roadmap: t("wizard.common.roadmap"),
              validation: t("wizard.common.validation"),
            }}
            guideSlug="birth-certificate-guide"
            onSaveGuide={saveGuide}
            onGuideSaved={() => setIsSaved(true)}
            saving={saving}
            session={session}
            highestReachedStep={highestReachedStep}
          />

          <main className="relative flex min-w-0 flex-col items-center justify-center p-4 sm:p-8 xl:items-start xl:justify-start xl:overflow-y-auto">
            <div
              className="pointer-events-none fixed inset-0 z-0"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(168 80% 30% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(168 80% 30% / 0.02) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            <div className="flex min-h-137.5 w-full flex-col items-center justify-center xl:min-h-137.5 xl:items-start">
              <div className="relative z-10 w-full max-w-full md:max-w-3xl">
                <div className="min-h-100 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-8">
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

                <div className="mt-5 flex w-full items-center justify-between gap-4 pb-6 sm:flex-row">
                  {currentStep > 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={goBack}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 ${isUrdu ? "font-urdu-body" : ""}`}
                    >
                      <ArrowLeft className={`h-4 w-4 ${isUrdu ? "rotate-180" : ""}`} />{" "}
                      <span className="hidden md:inline-block">{t("wizard.common.back")}</span>
                    </motion.button>
                  ) : (
                    <div className="hidden w-20 sm:block" />
                  )}

                  <span
                    className={`text-sm font-medium text-gray-500 ${isUrdu ? "font-urdu-body" : ""}`}
                  >
                    {t("wizard.common.stepProgress", {
                      current: currentStep + 1,
                      total: STEP_IDS.length,
                    })}
                  </span>

                  {currentStep < STEP_IDS.length - 1 &&
                    !(
                      currentStepId === "document_need" &&
                      wizardData.documentNeed.questions &&
                      Object.keys(wizardData.documentNeed.questions).length > 1
                    ) && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={goNext}
                        disabled={!canGoNext()}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                          canGoNext()
                            ? "bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-md"
                            : "cursor-not-allowed bg-gray-200 text-gray-400"
                        } ${isUrdu ? "font-urdu-body" : ""} `}
                      >
                        <span className="hidden md:inline-block">
                          {t("wizard.common.continue")}
                        </span>
                        <ArrowRight className={`h-4 w-4 ${isUrdu ? "rotate-180" : ""}`} />
                      </motion.button>
                    )}
                </div>
              </div>
            </div>
          </main>

          <WizardInfoPanel
            data={infoPanelData}
            lastVerified={wizardData.lastVerifiedDate}
            guideData={localizedBirthCertData as any}
            guideType="other"
          />
        </div>

        <NarrativeModal
          isOpen={showWhatsThis}
          onClose={handleCloseIntro}
          onComplete={handleCloseIntro}
          dontShowAgain={dontShowAgain}
          onDontShowAgainChange={setDontShowAgain}
          variant="birth-certificate"
        />
        <NavigationGuard
          shouldBlock={hasProgress && !isSaved}
          onSave={async () => {
            await saveGuide("birth-certificate-guide");
            setIsSaved(true);
          }}
          navigationHandled={navigationHandled}
          setNavigationHandled={setNavigationHandled}
        />
        <FeedbackButton
          steps={[
            t("wizard.common.applicationType"),
            t("wizard.common.roadmap"),
            t("wizard.common.validation"),
          ]}
          currentStepName={t(`wizard.common.${currentStepId}`)}
          onSubmit={handleSubmitFeedback}
        />
      </div>
    </StandaloneAccessGate>
  );
};

export default BirthCertificateGuidePage;
