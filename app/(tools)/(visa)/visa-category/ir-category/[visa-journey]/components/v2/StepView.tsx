"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckCircle,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Search,
  MessageSquare,
  XCircle,
  Clipboard,
  Scale,
  Globe,
  Lock,
  Check,
  Book,
  BookOpen,
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
  ChevronRight,
  Calendar,
  Activity,
  Info,
  Briefcase,
  Syringe,
  Hospital,
  Copy,
  Eye,
  Trash2,
  Truck,
  MoreVertical,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RoadmapData,
  QuestSuite,
  TutorialStepData,
  ActionCard,
  DocumentGatheringItem,
} from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { QuestRenderer } from "./QuestRenderer";
import { getAllActiveSteps, getStageProgress, getDocumentReviewProgress, getQuestProgress } from "./journeyHelpers";
import CredentialFormModal from "@/app/(main)/portal-wallet/components/CredentialFormModal";
import ViewCredentialModal from "@/app/(main)/portal-wallet/components/ViewCredentialModal";
import { toast } from "sonner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { InlineGuideData } from "./InlineGuideData";
import { USCIS_TUTORIAL_STEPS } from "./UscisTutorialData";
import Image from "next/image";
import Link from "next/link";
import { HOUSEHOLD_GUIDE_CONTENT } from "./HouseholdTutorialData";
import {
  SUBMISSION_TUTORIAL_STEPS,
  SubmissionTutorialOverlay,
} from "./SubmissionTutorialData";
import { AWAITING_REVIEW_DATA } from "./AwaitingReviewData";
import { APPOINTMENT_RECEIVED_DATA } from "./AppointmentReceivedData";
import { MEDICAL_EXAM_DATA } from "./MedicalExamData";
import { POLIO_CERTIFICATE_DATA } from "./PolioCertificateData";
import { POLICE_CLEARANCE_DATA } from "./PoliceClearanceData";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DocumentUploadModal } from "@/app/components/document-vault/DocumentUploadModal";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { useAuth } from "@/app/context/AuthContext";
import PassportPhotoTool from "@/components/tools/PassportPhotoTool";
import DocumentTranslationTool from "@/components/tools/DocumentTranslationTool";
import SponsorshipCalculatorTool from "@/components/tools/SponsorshipCalculatorTool";
import { StepHeader } from "./StepHeader";
import { CeacCredsModal, NvcFeeModal, ApUpdateModal } from "./PortalWalletManager";
import { SponsorshipModule } from "./SponsorshipModule";
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
import {
  DqRecordingTool,
  InterviewSchedulingTool,
  AppointmentReceivedTool,
  MedicalExamTool,
  PolioCertificateTool,
  PoliceClearanceTool,
  GatheringChecklistTool,
} from "./StepToolRenderer";
import { getStepIcon } from "./StepIcon";
import { AwaitingReviewStep } from "./AwaitingReviewStep";
import { FinancialChecklistTool } from "./FinancialChecklistTool";
import { HouseholdMemberTool } from "./HouseholdMemberTool";
import { SubmissionReviewTool } from "./SubmissionReviewTool";
import { MedicalExamGuideTool } from "./MedicalExamGuideTool";
import { CourierRegistrationTool } from "./CourierRegistrationTool";
import { InterviewPrepTool } from "./InterviewPrepTool";
import { InterviewDayTool } from "./InterviewDayTool";

interface SecurityQuestion {
  id: string;
  question: string;
  answer: string | null;
}

interface PortalCredential {
  id: string;
  portal_type: string;
  username: string;
  password: string | null;
  nvc_case_number?: string | null;
  nvc_invoice_id?: string | null;
  security_questions: SecurityQuestion[];
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
      status: "not-started" | "in-progress" | "reviewed",
    ) => Promise<void>;
  };
  onBack: () => void;
}

interface FilingQuizResult {
  type: "online" | "paper" | "lean-online" | "discuss";
  headline: string;
  body: string;
  factors: { icon: string; text: string }[];
  emphasize: "online" | "paper" | null;
}

export const StepView: React.FC<StepViewProps> = ({ data, state, actions }) => {
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
  const [activeUploadType, setActiveUploadType] = useState<
    "doc" | "hh" | "financial" | null
  >(null);
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

  // Filing Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScreenIdx, setQuizScreenIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<
    Record<string, { value: string; signal: string }>
  >({});
  const [quizResult, setQuizResult] = useState<FilingQuizResult | null>(null);
  const [isLocked, setIsLocked] = useState(
    state.metadata.filingMethodConfirmed || false,
  );
  const [isLaunched, setIsLaunched] = useState(false);

  // Wallet States
  const [uscisCredentials, setUscisCredentials] =
    useState<PortalCredential | null>(null);
  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);
  const [isWalletViewOpen, setIsWalletViewOpen] = useState(false);
  const [walletPortalType, setWalletPortalType] = useState<
    "USCIS" | "NVC" | "COURIER"
  >("USCIS");
  const [walletMode, setWalletMode] = useState<"add" | "edit">("add");
  const [isSubmittingCreds, setIsSubmittingCreds] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // NVC Fee States
  const [isNvcFeeModalOpen, setIsNvcFeeModalOpen] = useState(false);
  const nvcFeeData = state.metadata.nvcFeeStatus || {
    aos: "Not Started",
    iv: "Not Started",
    date: "",
    note: "",
  };

  // CEAC Credentials States
  const [ceacCredentials, setCeacCredentials] =
    useState<PortalCredential | null>(null);
  const [isCeacModalOpen, setIsCeacModalOpen] = useState(false);

  // Courier Credentials State
  const [courierCredentials, setCourierCredentials] =
    useState<PortalCredential | null>(null);

  // Civil Documents States
  const [activeCivilDoc, setActiveCivilDoc] = useState<any>(null);
  const [isCivilDocGuideOpen, setIsCivilDocGuideOpen] = useState(false);
  const civilDocsStatus =
    (state.metadata.civilDocsStatus as Record<string, string>) || {};

  // Financial Documents States (Step 6)
  const [activeFinancialDoc, setActiveFinancialDoc] = useState<any>(null);
  const [isFinancialDocGuideOpen, setIsFinancialDocGuideOpen] = useState(false);
  const financialDocsStatus =
    (state.metadata.financialDocsStatus as Record<string, string>) || {};

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialIdx, setTutorialIdx] = useState(0);

  // Household Member Builder States (Step 7)
  const [jsCount, setJsCount] = useState(0);
  const [hhCount, setHhCount] = useState(0);
  const [hhRelationships, setHhRelationships] = useState<
    Record<number, string>
  >({});
  const [activeHhDoc, setActiveHhDoc] = useState<any>(null);
  const [isHhDocGuideOpen, setIsHhDocGuideOpen] = useState(false);
  const [hhDocsStatus, setHhDocsStatus] = useState<Record<string, string>>(
    (state.metadata.hhDocsStatus as Record<string, string>) || {},
  );

  // Sponsorship Calculator State
  const [isSponsorshipCalcOpen, setIsSponsorshipCalcOpen] = useState(false);
  const sponsorshipResult = (state.metadata.sponsorshipResult as any) || null;

  // Selected scenario for Step 6 (Gather Financial Documents)
  const [selectedScenario, setSelectedScenario] = useState<string>("pet-only");

  // Step 2.8 Review & Submit States
  const [isSubmissionGuideOpen, setIsSubmissionGuideOpen] = useState(false);
  const [submissionGuideIdx, setSubmissionGuideIdx] = useState(0);
  const initialSubmissionChecklist = (state.metadata
    .submissionChecklistStatus as Record<string, boolean>) || {
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

  // Step 2.10 DQ Recording States
  const [dqSaved, setDqSaved] = useState(state.metadata.dqSaved === true);
  const [dqDate, setDqDate] = useState((state.metadata.dqDate as string) || "");
  const [dqCategory, setDqCategory] = useState(
    (state.metadata.dqCategory as string) || "",
  );
  const [dqPost, setDqPost] = useState((state.metadata.dqPost as string) || "");
  const [dqCountry, setDqCountry] = useState(
    (state.metadata.dqCountry as string) || "Pakistan",
  );

  // Step 3.1 Medical Exam States
  const [medSaved, setMedSaved] = useState(
    state.metadata.med_appt_saved === "true",
  );
  const [medDate, setMedDate] = useState(
    (state.metadata.med_date as string) || "",
  );
  const [medTime, setMedTime] = useState(
    (state.metadata.med_time as string) || "",
  );
  const [medClinic, setMedClinic] = useState(
    (state.metadata.med_clinic as string) || "",
  );
  const [isMedWizardOpen, setIsMedWizardOpen] = useState(false);
  const [medWizardMode, setMedWizardMode] = useState<"service" | "guide" | "">(
    "",
  );
  const [medWizardStep, setMedWizardStep] = useState(0);

  // Step 3.2 Polio Certificate States
  const [polioLaunched, setPolioLaunched] = useState(
    state.metadata.polio_launched === "true",
  );
  const [polioChecks, setPolioChecks] = useState<boolean[]>(
    (state.metadata.polio_checks as boolean[]) || [false, false, false],
  );
  const [isPolioGuideOpen, setIsPolioGuideOpen] = useState(false);
  const [polioGuideStep, setPolioGuideStep] = useState(0);

  // Step 3.3 Police Clearance Certificate States
  const [pccSaved, setPccSaved] = useState(state.metadata.pcc_saved === "true");

  // Appointment Received States
  const [interviewSaved, setInterviewSaved] = useState(state.metadata.interviewSaved === true);
  const [interviewDate, setInterviewDate] = useState((state.metadata.interviewDate as string) || "");
  const [letterDate, setLetterDate] = useState((state.metadata.letterDate as string) || "");
  const [consulateLocation, setConsulateLocation] = useState((state.metadata.consulateLocation as string) || "");

  // Step 3.7 Interview Prep States
  const [isPrepLaunched, setIsPrepLaunched] = useState(
    state.metadata.isPrepLaunched === "true",
  );
  const [pccReceived, setPccReceived] = useState(
    state.metadata?.pcc_received === "true",
  );

  // Step 3.8 Interview Day States
  const [isInterviewDayTutOpen, setIsInterviewDayTutOpen] = useState(false);
  const [interviewDayTutIdx, setInterviewDayTutIdx] = useState(0);

  // Step 3.9 Administrative Processing States
  const [apDetails, setApDetails] = useState(() => {
    return (
      state.metadata.apDetails || {
        interviewDate: "",
        received: null,
        ceacStatus: "",
        lastCheck: "",
        docsRequested: "",
        notes: "",
      }
    );
  });
  const [apUpdateLog, setApUpdateLog] = useState<any[]>(
    state.metadata.apUpdateLog || [],
  );
  const [isApSaved, setIsApSaved] = useState(state.metadata.apSaved === "true");
  const [isApUpdateModalOpen, setIsApUpdateModalOpen] = useState(false);

  const handleSaveApUpdate = (entry: any) => {
    const nextLog = [entry, ...apUpdateLog];
    setApUpdateLog(nextLog);
    actions.updateMetadata({ apUpdateLog: nextLog });
  };

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
  const [selectedGatheringItem, setSelectedGatheringItem] =
    useState<DocumentGatheringItem | null>(null);
  const [gatheringGuideStep, setGatheringGuideStep] = useState(0);

  // --- UTILS & DERIVED ---
  const [pccData, setPccData] = useState({
    receipt: (state.metadata.pcc_receipt as string) || "",
    track: (state.metadata.pcc_track as string) || "",
    date: (state.metadata.pcc_date as string) || "",
  });
  const [isPccOverlayOpen, setIsPccOverlayOpen] = useState(false);
  const [pccOverlayMode, setPccOverlayMode] = useState<
    "service" | "guide" | ""
  >("");
  const [pccOverlayStep, setPccOverlayStep] = useState(0);

  // Step 3.5 Medical Guide States
  const [isMedicalGuideOpen, setIsMedicalGuideOpen] = useState(false);
  const [medicalGuideIdx, setMedicalGuideIdx] = useState(0);

  // Step 3.6 Courier Registration Guide States
  const [isCourierGuideOpen, setIsCourierGuideOpen] = useState(false);
  const [courierGuideIdx, setCourierGuideIdx] = useState(0);

  const handleToggleSubmissionCheck = (idx: number) => {
    const next = {
      ...submissionChecklistStatus,
      [idx]: !submissionChecklistStatus[idx],
    };
    setSubmissionChecklistStatus(next);
    actions.updateMetadata({ submissionChecklistStatus: next });
  };

  // Sync selectedScenario with sponsorshipResult once on load
  useEffect(() => {
    if (sponsorshipResult) {
      if (
        sponsorshipResult.needsHouseholdMember &&
        sponsorshipResult.needsJointSponsor
      ) {
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
  }, [state.metadata.hhDocsStatus]);

  const chapters = data.chapters || (data as any).stages;
  const currentChapter = chapters?.[state.currentStage];

  // Retrieve Medical tool data for Step 3.5 overlay
  const medicalToolData = useMemo(() => {
    if (!chapters) return null;
    for (const ch of chapters) {
      const step = ch.steps?.find((s: any) => s.step_key === "step_3_5");
      if (step?.tool_data) return step.tool_data;
    }
    return null;
  }, [chapters]);

  // Retrieve Courier tool data for Step 3.6 overlay
  const courierToolData = useMemo(() => {
    if (!chapters) return null;
    for (const ch of chapters) {
      const step = ch.steps?.find((s: any) => s.step_key === "step_3_6");
      if (step?.tool_data) return step.tool_data;
    }
    return null;
  }, [chapters]);

  const filingMethod =
    state.metadata?.filingMethod || state.filingType || "online";

  const getIcon = getStepIcon;


  const activeStepsInChapter = useMemo(() => {
    if (!currentChapter) return [];
    return currentChapter.steps.filter(
      (step: any) =>
        !step.branch || step.branch === "both" || step.branch === filingMethod,
    );
  }, [currentChapter, filingMethod]);

  const currentStep = currentChapter?.steps?.[state.currentStep || 0];
  const sId = currentStep?.step_key || (currentStep as any)?.id || "";
  const isCompleted = state.completedSteps.has(sId);

  const allActiveSteps = useMemo(
    () => getAllActiveSteps(data, filingMethod),
    [data, filingMethod],
  );

  const globalIdx = allActiveSteps.findIndex(
    (s) => (s.step_key || (s as any).id) === sId,
  );

  const prevStep = globalIdx > 0 ? allActiveSteps[globalIdx - 1] : null;
  const nextStep =
    globalIdx < allActiveSteps.length - 1
      ? allActiveSteps[globalIdx + 1]
      : null;
  const localIdx = activeStepsInChapter.findIndex(
    (s: any) => (s.step_key || s.id) === sId,
  );

  const chapterProg = useMemo(
    () => getStageProgress(data, state.currentStage, state),
    [data, state.currentStage, state],
  );

  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [pendingStepToComplete, setPendingStepToComplete] = useState<string | null>(null);
  const [pendingStepProgress, setPendingStepProgress] = useState<any>(null);


  const handleToggleComplete = (stepKey?: string) => {
    const filingMethod = state.metadata?.filingMethod || state.filingType || 'online';
    const allActive = getAllActiveSteps(data, filingMethod);
    const targetSKey = stepKey || sId || currentStep?.step_key;

    if (!targetSKey) return;

    const isAlreadyCompleted = state.completedSteps.has(targetSKey);

    // Only blocking sequence when MARKING AS COMPLETE
    if (!isAlreadyCompleted) {
      const targetIdx = allActive.findIndex(
        (s) => (s.step_key || (s as any).id) === targetSKey,
      );

      // 1. Sequence Enforcement
      if (targetIdx !== -1) {
        const previousSteps = allActive.slice(0, targetIdx);
        const incompleteStep = previousSteps.find(
          (s) => !state.completedSteps.has(s.step_key || (s as any).id),
        );

        if (incompleteStep) {
          toast.error(
            `Action restricted: Complete previous steps first: "${incompleteStep.step_name}"`,
            {
              description: "You cannot mark this step as read until all preceding steps are finished in order.",
              duration: 5000,
            }
          );
          return; // HARD BLOCK
        }
      } else {
        // Fallback for steps not in the active list (e.g. branch-specific)
        const allPossibleSteps = (data.chapters || (data as any).stages).flatMap((c: any) => c.steps);
        const fallbackIdx = allPossibleSteps.findIndex((s: any) => (s.step_key || (s as any).id) === targetSKey);
        
        if (fallbackIdx > 0) {
          const previousSteps = allPossibleSteps.slice(0, fallbackIdx);
          const incompleteStep = previousSteps.find((s: any) => !state.completedSteps.has(s.step_key || (s as any).id));
          if (incompleteStep) {
             toast.error(`Sequence Error: Please finish previous steps first.`);
             return;
          }
        }
      }

      // 2. Requirements Check (ONLY for quest and docs)
      const targetStep = allActive.find((s: any) => (s.step_key || (s as any).id) === targetSKey) || currentStep;
      
      let progressObj: any = null;
      if (targetStep.step_type === 'docs') {
        progressObj = getDocumentReviewProgress(targetStep, state.metadata);
      } else if (targetStep.step_type === 'quest') {
        progressObj = getQuestProgress(targetStep, state);
      }

      const restrictedSteps = ['step_1_1', 'step_1_2'];
      const stepKey = targetStep.step_key || (targetStep as any).id;
      
      if (restrictedSteps.includes(stepKey) && progressObj && !progressObj.isComplete) {
        setPendingStepToComplete(targetSKey);
        setPendingStepProgress(progressObj);
        setShowIncompleteWarning(true);
        return; // Pause for modal
      }
    }

    actions.toggleComplete(targetSKey);
  };

  // Calculate if there's an incomplete prerequisite step
  const incompletePrerequisite = useMemo(() => {
    if (isCompleted) return null;
    const filingMethod = state.metadata?.filingMethod || state.filingType || 'online';
    const allActive = getAllActiveSteps(data, filingMethod);
    const targetIdx = allActive.findIndex((s: any) => (s.step_key || (s as any).id) === sId);
    
    // If first step, it's always allowed
    if (targetIdx <= 0) return null;

    const prevSteps = allActive.slice(0, targetIdx);
    return prevSteps.find((s: any) => !state.completedSteps.has(s.step_key || (s as any).id));
  }, [data, filingMethod, sId, state.completedSteps, isCompleted]);

  // Create a safe wrapper for actions to enforce sequence globally
  const safeActions = useMemo(() => ({
    ...actions,
    toggleComplete: (stepKey: string) => handleToggleComplete(stepKey),
  }), [actions, handleToggleComplete]);

  // Use the percentage from journeyHelpers to match ChapterView
  const progressPct = chapterProg.pct;

  useEffect(() => {
    const scrollContainer = document.querySelector(".scrollbar-hide");
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }, [sId]);

  useEffect(() => {
    setIsLocked(state.metadata.filingMethodConfirmed || false);
  }, [state.metadata.filingMethodConfirmed]);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch("/api/portal-wallet");
      const data = await res.json();
      if (data.credentials) {
        const uscis = data.credentials.find(
          (c: PortalCredential) => c.portal_type.toUpperCase() === "USCIS",
        );
        const ceac = data.credentials.find(
          (c: PortalCredential) => c.portal_type.toUpperCase() === "NVC",
        );
        const courier = data.credentials.find(
          (c: PortalCredential) => c.portal_type.toUpperCase() === "COURIER",
        );
        setUscisCredentials(uscis || null);
        setCeacCredentials(ceac || null);
        setCourierCredentials(courier || null);
      }
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials, sId]);

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
          petitionerName:
            (state.metadata.petitionerName as string) || "Petitioner",
          beneficiaryName:
            (state.metadata.beneficiaryName as string) || "Beneficiary",
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
      isSubmissionGuideOpen
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
  ]);

  const handleSaveCredentials = async (data: {
    portalType: "USCIS" | "NVC" | "COURIER";
    username?: string;
    password?: string;
    nvcCaseNumber?: string;
    nvcInvoiceId?: string;
    securityQuestions?: { question: string; answer: string }[];
  }) => {
    setIsSubmittingCreds(true);
    try {
      const res = await fetch("/api/portal-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Credentials saved successfully!");
      setIsWalletFormOpen(false);
      await fetchCredentials();

      if (data.portalType === "USCIS" && sId === "step_1_6") {
        if (!isCompleted) handleToggleComplete("step_1_6");
      }
      if (data.portalType === "NVC" && sId === "step_2_1") {
        if (!isCompleted) handleToggleComplete("step_2_1");
      }
    } catch {
      toast.error("Failed to save credentials. Please try again.");
    } finally {
      setIsSubmittingCreds(false);
    }
  };

  const handleRevealPassword = async (
    credentialId: string,
  ): Promise<string> => {
    const res = await fetch("/api/portal-wallet/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: walletPortalType,
        type: "password",
      }),
    });
    const data = await res.json();
    return data.value || "";
  };

  const handleRevealAnswer = async (
    credentialId: string,
    questionId: string,
  ): Promise<string> => {
    const res = await fetch("/api/portal-wallet/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: walletPortalType,
        type: "answer",
        questionId,
      }),
    });
    const data = await res.json();
    return data.value || "";
  };

  const handleDeleteCredentials = async (portalType: string) => {
    setIsSubmittingCreds(true);
    try {
      const res = await fetch(`/api/portal-wallet/${portalType}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Credentials deleted successfully!");
      if (portalType === "USCIS") setUscisCredentials(null);
      if (portalType === "NVC") setCeacCredentials(null);
      if (portalType === "COURIER") setCourierCredentials(null);
      setIsWalletViewOpen(false);
    } catch {
      toast.error("Failed to delete credentials.");
    } finally {
      setIsSubmittingCreds(false);
    }
  };

  const handleSaveNvcFee = (newData: any) => {
    actions.updateMetadata({ nvcFeeStatus: newData });
    setIsNvcFeeModalOpen(false);
    toast.success("Payment status saved to your Portal Wallet!");
    // Auto-complete step if both are paid
    if (newData.aos === "Paid" && newData.iv === "Paid") {
      if (!isCompleted) handleToggleComplete();
    }
  };

  const computeRecommendation = (
    answers: Record<string, { value: string; signal: string }>,
  ) => {
    const a = answers;
    if (a["attorney"]?.signal === "discuss")
      return {
        type: "discuss",
        headline: "Check with your representative",
        body: "Since a representative is managing the filing, the method choice is typically theirs. Ask whether they prefer online via their USCIS account or a mailed paper packet.",
        factors: [
          { icon: "User", text: "A representative is handling this case" },
          {
            icon: "ClipboardList",
            text: "Representatives can use either filing method",
          },
          {
            icon: "MessageSquare",
            text: "Confirm the method directly with your attorney or preparer",
          },
        ],
        emphasize: null,
      } as FilingQuizResult;

    const hardPaper = Object.values(a).some((ans) => ans.signal === "paper");
    if (hardPaper || a["preference"]?.signal === "paper")
      return {
        type: "paper",
        headline: "Paper filing looks like the better fit",
        body: "Based on your answers, mailing a paper packet is the more practical path right now. Paper filing is fully accepted and processed just as thoroughly as online submissions.",
        factors: buildFactors(a),
        emphasize: "paper",
      } as FilingQuizResult;

    const onlineCount = Object.values(a).filter(
      (ans) => ans.signal === "online",
    ).length;

    if (onlineCount >= 2)
      return {
        type: "online",
        headline: "Online filing looks like the right choice",
        body: "You appear ready to file online. It saves $50, gives you an instant receipt number, and keeps everything — notices and evidence requests — in one place.",
        factors: buildFactors(a),
        emphasize: "online",
      } as FilingQuizResult;

    return {
      type: "lean-online",
      headline: "Either method works — online has a slight edge",
      body: "No hard blockers were found for either path. Online saves $50 and gives an instant receipt, but paper filing is equally valid if that feels more comfortable.",
      factors: buildFactors(a),
      emphasize: "online",
    } as FilingQuizResult;
  };

  const buildFactors = (
    a: Record<string, { value: string; signal: string }>,
  ) => {
    const f: { icon: string; text: string }[] = [];
    if (a["attorney"]) {
      const isSelf = a["attorney"].value === "no";
      f.push({
        icon: isSelf ? "Check" : "User",
        text: isSelf
          ? "Self-filing — the decision is yours"
          : "Representative involvement noted",
      });
    }
    if (a["online-account"]) {
      const m: Record<string, string> = {
        yes: "USCIS online account is manageable",
        no: "Online account not practical right now",
        unsure: "Online account readiness is unclear",
      };
      f.push({
        icon:
          a["online-account"].signal === "online"
            ? "Check"
            : a["online-account"].signal === "paper"
              ? "XCircle"
              : "HelpCircle",
        text: m[a["online-account"].value],
      });
    }
    if (a["doc-upload"]) {
      const m: Record<string, string> = {
        yes: "Documents are ready or easily scannable",
        no: "Physical copies only — digitizing is difficult now",
        unsure: "Document digitization readiness unclear",
      };
      f.push({
        icon:
          a["doc-upload"].signal === "online"
            ? "Check"
            : a["doc-upload"].signal === "paper"
              ? "XCircle"
              : "HelpCircle",
        text: m[a["doc-upload"].value],
      });
    }
    if (a["preference"]) {
      const m: Record<string, string> = {
        online: "Petitioner prefers online and the $50 saving",
        paper: "Petitioner prefers mailing a physical packet",
        neutral: "No strong preference either way",
      };
      f.push({
        icon: a["preference"].signal === "neutral" ? "ArrowRight" : "Check",
        text: m[a["preference"].value],
      });
    }
    return f;
  };

  const handleNextQuiz = () => {
    const quiz = currentStep.filing_data?.quiz;
    if (!quiz) return;
    const screen = quiz.screens[quizScreenIdx];

    if (
      screen.id === "attorney" &&
      quizAnswers["attorney"]?.signal === "discuss"
    ) {
      setQuizResult(computeRecommendation(quizAnswers));
      return;
    }

    if (quizScreenIdx < quiz.screens.length - 1) {
      setQuizScreenIdx(quizScreenIdx + 1);
    } else {
      setQuizResult(computeRecommendation(quizAnswers));
    }
  };

  const handleConfirmation = (methodId: string) => {
    actions.updateMetadata({
      filingMethod: methodId,
      filingMethodConfirmed: true,
    });

    setIsLocked(true);
    if (!isCompleted) handleToggleComplete();
    setShowQuiz(false);
  };

  // handleToggleComplete logic moved up and wrapped in safeActions for global access

  const handleMarkDocReviewed = (docId: string) => {
    const next = { ...civilDocsStatus, [docId]: "reviewed" };
    actions.updateMetadata({ civilDocsStatus: next });

    // Auto-complete step 2.4 if all are reviewed
    if (sId === "step_2_4") {
      const tool = currentStep.tool_data;
      if (tool?.doc_list) {
        const total = tool.doc_list.groups.reduce(
          (acc: number, g: any) => acc + g.items.length,
          0,
        );
        const reviewedCount = Object.values(next).filter(
          (s) => s === "reviewed",
        ).length;
        if (reviewedCount >= total) {
          if (!isCompleted) handleToggleComplete("step_2_4");
        }
      }
    }
  };

  const handleNavigate = (stepId: string) => {
    const activeChapters = data.chapters || (data as any).stages;
    for (let sIdx = 0; sIdx < activeChapters.length; sIdx++) {
      const spIdx = activeChapters[sIdx].steps.findIndex(
        (s: any) => (s.step_key || s.id) === stepId,
      );
      if (spIdx !== -1) {
        actions.setStage(sIdx);
        actions.setCurrentStep(spIdx);
        return;
      }
    }
  };


  const renderDocActionModal = () => {
    if (!docActionModal.doc) return null;
    const { doc, title, subtitle, onReadGuide, onUpload } = docActionModal;

    return (
      <Dialog
        open={docActionModal.isOpen}
        onOpenChange={(open) =>
          setDocActionModal({ ...docActionModal, isOpen: open })
        }
      >
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[28px] shadow-2xl">
          <div className="relative overflow-hidden bg-white">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {(() => {
                    switch (doc.icon) {
                      case "ShieldCheck":
                        return <ShieldCheck size={24} />;
                      case "User":
                        return <User size={24} />;
                      case "FileText":
                        return <FileText size={24} />;
                      case "FileCheck":
                        return <FileCheck size={24} />;
                      case "MessageSquare":
                        return <MessageSquare size={24} />;
                      case "Scale":
                        return <Scale size={24} />;
                      case "Globe":
                        return <Globe size={24} />;
                      case "ClipboardList":
                        return <ClipboardList size={24} />;
                      case "Lock":
                        return <Lock size={24} />;
                      case "Camera":
                        return <Camera size={24} />;
                      default:
                        return <FileText size={24} />;
                    }
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0f1f38]">
                    {title || doc.name || doc.title}
                  </h3>
                  <p className="text-sm text-[#6b8097]">
                    {subtitle ||
                      doc.subtitle ||
                      doc.sub ||
                      "Choose an action to proceed with this document"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Read Guide Card */}
                <button
                  onClick={() => {
                    setDocActionModal({ ...docActionModal, isOpen: false });
                    if (onReadGuide) onReadGuide();
                  }}
                  className="group relative text-left p-6 rounded-2xl border-[1.5px] border-[#d0e4f7] bg-white transition-all hover:border-primary hover:shadow-[0_12px_24px_rgba(15,31,56,0.08)] hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#e8f1fb] text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="font-bold text-[#0f1f38] mb-1">
                    Read the Guide
                  </h4>
                  <p className="text-xs text-[#6b8097] leading-relaxed">
                    View requirements, pitfalls, and step-by-step instructions.
                  </p>
                </button>

                {/* Upload Card */}
                <button
                  onClick={() => {
                    setDocActionModal({ ...docActionModal, isOpen: false });
                    if (onUpload) onUpload();
                  }}
                  className="group relative text-left p-6 rounded-2xl border-[1.5px] border-[#d0e4f7] bg-white transition-all hover:border-primary hover:shadow-[0_12px_24px_rgba(15,31,56,0.08)] hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#eaf7f2] text-[#1a7a5e] flex items-center justify-center mb-4 group-hover:bg-[#1a7a5e] group-hover:text-white transition-colors">
                    <Upload size={20} />
                  </div>
                  <h4 className="font-bold text-[#0f1f38] mb-1">
                    Upload Document
                  </h4>
                  <p className="text-xs text-[#6b8097] leading-relaxed">
                    Attach and submit your document for processing.
                  </p>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-[#d0e4f7]/50 flex justify-end">
                <button
                  onClick={() =>
                    setDocActionModal({ ...docActionModal, isOpen: false })
                  }
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#6b8097] hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
      tool.launch_module?.icon === "user" ||
      sId === "step_1_5" ||
      sId === "step_1_2_b";
    const accentColor = "#2f6fd4";
    // const accentColor = isBeneficiaryTheme ? "#0f7373" : "#2f6fd4";
    // Background colour: explicit bg_color wins, then beneficiary/default theme
    const launchBg =
      tool.launch_module?.bg_color ??
      (isBeneficiaryTheme ? "#12192e" : "#0e1e38");

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
        {/* Page Shell */}
        <div className="w-full max-w-[680px] px-[24px] pb-[96px] flex flex-col">
          {/* Step Header */}
          <StepHeader
            chapterNumber={currentChapter?.chapter_number || state.currentStage + 1}
            chapterName={currentChapter?.chapter_name || currentChapter?.name || ""}
            stepName={currentStep.step_name}
            stepDescription={currentStep.step_description}
            isBeneficiaryTheme={isBeneficiaryTheme}
          />

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
              <div className="text-[13px] text-[#8a6200] leading-normal">
                {tool.alert_note}
              </div>
            </div>
          )}

          {/* Return Note (Success Banner) */}
          {isLaunched && (
            <div className="mb-[20px] bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-[14px_18px] flex items-start gap-[12px] animate-in slide-in-from-top-2 duration-300">
              <div className="text-[15px] mt-[1px] text-[#15744f] shrink-0">✓</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#15744f] mb-[2px]">
                  {tool.launch_module.return_note?.title || "Tool launched in a new tab"}
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
              onOpenCalc={() => setIsSponsorshipCalcOpen(true)}
              tool={tool}
            />
          )}

          {/* DQ RECORDING TOOL RENDERING */}
          {tool.type === "dq_recording" && (
            <DqRecordingTool
              tool={tool}
              state={state}
              actions={actions}
              metadata={state.metadata}
              dqState={{
                dqSaved, setDqSaved, dqDate, setDqDate, dqCategory, setDqCategory, dqPost, setDqPost, dqCountry, setDqCountry
              }}
            />
          )}

          {tool.type === "appointment_received" && (
            <AppointmentReceivedTool
              state={state}
              actions={actions}
              interviewState={{
                interviewSaved, setInterviewSaved, interviewDate, setInterviewDate, letterDate, setLetterDate, consulateLocation, setConsulateLocation
              }}
            />
          )}

          {tool.type === "medical_exam" && (
            <MedicalExamTool
              state={state}
              actions={actions}
              medState={{
                medSaved, setMedSaved, medDate, setMedDate, medTime, setMedTime, medClinic, setMedClinic,
                isMedWizardOpen, setIsMedWizardOpen, medWizardStep, setMedWizardStep, medWizardMode, setMedWizardMode
              }}
            />
          )}

          {tool.type === "polio_certificate" && (
            <PolioCertificateTool
              state={state}
              actions={actions}
              polioState={{
                polioLaunched, setPolioLaunched, isPolioGuideOpen, setIsPolioGuideOpen, polioGuideStep, setPolioGuideStep, polioChecks, setPolioChecks
              }}
            />
          )}

          {tool.type === "police_clearance" && (
            <PoliceClearanceTool
              state={state}
              actions={actions}
              pccState={{
                pccSaved, setPccSaved, pccReceived, setPccReceived, pccData, setPccData, isPccOverlayOpen, setIsPccOverlayOpen, pccOverlayStep, setPccOverlayStep, pccOverlayMode, setPccOverlayMode
              }}
            />
          )}

          {/* FINANCIAL CHECKLIST (Step 2.6 SPECIFIC) */}
          {tool.type === "financial_checklist" && (
            <FinancialChecklistTool
              selectedScenario={selectedScenario}
              setSelectedScenario={setSelectedScenario}
              financialDocsStatus={financialDocsStatus}
              uploadedDocuments={uploadedDocuments}
              isReloadingDocs={isReloadingDocs}
              isDeletingIds={isDeletingIds}
              openUploadModal={openUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
              setDocActionModal={setDocActionModal}
              updateMetadata={actions.updateMetadata}
              setActiveFinancialDoc={setActiveFinancialDoc}
              setIsFinancialDocGuideOpen={setIsFinancialDocGuideOpen}
            />
          )}

          {/* Step 2.7 Household Member Builder Rendering */}
          {tool.type === "household_member" && (
            <HouseholdMemberTool
              hhCount={hhCount}
              hhRelationships={hhRelationships}
              hhDocsStatus={hhDocsStatus}
              setHhDocsStatus={setHhDocsStatus}
              updateMetadata={actions.updateMetadata}
              openUploadModal={openUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
              setActiveHhDoc={setActiveHhDoc}
              setIsHhDocGuideOpen={setIsHhDocGuideOpen}
            />
          )}
          {tool.type === "submission_review" && (
            <SubmissionReviewTool
              tool={tool}
              submissionChecklistStatus={submissionChecklistStatus}
              setSubmissionChecklistStatus={setSubmissionChecklistStatus}
              setSubmissionGuideIdx={setSubmissionGuideIdx}
              setIsSubmissionGuideOpen={setIsSubmissionGuideOpen}
            />
          )}

          {/* AWAITING NVC REVIEW (Step 2.9 SPECIFIC) */}
          {tool.type === "awaiting_review" && (
            <AwaitingReviewStep data={AWAITING_REVIEW_DATA} />
          )}
               



          {/* GATHER ORIGINAL DOCUMENTS (Step 3.4 SPECIFIC) */}
          {tool.type === "gathering_checklist" && (
            <GatheringChecklistTool 
              tool={tool} 
              state={state} 
              actions={actions} 
              gatheringState={{ 
                gatheringStatus, setGatheringStatus, 
                selectedGatheringItem, setSelectedGatheringItem, 
                isGatheringGuideOpen, setIsGatheringGuideOpen, 
                gatheringGuideStep, setGatheringGuideStep 
              }} 
            />
          )}

          {/* ATTEND MEDICAL EXAM (Step 3.5 SPECIFIC) */}
          {tool.type === "medical_exam_guide" && (
            <MedicalExamGuideTool
              tool={tool}
              setMedicalGuideIdx={setMedicalGuideIdx}
              setIsMedicalGuideOpen={setIsMedicalGuideOpen}
            />
          )}

          {/* COURIER REGISTRATION (Step 3.6 SPECIFIC) */}
          {tool.type === "courier_registration" && (
            <CourierRegistrationTool
              tool={tool}
              courierCredentials={courierCredentials}
              setCourierGuideIdx={setCourierGuideIdx}
              setIsCourierGuideOpen={setIsCourierGuideOpen}
              setWalletPortalType={(type) => setWalletPortalType(type as "USCIS" | "NVC" | "COURIER")}
              setIsWalletViewOpen={setIsWalletViewOpen}
              setWalletMode={setWalletMode}
              setIsWalletFormOpen={setIsWalletFormOpen}
            />
          )}

          {/* INTERVIEW PREP CONTENT (Step 3.7 SPECIFIC) */}
          {tool.type === "interview_prep" && (
            <InterviewPrepTool
              tool={tool}
              isPrepLaunched={isPrepLaunched}
              setIsPrepLaunched={setIsPrepLaunched}
            />
          )}

          {/* INTERVIEW DAY CONTENT (Step 3.8 SPECIFIC) */}
          {tool.type === "interview_day" && (
            <InterviewDayTool
              tool={tool}
              setInterviewDayTutIdx={setInterviewDayTutIdx}
              setIsInterviewDayTutOpen={setIsInterviewDayTutOpen}
            />
          )}

          {/* ADMINISTRATIVE PROCESSING CONTENT (Step 3.9 SPECIFIC) */}
          {tool.type === "adm_processing" && (
            <div className="flex flex-col mt-4">
              {/* Explainer Banner */}
              <div className="relative bg-[#0e1e38] rounded-[16px] p-6 mb-4 overflow-hidden border border-white/10 shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#8a6200] via-[#f0d98a] to-transparent opacity-85" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">
                  {tool.explainer.eyebrow}
                </div>
                <div className="text-[20px]  text-white/95 mb-2.5 leading-tight">
                  {tool.explainer.title}
                </div>
                <div className="text-[13px] text-white/55 leading-relaxed max-w-[560px]">
                  {tool.explainer.body}
                </div>
              </div>

              {/* AP Status Recorder Card */}
              {!isApSaved ? (
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)] transition-all">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#fef8e8] border border-[#f0d98a] flex items-center justify-center shrink-0">
                      <Calendar
                        size={18}
                        className="text-[#8a6200]"
                        strokeWidth={1.8}
                      />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#0c1b33]">
                        {tool.recorder.title}
                      </div>
                      <div className="text-[12px] text-[#6b8097]">
                        {tool.recorder.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                        Did you receive a 221(g) or AP notice?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setApDetails({ ...apDetails, received: true })
                          }
                          className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-[13px] font-bold transition-all ${
                            apDetails.received === true
                              ? "bg-[#fef8e8] border-[#8a6200] text-[#8a6200]"
                              : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:border-[#3a4f63]"
                          }`}
                        >
                          Yes — AP received
                        </button>
                        <button
                          onClick={() =>
                            setApDetails({ ...apDetails, received: false })
                          }
                          className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-[13px] font-bold transition-all ${
                            apDetails.received === false
                              ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                              : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:border-[#3a4f63]"
                          }`}
                        >
                          No — awaiting outcome
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                          Interview Date
                        </label>
                        <input
                          type="date"
                          value={apDetails.interviewDate}
                          onChange={(e) =>
                            setApDetails({
                              ...apDetails,
                              interviewDate: e.target.value,
                            })
                          }
                          className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                          CEAC Status
                        </label>
                        <select
                          value={apDetails.ceacStatus}
                          onChange={(e) =>
                            setApDetails({
                              ...apDetails,
                              ceacStatus: e.target.value,
                            })
                          }
                          className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
                        >
                          <option value="">Select current status...</option>
                          {tool.recorder.ceac_options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                          Date of Last Check
                        </label>
                        <input
                          type="date"
                          value={apDetails.lastCheck}
                          onChange={(e) =>
                            setApDetails({
                              ...apDetails,
                              lastCheck: e.target.value,
                            })
                          }
                          className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                          Additional Docs Requested?
                        </label>
                        <select
                          value={apDetails.docsRequested}
                          onChange={(e) =>
                            setApDetails({
                              ...apDetails,
                              docsRequested: e.target.value,
                            })
                          }
                          className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
                        >
                          {tool.recorder.docs_requested_options.map(
                            (opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                        Notes (optional)
                      </label>
                      <textarea
                        value={apDetails.notes}
                        onChange={(e) =>
                          setApDetails({ ...apDetails, notes: e.target.value })
                        }
                        placeholder="e.g. 221(g) sheet received..."
                        className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all min-height-[80px]"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setIsApSaved(true);
                        actions.updateMetadata({
                          apDetails: apDetails,
                          apSaved: "true",
                        });
                      }}
                      disabled={!apDetails.interviewDate}
                      className="w-full p-4 bg-primary text-white rounded-xl font-bold transition-all shadow-[0_4px_16px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                    >
                      Save AP Status & Activate Tracking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-[1.5px] border-[#f0d98a] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a6200]">
                      AP Details Recorded — Tracking Active
                    </div>
                    <button
                      onClick={() => setIsApSaved(false)}
                      className="text-[12px] font-bold text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                        Interview Date
                      </div>
                      <div className="text-[13px] font-bold text-[#0c1b33]">
                        {apDetails.interviewDate
                          ? new Date(
                              apDetails.interviewDate + "T00:00:00",
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                        221(g) / AP Received
                      </div>
                      <div className="text-[13px] font-bold text-[#0c1b33]">
                        {apDetails.received === true
                          ? "Yes — 221(g) received"
                          : apDetails.received === false
                            ? "No — awaiting outcome"
                            : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                        CEAC Status
                      </div>
                      <div className="text-[13px] font-bold text-[#0c1b33]">
                        {apDetails.ceacStatus || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                        Last CEAC Check
                      </div>
                      <div className="text-[13px] font-bold text-[#0c1b33]">
                        {apDetails.lastCheck
                          ? new Date(
                              apDetails.lastCheck + "T00:00:00",
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                  </div>
                  {apDetails.notes && (
                    <div className="mt-4 pt-4 border-t border-[#f0d98a]">
                      <div className="text-[11px] text-[#6b8097] font-medium mb-1">
                        Notes
                      </div>
                      <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                        {apDetails.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Docs Requested Alert */}
              {apDetails.docsRequested === "yes" && isApSaved && (
                <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-5 mb-4 shadow-[0_4px_12px_rgba(12,27,51,0.04)] animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[18px]">📎</span>
                    <div className="text-[14px] font-bold text-[#8a6200]">
                      Additional documents were requested
                    </div>
                  </div>
                  <div className="text-[13px] text-[#8a6200] leading-relaxed mb-4">
                    The consulate has requested additional documents as part of
                    your 221(g) or AP process. Review the request carefully,
                    provide exactly what was asked, and submit via the method
                    specified.
                  </div>
                  <a
                    href="https://www.rahvana.com/document-vault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8a6200] text-white rounded-lg text-[13px] font-bold transition-all hover:opacity-90"
                  >
                    <Upload size={14} />
                    <span>Save documents to Document Vault</span>
                  </a>
                </div>
              )}

              {/* Update Log Card */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[14px] font-bold text-[#0c1b33]">
                    Case Update Log
                  </div>
                  <button
                    onClick={() => setIsApUpdateModalOpen(true)}
                    className="text-[12px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    + Add update
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {apUpdateLog.length === 0 ? (
                    <div className="text-[13px] text-[#6b8097] italic py-2">
                      No updates logged yet. Add updates each time you check
                      CEAC or receive new information.
                    </div>
                  ) : (
                    apUpdateLog.map((entry: any, i: number) => (
                      <div
                        key={i}
                        className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-xl p-3"
                      >
                        <div className="text-[11px] font-bold text-[#6b8097] mb-1">
                          {new Date(
                            entry.date + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {entry.ceac && ` · CEAC: ${entry.ceac}`}
                        </div>
                        <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                          {entry.note || "Status checked — no change noted."}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info Sections */}
              <div className="flex flex-col gap-3.5 mb-2">
                {tool.info_sections.map((section: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 shadow-[0_4px_20px_rgba(12,27,51,0.06)]"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          section.type === "sky"
                            ? "bg-[#e8f1fb] border-[#d0e4f7]"
                            : "bg-[#e8f6f6] border-[#9fd6d6]"
                        }`}
                      >
                        {section.icon === "info" ? (
                          <Info
                            size={16}
                            className="text-[#2f6fd4]"
                            strokeWidth={2}
                          />
                        ) : (
                          <Check
                            size={16}
                            className="text-[#0d6b6b]"
                            strokeWidth={2.5}
                          />
                        )}
                      </div>
                      <div className="text-[14px] font-bold text-[#0c1b33]">
                        {section.title}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {section.items.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-1 h-1 rounded-full bg-[#d0e4f7] mt-[7.5px] shrink-0" />
                          <span className="text-[13px] text-[#3a4f63] leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[20px]"
                style={{ backgroundColor: launchBg }}
              >
                {/* Accent Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-70"
                  style={{ background: stripeGradient }}
                />

                <div className="p-[36px_36px_32px]">
                  {/* Module Header */}
                  <div className="flex items-start gap-[16px] mb-[26px]">
                    <div className="w-[48px] h-[48px] rounded-[12px] bg-white/[0.055] border border-white/10 flex items-center justify-center shrink-0">
                      <IconComponent
                        size={22}
                        className="text-white/75"
                        strokeWidth={1.6}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-[5px]">
                        {tool.launch_module.eyebrow}
                      </div>
                      <h2 className="text-[clamp(20px,3vw,24px)]  text-white/90 leading-[1.25]">
                        {tool.launch_module.heading}
                      </h2>
                    </div>
                  </div>

                  <div className="h-px bg-white/9 mb-[22px]" />

                  {/* Fee Block (Step 9 — Pay Filing Fee) */}
                  {tool.fee_block && (
                    <div className="flex items-center gap-[16px] bg-white/[0.05] border border-white/[0.09] rounded-[10px] p-[16px_18px] mb-[16px] flex-wrap">
                      <div className="flex flex-col gap-[2px] shrink-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                          {tool.fee_block.label}
                        </div>
                        <div className="text-[32px] font text-white/90 tracking-[-0.02em] leading-none">
                          {tool.fee_block.amount}
                        </div>
                        <div className="text-[11px] text-white/35 mt-[2px]">
                          {tool.fee_block.note}
                        </div>
                      </div>
                      <div className="w-[1px] h-[48px] bg-white/12 shrink-0 hidden sm:block" />
                      <div className="flex flex-col gap-[6px] flex-1">
                        {tool.fee_block.details.map((d: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-[8px] text-[12px] text-white/55"
                          >
                            <div className="w-[4px] h-[4px] rounded-full bg-[rgba(200,170,100,0.7)] shrink-0 mt-[5px]" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Checklist (Step 10 — Review & Submit) */}
                  {tool.review_checklist &&
                    tool.review_checklist.length > 0 && (
                      <div className="flex flex-col gap-[8px] mb-[20px]">
                        {tool.review_checklist.map(
                          (item: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-start gap-[12px] bg-white/[0.06] border border-white/10 rounded-[10px] p-[12px_14px]"
                            >
                              <div className="w-[20px] h-[20px] rounded-full bg-[rgba(21,116,79,0.25)] border border-[rgba(21,116,79,0.4)] flex items-center justify-center shrink-0 mt-[1px]">
                                <Check
                                  size={11}
                                  strokeWidth={2.5}
                                  className="text-[rgba(100,220,160,0.9)]"
                                />
                              </div>
                              <div className="text-[13px] text-white/55 leading-[1.45]">
                                {item}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                  {/* Feature Cues Grid */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-[10px] ${tool.launch_module.button_label ? "mb-[26px]" : "mb-0"}`}
                  >
                    {tool.launch_module.features?.map(
                      (feat: string, i: number) => (
                        <div
                          key={i}
                          className="bg-white/6 border border-white/10 rounded-[10px] p-[12px_14px] flex items-start gap-[10px]"
                        >
                          <div
                            className={`w-[5px] h-[5px] rounded-full mt-[6px] shrink-0 ${
                              tool.launch_module.stripe_variant === "gold"
                                ? "bg-[rgba(212,168,47,0.7)]"
                                : tool.launch_module.stripe_variant === "green"
                                  ? "bg-[rgba(100,220,160,0.6)]"
                                  : isBeneficiaryTheme
                                    ? "bg-[#20a8a8bf]"
                                    : "bg-[#6aa8f0b3]"
                            }`}
                          />
                          <div className="text-[13px] text-white/55 leading-[1.4]">
                            {feat}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Upload Requirements Info Block (Step 8 only) */}
                  {tool.upload_requirements &&
                    tool.upload_requirements.length > 0 && (
                      <div className="bg-white/5 border border-white/9 rounded-[10px] p-[14px_16px] mb-[26px]">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-[10px]">
                          USCIS upload requirements
                        </div>
                        <div className="flex flex-col gap-[7px]">
                          {tool.upload_requirements?.map(
                            (req: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-[10px] text-[13px] text-white/55 leading-[1.45]"
                              >
                                <div className="w-[4px] h-[4px] rounded-full bg-[#6aa8f0]/60 shrink-0 mt-[5px]" />
                                <span>{req}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* CTA Area — only rendered when a button_label is defined */}
                  {tool.launch_module.button_label && (
                    <div className="flex flex-col gap-[11px]">
                      <button
                        onClick={() => {
                          if (tool.launch_module.href) {
                            window.open(
                              tool.launch_module.href,
                              "_blank",
                              "noopener,noreferrer",
                            );
                            setIsLaunched(true);
                          }
                        }}
                        className={`inline-flex items-center justify-center gap-[10px] w-full p-[16px_28px] text-white rounded-[12px] font-sans text-[15px] font-semibold tracking-[0.01em] transition-all duration-200 group cursor-pointer ${
                          isLaunched && tool.launch_module.return_note
                            ? "bg-[#3b7dd8] shadow-[0_4px_20px_rgba(14,92,60,0.3)] pointer-events-none"
                            : "shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)]"
                        }`}
                        style={
                          isLaunched && tool.launch_module.return_note
                            ? {}
                            : { backgroundColor: accentColor }
                        }
                      >
                        {isLaunched && tool.launch_module.return_note ? (
                          <>
                            <span>✓</span>
                            <span>
                              {tool.launch_module.button_launched_label ||
                                "Opened"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>{tool.launch_module.button_label}</span>
                            <div className="transition-transform duration-200 group-hover:translate-x-[2px]">
                              <ArrowRight size={16} strokeWidth={2} />
                            </div>
                          </>
                        )}
                      </button>

                      <div
                        className={`flex items-center justify-center gap-[5px] text-[12px] text-center leading-[1.4] transition-colors duration-200 text-white/35`}
                      >
                        <ExternalLink size={11} strokeWidth={1.8} />
                        <span>
                          {isLaunched && tool.launch_module.launched_note
                            ? tool.launch_module.launched_note
                            : tool.launch_module.note ||
                              "Opens in a new browser tab — you can return to the roadmap anytime"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* PROGRESS BAR (Step 2.4 SPECIFIC — CIVIL DOCS) */}
          {tool.doc_list && (
            <div className="flex flex-col mb-[24px]">
              <div className="flex items-center gap-[12px] mb-[8px]">
                <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (Object.values(civilDocsStatus).filter(
                          (s) => s === "reviewed",
                        ).length /
                          tool.doc_list.groups.reduce(
                            (acc: number, g: any) => acc + g.items.length,
                            0,
                          )) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                  {
                    Object.values(civilDocsStatus).filter(
                      (s) => s === "reviewed",
                    ).length
                  }{" "}
                  of{" "}
                  {tool.doc_list.groups.reduce(
                    (acc: number, g: any) => acc + g.items.length,
                    0,
                  )}{" "}
                  reviewed
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT LIST (Step 2.4 SPECIFIC) */}
          {tool.doc_list && (
            <div className="flex flex-col gap-[32px]">
              {tool.doc_list.groups.map((group: any) => (
                <div key={group.id} className="flex flex-col">
                  <div className="flex items-center gap-[10px] mb-[14px]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6b8097]">
                      {group.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-[9px] py-[3px] rounded-full uppercase tracking-[0.06em] border ${
                        group.badge === "req"
                          ? "bg-[#ffeaea] text-[#a01c1c] border-[#f5bebe]"
                          : group.badge === "cond"
                            ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                            : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                      }`}
                    >
                      {group.badge === "req"
                        ? "Required"
                        : group.badge === "cond"
                          ? "Required if Applicable"
                          : "Recommended to Improve Case Strength"}
                    </span>
                    <div className="flex-1 h-px bg-[#d0e4f7]" />
                  </div>
                  <div className="flex flex-col gap-[10px]">
                    {group.items.map((item: any) => {
                      const st = civilDocsStatus[item.id] || "not-started";
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setDocActionModal({
                              isOpen: true,
                              doc: item,
                              title: item.title,
                              subtitle: item.sub,
                              onReadGuide: () => {
                                if (item.external_href) {
                                  window.open(
                                    item.external_href,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                  actions.updateMetadata({
                                    civilDocsStatus: {
                                      ...civilDocsStatus,
                                      [item.id]: "reviewed",
                                    },
                                  });
                                } else {
                                  // Mark inline guides as in-progress when opened
                                  actions.updateMetadata({
                                    civilDocsStatus: {
                                      ...civilDocsStatus,
                                      [item.id]: "in-progress",
                                    },
                                  });
                                  setActiveCivilDoc(item);
                                  setIsCivilDocGuideOpen(true);
                                }
                              },
                              onUpload: () => {
                                const defId = mapDocumentNameToId(item.title);
                                setActiveUploadId(item.id);
                                setActiveUploadType("doc");
                                openUploadModal(defId);
                              },
                            });
                          }}
                          className={`bg-white border-[1.5px] rounded-[16px] p-[18px_20px] flex items-center gap-[16px] cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px active:translate-y-0 text-left w-full
                            ${st === "reviewed" ? "border-[#a8d9be] bg-[#e8f5ef]" : st === "in-progress" ? "border-[#f0d98a] bg-[#fef8e8]" : "border-[#d0e4f7]"}
                          `}
                        >
                          <div
                            className={`w-[40px] h-[40px] rounded-[10px] border flex items-center justify-center shrink-0 text-[17px] transition-colors
                            ${st === "reviewed" ? "bg-[#e8f5ef] border-[#a8d9be]" : "bg-[#e8f1fb] border-[#d0e4f7] group-hover:bg-[rgba(47,111,212,0.12)] group-hover:border-[rgba(47,111,212,0.3)]"}
                          `}
                          >
                            <div className="text-primary/70">
                              {getIcon(item.icon)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-semibold text-[#0c1b33] mb-[4px] leading-[1.3]">
                              {item.title}
                            </div>
                            <div className="text-[13px] text-[#6b8097] leading-[1.4]">
                              {item.sub}
                            </div>
                            <div className="flex gap-[6px] mt-[7px] flex-wrap">
                              {item.tags.map((t: string) => {
                                const map: any = {
                                  bene: {
                                    label: "Beneficiary",
                                    cls: "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]",
                                  },
                                  pet: {
                                    label: "Petitioner",
                                    cls: "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]",
                                  },
                                  both: {
                                    label: "Both",
                                    cls: "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]",
                                  },
                                  govt: {
                                    label: "Govt Record",
                                    cls: "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
                                  },
                                  "3p": {
                                    label: "Third Party",
                                    cls: "bg-[#eef3fa] text-[#3a4f63] border-[#d0e4f7]",
                                  },
                                };
                                const tag = map[t];
                                if (!tag) return null;
                                return (
                                  <span
                                    key={t}
                                    className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full border tracking-[0.04em] ${tag.cls}`}
                                  >
                                    {tag.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {(() => {
                              const defId = mapDocumentNameToId(item.title);
                              const isUploadedInVault = uploadedDocuments.some(
                                (ud) => ud.documentDefId === defId,
                              );
                              const uploadedDoc = uploadedDocuments.find(
                                (ud) => ud.documentDefId === defId,
                              );
                              const isDeleting = uploadedDoc
                                ? isDeletingIds.includes(uploadedDoc.id)
                                : false;

                              if (isDeleting) return null; // Badge hidden while deleting

                              const displayStatus = isUploadedInVault
                                ? "Uploaded"
                                : isReloadingDocs
                                  ? "Checking..."
                                  : st === "reviewed"
                                    ? "✓ Reviewed"
                                    : st === "in-progress"
                                      ? "In progress"
                                      : "Open guide";

                              const statusClasses = isUploadedInVault
                                ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0] font-bold shadow-sm"
                                : isReloadingDocs
                                  ? "bg-muted/30 text-muted-foreground border-muted-foreground/20 animate-pulse"
                                  : st === "reviewed"
                                    ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                                    : st === "in-progress"
                                      ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                                      : "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-primary hover:text-primary";

                              return (
                                <div
                                  className={`px-[11px] py-[5px] rounded-full border text-[12px] font-medium tracking-normal transition-all ${statusClasses}`}
                                >
                                  {displayStatus}
                                </div>
                              );
                            })()}

                            {(() => {
                              const defId = mapDocumentNameToId(item.title);
                              const uploadedDoc = uploadedDocuments.find(
                                (ud) => ud.documentDefId === defId,
                              );
                              const isDeleting = uploadedDoc
                                ? isDeletingIds.includes(uploadedDoc.id)
                                : false;

                              if (isReloadingDocs && !uploadedDoc) {
                                return (
                                  <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-muted-foreground font-medium animate-pulse">
                                    <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                                    Checking...
                                  </div>
                                );
                              }

                              if (isDeleting) {
                                return (
                                  <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-red-500 font-medium animate-pulse">
                                    <div className="h-3 w-3 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                                    Deleting...
                                  </div>
                                );
                              }

                              if (uploadedDoc) {
                                return (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-muted-foreground/20"
                                      >
                                        <MoreVertical size={18} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      side="top"
                                      align="end"
                                      className="w-[140px] rounded-xl shadow-xl border-muted/20"
                                    >
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(
                                            `/api/documents/${uploadedDoc.id}/download`,
                                            "_blank",
                                          );
                                        }}
                                        className="flex items-center gap-2 cursor-pointer font-medium text-[13px] py-2.5"
                                      >
                                        <Eye
                                          size={16}
                                          className="text-primary"
                                        />
                                        Preview
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDocumentToDelete({
                                            id: uploadedDoc.id,
                                            name: item.title,
                                          });
                                        }}
                                        className="flex items-center gap-2 cursor-pointer font-medium text-[13px] py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
                                      >
                                        <Trash2 size={16} />
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
              ))}
            </div>
          )}

          {/* SUPPORT CARDS */}
          {tool.support_cards &&
            tool.support_cards.length > 0 &&
            sId !== "step_2_1" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-[32px]">
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
                          <span className="text-[13px] text-[#3a4f63] leading-[1.4]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* SECONDARY ACTIONS ROW (Step 6 SPECIFIC) */}
          {(sId === "step_1_6" || sId === "step_2_1") && (
            <div className="flex flex-col mb-[28px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[12px]">
                {/* Tutorial / Guide Card */}
                <button
                  onClick={() => {
                    setTutorialIdx(0);
                    setIsTutorialOpen(true);
                  }}
                  className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col"
                >
                  <div className="flex items-center gap-[10px] mb-[12px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center shrink-0">
                      <Book
                        size={18}
                        className="text-[#4a2d8a]"
                        strokeWidth={1.7}
                      />
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
                        <Lock
                          size={18}
                          className="text-[#15744f]"
                          strokeWidth={1.7}
                        />
                      </div>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                      ✓ Credentials Saved
                    </h3>
                    <p className="text-[12px] text-[#6b8097] leading-normal">
                      {sId === "step_1_6" ? "USCIS" : "CEAC"} credentials are
                      stored in your Portal Wallet.
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
                        <Wallet
                          size={18}
                          className="text-[#15744f]"
                          strokeWidth={1.7}
                        />
                      </div>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                      Save {sId === "step_1_6" ? "USCIS" : "CEAC"} Credentials
                    </h3>
                    <p className="text-[12px] text-[#6b8097] leading-normal">
                      Securely store your{" "}
                      {sId === "step_1_6" ? "USCIS" : "CEAC"} login details in
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
                          <span className="text-[12px] text-[#3a4f63] font-medium">
                            Password
                          </span>
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
                            {ceacCredentials?.nvc_case_number
                              ? "••••••••"
                              : "—"}
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
            </div>
          )}

          {/* Guide / Wallet Cards Row */}
          {(tool.guide_card || tool.wallet_card) && (
            <div
              className={`grid grid-cols-1 ${
                tool.guide_card && tool.wallet_card ? "sm:grid-cols-2" : ""
              } gap-[12px] mb-[28px]`}
            >
              {tool.guide_card && (
                <button
                  onClick={() => {
                    setTutorialIdx(0);
                    setIsTutorialOpen(true);
                  }}
                  className={`border-[1.5px] rounded-[16px] text-left group transition-all cursor-pointer select-none flex ${
                    tool.wallet_card
                      ? "p-[20px] flex-col bg-[#fafcff] border-[#d0e4f7] hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px"
                      : "p-[20px_24px] flex-row items-center gap-[16px] w-full bg-white border-[#d0e4f7] hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(12,27,51,0.06)]"
                  }`}
                >
                  {tool.wallet_card ? (
                    /* Vertical Design (Original - Shared) */
                    <>
                      <div className="flex items-center gap-[10px] mb-[12px]">
                        <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center shrink-0">
                          <Monitor
                            size={18}
                            className="text-[#4a2d8a]"
                            strokeWidth={1.7}
                          />
                        </div>
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                        {tool.guide_card.title}
                      </h3>
                      <p className="text-[12px] text-[#6b8097] leading-normal">
                        {tool.guide_card.subtitle}
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-primary">
                        <span>View guide</span>
                        <ArrowRight size={11} strokeWidth={2} />
                      </div>
                    </>
                  ) : (
                    /* Horizontal Design (New Reference - Solo) */
                    <>
                      <div className="w-[52px] h-[52px] rounded-[14px] bg-[#f3f0fb] border border-[#c9bef2]/60 flex items-center justify-center shrink-0">
                        <Monitor
                          size={22}
                          className="text-[#4a2d8a]"
                          strokeWidth={1.7}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-[#0c1b33] mb-0.5 truncate">
                          {tool.guide_card.title}
                        </h3>
                        <p className="text-[13px] text-[#6b8097] leading-normal line-clamp-2">
                          {tool.guide_card.subtitle}
                        </p>
                      </div>
                      <div className="w-[32px] h-[32px] rounded-full bg-[#f4f7fb] flex items-center justify-center text-[#6b8097] group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </div>
                    </>
                  )}
                </button>
              )}

              {tool.wallet_card && (
                <button
                  onClick={() => {
                    if (tool.wallet_card?.type === "nvc_fee") {
                      setIsNvcFeeModalOpen(true);
                    } else if (tool.wallet_card?.type === "ceac_creds") {
                      setIsCeacModalOpen(true);
                    }
                  }}
                  className={`bg-[#fafcff] border-[1.5px] rounded-[16px] p-[20px] text-left group hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col
                    ${
                      (tool.wallet_card?.type === "ceac_creds" &&
                        ceacCredentials) ||
                      (tool.wallet_card?.type === "nvc_fee" &&
                        state.metadata.nvcFeeStatus)
                        ? "border-[#a8d9be] bg-[#e8f5ef]"
                        : "border-[#d0e4f7] hover:border-primary"
                    }
                  `}
                >
                  <div className="flex items-center gap-[10px] mb-[12px]">
                    <div
                      className={`w-[36px] h-[36px] rounded-[9px] border flex items-center justify-center shrink-0
                      ${
                        (tool.wallet_card?.type === "ceac_creds" &&
                          ceacCredentials) ||
                        (tool.wallet_card?.type === "nvc_fee" &&
                          state.metadata.nvcFeeStatus)
                          ? "bg-[#e8f5ef] border-[#a8d9be]"
                          : tool.wallet_card?.type === "ceac_creds"
                            ? "bg-[#e8f5ef] border-[#a8d9be]"
                            : "bg-[#e6f6f6] border-[#9fd8d8]"
                      }
                    `}
                    >
                      {tool.wallet_card?.type === "ceac_creds" ? (
                        <Lock
                          size={18}
                          className="text-[#15744f]"
                          strokeWidth={1.7}
                        />
                      ) : (
                        <CreditCard
                          size={18}
                          className="text-[#0f7373]"
                          strokeWidth={1.7}
                        />
                      )}
                    </div>
                  </div>
                  <h3
                    className={`text-[14px] font-semibold mb-1 ${
                      (tool.wallet_card?.type === "ceac_creds" &&
                        ceacCredentials) ||
                      (tool.wallet_card?.type === "nvc_fee" &&
                        state.metadata.nvcFeeStatus)
                        ? "text-[#15744f]"
                        : "text-[#0c1b33]"
                    }`}
                  >
                    {(tool.wallet_card?.type === "ceac_creds" &&
                      ceacCredentials) ||
                    (tool.wallet_card?.type === "nvc_fee" &&
                      state.metadata.nvcFeeStatus)
                      ? `✓ ${tool.wallet_card?.title.replace("Save", "Details")}`
                      : tool.wallet_card?.title}
                  </h3>
                  <p className="text-[12px] text-[#6b8097] leading-normal">
                    {tool.wallet_card?.subtitle}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-3 text-[12px] font-semibold ${
                      (tool.wallet_card?.type === "ceac_creds" &&
                        ceacCredentials) ||
                      (tool.wallet_card?.type === "nvc_fee" &&
                        state.metadata.nvcFeeStatus)
                        ? "text-[#15744f]"
                        : "text-primary"
                    }`}
                  >
                    <span>
                      {(tool.wallet_card?.type === "ceac_creds" &&
                        ceacCredentials) ||
                      (tool.wallet_card?.type === "nvc_fee" &&
                        state.metadata.nvcFeeStatus)
                        ? "View saved details"
                        : tool.wallet_card?.type === "ceac_creds"
                          ? "Open credential vault"
                          : "Update payment record"}
                    </span>
                    <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* ACTION CARDS ROW (Step 3 SPECIFIC) */}
          {tool.action_cards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[28px]">
              {tool.action_cards.map((card: ActionCard) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if (card.type === "tutorial") {
                      setTutorialIdx(0);
                      setIsTutorialOpen(true);
                    } else if (card.href) {
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
                        <Monitor
                          size={18}
                          className="text-[#4a2d8a]"
                          strokeWidth={1.7}
                        />
                      ) : (
                        <Globe
                          size={18}
                          className="text-[#0f7373]"
                          strokeWidth={1.7}
                        />
                      )}
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">
                    {card.title}
                  </h3>
                  <p className="text-[12px] text-[#6b8097] leading-normal">
                    {card.subtitle}
                  </p>
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
            className={`${currentStep.step_key === "step_2_4" || currentStep.step_key === "step_2_6" || currentStep.step_key === "step_2_7" ? "mt-10" : "mt-0"} text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[8px]`}
          >
            {tool.disclaimer ||
              "Rahvana provides structured guidance only. This is not legal advice. Consult a licensed immigration attorney for case-specific decisions."}
          </p>
        </div>
      </div>
    );
  };

  if (!currentStep) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans">
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center relative pb-[100px] ${
          currentStep.step_type === "quest" ? "" : "p-6 md:p-10 lg:p-12"
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
                    const screen =
                      currentStep.filing_data?.quiz?.screens[quizScreenIdx];
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

        <div
          className={`w-full ${currentStep.step_type === "quest" ? "" : "max-w-4xl"}`}
        >
          {/* Global Sequential Completion Locked Banner */}
          {!isCompleted && incompletePrerequisite && (
            <div className="mb-8 p-5 bg-[#fffbeb] border border-[#fef3c7] rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] flex items-center justify-center shrink-0 shadow-inner border border-[#fde68a]">
                <Lock size={22} className="text-[#92400e]" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-[#92400e] mb-1">
                  Journey Sequence Order
                </div>
                <div className="text-[14px] text-[#b45309] leading-relaxed max-w-[600px]">
                  You are exploring this step. To unlock the "Mark as Completed" action, please finish 
                  <button 
                            onClick={() => handleNavigate(incompletePrerequisite.step_key || (incompletePrerequisite as any).id)}
                            className="font-extrabold underline px-1.5 hover:text-[#78350f] transition-colors"
                          >
                            "{incompletePrerequisite.step_name}"
                          </button> 
                  first.
                </div>
              </div>
            </div>
          )}

          {currentStep.step_type === "quest" ? (
            <div className="w-full min-h-[600px] flex flex-col items-center">
              <QuestRenderer
                quest={currentStep.quest_data as unknown as QuestSuite}
                onComplete={handleToggleComplete}
                state={state}
                actions={safeActions}
              />
            </div>
          ) : currentStep.step_type === "tool" ? (
            renderToolStep()
          ) : currentStep.step_type === "docs" ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {/* Header for Docs */}
              <div className="text-left w-full max-w-[740px] mb-[24px]">
                <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] leading-[1.2]">
                  {currentStep.step_name}
                </h1>
                <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[12px] max-w-[550px]">
                  {currentStep.step_description}
                </p>

                {/* Local Progress Bar - Refined like Reference */}
                {currentStep.document_items &&
                  currentStep.document_items.length > 0 && (
                    <div className="w-full flex items-center gap-[12px] mt-3">
                      <div className="flex-1 h-[5px] bg-primary/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-primary transition-all duration-1000 ease-out"
                          style={{
                            width: `${(currentStep.document_items.filter((d: any) => state.metadata?.docReviewStatus?.[d.id] || state.documentChecklist[d.name]).length / currentStep.document_items.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap">
                        {
                          currentStep.document_items.filter(
                            (d: any) =>
                              state.metadata?.docReviewStatus?.[d.id] ||
                              state.documentChecklist[d.name],
                          ).length
                        }{" "}
                        of {currentStep.document_items.length} reviewed
                      </span>
                    </div>
                  )}
              </div>

              {/* Document Cards */}
              <div className="w-full max-w-[740px]">
                <div className="w-full">
                  {(() => {
                    const docItems =
                      (currentStep as any).document_items ||
                      currentStep.document_items;
                    if (!docItems) return [];
                    const uniqueGroups = Array.from(
                      new Set(
                        docItems.map((d: any) => d.group || "Required Now"),
                      ),
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
                    const docItems =
                      (currentStep as any).document_items ||
                      currentStep.document_items;
                    const groupItems = docItems?.filter(
                      (d: any) => (d.group || "Required Now") === groupName,
                    );

                    if (!groupItems || groupItems.length === 0) return null;

                    return (
                      <div
                        key={groupName}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-[32px]"
                      >
                        <div className="flex items-center gap-[10px] mb-[14px]">
                          <span className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#6b8097] whitespace-nowrap">
                            {groupName}
                          </span>
                          <div className="h-px flex-1 bg-primary/30" />
                        </div>

                        <div className="flex flex-col">
                          {groupItems.map((doc: any, idx: number) => {
                            const docReviewStatus =
                              state.metadata?.docReviewStatus?.[doc.id];
                            const isReviewed =
                              docReviewStatus === "reviewed" ||
                              state.documentChecklist[doc.name];
                            const hasAttachment =
                              state.docUploads[doc.name] ||
                              state.notes[doc.name];
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
                                      if (
                                        doc.guideUrl &&
                                        doc.guideUrl !== "/guides"
                                      ) {
                                        window.open(doc.guideUrl, "_blank");
                                        if (
                                          actions.updateDocumentStatus &&
                                          doc.id
                                        ) {
                                          actions.updateDocumentStatus(
                                            doc.id,
                                            "reviewed",
                                          );
                                        }
                                      } else {
                                        setSelectedGuideId(doc.id || null);
                                        if (
                                          actions.updateDocumentStatus &&
                                          doc.id
                                        ) {
                                          actions.updateDocumentStatus(
                                            doc.id,
                                            "in-progress",
                                          );
                                        }
                                      }
                                    },
                                    onUpload: () => {
                                      const defId = mapDocumentNameToId(
                                        doc.name,
                                      );
                                      setActiveUploadId(doc.id);
                                      setActiveUploadType("doc");
                                      openUploadModal(defId);
                                    },
                                  });
                                }}
                                className={`group flex items-center gap-[16px] px-[20px] py-[18px] rounded-[14px] border-[1.5px] transition-all cursor-pointer relative shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] hover:border-primary hover:shadow-[0_8px_32px_rgba(15,31,56,0.12),0_2px_8px_rgba(15,31,56,0.06)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] mb-[10px]
                                ${
                                  isReviewed
                                    ? "bg-[#eaf7ff] border-[#b8daff]"
                                    : isInProgress
                                      ? "bg-[#fff9e6] border-[#fde68a]/50"
                                      : "bg-white border-[#d0e4f7]"
                                }`}
                              >
                                <div
                                  className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 border text-[18px]
                                  ${
                                    isReviewed
                                      ? "bg-[#1a7a5e] text-white border-[#1a7a5e]"
                                      : isInProgress
                                        ? "bg-white border-[#fde68a] text-[#d97706]"
                                        : "bg-[#e8f1fb] border-[#d0e4f7] text-primary/80"
                                  }`}
                                >
                                  {isReviewed ? (
                                    <CheckCircle2 size={18} strokeWidth={2.5} />
                                  ) : (
                                    (() => {
                                      switch (doc.icon) {
                                        case "ShieldCheck":
                                          return <ShieldCheck size={18} />;
                                        case "User":
                                          return <User size={18} />;
                                        case "FileText":
                                          return <FileText size={18} />;
                                        case "FileCheck":
                                          return <FileCheck size={18} />;
                                        case "MessageSquare":
                                          return <MessageSquare size={18} />;
                                        case "Scale":
                                          return <Scale size={18} />;
                                        case "Globe":
                                          return <Globe size={18} />;
                                        case "ClipboardList":
                                          return <ClipboardList size={18} />;
                                        case "Lock":
                                          return <Lock size={18} />;
                                        case "Camera":
                                          return <Camera size={18} />;
                                        default:
                                          return <FileText size={18} />;
                                      }
                                    })()
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="text-[15px] font-semibold text-[#0f1f38] mb-[4px] leading-[1.3] truncate">
                                    {doc.name}
                                  </h3>
                                  <p className="text-[13px] text-[#6b8097] leading-[1.4] mb-[7px] truncate">
                                    {doc.subtitle}
                                  </p>
                                  <div className="flex flex-wrap gap-[6px]">
                                    {doc.tag && (
                                      <span
                                        className={`px-[9px] py-[3px] rounded-full text-[11px] font-semibold tracking-[0.04em]
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
                                      <span className="px-[9px] py-[3px] rounded-full text-[11px] font-semibold tracking-[0.04em] bg-[#f3f0fb] text-[#4a2d80]">
                                        Rahvana Guide
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {(() => {
                                    const defId = mapDocumentNameToId(doc.name);
                                    const isUploadedInVault =
                                      uploadedDocuments.some(
                                        (ud) => ud.documentDefId === defId,
                                      );
                                    const uploadedDoc = uploadedDocuments.find(
                                      (ud) => ud.documentDefId === defId,
                                    );
                                    const isDeleting = uploadedDoc
                                      ? isDeletingIds.includes(uploadedDoc.id)
                                      : false;

                                    if (isDeleting) return null; // Badge hidden while deleting

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
                                        className={`px-[11px] py-[5px] rounded-full border text-[12px] font-medium tracking-normal transition-all ${statusClasses}`}
                                      >
                                        {displayStatus}
                                      </div>
                                    );
                                  })()}

                                  {(() => {
                                    const defId = mapDocumentNameToId(doc.name);
                                    const uploadedDoc = uploadedDocuments.find(
                                      (ud) => ud.documentDefId === defId,
                                    );
                                    const isDeleting = uploadedDoc
                                      ? isDeletingIds.includes(uploadedDoc.id)
                                      : false;

                                    if (isReloadingDocs && !uploadedDoc) {
                                      return (
                                        <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-muted-foreground font-medium animate-pulse">
                                          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                                          Checking...
                                        </div>
                                      );
                                    }

                                    if (isDeleting) {
                                      return (
                                        <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-red-500 font-medium animate-pulse">
                                          <div className="h-3 w-3 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                                          Deleting...
                                        </div>
                                      );
                                    }

                                    if (uploadedDoc) {
                                      return (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-muted-foreground/20"
                                            >
                                              <MoreVertical size={18} />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            side="top"
                                            align="end"
                                            className="w-[140px] rounded-xl shadow-xl border-muted/20"
                                          >
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                  `/api/documents/${uploadedDoc.id}/download`,
                                                  "_blank",
                                                );
                                              }}
                                              className="flex items-center gap-2 cursor-pointer font-medium text-[13px] py-2.5"
                                            >
                                              <Eye
                                                size={16}
                                                className="text-primary"
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
                                              className="flex items-center gap-2 cursor-pointer font-medium text-[13px] py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
                                            >
                                              <Trash2 size={16} />
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

              <div className="mt-[48px] px-[20px] py-[16px] bg-[#e8f1fb] rounded-[9px] text-[12px] text-[#6b8097] leading-[1.65] text-center max-w-[740px] w-full mb-[24px]">
                Rahvana provides structured guidance only. This is not legal
                advice.
                <br />
                Consult a licensed immigration attorney for case-specific
                decisions.
              </div>
            </div>
          ) : currentStep.step_type === "filing" ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="flex flex-col w-full max-w-[660px] pb-[80px] px-[24px]">
                <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] leading-[1.2]">
                  {currentStep.step_name}
                </h1>
                <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[28px] max-w-[500px]">
                  {currentStep.filing_data?.subtitle ||
                    currentStep.step_description}
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
                        const isSelected =
                          state.metadata.filingMethod === method.id;
                        const isOnline = method.id === "online";

                        const pIdleBg = isOnline
                          ? "bg-[#f0faf6]"
                          : "bg-[#f2f0fb]";
                        const pIdleBorder = isOnline
                          ? "border-[#8ecdb8]"
                          : "border-[#b0a6e2]";
                        const pIdleText = isOnline
                          ? "text-[#0e5c42]"
                          : "text-[#2e1f72]";
                        const pIdleSub = isOnline
                          ? "text-[#0e5c42]/65"
                          : "text-[#2e1f72]/65";
                        const pIdleBull = isOnline
                          ? "text-[#0e5c42]/75"
                          : "text-[#2e1f72]/75";

                        const pSelBg = isOnline
                          ? "bg-[#0e5c42]"
                          : "bg-[#2e1f72]";
                        const pSelFee = isOnline
                          ? "bg-[#6dddb8] text-[#0e5c42]"
                          : "bg-[#a89af5] text-[#2e1f72]";
                        const pSelText = isOnline
                          ? "text-[#6dddb8]"
                          : "text-[#a89af5]";
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
                        disabled={!!incompletePrerequisite}
                        onClick={() =>
                          handleConfirmation(
                            state.metadata.filingMethod as string,
                          )
                        }
                        className={`w-full p-[15px_24px] rounded-[14px] text-white font-semibold text-[15px] transition-all duration-[0.24s] shadow-sm transform
                            ${!state.metadata.filingMethod ? "hidden" : "block"}
                            ${incompletePrerequisite ? "bg-slate-300 cursor-not-allowed opacity-70 grayscale" : 
                              state.metadata.filingMethod === "online"
                                ? "bg-[#0e5c42] hover:bg-[#0a4330] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(14,92,66,0.35)]"
                                : "bg-[#2e1f72] hover:bg-[#1e1348] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(46,31,114,0.35)]"
                            }`}
                      >
                        {incompletePrerequisite ? (
                           <span className="flex items-center justify-center gap-2">
                             <Lock size={14} /> Finish "{incompletePrerequisite.step_name.slice(0, 15)}..." first
                           </span>
                        ) : (
                          <>
                            Confirm:{" "}
                            {state.metadata.filingMethod === "online"
                              ? "File Online"
                              : "File by Mail"}{" "}
                            →
                          </>
                        )}
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

                <div
                  className={`mt-8 p-[12px_16px] bg-[#e8f1fb] rounded-[9px] text-[12px] text-[#6b8097] leading-[1.6] m-0`}
                >
                  <>
                    Rahvana provides structured guidance only. This is not legal
                    advice.
                    <br />
                    Consult a licensed immigration attorney for case-specific
                    decisions.
                  </>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#d0e4f7] rounded-[32px] p-10 md:p-14 lg:p-20 shadow-xl shadow-[#0f1f38]/5 animate-in fade-in zoom-in-95 duration-700 w-full max-w-[740px] mx-auto">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4 opacity-70">
                Case Update
              </div>
              <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] leading-[1.2]">
                {currentStep.step_name}
              </h1>
              <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[28px] max-w-[500px]">
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

              {/* Sequential Completion Guard & Button */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <button
                  disabled={!!incompletePrerequisite}
                  onClick={() => handleToggleComplete()}
                  className={`w-full p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group ${
                    isCompleted
                      ? "bg-[#e8f5ef] text-[#15744f] hover:bg-[#d0efe1]"
                      : incompletePrerequisite 
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed grayscale"
                        : "bg-primary text-white hover:bg-primary/90 shadow-[0_4px_20px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Completed — Well Done!</span>
                    </>
                  ) : incompletePrerequisite ? (
                    <>
                      <Lock size={16} strokeWidth={2.5} />
                      <span>Finish "{incompletePrerequisite.step_name.slice(0, 20)}..." first</span>
                    </>
                  ) : (
                    <span>Mark Step as Done</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Bottom Navigation Footer */}
      <footer className="absolute bottom-0 left-0 right-0 h-[58px] bg-[#fafcff] border-t border-[#d0e4f7] flex items-center gap-2 px-4 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <button
          onClick={() =>
            prevStep &&
            handleNavigate((prevStep as any).step_key || (prevStep as any).id)
          }
          className={`px-4 py-[9px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[13px] font-medium text-[#6b8097] flex items-center gap-[5px] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a] shrink-0 ${!prevStep ? "invisible pointer-events-none" : ""}`}
        >
          <ArrowLeft size={12} strokeWidth={2.5} />
          Previous
        </button>

        <div className="flex-1 flex items-center gap-2 mx-auto px-4">
          <div className="flex-1 h-1 bg-[#d0e4f7] rounded-[10px] overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[11px] font-semibold text-[#6b8097] whitespace-nowrap">
            Step {localIdx + 1} of {activeStepsInChapter.length}
          </div>
        </div>

        <button
          onClick={() =>
            nextStep &&
            handleNavigate((nextStep as any).step_key || (nextStep as any).id)
          }
          className={`px-[18px] py-[9px] bg-primary rounded-[10px] text-[13px] font-semibold text-white flex items-center gap-[5px] transition-all hover:brightness-110 active:scale-95 shrink-0 shadow-sm shadow-primary/20 ${!nextStep || !isCompleted ? "invisible pointer-events-none" : ""}`}
        >
          Next
          <ArrowRight size={12} strokeWidth={2.5} />
        </button>
      </footer>

      {/* Sponsorship Calculator Tool Overlay */}
      <SponsorshipCalculatorTool
        isOpen={isSponsorshipCalcOpen}
        onClose={() => setIsSponsorshipCalcOpen(false)}
        initialData={sponsorshipResult?.raw}
        onSave={(result) => {
          actions.updateMetadata({ sponsorshipResult: result });
          setIsSponsorshipCalcOpen(false);
          if (!isCompleted) handleToggleComplete("step_2_5");
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
            className={
              walletPortalType === "COURIER"
                ? "text-indigo-600"
                : "text-primary"
            }
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

      {renderDocActionModal()}

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
            toast.success("Document deleted successfully");
          } catch (err) {
            toast.error("Failed to delete document");
          }
        }}
      />

      <ConfirmationModal
        open={showIncompleteWarning}
        onOpenChange={setShowIncompleteWarning}
        title={
          currentStep?.step_type === 'docs' 
            ? "Documents Not Fully Reviewed" 
            : "Questionnaire Incomplete"
        }
        description={
          currentStep?.step_type === 'docs' && pendingStepProgress
            ? `You have marked ${pendingStepProgress.requiredReviewed} of ${pendingStepProgress.requiredTotal} required documents as reviewed. For a professional and accurate filing, we strongly recommend reviewing all critical items before proceeding. Would you like to proceed anyway?`
            : pendingStepProgress 
              ? `You have completed ${pendingStepProgress.answered} of ${pendingStepProgress.total} required questions in this section. Skipping these may affect the accuracy of your journey roadmap. Would you like to continue anyway?`
              : "You haven't completed all required items in this step. Would you like to proceed anyway?"
        }
        cancelText="Go Back & Complete"
        confirmText="Confirm & Mark Done"
        confirmVariant="primary"
        onConfirm={async () => {
          if (pendingStepToComplete) {
            await actions.toggleComplete(pendingStepToComplete);
            setPendingStepToComplete(null);
          }
          setShowIncompleteWarning(false);
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

      {isCivilDocGuideOpen && activeCivilDoc && (
        <CivilDocGuideOverlay
          isOpen={isCivilDocGuideOpen}
          onClose={() => setIsCivilDocGuideOpen(false)}
          doc={activeCivilDoc}
          status={civilDocsStatus[activeCivilDoc.id] || "not-started"}
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
        <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ease-out">
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
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px] bg-white">
            <div className="w-full max-w-[600px] flex flex-col">
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
              <h2 className="font-black  text-[clamp(22px,3.5vw,28px)] text-[#0f1f38] mb-[6px] leading-[1.25]">
                {InlineGuideData[selectedGuideId].title}
              </h2>
              <p className="text-[14px] text-[#3a4f63] mb-[28px] leading-[1.6]">
                {InlineGuideData[selectedGuideId].sub}
              </p>

              {/* Sections */}
              <div className="w-full flex flex-col">
                {selectedGuideId === "doc_passport_photos" ? (
                  <div className="mb-4">
                    <PassportPhotoTool
                      showHeader={false}
                      showRequirements={true}
                    />
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
                  InlineGuideData[selectedGuideId].sections.map(
                    (section, idx) => (
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
                    ),
                  )
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-[10px] mt-[28px] mb-[40px]">
                <button
                  onClick={async () => {
                    if (actions.updateDocumentStatus && selectedGuideId) {
                      // Mark as reviewed
                      await actions.updateDocumentStatus(
                        selectedGuideId,
                        "reviewed",
                      );

                      // Check if all documents are now reviewed for auto-complete
                      const sId =
                        currentStep.step_key || (currentStep as any)?.id;
                      if (sId === "step_1_2") {
                        const docItems = currentStep.document_items || [];
                        const allReviewed = docItems.every((doc: any) => {
                          if (doc.id === selectedGuideId) return true; // This one will be reviewed
                          return (
                            state.metadata?.docReviewStatus?.[doc.id] ===
                              "reviewed" || state.documentChecklist[doc.name]
                          );
                        });

                        // Auto-complete step if all documents are reviewed
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

      {isInterviewDayTutOpen &&
        currentStep?.tool_data?.type === "interview_day" && (
          <InterviewDayTutOverlay
            isOpen={isInterviewDayTutOpen}
            onClose={() => setIsInterviewDayTutOpen(false)}
            tutorial={(currentStep.tool_data as any).tutorial || []}
            index={interviewDayTutIdx}
            setIndex={setInterviewDayTutIdx}
          />
        )}

      {isCourierGuideOpen &&
        courierToolData?.type === "courier_registration" && (
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
          onSave={handleSaveApUpdate}
          ceacOptions={(currentStep.tool_data as any).recorder.ceac_options}
        />
      )}
      {/* Tutorial Overlay */}
      {isTutorialOpen &&
        (() => {
          // Use tool-specific tutorial_steps if available (steps 7, 8),
          // otherwise fall back to the static USCIS_TUTORIAL_STEPS (step 6)
          const tool = currentStep?.tool_data;
          const dynamicSteps = tool?.tutorial_steps;
          const steps =
            dynamicSteps && dynamicSteps.length > 0
              ? dynamicSteps
              : USCIS_TUTORIAL_STEPS;
          const isDynamic = !!(dynamicSteps && dynamicSteps.length > 0);
          const currentTutStep = steps[tutorialIdx];

          return (
            <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out">
              {/* Tutorial Topbar */}
              <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
                <button
                  onClick={() => setIsTutorialOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/30 transition-all cursor-pointer"
                >
                  <X size={16} strokeWidth={2} />
                </button>

                <div className="flex-1 h-[5px] bg-primary/30 rounded-[10px] overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary to-primary rounded-[10px] transition-all duration-[0.4s] ease-out"
                    style={{
                      width: `${((tutorialIdx + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                  {tutorialIdx + 1} / {steps.length}
                </div>
              </div>

              {/* Tutorial Body */}
              <div className="flex-1 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center">
                <div className="w-full max-w-[580px] flex flex-col">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                    {isDynamic
                      ? currentTutStep.label
                      : (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0])
                          .label}
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
                    /* Dynamic steps: browser chrome + structured visual (from HTML reference) */
                    <div className="w-full rounded-[10px] overflow-hidden border-[1.5px] border-[#d0e4f7] mb-5 shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
                      {/* Browser Chrome Bar — always visible */}
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

                      {/* Content Area — real image OR structured placeholder */}
                      {(currentTutStep as TutorialStepData).screenshot ? (
                        /* ── REAL SCREENSHOT ─────────────────────────────────
                           To use: set  "screenshot": "/path/or/url.png"
                           on the tutorial step in ir-1.json.
                           The image fills the frame at full width.          */
                        <Image
                          src={(currentTutStep as TutorialStepData).screenshot!}
                          alt={(currentTutStep as TutorialStepData).ss_label}
                          className="w-full block object-cover"
                          draggable={false}
                        />
                      ) : (
                        /* ── PLACEHOLDER (no screenshot yet) ────────────────
                           Replace by adding a "screenshot" field above.     */
                        <div className="bg-[#f4f7fb] flex items-center justify-center px-[24px] py-[28px] text-center min-h-[190px]">
                          <div className="flex flex-col items-center gap-[12px] max-w-[420px] w-full">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b8097] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px]">
                              {(currentTutStep as TutorialStepData).ss_label}
                            </span>
                            <div className="text-[17px] font-semibold text-[#0c1b33]">
                              {(currentTutStep as TutorialStepData).ss_headline}
                            </div>
                            <div className="text-[13px] text-[#3a4f63] leading-[1.55]">
                              {(currentTutStep as TutorialStepData).ss_desc}
                            </div>
                            {(currentTutStep as TutorialStepData)
                              .ss_highlight && (
                              <div className="px-[16px] py-[10px] bg-[rgba(47,111,212,0.12)] border-[1.5px] border-[rgba(47,111,212,0.22)] rounded-[10px] text-[13px] font-semibold text-primary">
                                {
                                  (currentTutStep as TutorialStepData)
                                    .ss_highlight
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Caption Bar — always visible; green tint for "success" captionClass */}
                      <div
                        className={`p-[8px_14px_10px] border-t text-[11px] leading-normal ${
                          (currentTutStep as TutorialStepData).caption_class ===
                          "success"
                            ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f] font-medium"
                            : "bg-white border-[#d0e4f7] text-[#6b8097]"
                        }`}
                      >
                        {(currentTutStep as TutorialStepData).caption}
                      </div>
                    </div>
                  ) : (
                    /* Static USCIS steps: screenshot placeholder */
                    <div className="w-full bg-[#eef3fa] border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-5 relative flex flex-col">
                      <div className="bg-[#eef3fa] flex flex-col items-center justify-center p-9 text-center">
                        <div className="w-11 h-11 rounded-full bg-primary/30 flex items-center justify-center mb-2.5 shadow-sm">
                          <Search
                            size={22}
                            className="text-[#6b8097]"
                            strokeWidth={1.6}
                          />
                        </div>
                        <div className="text-[13px] font-semibold text-[#6b8097] mb-1">
                          Screenshot not yet added
                        </div>
                        <div className="text-[11px] font-mono text-[#b8d4f0] bg-[#e8f1fb] px-2.5 py-1 rounded-[4px] break-all max-w-[280px]">
                          {
                            (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0])
                              .screenshot
                          }
                        </div>
                      </div>
                      <div className="p-[8px_12px_10px] bg-[#f4f7fb] border-t border-[#d0e4f7] text-[11px] text-[#6b8097] leading-normal text-left">
                        {
                          (currentTutStep as (typeof USCIS_TUTORIAL_STEPS)[0])
                            .caption
                        }
                      </div>
                    </div>
                  )}

                  {/* Note Block */}
                  {currentTutStep.note && (
                    <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[12px_15px] mb-[22px]">
                      <div className="text-[13px] text-[#8a6200] leading-[1.55]">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: currentTutStep.note
                              .replace(
                                "Important:",
                                "<strong>Important:</strong>",
                              )
                              .replace(
                                "Avoid this:",
                                "<strong>Avoid this:</strong>",
                              ),
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div className="flex gap-[10px] items-center">
                    {tutorialIdx > 0 && (
                      <button
                        onClick={() => setTutorialIdx(tutorialIdx - 1)}
                        className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
                      >
                        ← Back
                      </button>
                    )}
                    {tutorialIdx < steps.length - 1 ? (
                      <button
                        onClick={() => setTutorialIdx(tutorialIdx + 1)}
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
        <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-260 ease-[cubic-bezier(0.4,0,0.2,1)] font-sans">
          {/* Guide Topbar */}
          <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
            <button
              onClick={() => setIsGatheringGuideOpen(false)}
              className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-[#d0e4f7] group"
            >
              <X
                size={16}
                strokeWidth={2}
                className="text-[#3a4f63] group-hover:text-[#1c2b3a]"
              />
            </button>
            <div className="flex-1 h-1.25 bg-[#d0e4f7] rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-primary/70 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Guide Body */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
            <div className="w-full max-w-[600px]">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#2f6fd4] mb-[16px]">
                Step 4 · Original Documents Checklist
              </div>
              <h2 className="text-[clamp(20px,3vw,26px)]  text-[#0c1b33] mb-[8px] leading-[1.25]">
                {selectedGatheringItem.title}
              </h2>
              <p className="text-[14px] text-[#3a4f63] mb-[22px] leading-[1.6]">
                {selectedGatheringItem.sub}
              </p>

              {/* Document Sections */}
              <div className="flex flex-col gap-[12px] mb-[24px]">
                {selectedGatheringItem.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-[18px_20px]"
                  >
                    <div className="text-[12px] font-[700] tracking-[0.06em] uppercase text-[#6b8097] mb-[8px]">
                      {sec.t}
                    </div>
                    <div
                      className="text-[14px] text-[#3a4f63] leading-[1.7] prose-sm"
                      dangerouslySetInnerHTML={{ __html: sec.c }}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-[10px] mt-[24px]">
                <button
                  onClick={() => {
                    const isRev =
                      gatheringStatus[selectedGatheringItem.id] === "reviewed";
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
                    toast.success("Document marked as packed!");
                  }}
                  disabled={
                    gatheringStatus[selectedGatheringItem.id] === "reviewed"
                  }
                  className="p-[14px_24px] bg-[#15744f] text-white border-none rounded-[16px] text-[15px] font-semibold transition-all hover:bg-[#0e5c3c] hover:-translate-y-[1px] active:translate-y-0 disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
                  className="p-[13px_24px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[16px] text-[14px] font-[500] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a] flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back to checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Exam Guide Overlay (Step 3.5) */}
      {isMedicalGuideOpen &&
        currentStep?.tool_data?.type === "medical_exam_guide" && (
          <div className="fixed inset-0 z-200 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-280 font-sans">
            {/* Topbar */}
            <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
              <button
                onClick={() => setIsMedicalGuideOpen(false)}
                className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-sky-100 group"
              >
                <X
                  size={16}
                  strokeWidth={2}
                  className="text-[#3a4f63] group-hover:text-[#1c2b3a]"
                />
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
                {medicalGuideIdx + 1} /{" "}
                {(currentStep.tool_data as any).tutorial.length}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
              {(() => {
                const s = (currentStep.tool_data as any).tutorial[
                  medicalGuideIdx
                ];
                const isFirst = medicalGuideIdx === 0;
                const isLast =
                  medicalGuideIdx ===
                  (currentStep.tool_data as any).tutorial.length - 1;

                return (
                  <div className="w-full max-w-[580px] flex flex-col">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-[14px]">
                      Medical Exam Guide · {s.label}
                    </div>
                    <h2 className="text-[clamp(20px,3.2vw,26px)]  text-[#0c1b33] mb-[8px] leading-[1.3]">
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
                        <Info
                          size={16}
                          className="text-[#8a6200] shrink-0 mt-[2px]"
                        />
                        <span className="text-[13px] text-[#8a6200] leading-[1.55]">
                          {s.note}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-[10px]">
                      {!isFirst && (
                        <button
                          onClick={() =>
                            setMedicalGuideIdx(medicalGuideIdx - 1)
                          }
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

      {/* Document Vault Integration */}
      {uploadModalOpen && selectedDocumentDefId && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={closeUploadModal}
          documentDef={
            ALL_DOCUMENTS.find((d) => d.id === selectedDocumentDefId)!
          }
          onUploadComplete={async () => {
            // Refresh the vault store to include the newly uploaded document
            await reloadDocuments();

            // Update journey status based on what was being uploaded
            if (activeUploadId && activeUploadType) {
              const currentHhStatus =
                (state.metadata.hhDocsStatus as any) || {};
              const currentFinStatus =
                (state.metadata.financialDocsStatus as any) || {};

              if (activeUploadType === "doc") {
                actions.updateDocumentStatus?.(activeUploadId, "reviewed");
              } else if (activeUploadType === "hh") {
                const nextHhStatus = {
                  ...currentHhStatus,
                  [activeUploadId]: "reviewed",
                };
                // Update local state for immediate feedback
                setHhDocsStatus(nextHhStatus);
                // Update persistent metadata
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
