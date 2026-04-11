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
  Scroll,
  HelpCircle,
  FolderOpen,
  Save,
  Edit3,
  Calculator,
  Receipt,
  Banknote,
  Building,
  Landmark,
  Wallet,
  User,
  Home,
  HardDrive,
  FileText,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  Info,
  PartyPopper,
  Briefcase,
  Syringe,
  Hospital,
  Copy,
  Paperclip,
  Heart,
  Eye,
  MoreVertical,
  Trash2,
  Truck,
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
import { QuestRenderer } from "./QuestRenderer";
import { getAllActiveSteps, getStageProgress } from "./journeyHelpers";
import CredentialFormModal from "@/app/(main)/portal-wallet/components/CredentialFormModal";
import ViewCredentialModal from "@/app/(main)/portal-wallet/components/ViewCredentialModal";
import { toast } from "sonner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { InlineGuideData } from "./InlineGuideData";
import { USCIS_TUTORIAL_STEPS } from "./UscisTutorialData";
import Image from "next/image";
import Link from "next/link";
import {
  HOUSEHOLD_TUTORIAL_STEPS,
  HOUSEHOLD_GUIDE_CONTENT,
} from "./HouseholdTutorialData";
import {
  SUBMISSION_TUTORIAL_STEPS,
  SubmissionTutorialOverlay,
} from "./SubmissionTutorialData";
import { AWAITING_REVIEW_DATA } from "./AwaitingReviewData";
import { DQ_RECORDING_DATA } from "./DqRecordingData";
import { INTERVIEW_SCHEDULING_DATA } from "./InterviewSchedulingData";
import { APPOINTMENT_RECEIVED_DATA } from "./AppointmentReceivedData";
import { MEDICAL_EXAM_DATA } from "./MedicalExamData";
import { POLIO_CERTIFICATE_DATA } from "./PolioCertificateData";
import { POLICE_CLEARANCE_DATA } from "./PoliceClearanceData";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DocumentUploadModal } from "@/app/components/document-vault/DocumentUploadModal";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { useAuth } from "@/app/context/AuthContext";

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
    deleteDocument,
  } = useDocumentVaultStore();
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [activeUploadType, setActiveUploadType] = useState<
    "doc" | "hh" | "financial" | null
  >(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

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
  const [sponsorshipStepIdx, setSponsorshipStepIdx] = useState(0);
  const [sponsorshipData, setSponsorshipData] = useState<any>({
    agi: 0,
    householdSize: 2,
    needsHouseholdMember: false,
    householdMemberCount: 0,
    needsJointSponsor: false,
    jointSponsorCount: 0,
  });
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

  const getIcon = (iconKey: string) => {
    switch (iconKey) {
      case "passport":
        return <BookOpen size={18} />;
      case "birth":
        return <FileText size={18} />;
      case "marriage":
        return <Scroll size={18} />;
      case "divorce":
        return <Scroll size={18} />;
      case "pcc":
      case "police":
        return <ShieldCheck size={18} />;
      case "military":
        return <ShieldCheck size={18} />;
      case "home":
        return <Home size={18} />;
      case "user":
        return <User size={18} />;
      case "link":
        return <ExternalLink size={18} />;
      case "id":
        return <User size={18} />;
      case "translations":
        return <Globe size={18} />;
      case "prior-marriage":
        return <Scale size={18} />;
      case "death-cert":
        return <FileText size={18} />;
      case "name-change":
        return <Edit3 size={18} />;
      case "help":
        return <HelpCircle size={18} />;
      case "folder":
        return <FolderOpen size={18} />;
      case "save":
        return <Save size={18} />;
      case "message":
        return <MessageSquare size={18} />;
      case "calculator":
        return <Calculator size={18} />;
      case "receipt":
        return <Receipt size={18} />;
      case "banknote":
        return <Banknote size={18} />;
      case "building":
        return <Building size={18} />;
      case "landmark":
        return <Landmark size={18} />;
      case "wallet":
        return <Wallet size={18} />;
      case "hard-drive":
        return <HardDrive size={18} />;
      case "file-text":
        return <FileText size={18} />;
      case "clipboard":
        return <ClipboardList size={18} />;
      case "mail":
        return <Mail size={18} />;
      case "briefcase":
        return <Briefcase size={18} />;
      case "camera":
      case "photos":
        return <Camera size={18} />;
      case "medical":
      case "pulse":
        return <Activity size={18} />;
      case "syringe":
      case "polio":
        return <Syringe size={18} />;
      case "hospital":
      case "medical":
        return <Hospital size={18} />;
      case "copy":
        return <Copy size={18} />;
      default:
        return iconKey;
    }
  };

  const POVERTY_125_BASE = 25550;
  const POVERTY_PER_EXTRA = 8225;
  const getThreshold = (size: number) =>
    POVERTY_125_BASE + Math.max(0, size - 2) * POVERTY_PER_EXTRA;

  const I864_URL = "https://www.rahvana.com/visa-forms/i864/wizard";
  const I864EZ_URL = "https://www.rahvana.com/visa-forms/i864ez/wizard";
  const I864A_URL = "https://www.rahvana.com/visa-forms/i864a/wizard";

  const SCENARIOS: Record<string, any> = {
    "pet-only": {
      label: "Petitioner only (qualifies alone)",
      sponsors: ["Petitioner"],
      householdMembers: [],
      jointSponsors: [],
      forms: "I-864EZ",
      taxYears: 3,
    },
    "pet-hm": {
      label: "Petitioner + Household Member",
      sponsors: ["Petitioner"],
      householdMembers: ["Household Member 1"],
      jointSponsors: [],
      forms: "I-864, I-864A",
      taxYears: 3,
    },
    "pet-js1": {
      label: "Petitioner + 1 Joint Sponsor",
      sponsors: ["Petitioner"],
      householdMembers: [],
      jointSponsors: ["Joint Sponsor 1"],
      forms: "I-864 (×2)",
      taxYears: 3,
    },
    "pet-js2": {
      label: "Petitioner + 2 Joint Sponsors",
      sponsors: ["Petitioner"],
      householdMembers: [],
      jointSponsors: ["Joint Sponsor 1", "Joint Sponsor 2"],
      forms: "I-864 (×3)",
      taxYears: 3,
    },
    "pet-hm-js": {
      label: "Petitioner + HM + Joint Sponsor",
      sponsors: ["Petitioner"],
      householdMembers: ["Household Member 1"],
      jointSponsors: ["Joint Sponsor 1"],
      forms: "I-864, I-864A, I-864",
      taxYears: 3,
    },
  };

  const getFinancialDocs = (scKey: string) => {
    const sc = SCENARIOS[scKey] || SCENARIOS["pet-only"];
    const docs: any = { required: [], conditional: [], recommended: [] };

    const taxNote = `${sc.taxYears} most recent years`;
    const allSponsors = [...sc.sponsors, ...sc.jointSponsors];

    allSponsors.forEach((sp) => {
      const isPet = sp === "Petitioner";
      const tagClass = isPet ? "tag-pet" : "tag-js";
      docs.required.push({
        id: `tax-${sp}`,
        icon: "receipt",
        title: `Federal Tax Return — ${sp}`,
        sub: `${taxNote} · Aligns with affidavit income statement`,
        tags: [
          { cls: tagClass, label: sp },
          { cls: "tag-tax", label: "3 Years" },
        ],
        guide: {
          intro: `The federal tax return (Form 1040) is the primary income evidence for ${sp}. It must align with the income figure reported in the affidavit of support.`,
          sections: [
            {
              title: "What is needed",
              body: `Most recent ${taxNote} of federal tax returns. Ensure the income figures are consistent with what was stated in the affidavit form.`,
            },
            {
              title: "Organization",
              body: `Group ${sp}'s tax documents together in one clearly labeled packet.`,
            },
          ],
        },
      });
      docs.required.push({
        id: `w2-${sp}`,
        icon: "file-text",
        title: `W-2 Forms — ${sp}`,
        sub: `${taxNote} · Wage and salary income documentation`,
        tags: [
          { cls: tagClass, label: sp },
          { cls: "tag-tax", label: "3 Years" },
        ],
        guide: {
          intro: `W-2 forms report annual wages and are issued by employers. They support the income figures shown on the tax return.`,
          sections: [
            {
              title: "What is needed",
              body: `W-2 forms for each year of tax evidence gathered. Group with the matching tax year materials.`,
            },
          ],
        },
      });
      docs.required.push({
        id: `transcript-${sp}`,
        icon: "landmark",
        title: `IRS Tax Transcripts — ${sp}`,
        sub: "Official IRS verification of filed tax information",
        tags: [
          { cls: tagClass, label: sp },
          { cls: "tag-tax", label: "3 Years" },
        ],
        guide: {
          intro: `IRS Tax Transcripts are official IRS-issued records confirming what was filed for a given tax year. They are a strong verification tool.`,
          sections: [
            {
              title: "How to obtain",
              body: "Request transcripts at IRS.gov (Get Transcript tool) or via mail using Form 4506-T. Processing time varies.",
            },
            {
              title: "Why it matters",
              body: "Transcripts confirm the authenticity of the tax filing and are particularly useful if the original return is unavailable.",
            },
          ],
        },
      });
      docs.conditional.push({
        id: `paystubs-${sp}`,
        icon: "banknote",
        title: `Pay Stubs — ${sp}`,
        sub: "Current income evidence — most recent 2–3 months",
        tags: [
          { cls: tagClass, label: sp },
          { cls: "tag-cur", label: "Current Income" },
        ],
        guide: {
          intro: `Recent pay stubs support current employment status and ongoing income. They are especially valuable when showing present income is important.`,
          sections: [
            {
              title: "What to include",
              body: "Most recent 2–3 months of pay stubs. Must show gross pay, employer name, and pay period.",
            },
          ],
        },
      });
      docs.conditional.push({
        id: `employment-${sp}`,
        icon: "building",
        title: `Employment Letter — ${sp}`,
        sub: "Confirms current employment and compensation",
        tags: [
          { cls: tagClass, label: sp },
          { cls: "tag-cur", label: "Current Income" },
        ],
        guide: {
          intro: `An employment verification letter supports consistent employment and current salary information.`,
          sections: [
            {
              title: "What it should include",
              body: "Employer letterhead, current position, start date, employment type (full-time/part-time), and current annual salary.",
            },
          ],
        },
      });

      docs.conditional.push({
        id: `assets-${sp}`,
        icon: "wallet",
        title: `Asset Evidence — ${sp}`,
        sub: "Bank statements, property, or investment documentation",
        tags: [
          { cls: tagClass, label: sp },
          { cls: "tag-cur", label: "Assets" },
        ],
        guide: {
          intro: `Asset documentation is relevant when assets are being used to supplement income. Assets must be available to the sponsor and convertible to cash within 12 months.`,
          sections: [
            {
              title: "What to include",
              body: "Recent bank statements, investment account statements, real estate ownership documents, or other liquid asset evidence.",
            },
          ],
        },
      });
    });

    sc.householdMembers.forEach((hm: string, i: number) => {
      docs.conditional.push({
        id: `hm-income-${i}`,
        icon: "user",
        title: `Proof of Household Member Income — ${hm}`,
        sub: "Income evidence for household member contributing to sponsorship",
        tags: [{ cls: "tag-hm", label: hm }],
        guide: {
          intro: `If a household member's income is being included in the sponsorship, that person's income evidence must match their I-864A filing.`,
          sections: [
            {
              title: "What is needed",
              body: "Tax returns, W-2s, and current pay stubs for the household member. Must be consistent with the I-864A form answers.",
            },
            {
              title: "Consistency",
              body: "Household member income evidence must align with what was stated in Form I-864A.",
            },
          ],
        },
      });
      docs.conditional.push({
        id: `hm-residence-${i}`,
        icon: "home",
        title: `Proof of Shared Residence — ${hm}`,
        sub: "Evidence of household connection between sponsor and household member",
        tags: [{ cls: "tag-hm", label: hm }],
        guide: {
          intro: `Household member sponsorship support may require evidence that the household member and the petitioner share the same household or have a qualifying relationship.`,
          sections: [
            {
              title: "What to include",
              body: "Lease agreement or property ownership document showing shared address, utility bills in both names, or other evidence of shared household.",
            },
          ],
        },
      });
    });

    allSponsors.forEach((sp) => {
      const isPet = sp === "Petitioner";
      docs.recommended.push({
        id: `packet-${sp}`,
        icon: "folder",
        title: `Organized Income Packet — ${sp}`,
        sub: "All documents grouped cleanly by sponsor for upload readiness",
        tags: [{ cls: isPet ? "tag-pet" : "tag-js", label: sp }],
        guide: {
          intro: `Each sponsor's financial documents should be grouped clearly and separately. This improves upload readiness and makes review cleaner.`,
          sections: [
            {
              title: "How to organize",
              body: `Group tax returns, W-2s, transcripts, pay stubs, and any asset evidence for ${sp} into a single clearly labeled folder or file set.`,
            },
          ],
        },
      });
    });

    docs.recommended.push({
      id: `prior-year-backup`,
      icon: "clipboard",
      title: "Backup Prior-Year Tax Evidence",
      sub: "Additional years of tax evidence for extra reassurance",
      tags: [{ cls: "tag-tax", label: "Tax Evidence" }],
      guide: {
        intro:
          "Having an extra year of tax evidence beyond the required amount can provide additional reassurance during processing.",
        sections: [
          {
            title: "Why it helps",
            body: "An extra year of consistent income history strengthens the overall financial picture and can smooth over any single year anomalies.",
          },
        ],
      },
    });
    docs.recommended.push({
      id: `upload-packet`,
      icon: "hard-drive",
      title: "Upload-Ready Financial Packet",
      sub: "Clean, compressed, properly named files ready for CEAC upload",
      tags: [{ cls: "tag-cur", label: "Upload Ready" }],
      guide: {
        intro:
          "Preparing an upload-ready financial packet reduces errors and delays during the CEAC document upload phase.",
        sections: [
          {
            title: "File preparation",
            body: "Ensure all files are clearly scanned, under 4 MB each, in PDF or JPG format, properly named, and organized by sponsor.",
          },
        ],
      },
    });

    return docs;
  };

  const getHhDocItems = (count: number, rels: Record<number, string>) => {
    const items: any[] = [];
    for (let i = 1; i <= count; i++) {
      const relationship = rels[i] || "spouse";
      const label = `Household Member ${i}`;

      switch (relationship) {
        case "spouse":
          items.push({
            id: `hh${i}-marriage`,
            icon: "marriage",
            title: `Marriage Certificate — ${label}`,
            sub: "Proves the spousal relationship to the petitioner",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "marriage-cert-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Confirms both spouses share the same household address",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID confirming the household member's identity",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "required",
          });
          break;

        case "child":
          items.push({
            id: `hh${i}-birth-hh`,
            icon: "birth",
            title: `Birth Certificate — ${label}`,
            sub: "Proves the parent–child relationship to the petitioner",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Confirms child lives in the same household",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "conditional",
          });
          break;

        case "parent":
          items.push({
            id: `hh${i}-birth-sponsor`,
            icon: "birth",
            title: `Birth Certificate of Petitioner`,
            sub: `Shows ${label} (parent) is listed — establishes the parent–child link`,
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-sponsor",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Confirms parent and petitioner share the same household",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "conditional",
          });
          break;

        case "sibling":
          items.push({
            id: `hh${i}-birth-sponsor`,
            icon: "birth",
            title: "Birth Certificate of Petitioner",
            sub: "Shows shared parentage with the sibling household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-sponsor",
            group: "required",
          });
          items.push({
            id: `hh${i}-birth-hh`,
            icon: "birth",
            title: `Birth Certificate — ${label}`,
            sub: "Combined with petitioner's birth cert to show shared parentage",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Confirms sibling and petitioner share the same household",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "conditional",
          });
          break;

        case "other-relative":
        case "other-hh":
        default:
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Demonstrates the shared-household basis for including their income",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "required",
          });
          items.push({
            id: `hh${i}-family-link`,
            icon: "link",
            title: `Supporting Family-Link Evidence — ${label}`,
            sub: "Civil records or affidavit establishing the household connection",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
            ],
            guideKey: "family-link",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "conditional",
          });
          break;
      }
    }
    return items;
  };

  const renderHouseholdBuilder = () => {
    const rawItems = getHhDocItems(hhCount, hhRelationships);
    // Deduplicate items based on title to avoid duplicate cards (e.g. Petitioner Birth Cert for multiple members)
    const allItems = rawItems.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.title === item.title),
    );
    const total = allItems.length;
    const reviewed = allItems.filter(
      (item) => hhDocsStatus[item.id] === "reviewed",
    ).length;
    const progressPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return (
      <div className="flex flex-col mt-4">
        <div className="flex gap-[7px] flex-wrap mb-7">
          <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
            CEAC Portal
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#fff7ed] text-[#b45309] border border-[#fed7aa]">
            Financial Sponsorship
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be]">
            Interactive Checklist
          </span>
        </div>

        {/* DISTINCTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
          <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-4.5">
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-1.5">
              Joint Sponsor
            </div>
            <div className="text-[15px] font-semibold text-[#0c1b33] mb-1.5 leading-tight">
              Added in CEAC, no proof checklist
            </div>
            <div className="text-[13px] text-[#3a4f63] leading-relaxed">
              A joint sponsor is an independent U.S. citizen or LPR who sponsors
              separately. Added through the CEAC sponsorship flow —{" "}
              <strong>no relationship-proof documents</strong> are typically
              required from them.
            </div>
          </div>
          <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-4.5">
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#15744f] mb-1.5">
              Household Member
            </div>
            <div className="text-[15px] font-semibold text-[#0e5c3c] mb-1.5 leading-tight">
              Added in CEAC + relationship proof required
            </div>
            <div className="text-[13px] text-[#3a4f63] leading-relaxed">
              A household member&apos;s income is used alongside the
              petitioner&apos;s. Added through CEAC — and also requires{" "}
              <strong>relationship-proof documentation</strong> showing their
              connection to the sponsoring household.
            </div>
          </div>
        </div>

        {/* PRIMARY LAUNCH MODULE */}
        <div className="bg-[#0e1e38] rounded-[16px] border border-white/7 shadow-[0_20px_60px_rgba(12,27,51,0.18)] overflow-hidden mb-6 relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary via-primary/70 to-transparent opacity-70" />
          <div className="p-8 md:p-[32px_34px_28px]">
            <div className="flex items-start gap-4 mb-[22px]">
              <div className="w-[46px] h-[46px] rounded-[11px] bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
                <Users className="text-white/75" size={22} />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/35 mb-1">
                  CEAC Guidance
                </div>
                <div className="text-[clamp(19px,2.8vw,23px)]  text-white/92 leading-tight">
                  Add sponsorship participants in CEAC
                </div>
              </div>
            </div>
            <div className="h-px bg-white/10 mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[9px] mb-[26px]">
              {[
                "Access the affidavit support section",
                "Add a household member or joint sponsor",
                "Review what information CEAC needs",
                "Return here to prepare relationship proof",
              ].map((cue, idx) => (
                <div
                  key={idx}
                  className="bg-white/6 border border-white/10 rounded-[10px] p-[11px_13px] flex items-start gap-[9px]"
                >
                  <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5px]" />
                  <div className="text-[13px] text-white/55 leading-tight">
                    {cue}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setTutorialIdx(0);
                setIsTutorialOpen(true);
              }}
              className="w-full py-4 px-7 bg-[#3b7dd8] text-white rounded-[12px] text-[15px] font-semibold cursor-pointer hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Start CEAC Guide
            </button>
          </div>
        </div>

        {/* SCENARIO BUILDER */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px] mb-[18px]">
          <div className="text-[14px] font-semibold text-[#0c1b33] mb-4">
            Define your scenario — who is involved in the sponsorship?
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-[#6b8097] uppercase tracking-wider mb-1.5 ml-0.5">
                Number of joint sponsors
              </label>
              <select
                value={jsCount}
                onChange={(e) => setJsCount(parseInt(e.target.value))}
                className="w-full p-[9px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] bg-white outline-none focus:border-primary appearance-none bg-[position:right_10px_center] bg-no-repeat pr-[30px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b8097' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="0">0 — not using a joint sponsor</option>
                <option value="1">1 joint sponsor</option>
                <option value="2">2 joint sponsors</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-[#6b8097] uppercase tracking-wider mb-1.5 ml-0.5">
                Number of household members
              </label>
              <select
                value={hhCount}
                onChange={(e) => setHhCount(parseInt(e.target.value))}
                className="w-full p-[9px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] bg-white outline-none focus:border-primary appearance-none bg-[position:right_10px_center] bg-no-repeat pr-[30px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b8097' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="0">0 — no household members</option>
                <option value="1">1 household member</option>
                <option value="2">2 household members</option>
                <option value="3">3 household members</option>
              </select>
            </div>
          </div>

          {hhCount > 0 && (
            <div className="mt-4 pt-4 border-t border-[#d0e4f7]">
              <div className="text-[11px] font-bold text-[#6b8097] uppercase tracking-widest mb-3 ml-0.5">
                Household member relationship to the petitioner
              </div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: hhCount }).map((_, idx) => {
                  const num = idx + 1;
                  return (
                    <div
                      key={num}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <span className="text-[13px] font-medium text-[#3a4f63] min-w-[140px]">
                        Household Member {num}
                      </span>
                      <select
                        value={hhRelationships[num] || "other-hh"}
                        onChange={(e) =>
                          setHhRelationships((prev) => ({
                            ...prev,
                            [num]: e.target.value,
                          }))
                        }
                        className="flex-1 p-[8px_10px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[13px] bg-white outline-none focus:border-primary appearance-none bg-[position:right_8px_center] bg-no-repeat pr-[26px]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b8097' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                        }}
                      >
                        <option value="spouse">Spouse of petitioner</option>
                        <option value="child">Child of petitioner</option>
                        <option value="parent">Parent of petitioner</option>
                        <option value="sibling">Sibling of petitioner</option>
                        <option value="other-relative">Other relative</option>
                        <option value="other-hh">Other household member</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY BANNER */}
        {(jsCount > 0 || hhCount > 0) && (
          <div className="bg-[#0c1b33] rounded-[16px] p-[16px_20px] mb-5 flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-0.5">
                Joint Sponsors
              </div>
              <div className="text-[14px] font-semibold text-white/90">
                {jsCount === 0
                  ? "None"
                  : `${jsCount} joint sponsor${jsCount > 1 ? "s" : ""}`}
              </div>
              {jsCount > 0 && (
                <div className="text-[11px] text-white/50 mt-0.5">
                  No relationship-proof checklist required
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-0.5">
                Household Members
              </div>
              <div className="text-[14px] font-semibold text-white/90">
                {hhCount === 0
                  ? "None"
                  : `${hhCount} household member${hhCount > 1 ? "s" : ""}`}
              </div>
              {hhCount > 0 && (
                <div className="text-[11px] text-white/50 mt-0.5">
                  Relationship-proof checklist generated below
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROGRESS AND CHECKLIST */}
        {hhCount > 0 ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-7">
              <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500 rounded-[10px]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap">
                {reviewed} of {total} reviewed
              </div>
            </div>

            {(() => {
              const req = allItems.filter((i) => i.group === "required");
              const cond = allItems.filter((i) => i.group === "conditional");

              return (
                <div className="flex flex-col gap-7">
                  {req.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-[10px]">
                        <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                          Required
                        </span>
                        <span className="text-[10px] font-semibold tracking-widest uppercase px-[9px] py-[3px] rounded-full bg-[#ffeaea] text-[#a01c1c] border border-[#f5bebe]">
                          Required
                        </span>
                        <div className="flex-1 h-px bg-[#d0e4f7]" />
                      </div>
                      {req.map((item) => renderHhDocCard(item))}
                    </div>
                  )}
                  {cond.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-[10px]">
                        <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                          Required if Applicable
                        </span>
                        <span className="text-[10px] font-semibold tracking-widest uppercase px-[9px] py-[3px] rounded-full bg-[#fef8e8] text-[#8a6200] border border-[#f0d98a]">
                          Required if Applicable
                        </span>
                        <div className="flex-1 h-px bg-[#d0e4f7]" />
                      </div>
                      {cond.map((item) => renderHhDocCard(item))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : jsCount > 0 ? (
          <div className="bg-white border-[1.5px] border-dashed border-[#d0e4f7] rounded-[16px] p-[32px_24px] text-center mb-5">
            <div className="text-[14px] font-semibold text-[#6b8097] mb-1.5">
              No relationship-proof checklist needed
            </div>
            <div className="text-[13px] text-[#6b8097]">
              Joint sponsors do not require relationship documentation. Your
              I-864 forms are the primary requirement — see Step 5 for those.
            </div>
          </div>
        ) : (
          <div className="bg-white border-[1.5px] border-dashed border-[#d0e4f7] rounded-[16px] p-[32px_24px] text-center mb-5">
            <div className="text-[14px] font-semibold text-[#6b8097] mb-1.5">
              Set your scenario above
            </div>
            <div className="text-[13px] text-[#6b8097]">
              Select the number of joint sponsors and household members to see
              the relevant checklist.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHhDocCard = (item: any) => {
    const st = hhDocsStatus[item.id] || "not-started";
    const stLabel =
      st === "reviewed"
        ? "✓ Reviewed"
        : st === "in-progress"
          ? "In progress"
          : "Open guide";

    return (
      <div
        key={item.id}
        className={`w-full group bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[17px_20px] flex items-center gap-[15px] text-left transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] ${
          st === "reviewed"
            ? "bg-[#e8f5ef] border-[#a8d9be]"
            : st === "in-progress"
              ? "bg-[#fef8e8] border-[#f0d98a]"
              : ""
        }`}
      >
        <div
          className={`w-[38px] h-[38px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0 text-[16px] transition-all group-hover:bg-primary/10 group-hover:border-primary/30 ${
            st === "reviewed" ? "bg-[#e8f5ef] border-[#a8d9be]" : ""
          }`}
        >
          {getIcon(item.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[#0c1b33] mb-0.5 leading-tight">
            {item.title}
          </div>
          <div className="text-[12px] text-[#6b8097] leading-tight">
            {item.sub}
          </div>
          <div className="flex gap-[5px] mt-[6px] flex-wrap">
            {item.tags.map((tag: any, idx: number) => {
              const tagMap: Record<string, string> = {
                "tag-hh": "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
                "tag-js": "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]",
                "tag-rel": "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]",
                "tag-res": "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]",
                "tag-id": "bg-[#eef3fa] text-[#3a4f63] border-[#d0e4f7]",
                "tag-gov": "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
              };
              return (
                <span
                  key={idx}
                  className={`text-[10px] font-semibold px-2 py-[2px] rounded-full tracking-wider border ${
                    tagMap[tag.cls] || "bg-[#f4f7fb] text-[#6b8097]"
                  }`}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const defId = mapDocumentNameToId(item.title);
              setActiveUploadId(item.id);
              setActiveUploadType("hh");
              openUploadModal(defId);
            }}
            className="rounded-full bg-white px-[11px] py-[5px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <Upload size={14} strokeWidth={2.5} />
            <span>Vault</span>
          </button>
          <button
            onClick={() => {
              // All household docs are inline guides - mark as in-progress and open modal
              if (hhDocsStatus[item.id] === "not-started") {
                const next = { ...hhDocsStatus, [item.id]: "in-progress" };
                setHhDocsStatus(next);
              }
              actions.updateMetadata({
                hhDocsStatus: {
                  ...hhDocsStatus,
                  [item.id]: "in-progress",
                },
              });
              setActiveHhDoc(item);
              setIsHhDocGuideOpen(true);
            }}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-all border ${
              st === "reviewed"
                ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                : st === "in-progress"
                  ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                  : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"
            }`}
          >
            {stLabel}
          </button>
        </div>
      </div>
    );
  };

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
  const localIdx = activeStepsInChapter.findIndex(
    (s: any) => (s.step_key || s.id) === sId,
  );

  const chapterProg = useMemo(
    () => getStageProgress(data, state.currentStage, state),
    [data, state.currentStage, state],
  );

  const prevStep = globalIdx > 0 ? allActiveSteps[globalIdx - 1] : null;
  const nextStep =
    globalIdx < allActiveSteps.length - 1
      ? allActiveSteps[globalIdx + 1]
      : null;

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
        if (!isCompleted) actions.toggleComplete("step_1_6");
      }
      if (data.portalType === "NVC" && sId === "step_2_1") {
        if (!isCompleted) actions.toggleComplete("step_2_1");
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

  const handleToggleComplete = () => {
    actions.toggleComplete(currentStep.step_key || sId);
  };

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
          if (!isCompleted) handleToggleComplete();
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

  const renderAwaitingReviewStep = () => {
    const data = AWAITING_REVIEW_DATA;

    return (
      <div className="flex flex-col items-center w-full min-h-screen">
        <style jsx global>{`
          @keyframes pulse-custom {
            0%,
            100% {
              opacity: 0.4;
              transform: scale(0.9);
            }
            50% {
              opacity: 1;
              transform: scale(1.15);
            }
          }
          .animate-pulse-custom {
            animation: pulse-custom 2.2s ease-in-out infinite;
          }
          .animate-pulse-delayed {
            animation: pulse-custom 2.2s ease-in-out infinite;
            animation-delay: 0.2s;
          }
        `}</style>

        {/* Page Shell */}
        <div className="w-full max-w-[720px] px-[24px] pt-[52px] pb-[96px] flex flex-col mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-[8px] mb-[6px] animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097]">
              {data.eyebrow.chapter}
            </span>
            <span className="text-[11px] text-[#b8d4f0]">›</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f6fd4]">
              {data.eyebrow.step}
            </span>
          </div>

          <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0c1b33] leading-[1.2] mb-[10px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[40ms]">
            {data.title}
          </h1>

          <p className="text-[#3a4f63] text-[15px] leading-[1.7] mb-[22px] max-w-[500px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[80ms]">
            {data.description}
          </p>

          <div className="flex flex-wrap gap-[7px] mb-[32px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[120ms]">
            {data.chips.map((chip, i) => (
              <span
                key={i}
                className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border whitespace-nowrap ${
                  chip.type === "nvc"
                    ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                    : chip.type === "status"
                      ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                      : "bg-[#e8f6f6] text-[#0d6b6b] border-[#9fd6d6]"
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>

          {/* Status Card (Navy) */}
          <div className="relative bg-[#0c1b33] rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] animate-in fade-in slide-in-from-top-2 duration-300 delay-[160ms]">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-80" />

            <div className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/40 mb-[8px]">
              {data.statusCard.label}
            </div>

            <h2 className="text-[20px]  text-white/92 leading-tight mb-[16px] flex items-center gap-[8px]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#6aa8f0] animate-pulse-custom shrink-0" />
              {data.statusCard.heading}
            </h2>

            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 gap-[12px]">
              {data.statusCard.grid.map((item, i) => (
                <div key={i} className="flex flex-col gap-[3px]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                    {item.label}
                  </div>
                  <div className="text-[13px] font-semibold text-white/88">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Card: What NVC is reviewing */}
          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in slide-in-from-top-2 duration-300 delay-[200ms]">
            <div className="flex items-center gap-[10px] mb-[14px]">
              <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                <Search
                  size={17}
                  className="text-[#2f6fd4]"
                  strokeWidth={1.7}
                />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                {data.reviewItems.title}
              </h3>
            </div>
            <div className="flex flex-col gap-[7px]">
              {data.reviewItems.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                >
                  <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Section */}
          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-[14px] mb-[14px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[240ms]">
            {/* While You Wait */}
            <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
              <div className="flex items-center gap-[10px] mb-[14px]">
                <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                  <Clock
                    size={17}
                    className="text-[#15744f]"
                    strokeWidth={1.7}
                  />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                  {data.whileYouWait.title}
                </h3>
              </div>
              <div className="flex flex-col gap-[7px]">
                {data.whileYouWait.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                  >
                    <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
              <div className="flex items-center gap-[10px] mb-[14px]">
                <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                  <Scale
                    size={17}
                    className="text-[#2f6fd4]"
                    strokeWidth={1.7}
                  />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                  {data.timeline.title}
                </h3>
              </div>
              <div className="flex flex-col gap-0 relative pl-[18px]">
                {/* Vertical Line */}
                <div className="absolute left-[6px] top-[10px] bottom-[10px] w-[2px] bg-[#d0e4f7] rounded-[2px]" />

                <div className="flex flex-col gap-[10px]">
                  {data.timeline.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-[8px]">
                      {step.status === "completed" ? (
                        <div className="w-[12px] h-[12px] rounded-full bg-[#15744f] shrink-0 z-10 ml-[-6px]" />
                      ) : step.status === "current" ? (
                        <div className="w-[12px] h-[12px] rounded-full border-2 border-[#2f6fd4] bg-white shrink-0 z-10 ml-[-6px] animate-pulse-custom" />
                      ) : (
                        <div className="w-[12px] h-[12px] rounded-full bg-[#d0e4f7] shrink-0 z-10 ml-[-6px]" />
                      )}
                      <span
                        className={`text-[12px] ${
                          step.status === "completed"
                            ? "text-[#0e5c3c] font-semibold"
                            : step.status === "current"
                              ? "text-[#2f6fd4] font-semibold"
                              : "text-[#6b8097]"
                        }`}
                      >
                        {step.label}
                        {step.status === "current" ? " ← you are here" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alert Card: Corrections */}
          <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-[18px_20px] mb-[16px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[280ms]">
            <div className="flex items-center gap-[9px] mb-[10px]">
              <span className="text-[18px]">📋</span>
              <h3 className="text-[14px] font-semibold text-[#8a6200]">
                {data.correctionsAlert.title}
              </h3>
            </div>
            <div className="flex flex-col gap-[7px]">
              {data.correctionsAlert.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-[8px] text-[13px] text-[#8a6200] leading-[1.5]"
                >
                  <div className="w-[4px] h-[4px] rounded-full bg-[#8a6200] mt-[5px] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[320ms]">
            {data.disclaimer}
          </p>
        </div>
      </div>
    );
  };

  const renderToolStep = () => {
    const tool = currentStep.tool_data as any;
    if (!tool) return null;

    if (tool.type === "awaiting_review") {
      return renderAwaitingReviewStep();
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
          {/* Eyebrow / Breadcrumb Row */}
          {/* <div className="flex items-center gap-[8px]">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#636b97]">
              Chapter {currentChapter?.chapter_number || state.currentStage + 1}{" "}
              · {currentChapter?.chapter_name || currentChapter?.name}
            </span>
            <span className="text-[11px] text-[#b8d4f0]">›</span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                isBeneficiaryTheme ? "text-primary" : "text-primary"
              }`}
            >
              {currentStep.step_name}
            </span>
          </div> */}

          {/* Title + Description */}
          <h1 className="text-[clamp(28px,4.5vw,38px)] font-black text-[#0c1b33] leading-normal tracking-[-0.01em] mb-[6px]">
            {currentStep.step_name}
          </h1>

          {currentStep.step_description && (
            <p className="text-[#3a4f63] text-[15px] leading-[1.7] mb-[10px] max-w-[480px]">
              {currentStep.step_description}
            </p>
          )}

          {/* Companion Context Badge (Step 5 Specific) */}
          {(sId === "step_1_5" || sId === "step_1_2_b") && (
            <div className="flex items-center gap-[9px] mb-[22px]">
              <div className="flex-1 h-px bg-linear-to-r from-[#d0e4f7] to-transparent" />
              <div className="inline-flex items-center gap-[6px] bg-[#e6f6f6] border border-[#9fd8d8] rounded-full px-[13px] py-[5px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#0f7373]" />
                <span className="text-[11px] font-semibold text-[#0f7373] tracking-[0.04em] whitespace-nowrap">
                  Companion form to I-130 · Beneficiary spouse focus
                </span>
              </div>
              <div className="flex-1 h-px bg-linear-to-l from-[#d0e4f7] to-transparent" />
            </div>
          )}

          {/* Meta Chips */}
          {tool.chips && (
            <div className="flex flex-wrap gap-[7px] mb-[32px]">
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
              <div className="text-[14px] shrink-0"></div>
              <div className="text-[13px] text-[#8a6200] leading-normal">
                {tool.alert_note}
              </div>
            </div>
          )}

          {/* Return Note (Success Banner — shown after portal launch) */}
          {isLaunched && (
            <div className="mb-[20px] bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-[14px_18px] flex items-start gap-[12px] animate-in slide-in-from-top-2 duration-300 fill-mode-both">
              <div className="text-[15px] mt-[1px] text-[#15744f] shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#15744f] mb-[2px]">
                  {tool.launch_module.return_note?.title ||
                    (sId === "step_1_6"
                      ? "USCIS account page opened in a new tab"
                      : "Tool launched in a new tab")}
                </div>
                <div className="text-[12px] text-[#3a4f63] leading-normal">
                  {tool.launch_module?.return_note?.body ||
                    (sId === "step_1_6"
                      ? "Complete the sign-up there, then return here to save your credentials."
                      : "Complete the form at your own pace. Return here when you're done to continue the roadmap.")}
                </div>
              </div>
            </div>
          )}

          {/* SPONSORSHIP CALCULATOR LAUNCH MODULE (Step 5 Specific) */}
          {tool.type === "sponsorship_calculator" && (
            <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[28px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary to-primary/70 opacity-70" />
              <div className="p-[32px_34px_28px]">
                <div className="flex items-start gap-[16px] mb-[22px]">
                  <div className="w-[46px] h-[46px] rounded-[11px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Calculator
                      size={22}
                      className="text-white/75"
                      strokeWidth={1.6}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-[4px]">
                      {tool.launch_module.label ||
                        "Affidavit Support Calculator"}
                    </div>
                    <div className="text-[clamp(19px,2.8vw,23px)]  text-white/90 leading-[1.25]">
                      {tool.launch_module.title ||
                        "Determine your sponsorship setup first"}
                    </div>
                  </div>
                </div>
                <div className="h-px bg-white/9 mb-[20px]" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[9px] mb-[26px]">
                  {tool.launch_module.features.map(
                    (feat: string, i: number) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-[10px] padding-11 px-[13px] py-[11px] flex items-start gap-[9px]"
                      >
                        <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5px]" />
                        <div className="text-[13px] text-white/55 leading-[1.4]">
                          {feat}
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <button
                  onClick={() => {
                    setSponsorshipStepIdx(0);
                    setIsSponsorshipCalcOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-[10px] w-full p-[16px_28px] bg-[#3b7dd8] text-white border-none rounded-[12px] font-sans text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#3b7dd8] hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_20px_rgba(47,111,212,0.35)]"
                >
                  {tool.launch_module.buttonText ||
                    "Start Sponsorship Calculator"}
                </button>
              </div>
            </div>
          )}

          {/* SPONSORSHIP RESULTS SECTION (Step 5 Specific) */}
          {tool.type === "sponsorship_calculator" && (
            <div className="mb-[28px] w-full">
              <div className="text-[12px] font-semibold tracking-wide uppercase text-[#6b8097] mb-[12px]">
                Your Affidavit of Support Plan
              </div>
              {!sponsorshipResult ? (
                <div className="bg-[#fafcff] border-[1.5px] border-dashed border-[#d0e4f7] rounded-[10px] p-[24px] text-center">
                  <div className="text-[14px] text-[#6b8097] leading-[1.6]">
                    Complete the sponsorship calculator to generate the correct
                    affidavit forms for your case.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-[28px]">
                  <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[20px] animate-in fade-in duration-300">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-[10px]">
                      Sponsorship Plan Generated
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      {[
                        [
                          "Petitioner qualifies alone",
                          sponsorshipResult.qualifies ? "Yes" : "No",
                        ],
                        [
                          "Household members contributing income",
                          sponsorshipResult.householdMemberCount || "None",
                        ],
                        [
                          "Joint sponsors",
                          sponsorshipResult.jointSponsorCount || "None",
                        ],
                        [
                          "Forms required",
                          sponsorshipResult.forms
                            .map((f: any) => f.name.split("—")[0].trim())
                            .join(", "),
                        ],
                      ].map(([k, v], i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center py-[5px] border-b border-[#d0e4f7] last:border-b-0 text-[13px]"
                        >
                          <span className="text-[#3a4f63]">{k}</span>
                          <span className="text-[#0c1b33] font-semibold">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-[10px]">
                    {sponsorshipResult.forms.map((f: any, i: number) => (
                      <div
                        key={i}
                        onClick={() =>
                          window.open(f.url, "_blank", "noopener,noreferrer")
                        }
                        className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[18px_20px] flex items-center gap-[14px] cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_16px_rgba(47,111,212,0.1)] hover:-translate-y-px"
                      >
                        <div className="w-[36px] h-[36px] rounded-[9px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <FileText
                            size={18}
                            className="text-primary"
                            strokeWidth={1.7}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-semibold text-[#0c1b33] mb-[2px]">
                            {f.name}
                          </div>
                          <div className="text-[12px] text-[#6b8097] leading-[1.4]">
                            {f.sub}
                          </div>
                        </div>
                        <button className="p-[8px_16px] bg-primary text-white border-none rounded-[8px] text-[12px] font-semibold shrink-0 transition-colors hover:bg-primary/80">
                          Launch →
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-[12px] text-[#6b8097] text-center">
                    Form actions are based on your calculator result.{" "}
                    <button
                      onClick={() => {
                        setSponsorshipStepIdx(0);
                        setIsSponsorshipCalcOpen(true);
                      }}
                      className="text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Rerun calculator
                    </button>{" "}
                    if the sponsorship structure changes.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FINANCIAL CHECKLIST (Step 2.6 SPECIFIC) */}
          {tool.type === "financial_checklist" && (
            <div className="flex flex-col mt-3">
              {/* Scenario switcher (simulates prior-step output) */}
              <div className="flex items-center gap-[12px] bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[14px_18px] mb-[20px] flex-wrap">
                <span className="text-[12px] font-semibold text-[#6b8097] whitespace-nowrap">
                  Sponsorship structure:
                </span>
                <select
                  className="flex-1 min-w-[180px] p-[8px_12px] border-[1.5px] border-[#d0e4f7] rounded-[8px] font-sans text-[13px] text-[#1c2b3a] bg-[#f4f7fb] outline-none cursor-pointer focus:border-primary"
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                >
                  {Object.entries(SCENARIOS).map(([key, sc]) => (
                    <option key={key} value={key}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sponsorship Summary Card */}
              {(() => {
                const sc = SCENARIOS[selectedScenario] || SCENARIOS["pet-only"];
                return (
                  <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[18px_20px] mb-[20px]">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#2f6fd4] mb-[10px]">
                      Sponsorship Summary
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
                      {[
                        ["Sponsorship setup", sc.label],
                        ["Affidavit forms", sc.forms],
                        ["Joint sponsors", sc.jointSponsors.length || "None"],
                        [
                          "Household members",
                          sc.householdMembers.length || "None",
                        ],
                        ["Tax evidence needed", "3 most recent years"],
                      ].map(([k, v], i) => (
                        <div
                          key={i}
                          className="bg-white border border-[#d0e4f7] rounded-[10px] p-[10px_12px]"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#6b8097] mb-[3px]">
                            {k}
                          </div>
                          <div className="text-[13px] font-semibold text-[#0c1b33]">
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Progress Bar */}
              {(() => {
                const docs = getFinancialDocs(selectedScenario);
                const allItems = [
                  ...docs.required,
                  ...docs.conditional,
                  ...docs.recommended,
                ];
                const reviewedCount = allItems.filter(
                  (d) => financialDocsStatus[d.id] === "reviewed",
                ).length;
                const totalCount = allItems.length;
                const pct =
                  totalCount > 0
                    ? Math.round((reviewedCount / totalCount) * 100)
                    : 0;

                return (
                  <div className="flex flex-col mb-[24px]">
                    <div className="flex items-center gap-[12px] mb-[8px]">
                      <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                        {reviewedCount} of {totalCount} reviewed
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Document Groups */}
              <div className="flex flex-col gap-[36px]">
                {(() => {
                  const docs = getFinancialDocs(selectedScenario);
                  const groups = [
                    {
                      id: "required",
                      label: "Required",
                      badge: "badge-req",
                      items: docs.required,
                    },
                    {
                      id: "conditional",
                      label: "Required if Applicable",
                      badge: "badge-cond",
                      items: docs.conditional,
                    },
                    {
                      id: "recommended",
                      label: "Recommended to Strengthen Readiness",
                      badge: "badge-rec",
                      items: docs.recommended,
                    },
                  ];

                  return groups.map((group) => {
                    if (group.items.length === 0) return null;
                    return (
                      <div key={group.id} className="flex flex-col">
                        <div className="flex items-center gap-[10px] mb-[14px]">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6b8097]">
                            {group.label}
                          </span>
                          <div className="flex-1 h-px bg-[#d0e4f7]" />
                        </div>

                        <div className="flex flex-col gap-[10px]">
                          {group.items.map((doc: any) => {
                            const st =
                              financialDocsStatus[doc.id] || "not-started";
                            return (
                              <div
                                key={doc.id}
                                className={`bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[18px_20px] flex items-center gap-[16px] text-left transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.08)] ${
                                  st === "reviewed"
                                    ? "bg-[#e8f5ef] border-[#a8d9be]"
                                    : st === "in-progress"
                                      ? "bg-[#fef8e8] border-[#f0d98a]"
                                      : ""
                                }`}
                              >
                                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#eef3fa] border border-[#d0e4f7] flex items-center justify-center shrink-0 text-[18px]">
                                  {getIcon(doc.icon)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[15px] font-semibold text-[#0c1b33] mb-[4px]">
                                    {doc.title}
                                  </div>
                                  <div className="text-[13px] text-[#3a4f63] leading-[1.4]">
                                    {doc.sub}
                                  </div>
                                  <div className="flex gap-[6px] mt-[7px] flex-wrap">
                                    {doc.tags.map((tag: any, idx: number) => (
                                      <span
                                        key={idx}
                                        className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full tracking-[0.04em] ${
                                          tag.cls === "tag-pet"
                                            ? "bg-[#e8f1fb] text-[#2d4a6e]"
                                            : tag.cls === "tag-js"
                                              ? "bg-[#f3f0fb] text-[#4a2d8a]"
                                              : tag.cls === "tag-hm"
                                                ? "bg-[#e8f5ef] text-[#15744f]"
                                                : tag.cls === "tag-tax"
                                                  ? "bg-[#fff7ed] text-[#b45309]"
                                                  : tag.cls === "tag-cur"
                                                    ? "bg-[#eef3fa] text-[#3a4f63]"
                                                    : "bg-[#f4f7fb] text-[#6b8097]"
                                        }`}
                                      >
                                        {tag.label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const defId = mapDocumentNameToId(
                                        doc.title,
                                      );
                                      setActiveUploadId(doc.id);
                                      setActiveUploadType("financial");
                                      openUploadModal(defId);
                                    }}
                                    className="rounded-full bg-white px-[11px] py-[5px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                  >
                                    <Upload size={14} strokeWidth={2.5} />
                                    <span>Vault</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Mark as in-progress when opened (unless already reviewed)
                                      if (
                                        financialDocsStatus[doc.id] !==
                                        "reviewed"
                                      ) {
                                        actions.updateMetadata({
                                          financialDocsStatus: {
                                            ...financialDocsStatus,
                                            [doc.id]: "in-progress",
                                          },
                                        });
                                      }
                                      setActiveFinancialDoc(doc);
                                      setIsFinancialDocGuideOpen(true);
                                    }}
                                    className={`text-[12px] font-medium px-[11px] py-[5px] rounded-full shrink-0 border whitespace-nowrap ${
                                      st === "reviewed"
                                        ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                                        : st === "in-progress"
                                          ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                                          : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"
                                    }`}
                                  >
                                    {st === "reviewed"
                                      ? "✓ Reviewed"
                                      : st === "in-progress"
                                        ? "In progress"
                                        : "Open guide"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          {tool.type === "submission_review" && (
            <div className="flex flex-col mt-4">
              {/* Launcher Card (Large) */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[24px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary via-primary/70 to-transparent opacity-70" />
                <div className="p-[30px_32px_26px]">
                  <div className="flex items-start gap-[16px] mb-[20px]">
                    <div className="w-[44px] h-[44px] rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <ExternalLink size={21} className="text-white/75" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-[4px]">
                        {tool.launch_module.label}
                      </div>
                      <div className="text-[clamp(18px,2.6vw,22px)]  text-white/92 leading-[1.25]">
                        {tool.launch_module.title}
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-white/9 mb-[18px]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px] mb-[22px]">
                    {tool.launch_module.features.map(
                      (feat: string, i: number) => (
                        <div
                          key={i}
                          className="bg-white/5 border border-white/10 rounded-[10px] p-[10px_12px] flex items-start gap-[8px]"
                        >
                          <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5px]" />
                          <div className="text-[13px] text-white/55 leading-[1.4]">
                            {feat}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSubmissionGuideIdx(0);
                      setIsSubmissionGuideOpen(true);
                    }}
                    className="w-full p-[15px_24px] bg-[#3b7dd8] text-white border-none rounded-[11px] text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#3b7dd8] hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(47,111,212,0.35)] flex items-center justify-center gap-[9px]"
                  >
                    <span>{tool.launch_module.buttonText}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Checklist and Pitfalls Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[18px]">
                {/* Final Review Checklist */}
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px]">
                  <div className="text-[13px] font-bold tracking-wide uppercase text-[#6b8097] mb-[14px] flex items-center gap-[8px]">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#15744f]" />
                    Final Review Checklist
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    {[
                      "All required files uploaded to CEAC",
                      "Correct person selected for each document",
                      "Correct document type assigned to each file",
                      "Certified English translations paired with originals",
                      "No cropped, blurry, or unreadable scans",
                      "Comments added only where genuinely needed",
                    ].map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handleToggleSubmissionCheck(i)}
                        className={`flex items-start gap-[10px] p-[9px_12px] rounded-[10px] cursor-pointer transition-all border-[1.5px] ${
                          submissionChecklistStatus[i]
                            ? "bg-[#e8f5ef] border-[#a8d9be]"
                            : "border-transparent hover:bg-[#eef3fa]"
                        }`}
                      >
                        <div
                          className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 mt-[1px] ${
                            submissionChecklistStatus[i]
                              ? "bg-[#15744f] border-[#15744f]"
                              : "bg-white border-[#d0e4f7]"
                          }`}
                        >
                          {submissionChecklistStatus[i] && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                        <span
                          className={`text-[13px] leading-[1.45] ${
                            submissionChecklistStatus[i]
                              ? "text-[#0e5c3c]"
                              : "text-[#3a4f63]"
                          }`}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Pitfalls to Avoid */}
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px]">
                  <div className="text-[13px] font-bold tracking-wide uppercase text-[#6b8097] mb-[14px] flex items-center gap-[8px]">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#b91c1c]" />
                    Common Pitfalls to Avoid
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    {[
                      "Wrong person selected — file under beneficiary vs petitioner",
                      "Wrong document category — civil doc filed as financial",
                      "Missing translation — uploaded original without translation",
                      "Incomplete scan — page cut off or text obscured",
                      "Missing financial/civil pairings — both required",
                      "Unnecessary comments — clutter without purpose",
                    ].map((pitfall, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-[10px] p-[9px_12px] rounded-[10px] border-[1.5px] border-[#fecaca] bg-[#fef2f2]"
                      >
                        <span className="text-[14px] shrink-0 mt-[1px]">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </span>
                        <span className="text-[13px] leading-[1.45] text-[#3a4f63]">
                          {pitfall}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AWAITING NVC REVIEW (Step 2.9 SPECIFIC) */}
          {tool.type === "awaiting_review" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
              {/* Eyebrow and Title */}
              <div className="flex items-center gap-[8px] mb-[6px]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097]">
                  Chapter 2 · NVC / CEAC Processing
                </span>
                <span className="text-[11px] text-[#b8d4f0]">›</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f6fd4]">
                  Step 10 — Awaiting NVC Document Review
                </span>
              </div>
              <h1 className="text-[clamp(26px,4vw,34px)]  text-[#0c1b33] leading-[1.2] mb-[10px]">
                Awaiting NVC Document Review
              </h1>
              <p className="text-[15px] text-[#3a4f63] leading-[1.7] max-w-[500px] mb-[22px]">
                Your documents have been submitted. NVC is now reviewing your
                package for completeness and consistency before issuing a
                documentary qualification decision.
              </p>

              {/* Meta Chips */}
              <div className="flex gap-[7px] flex-wrap mb-[32px]">
                <span className="text-[11px] font-semibold tracking-[0.06em] uppercase px-[12px] py-[5px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
                  NVC Review
                </span>
                <span className="text-[11px] font-semibold tracking-[0.06em] uppercase px-[12px] py-[5px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">
                  Status
                </span>
                <span className="text-[11px] font-semibold tracking-[0.06em] uppercase px-[12px] py-[5px] rounded-full bg-[#e8f6f6] text-[#0d6b6b] border border-[#9fd6d6]">
                  Waiting Period
                </span>
              </div>

              {/* Status card */}
              <div className="relative bg-[#0c1b33] rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-80" />
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[8px]">
                  Current Case Status
                </div>
                <div className="text-[20px]  text-white/92 mb-[16px] flex items-center gap-[10px]">
                  <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#6aa8f0] animate-pulse shadow-[0_0_8px_rgba(106,168,240,0.6)]" />
                  Documents under NVC review
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-[12px]">
                  <div className="flex flex-col gap-[3px]">
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-white/38">
                      Documents submitted
                    </div>
                    <div className="text-[13px] font-semibold text-white/88">
                      ✓ Confirmed
                    </div>
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-white/38">
                      Current stage
                    </div>
                    <div className="text-[13px] font-semibold text-white/88">
                      NVC document review
                    </div>
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-white/38">
                      Next event
                    </div>
                    <div className="text-[13px] font-semibold text-white/88">
                      DQ notification
                    </div>
                  </div>
                </div>
              </div>

              {/* What NVC is reviewing */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                <div className="flex items-center gap-[10px] mb-[14px]">
                  <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                    <Search
                      size={17}
                      className="text-[#2f6fd4]"
                      strokeWidth={1.7}
                    />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                    What NVC is reviewing
                  </h3>
                </div>
                <div className="flex flex-col gap-[7px]">
                  {[
                    "DS-260 — immigrant visa application accuracy and completeness",
                    "Civil documents — passport, birth certificate, marriage records, police certificate",
                    "Financial forms — Affidavit of Support and supporting evidence",
                    "Translation pairing and document legibility across all files",
                    "Overall package consistency with DS-260 answers and other filings",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                    >
                      <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] shrink-0 mt-[6px]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
                {/* While you wait */}
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="flex items-center gap-[10px] mb-[14px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                      <Clock
                        size={17}
                        className="text-[#15744f]"
                        strokeWidth={1.7}
                      />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                      While you wait
                    </h3>
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    {[
                      "Monitor the email address registered with CEAC",
                      "Check CEAC messages periodically for any NVC correspondence",
                      "Keep organized copies of everything you uploaded",
                      "Avoid re-uploading documents unless NVC specifically requests it",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                      >
                        <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] shrink-0 mt-[6px]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="flex items-center gap-[10px] mb-[14px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                      <Scale
                        size={17}
                        className="text-[#2f6fd4]"
                        strokeWidth={1.7}
                      />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                      Where you are in the process
                    </h3>
                  </div>
                  <div className="relative pl-[18px]">
                    <div className="absolute left-[6px] top-[10px] bottom-[10px] w-[2px] bg-[#d0e4f7] rounded-[2px]" />
                    <div className="flex flex-col gap-[10px] relative">
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[12px] h-[12px] rounded-full bg-[#15744f] shrink-0 z-1 -ml-[18px]" />
                        <span className="text-[12px] text-[#0e5c3c] font-semibold">
                          Documents uploaded to CEAC
                        </span>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[12px] h-[12px] rounded-full bg-[#15744f] shrink-0 z-1 -ml-[18px]" />
                        <span className="text-[12px] text-[#0e5c3c] font-semibold">
                          Submitted to NVC
                        </span>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[12px] h-[12px] rounded-full border-2 border-[#2f6fd4] bg-white shrink-0 z-1 -ml-[18px] animate-pulse" />
                        <span className="text-[12px] text-[#2f6fd4] font-semibold">
                          NVC document review ← you are here
                        </span>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[12px] h-[12px] rounded-full bg-[#d0e4f7] shrink-0 z-1 -ml-[18px]" />
                        <span className="text-[12px] text-[#6b8097]">
                          Documentary Qualification (DQ)
                        </span>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[12px] h-[12px] rounded-full bg-[#d0e4f7] shrink-0 z-1 -ml-[18px]" />
                        <span className="text-[12px] text-[#6b8097]">
                          Interview scheduling
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* If corrections requested */}
              <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-[18px_20px] mb-[16px]">
                <div className="flex items-center gap-[9px] mb-[10px]">
                  <span className="text-[18px]">📋</span>
                  <h3 className="text-[14px] font-semibold text-[#8a6200]">
                    If NVC requests corrections or additional documents
                  </h3>
                </div>
                <div className="flex flex-col gap-[7px]">
                  {[
                    "Read the checklist notice carefully — NVC will specify exactly what is missing or incorrect",
                    "Replace only the specific document(s) flagged — do not re-upload your entire package",
                    "Upload the corrected file under the same person and document type slot",
                    "Resubmit promptly — delay in responding extends the overall timeline",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-[8px] text-[13px] text-[#8a6200] leading-[1.5]"
                    >
                      <div className="w-[4px] h-[4px] rounded-full bg-[#8a6200] shrink-0 mt-[6px]" />
                      <span className="text-[#634b11]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11.5px] color-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
                Rahvana provides structured guidance only. NVC review timelines
                vary. Monitor your registered email and CEAC messages directly.
              </p>
            </div>
          )}

          {/* DQ RECORDING (Step 2.10 SPECIFIC) */}
          {tool.type === "dq_recording" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
              {/* Eyebrow and Title */}
              {/* <div className="flex items-center gap-[8px] mb-[6px]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097]">
                  Chapter 2 · NVC / CEAC Processing
                </span>
                <span className="text-[11px] text-[#b8d4f0]">›</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f6fd4]">
                  Step 11 — Documentary Qualification
                </span>
              </div>
              <h1
                className="text-[clamp(26px,4vw,34px)]  text-[#0c1b33] leading-[1.2] mb-[10px]"
                
              >
                Record Documentary Qualification
              </h1>
              <p className="text-[15px] text-[#3a4f63] leading-[1.7] max-w-[500px] mb-[22px]">
                Your case has been documentarily qualified — NVC has accepted
                your package. Record your DQ date to activate scheduling
                tracking and sync your dashboard.
              </p> */}

              {/* Meta Chips */}
              <div className="flex gap-[7px] flex-wrap mb-[32px]">
                <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#fffbec] text-[#b38600] border border-[#e8d47a]">
                  Major Milestone
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">
                  Tracking Active
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
                  Dashboard Update
                </span>
              </div>

              {/* Milestone Banner */}
              <div className="relative bg-gradient-to-br from-[#0c1b33] to-[#1a3054] rounded-[16px] p-[22px_26px] mb-[18px] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-90" />
                {/* <div className="absolute right-[22px] top-[50%] -translate-y-[50%] text-[32px] opacity-18 select-none pointer-events-none">
                  🎉
                </div> */}
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[5px]">
                  NVC — Documentary Qualification Received
                </div>
                <div className="text-[22px]  text-white/92 mb-[6px]">
                  Your documents have been accepted by NVC
                </div>
                <div className="text-[13px] text-white/55 leading-[1.55]">
                  This is a significant milestone. Your case is now
                  documentarily complete and eligible for interview scheduling
                  at your designated post.
                </div>
              </div>

              {/* DQ input card */}
              {!dqSaved ? (
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="flex items-center gap-[10px] mb-[18px]">
                    <div className="w-[38px] h-[38px] rounded-[9px] bg-[#fffbec] border border-[#e8d47a] flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-[#b38600]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#0c1b33]">
                        Record your DQ details
                      </div>
                      <div className="text-[12px] text-[#6b8097] mt-[2px]">
                        This activates scheduling tracking for your case
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[16px]">
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                        DQ Date
                      </label>
                      <input
                        type="date"
                        value={dqDate}
                        onChange={(e) => setDqDate(e.target.value)}
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                        Visa Category
                      </label>
                      <select
                        value={dqCategory}
                        onChange={(e) => setDqCategory(e.target.value)}
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                      >
                        <option value="">Select category…</option>
                        <option value="IR-1">
                          IR-1 (Spouse of U.S. Citizen)
                        </option>
                        <option value="IR-2">
                          IR-2 (Child of U.S. Citizen)
                        </option>
                        <option value="F2A">F2A (Spouse of LPR)</option>
                        <option value="CR-1">CR-1 (Conditional Spouse)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                        Embassy / Consulate (Post)
                      </label>
                      <select
                        value={dqPost}
                        onChange={(e) => setDqPost(e.target.value)}
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                      >
                        <option value="">Select post…</option>
                        <option value="Islamabad">
                          U.S. Embassy Islamabad, Pakistan
                        </option>
                        <option value="Karachi">
                          U.S. Consulate Karachi, Pakistan
                        </option>
                        <option value="Lahore">
                          U.S. Consulate Lahore, Pakistan
                        </option>
                        <option value="Other">Other post</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                        Country of Interview
                      </label>
                      <input
                        type="text"
                        value={dqCountry}
                        onChange={(e) => setDqCountry(e.target.value)}
                        placeholder="e.g. Pakistan"
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!dqDate || !dqCategory || !dqPost) {
                        toast.error("Please fill in all DQ details");
                        return;
                      }
                      setDqSaved(true);
                      actions.updateMetadata({
                        dqSaved: true,
                        dqDate,
                        dqCategory,
                        dqPost,
                        dqCountry,
                      });
                      toast.success("DQ details recorded!");
                    }}
                    className="w-full py-[14px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all hover:bg-primary/70 hover:-translate-y-px active:translate-y-0 shadow-[0_4px_20px_rgba(47,111,212,0.25)]"
                  >
                    Save DQ & Activate Tracking
                  </button>
                </div>
              ) : (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-[18px_22px] mb-[14px] animate-in fade-in slide-in-from-top-2 duration-350 shadow-[0_4px_16px_rgba(21,116,79,0.06)]">
                  <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#15744f] mb-[10px]">
                    ✓ DQ Recorded — Tracking Active
                  </div>
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-[10px] mb-[12px]">
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium">
                        DQ Date
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {dqDate
                          ? new Date(dqDate + "T00:00:00").toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium">
                        Visa Category
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {dqCategory}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium">
                        Post
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {dqPost}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium">
                        Country
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {dqCountry}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDqSaved(false)}
                    className="text-[12px] font-semibold text-[#2f6fd4] bg-none border-none cursor-pointer p-0 hover:underline"
                  >
                    Edit details
                  </button>
                </div>
              )}

              {/* Scheduling cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-[6px]">
                    Official Scheduling Status
                  </div>
                  <div className="text-[14px] font-semibold text-[#0c1b33] mb-[8px]">
                    Currently scheduling DQ cases from:
                  </div>
                  <div className="text-[22px]  text-[#0c1b33] mb-[6px]">
                    {(dqPost &&
                      DQ_RECORDING_DATA.postScheduling[
                        dqPost as keyof typeof DQ_RECORDING_DATA.postScheduling
                      ]?.official) ||
                      "— / —"}
                  </div>
                  <div className="text-[12px] text-[#6b8097] leading-[1.5]">
                    Based on the State Department immigrant visa scheduling
                    bulletin for your post and category. Check the most recent
                    bulletin for current status.
                  </div>
                  <div className="inline-flex items-center gap-[4px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[10px] py-[3px] text-[10px] font-semibold text-[#2d4a6e] tracking-widest mt-[8px]">
                    <Info size={9} strokeWidth={2.5} />
                    U.S. State Department · Official
                  </div>
                </div>
                <div className="bg-white border-[1.5px] border-[#e8d47a] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#b38600] mb-[6px]">
                    Rahvana Estimate
                  </div>
                  <div className="text-[14px] font-semibold text-[#0c1b33] mb-[8px]">
                    Queue position trend:
                  </div>
                  <div className="text-[22px]  text-[#0c1b33] mb-[6px]">
                    {(dqPost &&
                      DQ_RECORDING_DATA.postScheduling[
                        dqPost as keyof typeof DQ_RECORDING_DATA.postScheduling
                      ]?.est) ||
                      "Select a post above"}
                  </div>
                  <div className="text-[12px] text-[#6b8097] leading-[1.5]">
                    {(dqPost &&
                      DQ_RECORDING_DATA.postScheduling[
                        dqPost as keyof typeof DQ_RECORDING_DATA.postScheduling
                      ]?.estSub) ||
                      "Save your DQ details to see scheduling context for your post."}
                  </div>
                  <div className="inline-flex items-center gap-[4px] bg-[#fffbec] border border-[#e8d47a] rounded-full px-[10px] py-[3px] text-[10px] font-semibold text-[#b38600] tracking-widest mt-[8px]">
                    <Activity size={9} strokeWidth={2.5} />
                    Rahvana Estimate · Not guaranteed
                  </div>
                  <div className="text-[11px] text-[#6b8097] mt-[8px] leading-[1.5] italic">
                    Estimates reflect observed trends, not official scheduling
                    commitments.
                  </div>
                </div>
              </div>

              {/* Dashboard sync */}
              <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[16px_20px] mb-[14px] flex items-start gap-[14px]">
                <div className="w-[38px] h-[38px] rounded-[9px] bg-white border border-[#d0e4f7] flex items-center justify-center shrink-0">
                  <Monitor size={18} className="text-[#2f6fd4]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#0c1b33] mb-[3px]">
                    {dqSaved
                      ? "✓ DQ date added to your dashboard"
                      : "Dashboard tracking will activate when DQ is recorded"}
                  </div>
                  <div className="text-[12px] text-[#3a4f63] leading-[1.5]">
                    {dqSaved
                      ? "Your DQ date is now pinned to your Rahvana dashboard and will remain visible until your interview letter is received."
                      : "Once saved, your DQ date will appear as a persistent card on your Rahvana dashboard until your interview letter is received."}
                  </div>
                </div>
              </div>

              {/* <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
                {DQ_RECORDING_DATA.disclaimer}
              </p> */}
            </div>
          )}

          {/* INTERVIEW SCHEDULING (Step 2.11 SPECIFIC) */}
          {tool.type === "interview_scheduling" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
              {/* Queue status card */}
              <div className="relative bg-[#0c1b33] rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-[0.85]" />
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/38 mb-[8px]">
                  Post-DQ Queue Status
                </div>
                <div className="text-[20px]  text-white/92 mb-[18px] flex items-center gap-[10px]">
                  <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#6aa8f0] animate-pulse shadow-[0_0_8px_rgba(106,168,240,0.6)]" />
                  In queue — awaiting interview letter
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-[14px]">
                  <div>
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-white/36 mb-[3px]">
                      DQ Date
                    </div>
                    <div className="text-[13px] font-semibold text-[#f0d98a]">
                      {state.metadata.dqDate
                        ? new Date(
                            state.metadata.dqDate + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-white/36 mb-[3px]">
                      Post
                    </div>
                    <div className="text-[13px] font-semibold text-white/88">
                      {state.metadata.post || "—"}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-white/36 mb-[3px]">
                      Current stage
                    </div>
                    <div className="text-[13px] font-semibold text-white/88">
                      Awaiting interview letter
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
                {/* Official Card */}
                <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-[6px]">
                    Official Scheduling Status
                  </div>
                  <div className="text-[13px] font-semibold text-[#0c1b33] mb-[6px]">
                    Cases currently being scheduled from:
                  </div>
                  <div className="text-[20px]  text-[#0c1b33] mb-[4px]">
                    {INTERVIEW_SCHEDULING_DATA.schedulingData[
                      (state.metadata
                        .post as keyof typeof INTERVIEW_SCHEDULING_DATA.schedulingData) ||
                        "Other"
                    ]?.official || "—"}
                  </div>
                  <div className="text-[12px] text-[#6b8097] leading-[1.5]">
                    From the State Department scheduling bulletin for this post
                    and category. Verify current status at travel.state.gov.
                  </div>
                  <div className="inline-flex items-center gap-[4px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[10px] py-[3px] text-[10px] font-semibold text-[#2d4a6e] mt-[8px]">
                    <Info size={9} strokeWidth={2.5} />
                    U.S. State Department · Official
                  </div>
                </div>

                {/* Estimate Card */}
                <div className="bg-[#fafcff] border-[1.5px] border-[#e8d47a] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#b38600] mb-[6px]">
                    Rahvana Estimate
                  </div>
                  <div className="text-[13px] font-semibold text-[#0c1b33] mb-[6px]">
                    Queue movement trend:
                  </div>
                  <div className="text-[20px]  text-[#0c1b33] mb-[4px]">
                    {INTERVIEW_SCHEDULING_DATA.schedulingData[
                      (state.metadata
                        .post as keyof typeof INTERVIEW_SCHEDULING_DATA.schedulingData) ||
                        "Other"
                    ]?.trend || "—"}
                  </div>
                  <div className="text-[12px] text-[#6b8097] leading-[1.5]">
                    {state.metadata.dqDate
                      ? INTERVIEW_SCHEDULING_DATA.schedulingData[
                          (state.metadata
                            .post as keyof typeof INTERVIEW_SCHEDULING_DATA.schedulingData) ||
                            "Other"
                        ]?.detail
                      : "Save your DQ details in the previous step to see scheduling context here."}
                  </div>
                  <div className="inline-flex items-center gap-[4px] bg-[#fffbec] border border-[#e8d47a] rounded-full px-[10px] py-[3px] text-[10px] font-semibold text-[#b38600] mt-[8px]">
                    <Activity size={9} strokeWidth={2.5} />
                    Rahvana Estimate · Not guaranteed
                  </div>
                  <div className="text-[11px] text-[#6b8097] mt-[6px] italic leading-[1.5]">
                    Estimates are trend-based projections. Actual scheduling
                    depends on post capacity and priority.
                  </div>
                </div>
              </div>

              {/* While you wait + milestone line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
                {/* While you wait */}
                <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="flex items-center gap-[9px] mb-[12px]">
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                      <Clock
                        size={16}
                        className="text-[#15744f]"
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="text-[14px] font-semibold text-[#0c1b33]">
                      While you wait
                    </div>
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    {INTERVIEW_SCHEDULING_DATA.whileYouWait.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-[8px] text-[13px] color-[#3a4f63] leading-[1.5]"
                      >
                        <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] shrink-0 mt-[6px]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone progress line */}
                <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="text-[13px] font-semibold text-[#0c1b33] mb-[14px]">
                    Your progress in Chapter 2
                  </div>
                  <div className="flex flex-col relative pl-[22px]">
                    <div className="absolute left-[7px] top-[6px] bottom-[6px] w-[2px] bg-[#d0e4f7] rounded-[2px]" />
                    {INTERVIEW_SCHEDULING_DATA.milestones.map((ms, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-[10px] mb-[12px] last:mb-0"
                      >
                        <div
                          className={`w-[14px] h-[14px] rounded-full shrink-0 z-[1] ml-[-22px] ${
                            ms.status === "done"
                              ? "bg-[#15744f]"
                              : ms.status === "active"
                                ? "bg-[#2f6fd4] animate-pulse"
                                : "bg-[#d0e4f7]"
                          }`}
                        />
                        <span
                          className={`text-[13px] ${
                            ms.status === "done"
                              ? "text-[#0e5c3c] font-medium"
                              : ms.status === "active"
                                ? "text-[#2f6fd4] font-bold"
                                : "text-[#6b8097] font-medium"
                          }`}
                        >
                          {ms.label} {ms.status === "active" && "← here"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* How it works info card */}
              <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                <div className="flex items-center gap-[9px] mb-[12px]">
                  <div className="w-[34px] h-[34px] rounded-[8px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                    <Info
                      size={16}
                      className="text-[#2f6fd4]"
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="text-[14px] font-semibold text-[#0c1b33]">
                    How interview scheduling works at this stage
                  </div>
                </div>
                <div className="flex flex-col gap-[7px]">
                  {INTERVIEW_SCHEDULING_DATA.howItWorks.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-[8px] text-[13px] color-[#3a4f63] leading-[1.5]"
                    >
                      <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] shrink-0 mt-[6px]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* <p className="text-[11.5px] color-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
                {INTERVIEW_SCHEDULING_DATA.disclaimer}
              </p> */}
            </div>
          )}

          {/* INTERVIEW APPOINTMENT (Step 2.12 SPECIFIC) */}
          {tool.type === "appointment_received" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
              {/* Hero banner */}
              <div className="relative bg-gradient-to-br from-[#0a1a2e] to-[#163258] rounded-[16px] p-[26px_28px] mb-[18px] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-white/30 opacity-[0.95]" />
                <div className="absolute top-[-40px] right-[-40px] w-[160px] h-[160px] bg-radial-gradient(circle,rgba(180,140,0,0.18)_0%,transparent_70%)" />

                {/* Custom Colorful Celebratory Icon */}
                <div className="absolute right-[28px] top-[50%] translate-y-[-50%] opacity-[0.45] rotate-[5deg] scale-[1.3]">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 22L11.5 14.5"
                      stroke="#b38600"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 11C14.7614 11 17 8.76142 17 6C17 3.23858 14.7614 1 12 1C9.23858 1 7 3.23858 7 6C7 8.76142 9.23858 11 12 11Z"
                      fill="#b38600"
                      fillOpacity="0.2"
                    />
                    <circle cx="17" cy="4" r="1.5" fill="#2f6fd4" />
                    <circle cx="21" cy="9" r="1.2" fill="#15744f" />
                    <circle cx="15" cy="10" r="1" fill="#f87171" />
                    <path
                      d="M19 14L20 15"
                      stroke="#f0d98a"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 16L16 17"
                      stroke="#60a5fa"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 19L12 21"
                      stroke="#f87171"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7 6L5 4"
                      stroke="#f0d98a"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M11 6L9 3"
                      stroke="#b38600"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/40 mb-[7px]">
                  {APPOINTMENT_RECEIVED_DATA.heroBanner.eyebrow}
                </div>
                <div className="text-[clamp(22px,3.5vw,28px)]  text-white/95 leading-[1.2] mb-[8px]">
                  {APPOINTMENT_RECEIVED_DATA.heroBanner.title}
                </div>
                <div className="text-[13px] text-white/55 leading-[1.6] max-w-[460px]">
                  {APPOINTMENT_RECEIVED_DATA.heroBanner.sub}
                </div>
              </div>

              {!state.metadata.interviewSaved ? (
                /* Input card */
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                  <div className="flex items-center gap-[10px] mb-[18px]">
                    <div className="w-[38px] h-[38px] rounded-[9px] bg-[#fffbec] border border-[#e8d47a] flex items-center justify-center shrink-0">
                      <Calendar
                        size={18}
                        className="text-[#b38600]"
                        strokeWidth={1.7}
                      />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#0c1b33]">
                        {APPOINTMENT_RECEIVED_DATA.form.title}
                      </div>
                      <div className="text-[12px] text-[#6b8097] mt-[2px]">
                        {APPOINTMENT_RECEIVED_DATA.form.sub}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] mb-[16px]">
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                        {
                          APPOINTMENT_RECEIVED_DATA.form.fields.interviewDate
                            .label
                        }
                      </label>
                      <input
                        type="date"
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#0c1b33] bg-white outline-none focus:border-[#2f6fd4] focus:ring-3 focus:ring-[#2f6fd4]/12 transition-all"
                        value={state.metadata.interviewDate || ""}
                        onChange={(e) =>
                          actions.updateMetadata({
                            interviewDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                        {APPOINTMENT_RECEIVED_DATA.form.fields.letterDate.label}
                      </label>
                      <input
                        type="date"
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#0c1b33] bg-white outline-none focus:border-[#2f6fd4] focus:ring-3 focus:ring-[#2f6fd4]/12 transition-all"
                        value={state.metadata.letterDate || ""}
                        onChange={(e) =>
                          actions.updateMetadata({
                            letterDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-[5px] md:col-span-2">
                      <label className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                        {APPOINTMENT_RECEIVED_DATA.form.fields.embassy.label}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          APPOINTMENT_RECEIVED_DATA.form.fields.embassy
                            .placeholder
                        }
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#0c1b33] bg-white outline-none focus:border-[#2f6fd4] focus:ring-3 focus:ring-[#2f6fd4]/12 transition-all w-full"
                        value={state.metadata.consulateLocation || ""}
                        onChange={(e) =>
                          actions.updateMetadata({
                            consulateLocation: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[11px_14px] text-[13px] text-[#3a4f63] leading-[1.5] mb-[16px] flex items-start gap-[8px]">
                    <Upload
                      size={14}
                      className="text-[#2f6fd4] shrink-0 mt-[1px]"
                      strokeWidth={1.8}
                    />
                    <span>
                      <strong>Keep your interview letter accessible.</strong>{" "}
                      You will need to bring the original to the consulate.
                      Store a copy in Rahvana&apos;s Document Vault for easy
                      reference during preparation.
                    </span>
                  </div>

                  <button
                    className="w-full p-[14px_24px] bg-[#15744f] text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all shadow-[0_4px_20px_rgba(21,116,79,0.3)] hover:bg-[#0e5c3c] hover:translate-y-[-1px] hover:shadow-[0_8px_28px_rgba(21,116,79,0.4)] active:translate-y-0"
                    onClick={() => {
                      if (
                        !state.metadata.interviewDate ||
                        !state.metadata.consulateLocation
                      ) {
                        toast.error(
                          "Please provide interview date and location",
                        );
                        return;
                      }
                      actions.updateMetadata({ interviewSaved: true });
                    }}
                  >
                    {APPOINTMENT_RECEIVED_DATA.form.button}
                  </button>
                </div>
              ) : (
                /* Saved appointment card */
                <div className="bg-white border-[1.5px] border-[#a8d9be] rounded-[16px] p-[22px_24px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in slide-in-from-top-2 duration-350 fill-mode-both">
                  <div className="flex items-center justify-between mb-[14px]">
                    <div className="text-[14px] font-semibold text-[#15744f]">
                      {APPOINTMENT_RECEIVED_DATA.savedView.title}
                    </div>
                    <button
                      className="text-[12px] font-semibold text-[#2f6fd4] bg-none border-none cursor-pointer hover:underline"
                      onClick={() =>
                        actions.updateMetadata({ interviewSaved: false })
                      }
                    >
                      {APPOINTMENT_RECEIVED_DATA.savedView.button}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium uppercase tracking-widest">
                        Interview Date
                      </div>
                      <div className="text-[14px] font-bold text-[#0e5c3c]">
                        {state.metadata.interviewDate
                          ? new Date(
                              state.metadata.interviewDate + "T00:00:00",
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium uppercase tracking-widest">
                        Embassy / Consulate
                      </div>
                      <div className="text-[14px] font-bold text-[#0e5c3c]">
                        {state.metadata.consulateLocation || "—"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <div className="text-[11px] text-[#0e5c3c] font-medium uppercase tracking-widest">
                        Letter Received
                      </div>
                      <div className="text-[14px] font-bold text-[#0e5c3c]">
                        {state.metadata.letterDate
                          ? new Date(
                              state.metadata.letterDate + "T00:00:00",
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard update block */}
              {state.metadata.interviewSaved && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-[18px_20px] mb-[14px] flex items-start gap-[14px] animate-in fade-in slide-in-from-top-2 duration-350 fill-mode-both">
                  <div className="w-[38px] h-[38px] rounded-[9px] bg-[#15744f] flex items-center justify-center shrink-0">
                    <Monitor size={18} className="text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0e5c3c] mb-[3px]">
                      {APPOINTMENT_RECEIVED_DATA.dashboardUpdate.title}
                    </div>
                    <div className="text-[12px] text-[#3a4f63] leading-[1.5]">
                      {APPOINTMENT_RECEIVED_DATA.dashboardUpdate.sub}
                    </div>
                  </div>
                </div>
              )}

              {/* Next chapter preview */}
              {state.metadata.interviewSaved && (
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in slide-in-from-top-2 duration-450 fill-mode-both">
                  <div className="flex items-center gap-[10px] mb-[14px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center shrink-0">
                      <Clock
                        size={17}
                        className="text-[#4a2d8a]"
                        strokeWidth={1.7}
                      />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#0c1b33]">
                        {APPOINTMENT_RECEIVED_DATA.nextChapter.title}
                      </div>
                      <div className="text-[12px] text-[#6b8097] mt-[2px]">
                        {APPOINTMENT_RECEIVED_DATA.nextChapter.sub}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[9px]">
                    {APPOINTMENT_RECEIVED_DATA.nextChapter.phases.map(
                      (phase, i) => (
                        <div
                          key={i}
                          className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[12px_14px] flex items-start gap-[9px]"
                        >
                          <div className="w-[22px] h-[22px] rounded-full bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center text-[11px] font-bold text-[#4a2d8a] shrink-0">
                            {phase.num}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#0c1b33]">
                              {phase.label}
                            </div>
                            <div className="text-[11px] text-[#6b8097] mt-[2px] leading-[1.4]">
                              {phase.sub}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEDICAL EXAMINATION (Step 3.1 SPECIFIC) */}
          {tool.type === "medical_exam" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
              <div className="flex gap-1.5 flex-wrap mb-8">
                {MEDICAL_EXAM_DATA.chips.map((chip, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full whitespace-nowrap border ${
                      chip.type === "med"
                        ? "bg-[#e8f6f6] text-[#0d6b6b] border-[#9fd6d6]"
                        : chip.type === "book"
                          ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                          : "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                    }`}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>

              {!medSaved ? (
                /* Decision module */
                <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/5 shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] overflow-hidden mb-4">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0d6b6b] via-[#6aa8f0] to-transparent opacity-75" />
                  <div className="p-[30px_32px_26px]">
                    <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mb-1">
                      {MEDICAL_EXAM_DATA.decisionModule.eyebrow}
                    </div>
                    <div className="text-[clamp(18px,2.6vw,22px)] text-white/92 leading-tight mb-5">
                      {MEDICAL_EXAM_DATA.decisionModule.heading}
                    </div>
                    <div className="h-px bg-white/10 mb-5" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {MEDICAL_EXAM_DATA.decisionModule.paths.map((path) => (
                        <div
                          key={path.id}
                          onClick={() => {
                            setMedWizardMode(path.id as "service" | "guide");
                            setMedWizardStep(0);
                            setIsMedWizardOpen(true);
                          }}
                          className="bg-white/5 border border-white/10 rounded-[10px] p-[16px_16px_14px] cursor-pointer transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-px active:translate-y-0"
                        >
                          <div className="text-[22px] mb-2">{path.icon}</div>
                          <div className="text-[14px] font-semibold text-white/92 mb-1">
                            {path.title}
                          </div>
                          <div className="text-[12px] text-white/55 leading-relaxed">
                            {path.sub}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Saved appointment card */
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-[20px_22px] mb-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-350">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[14px] font-semibold text-[#15744f]">
                      {MEDICAL_EXAM_DATA.savedView.title}
                    </div>
                    <button
                      onClick={() => {
                        setMedSaved(false);
                        setMedWizardMode("guide");
                        setMedWizardStep(3); // Start at the form step
                        setIsMedWizardOpen(true);
                      }}
                      className="text-[12px] font-semibold text-[#2f6fd4] bg-none border-none cursor-pointer p-0 hover:underline"
                    >
                      {MEDICAL_EXAM_DATA.savedView.button}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                    <div>
                      <div className="text-[11px] text-[#0e5c3c] font-medium mb-0.5">
                        Appointment Date
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {medDate
                          ? new Date(medDate + "T00:00:00").toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#0e5c3c] font-medium mb-0.5">
                        Appointment Time
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {medTime || "—"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-[11px] text-[#0e5c3c] font-medium mb-0.5">
                        Clinic / Physician
                      </div>
                      <div className="text-[13px] font-bold text-[#0e5c3c]">
                        {medClinic || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {medSaved && (
                /* Reminder sync */
                <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[16px_20px] mb-3.5 flex items-start gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-[9px] bg-white border border-[#d0e4f7] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-[#2f6fd4]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0c1b33] mb-0.5">
                      {MEDICAL_EXAM_DATA.reminderSync.title}
                    </div>
                    <div className="text-[12px] text-[#3a4f63] leading-relaxed">
                      {MEDICAL_EXAM_DATA.reminderSync.sub}
                    </div>
                  </div>
                </div>
              )}

              {/* Selector Overlay Modal */}
              {isMedWizardOpen && (
                <div className="fixed inset-0 z-200 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
                  {/* Topbar */}
                  <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-4 shrink-0">
                    <button
                      onClick={() => setIsMedWizardOpen(false)}
                      className="w-9 h-9 rounded-full border-none bg-[#f4f7fb] cursor-pointer flex items-center justify-center hover:bg-[#e8f1fb] transition-colors shrink-0"
                    >
                      <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
                    </button>
                    <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out"
                        style={{
                          width: `${((medWizardStep + 1) / (medWizardMode === "service" ? MEDICAL_EXAM_DATA.serviceSteps.length : MEDICAL_EXAM_DATA.guideSteps.length)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                      {medWizardStep + 1} /{" "}
                      {medWizardMode === "service"
                        ? MEDICAL_EXAM_DATA.serviceSteps.length
                        : MEDICAL_EXAM_DATA.guideSteps.length}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
                    <div className="w-full max-w-[540px]">
                      {(() => {
                        const steps =
                          medWizardMode === "service"
                            ? MEDICAL_EXAM_DATA.serviceSteps
                            : MEDICAL_EXAM_DATA.guideSteps;
                        const s = steps[medWizardStep];
                        return (
                          <>
                            <div className="text-[11px] font-semibold tracking-widest uppercase text-[#2f6fd4] mb-3.5">
                              {s.label}
                            </div>
                            <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
                              {s.heading}
                            </h2>
                            <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-6">
                              {s.sub}
                            </p>

                            {/* Path-specific content */}
                            {medWizardMode === "service" &&
                              medWizardStep === 0 && (
                                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 mb-3.5 shadow-sm">
                                  <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#6b8097] mb-2.5">
                                    {(s as any).card?.title}
                                  </div>
                                  <p className="text-[13px] text-[#3a4f63] leading-relaxed mb-3.5">
                                    {(s as any).card?.description}
                                  </p>
                                  <Link
                                    href={
                                      (s as any).card?.buttonLabel ===
                                      "Open Booking Service"
                                        ? "/book-appointment"
                                        : "#"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full p-3.5 bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:bg-primary/70 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)] no-underline"
                                  >
                                    <ExternalLink size={15} strokeWidth={2} />
                                    {(s as any).card?.buttonLabel}
                                  </Link>
                                </div>
                              )}

                            {"info" in s && s.info && (
                              <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px] font-size-[13px] text-[#3a4f63] leading-relaxed mb-3.5">
                                {s.info as string}
                              </div>
                            )}

                            {"alert" in s && s.alert && (
                              <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[14px_16px] text-[13px] color-[#8a6200] leading-relaxed mb-3.5">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: (s.alert as string).replace(
                                      /\*\*(.*?)\*\*/g,
                                      "<strong>$1</strong>",
                                    ),
                                  }}
                                />
                              </div>
                            )}

                            {"form" in s && s.form && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                                    Appointment Date
                                  </label>
                                  <input
                                    type="date"
                                    value={medDate}
                                    onChange={(e) => setMedDate(e.target.value)}
                                    className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                                    Appointment Time
                                  </label>
                                  <input
                                    type="time"
                                    value={medTime}
                                    onChange={(e) => setMedTime(e.target.value)}
                                    className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                                  />
                                </div>
                                <div className="sm:col-span-2 flex flex-col gap-1.5">
                                  <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                                    Clinic / Physician Name
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Dr. Ahmed Khan — Islamabad Medical Center"
                                    value={medClinic}
                                    onChange={(e) =>
                                      setMedClinic(e.target.value)
                                    }
                                    className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Nav */}
                            <div className="flex gap-2.5">
                              {s.nav.back && (
                                <button
                                  onClick={() => setMedWizardStep((v) => v - 1)}
                                  className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33]"
                                >
                                  ← Back
                                </button>
                              )}
                              {s.nav.save ? (
                                <button
                                  onClick={() => {
                                    if (!medDate) {
                                      toast.error(
                                        "Please provide appointment date",
                                      );
                                      return;
                                    }
                                    setMedSaved(true);
                                    actions.updateMetadata({
                                      med_appt_saved: "true",
                                      med_date: medDate,
                                      med_time: medTime,
                                      med_clinic: medClinic,
                                    });
                                    setIsMedWizardOpen(false);
                                    toast.success("Medical appointment saved!");
                                  }}
                                  className="flex-1 p-[12px_20px] bg-[#15744f] text-white border-none rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px active:translate-y-0"
                                >
                                  Save & Activate Reminder
                                </button>
                              ) : (
                                <button
                                  onClick={() => setMedWizardStep((v) => v + 1)}
                                  className="flex-1 p-[12px_20px] bg-primary text-white border-none rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/70 hover:-translate-y-px active:translate-y-0"
                                >
                                  {s.nav.next}
                                </button>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* POLIO VACCINATION CERTIFICATE (Step 3.2 SPECIFIC) */}
          {tool.type === "polio_certificate" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
              <div className="flex gap-1.5 flex-wrap mb-8">
                {POLIO_CERTIFICATE_DATA.chips.map((chip, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full whitespace-nowrap border ${
                      chip.type === "med"
                        ? "bg-[#e8f6f6] text-[#0d6b6b] border-[#9fd6d6]"
                        : chip.type === "req"
                          ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                          : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                    }`}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>

              {/* Launch module */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/5 shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] overflow-hidden mb-4">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#15744f] via-[#6aa8f0] to-transparent opacity-75" />
                <div className="p-7.5 sm:p-[30px_32px_26px]">
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mb-1">
                    {POLIO_CERTIFICATE_DATA.launchModule.eyebrow}
                  </div>
                  <div className="text-[clamp(18px,2.6vw,22px)] text-white/92 leading-tight mb-5">
                    {POLIO_CERTIFICATE_DATA.launchModule.heading}
                  </div>
                  <div className="h-px bg-white/10 mb-5" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5.5">
                    {POLIO_CERTIFICATE_DATA.launchModule.cues.map((cue, i) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-[10px] p-[10px_12px] flex items-start gap-2"
                      >
                        <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-1.5" />
                        <div className="text-[13px] text-white/55 leading-relaxed">
                          {cue}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (!polioLaunched) {
                        setPolioGuideStep(0);
                        setIsPolioGuideOpen(true);
                      }
                    }}
                    className={`w-full p-[15px_24px] rounded-[11px] text-[15px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-2.5 ${
                      polioLaunched
                        ? "bg-[#3b7dd8] text-white/90 shadow-[0_4px_20px_rgba(14,92,60,0.3)] pointer-events-none"
                        : "bg-[#3b7dd8] text-white shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:bg-[#3b7dd8] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)] active:translate-y-0"
                    }`}
                  >
                    <span>
                      {polioLaunched
                        ? POLIO_CERTIFICATE_DATA.launchModule.buttonLabels
                            .completed
                        : POLIO_CERTIFICATE_DATA.launchModule.buttonLabels
                            .initial}
                    </span>
                    {polioLaunched ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                  </button>
                  <div
                    className={`flex items-center justify-center gap-1.5 text-[12px] text-center mt-2.5 transition-all duration-380 ${
                      polioLaunched ? "text-[#a8d9be]/80" : "text-white/35"
                    }`}
                  >
                    <Info size={11} />
                    <span>
                      {polioLaunched
                        ? POLIO_CERTIFICATE_DATA.launchModule.note.completed
                        : POLIO_CERTIFICATE_DATA.launchModule.note.initial}
                    </span>
                  </div>
                </div>
              </div>

              {/* Return note */}
              {polioLaunched && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[10px] p-[14px_18px] flex items-start gap-3 mb-3.5 animate-in fade-in slide-in-from-top-2 duration-380">
                  <div className="shrink-0 mt-0.5">
                    <CheckCircle2 size={18} className="text-[#15744f]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#15744f]">
                      {POLIO_CERTIFICATE_DATA.returnNote.title}
                    </div>
                    <div className="text-[12px] text-[#3a4f63] leading-relaxed">
                      {POLIO_CERTIFICATE_DATA.returnNote.sub}
                    </div>
                  </div>
                </div>
              )}

              {/* Completion card */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-3.5 shadow-sm">
                <div className="text-[14px] font-semibold text-[#0c1b33] mb-3.5">
                  {POLIO_CERTIFICATE_DATA.completionCard.title}
                </div>
                <div className="flex flex-col gap-2">
                  {POLIO_CERTIFICATE_DATA.completionCard.items.map(
                    (item, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          const next = [...polioChecks];
                          next[i] = !next[i];
                          setPolioChecks(next);
                          actions.updateMetadata({ polio_checks: next });
                        }}
                        className={`flex items-center gap-3 p-[10px_12px] rounded-[10px] cursor-pointer transition-all border-[1.5px] select-none ${
                          polioChecks[i]
                            ? "bg-[#e8f5ef] border-[#a8d9be]"
                            : "bg-transparent border-transparent hover:bg-[#eef3fa]"
                        }`}
                      >
                        <div
                          className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-all ${
                            polioChecks[i]
                              ? "bg-[#15744f] border-[#15744f]"
                              : "bg-white border-[#d0e4f7]"
                          }`}
                        >
                          {polioChecks[i] && (
                            <Check size={10} strokeWidth={3.5} color="white" />
                          )}
                        </div>
                        <span
                          className={`text-[13px] leading-relaxed ${
                            polioChecks[i]
                              ? "text-[#0e5c3c] font-medium"
                              : "text-[#3a4f63]"
                          }`}
                        >
                          {item}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Guide Overlay Modal */}
              {isPolioGuideOpen && (
                <div className="fixed inset-0 z-200 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
                  {/* Topbar */}
                  <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-4 shrink-0">
                    <button
                      onClick={() => setIsPolioGuideOpen(false)}
                      className="w-9 h-9 rounded-full border-none bg-[#f4f7fb] cursor-pointer flex items-center justify-center hover:bg-[#e8f1fb] transition-colors shrink-0"
                    >
                      <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
                    </button>
                    <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out"
                        style={{
                          width: `${((polioGuideStep + 1) / POLIO_CERTIFICATE_DATA.guideSteps.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                      {polioGuideStep + 1} /{" "}
                      {POLIO_CERTIFICATE_DATA.guideSteps.length}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
                    <div className="w-full max-w-[560px]">
                      {(() => {
                        const s =
                          POLIO_CERTIFICATE_DATA.guideSteps[polioGuideStep];
                        const isFirst = polioGuideStep === 0;
                        const isLast =
                          polioGuideStep ===
                          POLIO_CERTIFICATE_DATA.guideSteps.length - 1;
                        return (
                          <>
                            <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
                              Polio Vaccination Guide · {s.label}
                            </div>
                            <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
                              {s.heading}
                            </h2>
                            <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-4.5">
                              {s.instruction}
                            </p>

                            <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-4.5 shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
                              <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
                                <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
                                <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
                                <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
                                <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">
                                  {s.vLabel}
                                </div>
                              </div>
                              <div className="p-4.5">
                                {s.visual.completed ? (
                                  <div className="bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-4 flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#15744f] flex items-center justify-center shrink-0">
                                      <Check
                                        size={13}
                                        strokeWidth={3}
                                        color="white"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-[13px] font-semibold text-[#15744f] mb-1">
                                        {s.visual.title}
                                      </div>
                                      <div className="text-[12px] text-[#3a4f63] leading-relaxed">
                                        {s.visual.sub}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px]">
                                    <div className="text-[14px] font-semibold text-[#0c1b33] mb-2">
                                      {s.visual.title}
                                    </div>
                                    {s.visual.sub ? (
                                      <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                                        {s.visual.sub}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2 mt-2">
                                        {s.visual.items?.map((item, i) => (
                                          <div
                                            key={i}
                                            className="flex gap-2 text-[13px] text-[#3a4f63]"
                                          >
                                            <span className="text-primary">
                                              ✓
                                            </span>
                                            <span>{item}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {s.note && (
                              <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] color-[#8a6200] leading-relaxed mb-5">
                                {s.note}
                              </div>
                            )}

                            <div className="flex gap-2.5">
                              {!isFirst && (
                                <button
                                  onClick={() =>
                                    setPolioGuideStep((v) => v - 1)
                                  }
                                  className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33]"
                                >
                                  ← Back
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (isLast) {
                                    setPolioLaunched(true);
                                    actions.updateMetadata({
                                      polio_launched: "true",
                                    });
                                    setIsPolioGuideOpen(false);
                                  } else {
                                    setPolioGuideStep((v) => v + 1);
                                  }
                                }}
                                className={`flex-1 p-[12px_20px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px active:translate-y-0 ${
                                  isLast
                                    ? "bg-[#15744f] text-white hover:bg-[#0e5c3c]"
                                    : "bg-primary text-white hover:bg-primary/70"
                                }`}
                              >
                                {isLast ? "Done — return to step" : "Next →"}
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* POLICE CLEARANCE CERTIFICATE (Step 3.3 SPECIFIC) */}
          {tool.type === "police_clearance" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
              <div className="flex items-center gap-1.5 flex-wrap mb-8">
                {POLICE_CLEARANCE_DATA.chips.map((chip, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full whitespace-nowrap border ${
                      chip.type === "pcc"
                        ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                        : chip.type === "track"
                          ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                          : "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                    }`}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>

              {/* Decision Module */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/5 shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] overflow-hidden mb-4">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-75" />
                <div className="p-7.5 sm:p-[30px_32px_26px]">
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mb-1">
                    {POLICE_CLEARANCE_DATA.decisionModule.eyebrow}
                  </div>
                  <div className="text-[clamp(18px,2.6vw,22px)] text-white/92 leading-tight mb-5">
                    {POLICE_CLEARANCE_DATA.decisionModule.heading}
                  </div>
                  <div className="h-px bg-white/10 mb-5" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {POLICE_CLEARANCE_DATA.decisionModule.paths.map(
                      (path, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setPccOverlayMode(path.id as any);
                            setPccOverlayStep(0);
                            setIsPccOverlayOpen(true);
                          }}
                          className="bg-white/5 border border-white/10 rounded-[10px] p-4 cursor-pointer transition-all hover:bg-white/[0.1] hover:border-white/[0.18] hover:-translate-y-px active:translate-y-0 group"
                        >
                          <div className="text-2xl mb-2">{path.icon}</div>
                          <div className="text-[14px] font-semibold text-white/95 mb-1 group-hover:text-white">
                            {path.title}
                          </div>
                          <div className="text-[12px] text-white/55 leading-relaxed">
                            {path.sub}
                          </div>
                          {path.note && (
                            <div className="text-[11px] text-[#ffc864]/75 mt-1.5 italic">
                              {path.note}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking Card */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                    <Search size={17} className="text-primary" />
                  </div>
                  <div className="text-[14px] font-semibold text-[#0c1b33]">
                    {POLICE_CLEARANCE_DATA.trackingCard.title}
                  </div>
                </div>

                {pccSaved && (
                  <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[10px] p-3.5 mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#2d4a6e] mb-2">
                      Application Recorded
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-[#6b8097]">
                          Receipt / Reference
                        </span>
                        <span className="font-semibold font-mono text-[#0c1b33]">
                          {pccData.receipt}
                        </span>
                      </div>
                      {pccData.track && (
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-[#6b8097]">
                            Tracking Number
                          </span>
                          <span className="font-semibold font-mono text-[#0c1b33]">
                            {pccData.track}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-[#6b8097]">Application Date</span>
                        <span className="font-semibold font-mono text-[#0c1b33]">
                          {pccData.date || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                  {POLICE_CLEARANCE_DATA.trackingCard.fields.map((f, i) => (
                    <div
                      key={f.id}
                      className={`flex flex-col gap-1.5 ${f.id === "receipt" ? "sm:col-span-1" : ""}`}
                    >
                      <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#6b8097]">
                        {f.label}
                      </label>
                      <input
                        type={f.id === "date" ? "date" : "text"}
                        placeholder={
                          f.id === "receipt"
                            ? "e.g. 2024-PKN-XXXXX"
                            : f.id === "track"
                              ? "Optional"
                              : ""
                        }
                        value={(pccData as any)[f.id]}
                        onChange={(e) => {
                          const next = { ...pccData, [f.id]: e.target.value };
                          setPccData(next);
                        }}
                        className="p-[10px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (!pccData.receipt) {
                      toast.error("Receipt number is required");
                      return;
                    }
                    setPccSaved(true);
                    actions.updateMetadata({
                      pcc_saved: "true",
                      pcc_receipt: pccData.receipt,
                      pcc_track: pccData.track,
                      pcc_date: pccData.date,
                    });
                    toast.success("Application details saved!");
                  }}
                  className="w-full p-[13px_24px] bg-primary text-white border-none rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/70 hover:-translate-y-px active:translate-y-0"
                >
                  {POLICE_CLEARANCE_DATA.trackingCard.buttonLabel}
                </button>
              </div>

              {/* Pending Reminder Card */}
              {pccSaved && !pccReceived && (
                <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-4.5 sm:p-5 mb-3.5 animate-in fade-in slide-in-from-top-2 duration-380 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-[18px]">📌</span>
                    <div className="text-[14px] font-semibold text-[#8a6200]">
                      {POLICE_CLEARANCE_DATA.pendingCard.title}
                    </div>
                  </div>
                  <div className="text-[13px] text-[#8a6200] leading-relaxed mb-4">
                    {POLICE_CLEARANCE_DATA.pendingCard.body}
                  </div>
                  <button
                    onClick={() => {
                      setPccReceived(true);
                      actions.updateMetadata({ pcc_received: "true" });
                      toast.success("Police certificate marked as received!");
                    }}
                    className="w-full p-[11px_18px] bg-[#15744f] text-white border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c]"
                  >
                    {POLICE_CLEARANCE_DATA.pendingCard.buttonLabel}
                  </button>
                </div>
              )}

              {/* Received Card */}
              {pccReceived && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-4.5 sm:p-5 mb-3.5 animate-in fade-in slide-in-from-top-2 duration-380 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[18px]">✅</span>
                    <div className="text-[14px] font-semibold text-[#15744f]">
                      {POLICE_CLEARANCE_DATA.receivedCard.title}
                    </div>
                  </div>
                  <div className="text-[13px] text-[#0e5c3c] leading-relaxed mb-4">
                    {POLICE_CLEARANCE_DATA.receivedCard.body}
                  </div>
                  <Link
                    href={POLICE_CLEARANCE_DATA.receivedCard.vaultUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2.5 p-[11px_18px] bg-[#15744f] text-white border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] no-underline"
                  >
                    <Upload size={14} color="white" strokeWidth={2.5} />
                    {POLICE_CLEARANCE_DATA.receivedCard.buttonLabel}
                  </Link>
                </div>
              )}

              {/* PCC Path Overlay Modal */}
              {isPccOverlayOpen && (
                <div className="fixed inset-0 z-200 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
                  {/* Topbar */}
                  <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-4 shrink-0">
                    <button
                      onClick={() => setIsPccOverlayOpen(false)}
                      className="w-9 h-9 rounded-full border-none bg-[#f4f7fb] cursor-pointer flex items-center justify-center hover:bg-[#e8f1fb] transition-colors shrink-0"
                    >
                      <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
                    </button>
                    <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out"
                        style={{
                          width: `${
                            ((pccOverlayStep + 1) /
                              (pccOverlayMode === "service"
                                ? POLICE_CLEARANCE_DATA.serviceSteps.length
                                : POLICE_CLEARANCE_DATA.guideSteps.length)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                      {pccOverlayStep + 1} /{" "}
                      {pccOverlayMode === "service"
                        ? POLICE_CLEARANCE_DATA.serviceSteps.length
                        : POLICE_CLEARANCE_DATA.guideSteps.length}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
                    <div className="w-full max-w-[540px]">
                      {(() => {
                        const steps =
                          pccOverlayMode === "service"
                            ? POLICE_CLEARANCE_DATA.serviceSteps
                            : POLICE_CLEARANCE_DATA.guideSteps;
                        const s = steps[pccOverlayStep];
                        const isFirst = pccOverlayStep === 0;
                        const isLast = pccOverlayStep === steps.length - 1;

                        return (
                          <>
                            <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
                              {s.label}
                            </div>
                            <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
                              {s.heading}
                            </h2>
                            <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-5">
                              {s.instruction}
                            </p>

                            {s.info && (
                              <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px] text-[13px] text-[#3a4f63] leading-relaxed mb-4 whitespace-pre-line">
                                {s.info}
                              </div>
                            )}

                            {s.warn && (
                              <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[13px_15px] text-[13px] text-[#8a6200] leading-relaxed mb-4">
                                {s.warn}
                              </div>
                            )}

                            {(s as any).guideUrl && (
                              <Link
                                href={(s as any).guideUrl}
                                target="_blank"
                                className="block text-[14px] font-semibold text-primary mb-5 no-underline hover:underline"
                              >
                                Open Full PCC Guide →
                              </Link>
                            )}

                            <div className="flex gap-2.5 mt-2">
                              {s.nav.back && (
                                <button
                                  onClick={() =>
                                    setPccOverlayStep((v) => v - 1)
                                  }
                                  className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33]"
                                >
                                  ← Back
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (isLast) {
                                    setIsPccOverlayOpen(false);
                                  } else {
                                    setPccOverlayStep((v) => v + 1);
                                  }
                                }}
                                className={`flex-1 p-[12px_20px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px active:translate-y-0 ${
                                  isLast
                                    ? "bg-[#15744f] text-white hover:bg-[#0e5c3c]"
                                    : "bg-primary text-white hover:bg-primary/70"
                                }`}
                              >
                                {isLast
                                  ? "Return to tracking →"
                                  : (s.nav.next ?? "Next →")}
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GATHER ORIGINAL DOCUMENTS (Step 3.4 SPECIFIC) */}
          {tool.type === "gathering_checklist" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
              {/* Progress Row */}
              {(() => {
                const groups = tool.doc_gathering?.groups || [];
                const allItems = groups.flatMap((g: any) => g.items);
                const total = allItems.length;
                const rev = allItems.filter(
                  (it: any) => gatheringStatus[it.id] === "reviewed",
                ).length;
                const pct = total > 0 ? (rev / total) * 100 : 0;

                return (
                  <div className="flex items-center gap-[12px] mb-[36px]">
                    <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-500 ease-in-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[12px] font-[500] text-[#6b8097] whitespace-nowrap shrink-0">
                      {rev} of {total} packed
                    </div>
                  </div>
                );
              })()}

              <div id="doc-groups">
                {tool.doc_gathering?.groups.map((group: any) => (
                  <div key={group.id} className="mb-[28px] last:mb-0">
                    <div className="flex items-center gap-[10px] mb-[12px]">
                      <span className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#6b8097]">
                        {group.label}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-[9px] py-[2px] rounded-full border tracking-[0.06em] whitespace-nowrap ${
                          group.badge === "Required"
                            ? "bg-[#ffeaea] text-[#a01c1c] border-[#f5bebe]"
                            : group.badge === "Recommended"
                              ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                              : "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                        }`}
                      >
                        {group.badge === "Required"
                          ? "Required"
                          : group.badge === "Recommended"
                            ? "Recommended"
                            : "Required if applicable"}
                      </span>
                      <div className="flex-1 h-px bg-[#d0e4f7]" />
                    </div>

                    <div className="flex flex-col gap-[9px]">
                      {group.items.map((item: any) => {
                        const status =
                          gatheringStatus[item.id] || "not-started";
                        const isRev = status === "reviewed";
                        const isIP = status === "in-progress";

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedGatheringItem(item);
                              setIsGatheringGuideOpen(true);
                              if (status === "not-started") {
                                setGatheringStatus((prev) => ({
                                  ...prev,
                                  [item.id]: "in-progress",
                                }));
                              }
                            }}
                            className={`group border-[1.5px] rounded-[16px] px-[20px] py-[16px] flex items-center gap-[14px] cursor-pointer transition-all hover:-translate-y-[1px] ${
                              isRev
                                ? "bg-[#e8f5ef] border-[#a8d9be]"
                                : isIP
                                  ? "bg-[#fef8e8] border-[#f0d98a]"
                                  : "bg-white border-[#d0e4f7] hover:border-[#2f6fd4] hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
                            }`}
                          >
                            <div
                              className={`w-[38px] h-[38px] rounded-[9px] border flex items-center justify-center shrink-0 transition-all ${
                                isRev
                                  ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                                  : "bg-[#e8f1fb] border-[#d0e4f7] text-[#2d4a6e] group-hover:bg-[#2f6fd4]/10 group-hover:border-[#2f6fd4]/30"
                              }`}
                            >
                              {getIcon(item.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-semibold text-[#0c1b33] mb-[3px] leading-[1.3]">
                                {item.title}
                              </div>
                              <div className="text-[12px] text-[#6b8097] leading-[1.4] truncate px-0.5">
                                {item.sub}
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigation logic or file picker trigger would go here
                                }}
                                className="rounded-full bg-white px-[10px] py-[4px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                title="Upload document"
                              >
                                <Upload size={12} strokeWidth={2.5} /> Upload
                              </button>
                              <div
                                className={`text-[11px] font-[500] px-[10px] py-[4px] border rounded-full whitespace-nowrap shrink-0 transition-all ${
                                  isRev
                                    ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                                    : isIP
                                      ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                                      : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"
                                }`}
                              >
                                {isRev ? (
                                  <span className="flex items-center gap-1">
                                    <Check size={12} strokeWidth={3} /> Packed
                                  </span>
                                ) : isIP ? (
                                  "In progress"
                                ) : (
                                  "Open guide"
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Organization visual (Navy Card) */}
              <div className="bg-[#0c1b33] rounded-[16px] p-[20px_22px] mt-[32px] mb-[14px] relative overflow-hidden shadow-[0_24px_80px_rgba(12,27,51,0.12)]">
                {/* Subtle Glow Overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10 text-[10px] font-[700] tracking-widest uppercase text-white/40 mb-[16px]">
                  Suggested Physical Packet Structure
                </div>
                <div className="relative z-10 grid grid-cols-2 min-[460px]:grid-cols-4 gap-[10px]">
                  {[
                    { icon: BookOpen, name: "Tab 1 — Identity & Passport" },
                    { icon: FileText, name: "Tab 2 — Civil Documents" },
                    { icon: Banknote, name: "Tab 3 — Financial / Sponsor" },
                    { icon: Paperclip, name: "Tab 4 — Supporting Extras" },
                  ].map((tab, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-[10px] p-[12px_10px] text-center flex flex-col items-center"
                    >
                      <tab.icon size={22} className="text-white/70 mb-[5px]" />
                      <div className="text-[11px] font-semibold text-white/75 leading-[1.3]">
                        {tab.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative z-10 text-[11px] text-white/40 mt-[16px] leading-[1.5]">
                  Keep originals and photocopies in separate labeled sections —
                  using dividers helps avoid fumbling at the interview window.
                </div>
              </div>

              {/* Organization Tips (White Card) */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
                <div className="flex items-center gap-[9px] mb-[12px]">
                  <div className="w-[34px] h-[34px] rounded-[8px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center shrink-0">
                    <Zap
                      size={16}
                      className="text-[#4a2d8a] fill-none stroke-[1.7]"
                    />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                    Organization tips for interview day
                  </h3>
                </div>
                <div className="flex flex-col gap-[7px]">
                  {[
                    "Use labeled folder tabs or dividers to separate document groups clearly",
                    "Keep originals and photocopies in completely separate sections — never mix them",
                    "Place the interview letter and passport at the very top for easy access at the security checkpoint",
                    "Bring multiple passport-style photos even if only some are required — extras are always useful",
                    "Do not fold or crease originals — use a rigid folder or envelope to protect them",
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-[8px] font-sans text-[13px] text-[#3a4f63] leading-[1.5]"
                    >
                      <div className="w-[4px] h-[4px] rounded-full bg-[#4a2d8a] shrink-0 mt-[7px]" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ATTEND MEDICAL EXAM (Step 3.5 SPECIFIC) */}
          {tool.type === "medical_exam_guide" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
              {/* Header Chips */}
              <div className="flex items-center gap-[7px] flex-wrap mb-8">
                {["Medical Exam", "What to Expect", "Preparation Guide"].map(
                  (label, i) => (
                    <span
                      key={i}
                      className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full border ${
                        i === 0
                          ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                          : i === 1
                            ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                            : "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                      }`}
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>

              {/* Launch Module */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-70" />
                <div className="p-[30px_32px_26px]">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0 text-white/75">
                      <Activity size={21} strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        Medical Exam Guide
                      </div>
                      <h2 className="text-[clamp(18px,2.6vw,22px)]  text-white/90 leading-[1.25]">
                        Walkthrough of the medical exam appointment
                      </h2>
                    </div>
                  </div>
                  <div className="h-px bg-white/9 mb-[18px]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-[22px]">
                    {[
                      "What to bring to the exam",
                      "How the exam typically proceeds",
                      "Vaccination and paperwork requirements",
                      "Common mistakes to avoid",
                    ].map((cue, i) => (
                      <div
                        key={i}
                        className="bg-white/6 border border-white/10 rounded-lg p-[10px_12px] flex items-start gap-2"
                      >
                        <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5.5px]" />
                        <span className="text-[13px] text-white/55 leading-[1.4]">
                          {cue}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setMedicalGuideIdx(0);
                      setIsMedicalGuideOpen(true);
                    }}
                    className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>View Medical Exam Guide</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Two-col lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[16px]">
                {/* What to bring */}
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#2f6fd4]" />
                    <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#6b8097]">
                      What to bring
                    </span>
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    {tool.bring?.map((it: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#2f6fd4] shrink-0 mt-[7px]" />
                        <span className="text-[13px] text-[#3a4f63] leading-[1.45]">
                          {it}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common pitfalls */}
                <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#b91c1c]" />
                    <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#6b8097]">
                      Common pitfalls
                    </span>
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    {tool.pitfalls?.map((it: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-[7px_10px] bg-[#fef2f2] rounded-[10px] border border-[#fecaca]/30"
                      >
                        <AlertTriangle
                          size={13}
                          className="text-[#b91c1c] shrink-0 mt-[1.5px]"
                        />
                        <span className="text-[13px] text-[#b91c1c] leading-[1.45]">
                          {it}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Helpful tips card */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] mb-[16px] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#15744f]" />
                  <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#6b8097]">
                    Helpful tips
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
                  {tool.tips?.map((it: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#15744f] shrink-0 mt-[7px]" />
                      <span className="text-[13px] text-[#3a4f63] leading-[1.45]">
                        {it}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {tool.disclaimer && (
                <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
                  {tool.disclaimer}
                </p>
              )}
            </div>
          )}

          {/* COURIER REGISTRATION (Step 3.6 SPECIFIC) */}
          {tool.type === "courier_registration" && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
              {/* Header Chips */}
              <div className="flex items-center gap-[7px] flex-wrap mb-8">
                {["Courier Service", "Account Setup", "Portal Wallet"].map(
                  (label, i) => (
                    <span
                      key={i}
                      className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full border ${
                        i === 0
                          ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                          : i === 1
                            ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                            : "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                      }`}
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>

              {/* Launch Module */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-70" />
                <div className="p-[30px_32px_26px]">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0 text-white/75">
                      <Truck size={21} strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        USVisaScheduling · Courier Registration
                      </div>
                      <h2 className="text-[clamp(18px,2.6vw,22px)]  text-white/90 leading-[1.25]">
                        Create your courier delivery account
                      </h2>
                    </div>
                  </div>
                  <div className="h-px bg-white/9 mb-[18px]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-[22px]">
                    {[
                      "Register at usvisascheduling.com",
                      "Select courier delivery for Pakistan",
                      "Save your login credentials securely",
                      "Save confirmation page to Document Vault",
                    ].map((cue, i) => (
                      <div
                        key={i}
                        className="bg-white/6 border border-white/10 rounded-lg p-[10px_12px] flex items-start gap-2"
                      >
                        <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5.5px]" />
                        <span className="text-[13px] text-white/55 leading-[1.4]">
                          {cue}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      window.open(
                        "https://www.usvisascheduling.com/",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Open Courier Registration</span>
                    <ArrowRight size={16} />
                  </button>
                  <div
                    className={`flex items-center justify-center gap-[5px] mt-3 text-[12px] text-center leading-[1.4] transition-colors duration-200 text-white/35`}
                  >
                    <ExternalLink size={11} strokeWidth={1.8} />
                    <span>
                      Opens the courier registration portal in a new tab
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[18px]">
                <button
                  onClick={() => {
                    setCourierGuideIdx(0);
                    setIsCourierGuideOpen(true);
                  }}
                  className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px text-left flex flex-col group"
                >
                  <div className="mb-3">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center text-[#4a2d8a]">
                      <Monitor size={17} />
                    </div>
                  </div>
                  <div className="text-[14px] font-bold text-[#0c1b33] mb-1">
                    Step-by-Step Sign-Up Guide
                  </div>
                  <div className="text-[12px] text-[#6b8097] leading-[1.5] mb-3">
                    Walkthrough of the courier registration sign-up process —
                    account creation, selection, and confirmation.
                  </div>
                  <div className="mt-auto text-[12px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>View guide</span>
                    <ArrowRight size={11} strokeWidth={2.5} />
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (courierCredentials) {
                      setWalletPortalType("COURIER");
                      setIsWalletViewOpen(true);
                    } else {
                      setWalletPortalType("COURIER");
                      setWalletMode("add");
                      setIsWalletFormOpen(true);
                    }
                  }}
                  className={`bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px text-left flex flex-col group ${courierCredentials ? "border-[#a8d9be] bg-[#e8f5ef]/30" : ""}`}
                >
                  <div className="mb-3">
                    <div
                      className={`w-[36px] h-[36px] rounded-[9px] ${courierCredentials ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]" : "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"} flex items-center justify-center`}
                    >
                      <Lock size={17} />
                    </div>
                  </div>
                  <div
                    className={`text-[14px] font-bold ${courierCredentials ? "text-[#15744f]" : "text-[#0c1b33]"} mb-1`}
                  >
                    {courierCredentials
                      ? "✓ Credentials Saved"
                      : "Save Courier Credentials"}
                  </div>
                  <div className="text-[12px] text-[#6b8097] leading-[1.5] mb-3">
                    {courierCredentials
                      ? "Courier account details stored in Portal Wallet."
                      : "Store your courier account login securely in Rahvana's Portal Wallet."}
                  </div>
                  <div
                    className={`mt-auto text-[12px] font-bold ${courierCredentials ? "text-[#15744f]" : "text-primary"} flex items-center gap-1 group-hover:gap-2 transition-all`}
                  >
                    <span>
                      {courierCredentials
                        ? "View saved credentials"
                        : "Open credential vault"}
                    </span>
                    <ArrowRight size={11} strokeWidth={2.5} />
                  </div>
                </button>
              </div>

              {/* Saved Credentials View (Specific) */}
              {courierCredentials && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[10px] p-[16px_18px] mb-5 animate-in fade-in slide-in-from-top-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#15744f] mb-[10px]">
                    ✓ Credentials Saved — Courier Account
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]/50">
                    <span className="text-[12px] text-[#3a4f63] font-medium">
                      Email
                    </span>
                    <span className="text-[12px] text-[#0c1b33] font-bold font-mono">
                      {courierCredentials.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]/50 last:border-none">
                    <span className="text-[12px] text-[#3a4f63] font-medium">
                      Password
                    </span>
                    <span className="text-[12px] text-[#0c1b33] font-bold font-mono">
                      ••••••••
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 mt-3">
                    <button
                      onClick={() => {
                        setWalletPortalType("COURIER");
                        setWalletMode("edit");
                        setIsWalletFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                    >
                      Edit or update in Portal Wallet{" "}
                      <ExternalLink size={11} strokeWidth={2.5} />
                    </button>
                    <a
                      href="https://www.rahvana.com/document-vault"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#15744f] hover:underline"
                    >
                      <Upload size={12} strokeWidth={2.5} />
                      Save confirmation page to Document Vault →
                    </a>
                  </div>
                </div>
              )}

              {tool.disclaimer && (
                <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
                  {tool.disclaimer}
                </p>
              )}
            </div>
          )}

          {/* INTERVIEW PREP CONTENT (Step 3.7 SPECIFIC) */}
          {tool.type === "interview_prep" && (
            <div className="flex flex-col mt-4">
              {/* Launcher Card (Large) */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/10 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#4a2d8a] via-[#6aa8f0] to-transparent opacity-80" />

                <div className="p-7 sm:p-8">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-[44px] h-[44px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <MessageSquare
                        className="text-white/75"
                        size={21}
                        strokeWidth={1.6}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        {tool.launch_module.title}
                      </div>
                      <h3 className=" text-[20px] sm:text-[22px] text-white/95 leading-tight">
                        {tool.launch_module.heading}
                      </h3>
                    </div>
                  </div>

                  <div className="h-px bg-white/10 mb-[18px]" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {tool.launch_module?.cues?.map((cue: string, i: number) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-[10px] p-2.5 flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6aa8f0]/60 mt-[5.5px] shrink-0" />
                        <span className="text-[13px] text-white/55 leading-tight">
                          {cue}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsPrepLaunched(true);
                      window.open(
                        "https://www.rahvana.com/interview-prep",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Launch Interview Prep Tool</span>
                    <ExternalLink size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              {isPrepLaunched && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[10px] p-[16px_18px] mb-5 animate-in fade-in slide-in-from-top-1">
                  <div className="text-[13px] font-bold text-[#15744f] mb-1">
                    ✓ Prep tool opened
                  </div>
                  <div className="text-[12px] text-[#3a4f63] leading-relaxed">
                    Return here after your prep session. Review the readiness
                    checklist below regularly before interview day.
                  </div>
                </div>
              )}

              {/* Readiness Grid */}
              {tool.readiness_grid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-[22px]">
                  {tool.readiness_grid.map((card: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-4.5"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b8097] mb-2.5 border-b border-[#f1f5f9] pb-2">
                        {card.title}
                      </div>
                      <div className="flex flex-col gap-2">
                        {card.items.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-[5px] h-[5px] rounded-full bg-purple-600 mt-[6.5px] shrink-0 opacity-70" />
                            <span className="text-[13px] text-[#3a4f63] leading-snug">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tool.disclaimer && (
                <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center mb-6">
                  {tool.disclaimer}
                </p>
              )}
            </div>
          )}

          {/* INTERVIEW DAY CONTENT (Step 3.8 SPECIFIC) */}
          {tool.type === "interview_day" && (
            <div className="flex flex-col">
              {/* Launcher Card (Dark) */}
              <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/10 overflow-hidden mb-4 shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#4a2d8a] via-[#6aa8f0] to-transparent opacity-80" />

                <div className="p-7 sm:p-8">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-[44px] h-[44px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Briefcase
                        className="text-white/75"
                        size={21}
                        strokeWidth={1.6}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        {tool.launch_module.title}
                      </div>
                      <h3 className=" text-[20px] sm:text-[22px] text-white/95 leading-tight">
                        {tool.launch_module.heading}
                      </h3>
                    </div>
                  </div>

                  <div className="h-px bg-white/10 mb-[18px]" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {tool.launch_module.cues.map((cue: string, i: number) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-[10px] p-2.5 flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 mt-[5.5px] shrink-0" />
                        <span className="text-[13px] text-white/55 leading-tight">
                          {cue}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setInterviewDayTutIdx(0);
                      setIsInterviewDayTutOpen(true);
                    }}
                    className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Open Interview Day Guide</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Two-column Bringing + Pitfalls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-4">
                {tool.checklists?.map((list: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${list.type === "bring" ? "bg-primary" : "bg-red-600"}`}
                      />
                      <div className="text-[12px] font-bold uppercase tracking-wider text-[#6b8097]">
                        {list.title}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      {list.items.map((item: string, i: number) =>
                        list.type === "bring" ? (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary mt-[6px] shrink-0" />
                            <span className="text-[13px] text-[#3a4f63] leading-tight">
                              {item}
                            </span>
                          </div>
                        ) : (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-red-700 text-[13px] leading-tight"
                          >
                            <AlertTriangle
                              size={14}
                              className="mt-0.5 shrink-0"
                            />
                            <span>{item}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Helpful Tips Card */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#15744f] shrink-0" />
                  <div className="text-[12px] font-bold uppercase tracking-wider text-[#6b8097]">
                    Helpful tips
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {tool.tips?.map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#15744f] mt-[6px] shrink-0" />
                      <span className="text-[13px] text-[#3a4f63] leading-tight">
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outcomes Card */}
              <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4">
                <div className="text-[13px] font-bold uppercase tracking-wider text-[#6b8097] mb-3">
                  Possible outcomes after the interview
                </div>
                <div className="flex flex-col gap-2">
                  {tool.outcomes?.map((outcome: any, i: number) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                        outcome.type === "approved"
                          ? "bg-[#e8f5ef] border-[#a8d9be]"
                          : outcome.type === "ap"
                            ? "bg-[#fef8e8] border-[#f0d98a]"
                            : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="shrink-0 mt-1">
                        {outcome.icon === "check-circle" && (
                          <CheckCircle2 size={18} className="text-[#15744f]" />
                        )}
                        {outcome.icon === "clipboard" && (
                          <Clipboard size={18} className="text-[#8a6200]" />
                        )}
                        {outcome.icon === "x-circle" && (
                          <XCircle size={18} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#0c1b33]">
                          {outcome.label}
                        </div>
                        <div className="text-[12px] text-[#6b8097] leading-relaxed">
                          {outcome.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {tool.disclaimer && (
                <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center mb-6">
                  {tool.disclaimer}
                </p>
              )}
            </div>
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
                        <button
                          key={item.id}
                          onClick={() => {
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
                          <div className="shrink-0 flex flex-col items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigation logic or file picker trigger would go here
                              }}
                              className="rounded-full bg-white px-[11px] py-[5px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                              title="Upload document"
                            >
                              <Upload size={15} strokeWidth={2.5} /> Upload
                            </button>

                            <div
                              className={`text-[12px] font-medium px-[11px] py-[5px] rounded-full shrink-0 border whitespace-nowrap
                            ${st === "reviewed" ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]" : st === "in-progress" ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]" : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"}
                          `}
                            >
                              {st === "reviewed"
                                ? "✓ Reviewed"
                                : st === "in-progress"
                                  ? "In progress"
                                  : "Open guide"}
                            </div>
                          </div>
                        </button>
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
          {currentStep.step_type === "quest" ? (
            <div className="w-full min-h-[600px] flex flex-col items-center">
              <QuestRenderer
                quest={currentStep.quest_data as unknown as QuestSuite}
                onComplete={handleToggleComplete}
                state={state}
                actions={actions}
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
                                  if (
                                    doc.guideUrl &&
                                    doc.guideUrl !== "/guides"
                                  ) {
                                    // For external guides, open in new tab and mark as reviewed
                                    window.open(doc.guideUrl, "_blank");
                                    // Mark as reviewed (external guides don't have a mark button)
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
                                    // For inline guides, open modal and mark as in-progress
                                    setSelectedGuideId(doc.id || null);
                                    // Mark as in-progress immediately when opened
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

                                <div className="shrink-0 flex flex-col items-center gap-2">
                                  {(() => {
                                    const defId = mapDocumentNameToId(doc.name);
                                    const uploadedDoc = uploadedDocuments.find(
                                      (ud) => ud.documentDefId === defId,
                                    );

                                    if (isReloadingDocs && !uploadedDoc) {
                                      return (
                                        <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-muted-foreground font-medium animate-pulse">
                                          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                                          Checking...
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
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (
                                                  window.confirm(
                                                    "Are you sure you want to delete this document?",
                                                  )
                                                ) {
                                                  try {
                                                    await deleteDocument(
                                                      uploadedDoc.id,
                                                    );
                                                    toast.success(
                                                      "Document deleted successfully",
                                                    );
                                                  } catch (err) {
                                                    toast.error(
                                                      "Failed to delete document",
                                                    );
                                                  }
                                                }
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

                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const defId = mapDocumentNameToId(
                                            doc.name,
                                          );
                                          setActiveUploadId(doc.id);
                                          setActiveUploadType("doc");
                                          openUploadModal(defId);
                                        }}
                                        className="rounded-full bg-white px-[11px] py-[5px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                        title="Upload document"
                                      >
                                        <Upload size={15} strokeWidth={2.5} />{" "}
                                        Upload
                                      </button>
                                    );
                                  })()}

                                  {(() => {
                                    const defId = mapDocumentNameToId(doc.name);
                                    const isUploadedInVault =
                                      uploadedDocuments.some(
                                        (ud) => ud.documentDefId === defId,
                                      );

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
                        onClick={() =>
                          handleConfirmation(
                            state.metadata.filingMethod as string,
                          )
                        }
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

      {/* Sponsorship Calculator Overlay (Step 5 Specific) */}
      {isSponsorshipCalcOpen && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
          {/* Topbar */}
          <div className="flex items-center h-[64px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-white">
            <button
              onClick={() => setIsSponsorshipCalcOpen(false)}
              className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
                style={{
                  width: `${Math.round(((sponsorshipStepIdx + 1) / 7) * 100)}%`,
                }}
              />
            </div>
            <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
              {sponsorshipStepIdx + 1} / 7
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
            <div className="w-full max-w-[560px] flex flex-col">
              {(() => {
                const step = sponsorshipStepIdx;
                const req = getThreshold(sponsorshipData.householdSize);
                const qualifies = sponsorshipData.agi >= req;
                const pct =
                  sponsorshipData.agi > 0
                    ? Math.round((sponsorshipData.agi / req) * 100)
                    : 0;

                if (step === 0) {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 1 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-2 leading-[1.3]">
                        Welcome to the Sponsorship Calculator
                      </h2>
                      <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-6">
                        This tool determines whether the petitioner qualifies as
                        the sole sponsor or whether additional sponsorship —
                        through household members or joint sponsors — is needed.
                        Your result generates the exact affidavit forms
                        required.
                      </p>
                      <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px] mb-6">
                        <p className="text-[13px] text-[#3a4f63] leading-[1.6]">
                          You will need your most recent federal tax return
                          (Form 1040) to find your Adjusted Gross Income (AGI).
                        </p>
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(1)}
                          className="flex-1 p-[14px_22px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px"
                        >
                          Get Started →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (step === 1) {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 2 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-2 leading-[1.3]">
                        Find your Adjusted Gross Income (AGI)
                      </h2>
                      <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px] mb-6">
                        <p className="text-[13px] text-[#3a4f63] leading-[1.6]">
                          <strong>What is AGI?</strong> Adjusted Gross Income is
                          your total income minus specific deductions. You can
                          find it on Line 11 of IRS Form 1040.
                        </p>
                      </div>
                      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[20px] mb-6">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097] mb-2 block">
                          Petitioner&apos;s Most Recent AGI
                        </label>
                        <input
                          type="number"
                          value={sponsorshipData.agi || ""}
                          onChange={(e) =>
                            setSponsorshipData({
                              ...sponsorshipData,
                              agi: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full p-[12px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[15px] text-[#0c1b33] outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 transition-all"
                          placeholder="e.g. 45000"
                        />
                        <p className="text-[12px] text-[#6b8097] mt-2 leading-[1.5]">
                          Enter the dollar amount from your most recent federal
                          tax return.
                        </p>
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(0)}
                          className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium transition-all hover:border-[#3a4f63]"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSponsorshipStepIdx(2)}
                          className="flex-1 p-[14px_22px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80 hover:-translate-y-px"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (step === 2) {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 3 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-2 leading-[1.3]">
                        What is your household size?
                      </h2>
                      <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px] mb-6">
                        <p className="text-[13px] text-[#3a4f63] leading-[1.6]">
                          Include the petitioner, the beneficiary, and any
                          dependents.
                        </p>
                      </div>
                      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[20px] mb-6">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097] mb-2 block">
                          Total Household Size
                        </label>
                        <input
                          type="number"
                          min="2"
                          value={sponsorshipData.householdSize || 2}
                          onChange={(e) =>
                            setSponsorshipData({
                              ...sponsorshipData,
                              householdSize: Math.max(
                                2,
                                parseInt(e.target.value) || 2,
                              ),
                            })
                          }
                          className="w-full p-[12px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[15px] text-[#0c1b33] outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 transition-all"
                        />
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(1)}
                          className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium transition-all hover:border-[#3a4f63]"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSponsorshipStepIdx(3)}
                          className="flex-1 p-[14px_22px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80 hover:-translate-y-px"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (step === 3) {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 4 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-4 leading-[1.3]">
                        Sponsorship qualification check
                      </h2>
                      <div
                        className={`bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-[18px_20px] mb-6 ${qualifies ? "bg-[#e8f5ef] border-[#a8d9be]" : "bg-[#fef8e8] border-[#f0d98a]"}`}
                      >
                        <div
                          className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${qualifies ? "text-[#15744f]" : "text-[#8a6200]"}`}
                        >
                          {qualifies
                            ? "Petitioner qualifies alone"
                            : "Additional sponsorship may be needed"}
                        </div>
                        <div className="text-[20px]  text-[#0c1b33] mb-1.5">
                          AGI: ${sponsorshipData.agi.toLocaleString()}{" "}
                          &nbsp;·&nbsp; Threshold: ${req.toLocaleString()}
                        </div>
                        <div className="text-[13px] text-[#3a4f63] leading-[1.55]">
                          {qualifies
                            ? `AGI is ${pct}% of the threshold — petitioner qualifies as sole sponsor.`
                            : `AGI is ${pct}% of the ${req.toLocaleString()} threshold. Household member income or a joint sponsor may be needed.`}
                        </div>
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(2)}
                          className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium transition-all hover:border-[#3a4f63]"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSponsorshipStepIdx(4)}
                          className="flex-1 p-[14px_22px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80 hover:-translate-y-px"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (step === 4) {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 5 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-2 leading-[1.3]">
                        Is household member income being used?
                      </h2>
                      <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-6">
                        A household member can contribute income to help meet
                        the threshold. This requires Form I-864A.
                      </p>
                      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[20px] mb-6">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097] mb-2 block">
                          Using Household Member Income?
                        </label>
                        <select
                          value={
                            sponsorshipData.needsHouseholdMember ? "yes" : "no"
                          }
                          onChange={(e) =>
                            setSponsorshipData({
                              ...sponsorshipData,
                              needsHouseholdMember: e.target.value === "yes",
                            })
                          }
                          className="w-full p-[12px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[15px] bg-white text-[#0c1b33] outline-none transition-all"
                        >
                          <option value="no">
                            No — petitioner income only
                          </option>
                          <option value="yes">
                            Yes — including household member income
                          </option>
                        </select>
                        {sponsorshipData.needsHouseholdMember && (
                          <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
                            <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097] mb-2 block">
                              Number of household members
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={sponsorshipData.householdMemberCount || 1}
                              onChange={(e) =>
                                setSponsorshipData({
                                  ...sponsorshipData,
                                  householdMemberCount: Math.max(
                                    1,
                                    parseInt(e.target.value) || 1,
                                  ),
                                })
                              }
                              className="w-full p-[12px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[15px] text-[#0c1b33] outline-none transition-all"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(3)}
                          className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium transition-all hover:border-[#3a4f63]"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSponsorshipStepIdx(5)}
                          className="flex-1 p-[14px_22px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80 hover:-translate-y-px"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (step === 5) {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 6 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-2 leading-[1.3]">
                        Is a joint sponsor needed?
                      </h2>
                      <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-6">
                        A joint sponsor independently meets the income threshold
                        and files their own I-864.
                      </p>
                      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[20px] mb-6">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097] mb-2 block">
                          Using a joint sponsor?
                        </label>
                        <select
                          value={
                            sponsorshipData.needsJointSponsor ? "yes" : "no"
                          }
                          onChange={(e) =>
                            setSponsorshipData({
                              ...sponsorshipData,
                              needsJointSponsor: e.target.value === "yes",
                            })
                          }
                          className="w-full p-[12px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[15px] bg-white text-[#0c1b33] outline-none transition-all"
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                        {sponsorshipData.needsJointSponsor && (
                          <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
                            <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097] mb-2 block">
                              Number of joint sponsors
                            </label>
                            <select
                              value={sponsorshipData.jointSponsorCount || 1}
                              onChange={(e) =>
                                setSponsorshipData({
                                  ...sponsorshipData,
                                  jointSponsorCount:
                                    parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-full p-[12px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[15px] bg-white text-[#0c1b33] outline-none transition-all"
                            >
                              <option value="1">1 joint sponsor</option>
                              <option value="2">2 joint sponsors</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(4)}
                          className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium transition-all hover:border-[#3a4f63]"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSponsorshipStepIdx(6)}
                          className="flex-1 p-[14px_22px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80 hover:-translate-y-px"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (step === 6) {
                  const forms: any[] = [];
                  const formNames: string[] = [];
                  if (
                    !sponsorshipData.needsHouseholdMember &&
                    !sponsorshipData.needsJointSponsor &&
                    sponsorshipData.agi >= req
                  ) {
                    forms.push({
                      name: "Form I-864EZ — Petitioner",
                      sub: "Simplified affidavit — petitioner qualifies alone with wage/salary income",
                      url: I864EZ_URL,
                    });
                    formNames.push("I-864EZ (Petitioner)");
                  } else {
                    forms.push({
                      name: "Form I-864 — Petitioner",
                      sub: "Full affidavit of support for the petitioner",
                      url: I864_URL,
                    });
                    formNames.push("I-864 (Petitioner)");
                  }
                  for (
                    let i = 1;
                    i <= (sponsorshipData.jointSponsorCount || 0);
                    i++
                  ) {
                    forms.push({
                      name: `Form I-864 — Joint Sponsor ${i}`,
                      sub: `Joint sponsor ${i} files an independent full affidavit`,
                      url: I864_URL,
                    });
                    formNames.push(`I-864 (Joint Sponsor ${i})`);
                  }
                  for (
                    let i = 1;
                    i <= (sponsorshipData.householdMemberCount || 0);
                    i++
                  ) {
                    forms.push({
                      name: `Form I-864A — Household Member ${i}`,
                      sub: `Household member ${i} contributes income to the petitioner&apos;s sponsorship`,
                      url: I864A_URL,
                    });
                    formNames.push(`I-864A (Household Member ${i})`);
                  }

                  return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                        Sponsorship Calculator · Step 7 of 7
                      </div>
                      <h2 className="text-[clamp(22px,3.5vw,28px)]  font-black text-[#0c1b33] mb-4 leading-[1.3]">
                        Your sponsorship plan
                      </h2>
                      <div className="bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-[18px_20px] mb-6">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#15744f] mb-2">
                          Sponsorship Plan
                        </div>
                        <div className="text-[20px]  text-[#0c1b33] mb-1.5">
                          {forms.length} form{forms.length > 1 ? "s" : ""}{" "}
                          required
                        </div>
                        <div className="text-[13px] text-[#3a4f63] leading-[1.55]">
                          {formNames.join(" · ")}
                        </div>
                      </div>
                      <div className="flex gap-[10px]">
                        <button
                          onClick={() => setSponsorshipStepIdx(5)}
                          className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium transition-all hover:border-[#3a4f63]"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => {
                            const result = {
                              agi: sponsorshipData.agi,
                              householdSize: sponsorshipData.householdSize,
                              qualifies: sponsorshipData.agi >= req,
                              needsHouseholdMember:
                                sponsorshipData.needsHouseholdMember,
                              householdMemberCount:
                                sponsorshipData.householdMemberCount,
                              needsJointSponsor:
                                sponsorshipData.needsJointSponsor,
                              jointSponsorCount:
                                sponsorshipData.jointSponsorCount,
                              forms,
                            };
                            actions.updateMetadata({
                              sponsorshipResult: result,
                            });
                            setIsSponsorshipCalcOpen(false);
                            if (!isCompleted)
                              actions.toggleComplete("step_2_5");
                          }}
                          className="flex-1 p-[14px_22px] bg-[#15744f] text-white border-none rounded-[10px] text-[15px] font-semibold transition-all hover:bg-[#0e5c3c] hover:-translate-y-px"
                        >
                          Return to Affidavit Step →
                        </button>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

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
                {InlineGuideData[selectedGuideId].sections.map(
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

function NvcFeeModal({
  isOpen,
  onClose,
  data,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSave: (newData: any) => void;
}) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    if (isOpen) {
      setLocalData({
        ...data,
        aos:
          data.aos === "Not Started"
            ? "Not paid"
            : data.aos === "Pending"
              ? "In process"
              : data.aos,
        iv:
          data.iv === "Not Started"
            ? "Not paid"
            : data.iv === "Pending"
              ? "In process"
              : data.iv,
      });
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-5">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0c1b33]/55 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Shell */}
      <div className="relative bg-white w-full max-w-[460px] rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-3 duration-240 ease-out">
        {/* Scrollable Container */}
        <div className="max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-[24px_24px_0] mb-[18px]">
            <div>
              <h3 className=" font-black text-[22px] text-[#0c1b33] leading-tight">
                NVC Fee Payment Status
              </h3>
              {/* <p className="text-[13px] text-[#6b8097] mt-1 leading-normal">
                Stored in your Rahvana Portal Wallet
              </p> */}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#eef3fa] flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-colors"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <div className="p-[0_24px_24px]">
            <div className="h-px bg-[#d0e4f7] mb-[20px]" />

            <div className="flex flex-col gap-[14px]">
              {/* AoS Fee */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Affidavit of Support Fee
                </label>
                <select
                  value={localData.aos}
                  onChange={(e) =>
                    setLocalData({ ...localData, aos: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b8097%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                >
                  <option value="">Select status…</option>
                  <option value="Not paid">Not paid</option>
                  <option value="In process">In process</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {/* IV Fee */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Immigrant Visa Fee
                </label>
                <select
                  value={localData.iv}
                  onChange={(e) =>
                    setLocalData({ ...localData, iv: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b8097%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                >
                  <option value="">Select status…</option>
                  <option value="Not paid">Not paid</option>
                  <option value="In process">In process</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Date Payment Submitted{" "}
                  <span className="font-normal lowercase tracking-normal text-[11px] ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  type="date"
                  value={localData.date}
                  onChange={(e) =>
                    setLocalData({ ...localData, date: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 transition-all"
                />
              </div>

              {/* Note */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Payment Note{" "}
                  <span className="font-normal lowercase tracking-normal text-[11px] ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via credit card"
                  value={localData.note}
                  onChange={(e) =>
                    setLocalData({ ...localData, note: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-[13px] bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_13px] mt-[18px] mb-[18px]">
              <ShieldCheck size={13} className="text-[#8a6200] mt-1 shrink-0" />
              <span className="text-[12px] text-[#8a6200] leading-normal">
                Details are stored locally for this session. Manage or update
                them in your Portal Wallet.
              </span>
            </div>

            <button
              onClick={() => onSave(localData)}
              className="w-full p-[14px_24px] bg-primary text-white rounded-[10px] font-semibold text-[15px] hover:bg-primary/70 hover:-translate-y-px transition-all active:translate-y-0 shadow-[0_4px_20px_rgba(47,111,212,0.35)]"
            >
              Save Payment Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialDocGuideOverlay({
  isOpen,
  onClose,
  doc,
  status,
  onMarkReviewed,
}: {
  isOpen: boolean;
  onClose: () => void;
  doc: any;
  status: string;
  onMarkReviewed: () => void;
}) {
  const isReviewed = status === "reviewed";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#e8f1fb] transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="flex-1 text-[13px] font-semibold text-[#0c1b33]">
          Step 6 · Gather Financial Support Documents
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[#2f6fd4] mb-4">
            Step 6 · Financial Support Documents
          </div>

          <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-[6px] leading-[1.25] ">
            {doc.title}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-[28px]">
            {doc.sub}
          </p>

          <div className="flex flex-col">
            <style jsx global>{`
              .guide-content p {
                font-size: 14px;
                color: #3a4f63;
                line-height: 1.7;
                margin-bottom: 8px;
              }
              .guide-content p:last-child {
                margin-bottom: 0;
              }
            `}</style>

            <div className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px] mb-[14px]">
              <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                What this is
              </h3>
              <div className="guide-content">
                <p>{doc.guide?.intro}</p>
              </div>
            </div>

            {doc.guide?.sections?.map((section: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px] mb-[14px]"
              >
                <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                  {section.title}
                </h3>
                <div className="guide-content">
                  <p>{section.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-[10px] mt-[28px]">
            <button
              onClick={() => {
                onMarkReviewed();
                // We stay in the overlay but update the disabled state, matching HTML behavior
              }}
              className={`w-full p-[15px_24px] bg-[#15744f] text-white rounded-[10px] font-semibold text-[15px] transition-all hover:bg-[#0e5c3c] hover:-translate-y-px active:translate-y-0 disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed disabled:transform-none`}
              disabled={isReviewed}
            >
              {isReviewed ? "✓ Marked as reviewed" : "Mark as reviewed"}
            </button>
            <button
              onClick={onClose}
              className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#0c1b33] transition-all text-center"
            >
              ← Back to document list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HouseholdDocGuideOverlay({
  isOpen,
  onClose,
  doc,
  status,
  onMarkReviewed,
}: {
  isOpen: boolean;
  onClose: () => void;
  doc: any;
  status: string;
  onMarkReviewed: () => void;
}) {
  const isReviewed = status === "reviewed";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get guide content from the structured data if available
  const guide = HOUSEHOLD_GUIDE_CONTENT[doc.guideKey] || {
    intro:
      "Preparing proper relationship proof is essential for CEAC acceptance.",
    sections: [
      {
        title: "Requirement Summary",
        body: "Ensure the document is a clear scan of the original, not a photocopied print-out. If not in English, a certified translation is required.",
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-white z-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#e8f1fb] transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="flex-1 text-[13px] font-semibold text-[#0c1b33]">
          Step 7 · Household Member Relationship Proof
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[#4a2d8a] mb-4">
            Step 7 · Relationship Documentation
          </div>

          <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-[6px] leading-[1.25] ">
            {doc.title}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-[28px]">
            {doc.sub}
          </p>

          <div className="flex flex-col">
            <style jsx global>{`
              .guide-content p {
                font-size: 14px;
                color: #3a4f63;
                line-height: 1.7;
                margin-bottom: 8px;
              }
              .guide-content p:last-child {
                margin-bottom: 0;
              }
              .guide-content ul {
                padding-left: 18px;
                margin-top: 6px;
                margin-bottom: 8px;
              }
              .guide-content li {
                font-size: 14px;
                color: #3a4f63;
                line-height: 1.65;
                margin-bottom: 5px;
              }
              .info-box {
                background: #e8f1fb;
                border: 1px solid #d0e4f7;
                border-radius: 8px;
                padding: 12px 14px;
                margin-top: 10px;
              }
              .info-box p {
                font-size: 13px;
                color: #3a4f63;
                line-height: 1.6;
                margin: 0;
              }
              .guide-content ul {
                margin: 12px 0;
                padding-left: 18px;
                list-style-type: none;
              }
              .guide-content li {
                position: relative;
                font-size: 14px;
                color: #3a4f63;
                line-height: 1.6;
                margin-bottom: 8px;
                padding-left: 20px;
              }
              .guide-content li::before {
                content: "•";
                position: absolute;
                left: 0;
                color: #cbd5e1;
                font-weight: bold;
              }
              .note-box {
                background: #fef8e8;
                border: 1px solid #f0d98a;
                border-radius: 8px;
                padding: 12px 14px;
                margin-top: 10px;
              }
              .note-box p {
                font-size: 13px;
                color: #8a6200;
                line-height: 1.6;
                margin: 0;
              }
              /* Mock Visual Components for Tutorials */
              .mock-card {
                background: white;
                border: 2px solid #d0e4f7;
                border-radius: 12px;
                padding: 18px 20px;
                box-shadow: 0 4px 16px rgba(12, 27, 51, 0.05);
                margin-bottom: 12px;
              }
              .mock-title {
                font-size: 14px;
                font-weight: 700;
                color: #0c1b33;
                margin-bottom: 12px;
                letter-spacing: -0.01em;
              }
              .mock-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #eef3fa;
                font-size: 13px;
                color: #3a4f63;
              }
              .mock-row:last-child {
                border-bottom: none;
              }
              .mock-badge-green {
                font-size: 11px;
                font-weight: 700;
                padding: 3px 10px;
                border-radius: 100px;
                background: #e8f5ef;
                color: #15744f;
                border: 1px solid #a8d9be;
                text-transform: uppercase;
                letter-spacing: 0.03em;
              }
              .mock-badge-amber {
                font-size: 11px;
                font-weight: 700;
                padding: 3px 10px;
                border-radius: 100px;
                background: #fef8e8;
                color: #8a6200;
                border: 1px solid #f0d98a;
                text-transform: uppercase;
                letter-spacing: 0.03em;
              }
              .hl-box {
                padding: 10px 14px;
                background: rgba(47, 111, 212, 0.08);
                border: 1.5px solid rgba(47, 111, 212, 0.2);
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                color: #2f6fd4;
                margin-top: 10px;
                line-height: 1.5;
              }
              .warn-box {
                padding: 10px 14px;
                background: #fef2f2;
                border: 1.5px solid #fecaca;
                border-radius: 10px;
                font-size: 13px;
                color: #b91c1c;
                margin-top: 10px;
                line-height: 1.5;
              }
            `}</style>

            <div className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px] mb-[14px]">
              <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                What this is
              </h3>
              <div className="guide-content">
                <p>{guide.intro}</p>
              </div>
            </div>

            {guide.sections?.map((section: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px] mb-[14px]"
              >
                <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                  {section.title}
                </h3>
                <div
                  className="guide-content"
                  dangerouslySetInnerHTML={{ __html: section.body }}
                />
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-[10px] mt-[28px]">
            <button
              onClick={() => {
                onMarkReviewed();
              }}
              className={`w-full p-[15px_24px] bg-[#15744f] text-white rounded-[10px] font-semibold text-[15px] transition-all hover:bg-[#0e5c3c] hover:-translate-y-px active:translate-y-0 disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed disabled:transform-none`}
              disabled={isReviewed}
            >
              {isReviewed ? "✓ Marked as reviewed" : "Mark as reviewed"}
            </button>
            <button
              onClick={onClose}
              className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#0c1b33] transition-all text-center"
            >
              ← Back to document list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CivilDocGuideOverlay({
  isOpen,
  onClose,
  doc,
  status,
  onMarkReviewed,
}: {
  isOpen: boolean;
  onClose: () => void;
  doc: any;
  status: string;
  onMarkReviewed: () => void;
}) {
  const isReviewed = status === "reviewed";

  return (
    <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/10 transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div className="h-full bg-primary w-full" />
        </div>

        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          Document Guide
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
            Step 4 · Prepare Civil Documents
          </div>
          <div className="inline-flex items-center gap-[5px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] w-fit mb-6">
            <div className="w-[6px] h-[6px] rounded-full bg-primary" />
            <span className="text-[11px] font-medium text-[#3a4f63]">
              NVC / CEAC Civil Document
            </span>
          </div>

          <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-[6px] leading-[1.25]">
            {doc.title}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-[28px]">
            {doc.sub}
          </p>

          <div className="flex flex-col">
            <style jsx global>{`
              .guide-content p {
                font-size: 14px;
                color: #3a4f63;
                line-height: 1.7;
                margin-bottom: 8px;
              }
              .guide-content p:last-child {
                margin-bottom: 0;
              }
              .guide-content ul {
                padding-left: 18px;
                margin-top: 6px;
                margin-bottom: 8px;
              }
              .guide-content li {
                font-size: 14px;
                color: #3a4f63;
                line-height: 1.65;
                margin-bottom: 5px;
              }
              .note-box {
                background: #fef8e8;
                border: 1px solid #f0d98a;
                border-radius: 10px;
                padding: 13px 16px;
                margin-top: 12px;
                margin-bottom: 12px;
              }
              .note-box p {
                font-size: 13px;
                color: #8a6200;
                line-height: 1.6;
                margin: 0;
              }
              .info-box {
                background: #e8f1fb;
                border: 1px solid #d0e4f7;
                border-radius: 10px;
                padding: 13px 16px;
                margin-top: 12px;
                margin-bottom: 12px;
              }
              .info-box p {
                font-size: 13px;
                color: #3a4f63;
                line-height: 1.6;
                margin: 0;
              }
            `}</style>
            {doc.sections?.map((section: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px]"
              >
                <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[10px]">
                  {section.t || section.title}
                </h3>
                <div
                  className="guide-content"
                  dangerouslySetInnerHTML={{
                    __html: section.c || section.htmlContent,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-[10px] mt-[28px] mb-[40px]">
            <button
              onClick={() => {
                onMarkReviewed();
                onClose();
              }}
              className={`w-full p-[15px_24px] rounded-[16px] font-bold text-[15px] transition-all flex items-center justify-center gap-2
                ${
                  isReviewed
                    ? "bg-[#d0e4f7] text-[#6b8097] cursor-not-allowed opacity-80"
                    : "bg-[#15744f] text-white hover:bg-[#0e5c3c] hover:-translate-y-px"
                }
              `}
              disabled={isReviewed}
            >
              {isReviewed ? <Check size={18} strokeWidth={3} /> : null}
              {isReviewed ? "✓ Marked as reviewed" : "Mark as reviewed"}
            </button>
            <button
              onClick={onClose}
              className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[16px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#0c1b33] transition-all text-center"
            >
              ← Back to document list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CeacCredsModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: PortalCredential | null;
  isSubmitting: boolean;
}) {
  const [caseNumber, setCaseNumber] = useState(
    initialData?.nvc_case_number || "",
  );
  const [invoiceId, setInvoiceId] = useState(initialData?.nvc_invoice_id || "");
  const [email, setEmail] = useState(initialData?.username || "");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSave = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!caseNumber.trim()) newErrors.caseNumber = true;
    if (!invoiceId.trim()) newErrors.invoiceId = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({
      portalType: "NVC",
      nvcCaseNumber: caseNumber.trim(),
      nvcInvoiceId: invoiceId.trim(),
      username: email.trim(), // Storing email in username field
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-5 font-sans animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-[#0c1b33]/55 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[460px] max-h-[88vh] bg-[#fafcff] rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-3 duration-240">
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className=" text-[22px] text-[#0c1b33] leading-tight">
              CEAC Access Details
            </h2>
            <p className="text-[13px] text-[#6b8097] mt-1">
              Stored in your Rahvana Portal Wallet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-all cursor-pointer"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="h-px bg-[#d0e4f7] mb-5" />

          <div className="flex flex-col gap-3.5 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.04em]">
                NVC Case Number
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => {
                  setCaseNumber(e.target.value);
                  if (errors.caseNumber)
                    setErrors({ ...errors, caseNumber: false });
                }}
                placeholder="e.g. ISL2026XXXXXX"
                className={`p-[11px_14px] border-[1.5px] rounded-[10px] text-[14px] bg-white outline-none transition-all
                  ${errors.caseNumber ? "border-[#f87171] bg-[#fff5f5]" : "border-[#d0e4f7] focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"}
                `}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.04em]">
                Invoice ID Number
              </label>
              <input
                type="text"
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value);
                  if (errors.invoiceId)
                    setErrors({ ...errors, invoiceId: false });
                }}
                placeholder="Enter your Invoice ID"
                className={`p-[11px_14px] border-[1.5px] rounded-[10px] text-[14px] bg-white outline-none transition-all
                  ${errors.invoiceId ? "border-[#f87171] bg-[#fff5f5]" : "border-[#d0e4f7] focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"}
                `}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.04em]">
                Notification Email{" "}
                <span className="lowercase font-normal tracking-normal text-[11px] text-[#6b8097]">
                  (optional)
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] bg-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)] transition-all"
              />
            </div>
          </div>

          <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-3 mb-[18px] flex gap-2.5">
            <ShieldCheck
              size={14}
              className="text-[#8a6200] shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[12px] text-[#8a6200] leading-normal font-sans">
              Your details are stored locally on your device for this session.
              To manage or update them permanently, use your full Portal Wallet.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full p-[14px_24px] bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold hover:bg-primary/70 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Saving..." : "Save Details"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MedicalTutOverlay({
  isOpen,
  onClose,
  tutorial,
  index,
  setIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  tutorial: any[];
  index: number;
  setIndex: (idx: number) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !tutorial) return null;

  const s = tutorial[index];
  const total = tutorial.length;
  const progress = ((index + 1) / total) * 100;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="fixed inset-0 z-500 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border-none bg-[#f4f7fb] cursor-pointer flex items-center justify-center hover:bg-[#e8f1fb] transition-colors shrink-0"
        >
          <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {index + 1} / {total}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px] bg-white">
        <div className="w-full max-w-[580px] flex flex-col min-h-full">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
            Medical Exam Guide · {s.label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
            {s.heading}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">
            {s.instruction}
          </p>

          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
            <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
              <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
              <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">
                {s.vlabel}
              </div>
            </div>
            <div
              className="p-[18px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: s.visual }}
            />
          </div>

          {s.note && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">
              {s.note}
            </div>
          )}

          <div className="mt-auto pt-6 flex gap-2.5">
            {!isFirst && (
              <button
                onClick={() => setIndex(index - 1)}
                className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33]"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setIndex(index + 1);
                }
              }}
              className={`flex-1 p-[12px_20px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px active:translate-y-0
                ${isLast ? "bg-[#15744f] text-white hover:bg-[#0e5c3c]" : "bg-primary text-white hover:bg-primary/80 shadow-[0_4px_12px_rgba(47,111,212,0.2)]"}
              `}
            >
              {isLast ? "Done — return to step" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourierTutOverlay({
  isOpen,
  onClose,
  tutorial,
  index,
  setIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  tutorial: any[];
  index: number;
  setIndex: (idx: number) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !tutorial) return null;

  const s = tutorial[index];
  const total = tutorial.length;
  const progress = ((index + 1) / total) * 100;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="fixed inset-0 z-500 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border-none bg-[#f4f7fb] cursor-pointer flex items-center justify-center hover:bg-[#e8f1fb] transition-colors shrink-0"
        >
          <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {index + 1} / {total}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px] bg-white">
        <div className="w-full max-w-[580px] flex flex-col min-h-full">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
            Courier Registration Guide · {s.label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
            {s.heading}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">
            {s.instruction}
          </p>

          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
            <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
              <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
              <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">
                {s.vlabel}
              </div>
            </div>
            <div
              className="p-[18px] leading-relaxed courier-mock-visual"
              dangerouslySetInnerHTML={{ __html: s.visual }}
            />
          </div>

          {s.note && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">
              {s.note}
            </div>
          )}

          <div className="mt-auto pt-6 flex gap-2.5">
            {!isFirst && (
              <button
                onClick={() => setIndex(index - 1)}
                className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33]"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setIndex(index + 1);
                }
              }}
              className={`flex-1 p-[12px_20px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px active:translate-y-0
                ${isLast ? "bg-[#15744f] text-white hover:bg-[#0e5c3c]" : "bg-primary text-white hover:bg-primary/80 shadow-[0_4px_12px_rgba(47,111,212,0.2)]"}
              `}
            >
              {isLast ? "Done — return to step" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewDayTutOverlay({
  isOpen,
  onClose,
  tutorial,
  index,
  setIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  tutorial: any[];
  index: number;
  setIndex: (i: number) => void;
}) {
  if (!isOpen) return null;

  const s = tutorial[index];
  const total = tutorial.length;
  const progress = ((index + 1) / total) * 100;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-200 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center p-[18px_24px] border-bottom border-[#d0e4f7] gap-4 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] flex items-center justify-center transition-all hover:bg-[#e8f1fb]"
        >
          <X size={16} className="text-[#3a4f63]" />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097]">
          {index + 1} / {total}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-12 sm:px-12">
        <div className="max-w-[580px] mx-auto w-full flex flex-col">
          <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-3.5">
            Interview Day Guide · {s.label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
            {s.heading}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">
            {s.instruction}
          </p>

          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
            <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
              <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
              <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">
                {s.vlabel}
              </div>
            </div>
            <div
              className="p-[18px] leading-relaxed courier-mock-visual"
              dangerouslySetInnerHTML={{ __html: s.visual }}
            />
          </div>

          {s.note && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">
              {s.note}
            </div>
          )}

          <div className="mt-auto pt-6 flex gap-2.5">
            {!isFirst && (
              <button
                onClick={() => setIndex(index - 1)}
                className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33]"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setIndex(index + 1);
                }
              }}
              className={`flex-1 p-[12px_20px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px active:translate-y-0
                ${isLast ? "bg-[#15744f] text-white hover:bg-[#0e5c3c]" : "bg-primary text-white hover:bg-primary/80 shadow-[0_4px_12px_rgba(47,111,212,0.2)]"}
              `}
            >
              {isLast ? "Done — return to step" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApUpdateModal({
  isOpen,
  onClose,
  onSave,
  ceacOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  ceacOptions: string[];
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ceac, setCeac] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 bg-black/40 backdrop-blur-xs flex items-center justify-center p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] w-full max-w-[440px] animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between p-6 pb-0 mb-4">
          <h2 className="text-[20px] text-[#0c1b33]">Log a Case Update</h2>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-full bg-[#f4f7fb] flex items-center justify-center hover:bg-[#e8f1fb] transition-all"
          >
            <X size={13} className="text-[#3a4f63]" />
          </button>
        </div>

        <div className="p-6 pt-0">
          <div className="h-px bg-[#d0e4f7] mb-4" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                Update Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                CEAC Status Observed
              </label>
              <select
                value={ceac}
                onChange={(e) => setCeac(e.target.value)}
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
              >
                <option value="">Select...</option>
                {ceacOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. CEAC still shows AP..."
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all min-height-[70px]"
              />
            </div>

            <button
              onClick={() => {
                onSave({ date, ceac, note, id: Date.now().toString() });
                onClose();
              }}
              className="w-full p-3.5 bg-primary text-white rounded-lg font-bold transition-all hover:bg-primary/90"
            >
              Save Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepView;
