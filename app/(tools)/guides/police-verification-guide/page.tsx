"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, { InfoPanelData } from "../../../components/guides/WizardInfoPanel";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import FeedbackButton from "@/app/components/FeedbackButton";
import { Loader } from "@/components/ui/spinner";
import { StandaloneAccessGate } from "@/app/components/wallet/StandaloneAccessGate";
import ProvinceSelectionStep from "./components/ProvinceSelectionStep";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import ValidationStep from "../../../components/guides/steps/ValidationStep";

import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { NavigationGuard } from "@/lib/guides/useNavigationGuard";

import guideDataRaw from "@/data/police-verification-guide-data.json";
import { ArrowLeft, ArrowRight, FileText, MapPin, Building2, UserCheck } from "lucide-react";
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

const INFO_PANEL_KEYS: Record<string, keyof typeof guideData.wizard.info_panel> = {
  province_selection: "province_selection",
  roadmap: "roadmap",
  validation: "validation",
};

export default function PoliceVerificationGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem("dont_show_police_character_welcome") === "true"
  );
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
    })
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

  const handleSubmitFeedback = async (type: string, desc: string, attachment?: File) => {
    await submitFeedbackHook("police-verification-guide", currentStepId, type, desc, attachment);
  };

  const hasProgress = useMemo(() => {
    return (
      currentStep > 0 || !!state.province || state.validationChecks.length > 0 || state.uploadedFile
    );
  }, [currentStep, state]);

  useEffect(() => {
    if (!session) return;

    // Only run once per page load
    if (hasInitializedModal.current) return;

    hasInitializedModal.current = true;

    const localHide =
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_police_character_welcome") === "true";

    if (!session.hide_intro_modal && !localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_police_character_welcome", "true");
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
  let infoPanelData = guideData.wizard.info_panel[infoPanelKey] as InfoPanelData;

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
      (tier: { type: string }) => tier.type === state.province
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
    if (currentStep < STEP_IDS.length - 1 && canGoNext()) setCurrentStep(currentStep + 1);
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] pt-14">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <StandaloneAccessGate
      feature="guide_police"
      resourceType="guide"
      resourceId="guide-police"
      title="Police Character Certificate Guide Locked"
      description="Unlock step-by-step guidance on obtaining your Police Character Certificate — with wallet credits or a plan upgrade."
    >
      <div className="flex min-h-screen flex-col bg-gray-50 pt-26">
        <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} title={guideData.wizard.title} />

        <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_350px] xl:items-start xl:gap-6">
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
            <div className="flex min-h-[550px] w-full flex-col items-center justify-center xl:min-h-[550px] xl:items-start">
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

                <div className="mt-5 flex items-center justify-between pb-6">
                  {currentStep > 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={goBack}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden md:inline-block">Back</span>
                    </motion.button>
                  ) : (
                    <div />
                  )}

                  <span className="text-sm font-medium text-gray-500">
                    Step {currentStep + 1} of {STEP_IDS.length}
                  </span>

                  {currentStep < STEP_IDS.length - 1 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                        canGoNext()
                          ? "bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-md"
                          : "cursor-not-allowed bg-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="hidden md:inline-block">Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </main>

          <div className="xl:sticky xl:top-4 xl:self-start">
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
                  className="hover:border-primary/40 group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:bg-slate-50"
                >
                  <span className="group-hover:text-primary flex items-center gap-2 font-bold text-slate-700 transition-colors">
                    <MapPin size={18} /> PKM Locator
                  </span>
                  <ArrowRight
                    size={18}
                    className="group-hover:text-primary text-slate-400 transition-all group-hover:translate-x-1"
                  />
                </button>
                {state.province === "Sindh" && (
                  <button
                    onClick={() => setIsLetterModalOpen(true)}
                    className="hover:border-primary/40 group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:bg-slate-50"
                  >
                    <span className="group-hover:text-primary flex items-center gap-2 font-bold text-slate-700 transition-colors">
                      <FileText size={18} /> Create Purpose Letter
                    </span>
                    <ArrowRight
                      size={18}
                      className="group-hover:text-primary text-slate-400 transition-all group-hover:translate-x-1"
                    />
                  </button>
                )}
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hover:border-primary/40 group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:bg-slate-50"
                >
                  <span className="group-hover:text-primary flex items-center gap-2 font-bold text-slate-700 transition-colors">
                    <UserCheck size={18} /> Create Authority Letter
                  </span>
                  <ArrowRight
                    size={18}
                    className="group-hover:text-primary text-slate-400 transition-all group-hover:translate-x-1"
                  />
                </button>
                {state.province === "Sindh" && (
                  <button
                    onClick={() => setIsSindhApplyModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 group flex w-full items-center justify-between rounded-xl p-4 text-white shadow-md transition-all"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <Building2 size={18} /> Apply Now (Sindh)
                    </span>
                    <ArrowRight size={18} className="transition-all group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </WizardInfoPanel>
          </div>
        </div>

        <NarrativeModal
          isOpen={showWhatsThis}
          onClose={handleCloseIntro}
          onComplete={handleCloseIntro}
          dontShowAgain={dontShowAgain}
          onDontShowAgainChange={setDontShowAgain}
          variant="police-verification"
        />

        <NavigationGuard
          shouldBlock={hasProgress && !isSaved}
          onSave={async () => {
            await saveGuide("police-verification-guide");
            setIsSaved(true);
          }}
          navigationHandled={navigationHandled}
          setNavigationHandled={setNavigationHandled}
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
    </StandaloneAccessGate>
  );
}
