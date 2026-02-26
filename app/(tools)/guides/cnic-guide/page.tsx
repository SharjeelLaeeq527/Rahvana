"use client";

import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, {
  InfoPanelData,
} from "../../../components/guides/WizardInfoPanel";
import DocumentNeedStep from "../../../components/guides/steps/DocumentNeedStep";
// import LocationStep from "../../../components/guides/steps/LocationStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
// import OfficeFinderStep from "../../../components/guides/steps/OfficeFinderStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";
import WhatsThisModal from "../../../components/guides/WhatsThisModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/cnic-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { useNavigationGuard } from "@/lib/guides/useNavigationGuard";

const STEP_IDS: WizardStepId[] = [
  "document_need",
  // "location",
  "roadmap",
  // "office_finder",
  "validation",
];

const STEP_LABELS: Record<string, string> = {
  document_need: "Application Type",
  location: "Location",
  roadmap: "Roadmap",
  office_finder: "Office Finder",
  validation: "Validation",
};

const INFO_PANEL_KEYS: Record<
  WizardStepId,
  keyof typeof guideData.wizard.info_panel
> = {
  document_need: "document_need",
  age_category: "document_need",
  birth_setting: "document_need",
  location: "roadmap",
  roadmap: "roadmap",
  office_finder: "roadmap",
  validation: "validation",
};

const CnicGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(true);
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

  const { saveWizardStep, session } = useWizardSession(
    "cnic-guide",
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
    }),
  );

  const { uploadFile: uploadFileHook } = useGuideUpload();
  const { submitFeedback: submitFeedbackHook } = useGuideFeedback();
  const { saveGuide, saving } = useGuideSave();

  // Wrapper functions to match expected signatures
  const handleUploadFile = async (file: File) => {
    await uploadFileHook(file, "cnic-guide", "validation");
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
    attachment?: File,
  ) => {
    await submitFeedbackHook(
      "cnic-guide",
      currentStepId,
      feedbackType,
      description,
      attachment,
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
    const dontShow = localStorage.getItem("hide_whats_this_modal_cnic");
    if (!dontShow) setShowWhatsThis(true);
  }, []);

  useNavigationGuard(
    hasProgress && !isSaved,
    async () => {
      await saveGuide("cnic-guide"); // wait save complete
      setIsSaved(true); // mark as saved
    },
    navigationHandled,
    setNavigationHandled,
  );

  // Before unload confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show confirmation if user has made progress beyond the first step
      if (
        currentStep > 0 ||
        (state.documentNeed && state.documentNeed !== "")
      ) {
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
  const infoPanelData = guideData.wizard.info_panel[
    infoPanelKey
  ] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        if (guideData.wizard.document_need.questions) {
          const numQuestions = guideData.wizard.document_need.questions.length;
          const answers = state.documentNeed;
          if (typeof answers === "object" && answers !== null) {
            return Object.keys(answers).length === numQuestions;
          }
          return false;
        }
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

  const handleDocumentNeedSelect = (id: string, questionId?: string) => {
    if (questionId) {
      setState((s) => ({
        ...s,
        documentNeed: {
          ...(typeof s.documentNeed === "object" && s.documentNeed !== null
            ? s.documentNeed
            : {}),
          [questionId]: id,
        },
      }));
    } else {
      setState((s) => ({ ...s, documentNeed: id }));
      setTimeout(() => setCurrentStep(1), 400);
    }
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
      case "document_need":
        return (
          <DocumentNeedStep
            selected={state.documentNeed}
            onSelect={handleDocumentNeedSelect}
            data={guideData.wizard.document_need}
            onNext={goNext}
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
        let roadmapData = guideData.wizard.roadmaps.standard_new;
        const docNeed = state.documentNeed as Record<string, string> | null;
        if (docNeed) {
          const person = docNeed.personType;
          const appType = docNeed.applicationType;

          if (person === "special") {
            if (appType === "new") {
              roadmapData = guideData.wizard.roadmaps.special_new;
            } else if (appType === "correction") {
              roadmapData = guideData.wizard.roadmaps.standard_correction;
            } else {
              roadmapData = guideData.wizard.roadmaps.standard_replacement;
            }
          } else {
            if (appType === "new") {
              roadmapData = guideData.wizard.roadmaps.standard_new;
            } else if (appType === "correction") {
              roadmapData = guideData.wizard.roadmaps.standard_correction;
            } else {
              roadmapData = guideData.wizard.roadmaps.standard_replacement;
            }
          }
        }

        return (
          <RoadmapStep
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
            data={roadmapData}
          />
        );
      // case "office_finder":
      //   return (
      //     <OfficeFinderStep
      //       province={state.province}
      //       district={state.district}
      //       offices={guideData.wizard.offices as any}
      //       officeType="NADRA"
      //       warningText="CNIC applications are processed at authorized NADRA Registration Centers. Verify that the office you plan to visit offers complete CNIC services. Office listings and contact information may change; always confirm details before visiting."
      //     />
      //   );
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      <WizardHeader
        onWhatsThis={() => setShowWhatsThis(true)}
        title={guideData.wizard.title}
      />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)] flex-col lg:flex-row">
        <WizardSidebar
          currentStep={STEP_IDS.indexOf(currentStepId)}
          steps={STEP_IDS}
          onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
          stepLabels={STEP_LABELS}
          guideSlug="cnic-guide"
          onSaveGuide={saveGuide}
          onGuideSaved={() => setIsSaved(true)}
          saving={saving}
          session={session}
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

            <div className="flex justify-between items-center mt-5 pb-6">
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
                <div />
              )}

              <span className="text-sm text-gray-500 font-medium">
                Step {currentStep + 1} of {STEP_IDS.length}
              </span>

              {currentStep < STEP_IDS.length - 1 &&
                !(
                  currentStepId === "document_need" &&
                  guideData.wizard.document_need.questions &&
                  guideData.wizard.document_need.questions.length > 1
                ) && (
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
                )}
            </div>
          </div>
        </main>

        <WizardInfoPanel
          data={infoPanelData}
          lastVerified={guideData.wizard.last_verified}
          guideData={guideData as Record<string, unknown>}
          guideType="cnic"
        />
      </div>

      <WhatsThisModal
        open={showWhatsThis}
        onClose={() => setShowWhatsThis(false)}
        data={guideData.wizard.whats_this}
        documentLabel="CNIC"
      />
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};

export default CnicGuide;

// "note": "<strong>Note:</strong> Women, men, and transgender individuals fall under the standard category as long as they have verifiable blood relatives."
