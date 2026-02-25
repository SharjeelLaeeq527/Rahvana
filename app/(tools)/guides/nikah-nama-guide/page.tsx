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
import guideData from "@/data/nikah-nama-guide-data.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";

const STEP_IDS: WizardStepId[] = ["document_need", "roadmap", "validation"];

const STEP_LABELS: Record<string, string> = {
  document_need: "Case Type",
  roadmap: "Roadmap",
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

const NikahNamaGuidePage = () => {
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
    "nikah-nama-guide",
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
  // Wrapper functions to match expected signatures
  const handleUploadFile = async (file: File) => {
    await uploadFileHook(file, "nikah-nama-guide", "validation");
    // Update local state to reflect the upload
    setState((s) => ({ ...s, uploadedFile: true }));
    saveWizardStep("validation", {
      checks: state.validationChecks,
      uploaded: true,
    });
  };

  useEffect(() => {
    const dontShow = localStorage.getItem("hide_whats_this_modal_nikah");
    if (!dontShow) setShowWhatsThis(true);
  }, []);

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelKey = INFO_PANEL_KEYS[currentStepId];
  // We need to typecast correctly due to TS limitations with JSON
  const infoPanelData = guideData.wizard.info_panel[
    infoPanelKey as keyof typeof guideData.wizard.info_panel
  ] as unknown as InfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        const docNeed = guideData.wizard.document_need as {
          questions?: unknown[];
        };
        if (docNeed.questions) {
          const numQuestions = docNeed.questions.length;
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
            data={
              guideData.wizard.document_need as React.ComponentProps<
                typeof DocumentNeedStep
              >["data"]
            }
          />
        );
      case "roadmap":
        const docNeedRaw = state.documentNeed as
          | string
          | Record<string, string>
          | null;
        let selectedCategory: string | undefined;

        if (typeof docNeedRaw === "string") {
          selectedCategory = docNeedRaw;
        } else if (
          docNeedRaw &&
          typeof docNeedRaw === "object" &&
          Object.keys(docNeedRaw).length > 0
        ) {
          // Pick a value from the object... not typical if nikah nama isn't using questions.
          selectedCategory = Object.values(docNeedRaw)[0];
        }

        // We filter checklist documents based on category
        const roadmapData = { ...guideData.wizard.roadmap };
        if (selectedCategory) {
          roadmapData.documents_checklist =
            roadmapData.documents_checklist.filter(
              (doc: { category?: string }) => {
                if (doc.category) {
                  return doc.category === selectedCategory;
                }
                return true;
              },
            );
        }

        return (
          <RoadmapStep
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
            data={
              roadmapData as React.ComponentProps<typeof RoadmapStep>["data"]
            }
          />
        );
      case "validation":
        return (
          <ValidationStep
            validationChecks={state.validationChecks}
            onToggleCheck={toggleValidationCheck}
            uploadedFile={state.uploadedFile}
            onUpload={handleUploadFile}
            data={
              guideData.wizard.validation as React.ComponentProps<
                typeof ValidationStep
              >["data"]
            }
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

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
        {/* <WizardSidebar
          currentStep={currentStep}
          steps={STEP_IDS}
          onStepClick={setCurrentStep}
        /> */}

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(hsl(168 80% 30% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(168 80% 30% / 0.02) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm min-h-100">
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

              {currentStep < STEP_IDS.length - 1 && (
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
        onClose={() => {
          setShowWhatsThis(false);
          localStorage.setItem("hide_whats_this_modal_nikah", "true");
        }}
        data={
          guideData.wizard.whats_this as React.ComponentProps<
            typeof WhatsThisModal
          >["data"]
        }
        documentLabel="Nikah Nama & MRC"
      />
      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
      />
    </div>
  );
};

export default NikahNamaGuidePage;
