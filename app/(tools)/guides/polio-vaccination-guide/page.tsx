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
import guideData from "@/data/polio-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
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
  document_need: "Applicant Profile",
  location: "Location",
  roadmap: "Roadmap",
  office_finder: "Office Finder",
  validation: "Validation",
};

const INFO_PANEL_KEYS: Record<
  string,
  keyof typeof guideData.wizard.info_panel
> = {
  document_need: "document_need",
  age_category: "document_need",
  birth_setting: "document_need",
  location: "location",
  roadmap: "roadmap",
  office_finder: "office_finder",
  validation: "validation",
};

const PolioVaccinationGuide = () => {
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

  const { saveWizardStep, session, loading } = useWizardSession(
    "polio-vaccination-guide",
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
    await uploadFileHook(file, "polio-vaccination-guide", "validation");
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
      "polio-vaccination-guide",
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
    const dontShow = localStorage.getItem("hide_whats_this_modal_polio");
    if (!dontShow) setShowWhatsThis(true);
  }, []);

  useNavigationGuard(
    hasProgress && !isSaved,
    async () => {
      await saveGuide("polio-vaccination-guide"); // wait save complete
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
      const newDocumentNeed = {
        ...(typeof state.documentNeed === "object" && state.documentNeed !== null
          ? state.documentNeed
          : {}),
        [questionId]: id,
      };
      setState((s) => ({
        ...s,
        documentNeed: newDocumentNeed,
      }));
      // Save progress to backend
      saveWizardStep("document_need", newDocumentNeed);
    } else {
      setState((s) => ({ ...s, documentNeed: id }));
      // Save progress to backend
      saveWizardStep("document_need", id, true);
      setTimeout(() => setCurrentStep(1), 400);
    }
  };

  const toggleDocument = (id: string) => {
    const newDocs = state.checkedDocuments.includes(id)
      ? state.checkedDocuments.filter((d) => d !== id)
      : [...state.checkedDocuments, id];

    setState((s) => ({
      ...s,
      checkedDocuments: newDocs,
    }));

    // Save progress to backend
    saveWizardStep("roadmap", newDocs);
  };

  const toggleValidationCheck = (label: string) => {
    const newChecks = state.validationChecks.includes(label)
      ? state.validationChecks.filter((l) => l !== label)
      : [...state.validationChecks, label];

    setState((s) => ({
      ...s,
      validationChecks: newChecks,
    }));

    // Save progress to backend
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
        let roadmapData = guideData.wizard.roadmaps.adult;
        const docNeed = state.documentNeed as Record<string, string> | null;
        if (docNeed && docNeed.personType) {
          const person = docNeed.personType as "adult" | "child" | "foreigner";
          roadmapData =
            guideData.wizard.roadmaps[person] ||
            guideData.wizard.roadmaps.adult;
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
      //       officeType="Vaccination Center"
      //       warningText="Ensure that the vaccination center you plan to visit offers NIMS registration, as you will need this for the online certificate. Listings and contact info may change; always confirm details before visiting."
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] pt-14">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600" />
      </div>
    );
  }

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
          guideSlug="polio-vaccination-guide"
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
          guideType="other"
        />
      </div>

      <WhatsThisModal
        open={showWhatsThis}
        onClose={() => setShowWhatsThis(false)}
        data={guideData.wizard.whats_this}
        documentLabel="Polio Certificate"
      />
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};

export default PolioVaccinationGuide;
