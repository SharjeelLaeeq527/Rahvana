"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, {
  InfoPanelData,
} from "../../../components/guides/WizardInfoPanel";
import WhatsThisModal from "../../../components/guides/WhatsThisModal";
import FeedbackButton from "@/app/components/FeedbackButton";

import ProvinceSelectionStep from "./components/ProvinceSelectionStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";

import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { useNavigationGuard } from "@/lib/guides/useNavigationGuard";

import guideDataRaw from "@/data/police-verification-guide-data.json";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  MapPin,
  Building2,
  UserCheck,
} from "lucide-react";
import { WizardStepId, WizardState } from "@/types/guide-wizard";

// Modals
import {
  LetterModal,
  PreviewModal,
  AuthorityLetterModal,
  AuthorityLetterPreviewModal,
  SindhApplyModal,
  PKMLocatorModal,
  FormData,
  AuthorityFormData,
} from "./components/PoliceModals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const guideData = guideDataRaw as any; // Cast temporarily

const STEP_IDS: WizardStepId[] = [
  "province_selection" as WizardStepId,
  "roadmap" as WizardStepId,
  "validation" as WizardStepId,
];

const STEP_LABELS: Record<string, string> = {
  province_selection: "Province",
  roadmap: "Roadmap",
  validation: "Validation",
};

const INFO_PANEL_KEYS: Record<
  string,
  keyof typeof guideData.wizard.info_panel
> = {
  province_selection: "province_selection",
  roadmap: "roadmap",
  validation: "validation",
};

export default function PoliceVerificationGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [navigationHandled, setNavigationHandled] = useState(false);

  const [state, setState] = useState<WizardState>({
    documentNeed: null,
    ageCategory: null,
    birthSetting: null,
    district: null,
    city: null,
    savedOffice: null,
    province: null,
    validationChecks: [],
    uploadedFile: false,
    checkedDocuments: [],
  });

  const hasInitializedModal = useRef(false);

  const { saveWizardStep, session, loading } = useWizardSession(
    "police-verification-guide",
    state,
    setState,
    STEP_IDS,
    setCurrentStep,
    (prev, stepsData) => ({
      ...prev,
      province: stepsData.province_selection || prev.province,
      checkedDocuments: stepsData.roadmap?.checked || prev.checkedDocuments,
      validationChecks: stepsData.validation?.checks || prev.validationChecks,
      uploadedFile: stepsData.validation?.uploaded || prev.uploadedFile,
    }),
  );

  const { uploadFile: uploadFileHook } = useGuideUpload();
  const { submitFeedback: submitFeedbackHook } = useGuideFeedback();
  const { saveGuide, saving } = useGuideSave();

  // Modals state
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthPreviewModalOpen, setIsAuthPreviewModalOpen] = useState(false);
  const [isSindhApplyModalOpen, setIsSindhApplyModalOpen] = useState(false);
  const [isPKMModalOpen, setIsPKMModalOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    relation: "S/O",
    guardianName: "",
    cnic: "",
    address: "",
    purpose: "Study",
    email: "",
    phone: "",
    district: "",
  });

  const [authFormData, setAuthFormData] = useState<AuthorityFormData>({
    fullName: "",
    relationType: "S/O",
    relationName: "",
    cnic: "",
    authFullName: "",
    authRelationType: "S/O",
    authRelationName: "",
    authCnic: "",
    authRelationship: "Father",
    authAddress: "",
    passportNo: "",
    abroadAddress: "",
    officeLocation: "",
    stayFrom: "",
    stayTo: "",
  });

  // Modal handlers
  const openPreviewModal = () => {
    setIsLetterModalOpen(false);
    setIsPreviewModalOpen(true);
  };
  const openAuthPreviewModal = () => {
    setIsAuthModalOpen(false);
    setIsAuthPreviewModalOpen(true);
  };

  const handleUploadFile = async (file: File) => {
    await uploadFileHook(file, "police-verification-guide", "validation");
    setState((s) => ({ ...s, uploadedFile: true }));
    saveWizardStep("validation", {
      checks: state.validationChecks,
      uploaded: true,
    });
  };

  const handleSubmitFeedback = async (
    type: string,
    desc: string,
    attachment?: File,
  ) => {
    await submitFeedbackHook(
      "police-verification-guide",
      currentStepId,
      type,
      desc,
      attachment,
    );
  };

  const hasProgress = useMemo(() => {
    return (
      currentStep > 0 ||
      !!state.province ||
      state.validationChecks.length > 0 ||
      state.uploadedFile
    );
  }, [currentStep, state]);

  useEffect(() => {
    if (!session) return;

    // Only run once per page load
    if (hasInitializedModal.current) return;

    hasInitializedModal.current = true;

    if (!session.hide_intro_modal) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.saved) {
      setIsSaved(true);
    }
  }, [session]);

  useNavigationGuard(
    hasProgress && !isSaved,
    async () => {
      await saveGuide("police-verification-guide");
      setIsSaved(true);
    },
    navigationHandled,
    setNavigationHandled,
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep > 0 || (state.province && state.province !== "")) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentStep, state.province]);

  const currentStepId = STEP_IDS[currentStep];
  const infoPanelKey = INFO_PANEL_KEYS[currentStepId as string];
  let infoPanelData = guideData.wizard.info_panel[
    infoPanelKey
  ] as InfoPanelData;

  // Conditionally hide links and Sindh-specific pitfalls for non-Sindh provinces
  if (state.province !== "Sindh") {
    let updatedPitfalls = infoPanelData?.pitfalls || [];
    // Remove pitfalls that mention "Sindh"
    updatedPitfalls = updatedPitfalls.filter((p) => !p.includes("Sindh"));

    if (infoPanelData) {
      infoPanelData = {
        ...infoPanelData,
        links: [],
        pitfalls: updatedPitfalls,
      };
    }
  }

  // Filter fee structure according to the selected province
  if (state.province && guideData.wizard.fee_structure) {
    const feeStructure = guideData.wizard.fee_structure;
    // Type definition for tier
    const filteredTiers = feeStructure.tiers.filter(
      (tier: { type: string }) => tier.type === state.province,
    );

    if (filteredTiers.length > 0) {
      infoPanelData = {
        ...infoPanelData,
        fee_structure: {
          ...feeStructure,
          tiers: filteredTiers,
        },
      };
    }
  }

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "province_selection":
        return !!state.province;
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

  const handleProvinceSelect = (id: string) => {
    setState((s) => ({ ...s, province: id }));
    saveWizardStep("province_selection", id, true);
    //   setTimeout(() => setCurrentStep(1), 400);
  };

  const toggleDocument = (docId: string) => {
    setState((prev) => {
      const newDocs = prev.checkedDocuments.includes(docId)
        ? prev.checkedDocuments.filter((id) => id !== docId)
        : [...prev.checkedDocuments, docId];
      saveWizardStep("roadmap", { checked: newDocs });
      return { ...prev, checkedDocuments: newDocs };
    });
  };

  const toggleValidationCheck = (label: string) => {
    const newChecks = state.validationChecks.includes(label)
      ? state.validationChecks.filter((l) => l !== label)
      : [...state.validationChecks, label];
    setState((s) => ({ ...s, validationChecks: newChecks }));
    saveWizardStep("validation", {
      checks: newChecks,
      uploaded: state.uploadedFile,
    });
  };

  const renderStep = () => {
    switch (currentStepId) {
      case "province_selection":
        return (
          <ProvinceSelectionStep
            selected={state.province}
            onSelect={handleProvinceSelect}
            data={guideData.wizard.province_selection}
          />
        );
      case "roadmap":
        const roadmapData = state.province
          ? guideData.wizard.roadmaps[state.province]
          : guideData.wizard.roadmaps["Punjab"]; // Fallback
        return (
          <RoadmapStep
            checkedDocuments={state.checkedDocuments}
            onToggleDocument={toggleDocument}
            data={roadmapData}
          />
        );
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      <WizardHeader
        onWhatsThis={() => setShowWhatsThis(true)}
        title={guideData.wizard.title}
      />

      <div className="flex flex-1 overflow-y-auto xl:overflow-hidden h-[calc(100vh-56px)] flex-col xl:flex-row">
        <WizardSidebar
          currentStep={STEP_IDS.indexOf(currentStepId)}
          steps={STEP_IDS}
          onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
          stepLabels={STEP_LABELS}
          guideSlug="police-verification-guide"
          onSaveGuide={saveGuide}
          onGuideSaved={() => setIsSaved(true)}
          saving={saving}
          session={session}
        />

        <main className="flex-1 xl:overflow-y-auto p-4 sm:p-8 relative min-h-min">
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

              {currentStep < STEP_IDS.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer ${
                    canGoNext()
                      ? "bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-md"
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
          guideData={guideData as Record<string, unknown>}
          guideType="police-verification"
        >
          {/* Custom Action Buttons for Police Verification */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsPKMModalOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/40 rounded-xl transition-all shadow-sm group"
            >
              <span className="font-bold text-slate-700 group-hover:text-primary transition-colors flex items-center gap-2">
                <MapPin size={18} /> PKM Locator
              </span>
              <ArrowRight
                size={18}
                className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </button>
            {state.province === "Sindh" && (
              <button
                onClick={() => setIsLetterModalOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/40 rounded-xl transition-all shadow-sm group"
              >
                <span className="font-bold text-slate-700 group-hover:text-primary transition-colors flex items-center gap-2">
                  <FileText size={18} /> Create Purpose Letter
                </span>
                <ArrowRight
                  size={18}
                  className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
              </button>
            )}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/40 rounded-xl transition-all shadow-sm group"
            >
              <span className="font-bold text-slate-700 group-hover:text-primary transition-colors flex items-center gap-2">
                <UserCheck size={18} /> Create Authority Letter
              </span>
              <ArrowRight
                size={18}
                className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </button>
            {state.province === "Sindh" && (
              <button
                onClick={() => setIsSindhApplyModalOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-primary text-white hover:bg-primary/90 rounded-xl transition-all shadow-md group"
              >
                <span className="font-bold flex items-center gap-2">
                  <Building2 size={18} /> Apply Now (Sindh)
                </span>
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-all"
                />
              </button>
            )}
          </div>
        </WizardInfoPanel>
      </div>

      <WhatsThisModal
        open={showWhatsThis}
        onClose={() => setShowWhatsThis(false)}
        data={guideData.wizard.whats_this}
        documentLabel="Police Verification"
        guideSlug="police-verification-guide"
      />

      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId] || ""}
        onSubmit={handleSubmitFeedback}
      />

      {/* Modals Mounting */}
      {state.province === "Sindh" && (
        <>
          <LetterModal
            isOpen={isLetterModalOpen}
            onClose={() => setIsLetterModalOpen(false)}
            onOpenPreview={openPreviewModal}
            formData={formData}
            setFormData={setFormData}
            province={state.province || "Punjab"}
          />
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            formData={formData}
            province={state.province || "Punjab"}
          />
        </>
      )}

      <AuthorityLetterModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenPreview={openAuthPreviewModal}
        formData={authFormData}
        setFormData={setAuthFormData}
        province={state.province || "Punjab"}
      />
      <AuthorityLetterPreviewModal
        isOpen={isAuthPreviewModalOpen}
        onClose={() => setIsAuthPreviewModalOpen(false)}
        formData={authFormData}
        province={state.province || "Punjab"}
      />

      <SindhApplyModal
        isOpen={isSindhApplyModalOpen}
        onClose={() => setIsSindhApplyModalOpen(false)}
      />

      <PKMLocatorModal
        isOpen={isPKMModalOpen}
        onClose={() => setIsPKMModalOpen(false)}
        province={state.province || "Punjab"}
      />
    </div>
  );
}
