/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic refactoring in progress
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { E, msg } from "@/lib/errors";
import {
  ArrowLeft,
  Zap,
  CheckCircle2,
  CheckCircle,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Search,
  MessageSquare,
  Scale,
  Globe,
  Lock,
  Check,
  Book,
  Camera,
  FileCheck,
  X,
  Mail,
  ExternalLink,
  Monitor,
  Upload,
  CreditCard,
  Wallet,
  User,
  FileText,
  ClipboardList,
  ChevronLeft,
  Info,
  Eye,
  Trash2,
  Truck,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RoadmapData,
  QuestSuite,
  TutorialStepData,
  ActionCard,
  DocumentGatheringItem,
} from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getAllActiveSteps, getStageProgress } from "./journeyHelpers";
import { getActiveStepsForStage } from "./journeyHelpers";
import CredentialFormModal from "@/app/(main)/portal-wallet/components/CredentialFormModal";
import ViewCredentialModal from "@/app/(main)/portal-wallet/components/ViewCredentialModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { InlineGuideData } from "./InlineGuideData";
import { USCIS_TUTORIAL_STEPS } from "./UscisTutorialData";
import { TutorialVideo } from "@/app/components/shared/TutorialVideo";
import Image from "next/image";
import Link from "next/link";
import { HOUSEHOLD_TUTORIAL_STEPS } from "./HouseholdTutorialData";
import { SUBMISSION_TUTORIAL_STEPS, SubmissionTutorialOverlay } from "./SubmissionTutorialData";
import { AWAITING_REVIEW_DATA } from "./AwaitingReviewData";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DocumentUploadModal } from "@/app/components/document-vault/DocumentUploadModal";
import { MultipleDocumentUploadModal } from "@/app/components/document-vault/MultipleDocumentUploadModal";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import PassportPhotoTool from "@/components/tools/PassportPhotoTool";
import DocumentTranslationTool from "@/components/tools/DocumentTranslationTool";
import { usePortalWallet } from "./hooks/usePortalWallet";
import { useFilingQuiz } from "./hooks/useFilingQuiz";
import { useSponsorship } from "./hooks/useSponsorship";
import { DocActionModal } from "./components/DocActionModal";
import { HouseholdMemberTool } from "./components/HouseholdMemberTool";
import { EvidenceStrengthMeter } from "./components/EvidenceStrengthMeter";
import { DocCaseStrengthMeter } from "./components/DocCaseStrengthMeter";
import { EligibilityRiskBanner } from "./components/EligibilityRiskBanner";
import { Chapter1HealthPanel } from "./components/Chapter1HealthPanel";
import { FloatingSidePanel } from "./components/FloatingSidePanel";
import {
  ConsistencyBaselineCapture,
  type ConsistencyBaseline,
} from "./components/ConsistencyBaselineCapture";
import { Ds260BaselineCapture, type Ds260Baseline } from "./components/Ds260BaselineCapture";
import {
  BeneficiaryResidenceCapture,
  type BeneficiaryBaseline,
} from "./components/BeneficiaryResidenceCapture";
import { FileQualityPreCheck } from "./components/FileQualityPreCheck";
import { PreSubmissionSnapshot } from "./components/PreSubmissionSnapshot";
import { PacketSectionChecklist } from "./components/PacketSectionChecklist";
import { IR1_QUESTIONNAIRE_CONFIG } from "@/lib/questionnaire/ir1-questionnaire";
import { computeDocumentList, deriveDocAnswersFromEligibility } from "@/lib/questionnaire/engine";
import type { QuestionnaireResult, ConditionalDocument } from "@/lib/questionnaire/types";
import { StepHeader } from "./StepHeader";
import { CeacCredsModal, NvcFeeModal } from "./PortalWalletManager";
import { SponsorshipModule } from "./components/SponsorshipModule";
import {
  CivilDocGuideOverlay,
  FinancialDocGuideOverlay,
  HouseholdDocGuideOverlay,
} from "./DocumentGuideOverlays";
import {
  MedicalTutOverlay,
  CourierTutOverlay,
  InterviewDayTutOverlay,
} from "./GuideTutorialOverlays";
import { DqRecordingTool } from "./components/DqRecordingTool";
import { AppointmentReceivedTool } from "./components/AppointmentReceivedTool";
import { MedicalExamTool } from "./components/MedicalExamTool";
import { PolioCertificateTool } from "./components/PolioCertificateTool";
import { PoliceClearanceTool } from "./components/PoliceClearanceTool";
import { getStepIcon } from "./StepIcon";
import { SubmissionReviewTool } from "./components/SubmissionReviewTool";
import { MedicalExamGuideTool } from "./components/MedicalExamGuideTool";
import { CourierRegistrationTool } from "./components/CourierRegistrationTool";
import { InterviewPrepTool } from "./components/InterviewPrepTool";
import { DocListSection } from "./components/DocListSection";
import { InterviewSchedulingTool } from "./components/InterviewSchedulingTool";
import { AdministrativeProcessingTool } from "./components/AdministrativeProcessingTool";
import { InterviewDayTool } from "./components/InterviewDayTool";
import { InterviewOutcomeTool } from "./components/InterviewOutcomeTool";
import { TrackVisaIssuanceTool } from "./components/TrackVisaIssuanceTool";
import { Respond221gTool } from "./components/Respond221gTool";
import { Input221gTool } from "./components/Input221gTool";
import CaseRegistrationForm from "./components/CaseRegistrationForm";
import { StepEntitlementBanner } from "@/app/components/entitlements/StepEntitlementBanner";
import { useStepEntitlement } from "./useStepEntitlement";
import { StepLockedContent } from "./StepLockedContent";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { getStepLockStatus, getModalFeatureForTier } from "@/lib/entitlements/hardLockRules";
import { ApprovalNoticeTool } from "./components/ApprovalNoticeTool";
import RegisterReceiptStep from "./components/RegisterReceiptStep";
import TrackCaseStatusStep from "./components/TrackCaseStatusStep";
import { AwaitingReviewStep } from "./components/AwaitingReviewStep";
import { FinancialChecklistTool } from "./components/FinancialChecklistTool";
import SponsorshipCalculatorTool from "./components/SponsorshipCalculatorTool";
import { ApUpdateModal } from "./PortalWalletManager";
import { HouseholdSponsorshipTool } from "./components/HouseholdSponsorshipTool";
import { DocumentQuestionnaire } from "@/app/components/questionnaire/DocumentQuestionnaire";
import { QuestRenderer } from "./QuestRenderer";
import { ActionStepRenderer } from "./ActionStepRenderer";

const STEP_CITATIONS: Record<string, { text: string; link: string }[]> = {
  step_1_3: [
    {
      text: "Submit your petition through your USCIS online account",
      link: "https://www.uscis.gov/file-online",
    },
    {
      text: "USCIS mailing addresses",
      link: "https://www.uscis.gov/i-130-addresses",
    },
  ],
  step_1_4: [
    {
      text: "Official form link",
      link: "https://www.uscis.gov/i-130",
    },
  ],
  step_1_5: [
    {
      text: "Official form link",
      link: "https://www.uscis.gov/sites/default/files/document/forms/i-130a.pdf",
    },
  ],
  step_1_12: [
    {
      text: "USCIS Filing Fees Guide",
      link: "https://www.uscis.gov/forms/filing-fees",
    },
    {
      text: "USCIS Form G‑1055 Fee Schedule",
      link: "https://www.uscis.gov/g-1055",
    },
  ],
  step_1_14: [
    {
      text: "USCIS Direct Filing Addresses",
      link: "https://www.uscis.gov/i-130-addresses",
    },
  ],
  step_1_16: [
    {
      text: "USCIS Case Status Tracker",
      link: "https://egov.uscis.gov/",
    },
  ],
  step_2_3: [
    {
      text: "Consular Electronic Application Center (CEAC)",
      link: "https://ceac.state.gov/IV",
    },
  ],
  step_2_7: [
    {
      text: "Affidavit of Support (Department of State)",
      link: "https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-1-submit-a-petition/affidavit-of-support.html",
    },
    {
      text: "USCIS Affidavit of Support Guidance",
      link: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/affidavit-of-support",
    },
  ],
  step_3_1: [
    {
      text: "Medical Exam Instructions (Department of State)",
      link: "https://travel.state.gov/content/travel/en/us-visas/Supplements/Supplements_by_Post/ISL-Islamabad.html",
    },
  ],
  step_3_2: [
    {
      text: "Pakistan Polio Vaccination Certificate Information",
      link: "https://www.poliofreepakistan.gov.pk/certificate/vaccination-certificate",
    },
    {
      text: "NADRA NIMS Portal (certificate access)",
      link: "https://nims.nadra.gov.pk/nims/",
    },
  ],
};

/**
 * Find a vault document that matches an item, considering dynamic categories.
 * When a parent doc (e.g. "Proof of U.S. Citizenship") has `isDynamicCategory: true`,
 * the MultipleDocumentUploadModal stores uploads under the sub-type's mapped ID
 * (e.g. "passport-petitioner" for "U.S. passport") or a dynamic slot ID.
 * This function checks all those possibilities so the status badge shows "Uploaded".
 */
function findVaultDocForItem<T extends { documentDefId: string }>(
  itemTitle: string,
  mappedId: string,
  uploadedDocs: T[]
): T | undefined {
  // 1. Direct exact match
  const direct = uploadedDocs.find((d) => d.documentDefId === mappedId);
  if (direct) return direct;

  // 2. Check if the mapped ID is a dynamic-category parent
  const parentDef = ALL_DOCUMENTS.find((d) => d.id === mappedId);
  if (!parentDef?.isDynamicCategory) return undefined;

  const parentCategory = (parentDef as any).category as string;

  // 3. Check sub-type mapped IDs from suggestions
  if (parentDef.suggestions) {
    for (const opt of parentDef.suggestions) {
      const subId = mapDocumentNameToId(opt);
      if (subId !== mappedId && subId !== "misc-document") {
        const m = uploadedDocs.find((d) => d.documentDefId === subId);
        if (m) return m;
      }
    }
  }

  // 4. Check dynamic slot IDs – return any doc under this parent's category
  if (parentCategory) {
    const m = uploadedDocs.find((d) => d.documentDefId.startsWith(`dynamic-${parentCategory}-`));
    if (m) return m;
  }

  return undefined;
}

interface StepViewProps {
  data: RoadmapData;
  state: WizardState;
  actions: {
    toggleComplete: (id: string) => void;
    setCurrentStep: (idx: number | null) => void;
    setStage: (idx: number) => void;
    updateAnswers: (answers: Record<string, unknown>) => void;
    updateMetadata: (data: Record<string, unknown>) => void;
    updateDocumentStatus?: (
      docId: string,
      status: "not-started" | "in-progress" | "reviewed"
    ) => Promise<void>;
    savePaymentMethod?: (methodValue: string) => Promise<void>;
    saveMailingDetails?: (carrier: string, trackingNumber: string) => Promise<void>;
  };
  onBack: () => void;
  onSelectChapter?: (chapterIdx: number) => void;
  onSelectStep?: (chapterIdx: number, stepIdx: number) => void;
}

export const StepView: React.FC<StepViewProps> = ({
  data,
  state,
  actions,
  onBack,
  onSelectChapter,
  onSelectStep,
}) => {
  // Top-level step/chapter detection logic for use throughout the file
  const chapters = data.chapters || (data as any).stages;
  const currentChapter = chapters?.[state.currentStage];
  const currentStep = currentChapter?.steps?.[state.currentStep || 0];
  const sId = currentStep?.step_key || (currentStep as any)?.id || "";
  const isChapter1 = sId.startsWith("step_1_");
  const isChapter2 = sId.startsWith("step_2_");
  const isChapter3 = sId.startsWith("step_3_");
  // ── Step-level entitlement gating ──────────────────────────────────────────
  const plan = usePlan();
  const stepEntitlement = useStepEntitlement(sId);

  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const [isApUpdateModalOpen, setIsApUpdateModalOpen] = useState(false);
  // Add Evidence Note modal state

  const { user } = useAuth();
  const {
    openUploadModal,
    uploadModalOpen,
    closeUploadModal,
    selectedDocumentDefId,
    reloadDocuments,
    setConfig: setConfigVault,
    uploadedDocuments,
    isReloadingDocs,
    isDeletingIds,
    deleteDocument,
  } = useDocumentVaultStore();
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [activeUploadType, setActiveUploadType] = useState<"doc" | "hh" | "financial" | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [docActionModal, setDocActionModal] = useState<{
    isOpen: boolean;
    doc: any | null;
    title?: string;
    subtitle?: string;
    onReadGuide?: () => void;
    onUpload?: () => void;
  }>({
    isOpen: false,
    doc: null,
  });

  // Profile feeds OCR-extracted values (e.g. DOBs from passport upload) into the
  // step_1_4 consistency baseline so the user doesn't re-type them by hand.
  const { profile } = useUserProfile();

  // Document Questionnaire State (Chapter 1, Step 2)
  const isDocQuestionnaireCompleted = state.metadata?.docQuestionnaireCompleted === true;
  const [showDocQuestionnaire, setShowDocQuestionnaire] = useState(false);
  const [showPrerequisiteModal, setShowPrerequisiteModal] = useState(false);

  const { showToast } = useToast();

  // Derive document-questionnaire answers from Step 1 eligibility quest answers
  // so duplicate questions (prior marriage, criminal history) don't need to be asked again.
  const derivedDocAnswers = useMemo(() => {
    const eligibilityAnswers = state.answers?.["eligibility-suite"] as
      | Record<string, Record<string, string | string[]>>
      | undefined;
    return deriveDocAnswersFromEligibility(eligibilityAnswers);
  }, [state.answers]);

  // Compute effective document items: use engine-finalized list if questionnaire done,
  // otherwise fall back to the raw JSON data
  const questionnaireDocItems = useMemo(() => {
    if (!isDocQuestionnaireCompleted) return null;
    const savedAnswers = state.metadata?.docQuestionnaireAnswers as
      | Record<string, string>
      | undefined;
    if (!savedAnswers) return null;
    // Merge derived Step 1 answers underneath saved answers
    // (saved answers take priority if both exist)
    const mergedAnswers = { ...derivedDocAnswers, ...savedAnswers };
    const computed = computeDocumentList(IR1_QUESTIONNAIRE_CONFIG, mergedAnswers);
    // Map ConditionalDocument shape to the document_items shape the UI uses
    return computed.map((doc: ConditionalDocument) => ({
      id: doc.id,
      name: doc.name,
      subtitle: doc.subtitle,
      tag: doc.tag === "joint_sponsor" ? "other" : doc.tag,
      guideUrl: doc.guideUrl,
      icon: doc.icon,
      group: doc.group,
      status: "not-started",
      required: doc.required,
    }));
  }, [isDocQuestionnaireCompleted, state.metadata?.docQuestionnaireAnswers, derivedDocAnswers]);

  const [multipleUploadModalState, setMultipleUploadModalState] = useState<{
    isOpen: boolean;
    categoryId: string;
    documentName: string;
    options: string[];
  }>({
    isOpen: false,
    categoryId: "",
    documentName: "",
    options: [],
  });

  const isCompleted = state.completedSteps.has(sId);

  const handleToggleComplete = useCallback(() => {
    const stepKey = currentStep.step_key || sId;
    // Map step keys to correct metadata fields for milestone tracking
    const milestoneMetaMap: Record<string, { key: string; value?: () => string }> = {
      step_1_3: {
        key: "receiptNum",
        value: () => new Date().toISOString().slice(0, 10),
      },
      step_1_6: {
        key: "uscisPortalSaved",
        value: () => "true",
      },
      step_1_7: {
        key: "filingFeeDate",
        value: () => new Date().toISOString().slice(0, 10),
      },
      step_1_8: {
        key: "submissionDate",
        value: () => new Date().toISOString().slice(0, 10),
      },
      step_2_10: {
        key: "dqDate",
        value: () => new Date().toISOString().slice(0, 10),
      },
      step_3_1: {
        key: "medicalDate",
        value: () => new Date().toISOString().slice(0, 10),
      },
      step_3_7: {
        key: "interviewDate",
        value: () => new Date().toISOString().slice(0, 10),
      },
      step_2_1: {
        key: "nvcCaseNum",
        value: () => "NVC2026-" + Math.floor(Math.random() * 1000000),
      },
      step_2_2: {
        key: "nvcInvoice",
        value: () => "INVC-" + Math.floor(Math.random() * 1000000),
      },
      step_3_7b: { key: "interviewEmbassy", value: () => "Islamabad" },
      step_1_17: {
        key: "approvalDate",
        value: () => new Date().toISOString().slice(0, 10),
      },
    };
    actions.toggleComplete(stepKey);
    // If this step is a milestone, set the metadata field if not already set
    const metaObj = milestoneMetaMap[stepKey];
    if (
      metaObj &&
      (state.metadata[metaObj.key] === undefined ||
        state.metadata[metaObj.key] === null ||
        state.metadata[metaObj.key] === "")
    ) {
      const value = metaObj.value ? metaObj.value() : new Date().toISOString().slice(0, 10);
      actions.updateMetadata({ [metaObj.key]: value });
    }
  }, [sId, currentStep, actions, state.metadata]);

  // --- 1. Extracted Hooks for State Management ---
  const {
    uscisCredentials,
    ceacCredentials,
    courierCredentials,
    isWalletFormOpen,
    setIsWalletFormOpen,
    isWalletViewOpen,
    setIsWalletViewOpen,
    walletPortalType,
    setWalletPortalType,
    walletMode,
    setWalletMode,
    isCeacModalOpen,
    setIsCeacModalOpen,
    handleSaveCredentials,
    handleDeleteCredentials,
    handleRevealPassword,
    handleRevealAnswer,
    isSubmittingCreds,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
  } = usePortalWallet({ sId, isCompleted, actions });

  const {
    showQuiz,
    setShowQuiz,
    quizScreenIdx,
    setQuizScreenIdx,
    quizAnswers,
    setQuizAnswers,
    quizResult,
    setQuizResult,
    isLocked,
    setIsLocked,
    handleNextQuiz,
    handleConfirmation,
  } = useFilingQuiz({
    currentStep,
    isCompleted,
    actions,
    handleToggleComplete,
    metadata: state.metadata,
  });

  const {
    jsCount,
    setJsCount,
    hhCount,
    setHhCount,
    hhRelationships,
    setHhRelationships,
    hhDocsStatus,
    setHhDocsStatus,
    isSponsorshipCalcOpen,
    setIsSponsorshipCalcOpen,
    sponsorshipResult,
  } = useSponsorship({ metadata: state.metadata });

  // --- 2. Remaining Local State ---
  const [isLaunched, setIsLaunched] = useState(false);

  // Guarded upload — checks entitlement before opening the vault upload modal
  const guardedOpenUploadModal = useCallback(
    (defId: string) => {
      if (!stepEntitlement.guard()) return;
      openUploadModal(defId);
    },
    [stepEntitlement, openUploadModal]
  );

  // NVC Fee States
  const [isNvcFeeModalOpen, setIsNvcFeeModalOpen] = useState(false);
  const nvcFeeData = state.metadata.nvcFeeStatus || {
    aos: "Not Started",
    iv: "Not Started",
    date: "",
    note: "",
  };

  // Civil Documents States
  const [activeCivilDoc, setActiveCivilDoc] = useState<any>(null);
  const [isCivilDocGuideOpen, setIsCivilDocGuideOpen] = useState(false);
  const [docGuideContext, setDocGuideContext] = useState<"civil" | "gathering">("civil");
  const civilDocsStatus = (state.metadata.civilDocsStatus as Record<string, string>) || {};
  const gatheringDocsStatus = (state.metadata.gatheringDocsStatus as Record<string, string>) || {};

  // Financial Documents States (Step 6)
  const [activeFinancialDoc, setActiveFinancialDoc] = useState<any>(null);
  const [isFinancialDocGuideOpen, setIsFinancialDocGuideOpen] = useState(false);
  const guardedSetIsFinancialDocGuideOpen = useCallback(
    (open: boolean) => {
      if (open && !stepEntitlement.guard()) return;
      setIsFinancialDocGuideOpen(open);
    },
    [stepEntitlement]
  );
  const financialDocsStatus = (state.metadata.financialDocsStatus as Record<string, string>) || {};

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialIdx, setTutorialIdx] = useState(0);
  const [tutorialPath, setTutorialPath] = useState<"household_member" | "joint_sponsor" | null>(
    null
  );
  const [useCeacGuideData, setUseCeacGuideData] = useState(false); // Flag for Start CEAC Guide button

  // Household Member Builder States (Step 7)
  const [activeHhDoc, setActiveHhDoc] = useState<any>(null);
  const [isHhDocGuideOpen, setIsHhDocGuideOpen] = useState(false);

  // Sponsorship Calculator State

  // Selected scenario for Step 6 (Gather Financial Documents)
  const [selectedScenario, setSelectedScenario] = useState<string>("pet-only");

  // Step 2.8 Review & Submit States
  const [isSubmissionGuideOpen, setIsSubmissionGuideOpen] = useState(false);
  const [submissionGuideIdx, setSubmissionGuideIdx] = useState(0);
  const initialSubmissionChecklist = (state.metadata.submissionChecklistStatus as Record<
    string,
    boolean
  >) || {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  };
  const [submissionChecklistStatus, setSubmissionChecklistStatus] = useState<
    Record<string, boolean>
  >(initialSubmissionChecklist);

  const [submissionSaved, setSubmissionSaved] = useState(state.metadata.submissionSaved === true);
  const [submissionDate, setSubmissionDate] = useState(
    (state.metadata.submissionDate as string) || ""
  );

  // Citations Modal State
  const [isCitationsModalOpen, setIsCitationsModalOpen] = useState(false);

  // Step 2.10 DQ Recording States
  const [dqSaved, setDqSaved] = useState(state.metadata.dqSaved === true);
  const [dqDate, setDqDate] = useState((state.metadata.dqDate as string) || "");
  const [dqCategory, setDqCategory] = useState("IR-1");
  const [dqPost, setDqPost] = useState((state.metadata.dqPost as string) || "");
  const [dqCountry, setDqCountry] = useState((state.metadata.dqCountry as string) || "Pakistan");

  // Step 3.1 Medical Exam States
  const [medSaved, setMedSaved] = useState(state.metadata.med_appt_saved === "true");
  const [medDate, setMedDate] = useState((state.metadata.med_date as string) || "");
  const [medTime, setMedTime] = useState((state.metadata.med_time as string) || "");
  const [medClinic, setMedClinic] = useState((state.metadata.med_clinic as string) || "");
  const [isMedWizardOpen, setIsMedWizardOpen] = useState(false);
  const [medWizardMode, setMedWizardMode] = useState<"service" | "guide" | "">("");
  const [medWizardStep, setMedWizardStep] = useState(0);

  // Step 3.2 Polio Certificate States
  const [polioLaunched, setPolioLaunched] = useState(state.metadata.polio_launched === "true");
  const [polioChecks, setPolioChecks] = useState<boolean[]>(
    (state.metadata.polio_checks as boolean[]) || [false, false, false]
  );
  const [isPolioGuideOpen, setIsPolioGuideOpen] = useState(false);
  const [polioGuideStep, setPolioGuideStep] = useState(0);

  // Step 3.3 Police Clearance Certificate States
  const [pccSaved, setPccSaved] = useState(state.metadata.pcc_saved === "true");

  // States
  const [interviewSaved, setInterviewSaved] = useState(state.metadata.interviewSaved === true);
  const [interviewDate, setInterviewDate] = useState(
    (state.metadata.interviewDate as string) || ""
  );
  const [letterDate, setLetterDate] = useState((state.metadata.letterDate as string) || "");
  const [consulateLocation, setConsulateLocation] = useState(
    (state.metadata.consulateLocation as string) || "Islamabad"
  );

  // Step 3.7 Interview Prep States
  const [isPrepLaunched, setIsPrepLaunched] = useState(state.metadata.isPrepLaunched === "true");
  const [pccReceived, setPccReceived] = useState(state.metadata?.pcc_received === "true");

  // Step 3.8 Interview Day States
  const [isInterviewDayTutOpen, setIsInterviewDayTutOpen] = useState(false);
  const [interviewDayTutIdx, setInterviewDayTutIdx] = useState(0);

  // Step 3.9 Administrative Processing States
  // Step 1.17 Approval Notice States
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isApprovalGuideOpen, setIsApprovalGuideOpen] = useState(false);
  const [approvalGuideStep, setApprovalGuideStep] = useState(0);
  const [approvalDetails, setApprovalDetails] = useState(() => {
    return (
      state.metadata.approvalDetails || {
        approvalDate: "",
        receiptNumber: "",
        priorityDate: "",
      }
    );
  });
  const [isApprovalSaved, setIsApprovalSaved] = useState(state.metadata.approvalSaved === "true");

  // --- STEP 3.4 (DOCUMENT GATHERING) STATE ---
  const [gatheringStatus, setGatheringStatus] = useState<
    Record<string, "not-started" | "in-progress" | "reviewed">
  >(() => {
    try {
      return JSON.parse(state.metadata?.gathering_status || "{}");
    } catch {
      return {};
    }
  });

  const [isGatheringGuideOpen, setIsGatheringGuideOpen] = useState(false);
  const [selectedGatheringItem, setSelectedGatheringItem] = useState<DocumentGatheringItem | null>(
    null
  );
  const [gatheringGuideStep, setGatheringGuideStep] = useState(0);

  // --- UTILS & DERIVED ---
  const [pccData, setPccData] = useState({
    receipt: (state.metadata.pcc_receipt as string) || "",
    track: (state.metadata.pcc_track as string) || "",
    date: (state.metadata.pcc_date as string) || "",
  });
  const [isPccOverlayOpen, setIsPccOverlayOpen] = useState(false);
  const [pccOverlayMode, setPccOverlayMode] = useState<"service" | "guide" | "">("");
  const [pccOverlayStep, setPccOverlayStep] = useState(0);

  // Step 3.5 Medical Guide States
  const [isMedicalGuideOpen, setIsMedicalGuideOpen] = useState(false);
  const [medicalGuideIdx, setMedicalGuideIdx] = useState(0);

  // Step 3.6 Courier Registration Guide States
  const [isCourierGuideOpen, setIsCourierGuideOpen] = useState(false);
  const [courierGuideIdx, setCourierGuideIdx] = useState(0);

  // Sync selectedScenario with sponsorshipResult once on load
  useEffect(() => {
    if (sponsorshipResult) {
      if (sponsorshipResult.needsHouseholdMember && sponsorshipResult.needsJointSponsor) {
        setSelectedScenario("pet-hm-js");
      } else if (sponsorshipResult.jointSponsorCount === 2) {
        setSelectedScenario("pet-js2");
      } else if (sponsorshipResult.jointSponsorCount === 1) {
        setSelectedScenario("pet-js1");
      } else if (sponsorshipResult.needsHouseholdMember) {
        setSelectedScenario("pet-hm");
      } else {
        setSelectedScenario("pet-only");
      }
    }
  }, [sponsorshipResult]);

  // Sync household document status with metadata
  useEffect(() => {
    if (state.metadata.hhDocsStatus) {
      setHhDocsStatus(state.metadata.hhDocsStatus as Record<string, string>);
    }
  }, [state.metadata.hhDocsStatus, setHhDocsStatus]);

  // Sync household counts and relationships back to metadata
  useEffect(() => {
    actions.updateMetadata({ jsCount, hhCount, hhRelationships });
  }, [jsCount, hhCount, hhRelationships, actions]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- SYNC TOOL STATES FROM METADATA ---

  // DQ Recording Sync
  useEffect(() => {
    setDqSaved(state.metadata.dqSaved === true);
    setDqDate(state.metadata.dqDate || "");
    setDqCategory(state.metadata.dqCategory || "");
    setDqPost(state.metadata.dqPost || "");
    setDqCountry(state.metadata.dqCountry || "Pakistan");
  }, [
    state.metadata.dqSaved,
    state.metadata.dqDate,
    state.metadata.dqCategory,
    state.metadata.dqPost,
    state.metadata.dqCountry,
  ]);

  // Medical Exam Sync
  useEffect(() => {
    setMedSaved(state.metadata.med_appt_saved === "true");
    setMedDate(state.metadata.med_date || "");
    setMedTime(state.metadata.med_time || "");
    setMedClinic(state.metadata.med_clinic || "");
  }, [
    state.metadata.med_appt_saved,
    state.metadata.med_date,
    state.metadata.med_time,
    state.metadata.med_clinic,
  ]);

  // Appointment Received Sync
  useEffect(() => {
    setInterviewSaved(state.metadata.interviewSaved === true);
    setInterviewDate(state.metadata.interviewDate || "");
    setLetterDate(state.metadata.letterDate || "");
    setConsulateLocation(state.metadata.consulateLocation || "Islamabad");
  }, [
    state.metadata.interviewSaved,
    state.metadata.interviewDate,
    state.metadata.letterDate,
    state.metadata.consulateLocation,
  ]);

  // Polio Certificate Sync
  useEffect(() => {
    setPolioLaunched(state.metadata.polio_launched === "true");
    if (state.metadata.polio_checks) {
      setPolioChecks(state.metadata.polio_checks as boolean[]);
    }
  }, [state.metadata.polio_launched, state.metadata.polio_checks]);

  // Police Clearance Sync
  useEffect(() => {
    setPccSaved(state.metadata.pcc_saved === "true");
    setPccData({
      receipt: state.metadata.pcc_receipt || "",
      track: state.metadata.pcc_track || "",
      date: state.metadata.pcc_date || "",
    });
    setPccReceived(state.metadata.pcc_received === "true");
  }, [
    state.metadata.pcc_saved,
    state.metadata.pcc_receipt,
    state.metadata.pcc_track,
    state.metadata.pcc_date,
    state.metadata.pcc_received,
  ]);

  // Gathering Checklist Sync
  useEffect(() => {
    if (state.metadata.gathering_status) {
      try {
        setGatheringStatus(JSON.parse(state.metadata.gathering_status));
      } catch {
        console.error("Failed to sync gathering status");
      }
    }
  }, [state.metadata.gathering_status]);

  // Retrieve Medical tool data for Step 3.5 overlay
  const medicalToolData = useMemo(() => {
    if (!chapters) return null;
    for (const ch of chapters) {
      const step = ch.steps?.find((s: any) => s.step_key === "step_3_5");
      if (step?.tool_data) return step.tool_data;
    }
    return null;
  }, [chapters]);

  // Retrieve Courier tool data (search for any step that exposes a courier tool)
  const courierToolData = useMemo(() => {
    if (!chapters) return null;
    for (const ch of chapters) {
      const step = ch.steps?.find((s: any) => s.tool_data?.type === "courier_registration");
      if (step?.tool_data) return step.tool_data;
    }
    return null;
  }, [chapters]);

  const activeStepsInChapter = useMemo(() => {
    if (!currentChapter) return [];
    return getActiveStepsForStage(data, state.currentStage ?? 0, state.metadata, state.filingType);
  }, [data, currentChapter, state.currentStage, state.metadata, state.filingType]);

  // (removed duplicate declarations, see above)

  const [receiptGuideSteps, setReceiptGuideSteps] = React.useState<any[]>([]);
  React.useEffect(() => {
    import("@/data/receipt-guide-steps.json").then((mod) => {
      setReceiptGuideSteps(
        mod.default.map((step: any) => ({
          ...step,
          screenshot: "/assets/images/placeholder-ss.png",
        }))
      );
    });
  }, []);

  const [rcptUiState, setRcptUiState] = React.useState<"waiting" | "register" | "tracked">(
    "waiting"
  );
  const [rcptManual, setRcptManual] = React.useState({
    receipt: "",
    noticeDate: "",
    priorityDate: "",
    caseLabel: "",
  });

  // Sync with metadata on mount
  React.useEffect(() => {
    if (state.metadata?.uscis_receipt_number) {
      setRcptManual((prev) => ({
        ...prev,
        receipt: state.metadata.uscis_receipt_number,
        noticeDate: state.metadata.uscis_notice_date || "",
        priorityDate: state.metadata.uscis_priority_date || "",
      }));

      if (state.metadata.uscis_tracking_enabled) {
        setRcptUiState("tracked");
      }
    }
  }, [
    state.metadata.uscis_notice_date,
    state.metadata.uscis_priority_date,
    state.metadata.uscis_receipt_number,
    state.metadata.uscis_tracking_enabled,
  ]);

  // --- CUSTOM RENDER FOR STEP 11 & 12 ---
  let customRenderer: React.ReactElement | null = null;
  const journeyId: string = state.backendId ?? "";
  if (sId === "step_1_15" && currentStep.tool_data) {
    customRenderer = (
      <RegisterReceiptStep
        tool={currentStep.tool_data}
        state={state}
        actions={actions}
        journeyId={journeyId}
      />
    );
  } else if (sId === "step_1_16" && currentStep.tool_data) {
    customRenderer = (
      <StepLockedContent stepKey={sId} mode="overlay">
        <TrackCaseStatusStep
          tool={currentStep.tool_data}
          state={state}
          actions={actions}
          journeyId={journeyId}
        />
      </StepLockedContent>
    );
  }

  const allActiveSteps = useMemo(
    () => getAllActiveSteps(data, state.metadata, state.filingType),
    [data, state.metadata, state.filingType]
  );

  const globalIdx = allActiveSteps.findIndex((s) => (s.step_key || (s as any).id) === sId);
  const localIdx = activeStepsInChapter.findIndex((s: any) => (s.step_key || s.id) === sId);
  const chapterProg = useMemo(
    () => getStageProgress(data, state.currentStage, state),
    [data, state]
  );

  const prevStep = globalIdx > 0 ? allActiveSteps[globalIdx - 1] : null;
  const nextStep = globalIdx < allActiveSteps.length - 1 ? allActiveSteps[globalIdx + 1] : null;

  // Use the percentage from journeyHelpers to match ChapterView
  const progressPct = chapterProg.pct;

  const nextStepInfo = useMemo(() => {
    if (!nextStep) return null;
    const nsId = nextStep.step_key || (nextStep as any).id;
    const activeChapters = data.chapters || (data as any).stages;
    for (let cIdx = 0; cIdx < activeChapters.length; cIdx++) {
      const activeSteps = getActiveStepsForStage(data, cIdx, state.metadata, state.filingType);
      const lIdx = activeSteps.findIndex((s: any) => (s.step_key || s.id) === nsId);
      if (lIdx !== -1) return { chapterIdx: cIdx, localIdx: lIdx };
    }
    return null;
  }, [nextStep, data, state.metadata, state.filingType]);

  const nextStepLock = useMemo(() => {
    if (!nextStep || !nextStepInfo) return { isLocked: false, requiredPlan: null };
    const nsId = nextStep.step_key || (nextStep as any).id;
    return getStepLockStatus(nsId, plan.tier, nextStepInfo.chapterIdx, nextStepInfo.localIdx);
  }, [nextStep, nextStepInfo, plan.tier]);

  const prevStepInfo = useMemo(() => {
    if (!prevStep) return null;
    const psId = prevStep.step_key || (prevStep as any).id;
    const activeChapters = data.chapters || (data as any).stages;
    for (let cIdx = 0; cIdx < activeChapters.length; cIdx++) {
      const activeSteps = getActiveStepsForStage(data, cIdx, state.metadata, state.filingType);
      const lIdx = activeSteps.findIndex((s: any) => (s.step_key || s.id) === psId);
      if (lIdx !== -1) return { chapterIdx: cIdx, localIdx: lIdx };
    }
    return null;
  }, [prevStep, data, state.metadata, state.filingType]);

  const prevStepLock = useMemo(() => {
    if (!prevStep || !prevStepInfo) return { isLocked: false, requiredPlan: null };
    const psId = prevStep.step_key || (prevStep as any).id;
    return getStepLockStatus(psId, plan.tier, prevStepInfo.chapterIdx, prevStepInfo.localIdx);
  }, [prevStep, prevStepInfo, plan.tier]);

  useEffect(() => {
    const scrollContainer = document.querySelector(".scrollbar-hide");
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }, [sId]);

  useEffect(() => {
    setIsLocked(state.metadata.filingMethodConfirmed || false);
  }, [state.metadata.filingMethodConfirmed]);

  // Initialize Document Vault Config — runs on mount, no user.id dependency
  // The API uses the session cookie to get real user_id, so userId here is just a local label
  useEffect(() => {
    const initVault = async () => {
      // Run these in parallel to speed up initialization
      Promise.all([
        setConfigVault({
          userId: user?.id || "session",
          visaCategory: "IR-1",
          caseId: (state.metadata.caseId as string) || "ARACHNIE-IR1",
          petitionerName: (state.metadata.petitionerName as string) || "Petitioner",
          beneficiaryName: (state.metadata.beneficiaryName as string) || "Beneficiary",
          jointSponsorName: (state.metadata.jointSponsorName as string) || "",
          scenarioFlags: {},
        }),
        reloadDocuments(),
      ]);
    };
    initVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — config is set immediately, no race condition

  // Disable body scroll when overlays are open
  useEffect(() => {
    if (
      isTutorialOpen ||
      selectedGuideId ||
      showQuiz ||
      isCivilDocGuideOpen ||
      isNvcFeeModalOpen ||
      isCeacModalOpen ||
      isSubmissionGuideOpen ||
      isCitationsModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    isTutorialOpen,
    selectedGuideId,
    showQuiz,
    isCeacModalOpen,
    isNvcFeeModalOpen,
    isCivilDocGuideOpen,
    isSubmissionGuideOpen,
    isCitationsModalOpen,
  ]);

  const handleSaveNvcFee = (newData: any) => {
    actions.updateMetadata({ nvcFeeStatus: newData });
    setIsNvcFeeModalOpen(false);
    showToast("Payment status saved to your Portal Wallet!", "success");
    // Auto-complete step if both are paid
    if (newData.aos === "Paid" && newData.iv === "Paid") {
      if (!isCompleted) handleToggleComplete();
    }
  };

  const handleMarkDocReviewed = (docId: string) => {
    if (docGuideContext === "gathering") {
      const next = { ...gatheringDocsStatus, [docId]: "reviewed" };
      actions.updateMetadata({ gatheringDocsStatus: next });
      if (sId === "step_3_6") {
        const tool = currentStep.tool_data;
        if (tool?.doc_gathering) {
          const total = tool.doc_gathering.groups.reduce(
            (acc: number, g: any) => acc + g.items.length,
            0
          );
          const reviewedCount = Object.values(next).filter((s) => s === "reviewed").length;
          if (reviewedCount >= total && !isCompleted) handleToggleComplete();
        }
      }
      return;
    }

    const next = { ...civilDocsStatus, [docId]: "reviewed" };
    actions.updateMetadata({ civilDocsStatus: next });

    // Auto-complete step 2.4 if all are reviewed
    if (sId === "step_2_4") {
      const tool = currentStep.tool_data;
      if (tool?.doc_list) {
        const total = tool.doc_list.groups.reduce((acc: number, g: any) => acc + g.items.length, 0);
        const reviewedCount = Object.values(next).filter((s) => s === "reviewed").length;
        if (reviewedCount >= total) {
          if (!isCompleted) handleToggleComplete();
        }
      }
    }
  };

  // Auto-complete step_1_17 when approval notice details are saved
  useEffect(() => {
    if (sId === "step_1_17" && isApprovalSaved && !isCompleted) {
      handleToggleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sId, isApprovalSaved]);

  const handleNavigate = (stepId: string) => {
    // Sequential navigation guard: Step 1.1 -> Step 1.2
    if (stepId === "step_1_2" && !state.completedSteps.has("step_1_1")) {
      setShowPrerequisiteModal(true);
      return;
    }
    const activeChapters = data.chapters || (data as any).stages;
    for (let sIdx = 0; sIdx < activeChapters.length; sIdx++) {
      const spIdx = activeChapters[sIdx].steps.findIndex(
        (s: any) => (s.step_key || s.id) === stepId
      );
      if (spIdx !== -1) {
        actions.setStage(sIdx);
        actions.setCurrentStep(spIdx);
        return;
      }
    }
  };

  const handleSaveApUpdate = (newData: any) => {
    actions.updateMetadata({ apUpdateStatus: newData });
    setIsApUpdateModalOpen(false);
    showToast("AP status saved!", "success");
  };

  const renderDocActionModal = () => {
    return (
      <DocActionModal
        isOpen={docActionModal.isOpen}
        onClose={() => setDocActionModal({ ...docActionModal, isOpen: false })}
        docActionModal={docActionModal}
        setDocActionModal={setDocActionModal}
        plan={plan}
        docActionUpgradeFeature={upgradeModalFeature}
        setDocActionUpgradeFeature={setUpgradeModalFeature}
        sId={sId}
      />
    );
  };

  const renderCitationsSection = () => {
    const citations = STEP_CITATIONS[sId];
    if (!citations || citations.length === 0) return null;

    return (
      <div className="mt-4 mb-7 w-full max-w-[660px] mx-auto animate-in fade-in duration-500">
        <div className="bg-[#fafcff]/80 backdrop-blur-xs border border-[#d0e4f7] rounded-[20px] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e1eefc]">
            <Book className="h-[16px] w-[16px] text-primary shrink-0" strokeWidth={2.5} />
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#3a4f63]">
              Official References & Citations
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {citations.map((cite, index) => (
              <a
                key={index}
                href={cite.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-[14px] bg-white border border-[#e1eefc] hover:border-primary hover:shadow-xs group transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] sm:text-[14px] font-bold text-[#0f1f38] group-hover:text-primary transition-colors">
                    {cite.text}
                  </span>
                  {/* <span className="text-[11px] sm:text-[11.5px] text-[#6b8097] font-medium break-all">
                    {cite.link}
                  </span> */}
                </div>
                <ExternalLink
                  className="h-4 w-4 text-[#6b8097] group-hover:text-primary transition-colors shrink-0 ml-3"
                  strokeWidth={2}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderToolStep = () => {
    const tool = currentStep.tool_data as any;
    if (!tool) return null;

    if (tool.type === "awaiting_review") {
      return <AwaitingReviewStep data={AWAITING_REVIEW_DATA} />;
    }

    // Theme detection based on icon or ID
    const isBeneficiaryTheme =
      tool.launch_module?.icon === "user" || sId === "step_1_5" || sId === "step_1_2_b";
    const accentColor = "#2f6fd4";
    // const accentColor = isBeneficiaryTheme ? "#0f7373" : "#2f6fd4";
    // Background colour: explicit bg_color wins, then beneficiary/default theme
    const launchBg = tool.launch_module?.bg_color ?? (isBeneficiaryTheme ? "#12192e" : "#0e1e38");

    // Accent stripe: data-driven via stripe_variant
    const stripeGradient =
      tool.launch_module?.stripe_variant === "gold"
        ? "linear-gradient(90deg, #2f6fd4 0%, #d4a82f 55%, transparent 100%)"
        : tool.launch_module?.stripe_variant === "green"
          ? "linear-gradient(90deg, #2f6fd4 0%, #15744f 60%, transparent 100%)"
          : isBeneficiaryTheme
            ? "linear-gradient(90deg, #2f6fd4 0%, #20a8a8 55%, transparent 100%)"
            : "linear-gradient(90deg, #2f6fd4 0%, #6aa8f0 60%, transparent 100%)";

    const IconComponent =
      tool.launch_module?.icon === "form"
        ? FileText
        : tool.launch_module?.icon === "calc"
          ? Scale
          : tool.launch_module?.icon === "search"
            ? Search
            : tool.launch_module?.icon === "user"
              ? User
              : tool.launch_module?.icon === "shield"
                ? ShieldCheck
                : tool.launch_module?.icon === "portal"
                  ? ExternalLink
                  : tool.launch_module?.icon === "upload"
                    ? Upload
                    : tool.launch_module?.icon === "payment"
                      ? CreditCard
                      : tool.launch_module?.icon === "mail"
                        ? Mail
                        : tool.launch_module?.icon === "file"
                          ? FileText
                          : tool.launch_module?.icon === "check"
                            ? CheckSquare
                            : CheckCircle;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-740 flex flex-col items-center w-full min-h-full">
        {/* Chapter 1 case strength — side panel + inline step alerts (all in one) */}
        <Chapter1HealthPanel
          currentStep={currentStep}
          chapters={chapters}
          state={state}
          uploadedDocuments={uploadedDocuments}
        />

        {/* Page Shell */}
        <div className="w-full max-w-[680px] px-[24px] pb-10 flex flex-col">
          {/* Step Header */}
          <StepHeader
            stepNumber={localIdx + 1}
            chapterNumber={currentChapter?.chapter_number || state.currentStage + 1}
            chapterName={currentChapter?.chapter_name || currentChapter?.name || ""}
            stepName={currentStep.step_name}
            stepDescription={currentStep.step_description}
            isBeneficiaryTheme={isBeneficiaryTheme}
          />

          {/* Entitlement Banner — shown when step features are locked for current plan */}
          <StepEntitlementBanner stepKey={sId} />

          {/* UpgradeModal — triggered by stepEntitlement.guard() when user clicks locked content */}
          {stepEntitlement.upgradeModalFeature && (
            <UpgradeModal
              feature={stepEntitlement.upgradeModalFeature}
              onClose={stepEntitlement.closeUpgradeModal}
            />
          )}

          {/* Companion Context Badge (Step 5 Specific) */}
          {(sId === "step_1_5" || sId === "step_1_2_b") && (
            <div className="flex items-center gap-[9px] mb-6">
              <div className="flex-1 h-px bg-linear-to-r from-[#d0e4f7] to-transparent" />
              <div className="inline-flex items-center gap-[6px] bg-[#e6f6f6] border border-[#9fd8d8] rounded-full px-[13px] py-[5px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#0f7373]" />
                <span className="text-[11px] font-semibold text-[#0f7373] tracking-[0.04em]">
                  Companion form to I-130 · Beneficiary spouse focus
                </span>
              </div>
              <div className="flex-1 h-px bg-linear-to-l from-[#d0e4f7] to-transparent" />
            </div>
          )}

          {/* Meta Chips */}
          {tool.chips && (
            <div className="flex flex-wrap gap-[7px] mb-8">
              {tool.chips.map((chip: any, i: number) => (
                <span
                  key={i}
                  className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border ${
                    chip.type === "role" || chip.role === "role"
                      ? isBeneficiaryTheme
                        ? "bg-[#e9f4ee] text-[#1a5f3f] border-[#b0dcc0]"
                        : "bg-[#e8f1fb] text-primary/80 border-[#d0e4f7]"
                      : chip.type === "tool" || chip.tool === "tool"
                        ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                        : chip.type === "pay"
                          ? "bg-[#fffbec] text-[#c49a0a] border-[#e8d47a]"
                          : chip.type === "final" || chip.type === "green"
                            ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                            : chip.type === "purple"
                              ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                              : chip.type === "sky"
                                ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                                : chip.type === "gold"
                                  ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                                  : chip.type === "uscis" ||
                                      chip.uscis === "uscis" ||
                                      chip.type === "path"
                                    ? "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]"
                                    : "bg-[#fafcff] text-[#6b8097] border-[#d0e4f7]"
                  }`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          {/* ALERT NOTE (Step 3 SPECIFIC) */}
          {tool.alert_note && (
            <div className="flex items-center gap-[10px] bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] padding-12 px-[16px] py-[12px] mb-[28px]">
              <Zap className="h-4 w-4 text-amber-500" />
              <div className="text-[13px] text-[#8a6200] leading-normal">{tool.alert_note}</div>
            </div>
          )}

          {/* Return Note (Success Banner) */}
          {isLaunched && (
            <div className="mb-[20px] bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-[14px_18px] flex items-start gap-[12px] animate-in slide-in-from-top-2 duration-300">
              <div className="text-[15px] mt-[1px] text-[#15744f] shrink-0">✓</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#15744f] mb-[2px]">
                  {tool.launch_module?.return_note?.title || "Tool launched in a new tab"}
                </div>
                <div className="text-[12px] text-[#3a4f63] leading-normal">
                  {tool.launch_module?.return_note?.body || "Complete the process and return here."}
                </div>
              </div>
            </div>
          )}

          {/* SPONSORSHIP CALCULATOR TOOL RENDERING */}
          {tool.type === "sponsorship_calculator" && (
            <SponsorshipModule
              sponsorshipResult={sponsorshipResult}
              onOpenCalc={() => {
                if (!stepEntitlement.guard()) return;
                setIsSponsorshipCalcOpen(true);
              }}
              tool={tool}
              guard={stepEntitlement.guard}
            />
          )}

          {/* DQ RECORDING TOOL RENDERING */}
          {tool.type === "dq_recording" && (
            <DqRecordingTool
              actions={actions}
              dqState={{
                dqSaved,
                setDqSaved,
                dqDate,
                setDqDate,
                dqCategory,
                setDqCategory,
                dqPost,
                setDqPost,
                dqCountry,
                setDqCountry,
              }}
              guard={stepEntitlement.guard}
            />
          )}

          {/* INTERVIEW SCHEDULING (Step 2.11 SPECIFIC) */}
          {tool.type === "interview_scheduling" && (
            <InterviewSchedulingTool
              tool={tool}
              state={state}
              actions={actions}
              guard={stepEntitlement.guard}
            />
          )}

          {tool.type === "approval_notice" && (
            <ApprovalNoticeTool
              state={state}
              actions={actions}
              approvalState={{
                isApprovalModalOpen,
                setIsApprovalModalOpen,
                isApprovalGuideOpen,
                setIsApprovalGuideOpen,
                approvalGuideStep,
                setApprovalGuideStep,
                approvalDetails,
                setApprovalDetails,
                isApprovalSaved,
                setIsApprovalSaved,
              }}
              guard={stepEntitlement.guard}
              onBack={onBack}
              onSelectChapter={onSelectChapter}
              onSelectStep={onSelectStep}
            />
          )}

          {tool.type === "appointment_received" && (
            <AppointmentReceivedTool
              actions={actions}
              interviewState={{
                interviewSaved,
                setInterviewSaved,
                interviewDate,
                setInterviewDate,
                letterDate,
                setLetterDate,
                consulateLocation,
                setConsulateLocation,
              }}
              state={state}
              guard={stepEntitlement.guard}
            />
          )}

          {tool.type === "medical_exam" && (
            <StepLockedContent stepKey={sId} mode="overlay">
              <MedicalExamTool
                actions={actions}
                medState={{
                  medSaved,
                  setMedSaved,
                  medDate,
                  setMedDate,
                  medTime,
                  setMedTime,
                  medClinic,
                  setMedClinic,
                  isMedWizardOpen,
                  setIsMedWizardOpen,
                  medWizardStep,
                  setMedWizardStep,
                  medWizardMode,
                  setMedWizardMode,
                }}
                state={state}
                guard={stepEntitlement.guard}
              />
            </StepLockedContent>
          )}

          {tool.type === "polio_certificate" && (
            <StepLockedContent stepKey={sId} mode="overlay">
              <PolioCertificateTool
                actions={actions}
                polioState={{
                  polioLaunched,
                  setPolioLaunched,
                  isPolioGuideOpen,
                  setIsPolioGuideOpen,
                  polioGuideStep,
                  setPolioGuideStep,
                  polioChecks,
                  setPolioChecks,
                }}
                state={state}
                guard={stepEntitlement.guard}
              />
            </StepLockedContent>
          )}

          {tool.type === "police_clearance" && (
            <PoliceClearanceTool
              actions={actions}
              pccState={{
                pccSaved,
                setPccSaved,
                pccReceived,
                setPccReceived,
                pccData,
                setPccData,
                isPccOverlayOpen,
                setIsPccOverlayOpen,
                pccOverlayStep,
                setPccOverlayStep,
                pccOverlayMode,
                setPccOverlayMode,
              }}
              openUploadModal={openUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
              uploadedDocuments={uploadedDocuments}
              state={state}
              guard={stepEntitlement.guard}
            />
          )}

          {/* FINANCIAL CHECKLIST (Step 2.6 SPECIFIC) */}
          {tool.type === "financial_checklist" && (
            // <StepLockedContent stepKey={sId} mode="overlay">
            <FinancialChecklistTool
              selectedScenario={selectedScenario}
              setSelectedScenario={setSelectedScenario}
              financialDocsStatus={financialDocsStatus}
              uploadedDocuments={uploadedDocuments}
              isReloadingDocs={isReloadingDocs}
              isDeletingIds={isDeletingIds}
              openUploadModal={guardedOpenUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
              setDocActionModal={setDocActionModal}
              updateMetadata={actions.updateMetadata}
              setActiveFinancialDoc={setActiveFinancialDoc}
              setIsFinancialDocGuideOpen={guardedSetIsFinancialDocGuideOpen}
              guard={stepEntitlement.guard}
            />
            // </StepLockedContent>
          )}

          {/* HOUSEHOLD MEMBER BUILDER (Step 2.7 SPECIFIC) */}
          {tool.type === "household_member" && (
            <HouseholdSponsorshipTool
              hhCount={hhCount}
              jsCount={jsCount}
              hhRelationships={hhRelationships}
              hhDocsStatus={hhDocsStatus}
              setHhCount={setHhCount}
              setJsCount={setJsCount}
              setHhRelationships={setHhRelationships}
              setHhDocsStatus={setHhDocsStatus}
              updateMetadata={actions.updateMetadata}
              guard={stepEntitlement.guard}
              setUseCeacGuideData={setUseCeacGuideData}
              setTutorialIdx={setTutorialIdx}
              setIsTutorialOpen={setIsTutorialOpen}
              setTutorialPath={setTutorialPath}
              currentStep={currentStep}
              openUploadModal={openUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
              setActiveHhDoc={setActiveHhDoc}
              setIsHhDocGuideOpen={setIsHhDocGuideOpen}
            />
          )}

          {tool.type === "submission_review" && (
            <div className="relative">
              <SubmissionReviewTool
                tool={tool}
                submissionChecklistStatus={submissionChecklistStatus}
                setSubmissionChecklistStatus={setSubmissionChecklistStatus}
                setSubmissionGuideIdx={setSubmissionGuideIdx}
                setIsSubmissionGuideOpen={(open) => {
                  if (!plan.canUse("step_guides")) {
                    setUpgradeModalFeature("step_guides");
                    return;
                  }
                  setIsSubmissionGuideOpen(open);
                }}
                submissionSaved={submissionSaved}
                submissionDate={submissionDate}
                isStatusLocked={!plan.canUse("tracker_reminders")}
                onLockedClick={() => setUpgradeModalFeature("tracker_reminders")}
                onSave={(data) => {
                  if (!plan.canUse("tracker_reminders")) {
                    setUpgradeModalFeature("tracker_reminders");
                    return;
                  }
                  setSubmissionSaved(data.saved);
                  setSubmissionDate(data.date);
                  actions.updateMetadata({
                    submissionSaved: data.saved,
                    submissionDate: data.date,
                  });
                }}
                guard={stepEntitlement.guard}
              />
            </div>
          )}

          {/* AWAITING NVC REVIEW (Step 2.9 SPECIFIC) */}
          {tool.type === "awaiting_review" && <AwaitingReviewStep data={AWAITING_REVIEW_DATA} />}

          {/* GATHER ORIGINAL DOCUMENTS (Step 3.6) */}
          {tool.type === "gathering_checklist" && (
            <DocListSection
              groups={tool.doc_gathering?.groups || []}
              docsStatus={gatheringStatus}
              uploadedDocuments={uploadedDocuments}
              isDeletingIds={isDeletingIds}
              isReloadingDocs={isReloadingDocs}
              getVaultId={(item) => mapDocumentNameToId(item.title)}
              findVaultDoc={(item, docs) =>
                findVaultDocForItem(item.title, mapDocumentNameToId(item.title), docs)
              }
              progressLabel="packed"
              onItemClick={(item) => {
                setDocActionModal({
                  isOpen: true,
                  doc: { ...item, name: item.title },
                  title: item.title,
                  subtitle: item.sub,
                  onReadGuide: () => {
                    setSelectedGatheringItem(item as unknown as DocumentGatheringItem);
                    setIsGatheringGuideOpen(true);
                    if (!gatheringStatus[item.id] || gatheringStatus[item.id] === "not-started") {
                      setGatheringStatus((prev: any) => ({
                        ...prev,
                        [item.id]: "in-progress",
                      }));
                    }
                  },
                  onUpload: () => {
                    if (!stepEntitlement.guard()) return;
                    const defId = mapDocumentNameToId(item.title);
                    if (!ALL_DOCUMENTS.find((d) => d.id === defId)) {
                      console.warn("[upload] Unknown documentDefId:", defId, "for:", item.title);
                      return;
                    }
                    setActiveUploadId(item.id);
                    setActiveUploadType("doc");
                    openUploadModal(defId);
                  },
                });
              }}
              onPreview={(uploadedDocId) =>
                window.open(`/api/documents/${uploadedDocId}/download`, "_blank")
              }
              onDelete={(id, name) => setDocumentToDelete({ id, name })}
            />
          )}

          {/* ATTEND MEDICAL EXAM (Step 3.5 SPECIFIC) */}
          {tool.type === "medical_exam_guide" && (
            <MedicalExamGuideTool
              tool={tool}
              setMedicalGuideIdx={setMedicalGuideIdx}
              setIsMedicalGuideOpen={setIsMedicalGuideOpen}
              guard={stepEntitlement.guard}
            />
          )}

          {/* COURIER REGISTRATION (Step 3.6 SPECIFIC) */}
          {tool.type === "courier_registration" && (
            <CourierRegistrationTool
              tool={tool}
              courierCredentials={courierCredentials}
              setCourierGuideIdx={setCourierGuideIdx}
              setIsCourierGuideOpen={setIsCourierGuideOpen}
              setWalletPortalType={setWalletPortalType}
              setIsWalletViewOpen={setIsWalletViewOpen}
              setWalletMode={setWalletMode}
              setIsWalletFormOpen={setIsWalletFormOpen}
              guard={stepEntitlement.guard}
            />
          )}

          {/* INTERVIEW PREP CONTENT (Step 3.7 SPECIFIC) */}
          {tool.type === "interview_prep" && (
            <InterviewPrepTool
              tool={tool}
              isPrepLaunched={isPrepLaunched}
              setIsPrepLaunched={setIsPrepLaunched}
              guard={stepEntitlement.guard}
            />
          )}

          {/* INTERVIEW DAY CONTENT (Step 3.8 SPECIFIC) */}
          {tool.type === "interview_day" && (
            <InterviewDayTool
              tool={tool}
              setInterviewDayTutIdx={setInterviewDayTutIdx}
              setIsInterviewDayTutOpen={setIsInterviewDayTutOpen}
              guard={stepEntitlement.guard}
            />
          )}

          {/* INTERVIEW OUTCOME CONTENT (Step 3.9 SPECIFIC) */}
          {tool.type === "interview_outcome" && (
            <InterviewOutcomeTool
              tool={tool}
              state={state}
              actions={actions}
              guard={stepEntitlement.guard}
            />
          )}
          {/* VISA ISSUANCE CONTENT (Step 3.10 SPECIFIC) */}
          {tool.type === "visa_issuance" && (
            <TrackVisaIssuanceTool
              tool={tool}
              state={state}
              actions={actions}
              guard={stepEntitlement.guard}
            />
          )}
          {/* INPUT 221(g) CONTENT (Step 3.10b SPECIFIC) */}
          {tool.type === "input_221g" && (
            <Input221gTool
              tool={tool}
              state={state}
              actions={actions}
              guard={stepEntitlement.guard}
            />
          )}

          {/* RESPOND TO 221(g) CONTENT (Step 3.11 SPECIFIC) */}
          {tool.type === "respond_221g" && (
            <Respond221gTool
              tool={tool}
              state={state}
              actions={actions}
              guard={stepEntitlement.guard}
              setDocActionModal={setDocActionModal}
              openUploadModal={openUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
            />
          )}

          {/* ADMINISTRATIVE PROCESSING CONTENT (Step 3.9 SPECIFIC) */}
          {tool.type === "adm_processing" && (
            <AdministrativeProcessingTool
              tool={tool}
              state={state}
              actions={actions}
              guard={stepEntitlement.guard}
            />
          )}

          {/* FALLBACK FOR DOC LISTS (Step 2.4) */}
          {tool.doc_list && (
            <DocListSection
              groups={tool.doc_list.groups}
              docsStatus={civilDocsStatus}
              uploadedDocuments={uploadedDocuments}
              isDeletingIds={isDeletingIds}
              isReloadingDocs={isReloadingDocs}
              getVaultId={(item) => mapDocumentNameToId(item.title)}
              findVaultDoc={(item, docs) =>
                findVaultDocForItem(item.title, mapDocumentNameToId(item.title), docs)
              }
              showTags={true}
              onItemClick={(item) => {
                setDocActionModal({
                  isOpen: true,
                  doc: { ...item, name: item.title },
                  title: item.title,
                  subtitle: item.sub,
                  onReadGuide: () => {
                    if (!stepEntitlement.guard()) return;
                    setActiveCivilDoc(item);
                    setDocGuideContext("civil");
                    setIsCivilDocGuideOpen(true);
                  },
                  onUpload: () => {
                    if (!stepEntitlement.guard()) return;
                    const defId = mapDocumentNameToId(item.title);
                    if (!ALL_DOCUMENTS.find((d) => d.id === defId)) {
                      console.warn("[upload] Unknown documentDefId:", defId, "for:", item.title);
                      return;
                    }
                    setActiveUploadId(item.id);
                    setActiveUploadType("doc");
                    openUploadModal(defId);
                  },
                });
              }}
              onPreview={(uploadedDocId) =>
                window.open(`/api/documents/${uploadedDocId}/download`, "_blank")
              }
              onDelete={(id, name) => setDocumentToDelete({ id, name })}
            />
          )}

          {/* PRIMARY LAUNCH MODULE */}
          {tool.launch_module &&
            tool.type !== "sponsorship_calculator" &&
            tool.type !== "submission_review" &&
            tool.type !== "interview_prep" &&
            tool.type !== "interview_day" &&
            tool.type !== "adm_processing" &&
            tool.type !== "courier_registration" && (
              <div
                className={`relative rounded-[16px] overflow-hidden mb-[20px] ${isChapter1 ? "border" : isChapter2 ? "bg-[var(--rv-ch2-module-bg)] border border-[var(--rv-ch2)]" : "bg-[var(--rv-launch-navy)] border border-white/7"}`}
                style={
                  isChapter1
                    ? {
                        backgroundColor: "var(--rv-ch1-module-bg)",
                        borderColor: "var(--rv-ch1)",
                      }
                    : isChapter2
                      ? {
                          backgroundColor: "var(--rv-ch2-module-bg)",
                          borderColor: "var(--rv-ch2)",
                        }
                      : { backgroundColor: launchBg }
                }
              >
                {/* Accent Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-70"
                  style={{
                    background: isChapter1
                      ? "linear-gradient(90deg, var(--rv-ch1) 0%, var(--rv-ch1-module-bg) 100%)"
                      : isChapter2
                        ? "linear-gradient(90deg, var(--rv-ch2) 0%, var(--rv-ch2-module-bg) 100%)"
                        : stripeGradient,
                  }}
                />

                <div className="p-4 sm:p-6 lg:p-[36px_36px_32px]">
                  {/* Module Header */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] flex items-center justify-center shrink-0 border ${isChapter1 ? "border-[var(--rv-ch1)]" : isChapter2 ? "border-[var(--rv-ch2)]" : "bg-white/[0.055] border-white/10"}`}
                      style={
                        isChapter1
                          ? { backgroundColor: "var(--rv-ch1)" }
                          : isChapter2
                            ? { backgroundColor: "var(--rv-ch2)" }
                            : undefined
                      }
                    >
                      <IconComponent
                        size={20}
                        className={isChapter1 || isChapter2 ? "text-white" : "text-white/75"}
                        strokeWidth={1.6}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-[5px] ${isChapter1 ? "text-[var(--rv-ch1)]" : isChapter2 ? "text-[var(--rv-ch2-text)]" : "text-white/35"}`}
                      >
                        {tool.launch_module.eyebrow || tool.launch_module.label}
                      </div>
                      <h2
                        className={`text-[clamp(18px,4vw,24px)] leading-[1.25] ${isChapter1 ? "text-white" : isChapter2 ? "text-[var(--rv-ch2-text)]" : "text-white/90"}`}
                      >
                        {tool.launch_module.heading || tool.launch_module.title}
                      </h2>
                    </div>
                  </div>

                  <div
                    className={`h-px mb-4 sm:mb-[22px] ${isChapter1 ? "bg-[var(--rv-ch1)]/30" : isChapter2 ? "bg-[var(--rv-ch2)]/30" : "bg-white/9"}`}
                  />

                  {/* Fee Block (Step 9 — Pay Filing Fee) */}
                  {tool.fee_block && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-[16px] bg-white/[0.05] border border-white/[0.09] rounded-[10px] p-3 sm:p-[16px_18px] mb-3 sm:mb-[16px]">
                      <div className="flex flex-col gap-[2px] shrink-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                          {tool.fee_block.label}
                        </div>
                        <div className="text-[28px] sm:text-[32px] font text-white/90 tracking-[-0.02em] leading-none">
                          {tool.fee_block.amount}
                        </div>
                        <div className="text-[11px] text-white/35 mt-[2px]">
                          {tool.fee_block.note}
                        </div>
                      </div>
                      <div className="w-full h-px bg-white/12 sm:w-[1px] sm:h-[48px] shrink-0" />
                      <div className="flex flex-col gap-[6px] flex-1 min-w-0">
                        {tool.fee_block.details.map((d: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-[8px] text-[12px] text-white/55 leading-[1.45]"
                          >
                            <div className="w-[4px] h-[4px] rounded-full bg-[rgba(200,170,100,0.7)] shrink-0 mt-[5px]" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Checklist (Step 10 — Review & Submit) */}
                  {tool.review_checklist && tool.review_checklist.length > 0 && (
                    <div className="flex flex-col gap-3 sm:gap-2 mb-[20px]">
                      {tool.review_checklist.map((item: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-[12px] bg-white/[0.06] border border-white/10 rounded-[10px] p-3 sm:p-[12px_14px]"
                        >
                          <div className="w-[20px] h-[20px] rounded-full bg-[rgba(21,116,79,0.25)] border border-[rgba(21,116,79,0.4)] flex items-center justify-center shrink-0 mt-[1px]">
                            <Check
                              size={11}
                              strokeWidth={2.5}
                              className="text-[rgba(100,220,160,0.9)]"
                            />
                          </div>
                          <div className="text-[12px] sm:text-[13px] text-white/55 leading-[1.45]">
                            {item}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Feature Cues Grid */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-[10px] ${tool.launch_module.button_label ? "mb-4 sm:mb-[26px]" : "mb-0"}`}
                  >
                    {tool.launch_module.features?.map((feat: string, i: number) => (
                      <div
                        key={i}
                        className={`${isChapter1 ? "border" : isChapter2 ? "bg-[var(--rv-ch2-panel)] border border-[var(--rv-ch2)]/30" : "bg-white/6 border border-white/10"} rounded-[10px] p-3 sm:p-[12px_14px] flex items-start gap-2 sm:gap-[10px]`}
                        style={
                          isChapter1
                            ? {
                                backgroundColor: "var(--rv-ch1-feature-bg)",
                                borderColor: "rgba(130,132,191,0.3)",
                              }
                            : isChapter2
                              ? {
                                  backgroundColor: "var(--rv-ch2-feature-bg)",
                                  borderColor: "rgba(82,10,80,0.28)",
                                }
                              : {}
                        }
                      >
                        <div
                          className={`w-[5px] h-[5px] rounded-full mt-[6px] shrink-0 ${
                            isChapter1
                              ? "bg-[var(--rv-ch1)]"
                              : isChapter2
                                ? "bg-[var(--rv-ch2)]"
                                : tool.launch_module.stripe_variant === "gold"
                                  ? "bg-[rgba(212,168,47,0.7)]"
                                  : tool.launch_module.stripe_variant === "green"
                                    ? "bg-[rgba(100,220,160,0.6)]"
                                    : isBeneficiaryTheme
                                      ? "bg-[#20a8a8bf]"
                                      : "bg-[var(--rv-launch-blue)]/70"
                          }`}
                        />
                        <div
                          className={`text-[12px] sm:text-[13px] leading-[1.4] ${isChapter1 ? "text-[var(--rv-ch1-text)]" : isChapter2 ? "text-[var(--rv-ch2-text)]" : "text-white/55"}`}
                        >
                          {feat}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Requirements Info Block (Step 8 only) */}
                  {tool.upload_requirements && tool.upload_requirements.length > 0 && (
                    <div className="mt-3 sm:mt-5 bg-white/5 border border-white/9 rounded-[10px] p-3 sm:p-[14px_16px] mb-4 sm:mb-[26px]">
                      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2 sm:mb-[10px]">
                        USCIS upload requirements
                      </div>
                      <div className="flex flex-col gap-2 sm:gap-[7px]">
                        {tool.upload_requirements?.map((req: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 sm:gap-[10px] text-[12px] sm:text-[13px] text-white/55 leading-[1.45]"
                          >
                            <div className="w-[4px] h-[4px] rounded-full bg-[var(--rv-launch-blue)]/60 shrink-0 mt-[5px]" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Area — only rendered when a button_label is defined */}
                  {(tool.launch_module.button_label || tool.launch_module.buttonText) && (
                    <div className="flex flex-col gap-[11px]">
                      <button
                        onClick={() => {
                          if (!stepEntitlement.guard()) return;
                          if (tool.launch_module.href) {
                            window.open(tool.launch_module.href, "_blank", "noopener,noreferrer");
                            setIsLaunched(true);
                          }
                        }}
                        className={`inline-flex items-center justify-center gap-[10px] w-full p-[14px_16px] sm:p-[16px_28px] rounded-[12px] font-sans text-[14px] sm:text-[15px] font-semibold tracking-[0.01em] transition-all duration-200 group cursor-pointer
                          ${
                            isLaunched && tool.launch_module.return_note
                              ? isChapter1
                                ? "bg-[var(--rv-ch1)] pointer-events-none"
                                : isChapter2
                                  ? "bg-[var(--rv-ch2)] pointer-events-none"
                                  : "bg-[var(--primary)] pointer-events-none"
                              : isChapter1
                                ? "bg-[var(--rv-ch1)] hover:bg-[var(--rv-ch1-dark)] text-white shadow-[0_4px_20px_rgba(130,132,191,0.25)]"
                                : isChapter2
                                  ? "bg-[var(--rv-ch2)] text-white shadow-[0_4px_20px_rgba(82,10,80,0.25)] hover:bg-[var(--rv-ch2-dark)] hover:text-white hover:shadow-[0_8px_32px_rgba(82,10,80,0.35)] hover:translate-y-[-2px]"
                                  : "bg-[#2f6fd4] text-white shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)]"
                          }`}
                        style={
                          isChapter1
                            ? {}
                            : !isLaunched || !tool.launch_module.return_note
                              ? {
                                  backgroundColor: isChapter2 ? "var(--rv-ch2)" : accentColor,
                                }
                              : {}
                        }
                      >
                        {isLaunched && tool.launch_module.return_note ? (
                          <>
                            <span>
                              {tool.launch_module.button_label || tool.launch_module.buttonText}
                            </span>
                            <ArrowUpRight
                              size={18}
                              className="opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </>
                        ) : (
                          <>
                            <span>
                              {tool.launch_module.button_label || tool.launch_module.buttonText}
                            </span>
                            <ArrowRight
                              size={18}
                              className="opacity-60 transition-transform group-hover:translate-x-0.5"
                            />
                          </>
                        )}
                      </button>

                      {isLaunched && tool.launch_module.return_note && (
                        <div className="flex items-center justify-center gap-[6px] px-[12px] py-[10px] bg-white/5 border border-white/10 rounded-[10px] animate-in fade-in slide-in-from-top-1 duration-300">
                          <Info size={14} className="text-white/40" strokeWidth={2} />
                          <p className="text-[12px] text-white/50 font-medium text-center">
                            {tool.launch_module.return_note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* SUPPORT CARDS */}
          {tool.support_cards && tool.support_cards.length > 0 && sId !== "step_2_1" && (
            <div
              className={`flex flex-col gap-[12px] mt-[12px] ${sId === "step_2_3" ? "mb-3" : "mb-0"}`}
            >
              {tool.support_cards.map((card: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[16px_18px]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-[10px]">
                    {card.label}
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    {card.items?.map((item: string, j: number) => (
                      <div key={j} className="flex items-start gap-[8px]">
                        <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                        <span className="text-[13px] text-[#3a4f63] leading-[1.4]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CONSISTENCY BASELINE CAPTURE — step_1_4 (Fill I-130) */}
          {sId === "step_1_4" &&
            (() => {
              // Merge any saved baseline with profile-derived defaults (petitioner =
              // account holder, beneficiary = spouse) so OCR'd dates pre-fill the form.
              //
              // DOBs: the passport is the source of truth. When a passport-derived DOB
              // exists in the profile it WINS over any previously-saved baseline value,
              // so the I-130 dates always stay in sync with the uploaded passport (no
              // mismatch between Step 2's passport and this step). Marriage date keeps
              // saved-first priority since no passport supplies it.
              const savedBaseline = state.metadata?.consistencyBaseline as
                | ConsistencyBaseline
                | undefined;
              const prof = profile as Record<string, any> | null;
              const derivedBaseline: ConsistencyBaseline = {
                ...savedBaseline,
                marriageDate:
                  savedBaseline?.marriageDate || prof?.relationship?.marriageDate || undefined,
                petitionerDateOfBirth:
                  prof?.dateOfBirth || savedBaseline?.petitionerDateOfBirth || undefined,
                beneficiaryDateOfBirth:
                  prof?.beneficiary?.dateOfBirth ||
                  savedBaseline?.beneficiaryDateOfBirth ||
                  undefined,
              };
              return (
                <ConsistencyBaselineCapture
                  baseline={derivedBaseline}
                  onSave={(next) => actions.updateMetadata({ consistencyBaseline: next })}
                />
              );
            })()}

          {/* DS-260 CROSS-FORM CONSISTENCY CAPTURE — step_2_3 (Fill DS-260) */}
          {sId === "step_2_3" &&
            (() => {
              // Both baselines are derived from the profile the SAME way step_1_4
              // derives the I-130 baseline: passport-derived DOBs win over any
              // stale saved value, marriage date keeps saved-first priority. This
              // (a) auto-fills the DS-260 dates from the uploaded passport, and
              // (b) compares against an equally-fresh I-130 baseline, so the two
              // forms agree by default and the user only sees a mismatch when they
              // intentionally type a different DS-260 value.
              const prof = profile as Record<string, any> | null;
              const savedI130 = state.metadata?.consistencyBaseline as
                | ConsistencyBaseline
                | undefined;
              const i130Derived: ConsistencyBaseline = {
                ...savedI130,
                marriageDate:
                  savedI130?.marriageDate || prof?.relationship?.marriageDate || undefined,
                petitionerDateOfBirth:
                  prof?.dateOfBirth || savedI130?.petitionerDateOfBirth || undefined,
                beneficiaryDateOfBirth:
                  prof?.beneficiary?.dateOfBirth ||
                  savedI130?.beneficiaryDateOfBirth ||
                  undefined,
              };
              const savedDs260 = state.metadata?.ds260Baseline as Ds260Baseline | undefined;
              const ds260Derived: Ds260Baseline = {
                ...savedDs260,
                marriageDate:
                  savedDs260?.marriageDate || prof?.relationship?.marriageDate || undefined,
                petitionerDateOfBirth:
                  prof?.dateOfBirth || savedDs260?.petitionerDateOfBirth || undefined,
                beneficiaryDateOfBirth:
                  prof?.beneficiary?.dateOfBirth ||
                  savedDs260?.beneficiaryDateOfBirth ||
                  undefined,
              };
              return (
                <Ds260BaselineCapture
                  i130Baseline={i130Derived}
                  baseline={ds260Derived}
                  onSave={(next) => actions.updateMetadata({ ds260Baseline: next })}
                />
              );
            })()}

          {/* BENEFICIARY RESIDENCE CAPTURE — step_1_5 (Fill I-130A) */}
          {sId === "step_1_5" &&
            (() => {
              // Seed the current country from the profile (beneficiary's residence,
              // falling back to nationality from passport OCR) when nothing has been
              // saved yet — so the user doesn't re-type what we already captured.
              const savedBaseline = state.metadata?.beneficiaryBaseline as
                | BeneficiaryBaseline
                | undefined;
              const prof = profile as Record<string, any> | null;
              const derivedBaseline: BeneficiaryBaseline = {
                ...savedBaseline,
                currentCountry:
                  savedBaseline?.currentCountry ||
                  prof?.beneficiary?.countryOfResidence ||
                  prof?.beneficiary?.nationality ||
                  undefined,
              };
              return (
                <BeneficiaryResidenceCapture
                  baseline={derivedBaseline}
                  config={(currentStep as any).beneficiary_residence_capture}
                  petitionerCountry={state.metadata?.petitionerCountry as string | undefined}
                  onSave={(next) => actions.updateMetadata({ beneficiaryBaseline: next })}
                />
              );
            })()}

          {/* FILE QUALITY PRE-CHECK — step_1_8 (Upload, online path) */}
          {sId === "step_1_8" && <FileQualityPreCheck uploadedDocuments={uploadedDocuments} />}

          {/* PRE-SUBMISSION SNAPSHOT — step_1_10 (Review & Submit, online path) */}
          {sId === "step_1_10" && (
            <PreSubmissionSnapshot
              consistencyBaseline={
                state.metadata?.consistencyBaseline as ConsistencyBaseline | undefined
              }
              beneficiaryBaseline={
                state.metadata?.beneficiaryBaseline as BeneficiaryBaseline | undefined
              }
              filingMethod={state.metadata?.filingMethod as string | undefined}
              eligibilityAnswers={
                (state.answers?.["eligibility-suite"] as
                  | Record<string, Record<string, string | string[]> | undefined>
                  | undefined) ??
                (state.metadata?.["questAnswers_eligibility-suite"] as
                  | Record<string, Record<string, string | string[]> | undefined>
                  | undefined)
              }
            />
          )}

          {/* SECONDARY ACTIONS ROW (Step 6 SPECIFIC) */}
          {(sId === "step_1_6" || sId === "step_2_1") && (
            <div className="flex flex-col mb-[28px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[12px]">
                {/* Tutorial / Guide Card */}
                <button
                  onClick={() => {
                    if (!stepEntitlement.guard()) return;
                    setTutorialIdx(0);
                    setIsTutorialOpen(true);
                  }}
                  className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col"
                >
                  <div className="flex items-center gap-[10px] mb-[12px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center shrink-0">
                      <Book size={18} className="text-[#4a2d8a]" strokeWidth={1.7} />
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                    {sId === "step_1_6"
                      ? "Step-by-Step Account Setup Guide"
                      : "Step-by-Step CEAC Access Guide"}
                  </h3>
                  <p className="text-[12px] text-[#6b8097] leading-normal">
                    {sId === "step_1_6"
                      ? "Walk through the USCIS account creation process screen by screen."
                      : "Show where to find your case number and invoice ID, and how first-time CEAC login works."}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-primary">
                    <span>View guide</span>
                    <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </button>

                {/* Credentials Card (Toggle Unsaved/Saved) */}
                {(sId === "step_1_6" ? uscisCredentials : ceacCredentials) ? (
                  /* Saved Card */
                  <button
                    onClick={() => {
                      if (!stepEntitlement.guard()) return;
                      const portal = sId === "step_1_6" ? "USCIS" : "NVC";
                      setWalletPortalType(portal);
                      if (portal === "USCIS") {
                        setIsWalletViewOpen(true);
                      } else {
                        setIsCeacModalOpen(true);
                      }
                    }}
                    className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-[20px] text-left group hover:border-[#15744f] hover:shadow-[0_4px_20px_rgba(21,116,79,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col"
                  >
                    <div className="flex items-center gap-[10px] mb-[12px]">
                      <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                        <Lock size={18} className="text-[#15744f]" strokeWidth={1.7} />
                      </div>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                      ✓ Credentials Saved
                    </h3>
                    <p className="text-[12px] text-[#6b8097] leading-normal">
                      {sId === "step_1_6" ? "USCIS" : "CEAC"} credentials are stored in your Portal
                      Wallet.
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-[#15744f]">
                      <span>View saved credentials</span>
                      <ArrowRight size={11} strokeWidth={2} />
                    </div>
                  </button>
                ) : (
                  /* Unsaved Card */
                  <button
                    onClick={() => {
                      if (!stepEntitlement.guard()) return;
                      const portal = sId === "step_1_6" ? "USCIS" : "NVC";
                      setWalletPortalType(portal);
                      if (portal === "USCIS") {
                        setIsWalletFormOpen(true);
                      } else {
                        setIsCeacModalOpen(true);
                      }
                    }}
                    className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col"
                  >
                    <div className="flex items-center gap-[10px] mb-[12px]">
                      <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                        <Wallet size={18} className="text-[#15744f]" strokeWidth={1.7} />
                      </div>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                      Save {sId === "step_1_6" ? "USCIS" : "CEAC"} Credentials
                    </h3>
                    <p className="text-[12px] text-[#6b8097] leading-normal">
                      Securely store your {sId === "step_1_6" ? "USCIS" : "CEAC"} login details in
                      Rahvana&apos;s Portal Wallet.
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-primary">
                      <span>Open credential vault</span>
                      <ArrowRight size={11} strokeWidth={2} />
                    </div>
                  </button>
                )}
              </div>

              {/* Detailed View (Below Row, Only when saved) */}
              {(sId === "step_1_6" ? uscisCredentials : ceacCredentials) && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-5 flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#15744f] mb-[10px]">
                    {sId === "step_1_6" ? "USCIS" : "CEAC"} Credentials — Saved
                  </div>
                  <div className="flex-1 flex flex-col">
                    {sId === "step_1_6" ? (
                      <>
                        <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]">
                          <span className="text-[12px] text-[#3a4f63] font-medium">
                            Username / Email
                          </span>
                          <span className="text-[12px] text-[#1c2b3a] font-semibold font-mono">
                            {uscisCredentials?.username}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]">
                          <span className="text-[12px] text-[#3a4f63] font-medium">Password</span>
                          <span className="text-[12px] text-[#1c2b3a] font-semibold font-mono tracking-widest">
                            ••••••••
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]">
                          <span className="text-[12px] text-[#3a4f63] font-medium">
                            Security Questions
                          </span>
                          <span className="text-[12px] text-[#1c2b3a] font-semibold">
                            {uscisCredentials?.security_questions.length} saved
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]/50">
                          <span className="text-[12px] text-[#3a4f63] font-medium">
                            NVC Case Number
                          </span>
                          <span className="text-[12px] text-[#0c1b33] font-semibold font-mono">
                            {ceacCredentials?.nvc_case_number ? "••••••••" : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]/50">
                          <span className="text-[12px] text-[#3a4f63] font-medium">
                            Invoice ID Number
                          </span>
                          <span className="text-[12px] text-[#0c1b33] font-semibold font-mono">
                            {ceacCredentials?.nvc_invoice_id ? "••••••••" : "—"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Link
                    href="/portal-wallet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-[5px] mt-[12px] text-[12px] font-semibold text-[#15744f] hover:underline cursor-pointer w-fit"
                  >
                    <span>Update in Portal Wallet</span>
                    <ExternalLink size={11} strokeWidth={2} />
                  </Link>
                </div>
              )}

              {/* Case Registration Form (Step 2.1 - NVC Welcome) */}
              {sId === "step_2_1" && state.answers?.["c2s1"] && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <CaseRegistrationForm
                    existingData={{
                      nvcCaseNum: state.metadata?.nvcCaseNum,
                      nvcInvoice: state.metadata?.nvcInvoice,
                      embassyCity: state.metadata?.embassyCity,
                      beneficiaryName: state.metadata?.beneficiaryName,
                      passportNumber: state.metadata?.passportNumber,
                      surname: state.metadata?.surname,
                    }}
                    onComplete={(data) => {
                      actions.updateMetadata({
                        nvcCaseNum: data.nvcCaseNum,
                        nvcInvoice: data.nvcInvoice,
                        embassyCity: data.embassyCity,
                        beneficiaryName: data.beneficiaryName,
                        passportNumber: data.passportNumber,
                        surname: data.surname,
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Guide / Wallet Cards Row */}
          {(tool.guide_card || tool.wallet_card) && (
            <div
              className={`grid grid-cols-1 ${
                tool.guide_card && tool.wallet_card ? "md:grid-cols-2" : ""
              } gap-[12px] mb-3`}
            >
              {tool.guide_card &&
                (() => {
                  const cards = Array.isArray(tool.guide_card)
                    ? tool.guide_card
                    : [tool.guide_card];

                  return cards.map((card: any, idx: number) => {
                    const guideFeatureKey = "step_guides";
                    const isGuideLocked = !plan.canUse(guideFeatureKey);
                    const hasWalletCard = !!tool.wallet_card;

                    if (hasWalletCard) {
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isGuideLocked) {
                              setUpgradeModalFeature(guideFeatureKey);
                            } else {
                              if (card.id === "add-household-member") {
                                setTutorialPath("household_member");
                              } else if (card.id === "add-joint-sponsor") {
                                setTutorialPath("joint_sponsor");
                              }
                              setTutorialIdx(0);
                              setIsTutorialOpen(true);
                            }
                          }}
                          className={`bg-[#fafcff] border-[1.5px] rounded-[16px] p-[20px] text-left group hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col relative w-full ${
                            isGuideLocked
                              ? "border-[#d0e4f7] hover:border-[#f0c878]/60 hover:shadow-[0_8px_30px_rgba(160,96,0,0.06)]"
                              : "border-[#d0e4f7] hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
                          }`}
                        >
                          <div className="flex items-center gap-[10px] mb-[12px]">
                            <div
                              className={`w-[36px] h-[36px] rounded-[9px] border flex items-center justify-center shrink-0 transition-opacity ${
                                isGuideLocked
                                  ? "bg-[#f3f0fb] border-[#c9bef2] opacity-50"
                                  : "bg-[#f3f0fb] border-[#c9bef2]"
                              }`}
                            >
                              <Monitor size={18} className="text-[#4a2d8a]" strokeWidth={1.7} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-[14px] font-semibold mb-1 ${
                                isGuideLocked ? "text-[#6b8097]" : "text-[#0c1b33]"
                              }`}
                            >
                              {card.title}
                            </h3>
                            <p
                              className={`text-[12px] leading-normal ${
                                isGuideLocked ? "text-[#9aabb8]" : "text-[#6b8097]"
                              }`}
                            >
                              {card.subtitle}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-3 text-[12px] font-semibold ${
                              isGuideLocked ? "text-[#a06000]" : "text-primary"
                            }`}
                          >
                            {isGuideLocked ? (
                              <>
                                <span>Unlock guide</span>
                                <Lock size={11} strokeWidth={2.5} />
                              </>
                            ) : (
                              <>
                                <span>View guide</span>
                                <ArrowRight size={11} strokeWidth={2} />
                              </>
                            )}
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isGuideLocked) {
                            setUpgradeModalFeature(guideFeatureKey);
                          } else {
                            if (card.id === "add-household-member") {
                              setTutorialPath("household_member");
                            } else if (card.id === "add-joint-sponsor") {
                              setTutorialPath("joint_sponsor");
                            }
                            setTutorialIdx(0);
                            setIsTutorialOpen(true);
                          }
                        }}
                        className={`border-[1.5px] rounded-[16px] text-left group transition-all cursor-pointer select-none flex relative mt-[12px] sm:mt-[16px] mb-[20px] sm:mb-[28px] p-[16px_18px] sm:p-[20px_24px] flex-col sm:flex-row sm:items-center gap-[14px] sm:gap-[16px] w-full bg-white border-[#d0e4f7] ${
                          isGuideLocked
                            ? "hover:border-[#f0c878]/60 hover:shadow-[0_8px_30px_rgba(160,96,0,0.06)]"
                            : "hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(12,27,51,0.06)]"
                        }`}
                      >
                        <div
                          className={`w-[44px] h-[44px] rounded-[12px] border flex items-center justify-center shrink-0 transition-opacity ${
                            isGuideLocked
                              ? "bg-[#f3f0fb] border-[#c9bef2] opacity-50"
                              : "bg-[#f3f0fb] border-[#c9bef2]"
                          }`}
                        >
                          <Monitor size={20} className="text-[#4a2d8a]" strokeWidth={1.7} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-[14px] sm:text-[15px] font-bold mb-0.5 ${
                              isGuideLocked ? "text-[#6b8097]" : "text-[#0c1b33]"
                            }`}
                          >
                            {card.title}
                          </h3>
                          <p
                            className={`text-[12px] sm:text-[13px] leading-tight ${
                              isGuideLocked ? "text-[#9aabb8]" : "text-[#6b8097]"
                            }`}
                          >
                            {card.subtitle}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-[12px] sm:text-[13px] font-bold self-start sm:self-auto mt-0 sm:mt-0 ${
                            isGuideLocked ? "text-[#a06000]" : "text-primary"
                          }`}
                        >
                          {isGuideLocked ? (
                            <Lock size={15} strokeWidth={2.5} />
                          ) : (
                            <ArrowRight size={18} strokeWidth={2.5} />
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}

              {tool.wallet_card &&
                (() => {
                  const walletFeatureKey = "tracker_reminders";
                  const isWalletLocked = !plan.canUse(walletFeatureKey);

                  return (
                    <button
                      onClick={() => {
                        if (isWalletLocked) {
                          setUpgradeModalFeature(walletFeatureKey);
                          return;
                        }
                        if (tool.wallet_card?.type === "nvc_fee") {
                          setIsNvcFeeModalOpen(true);
                        } else if (tool.wallet_card?.type === "ceac_creds") {
                          setIsCeacModalOpen(true);
                        }
                      }}
                      className={`bg-[#fafcff] border-[1.5px] rounded-[16px] p-[20px] text-left group hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col relative
                        ${
                          isWalletLocked
                            ? "border-[#d0e4f7] hover:border-[#f0c878] hover:shadow-[0_4px_20px_rgba(160,96,0,0.08)]"
                            : (tool.wallet_card?.type === "ceac_creds" && ceacCredentials) ||
                                (tool.wallet_card?.type === "nvc_fee" &&
                                  state.metadata.nvcFeeStatus)
                              ? "border-[#a8d9be] bg-[#e8f5ef]"
                              : "border-[#d0e4f7] hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-[10px] mb-[12px]">
                        <div
                          className={`w-[36px] h-[36px] rounded-[9px] border flex items-center justify-center shrink-0 ${
                            isWalletLocked
                              ? "bg-[#e6f6f6] border-[#9fd8d8] opacity-50"
                              : (tool.wallet_card?.type === "ceac_creds" && ceacCredentials) ||
                                  (tool.wallet_card?.type === "nvc_fee" &&
                                    state.metadata.nvcFeeStatus)
                                ? "bg-[#e8f5ef] border-[#a8d9be]"
                                : tool.wallet_card?.type === "ceac_creds"
                                  ? "bg-[#e8f5ef] border-[#a8d9be]"
                                  : "bg-[#e6f6f6] border-[#9fd8d8]"
                          }`}
                        >
                          {tool.wallet_card?.type === "ceac_creds" ? (
                            <Lock size={18} className="text-[#15744f]" strokeWidth={1.7} />
                          ) : (
                            <CreditCard
                              size={18}
                              className={isWalletLocked ? "text-[#0f7373]" : "text-[#0f7373]"}
                              strokeWidth={1.7}
                            />
                          )}
                        </div>
                      </div>

                      <h3
                        className={`text-[14px] font-semibold mb-1 ${
                          isWalletLocked
                            ? "text-[#6b8097]"
                            : (tool.wallet_card?.type === "ceac_creds" && ceacCredentials) ||
                                (tool.wallet_card?.type === "nvc_fee" &&
                                  state.metadata.nvcFeeStatus)
                              ? "text-[#15744f]"
                              : "text-[#0c1b33]"
                        }`}
                      >
                        {!isWalletLocked &&
                        ((tool.wallet_card?.type === "ceac_creds" && ceacCredentials) ||
                          (tool.wallet_card?.type === "nvc_fee" && state.metadata.nvcFeeStatus))
                          ? `✓ ${tool.wallet_card?.title.replace("Save", "Details")}`
                          : tool.wallet_card?.title}
                      </h3>

                      <p
                        className={`text-[12px] leading-normal ${isWalletLocked ? "text-[#9aabb8]" : "text-[#6b8097]"}`}
                      >
                        {tool.wallet_card?.subtitle}
                      </p>

                      <div
                        className={`flex items-center gap-1 mt-3 text-[12px] font-semibold ${
                          isWalletLocked
                            ? "text-[#a06000]"
                            : (tool.wallet_card?.type === "ceac_creds" && ceacCredentials) ||
                                (tool.wallet_card?.type === "nvc_fee" &&
                                  state.metadata.nvcFeeStatus)
                              ? "text-[#15744f]"
                              : "text-primary"
                        }`}
                      >
                        {isWalletLocked ? (
                          <>
                            <Lock size={11} strokeWidth={2.2} />
                            <span>Unlock feature</span>
                            <ArrowRight size={11} strokeWidth={2} />
                          </>
                        ) : (
                          <span>
                            {(tool.wallet_card?.type === "ceac_creds" && ceacCredentials) ||
                            (tool.wallet_card?.type === "nvc_fee" && state.metadata.nvcFeeStatus)
                              ? "View saved details"
                              : tool.wallet_card?.type === "ceac_creds"
                                ? "Open credential vault"
                                : "Update payment record"}
                            <ArrowRight size={11} strokeWidth={2} className="inline ml-1" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })()}
            </div>
          )}
          {/* ACTION CARDS ROW (Step 3 SPECIFIC) */}
          {tool.action_cards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-4">
              {tool.action_cards.map((card: ActionCard) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if (card.type === "tutorial") {
                      if (!stepEntitlement.guard()) return;
                      setTutorialIdx(0);
                      setIsTutorialOpen(true);
                    } else if (card.href) {
                      if (!stepEntitlement.guard()) return;
                      window.open(card.href, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col"
                >
                  <div className="flex items-center gap-[10px] mb-[12px]">
                    <div
                      className={`w-[36px] h-[36px] rounded-[9px] border flex items-center justify-center shrink-0
                      ${card.id === "tutorial" ? "bg-[#f3f0fb] border-[#c9bef2]" : "bg-[#e6f6f6] border-[#9fd8d8]"}
                    `}
                    >
                      {card.icon === "tutorial" ? (
                        <Monitor size={18} className="text-[#4a2d8a]" strokeWidth={1.7} />
                      ) : (
                        <Globe size={18} className="text-[#0f7373]" strokeWidth={1.7} />
                      )}
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">{card.title}</h3>
                  <p className="text-[12px] text-[#6b8097] leading-normal">{card.subtitle}</p>
                  <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-primary">
                    <span>{card.cta_label}</span>
                    <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Disclaimer */}
          <p
            className={`${currentStep.step_key === "step_2_4" || currentStep.step_key === "step_2_6" || currentStep.step_key === "step_2_7" || currentStep.step_key === "step_1_17" ? "mt-5" : "mt-5"} text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[8px]`}
          >
            {tool.disclaimer ||
              "Rahvana provides structured guidance only. This is not legal advice — always verify with official sources."}
          </p>

          {/* Citations section */}
          {renderCitationsSection()}
        </div>
      </div>
    );
  };

  if (!currentStep) return null;

  // (moved to top-level, see above)

  return (
    <div
      className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans ${customRenderer ? "bg-slate-50" : ""}`}
    >
      {customRenderer ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center relative pb-[100px]">
          {customRenderer}
          {renderCitationsSection()}
        </div>
      ) : (
        <div
          className={`flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center relative pb-[100px] ${
            currentStep.step_type === "quest"
              ? ""
              : "px-2 sm:px-4 md:px-8 lg:px-12 pt-6 sm:pt-10 md:pt-14 pb-6 md:pb-10 lg:pb-12"
          }`}
        >
          {/* Quiz Overlay Refinement - Now absolute below headers */}
          {showQuiz && (
            <div className="fixed inset-0 z-[110] bg-[#fafcff] animate-in slide-in-from-bottom-[20px] fade-in duration-[0.28s] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col font-sans">
              <header className="h-[64px] border-b border-[#e1eefc] bg-white flex items-center px-[24px] shrink-0 gap-[32px]">
                <button
                  onClick={() => setShowQuiz(false)}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>

                <div className="flex-1">
                  <div className="h-[4px] w-full bg-primary/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{
                        width: quizResult
                          ? "100%"
                          : `${((quizScreenIdx + 1) / (currentStep.filing_data?.quiz?.screens.length || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-[12px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                  {quizResult
                    ? "Done"
                    : `${quizScreenIdx + 1} / ${currentStep.filing_data?.quiz?.screens.length}`}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto flex flex-col items-center bg-[#fafcff] p-[48px_24px_32px]">
                <div className="w-full max-w-[560px] flex flex-col items-center">
                  {!quizResult ? (
                    (() => {
                      const screen = currentStep.filing_data?.quiz?.screens[quizScreenIdx];
                      if (!screen) return null;
                      const selVal = quizAnswers[screen.id]?.value;
                      return (
                        <div className="animate-in fade-in slide-in-from-right-[10px] duration-[0.22s] ease-out w-full">
                          <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-[14px]">
                            Step 3 · Decide Filing Method
                          </div>
                          <h2 className="text-[clamp(20px,3.5vw,26px)]  text-[#0f1f38] mb-[10px] leading-[1.35]">
                            {screen.question}
                          </h2>
                          <p className="text-[#3a4f63] text-[14px] leading-[1.6] mb-[28px]">
                            {screen.helper}
                          </p>

                          <div className="flex flex-col gap-[10px] mb-[24px]">
                            {screen.options.map((opt: any) => (
                              <button
                                key={opt.value}
                                onClick={() =>
                                  setQuizAnswers({
                                    ...quizAnswers,
                                    [screen.id]: {
                                      value: opt.value,
                                      signal: opt.signal,
                                    },
                                  })
                                }
                                className={`w-full p-[16px_20px] rounded-[14px] border-[1.5px] text-left transition-all duration-200 flex items-start gap-[14px] select-none
                                      ${selVal === opt.value ? "border-primary bg-[rgba(59,125,216,0.15)] shadow-[0_0_0_3px_rgba(59,125,216,0.12)]" : "border-[#d0e4f7] bg-[#fafcff] hover:border-primary hover:bg-[rgba(59,125,216,0.15)]"}`}
                              >
                                <div
                                  className={`w-[20px] h-[20px] mt-px rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-[0.22s] ${selVal === opt.value ? "border-primary bg-primary" : "border-[#d0e4f7]"}`}
                                >
                                  {selVal === opt.value && (
                                    <div className="w-[8px] h-[8px] rounded-full bg-white animate-in zoom-in duration-150" />
                                  )}
                                </div>
                                <span className="text-[15px] font-medium text-[#1c2b3a] leading-[1.4]">
                                  {opt.label}
                                </span>
                              </button>
                            ))}
                          </div>
                          <button
                            disabled={!selVal}
                            onClick={handleNextQuiz}
                            className={`w-full p-[16px] rounded-[14px] font-semibold text-[15px] transition-all duration-[0.2s] ${
                              selVal
                                ? "bg-primary text-white hover:bg-primary/80 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(59,125,216,0.28)]"
                                : "bg-primary/30 text-[#6b8097] cursor-not-allowed opacity-50"
                            }`}
                          >
                            Continue
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="animate-in fade-in slide-in-from-left-[10px] duration-[0.22s] ease-out w-full border border-transparent">
                      <div
                        className={`w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center mx-auto mb-[22px] border-[2px]
                        ${
                          quizResult.type === "online"
                            ? "bg-[#f0faf6] border-[#8ecdb8] text-[#0e5c42]"
                            : quizResult.type === "paper"
                              ? "bg-[#f2f0fb] border-[#b0a6e2] text-[#2e1f72]"
                              : quizResult.type === "lean-online"
                                ? "bg-[#fef8e8] border-[#f0d98a] text-[#8a6200]"
                                : "bg-[#f3f0fb] border-[#c9bef2] text-[#4a2d8a]"
                        }`}
                      >
                        <span className="text-[26px] font-bold">
                          {quizResult.type === "online" ? (
                            "✓"
                          ) : quizResult.type === "paper" ? (
                            <Mail size={24} strokeWidth={2.5} />
                          ) : quizResult.type === "lean-online" ? (
                            "↗"
                          ) : (
                            "?"
                          )}
                        </span>
                      </div>

                      <div className="text-center mb-[18px]">
                        <div
                          className={`inline-flex items-center gap-[6px] p-[6px_16px] rounded-full text-[12px] font-semibold tracking-[0.06em] uppercase border
                        ${
                          quizResult.type === "online"
                            ? "bg-[#f0faf6] border-[#8ecdb8] text-[#0e5c42]"
                            : quizResult.type === "paper"
                              ? "bg-[#f2f0fb] border-[#b0a6e2] text-[#2e1f72]"
                              : quizResult.type === "lean-online"
                                ? "bg-[#fef8e8] border-[#f0d98a] text-[#8a6200]"
                                : "bg-[#f3f0fb] border-[#c9bef2] text-[#4a2d8a]"
                        }`}
                        >
                          {quizResult.headline}
                        </div>
                      </div>

                      <h2 className="text-[clamp(22px,3.5vw,28px)]  text-[#0f1f38] mb-[10px] leading-[1.3] text-center w-full">
                        {quizResult.headline === "Check with your representative"
                          ? "Verify with your Attorney"
                          : quizResult.type === "online"
                            ? "Online filing looks like the right choice"
                            : "Paper filing looks like the better fit"}
                      </h2>

                      <p className="text-[14px] text-[#3a4f63] mt-2 mb-[28px] text-center max-w-[460px] mx-auto leading-[1.7]">
                        {quizResult.body}
                      </p>

                      <div className="bg-[#f5f7fa] border border-[#d0e4f7] rounded-[14px] p-[18px_20px] mb-[28px]">
                        <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6b8097] mb-[12px]">
                          Factors considered
                        </div>
                        <div className="flex flex-col">
                          {quizResult.factors.map((f, i) => {
                            return (
                              <div
                                key={i}
                                className={`flex items-start gap-[10px] py-[8px] ${i !== quizResult.factors.length - 1 ? "border-b border-[#d0e4f7]" : ""}`}
                              >
                                <div className="mt-[6px] w-[5px] h-[5px] shrink-0 rounded-full bg-[#3a4f63]" />
                                <span className="text-[14px] text-[#3a4f63] leading-normal">
                                  {f.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="w-full flex flex-col gap-[12px] mb-[32px]">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6b8097] mb-1 text-center">
                          Select your filing method
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                          <button
                            onClick={() => {
                              setShowQuiz(false);
                              handleConfirmation("online");
                            }}
                            className={`flex flex-col relative w-full p-[18px_20px] text-left rounded-[14px] border-[2px] transition-all duration-[0.2s] group select-none hover:-translate-y-px
                          ${quizResult.emphasize === "online" || quizResult.type === "lean-online" ? "bg-[#f0faf6] border-[#8ecdb8] hover:bg-[#0e5c42] hover:border-[#0a4330]" : "bg-white border-[#d0e4f7] hover:border-primary"}`}
                          >
                            <div
                              className={`text-[10px] font-bold tracking-[0.09em] uppercase mb-[6px] transition-colors
                            ${quizResult.emphasize === "online" || quizResult.type === "lean-online" ? "text-[#0e5c42] group-hover:text-white/85" : "text-primary"}`}
                            >
                              Online
                            </div>
                            <div
                              className={`text-[16px] font-semibold leading-tight mb-[4px] transition-colors
                            ${quizResult.emphasize === "online" || quizResult.type === "lean-online" ? "text-[#0f1f38] group-hover:text-white" : "text-[#0f1f38]"}`}
                            >
                              File Online
                            </div>
                            <div
                              className={`text-[12px] transition-colors
                            ${quizResult.emphasize === "online" || quizResult.type === "lean-online" ? "text-[#6b8097] group-hover:text-white/85" : "text-[#6b8097]"}`}
                            >
                              $625 · myUSCIS · instant
                            </div>
                            {(quizResult.emphasize === "online" ||
                              quizResult.type === "lean-online") && (
                              <div className="absolute top-[14px] right-[14px] text-[9px] font-bold uppercase tracking-[0.06em] px-[9px] py-[3px] rounded-full bg-primary text-white">
                                Recommended
                              </div>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setShowQuiz(false);
                              handleConfirmation("paper");
                            }}
                            className={`flex flex-col relative w-full p-[18px_20px] text-left rounded-[14px] border-[2px] transition-all duration-[0.2s] group select-none hover:-translate-y-px
                          ${quizResult.emphasize === "paper" ? "bg-[#f2f0fb] border-[#b0a6e2] hover:bg-[#2e1f72] hover:border-[#1e1348]" : "bg-white border-[#d0e4f7] hover:border-primary"}`}
                          >
                            <div
                              className={`text-[10px] font-bold tracking-[0.09em] uppercase mb-[6px] transition-colors
                            ${quizResult.emphasize === "paper" ? "text-[#2e1f72] group-hover:text-white/85" : "text-[#2e1f72]"}`}
                            >
                              Paper
                            </div>
                            <div
                              className={`text-[16px] font-semibold leading-tight mb-[4px] transition-colors
                            ${quizResult.emphasize === "paper" ? "text-[#0f1f38] group-hover:text-white" : "text-[#0f1f38]"}`}
                            >
                              File by Mail
                            </div>
                            <div
                              className={`text-[12px] transition-colors
                            ${quizResult.emphasize === "paper" ? "text-[#6b8097] group-hover:text-white/85" : "text-[#6b8097]"}`}
                            >
                              $675 · mail packet
                            </div>
                            {quizResult.emphasize === "paper" && (
                              <div className="absolute top-[14px] right-[14px] text-[9px] font-bold uppercase tracking-[0.06em] px-[9px] py-[3px] rounded-full bg-primary text-white">
                                Recommended
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setQuizScreenIdx(0);
                        }}
                        className="w-full py-[14px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[14px] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#1c2b3a] transition-all"
                      >
                        ← Review my answers
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`w-full ${currentStep.step_type === "quest" ? "" : "max-w-4xl"} mx-auto`}>
            {currentStep.step_type === "quest" ? (
              <div
                //              className={`w-full min-h-[600px] flex flex-col items-center${isChapter2 ? " ch2step-bg" : ""}${isChapter3 ? " ch3step-bg" : ""}`}
                className={`w-full min-h-[600px] flex flex-col items-center`}
              >
                <QuestRenderer
                  quest={currentStep.quest_data as unknown as QuestSuite}
                  onComplete={handleToggleComplete}
                  state={state}
                  actions={actions}
                  isChapter1={isChapter1}
                  isChapter2={isChapter2}
                  isChapter3={isChapter3}
                />
              </div>
            ) : currentStep.step_type === "tool" ? (
              renderToolStep()
            ) : currentStep.step_type === "action" ? (
              <div
              // style={
              //   isChapter3
              //     ? {
              //         backgroundImage:
              //           "linear-gradient(rgba(255,255,255,0.32), rgba(255,255,255,0.32)), url('/assets/images/ch3steps-bg.png')",
              //         backgroundSize: "cover",
              //         backgroundPosition: "center",
              //         backgroundRepeat: "no-repeat",
              //         backgroundAttachment: "fixed",
              //         minHeight: "100vh",
              //       }
              //     : isChapter2
              //       ? {
              //           backgroundImage:
              //             "linear-gradient(rgba(255,255,255,0.54), rgba(255,255,255,0.54)), url('/assets/images/ch2steps-bg.png')",
              //           backgroundSize: "cover",
              //           backgroundPosition: "center",
              //           backgroundRepeat: "no-repeat",
              //           backgroundAttachment: "fixed",
              //           minHeight: "100vh",
              //         }
              //       : {}
              // }
              >
                <ActionStepRenderer
                  step={currentStep}
                  isCompleted={state.completedSteps.has(currentStep.step_key)}
                  onToggleComplete={handleToggleComplete}
                  chapter={currentChapter?.chapter_name || "Chapter"}
                  filingType={
                    state.metadata.filingMethod === "online" ? "Online Filing" : "Paper Filing"
                  }
                  state={state}
                  actions={actions}
                  isChapter1={isChapter1}
                  isChapter2={isChapter2}
                  isChapter3={isChapter3}
                  guard={stepEntitlement.guard}
                />

                {/* PACKET SECTION CHECKLIST — step_1_13 (Assemble Packet, mailing path) */}
                {sId === "step_1_13" && (
                  <PacketSectionChecklist
                    config={(currentStep as any).action_data?.packet_section_checklist}
                    checked={state.metadata?.packetChecklist as Record<string, boolean> | undefined}
                    onToggle={(next) => actions.updateMetadata({ packetChecklist: next })}
                  />
                )}
              </div>
            ) : currentStep.step_type === "docs" ? (
              <>
                {/* Document Questionnaire Overlay — shown once for step_1_2 */}
                {showDocQuestionnaire && currentStep.step_key === "step_1_2" && (
                  <DocumentQuestionnaire
                    config={IR1_QUESTIONNAIRE_CONFIG}
                    initialAnswers={derivedDocAnswers}
                    onComplete={(result: QuestionnaireResult) => {
                      // Persist answers + completion flag via backend
                      actions.updateMetadata({
                        docQuestionnaireCompleted: true,
                        docQuestionnaireAnswers: result.answers,
                        docQuestionnaireCompletedAt: result.completedAt,
                      });
                      setShowDocQuestionnaire(false);
                    }}
                  />
                )}
                <div className="w-full flex flex-col items-center px-3 sm:px-4 pt-5 md:px-0 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  {/* Questionnaire CTA */}
                  {/* {currentStep.step_key === "step_1_2" && !isDocQuestionnaireCompleted && ( */}
                  <div className="max-w-3xl w-full mx-auto px-0 sm:px-2 md:px-4 pt-5 sm:pt-8 md:pt-14 pb-4 sm:pb-8 md:pb-12 flex flex-col gap-3">
                    <button
                      onClick={() => setShowDocQuestionnaire(true)}
                      className="w-full rounded-2xl border-2 border-primary bg-[rgba(59,125,216,0.06)] hover:bg-[rgba(59,125,216,0.12)] hover:shadow-[0_4px_20px_rgba(59,125,216,0.15)] hover:-translate-y-px transition-all cursor-pointer text-left group p-4 sm:p-6"
                    >
                      <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary mb-1 sm:mb-1.5">
                        Recommended · Takes 1 minute
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#0f1f38] mb-0.5 sm:mb-1 leading-snug">
                        Personalize Your Document Checklist
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#6b8097] leading-relaxed mb-2 sm:mb-3">
                        Answer a few questions about your situation so we can add or remove
                        documents that apply to you specifically.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-primary">
                        <span>Start Personalization</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </div>
                    </button>
                  </div>
                  {/* )} */}

                  {/* Case Strength Tool — fixed right panel at xl; inline below xl */}
                  {currentStep.step_key === "step_1_2" && (
                    <>
                      {/* Reusable floating panel — auto fades when footer enters viewport */}
                      <FloatingSidePanel>
                        <DocCaseStrengthMeter
                          documentItems={(currentStep as any).document_items}
                          uploadedDocuments={uploadedDocuments}
                          documentChecklist={state.documentChecklist}
                          docReviewStatus={
                            state.metadata?.docReviewStatus as Record<string, string> | undefined
                          }
                          docUploads={state.docUploads}
                          notes={state.notes}
                          eligibilityAnswers={
                            (state.answers?.["eligibility-suite"] as any) ??
                            (state.metadata?.["questAnswers_eligibility-suite"] as any)
                          }
                          contextLabel="Case Strength"
                          stepName="Petition Readiness"
                          defaultCollapsed={false}
                        />
                      </FloatingSidePanel>

                      {/* Inline below content on smaller screens */}
                      <div className="xl:hidden max-w-3xl w-full mx-auto px-0 sm:px-2 md:px-4 pb-4">
                        <DocCaseStrengthMeter
                          documentItems={(currentStep as any).document_items}
                          uploadedDocuments={uploadedDocuments}
                          documentChecklist={state.documentChecklist}
                          docReviewStatus={
                            state.metadata?.docReviewStatus as Record<string, string> | undefined
                          }
                          docUploads={state.docUploads}
                          notes={state.notes}
                          eligibilityAnswers={
                            (state.answers?.["eligibility-suite"] as any) ??
                            (state.metadata?.["questAnswers_eligibility-suite"] as any)
                          }
                          contextLabel="Case Strength"
                          stepName="Petition Readiness"
                          defaultCollapsed={true}
                        />
                      </div>
                    </>
                  )}

                  {/* Document Cards — rendered by DocListSection below */}
                  {false &&
                    (() => {
                      const effectiveDocItems =
                        sId === "step_1_2" && questionnaireDocItems
                          ? questionnaireDocItems
                          : (currentStep as any).document_items || currentStep.document_items;
                      return (
                        <>
                          <div className="w-full max-w-[740px] px-0">
                            <div className="w-full">
                              {(() => {
                                const docItems = effectiveDocItems;
                                if (!docItems) return [];
                                const uniqueGroups = Array.from(
                                  new Set(docItems.map((d: any) => d.group || "Required Now"))
                                );
                                const defaultOrder = [
                                  "Required Now",
                                  "Required if Applicable",
                                  "USCIS Intake Order",
                                  "Supporting Evidence",
                                  "Gather Now for Later",
                                ];
                                return (uniqueGroups as string[]).sort((a, b) => {
                                  const idxA = defaultOrder.indexOf(a);
                                  const idxB = defaultOrder.indexOf(b);
                                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                  if (idxA !== -1) return -1;
                                  if (idxB !== -1) return 1;
                                  return a.localeCompare(b);
                                });
                              })().map((groupName) => {
                                const docItems = effectiveDocItems;
                                const groupItems = docItems?.filter(
                                  (d: any) => (d.group || "Required Now") === groupName
                                );

                                if (!groupItems || groupItems.length === 0) return null;

                                return (
                                  <div
                                    key={groupName}
                                    className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-6 sm:mb-8"
                                  >
                                    {/* Group Header */}
                                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                      <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.09em] uppercase text-[#6b8097] whitespace-nowrap shrink-0">
                                        {groupName}
                                      </span>
                                      <div className="h-px flex-1 bg-primary/30 min-w-0" />
                                    </div>

                                    <div className="flex flex-col gap-2 sm:gap-2.5">
                                      {groupItems.map((doc: any, idx: number) => {
                                        const docReviewStatus =
                                          state.metadata?.docReviewStatus?.[doc.id];
                                        const isReviewed =
                                          docReviewStatus === "reviewed" ||
                                          state.documentChecklist[doc.name];
                                        const hasAttachment =
                                          state.docUploads[doc.name] || state.notes[doc.name];
                                        const isInProgress =
                                          (hasAttachment && !isReviewed) ||
                                          docReviewStatus === "in-progress";
                                        const isPetitioner = doc.tag === "petitioner";
                                        const isBeneficiary = doc.tag === "beneficiary";

                                        return (
                                          <div
                                            key={doc.id || idx}
                                            onClick={() => {
                                              setDocActionModal({
                                                isOpen: true,
                                                doc,
                                                title: doc.name,
                                                subtitle: doc.subtitle,
                                                onReadGuide: () => {
                                                  if (doc.guideUrl && doc.guideUrl !== "/guides") {
                                                    window.open(doc.guideUrl, "_blank");
                                                    if (actions.updateDocumentStatus && doc.id) {
                                                      actions.updateDocumentStatus(
                                                        doc.id,
                                                        "reviewed"
                                                      );
                                                    }
                                                  } else {
                                                    setSelectedGuideId(doc.id || null);
                                                    if (actions.updateDocumentStatus && doc.id) {
                                                      actions.updateDocumentStatus(
                                                        doc.id,
                                                        "in-progress"
                                                      );
                                                    }
                                                  }
                                                },
                                                onUpload: () => {
                                                  const defId = mapDocumentNameToId(doc.name);
                                                  setActiveUploadId(doc.id);
                                                  setActiveUploadType("doc");

                                                  if (!stepEntitlement.guard()) return;

                                                  const documentDef = ALL_DOCUMENTS.find(
                                                    (d) => d.id === defId
                                                  );
                                                  if (documentDef?.isDynamicCategory) {
                                                    setMultipleUploadModalState({
                                                      isOpen: true,
                                                      categoryId: defId,
                                                      documentName: doc.name,
                                                      options: documentDef.suggestions || [],
                                                    });
                                                  } else if (documentDef) {
                                                    openUploadModal(defId);
                                                  } else {
                                                    // Def not in ALL_DOCUMENTS – find parent dynamic category
                                                    const parentCat = ALL_DOCUMENTS.find(
                                                      (d) =>
                                                        d.isDynamicCategory &&
                                                        d.suggestions?.some(
                                                          (opt: string) =>
                                                            mapDocumentNameToId(opt) === defId
                                                        )
                                                    );
                                                    if (parentCat) {
                                                      setMultipleUploadModalState({
                                                        isOpen: true,
                                                        categoryId: parentCat.id,
                                                        documentName: doc.name,
                                                        options: parentCat.suggestions || [],
                                                      });
                                                    }
                                                  }
                                                },
                                              });
                                            }}
                                            className={`group flex items-start sm:items-center gap-3 sm:gap-4 
                                          px-3 sm:px-5 py-3.5 sm:py-5 
                                          rounded-xl sm:rounded-2xl border-[1.5px] 
                                          transition-all cursor-pointer relative 
                                          shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] 
                                          hover:border-primary hover:shadow-[0_8px_32px_rgba(15,31,56,0.12),0_2px_8px_rgba(15,31,56,0.06)] 
                                          hover:-translate-y-px active:translate-y-0 
                                          active:shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)]
                                          ${
                                            isReviewed
                                              ? "bg-[#eaf7ff] border-[#b8daff]"
                                              : isInProgress
                                                ? "bg-[#fff9e6] border-[#fde68a]/50"
                                                : "bg-white border-[#d0e4f7]"
                                          }`}
                                          >
                                            {/* Icon */}
                                            <div
                                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border
                                            ${
                                              isReviewed
                                                ? "bg-[#1a7a5e] text-white border-[#1a7a5e]"
                                                : isInProgress
                                                  ? "bg-white border-[#fde68a] text-[#d97706]"
                                                  : "bg-[#e8f1fb] border-[#d0e4f7] text-primary/80"
                                            }`}
                                            >
                                              {isReviewed ? (
                                                <CheckCircle2
                                                  size={16}
                                                  strokeWidth={2.5}
                                                  className="sm:w-[18px] sm:h-[18px]"
                                                />
                                              ) : (
                                                (() => {
                                                  const iconSize = 16;
                                                  switch (doc.icon) {
                                                    case "ShieldCheck":
                                                      return <ShieldCheck size={iconSize} />;
                                                    case "User":
                                                      return <User size={iconSize} />;
                                                    case "FileText":
                                                      return <FileText size={iconSize} />;
                                                    case "FileCheck":
                                                      return <FileCheck size={iconSize} />;
                                                    case "MessageSquare":
                                                      return <MessageSquare size={iconSize} />;
                                                    case "Scale":
                                                      return <Scale size={iconSize} />;
                                                    case "Globe":
                                                      return <Globe size={iconSize} />;
                                                    case "ClipboardList":
                                                      return <ClipboardList size={iconSize} />;
                                                    case "Lock":
                                                      return <Lock size={iconSize} />;
                                                    case "Camera":
                                                      return <Camera size={iconSize} />;
                                                    default:
                                                      return <FileText size={iconSize} />;
                                                  }
                                                })()
                                              )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                              <h3 className="text-[13px] sm:text-[15px] font-semibold text-[#0f1f38] mb-0.5 leading-snug truncate">
                                                {doc.name}
                                              </h3>
                                              <p className="text-[11px] sm:text-[13px] text-[#6b8097] leading-relaxed mb-1.5 sm:mb-2 line-clamp-2 sm:truncate">
                                                {doc.subtitle}
                                              </p>
                                              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                                {doc.tag && (
                                                  <span
                                                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.04em]
                                                  ${
                                                    isPetitioner
                                                      ? "bg-[#e8f1fb] text-primary/80"
                                                      : isBeneficiary
                                                        ? "bg-[#eaf7f2] text-[#1a7a5e]"
                                                        : "bg-[#f3f0fb] text-[#4a2d80]"
                                                  }`}
                                                  >
                                                    {doc.tag.charAt(0).toUpperCase() +
                                                      doc.tag.slice(1)}
                                                  </span>
                                                )}
                                                {isBeneficiary && (
                                                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] bg-[#f3f0fb] text-[#4a2d80]">
                                                    Rahvana Guide
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Status + Actions */}
                                            <div className="shrink-0 flex items-center gap-1.5 self-start sm:self-center mt-0.5 sm:mt-0">
                                              {/* Status Badge */}
                                              {(() => {
                                                const defId = mapDocumentNameToId(doc.name);
                                                const vaultMatch = findVaultDocForItem(
                                                  doc.name,
                                                  defId,
                                                  uploadedDocuments
                                                );
                                                const isUploadedInVault = !!vaultMatch;
                                                const uploadedDoc = vaultMatch;
                                                const isDeleting = uploadedDoc
                                                  ? isDeletingIds.includes(uploadedDoc.id)
                                                  : false;

                                                if (isDeleting) return null;

                                                const displayStatus = isUploadedInVault
                                                  ? "Uploaded"
                                                  : isReloadingDocs
                                                    ? "Checking..."
                                                    : isReviewed
                                                      ? "Reviewed"
                                                      : isInProgress
                                                        ? "In progress"
                                                        : "Not started";

                                                const statusClasses = isUploadedInVault
                                                  ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0] font-bold shadow-sm"
                                                  : isReloadingDocs
                                                    ? "bg-muted/30 text-muted-foreground border-muted-foreground/20 animate-pulse"
                                                    : isReviewed
                                                      ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0]"
                                                      : isInProgress
                                                        ? "bg-[#fff9e6] text-[#d97706] border-[#fde68a]"
                                                        : "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-primary hover:text-primary";

                                                return (
                                                  <div
                                                    className={`hidden xs:flex px-2 sm:px-3 py-1 rounded-full border text-[10px] sm:text-[12px] font-medium tracking-normal transition-all whitespace-nowrap ${statusClasses}`}
                                                  >
                                                    {displayStatus}
                                                  </div>
                                                );
                                              })()}

                                              {/* Upload State / Dropdown */}
                                              {(() => {
                                                const defId = mapDocumentNameToId(doc.name);
                                                const uploadedDoc = findVaultDocForItem(
                                                  doc.name,
                                                  defId,
                                                  uploadedDocuments
                                                );
                                                const isDeleting = uploadedDoc
                                                  ? isDeletingIds.includes(uploadedDoc.id)
                                                  : false;

                                                if (isReloadingDocs && !uploadedDoc) {
                                                  return (
                                                    <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground font-medium animate-pulse">
                                                      <div className="h-2.5 w-2.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                                                      <span className="hidden sm:inline">
                                                        Checking...
                                                      </span>
                                                    </div>
                                                  );
                                                }

                                                if (isDeleting) {
                                                  return (
                                                    <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-red-500 font-medium animate-pulse">
                                                      <div className="h-2.5 w-2.5 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                                                      <span className="hidden sm:inline">
                                                        Deleting...
                                                      </span>
                                                    </div>
                                                  );
                                                }

                                                if (uploadedDoc) {
                                                  return (
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <button
                                                          onClick={(e) => e.stopPropagation()}
                                                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-muted-foreground/20"
                                                        >
                                                          <MoreVertical
                                                            size={15}
                                                            className="sm:w-[18px] sm:h-[18px]"
                                                          />
                                                        </button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent
                                                        side="top"
                                                        align="end"
                                                        className="w-[130px] sm:w-[140px] rounded-xl shadow-xl border-muted/20"
                                                      >
                                                        <DropdownMenuItem
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(
                                                              `/api/documents/${uploadedDoc.id}/download`,
                                                              "_blank"
                                                            );
                                                          }}
                                                          className="flex items-center gap-2 cursor-pointer font-medium text-[12px] sm:text-[13px] py-2 sm:py-2.5"
                                                        >
                                                          <Eye
                                                            size={14}
                                                            className="text-primary sm:w-4 sm:h-4"
                                                          />
                                                          Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDocumentToDelete({
                                                              id: uploadedDoc.id,
                                                              name: doc.name,
                                                            });
                                                          }}
                                                          className="flex items-center gap-2 cursor-pointer font-medium text-[12px] sm:text-[13px] py-2 sm:py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
                                                        >
                                                          <Trash2
                                                            size={14}
                                                            className="sm:w-4 sm:h-4"
                                                          />
                                                          Delete
                                                        </DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  );
                                                }

                                                return null;
                                              })()}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Footer Disclaimer */}
                          <div className="mt-10 sm:mt-12 mx-3 sm:mx-0 px-4 sm:px-5 py-3.5 sm:py-4 bg-[#e8f1fb] rounded-xl text-[#6b8097] leading-relaxed text-center max-w-[740px] w-full mb-5 sm:mb-6">
                            <span className="block text-[10px] sm:text-[12px] leading-relaxed">
                              Rahvana provides structured guidance only. This is not legal advice.{" "}
                              {/* <br className="hidden sm:block" /> */}
                              Consult a licensed immigration attorney for case-specific decisions.
                            </span>
                          </div>
                        </>
                      );
                    })()}

                  {/* DocListSection — standardised doc-upload UI for step_1_2 */}
                  {(() => {
                    const effectiveDocItems =
                      sId === "step_1_2" && questionnaireDocItems
                        ? questionnaireDocItems
                        : (currentStep as any).document_items || currentStep.document_items;
                    if (!effectiveDocItems) return null;

                    const ICON_MAP: Record<string, string> = {
                      ShieldCheck: "police",
                      User: "user",
                      FileText: "file-text",
                      FileCheck: "file-text",
                      MessageSquare: "message",
                      Scale: "prior-marriage",
                      Globe: "translations",
                      ClipboardList: "clipboard",
                      Lock: "police",
                      Camera: "camera",
                    };
                    const BADGE_MAP: Record<string, string> = {
                      "Required Now": "req",
                      "USCIS Intake Order": "req",
                      "Required if Applicable": "cond",
                      "Supporting Evidence": "cond",
                      "Gather Now for Later": "Recommended",
                    };
                    const GROUP_ORDER = [
                      "Required Now",
                      "Required if Applicable",
                      "USCIS Intake Order",
                      "Supporting Evidence",
                      "Gather Now for Later",
                    ];

                    const docReviewStatus =
                      (state.metadata?.docReviewStatus as Record<string, string>) || {};
                    const step1_2Status: Record<string, string> = {
                      ...docReviewStatus,
                    };
                    for (const doc of effectiveDocItems) {
                      if (!step1_2Status[doc.id] && state.documentChecklist[doc.name]) {
                        step1_2Status[doc.id] = "reviewed";
                      }
                    }

                    const grouped: Record<string, any[]> = {};
                    for (const doc of effectiveDocItems) {
                      const g = doc.group || "Required Now";
                      if (!grouped[g]) grouped[g] = [];
                      grouped[g].push({
                        id: doc.id,
                        icon: ICON_MAP[doc.icon] || "file-text",
                        title: doc.name,
                        sub: doc.subtitle,
                        tags: doc.tag
                          ? [
                              doc.tag === "petitioner"
                                ? "pet"
                                : doc.tag === "beneficiary"
                                  ? "bene"
                                  : doc.tag === "both"
                                    ? "both"
                                    : "3p",
                            ]
                          : [],
                        guideUrl: doc.guideUrl,
                      });
                    }
                    const step1_2Groups = GROUP_ORDER.filter((g) => grouped[g]).map((g) => ({
                      id: g.replace(/\s+/g, "-").toLowerCase(),
                      label: g,
                      badge: BADGE_MAP[g] || "req",
                      items: grouped[g],
                    }));

                    return (
                      <div className="w-full max-w-[740px] px-0 mb-10">
                        <DocListSection
                          groups={step1_2Groups}
                          docsStatus={step1_2Status}
                          uploadedDocuments={uploadedDocuments}
                          isDeletingIds={isDeletingIds}
                          isReloadingDocs={isReloadingDocs}
                          getVaultId={(item) => mapDocumentNameToId(item.title)}
                          findVaultDoc={(item, docs) =>
                            findVaultDocForItem(item.title, mapDocumentNameToId(item.title), docs)
                          }
                          showTags
                          onItemClick={(item) => {
                            setDocActionModal({
                              isOpen: true,
                              doc: { ...item, name: item.title },
                              title: item.title,
                              subtitle: item.sub,
                              onReadGuide: () => {
                                if (item.guideUrl && item.guideUrl !== "/guides") {
                                  window.open(item.guideUrl, "_blank");
                                  if (actions.updateDocumentStatus && item.id)
                                    actions.updateDocumentStatus(item.id, "reviewed");
                                } else {
                                  setSelectedGuideId(item.id || null);
                                  if (actions.updateDocumentStatus && item.id)
                                    actions.updateDocumentStatus(item.id, "in-progress");
                                }
                              },
                              onUpload: () => {
                                const defId = mapDocumentNameToId(item.title);
                                setActiveUploadId(item.id);
                                setActiveUploadType("doc");
                                if (!stepEntitlement.guard()) return;
                                const documentDef = ALL_DOCUMENTS.find((d) => d.id === defId);

                                if (documentDef?.isDynamicCategory) {
                                  setMultipleUploadModalState({
                                    isOpen: true,
                                    categoryId: defId,
                                    documentName: item.title,
                                    options: documentDef.suggestions || [],
                                  });
                                } else if (documentDef) {
                                  openUploadModal(defId);
                                } else {
                                  // Def not in ALL_DOCUMENTS – find parent dynamic category
                                  const parentCat = ALL_DOCUMENTS.find(
                                    (d) =>
                                      d.isDynamicCategory &&
                                      d.suggestions?.some(
                                        (opt: string) => mapDocumentNameToId(opt) === defId
                                      )
                                  );
                                  if (parentCat) {
                                    setMultipleUploadModalState({
                                      isOpen: true,
                                      categoryId: parentCat.id,
                                      documentName: item.title,
                                      options: parentCat.suggestions || [],
                                    });
                                  }
                                }
                              },
                            });
                          }}
                          onPreview={(uploadedDocId) =>
                            window.open(`/api/documents/${uploadedDocId}/download`, "_blank")
                          }
                          onDelete={(id, name) => setDocumentToDelete({ id, name })}
                          progressLabel="reviewed"
                        />
                        <div className="mt-10 px-4 sm:px-5 py-3.5 sm:py-4 bg-[#e8f1fb] rounded-xl text-[#6b8097] leading-relaxed text-center">
                          <span className="block text-[10px] sm:text-[12px] leading-relaxed">
                            Rahvana provides structured guidance only. This is not legal advice.{" "}
                            {/* <br className="hidden sm:block" /> */}
                            Consult a licensed immigration attorney for case-specific decisions.
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : currentStep.step_type === "filing" ? (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="flex flex-col w-full max-w-[660px] pb-[35px]">
                  <h1
                    className="
                mt-8 sm:mt-10 md:mt-0
                text-[clamp(26px,4vw,34px)]
                font-black
                text-[#0f1f38]
                leading-[1.2]
                "
                  >
                    {currentStep.step_name}
                  </h1>
                  <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[28px] max-w-[500px]">
                    {currentStep.filing_data?.subtitle || currentStep.step_description}
                  </p>

                  <div className="flex flex-wrap gap-[8px] mb-[36px]">
                    <span className="text-[11px] font-semibold tracking-[0.06em] uppercase px-[12px] py-[5px] rounded-full bg-[#e8f1fb] text-primary/80 border border-[#d0e4f7]">
                      Petitioner
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.06em] uppercase px-[12px] py-[5px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
                      Decision · Form I-130
                    </span>
                  </div>

                  {isLocked ? (
                    <div
                      className={`mb-[20px] p-[22px_20px] rounded-[14px] border-2 border-transparent flex items-center gap-[16px] animate-in zoom-in-95 duration-300
                    ${state.metadata.filingMethod === "online" ? "bg-[#0e5c42] border-[#0a4330]" : "bg-[#2e1f72] border-[#1e1348]"}`}
                    >
                      <div
                        className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 text-[18px] font-bold
                      ${state.metadata.filingMethod === "online" ? "bg-[#6dddb8] text-[#0e5c42]" : "bg-[#a89af5] text-[#2e1f72]"}`}
                      >
                        {state.metadata.filingMethod === "online" ? (
                          "✓"
                        ) : (
                          <Mail size={20} strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[10px] font-bold uppercase tracking-widest mb-[3px] 
                        ${state.metadata.filingMethod === "online" ? "text-[#6dddb8]" : "text-[#a89af5]"}`}
                        >
                          Filing method selected
                        </div>
                        <h3 className="text-[19px]  font-medium text-white mb-[2px] leading-[1.2]">
                          {state.metadata.filingMethod === "online"
                            ? "File Online"
                            : "File by Mail"}
                        </h3>
                        <div className="text-[12px] text-white/65 leading-tight">
                          {state.metadata.filingMethod === "online"
                            ? "$625 · myUSCIS account · instant receipt number"
                            : "$675 · physical packet · mailed to USCIS"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsLocked(false);
                          actions.updateMetadata({
                            filingMethodConfirmed: false,
                          });
                        }}
                        className="px-[14px] py-[7px] rounded-full border-[1.5px] border-white/30 text-[12px] font-semibold text-white/80 hover:bg-white/15 hover:border-white/60 hover:text-white transition-all whitespace-nowrap shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#6b8097] mb-[14px]">
                        Select your filing method
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] mb-[16px]">
                        {currentStep.filing_data?.methods.map((method) => {
                          const isSelected = state.metadata.filingMethod === method.id;
                          const isOnline = method.id === "online";

                          const pIdleBg = isOnline ? "bg-[#f0faf6]" : "bg-[#f2f0fb]";
                          const pIdleBorder = isOnline ? "border-[#8ecdb8]" : "border-[#b0a6e2]";
                          const pIdleText = isOnline ? "text-[#0e5c42]" : "text-[#2e1f72]";
                          const pIdleSub = isOnline ? "text-[#0e5c42]/65" : "text-[#2e1f72]/65";
                          const pIdleBull = isOnline ? "text-[#0e5c42]/75" : "text-[#2e1f72]/75";

                          const pSelBg = isOnline ? "bg-[#0e5c42]" : "bg-[#2e1f72]";
                          const pSelFee = isOnline
                            ? "bg-[#6dddb8] text-[#0e5c42]"
                            : "bg-[#a89af5] text-[#2e1f72]";
                          const pSelText = isOnline ? "text-[#6dddb8]" : "text-[#a89af5]";
                          const shadowLight = isOnline
                            ? "rgba(14,92,66,0.18)"
                            : "rgba(46,31,114,0.18)";

                          return (
                            <button
                              key={method.id}
                              onClick={() =>
                                actions.updateMetadata({
                                  filingMethod: method.id,
                                })
                              }
                              className={`relative text-left p-[22px_20px_20px] rounded-[14px] border-2 transition-all duration-[0.24s] select-none
                                ${
                                  isSelected
                                    ? `${pSelBg} border-transparent shadow-[0_0_0_3px_${shadowLight},0_8px_32px_rgba(15,31,56,0.13),0_2px_8px_rgba(15,31,56,0.06)] transform -translate-y-[2px]`
                                    : `${pIdleBg} ${pIdleBorder} hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(15,31,56,0.13),0_2px_8px_rgba(15,31,56,0.06)]`
                                }`}
                            >
                              <div
                                className={`absolute top-[13px] right-[13px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold transition-opacity duration-[0.24s]
                              ${isSelected ? `opacity-100 ${pSelFee}` : "opacity-0"}`}
                              >
                                ✓
                              </div>

                              <div
                                className={`text-[10px] font-bold uppercase tracking-widest mb-[10px] transition-colors duration-[0.24s] ${isSelected ? pSelText : pIdleText}`}
                              >
                                {isOnline ? "Online Filing" : "Paper Filing"}
                              </div>
                              <h3
                                className={`text-[20px]  leading-[1.2] mb-[8px] transition-colors duration-[0.24s] ${isSelected ? "text-white" : pIdleText}`}
                              >
                                {method.name}
                              </h3>
                              <div
                                className={`text-[30px] font-bold tracking-[-0.01em] mb-[2px] transition-colors duration-[0.24s] ${isSelected ? "text-white" : pIdleText}`}
                              >
                                {method.price}
                              </div>
                              <div
                                className={`text-[12px] mb-[16px] transition-colors duration-[0.24s] ${isSelected ? "text-white/70" : pIdleSub}`}
                              >
                                {method.subtitle}
                              </div>
                              <ul className="flex flex-col gap-[6px]">
                                {method.features.map((f, i) => (
                                  <li
                                    key={i}
                                    className={`flex items-start gap-[6px] text-[12px] leading-[1.45] transition-colors duration-[0.24s] ${isSelected ? "text-white/70" : pIdleBull}`}
                                  >
                                    <div
                                      className={`w-[4px] h-[4px] rounded-full mt-[5px] shrink-0 transition-colors duration-[0.24s] ${isSelected ? "bg-" + (isOnline ? "[#6dddb8]" : "[#a89af5]") : "bg-" + (isOnline ? "[#0e5c42]" : "[#2e1f72]")}`}
                                    />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col gap-[10px] mb-[28px]">
                        <button
                          onClick={() => handleConfirmation(state.metadata.filingMethod as string)}
                          className={`w-full p-[15px_24px] rounded-[14px] text-white font-semibold text-[15px] transition-all duration-[0.24s] shadow-sm transform
                            ${!state.metadata.filingMethod ? "hidden" : "block"}
                            ${
                              state.metadata.filingMethod === "online"
                                ? "bg-[#0e5c42] hover:bg-[#0a4330] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(14,92,66,0.35)]"
                                : "bg-[#2e1f72] hover:bg-[#1e1348] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(46,31,114,0.35)]"
                            }`}
                        >
                          Confirm:{" "}
                          {state.metadata.filingMethod === "online"
                            ? "File Online"
                            : "File by Mail"}{" "}
                          →
                        </button>

                        <button
                          onClick={() => {
                            setShowQuiz(true);
                            setQuizScreenIdx(0);
                            setQuizAnswers({});
                            setQuizResult(null);
                          }}
                          className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] text-[#3a4f63] rounded-[14px] font-medium text-[14px] hover:border-primary hover:text-primary hover:bg-primary/[0.12] transition-all flex items-center justify-center gap-[9px] group"
                        >
                          <div
                            className="w-[20px] h-[20px] border-[1.5px] border-current flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ borderRadius: "50%" }}
                          >
                            ?
                          </div>
                          <span>Not sure? Help me choose the right method</span>
                        </button>
                      </div>

                      <p className="p-[12px_16px] bg-[#e8f1fb] rounded-[9px] text-[12px] text-[#6b8097] leading-[1.6] m-0">
                        {currentStep.filing_data?.footerNote ||
                          "Fees as of March 2026 per the USCIS G-1055 fee schedule. Processing time is the same for both methods. Always verify at uscis.gov before filing."}
                      </p>
                    </div>
                  )}

                  {currentStep.tool_data?.disclaimer && (
                    <div className="mt-8 p-[12px_16px] bg-[#e8f1fb] rounded-[9px] text-[12px] text-[#6b8097] leading-[1.6] m-0">
                      <span>{currentStep.tool_data.disclaimer}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`bg-white border border-[#d0e4f7] rounded-[20px] sm:rounded-[28px] md:rounded-[32px] p-4 sm:p-8 md:p-12 lg:p-20 shadow-xl shadow-[#0f1f38]/5 animate-in fade-in zoom-in-95 duration-700 w-full max-w-[740px] mx-auto mt-4 sm:mt-8 md:mt-12 ${isChapter1 ? "step-modal-spacing" : ""}`}
              >
                <div
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 opacity-70 ${isChapter1 ? "accent-rose" : "text-primary"}`}
                >
                  Case Update
                </div>
                <h1
                  className={`text-[clamp(26px,4vw,34px)] font-black leading-[1.2] ${isChapter1 ? "accent-brown" : "text-[#0f1f38]"}`}
                >
                  {currentStep.step_name}
                </h1>
                <p
                  className={`text-[15px] leading-[1.65] mb-[28px] max-w-[500px] ${isChapter1 ? "accent-brown" : "text-[#3a4f63]"}`}
                >
                  {currentStep.step_description}
                </p>

                {currentStep.actions && currentStep.actions.length > 0 && (
                  <div className="space-y-3 mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-[#6b8097]">
                        Key Tasks
                      </span>
                      <div className="h-px flex-1 bg-primary/30" />
                    </div>
                    {currentStep.actions.map((act: string, i: number) => (
                      <div
                        key={i}
                        className="flex gap-4 p-5 rounded-[20px] bg-[#fafcff] border border-[#d0e4f7] group hover:border-primary transition-all"
                      >
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-[#d0e4f7] flex items-center justify-center shrink-0 group-hover:border-primary transition-colors mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary" />
                        </div>
                        <span className="text-[16px] text-[#0f1f38] font-bold tracking-tight">
                          {act}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {currentStep.step_type !== "tool" && renderCitationsSection()}
          </div>
        </div>
      )}

      {/* Redesigned Bottom Navigation Footer */}
      <footer className="absolute bottom-0 left-0 right-0 h-[58px] bg-[#fafcff] border-t border-[#d0e4f7] flex items-center px-4 gap-3 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Prev */}
        <button
          onClick={() => {
            if (prevStepLock.isLocked) {
              setUpgradeModalFeature(getModalFeatureForTier(prevStepLock.requiredPlan!));
              return;
            }
            prevStep && handleNavigate((prevStep as any).step_key || (prevStep as any).id);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-[1.5px] border-[#d0e4f7] text-[13px] font-medium text-[#6b8097] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a] shrink-0 ${!prevStep ? "invisible pointer-events-none" : ""} ${prevStepLock.isLocked ? "opacity-90 saturate-[0.8]" : ""}`}
        >
          {prevStepLock.isLocked && <Lock size={12} className="mr-1" />}
          <ArrowLeft size={13} strokeWidth={2.5} />
          Prev
        </button>

        {/* Progress */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-[#d0e4f7] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-[#6b8097] whitespace-nowrap">
            {localIdx + 1} / {activeStepsInChapter.length}
          </span>
        </div>

        {/* Next */}
        <button
          onClick={() => {
            if (nextStepLock.isLocked) {
              setUpgradeModalFeature(getModalFeatureForTier(nextStepLock.requiredPlan!));
              return;
            }
            nextStep && handleNavigate((nextStep as any).step_key || (nextStep as any).id);
          }}
          className={`px-[18px] py-[9px] bg-primary rounded-[10px] text-[13px] font-semibold text-white flex items-center gap-[5px] transition-all hover:brightness-110 active:scale-95 shrink-0 shadow-sm shadow-primary/20 ${!nextStep || !isCompleted ? "invisible pointer-events-none" : ""} ${nextStepLock.isLocked ? "opacity-90 saturate-[0.8]" : ""}`}
        >
          {nextStepLock.isLocked && <Lock size={12} className="mr-1" />}
          Next
          <ArrowRight size={12} strokeWidth={2.5} />
        </button>
      </footer>

      {/* Sponsorship Calculator Tool Overlay */}
      <SponsorshipCalculatorTool
        isOpen={isSponsorshipCalcOpen}
        onClose={() => setIsSponsorshipCalcOpen(false)}
        initialData={sponsorshipResult?.raw}
        onSave={(result: any) => {
          actions.updateMetadata({ sponsorshipResult: result });
          setIsSponsorshipCalcOpen(false);
          if (!isCompleted) actions.toggleComplete("step_2_5");
        }}
      />

      {/* Global Modals */}
      <CredentialFormModal
        isOpen={isWalletFormOpen}
        onClose={() => setIsWalletFormOpen(false)}
        portalType={walletPortalType}
        mode={walletMode}
        icon={
          walletPortalType === "USCIS" ? (
            <ShieldCheck className="text-teal-600" />
          ) : walletPortalType === "COURIER" ? (
            <Truck className="text-primary" />
          ) : (
            <Zap className="text-amber-500" />
          )
        }
        initialData={(() => {
          const creds =
            walletPortalType === "USCIS"
              ? uscisCredentials
              : walletPortalType === "COURIER"
                ? courierCredentials
                : ceacCredentials;
          return creds
            ? {
                username: creds.username,
                password: "",
                securityQuestions: creds.security_questions.map((sq) => ({
                  id: sq.id,
                  question: sq.question,
                  answer: "",
                })),
              }
            : undefined;
        })()}
        onSubmit={handleSaveCredentials}
        isSubmitting={isSubmittingCreds}
      />

      <ViewCredentialModal
        isOpen={isWalletViewOpen}
        onClose={() => setIsWalletViewOpen(false)}
        portalType={walletPortalType}
        credential={
          walletPortalType === "USCIS"
            ? uscisCredentials
            : walletPortalType === "COURIER"
              ? courierCredentials
              : ceacCredentials
        }
        icon={
          <ShieldCheck
            className={walletPortalType === "COURIER" ? "text-indigo-600" : "text-primary"}
          />
        }
        onRevealPassword={handleRevealPassword}
        onRevealAnswer={handleRevealAnswer}
        onRevealCaseNumber={async () => ""}
        onRevealInvoiceId={async () => ""}
        onEdit={() => {
          setWalletMode("edit");
          setIsWalletViewOpen(false);
          setIsWalletFormOpen(true);
        }}
        onDelete={() => {
          setIsWalletViewOpen(false);
          setShowDeleteConfirmation(true);
        }}
      />

      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      {renderDocActionModal()}

      <ConfirmationModal
        open={showPrerequisiteModal}
        onOpenChange={setShowPrerequisiteModal}
        title="Incomplete Prerequisite"
        description="Please complete Step 1 (Determine Eligibility) before accessing Step 2. Your eligibility answers are needed to customize your document checklist."
        confirmText="Go to Step 1"
        onConfirm={() => {
          setShowPrerequisiteModal(false);
          handleNavigate("step_1_1");
        }}
      />

      <ConfirmationModal
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Delete Credentials"
        description="Are you sure you want to delete these credentials? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={async () => {
          await handleDeleteCredentials(walletPortalType);
          setShowDeleteConfirmation(false);
        }}
        loading={isSubmittingCreds}
      />

      {/* Global Document Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        title="Delete Document"
        description={`Are you sure you want to permanently delete "${documentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!documentToDelete) return;
          const docId = documentToDelete.id;
          // Close modal immediately so UI drops back to "Deleting..." spinner inline
          setDocumentToDelete(null);

          try {
            await deleteDocument(docId);
            showToast("Document deleted successfully", "success");
          } catch (err) {
            showToast(`${msg(E.VAULT_DELETE_FAILED)}`, "error");
          }
        }}
      />

      <NvcFeeModal
        isOpen={isNvcFeeModalOpen}
        onClose={() => setIsNvcFeeModalOpen(false)}
        data={nvcFeeData}
        onSave={handleSaveNvcFee}
      />

      <CeacCredsModal
        isOpen={isCeacModalOpen}
        onClose={() => setIsCeacModalOpen(false)}
        onSave={handleSaveCredentials}
        initialData={ceacCredentials}
        isSubmitting={isSubmittingCreds}
      />

      {isCitationsModalOpen && (
        <div className="fixed inset-0 z-300 bg-black/40 backdrop-blur-xs flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] w-full max-w-[500px] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between p-6 pb-0 mb-4">
              <div className="flex items-center gap-2">
                <Book
                  className="h-[20px] w-[20px] text-primary shrink-0 animate-pulse"
                  strokeWidth={2.5}
                />
                <h2 className="text-[20px] font-bold text-[#0c1b33]">
                  Official References & Citations
                </h2>
              </div>
              <button
                onClick={() => setIsCitationsModalOpen(false)}
                className="w-[30px] h-[30px] rounded-full bg-[#f4f7fb] flex items-center justify-center hover:bg-[#d0e4f7] transition-all cursor-pointer border-none outline-none"
              >
                <X size={13} className="text-[#3a4f63]" />
              </button>
            </div>

            <div className="p-6 pt-0">
              <div className="h-px bg-[#d0e4f7] mb-4" />
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {(STEP_CITATIONS[sId] || []).map((cite, index) => (
                  <a
                    key={index}
                    href={cite.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-[14px] bg-[#fafcff] hover:bg-white border border-[#e1eefc] hover:border-primary hover:shadow-xs group transition-all"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13.5px] sm:text-[14px] font-bold text-[#0f1f38] group-hover:text-primary transition-colors">
                        {cite.text}
                      </span>
                    </div>
                    <ExternalLink
                      className="h-4 w-4 text-[#6b8097] group-hover:text-primary transition-colors shrink-0 ml-3"
                      strokeWidth={2}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCivilDocGuideOpen && activeCivilDoc && (
        <CivilDocGuideOverlay
          isOpen={isCivilDocGuideOpen}
          onClose={() => setIsCivilDocGuideOpen(false)}
          doc={activeCivilDoc}
          status={
            (docGuideContext === "gathering" ? gatheringDocsStatus : civilDocsStatus)[
              activeCivilDoc.id
            ] || "not-started"
          }
          onMarkReviewed={() => handleMarkDocReviewed(activeCivilDoc.id)}
        />
      )}

      {isFinancialDocGuideOpen && activeFinancialDoc && (
        <FinancialDocGuideOverlay
          isOpen={isFinancialDocGuideOpen}
          onClose={() => setIsFinancialDocGuideOpen(false)}
          doc={activeFinancialDoc}
          status={financialDocsStatus[activeFinancialDoc.id] || "not-started"}
          onMarkReviewed={() => {
            const next = {
              ...financialDocsStatus,
              [activeFinancialDoc.id]: "reviewed",
            };
            actions.updateMetadata({ financialDocsStatus: next });
          }}
        />
      )}

      {selectedGuideId && InlineGuideData[selectedGuideId] && (
        <div className="fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom-4 duration-300 ease-out bg-white">
          {/* Guide Topbar */}
          <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
            <button
              onClick={() => setSelectedGuideId(null)}
              className="w-[36px] h-[36px] rounded-full border-none bg-[#f5f7fa] cursor-pointer flex items-center justify-center transition-all hover:bg-[#e8f1fb] shrink-0 outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close guide"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[16px] h-[16px] stroke-[#3a4f63] fill-none stroke-2 shrink-0"
                style={{ strokeLinecap: "round" }}
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 h-[5px] bg-primary/30 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-primary to-primary transition-all duration-300 w-full" />
            </div>
            <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
              Guide
            </div>
          </div>

          {/* Guide Body */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
            <div className="w-full max-w-[680px] flex flex-col">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                Step 2 · Gather Required Documents
              </div>
              <div className="inline-flex items-center gap-[5px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] w-fit mb-6">
                <div
                  className={`w-[6px] h-[6px] rounded-full shrink-0 ${InlineGuideData[selectedGuideId].sourceType === "internal" ? "bg-[#3a4f63]" : "bg-primary"}`}
                />
                <span className="text-[11px] font-medium text-[#3a4f63]">
                  {InlineGuideData[selectedGuideId].sourceType === "internal"
                    ? "Roadmap Module"
                    : `Rahvana Guide — ${InlineGuideData[selectedGuideId].title}`}
                </span>
              </div>
              <h2 className="font-black text-[clamp(22px,3.5vw,28px)] text-[#0f1f38] mb-[6px] leading-[1.25]">
                {InlineGuideData[selectedGuideId].title}
              </h2>
              <p className="text-[14px] text-[#3a4f63] mb-[28px] leading-[1.6]">
                {InlineGuideData[selectedGuideId].sub}
              </p>

              {/* Sections */}
              <div className="w-full flex flex-col">
                {selectedGuideId === "doc_passport_photos" ? (
                  <div className="mb-4">
                    <PassportPhotoTool showHeader={false} showRequirements={true} />
                  </div>
                ) : selectedGuideId === "doc_translations" ? (
                  <div className="mb-4">
                    <DocumentTranslationTool
                      showHeader={false}
                      showRequirements={true}
                      showRequestsLink={false}
                    />
                  </div>
                ) : (
                  InlineGuideData[selectedGuideId].sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px]"
                    >
                      <div className="text-[13px] font-semibold tracking-[0.05em] uppercase text-[#6b8097] mb-[10px]">
                        {section.title}
                      </div>
                      <div
                        className="guide-content"
                        dangerouslySetInnerHTML={{
                          __html: section.htmlContent,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-[10px] mt-[28px] mb-[40px]">
                <button
                  onClick={async () => {
                    if (actions.updateDocumentStatus && selectedGuideId) {
                      await actions.updateDocumentStatus(selectedGuideId, "reviewed");
                      if (sId === "step_1_2") {
                        const docItems = currentStep.document_items || [];
                        const allReviewed = docItems.every((doc: any) => {
                          if (doc.id === selectedGuideId) return true;
                          return (
                            state.metadata?.docReviewStatus?.[doc.id] === "reviewed" ||
                            state.documentChecklist[doc.name]
                          );
                        });
                        if (allReviewed && !isCompleted) {
                          handleToggleComplete();
                        }
                      }
                    }
                    setSelectedGuideId(null);
                  }}
                  className="w-full p-[15px_24px] bg-[#15744f] text-white border-none rounded-[16px] font-bold text-[15px] transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center"
                >
                  Mark as reviewed
                </button>
                <button
                  onClick={() => setSelectedGuideId(null)}
                  className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[16px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#0c1b33] transition-all text-center"
                >
                  ← Back to document list
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Household Doc Guide Overlay */}
      {isHhDocGuideOpen && activeHhDoc && (
        <HouseholdDocGuideOverlay
          isOpen={isHhDocGuideOpen}
          onClose={() => setIsHhDocGuideOpen(false)}
          doc={activeHhDoc}
          status={hhDocsStatus[activeHhDoc.id]}
          onMarkReviewed={() => {
            const next = {
              ...hhDocsStatus,
              [activeHhDoc.id]: "reviewed",
            };
            setHhDocsStatus(next);
            actions.updateMetadata({ hhDocsStatus: next });
          }}
        />
      )}

      {isMedicalGuideOpen && medicalToolData?.type === "medical_exam_guide" && (
        <MedicalTutOverlay
          isOpen={isMedicalGuideOpen}
          onClose={() => setIsMedicalGuideOpen(false)}
          tutorial={medicalToolData.tutorial || []}
          index={medicalGuideIdx}
          setIndex={setMedicalGuideIdx}
        />
      )}

      {isInterviewDayTutOpen && currentStep?.tool_data?.type === "interview_day" && (
        <InterviewDayTutOverlay
          isOpen={isInterviewDayTutOpen}
          onClose={() => setIsInterviewDayTutOpen(false)}
          tutorial={(currentStep.tool_data as any).tutorial || []}
          index={interviewDayTutIdx}
          setIndex={setInterviewDayTutIdx}
        />
      )}

      {isCourierGuideOpen && courierToolData?.type === "courier_registration" && (
        <CourierTutOverlay
          isOpen={isCourierGuideOpen}
          onClose={() => setIsCourierGuideOpen(false)}
          tutorial={courierToolData.tutorial || []}
          index={courierGuideIdx}
          setIndex={setCourierGuideIdx}
        />
      )}

      {isApUpdateModalOpen && (currentStep?.tool_data as any)?.recorder && (
        <ApUpdateModal
          isOpen={isApUpdateModalOpen}
          onClose={() => setIsApUpdateModalOpen(false)}
          onSave={(entry: any) => handleSaveApUpdate(entry)}
          ceacOptions={(currentStep.tool_data as any).recorder.ceac_options}
        />
      )}

      {/* Tutorial Overlay */}
      {isTutorialOpen &&
        (() => {
          // If useCeacGuideData is true, prefer the CEAC tutorial_steps on the current step
          if (useCeacGuideData) {
            const tool = currentStep?.tool_data;
            const dynamicStepsRaw = tool?.tutorial_steps;

            let dynamicSteps: any[] | null = null;
            let commonSteps: any[] | null = null;
            let isDynamic = false;
            const effectivePath = tutorialPath || "household_member";

            if (dynamicStepsRaw) {
              if (Array.isArray(dynamicStepsRaw)) {
                dynamicSteps = dynamicStepsRaw;
                isDynamic = dynamicStepsRaw.length > 0;
              } else if (typeof dynamicStepsRaw === "object") {
                const rawSteps = dynamicStepsRaw as any;
                if (Array.isArray(rawSteps.common)) {
                  commonSteps = rawSteps.common;
                }
                const branchSteps = rawSteps[effectivePath];
                if (tutorialPath && Array.isArray(commonSteps) && Array.isArray(branchSteps)) {
                  dynamicSteps = [...commonSteps, ...branchSteps];
                } else if (Array.isArray(commonSteps) && !tutorialPath) {
                  dynamicSteps = commonSteps;
                } else {
                  dynamicSteps = branchSteps;
                }
                isDynamic = !!(dynamicSteps && dynamicSteps.length > 0);
              }
            }

            const steps =
              isDynamic && dynamicSteps
                ? dynamicSteps
                : tool?.type === "household_member"
                  ? HOUSEHOLD_TUTORIAL_STEPS
                  : USCIS_TUTORIAL_STEPS;

            if (!Array.isArray(steps) || steps.length === 0) return null;

            const safeTutorialIdx = Math.min(Math.max(tutorialIdx, 0), steps.length - 1);
            const currentTutStep = steps[safeTutorialIdx];
            if (!currentTutStep) return null;
            const branchChoiceActive =
              !tutorialPath &&
              Array.isArray(commonSteps) &&
              safeTutorialIdx === commonSteps.length - 1;
            const dynamicTutStep = currentTutStep as any;
            const hideBrowserFrame = Boolean(dynamicTutStep.choiceOptions && !dynamicTutStep.media);

            return (
              <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out">
                {/* Tutorial Topbar */}
                <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
                  <button
                    onClick={() => {
                      setIsTutorialOpen(false);
                      setUseCeacGuideData(false);
                    }}
                    className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/30 transition-all cursor-pointer"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>

                  <div className="flex-1 h-[5px] bg-primary/30 rounded-[10px] overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary to-primary rounded-[10px] transition-all duration-[0.4s] ease-out"
                      style={{
                        width: `${((safeTutorialIdx + 1) / steps.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                    {safeTutorialIdx + 1} / {steps.length}
                  </div>
                </div>

                {/* Tutorial Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-[48px_24px_40px] flex flex-col items-center bg-white">
                  <div className="w-full max-w-[580px] flex flex-col">
                    <div
                      className={`text-[11px] font-semibold tracking-widest uppercase mb-4 ${isChapter1 ? "accent-rose" : "text-primary"}`}
                    >
                      {currentTutStep.label}
                    </div>
                    <h2
                      className={`text-[clamp(20px,3.2vw,26px)] font-black mb-2 leading-[1.3] ${isChapter1 ? "accent-brown" : "text-[#0c1b33]"}`}
                    >
                      {currentTutStep.heading}
                    </h2>
                    <div
                      className="text-[14px] text-[#3a4f63] leading-[1.7] mb-5"
                      dangerouslySetInnerHTML={{
                        __html: currentTutStep.instruction,
                      }}
                    />

                    {branchChoiceActive && (currentTutStep as any).choiceOptions && (
                      <div className="mb-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097] mb-2">
                          {(currentTutStep as any).vlabel ||
                            (currentTutStep as any).ss_label ||
                            (currentTutStep as any).screenTitle ||
                            "Choose route"}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                          {(currentTutStep as any).choiceOptions.map((option: any) => {
                            const isHousehold = option.path === "household_member";
                            return (
                              <button
                                key={option.path}
                                type="button"
                                onClick={() => {
                                  setTutorialPath(option.path);
                                  setTutorialIdx(commonSteps?.length || 0);
                                }}
                                className={`group relative overflow-hidden text-left transition-all duration-200 ${
                                  isHousehold
                                    ? "choice-card choice-card--household"
                                    : "choice-card choice-card--joint"
                                }`}
                              >
                                <div className="flex flex-col">
                                  <div className="choice-title">{option.label}</div>
                                  <div className="choice-desc">
                                    {isHousehold
                                      ? "Use this when the person lives with the petitioner and their income will be counted as a household member."
                                      : "Use this when the person is a separate sponsor meeting the income requirement on their own."}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Screenshot Block — Media or Fallback UI with Browser Chrome */}
                    {!hideBrowserFrame && (
                      <div className="w-full rounded-[10px] overflow-hidden border-[1.5px] border-[#d0e4f7] mb-5 shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
                        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] h-[34px] flex items-center px-[14px] gap-[7px]">
                          <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                          <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                          <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                          <div className="flex-1 h-[20px] bg-[#fafcff] rounded-[5px] border border-[#d0e4f7] ml-[10px] flex items-center px-[10px]">
                            <span className="text-[10px] text-[#6b8097] font-mono">
                              {currentTutStep.vlabel ||
                                (currentTutStep as any).ss_label ||
                                currentTutStep.heading}
                            </span>
                          </div>
                        </div>

                        {/* Content Area — Image or Mock UI */}
                        <div
                          className="relative w-full bg-[#f8f9fb]"
                          style={{ aspectRatio: "4/3" }}
                        >
                          {currentTutStep.media && currentTutStep.media.type === "img" ? (
                            <img
                              src={currentTutStep.media.src}
                              alt={currentTutStep.heading}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col gap-[16px] px-[24px] py-[28px] w-full items-center justify-center overflow-hidden">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b8097] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] shrink-0">
                                {currentTutStep.vlabel ||
                                  (currentTutStep as any).ss_label ||
                                  currentTutStep.heading}
                              </span>
                              <div className="text-[18px] font-semibold text-[#0c1b33] text-center leading-snug">
                                {currentTutStep.heading}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Note Block */}
                    {currentTutStep.note && (
                      <div className="bg-[#e8f5ef] border-l-4 border-[#15744f] p-[12px_14px] rounded-[4px] mb-5">
                        <div className="text-[12px] text-[#3a4f63] leading-[1.6]">
                          {currentTutStep.note}
                        </div>
                      </div>
                    )}

                    {/* Tutorial Controls */}
                    <div className="flex items-center justify-center py-[20px]">
                      <div className="w-full flex gap-[10px] items-center">
                        {safeTutorialIdx > 0 && (
                          <button
                            onClick={() => setTutorialIdx(safeTutorialIdx - 1)}
                            className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
                          >
                            ← Back
                          </button>
                        )}
                        {branchChoiceActive ? (
                          <button
                            onClick={() => setTutorialIdx(commonSteps?.length || 0)}
                            className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
                          >
                            Continue after choosing
                          </button>
                        ) : safeTutorialIdx < steps.length - 1 ? (
                          <button
                            onClick={() => setTutorialIdx(safeTutorialIdx + 1)}
                            className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsTutorialOpen(false);
                              setUseCeacGuideData(false);
                            }}
                            className="flex-1 p-[13px_22px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center"
                          >
                            Done — return to step
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const tool = currentStep?.tool_data;
          const dynamicStepsRaw = tool?.tutorial_steps;

          let dynamicSteps: any[] | null = null;
          let isDynamic = false;
          const effectivePath = tutorialPath || "household_member";

          if (dynamicStepsRaw) {
            if (Array.isArray(dynamicStepsRaw)) {
              dynamicSteps = dynamicStepsRaw;
              isDynamic = dynamicStepsRaw.length > 0;
            } else if (typeof dynamicStepsRaw === "object") {
              dynamicSteps = (dynamicStepsRaw as any)[effectivePath];
              isDynamic = !!(dynamicSteps && dynamicSteps.length > 0);
            }
          }

          const steps =
            isDynamic && dynamicSteps
              ? dynamicSteps
              : tool?.type === "household_member"
                ? HOUSEHOLD_TUTORIAL_STEPS
                : USCIS_TUTORIAL_STEPS;

          if (!Array.isArray(steps) || steps.length === 0) return null;

          const safeTutorialIdx = Math.min(Math.max(tutorialIdx, 0), steps.length - 1);
          const currentTutStep = steps[safeTutorialIdx];
          if (!currentTutStep) return null;

          return (
            <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out bg-white">
              {/* Tutorial Topbar */}
              <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
                <button
                  onClick={() => {
                    setIsTutorialOpen(false);
                    setTutorialPath(null);
                    setUseCeacGuideData(false);
                  }}
                  className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/30 transition-all cursor-pointer"
                >
                  <X size={16} strokeWidth={2} />
                </button>

                <div className="flex-1 h-[5px] bg-primary/30 rounded-[10px] overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary to-primary rounded-[10px] transition-all duration-[0.4s] ease-out"
                    style={{
                      width: `${((safeTutorialIdx + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                  {safeTutorialIdx + 1} / {steps.length}
                </div>
              </div>

              {/* Tutorial Body */}
              <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center bg-white">
                <div className="w-full max-w-[580px] flex flex-col">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                    {isDynamic
                      ? currentTutStep.label
                      : (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).label}
                  </div>
                  <h2 className="text-[clamp(20px,3.2vw,26px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
                    {currentTutStep.heading}
                  </h2>
                  <div
                    className="text-[14px] text-[#3a4f63] leading-[1.7] mb-5"
                    dangerouslySetInnerHTML={{
                      __html: currentTutStep.instruction,
                    }}
                  />

                  {/* Screenshot Block */}
                  {isDynamic ? (
                    /* Dynamic steps: browser chrome + structured visual */
                    <div className="w-full rounded-[10px] overflow-hidden border-[1.5px] border-[#d0e4f7] mb-5 shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
                      {/* Browser Chrome Bar */}
                      <div className="bg-[#eef3fa] border-b border-[#d0e4f7] h-[34px] flex items-center px-[14px] gap-[7px]">
                        <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                        <div className="flex-1 h-[20px] bg-[#fafcff] rounded-[5px] border border-[#d0e4f7] ml-[10px] flex items-center px-[10px]">
                          <span className="text-[10px] text-[#6b8097] font-mono">
                            {(currentTutStep as TutorialStepData).url}
                          </span>
                        </div>
                      </div>

                      {/* Content Area — aspectRatio only, no minHeight */}
                      <div className="relative w-full bg-[#f8f9fb]" style={{ aspectRatio: "4/3" }}>
                        {(currentTutStep as TutorialStepData).media?.src ? (
                          (currentTutStep as TutorialStepData).media?.type === "video" ? (
                            <TutorialVideo
                              key={(currentTutStep as TutorialStepData).media!.src}
                              src={(currentTutStep as TutorialStepData).media!.src!}
                              poster={(currentTutStep as TutorialStepData).videoMeta?.poster}
                              alt={(currentTutStep as TutorialStepData).screenTitle}
                            />
                          ) : (
                            <Image
                              key={(currentTutStep as TutorialStepData).media!.src || tutorialIdx}
                              src={(currentTutStep as TutorialStepData).media!.src!}
                              alt={(currentTutStep as TutorialStepData).screenTitle}
                              fill
                              className="object-contain"
                              sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
                              quality={95}
                              priority={tutorialIdx === 0}
                            />
                          )
                        ) : (currentTutStep as TutorialStepData).video ? (
                          <TutorialVideo
                            src={(currentTutStep as TutorialStepData).video!}
                            poster={(currentTutStep as TutorialStepData).videoMeta?.poster}
                            alt={(currentTutStep as TutorialStepData).screenTitle}
                          />
                        ) : (currentTutStep as TutorialStepData).screenshot ? (
                          <Image
                            src={((currentTutStep as TutorialStepData).screenshot as string) || ""}
                            alt={(currentTutStep as TutorialStepData).screenTitle}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
                            quality={95}
                            priority={tutorialIdx === 0}
                          />
                        ) : (
                          /* Fallback placeholder — absolute to fill ratio box */
                          <div className="absolute inset-0 flex flex-col gap-[16px] px-[24px] py-[28px] items-center justify-center overflow-hidden">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b8097] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] shrink-0">
                              {(currentTutStep as TutorialStepData).ss_label ||
                                (currentTutStep as TutorialStepData).screenTitle ||
                                (currentTutStep as TutorialStepData).ss_headline ||
                                currentTutStep.heading}
                            </span>

                            <div className="text-[18px] font-semibold text-[#0c1b33] text-center leading-snug">
                              {(currentTutStep as TutorialStepData).ss_headline ||
                                (currentTutStep as TutorialStepData).screenTitle}
                            </div>

                            {((currentTutStep as TutorialStepData).ss_desc ||
                              (currentTutStep as TutorialStepData).screenDesc) && (
                              <div className="text-[13px] text-[#5a6f85] leading-[1.55] bg-[#f8fafb] border-l-[3px] border-[#d0e4f7] pl-[12px] py-[8px] text-center">
                                {(currentTutStep as TutorialStepData).ss_desc ||
                                  (currentTutStep as TutorialStepData).screenDesc}
                              </div>
                            )}

                            {(currentTutStep as TutorialStepData).ss_highlight && (
                              <div className="px-[16px] py-[12px] bg-[rgba(47,111,212,0.12)] border-[1.5px] border-[rgba(47,111,212,0.22)] rounded-[10px] text-[13px] font-semibold text-primary text-center">
                                ✓ {(currentTutStep as TutorialStepData).ss_highlight}
                              </div>
                            )}

                            {(currentTutStep as TutorialStepData).fields &&
                              (currentTutStep as TutorialStepData).fields!.length > 0 && (
                                <div className="flex flex-col gap-[8px] w-full max-w-[320px]">
                                  {(currentTutStep as TutorialStepData).fields!.map((field, idx) =>
                                    field.type === "btn" ? (
                                      <div
                                        key={idx}
                                        className="w-full px-[16px] py-[10px] bg-[#2f6fd4] text-white border-none rounded-[8px] text-[13px] font-semibold cursor-default opacity-90 text-center"
                                      >
                                        {field.label}
                                      </div>
                                    ) : (
                                      <div key={idx} className="flex flex-col gap-[4px]">
                                        {field.label && (
                                          <label className="text-[12px] font-medium text-[#3a4f63]">
                                            {field.label}
                                          </label>
                                        )}
                                        <input
                                          type={field.isPassword ? "password" : "text"}
                                          placeholder={field.placeholder}
                                          disabled
                                          className="w-full px-[12px] py-[8px] border border-[#d0e4f7] rounded-[6px] text-[13px] bg-[#f8fafb] text-[#9a9a9a]"
                                        />
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Caption Bar */}
                      <div
                        className={`p-[8px_14px_10px] border-t text-[11px] leading-normal ${
                          (currentTutStep as TutorialStepData).caption_class === "success"
                            ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f] font-medium"
                            : "bg-white border-[#d0e4f7] text-[#6b8097]"
                        }`}
                      >
                        {(currentTutStep as TutorialStepData).caption}
                      </div>
                    </div>
                  ) : (
                    /* Static USCIS steps */
                    <div className="w-full bg-[#eef3fa] border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-5 flex flex-col">
                      {/* Browser Chrome Bar */}
                      <div className="bg-[#d0e4f7] border-b border-[#d0e4f7] h-[32px] flex items-center px-[14px] gap-[7px]">
                        <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                        <div className="flex-1 h-[18px] bg-[#fafcff] rounded-[4px] border border-[#d0e4f7] ml-[8px] flex items-center px-[10px]">
                          <span className="text-[10px] text-[#6b8097] font-mono">
                            {(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).url}
                          </span>
                        </div>
                      </div>

                      {/* Content Area — aspectRatio only, no minHeight */}
                      <div className="relative w-full bg-[#f8f9fb]" style={{ aspectRatio: "4/3" }}>
                        {(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).media?.src ? (
                          (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).media.type ===
                          "img" ? (
                            <Image
                              key={(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).media.src}
                              src={(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).media.src!}
                              alt={(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).screenTitle}
                              fill
                              className="object-contain"
                              sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
                              quality={95}
                              priority
                            />
                          ) : (
                            <TutorialVideo
                              key={(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).media.src}
                              src={(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).media.src!}
                              poster={
                                (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).videoMeta
                                  ?.poster
                              }
                              alt={(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).screenTitle}
                            />
                          )
                        ) : (
                          /* Fallback placeholder — absolute to fill ratio box */
                          <div className="absolute inset-0 flex flex-col gap-[16px] px-[24px] py-[12px] items-center justify-center overflow-hidden">
                            <div className="text-[18px] font-semibold text-[#0c1b33] text-center leading-snug">
                              {(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).ss_headline ||
                                (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).screenTitle}
                            </div>

                            {((currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).ss_desc ||
                              (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).screenDesc) && (
                              <div className="text-[13px] text-[#5a6f85] leading-[1.55] bg-[#f8fafb] border-l-[3px] border-[#d0e4f7] pl-[12px] py-[8px] text-center">
                                {(currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).ss_desc ||
                                  (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).screenDesc}
                              </div>
                            )}

                            {Array.isArray(
                              (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0])?.fields
                            ) &&
                              ((currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0])?.fields
                                ?.length ?? 0) > 0 && (
                                <div className="flex flex-col gap-[8px] w-full max-w-[320px]">
                                  {(
                                    (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0])?.fields ??
                                    []
                                  ).map((field, idx) =>
                                    field?.type === "btn" ? (
                                      <div
                                        key={idx}
                                        className="w-full px-[22px] py-[10px] bg-[#2f6fd4] text-white border-none rounded-[8px] text-[13px] font-semibold cursor-default opacity-90 text-center"
                                      >
                                        {field.label}
                                      </div>
                                    ) : (
                                      <div key={idx} className="flex flex-col gap-[4px]">
                                        {field.label && (
                                          <label className="text-[12px] font-medium text-[#3a4f63]">
                                            {field.label}
                                          </label>
                                        )}
                                        <input
                                          type={field.isPassword ? "password" : "text"}
                                          placeholder={field.placeholder}
                                          disabled
                                          className="w-full px-[12px] py-[8px] border border-[#d0e4f7] rounded-[6px] text-[13px] bg-[#f8fafb] text-[#9a9a9a]"
                                        />
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Note Block */}
                  {((isDynamic && (currentTutStep as TutorialStepData).note) ||
                    (!isDynamic && (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).note)) && (
                    <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[12px_15px] mb-[22px]">
                      <div className="text-[13px] text-[#8a6200] leading-[1.55]">
                        {isDynamic ? (
                          (currentTutStep as TutorialStepData).note
                        ) : (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0]).note!,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div className="flex gap-[10px] items-center pb-2">
                    {safeTutorialIdx > 0 && (
                      <button
                        onClick={() => setTutorialIdx(safeTutorialIdx - 1)}
                        className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
                      >
                        ← Back
                      </button>
                    )}
                    {safeTutorialIdx < steps.length - 1 ? (
                      <button
                        onClick={() => setTutorialIdx(safeTutorialIdx + 1)}
                        className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsTutorialOpen(false)}
                        className="flex-1 p-[13px_22px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center"
                      >
                        Done — return to step
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Submission Guide Overlay (Step 8) */}
      <SubmissionTutorialOverlay
        isOpen={isSubmissionGuideOpen}
        onClose={() => setIsSubmissionGuideOpen(false)}
        currentIdx={submissionGuideIdx}
        steps={SUBMISSION_TUTORIAL_STEPS}
        onSetIdx={setSubmissionGuideIdx}
      />

      {/* Gathering Guide Overlay (Step 3.4) */}
      {isGatheringGuideOpen && selectedGatheringItem && (
        <div className="fixed inset-0 z-100 flex flex-col animate-in slide-in-from-bottom duration-260 ease-[cubic-bezier(0.4,0,0.2,1)] font-sans bg-white">
          {/* Guide Topbar */}
          <div className="flex items-center px-2 sm:px-4 md:px-8 py-[18px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
            <button
              onClick={() => setIsGatheringGuideOpen(false)}
              className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-[#d0e4f7] group"
            >
              <X size={16} strokeWidth={2} className="text-[#3a4f63] group-hover:text-[#1c2b3a]" />
            </button>
            <div className="flex-1 h-1.25 bg-[#d0e4f7] rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-primary/70 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Guide Body */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-2 sm:px-4 md:px-8 py-8 sm:py-12">
            <div className="w-full max-w-[600px]">
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[#2f6fd4] mb-[16px]">
                Step 4 · Original Documents Checklist
              </div>
              <h2 className="text-[clamp(18px,4vw,26px)] sm:text-[clamp(20px,3vw,26px)] text-[#0c1b33] mb-[8px] leading-[1.25] break-words">
                {selectedGatheringItem.title}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#3a4f63] mb-[22px] leading-[1.6] break-words">
                {selectedGatheringItem.sub}
              </p>

              {/* Document Sections */}
              <div className="flex flex-col gap-[12px] mb-[24px]">
                {selectedGatheringItem.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-4 sm:p-[18px_20px]"
                  >
                    <div className="text-[11px] sm:text-[12px] font-[700] tracking-[0.06em] uppercase text-[#6b8097] mb-[8px]">
                      {sec.t}
                    </div>
                    <div
                      className="text-[13px] sm:text-[14px] text-[#3a4f63] leading-[1.7] prose-sm break-words"
                      dangerouslySetInnerHTML={{ __html: sec.c }}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-[10px] mt-[24px]">
                <button
                  onClick={() => {
                    const isRev = gatheringStatus[selectedGatheringItem.id] === "reviewed";
                    if (isRev) return;
                    const next = {
                      ...gatheringStatus,
                      [selectedGatheringItem.id]: "reviewed",
                    };
                    setGatheringStatus(next as any);
                    actions.updateMetadata({
                      gathering_status: JSON.stringify(next),
                    });
                    setIsGatheringGuideOpen(false);
                    showToast("Document marked as packed!", "success");
                  }}
                  disabled={gatheringStatus[selectedGatheringItem.id] === "reviewed"}
                  className="p-[14px_24px] bg-[#15744f] text-white border-none rounded-[16px] text-[14px] sm:text-[15px] font-semibold transition-all hover:bg-[#0e5c3c] hover:-translate-y-[1px] active:translate-y-0 disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {gatheringStatus[selectedGatheringItem.id] === "reviewed" ? (
                    <>
                      <Check size={18} strokeWidth={2.5} /> Marked as packed
                    </>
                  ) : (
                    "Mark as packed"
                  )}
                </button>
                <button
                  onClick={() => setIsGatheringGuideOpen(false)}
                  className="p-[13px_24px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[16px] text-[13px] sm:text-[14px] font-[500] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a] flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back to checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Exam Guide Overlay (Step 3.5) */}
      {isMedicalGuideOpen && currentStep?.tool_data?.type === "medical_exam_guide" && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom duration-280 font-sans">
          {/* Topbar */}
          <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
            <button
              onClick={() => setIsMedicalGuideOpen(false)}
              className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-sky-100 group"
            >
              <X size={16} strokeWidth={2} className="text-[#3a4f63] group-hover:text-[#1c2b3a]" />
            </button>
            <div className="flex-1 h-1.25 bg-[#d0e4f7] rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-400"
                style={{
                  width: `${((medicalGuideIdx + 1) / (currentStep.tool_data as any).tutorial.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-[12px] font-medium text-[#6b8097] shrink-0">
              {medicalGuideIdx + 1} / {(currentStep.tool_data as any).tutorial.length}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
            {(() => {
              const s = (currentStep.tool_data as any).tutorial[medicalGuideIdx];
              const isFirst = medicalGuideIdx === 0;
              const isLast = medicalGuideIdx === (currentStep.tool_data as any).tutorial.length - 1;

              return (
                <div className="w-full max-w-[580px] flex flex-col">
                  <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-[14px]">
                    Medical Exam Guide · {s.label}
                  </div>
                  <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] mb-[8px] leading-[1.3]">
                    {s.heading}
                  </h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-[22px]">
                    {s.instruction}
                  </p>

                  <div className="w-full border-[1.5px] border-[#d0e4f7] rounded-xl overflow-hidden mb-[18px] bg-[#f4f7fb] shadow-sm">
                    <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-[6px]">
                      <div className="w-[9px] h-[9px] rounded-full bg-red-400" />
                      <div className="w-[9px] h-[9px] rounded-full bg-amber-400" />
                      <div className="w-[9px] h-[9px] rounded-full bg-emerald-400" />
                      <div className="ml-auto text-[10px] font-bold uppercase tracking-[0.07em] text-[#6b8097]">
                        {s.vlabel}
                      </div>
                    </div>
                    <div
                      className="p-[18px] medical-mock-visual"
                      dangerouslySetInnerHTML={{ __html: s.visual }}
                    />
                  </div>

                  {s.note && (
                    <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-lg p-[11px_14px] flex gap-2.5 mb-[18px]">
                      <Info size={16} className="text-[#8a6200] shrink-0 mt-[2px]" />
                      <span className="text-[13px] text-[#8a6200] leading-[1.55]">{s.note}</span>
                    </div>
                  )}

                  <div className="flex gap-[10px]">
                    {!isFirst && (
                      <button
                        onClick={() => setMedicalGuideIdx(medicalGuideIdx - 1)}
                        className="p-[12px_20px] bg-white border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] font-medium text-[#3a4f63] hover:border-[#3a4f63] transition-all flex items-center gap-2"
                      >
                        <ChevronLeft size={16} /> Back
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isLast) {
                          setIsMedicalGuideOpen(false);
                        } else {
                          setMedicalGuideIdx(medicalGuideIdx + 1);
                        }
                      }}
                      className={`flex-1 p-[12px_20px] text-white border-none rounded-lg text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${
                        isLast
                          ? "bg-[#15744f] hover:bg-[#0e5c3c]"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                    >
                      {isLast ? (
                        "Done — return to step"
                      ) : (
                        <>
                          Next <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Multiple Document Upload Modal Integration */}
      {multipleUploadModalState.isOpen && (
        <MultipleDocumentUploadModal
          open={multipleUploadModalState.isOpen}
          onClose={() => setMultipleUploadModalState((prev) => ({ ...prev, isOpen: false }))}
          categoryId={multipleUploadModalState.categoryId}
          documentName={multipleUploadModalState.documentName}
          options={multipleUploadModalState.options}
          onUploadComplete={async () => {
            if (activeUploadId && actions.updateDocumentStatus) {
              await actions.updateDocumentStatus(activeUploadId, "reviewed");
            }
            await reloadDocuments();
          }}
        />
      )}

      {/* Document Vault Integration */}
      {uploadModalOpen &&
        selectedDocumentDefId &&
        ALL_DOCUMENTS.find((d) => d.id === selectedDocumentDefId) && (
          <DocumentUploadModal
            open={uploadModalOpen}
            onClose={closeUploadModal}
            documentDef={ALL_DOCUMENTS.find((d) => d.id === selectedDocumentDefId)!}
            onUploadComplete={async () => {
              await reloadDocuments();

              if (activeUploadId && activeUploadType) {
                const currentHhStatus = (state.metadata.hhDocsStatus as any) || {};
                const currentFinStatus = (state.metadata.financialDocsStatus as any) || {};

                if (activeUploadType === "doc") {
                  actions.updateDocumentStatus?.(activeUploadId, "reviewed");
                } else if (activeUploadType === "hh") {
                  const nextHhStatus = {
                    ...currentHhStatus,
                    [activeUploadId]: "reviewed",
                  };
                  setHhDocsStatus(nextHhStatus);
                  actions.updateMetadata({
                    hhDocsStatus: nextHhStatus,
                  });
                } else if (activeUploadType === "financial") {
                  actions.updateMetadata({
                    financialDocsStatus: {
                      ...currentFinStatus,
                      [activeUploadId]: "reviewed",
                    },
                  });
                }
              }
            }}
          />
        )}
    </div>
  );
};

export default StepView;
