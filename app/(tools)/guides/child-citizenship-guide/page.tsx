"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "../../../components/guides/WizardHeader";
import WizardSidebar from "../../../components/guides/WizardSidebar";
import WizardInfoPanel, { InfoPanelData } from "../../../components/guides/WizardInfoPanel";
import RoadmapStep from "../../../components/guides/steps/RoadmapStep";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import { type WizardState, WizardStepId } from "@/types/guide-wizard";
import guideData from "@/data/child-citizenship-guide-data.json";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Loader } from "@/components/ui/spinner";

import FeedbackButton from "@/app/components/FeedbackButton";
import { useWizardSession } from "@/lib/guides/useWizardSession";
import { useGuideUpload } from "@/lib/guides/useGuideUpload";
import { useGuideSave } from "@/lib/guides/useGuideSave";
import { useGuideFeedback } from "@/lib/guides/useGuideFeedback";
import { NavigationGuard } from "@/lib/guides/useNavigationGuard";
import { useLanguage } from "@/app/context/LanguageContext";

const STEP_IDS: WizardStepId[] = [
  "document_need",
  "roadmap",
  "application_process" as WizardStepId,
  "validation",
];

const STEP_LABELS: Record<string, string> = {
  document_need: "Citizenship Eligibility",
  roadmap: "Required Documents",
  application_process: "Application Process",
  validation: "Review & Finalize",
};

const INFO_PANEL_KEYS: Record<string, string> = {
  document_need: "document_need",
  roadmap: "roadmap",
  application_process: "application_process",
  validation: "validation",
};

type Answers = Record<string, string>;

type OutcomeKey = "birth" | "section320" | "section322" | "review" | "none";

interface EligibilityQuestion {
  id: string;
  label: string | ((a: Answers) => string);
  options: { value: string; label: string; desc?: string }[];
  show?: (a: Answers) => boolean;
}

const QUESTIONS: EligibilityQuestion[] = [
  {
    id: "citizenParent",
    label: "Is at least one of the child's parents a U.S. citizen (by birth or naturalization)?",
    options: [
      { value: "yes", label: "Yes", desc: "One or both parents are U.S. citizens." },
      { value: "no", label: "No", desc: "Neither parent is a U.S. citizen." },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "childAge",
    label: "Is the child currently under 18 years old?",
    options: [
      { value: "under18", label: "Yes, under 18" },
      { value: "adult18plus", label: "No, 18 or older" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "parentsMarried",
    label: "Were the child's parents married to each other when the child was born?",
    options: [
      { value: "yes", label: "Yes, married" },
      { value: "no", label: "No, not married" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "citizenParentCount",
    label: "How many of the child's parents were U.S. citizens when the child was born?",
    options: [
      { value: "both", label: "Both parents" },
      { value: "one", label: "One parent" },
      { value: "unsure", label: "Not sure" },
    ],
    show: (a) => a.parentsMarried === "yes",
  },
  {
    id: "birthDateBand",
    label: "When was the child born?",
    options: [
      { value: "on_after_2001", label: "On or after February 27, 2001" },
      { value: "y1986_2001", label: "Between November 14, 1986 and February 26, 2001" },
      { value: "before_1986", label: "Before November 14, 1986" },
      { value: "unsure", label: "I'm not sure" },
    ],
  },
  {
    id: "residenceOrPresence",
    label: (a) =>
      a.citizenParentCount === "both"
        ? "Did at least one parent have their main home (residence) in the United States before the child was born?"
        : "Before the child was born, had the U.S. citizen parent lived in the United States for at least 5 years, including 2 years after age 14?",
    options: [
      { value: "yes", label: "Yes, the requirement was met" },
      { value: "no", label: "No, it was not met" },
      { value: "unsure", label: "Not sure" },
    ],
    show: (a) => a.parentsMarried === "yes" && (a.citizenParentCount === "both" || a.citizenParentCount === "one"),
  },
  {
    id: "residenceStatus",
    label: "Where does the child currently live?",
    options: [
      {
        value: "us_lpr",
        label: "In the U.S. as a permanent resident",
        desc: "Green card holder living in the U.S. citizen parent's custody.",
      },
      { value: "outside_us", label: "Outside the United States", desc: "For example, living in Pakistan." },
      { value: "unsure", label: "Other / not sure" },
    ],
  },
];

// Dependent keys that must be cleared when their parent answer changes.
const DEPENDENTS: Record<string, string[]> = {
  parentsMarried: ["citizenParentCount", "residenceOrPresence"],
  citizenParentCount: ["residenceOrPresence"],
};

function isEligibilityComplete(a: Answers): boolean {
  const base = !!(a.citizenParent && a.childAge && a.parentsMarried && a.birthDateBand && a.residenceStatus);
  if (!base) return false;
  if (a.parentsMarried === "yes") return !!(a.citizenParentCount && a.residenceOrPresence);
  return true;
}

function computeOutcome(a: Answers): OutcomeKey {
  if (a.citizenParent === "no") return "none";
  if (a.citizenParent === "unsure") return "review";
  if (a.parentsMarried === "unsure" || a.birthDateBand === "unsure" || a.childAge === "unsure") return "review";
  // Out-of-wedlock cases turn on INA § 309 facts this screen does not resolve.
  if (a.parentsMarried === "no") return "review";
  // Pre-1986 births invoke earlier versions of the nationality laws.
  if (a.birthDateBand === "before_1986") return "review";

  let acquiredBirth = false;
  if (!a.citizenParentCount || a.citizenParentCount === "unsure") return "review";

  if (a.citizenParentCount === "both") {
    if (!a.residenceOrPresence || a.residenceOrPresence === "unsure") return "review";
    if (a.residenceOrPresence === "yes") acquiredBirth = true;
    else return "review"; // two citizens, neither resided in the U.S. -> complex edge
  } else {
    if (!a.residenceOrPresence || a.residenceOrPresence === "unsure") return "review";
    if (a.residenceOrPresence === "yes") acquiredBirth = true;
  }

  const under18 = a.childAge === "under18";

  // INA § 320: automatic citizenship for a child under 18 who is an LPR in the citizen parent's custody.
  if (under18 && a.residenceStatus === "us_lpr") return "section320";

  if (acquiredBirth) return "birth";

  // Did not acquire at birth; child under 18 living abroad -> INA § 322 naturalization route.
  if (under18 && a.residenceStatus === "outside_us") return "section322";

  return "review";
}

interface OutcomeMeta {
  tone: "good" | "warn" | "info";
  title: string;
  body: string;
}

function getOutcomeMeta(key: OutcomeKey, a: Answers): OutcomeMeta {
  const under18 = a.childAge === "under18";
  switch (key) {
    case "birth":
      return {
        tone: "good",
        title: "Possible U.S. Citizenship Acquired at Birth",
        body: under18
          ? "Based on your answers, the child may have acquired U.S. citizenship at birth. The usual next step for a child living abroad is to apply for a Consular Report of Birth Abroad (CRBA, Form FS-240) and a U.S. passport through the U.S. Embassy."
          : "You may have acquired U.S. citizenship at birth even though you are now 18 or older. Turning 18 or never applying for a CRBA does not cancel citizenship acquired at birth. Your next step may be to apply for a U.S. passport and/or Form N-600 for a Certificate of Citizenship as evidence.",
      };
    case "section320":
      return {
        tone: "good",
        title: "Possible Automatic Citizenship (INA § 320)",
        body: "A child under 18 who is a Lawful Permanent Resident and lives in the legal and physical custody of a U.S. citizen parent generally becomes a citizen automatically. No separate naturalization filing is required; apply for a U.S. passport and/or Form N-600 as proof of citizenship.",
      };
    case "section322":
      return {
        tone: "good",
        title: "Possible Naturalization Abroad (INA § 322 / Form N-600K)",
        body: "The child may be eligible to acquire citizenship through the U.S. citizen parent even though citizenship was not acquired at birth. This uses Form N-600K with USCIS, requires the child to be temporarily and lawfully admitted to the United States, and must be completed (including the Oath of Allegiance) before the child turns 18.",
      };
    case "review":
      return {
        tone: "warn",
        title: "Further Review Recommended",
        body: "U.S. citizenship transmission rules have changed over time and depend on fact-specific details such as the parents' marital status, dates of birth, and physical-presence history. Your answers involve one of these situations, so this screen cannot reliably determine eligibility. Please review the official guidance below, and consider consulting an immigration professional.",
      };
    case "none":
      return {
        tone: "info",
        title: "Does Not Appear to Acquire Citizenship Through a Parent",
        body: "Based on your answers, the child does not appear to have a U.S. citizen parent, so citizenship would not be acquired or transmitted through a parent. Other immigration routes may still exist. This is a general screening result, not a final determination.",
      };
  }
}

const ChildCitizenshipGuidePage = () => {
  const { isUrdu } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(
    typeof window !== "undefined" && localStorage.getItem("dont_show_child_citizenship_welcome") === "true"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [navigationHandled, setNavigationHandled] = useState(false);

  const [state, setState] = useState<WizardState>({
    documentNeed: {},
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

  const [isUploading, setIsUploading] = useState(false);
  const hasInitializedModal = useRef(false);

  const { saveWizardStep, session, loading } = useWizardSession(
    "child-citizenship-guide",
    state,
    setState,
    STEP_IDS as string[],
    setCurrentStep,
    (prev, stepsData) => {
      const docNeed = stepsData.document_need || prev.documentNeed;
      const checkedDocs = stepsData.roadmap?.checkedDocuments || prev.checkedDocuments;
      const valChecks = stepsData.validation?.checks || prev.validationChecks;
      const uploaded = stepsData.validation?.uploaded || prev.uploadedFile;

      return {
        ...prev,
        documentNeed: typeof docNeed === "string" ? JSON.parse(docNeed) : docNeed,
        checkedDocuments: checkedDocs,
        validationChecks: valChecks,
        uploadedFile: uploaded,
      };
    }
  );

  const { uploadFile: uploadFileHook } = useGuideUpload();
  const { submitFeedback: submitFeedbackHook } = useGuideFeedback();
  const { saveGuide, saving } = useGuideSave();

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadFileHook(file, "child-citizenship-guide", "validation");
      setState((s) => ({ ...s, uploadedFile: true }));
      saveWizardStep("validation", {
        checks: state.validationChecks,
        uploaded: true,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitFeedback = async (
    feedbackType: string,
    description: string,
    attachment?: File
  ) => {
    await submitFeedbackHook(
      "child-citizenship-guide",
      currentStepId as string,
      feedbackType,
      description,
      attachment
    );
  };

  const answers = (state.documentNeed as Answers) || {};
  const eligibilityComplete = isEligibilityComplete(answers);
  const outcome: OutcomeKey | null = eligibilityComplete ? computeOutcome(answers) : null;

  const currentStepId = STEP_IDS[currentStep];

  // Compute fee structure based on outcome
  const feeStructureForInfoPanel = useMemo(() => {
    if (currentStepId !== "application_process") return null;
    
    const getRoadmapKey = (): string => {
      if (!outcome || outcome === "review" || outcome === "none") {
        return "crba_route";
      }
      if (outcome === "birth") return "crba_route";
      if (outcome === "section320") return "automatic_citizenship_route";
      if (outcome === "section322") return "n600k_route";
      return "crba_route";
    };

    const roadmapKey = getRoadmapKey();
    const roadmapData = (guideData.wizard.roadmaps as any)[roadmapKey];

    if (roadmapData?.fees) {
      return {
        title: "Official Fees",
        tiers: roadmapData.fees.map((fee: any) => ({
          type: fee.label,
          price: fee.amount,
          days: fee.note,
          badge_variant: "blue",
        })),
      };
    }
    return null;
  }, [currentStepId, outcome]);

  const hasProgress = useMemo(() => {
    return (
      currentStep > 0 ||
      Object.keys(answers).length > 0 ||
      state.checkedDocuments.length > 0 ||
      state.validationChecks.length > 0 ||
      state.uploadedFile
    );
  }, [currentStep, state, answers]);

  useEffect(() => {
    if (!session) return;
    if (hasInitializedModal.current) return;
    hasInitializedModal.current = true;

    const localHide =
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_child_citizenship_welcome") === "true";

    if (!session.hide_intro_modal && !localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [session]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_child_citizenship_welcome", "true");
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((currentStep > 0 || Object.keys(answers).length > 0) && !isSaved) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentStep, state.documentNeed, isSaved, answers]);

  const infoPanelKey = INFO_PANEL_KEYS[currentStepId as string];
  const baseInfoPanelData = (guideData.wizard.info_panel as any)[
    infoPanelKey
  ] as unknown as InfoPanelData;

  // Add fee structure to info panel when on application_process step
  const infoPanelData: InfoPanelData = feeStructureForInfoPanel
    ? {
        ...baseInfoPanelData,
        fee_structure: feeStructureForInfoPanel,
      }
    : baseInfoPanelData;

  const canGoNext = (): boolean => {
    switch (currentStepId) {
      case "document_need":
        return eligibilityComplete;
      case "roadmap":
      case "application_process":
      case "translation_standards":
        return true;
      case "validation":
        return false;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEP_IDS.length - 1 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEligibilitySelect = (qId: string, optId: string) => {
    const prevAnswers = (state.documentNeed as Answers) || {};
    const newAnswers: Answers = { ...prevAnswers, [qId]: optId };
    // Clear dependent answers that are no longer relevant.
    (DEPENDENTS[qId] || []).forEach((dep) => {
      const parentVal = newAnswers[qId];
      const stillShown =
        dep === "citizenParentCount"
          ? parentVal === "yes"
          : dep === "residenceOrPresence"
            ? newAnswers.parentsMarried === "yes" &&
              (newAnswers.citizenParentCount === "both" || newAnswers.citizenParentCount === "one")
            : true;
      if (!stillShown) delete newAnswers[dep];
    });
    setState((s) => ({ ...s, documentNeed: newAnswers }));
    saveWizardStep("document_need", JSON.stringify(newAnswers));
  };

  const handleToggleDoc = (docId: string) => {
    const newDocs = state.checkedDocuments.includes(docId)
      ? state.checkedDocuments.filter((d) => d !== docId)
      : [...state.checkedDocuments, docId];
    setState((s) => ({ ...s, checkedDocuments: newDocs }));
    saveWizardStep("roadmap", { checkedDocuments: newDocs });
  };

  const handleToggleValidationCheck = (label: string) => {
    const newChecks = state.validationChecks.includes(label)
      ? state.validationChecks.filter((c) => c !== label)
      : [...state.validationChecks, label];
    setState((s) => ({ ...s, validationChecks: newChecks }));
    saveWizardStep("validation", {
      checks: newChecks,
      uploaded: state.uploadedFile,
    });
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case "document_need":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Screen for Citizenship Through a U.S. Citizen Parent
              </h2>
              <p className="text-sm text-slate-500">
                U.S. citizenship can be acquired at birth, granted automatically, or obtained
                through naturalization. Answer these questions to see which pathway may apply.
              </p>
            </div>

            {QUESTIONS.filter((q) => !q.show || q.show(answers)).map((q, idx) => {
              const label = typeof q.label === "function" ? q.label(answers) : q.label;
              const cols = q.options.length >= 4 ? "sm:grid-cols-2" : "sm:grid-cols-3";
              return (
                <div key={q.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                  <h3 className="mb-4 flex items-start gap-2 text-base font-bold text-slate-800">
                    <span className="mt-0.5 flex h-6 min-h-6 w-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs leading-none font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-6">{label}</span>
                  </h3>
                  <div className={`grid grid-cols-1 gap-4 ${cols}`}>
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleEligibilitySelect(q.id, opt.value)}
                          className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-250 ${
                            selected
                              ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                          {opt.desc && (
                            <span className="text-xs leading-normal text-slate-500">{opt.desc}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <AnimatePresence mode="wait">
              {outcome &&
                (() => {
                  const meta = getOutcomeMeta(outcome, answers);
                  const toneStyles =
                    meta.tone === "good"
                      ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                      : meta.tone === "warn"
                        ? "border-amber-200 bg-amber-50/40 text-amber-900"
                        : "border-blue-200 bg-blue-50/40 text-blue-900";
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`flex gap-4 rounded-2xl border p-5 ${toneStyles}`}>
                        <div className="mt-0.5">
                          {meta.tone === "good" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="text-sm font-bold">{meta.title}</span>
                          <span className="text-xs leading-relaxed opacity-90">{meta.body}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>
        );

      case "roadmap": {
        const baseDocs = [
          {
            id: "child_birth_cert",
            name: "Child's Birth Certificate",
            desc: "NADRA / Union Council / CBRC birth certificate showing the child's name, date of birth, and parents' names.",
            required: true,
          },
          {
            id: "parent_citizenship_proof",
            name: "Proof of the U.S. Citizen Parent's Citizenship",
            desc: "U.S. birth certificate, U.S. passport, or Certificate of Naturalization for the U.S. citizen parent.",
            required: true,
          },
          {
            id: "parent_presence_evidence",
            name: "Evidence of the Parent's Physical Presence or Residence",
            desc: "Old passports with entry/exit stamps, U.S. school or employment records, tax returns, leases, or medical records showing time spent in the United States.",
            required: true,
          },
          {
            id: "parents_marriage_cert",
            name: "Parents' Marriage Certificate / Nikah Nama",
            desc: "Marriage documentation for married-parent cases; attest it where the embassy requires it.",
            required: answers.parentsMarried === "yes",
          },
          {
            id: "identity_docs",
            name: "Identity Documents & Photographs",
            desc: "Valid passports or CNICs for the child and parents, plus passport-style photographs of the child.",
            required: true,
          },
        ];

        const outcomeDocs: Record<OutcomeKey, { id: string; name: string; desc: string; required: boolean }[]> = {
          birth: [
            {
              id: "crba_application",
              name: "CRBA Application (DS-2029) & Appointment",
              desc: "For a child under 18 abroad: the Consular Report of Birth Abroad application and U.S. Embassy appointment confirmation. For a person 18 or older: U.S. passport application and/or Form N-600.",
              required: true,
            },
          ],
          section320: [
            {
              id: "green_card",
              name: "Child's Permanent Resident Card (I-551)",
              desc: "Evidence that the child is a Lawful Permanent Resident of the United States.",
              required: true,
            },
            {
              id: "custody_evidence",
              name: "Proof of Custody & Age",
              desc: "Evidence the child is under 18 and in the legal and physical custody of the U.S. citizen parent.",
              required: true,
            },
            {
              id: "adoption_final_order",
              name: "Final Adoption Order (If Applicable)",
              desc: "If the child was adopted by the U.S. citizen parent, provide the final adoption decree.",
              required: false,
            },
          ],
          section322: [
            {
              id: "n600k",
              name: "Form N-600K",
              desc: "Application for Citizenship and Issuance of Certificate under Section 322, filed with USCIS.",
              required: true,
            },
            {
              id: "temporary_admission",
              name: "Evidence of Lawful Temporary Admission",
              desc: "Records showing the child was temporarily and lawfully admitted to the United States for the naturalization process.",
              required: true,
            },
            {
              id: "grandparent_presence",
              name: "Grandparent Presence / Parent Death Record",
              desc: "If the U.S. citizen parent is deceased, a qualifying U.S. citizen grandparent or legal guardian may file; include the parent's death certificate and the grandparent's physical-presence evidence.",
              required: false,
            },
          ],
          review: [],
          none: [],
        };

        const docList = [...baseDocs, ...(outcome ? outcomeDocs[outcome] : [])];

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Compile Your Documents
              </h2>
              <p className="text-sm text-slate-500">
                Gather the records below to support the citizenship pathway you were routed to. Check
                off each document as you acquire it.
              </p>
            </div>

            {(!outcome || outcome === "review" || outcome === "none") && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-amber-900">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed">
                  Showed the base documents because the screening did not identify a single clear
                  pathway. Complete the eligibility questions for a pathway-specific list.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {docList.map((doc) => {
                const isChecked = state.checkedDocuments.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleToggleDoc(doc.id)}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                      isChecked
                        ? "border-teal-500/40 bg-teal-50/15"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isChecked
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <span
                          className={`text-sm font-bold ${isChecked ? "text-teal-900" : "text-slate-800"}`}
                        >
                          {doc.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                            doc.required ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {doc.required ? "Required" : "If Applicable"}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${isChecked ? "text-slate-600" : "text-slate-500"}`}
                      >
                        {doc.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "application_process": {
        // Determine which roadmap to show based on eligibility outcome
        const getRoadmapKey = (): string => {
          if (!outcome || outcome === "review" || outcome === "none") {
            return "crba_route"; // Default fallback
          }
          if (outcome === "birth") {
            return "crba_route";
          }
          if (outcome === "section320") {
            return "automatic_citizenship_route";
          }
          if (outcome === "section322") {
            return "n600k_route";
          }
          return "crba_route";
        };

        const roadmapKey = getRoadmapKey();
        const roadmapData = (guideData.wizard.roadmaps as any)[roadmapKey];

        if (!roadmapData) {
          return (
            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
              <div>
                <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                  Application Process
                </h2>
                <p className="text-sm text-red-600">
                  No roadmap data available. Please complete the eligibility screening first.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            {/* Route Indicator */}
            {outcome && outcome !== "review" && outcome !== "none" && (
              <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  <div>
                    <h4 className="text-sm font-bold text-teal-900">
                      {getOutcomeMeta(outcome, answers).title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-teal-800">
                      Based on your eligibility answers, this is your suggested application pathway. 
                      You can expand other routes below to compare alternatives.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Roadmap */}
            <RoadmapStep
              data={roadmapData}
              checkedDocuments={state.checkedDocuments}
              onToggleDocument={handleToggleDoc}
              hideDocuments={true}
              onsiteTitle="Application Process"
            />

            {/* Alternative Routes Info */}
            {outcome && outcome !== "review" && outcome !== "none" && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h4 className="mb-1 text-sm font-bold text-slate-800">Need to See Other Routes?</h4>
                <p className="text-xs leading-relaxed text-slate-500">
                  This application process is tailored to your eligibility answers. If your situation changes or you want to explore alternatives, you can go back to the eligibility step and adjust your answers to view different pathways.
                </p>
              </div>
            )}
          </div>
        );
      }

      case "validation": {
        const checkItems = [
          "The child's name, date of birth, and parents' names are consistent across every document.",
          "Proof of the U.S. citizen parent's citizenship is included.",
          "Evidence of the parent's physical presence or residence in the U.S. is attached.",
          "Certified English translations accompany every non-English document.",
          "The correct application was identified for the pathway (CRBA / passport, N-600, or N-600K).",
        ];
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-300">
            <div>
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Review &amp; Finalize
              </h2>
              <p className="text-sm text-slate-500">
                Run through this final checklist before you compile and submit your packet.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Final Checklist
              </span>
              <div className="flex flex-col gap-3">
                {checkItems.map((item, idx) => {
                  const isChecked = state.validationChecks.includes(item);
                  return (
                    <label
                      key={idx}
                      className="flex cursor-pointer items-start gap-3 text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleValidationCheck(item)}
                        className="mt-1 h-4 w-4 cursor-pointer rounded accent-teal-600"
                      />
                      <span className="text-xs leading-relaxed">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 text-red-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-bold">Important Reminder</span>
                <span className="text-xs leading-relaxed opacity-90">
                  This guide is a general screening tool based on published U.S. law, not legal
                  advice. Meeting the criteria shown here does not guarantee a determination of
                  citizenship; the reviewing U.S. government office makes the final decision.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Official Sources
              </span>
              {(guideData.wizard.info_panel as any).validation.links.map(
                (link: { label: string; url: string }) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-teal-700 underline hover:text-teal-800"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>
          </div>
        );
      }

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
    <div
      className={`flex min-h-screen flex-col bg-gray-50 pt-26 ${isUrdu ? "font-urdu-body" : ""}`}
    >
      <WizardHeader onWhatsThis={() => setShowWhatsThis(true)} title={guideData.wizard.title} />

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-[320px_minmax(0,1fr)_350px] xl:items-start xl:gap-6">
        <WizardSidebar
          currentStep={STEP_IDS.indexOf(currentStepId)}
          steps={STEP_IDS}
          onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
          stepLabels={STEP_LABELS}
          guideSlug="child-citizenship-guide"
          onSaveGuide={saveGuide}
          onGuideSaved={() => setIsSaved(true)}
          saving={saving}
          session={session}
          highestReachedStep={highestReachedStep}
        />

        <main className="relative flex min-w-0 flex-col items-center justify-center p-4 sm:p-6 xl:items-start xl:justify-start xl:overflow-y-auto">
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              backgroundImage:
                "linear-gradient(hsl(168 80% 30% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(168 80% 30% / 0.02) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 flex min-h-[500px] w-full flex-col items-center justify-start xl:items-start">
            <div className="w-full max-w-full md:max-w-3xl">
              <div className="flex min-h-[420px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                <div>{renderStepContent()}</div>

                <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                  {currentStep > 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goBack}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden md:inline-block">Back</span>
                    </motion.button>
                  ) : (
                    <div />
                  )}

                  <span className="text-xs font-semibold text-slate-400">
                    Step {currentStep + 1} of {STEP_IDS.length}
                  </span>

                  {currentStep < STEP_IDS.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                        canGoNext()
                          ? "cursor-pointer bg-linear-to-br from-teal-600 to-teal-500 text-white shadow-sm hover:from-teal-700 hover:to-teal-600"
                          : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                      } `}
                    >
                      <span className="hidden md:inline-block">Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <WizardInfoPanel
          data={infoPanelData}
          lastVerified={guideData.wizard.last_verified}
          guideData={guideData as any}
          guideType="other"
        />
      </div>

      <NarrativeModal
        isOpen={showWhatsThis}
        onClose={handleCloseIntro}
        onComplete={handleCloseIntro}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        variant="child-citizenship"
      />

      <NavigationGuard
        shouldBlock={hasProgress && !isSaved}
        onSave={async () => {
          await saveGuide("child-citizenship-guide");
          setIsSaved(true);
        }}
        navigationHandled={navigationHandled}
        setNavigationHandled={setNavigationHandled}
      />

      <FeedbackButton
        steps={Object.values(STEP_LABELS)}
        currentStepName={STEP_LABELS[currentStepId as string] || ""}
        onSubmit={handleSubmitFeedback}
      />

      {isUploading && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-xs text-white shadow-lg">
          Uploading…
        </div>
      )}
    </div>
  );
};

export default ChildCitizenshipGuidePage;
