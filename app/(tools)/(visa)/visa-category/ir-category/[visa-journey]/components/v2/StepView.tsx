"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  FileText,
  ShieldCheck,
  User,
  Search,
  MessageSquare,
  Scale,
  Globe,
  ClipboardList,
  Lock,
  Check,
  Book,
  Wallet,
  Camera,
  FileCheck,
  X,
  Mail,
  ExternalLink,
} from "lucide-react";

import { RoadmapData, QuestSuite } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { QuestRenderer } from "./QuestRenderer";
import { getAllActiveSteps } from "./journeyHelpers";
import CredentialFormModal from "@/app/(main)/portal-wallet/components/CredentialFormModal";
import ViewCredentialModal from "@/app/(main)/portal-wallet/components/ViewCredentialModal";
import { toast } from "sonner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { InlineGuideData } from "./InlineGuideData";
import { USCIS_TUTORIAL_STEPS } from "./UscisTutorialData";

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

export function StepView({ data, state, actions, onBack }: StepViewProps) {
  const [completeFlash, setCompleteFlash] = useState(false);
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
  const [isSubmittingCreds, setIsSubmittingCreds] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialIdx, setTutorialIdx] = useState(0);

  const currentStage = data.stages[state.currentStage];

  const activeStepsInStage = useMemo(() => {
    const filingMethod = state.metadata.filingMethod || "online";
    return currentStage.steps.filter(
      (step) =>
        !step.branch || step.branch === "both" || step.branch === filingMethod,
    );
  }, [currentStage, state.metadata.filingMethod]);

  const currentStep = currentStage?.steps[state.currentStep || 0];
  const isCompleted = state.completedSteps.has(currentStep?.id || "");

  const allActiveSteps = useMemo(
    () => getAllActiveSteps(data, state.metadata.filingMethod),
    [data, state.metadata.filingMethod],
  );

  const globalIdx = allActiveSteps.findIndex((s) => s.id === currentStep?.id);
  const prevStep = globalIdx > 0 ? allActiveSteps[globalIdx - 1] : null;
  const nextStep =
    globalIdx < allActiveSteps.length - 1
      ? allActiveSteps[globalIdx + 1]
      : null;
  const progressPct = Math.round((globalIdx / allActiveSteps.length) * 100);
  const activeIdxInStage = activeStepsInStage.findIndex(
    (s) => s.id === currentStep?.id,
  );

  useEffect(() => {
    const scrollContainer = document.querySelector(".scrollbar-hide");
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }, [currentStep?.id]);

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
        setUscisCredentials(uscis || null);
      }
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials, currentStep?.id]);

  // Disable body scroll when overlays are open
  useEffect(() => {
    if (isTutorialOpen || selectedGuideId || showQuiz) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isTutorialOpen, selectedGuideId, showQuiz]);

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

      if (data.portalType === "USCIS" && currentStep?.id === "I-06") {
        if (!isCompleted) actions.toggleComplete("I-06");
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
        portalType: "USCIS",
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
        portalType: "USCIS",
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
      setUscisCredentials(null);
      setIsWalletViewOpen(false);
    } catch {
      toast.error("Failed to delete credentials.");
    } finally {
      setIsSubmittingCreds(false);
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
    const quiz = currentStep.filingData?.quiz;
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
    if (!isCompleted) {
      setCompleteFlash(true);
      setTimeout(() => setCompleteFlash(false), 800);
    }
    actions.toggleComplete(currentStep.id);
  };

  const handleNavigate = (stepId: string) => {
    for (let sIdx = 0; sIdx < data.stages.length; sIdx++) {
      const spIdx = data.stages[sIdx].steps.findIndex((s) => s.id === stepId);
      if (spIdx !== -1) {
        actions.setStage(sIdx);
        actions.setCurrentStep(spIdx);
        return;
      }
    }
  };

  const renderToolStep = () => {
    const tool = currentStep.toolData;
    if (!tool) return null;

    // Theme detection based on icon or ID
    const isBeneficiaryTheme =
      tool.launchModule.icon === "user" || currentStep.id === "I-05";
    const accentColor = "#2f6fd4";
    // const accentColor = isBeneficiaryTheme ? "#0f7373" : "#2f6fd4";
    const launchBg = isBeneficiaryTheme ? "#12192e" : "#0e1e38";
    const stripeGradient = isBeneficiaryTheme
      ? "linear-gradient(90deg, #2f6fd4 0%, #20a8a8 55%, transparent 100%)"
      : "linear-gradient(90deg, #2f6fd4 0%, #6aa8f0 60%, transparent 100%)";

    const IconComponent =
      tool.launchModule.icon === "form"
        ? FileText
        : tool.launchModule.icon === "calc"
          ? Scale
          : tool.launchModule.icon === "search"
            ? Search
            : tool.launchModule.icon === "user"
              ? User
              : tool.launchModule.icon === "shield"
                ? ShieldCheck
                : CheckCircle2;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-740 flex flex-col items-center w-full bg-[#f4f7fb] min-h-full">
        {/* Page Shell */}
        <div className="w-full max-w-[680px] pt-[52px] px-[24px] pb-[96px] flex flex-col">
          {/* Eyebrow / Breadcrumb Row */}
          <div className="flex items-center gap-[8px] mb-[6px]">
            <span className="text-[11px] font-[600] uppercase tracking-[0.12em] text-[#636b97]">
              Chapter 1 · USCIS Petition Filing
            </span>
            <span className="text-[11px] text-[#b8d4f0]">›</span>
            <span
              className={`text-[11px] font-[600] uppercase tracking-[0.08em] ${
                isBeneficiaryTheme ? "text-[#0f7373]" : "text-[#2f6fd4]"
              }`}
            >
              {currentStep.name}
            </span>
          </div>

          {/* Title + Description */}
          <h1
            className="text-[clamp(28px,4.5vw,38px)] font-black text-[#0c1b33] leading-[1.15] tracking-[-0.01em] mb-[12px]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {currentStep.name}
          </h1>

          {currentStep.description && (
            <p className="text-[#3a4f63] text-[15px] leading-[1.7] mb-[24px] max-w-[480px]">
              {currentStep.description}
            </p>
          )}

          {/* Companion Context Badge (Step 5 Specific) */}
          {currentStep.id === "I-05" && (
            <div className="flex items-center gap-[9px] mb-[22px]">
              <div className="flex-1 h-[1px] bg-linear-to-r from-[#d0e4f7] to-transparent" />
              <div className="inline-flex items-center gap-[6px] bg-[#e6f6f6] border border-[#9fd8d8] rounded-full px-[13px] py-[5px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#0f7373]" />
                <span className="text-[11px] font-[600] text-[#0f7373] tracking-[0.04em] whitespace-nowrap">
                  Companion form to I-130 · Beneficiary spouse focus
                </span>
              </div>
              <div className="flex-1 h-[1px] bg-linear-to-l from-[#d0e4f7] to-transparent" />
            </div>
          )}

          {/* Meta Chips */}
          <div className="flex flex-wrap gap-[7px] mb-[44px]">
            {tool.chips ? (
              tool.chips.map((chip, i) => (
                <span
                  key={i}
                  className={`text-[11px] font-[600] uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border ${
                    chip.type === "role"
                      ? isBeneficiaryTheme
                        ? "bg-[#e9f4ee] text-[#1a5f3f] border-[#b0dcc0]"
                        : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                      : chip.type === "tool"
                        ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                        : chip.type === "uscis" || chip.type === "path"
                          ? "bg-[#fafcff] text-[#6b8097] border-[#d0e4f7]"
                          : "bg-[#fafcff] text-[#6b8097] border-[#d0e4f7]"
                  }`}
                >
                  {chip.label}
                </span>
              ))
            ) : (
              <>
                <span
                  className={`text-[11px] font-[600] uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border ${
                    isBeneficiaryTheme
                      ? "bg-[#e9f4ee] text-[#1a5f3f] border-[#b0dcc0]"
                      : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                  }`}
                >
                  {isBeneficiaryTheme ? "Beneficiary" : "Petitioner"}
                </span>
                <span className="text-[11px] font-[600] uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]">
                  Rahvana Tool
                </span>
                <span className="text-[11px] font-[600] uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border bg-[#fafcff] text-[#6b8097] border-[#d0e4f7]">
                  Opens in new tab
                </span>
              </>
            )}
          </div>

          {/* Return Note (Success Banner) */}
          {isLaunched && (
            <div className="mb-[20px] bg-[#e8f5ef] border border-[#a8d9be] rounded-[10px] p-[14px_18px] flex items-start gap-[12px] animate-in slide-in-from-top-2 duration-380 fill-mode-both">
              <div className="text-[16px] mt-[1px] text-[#15744f]">✓</div>
              <div className="flex-1">
                <div className="text-[13px] font-[600] text-[#15744f] mb-[2px]">
                  {currentStep.id === "I-06"
                    ? "USCIS account page opened in a new tab"
                    : "Tool launched in a new tab"}
                </div>
                <div className="text-[12px] text-[#3a4f63] leading-[1.5]">
                  {currentStep.id === "I-06"
                    ? "Complete the sign-up there, then return here to save your credentials."
                    : "Complete the form at your own pace. Return here when you're done to continue the roadmap."}
                </div>
              </div>
            </div>
          )}

          {/* PRIMARY LAUNCH MODULE */}
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
                  <div className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/35 mb-[5px]">
                    {tool.launchModule.eyebrow}
                  </div>
                  <h2
                    className="text-[clamp(20px,3vw,24px)] font-serif text-white/90 leading-[1.25]"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {tool.launchModule.heading}
                  </h2>
                </div>
              </div>

              <div className="h-[1px] bg-white/9 mb-[22px]" />

              {/* Feature Cues Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-[30px]">
                {tool.launchModule.features.map((feat, i) => (
                  <div
                    key={i}
                    className="bg-white/6 border border-white/10 rounded-[10px] p-[12px_14px] flex items-start gap-[10px]"
                  >
                    <div
                      className={`w-[5px] h-[5px] rounded-full mt-[6px] shrink-0 ${
                        isBeneficiaryTheme ? "bg-[#20a8a8bf]" : "bg-[#6aa8f0b3]"
                      }`}
                    />
                    <div className="text-[14px] text-white/55 font-semibold leading-[1.45]">
                      {feat}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Area */}
              <div className="flex flex-col gap-[12px]">
                <button
                  onClick={() => {
                    if (tool.launchModule.href) {
                      window.open(
                        tool.launchModule.href,
                        "_blank",
                        "noopener,noreferrer",
                      );
                      setIsLaunched(true);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-[10px] w-full p-[17px_28px] text-white rounded-[12px] font-sans text-[15px] font-semibold tracking-[0.01em] shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)] transition-all duration-220 group cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>{tool.launchModule.buttonLabel}</span>
                  <div className="transition-transform duration-220 group-hover:translate-x-[2px]">
                    <ArrowRight size={16} strokeWidth={2} />
                  </div>
                </button>

                <div className="flex items-center justify-center gap-[5px] text-[12px] text-white/35 text-center leading-[1.4]">
                  <ExternalLink size={11} strokeWidth={1.8} />
                  <span>
                    Opens in a new browser tab — you can return to the roadmap
                    anytime
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SUPPORT LAYER (Step 4 & 5 ONLY) */}
          {currentStep.id !== "I-06" &&
            tool.supportCards &&
            tool.supportCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-[32px]">
                {tool.supportCards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[16px_18px]"
                  >
                    <div className="text-[10px] font-[700] uppercase tracking-[0.1em] text-[#6b8097] mb-[10px]">
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
          {currentStep.id === "I-06" && (
            <div className="flex flex-col mb-[28px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[12px]">
                {/* Tutorial Card */}
                <button
                  onClick={() => {
                    setTutorialIdx(0);
                    setIsTutorialOpen(true);
                  }}
                  className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-[#2f6fd4] hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-[1px] transition-all cursor-pointer select-none flex flex-col"
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
                    Step-by-Step Account Setup Guide
                  </h3>
                  <p className="text-[12px] text-[#6b8097] leading-[1.5]">
                    Walk through the USCIS account creation process screen by
                    screen.
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-[#2f6fd4]">
                    <span>View guide</span>
                    <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </button>

                {/* Credentials Card (Toggle Unsaved/Saved) */}
                {uscisCredentials ? (
                  /* Saved Card */
                  <button
                    onClick={() => setIsWalletViewOpen(true)}
                    className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-[20px] text-left group hover:border-[#15744f] hover:shadow-[0_4px_20px_rgba(21,116,79,0.1)] hover:-translate-y-[1px] transition-all cursor-pointer select-none flex flex-col"
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
                    <p className="text-[12px] text-[#6b8097] leading-[1.5]">
                      USCIS credentials are stored in your Portal Wallet.
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-[#15744f]">
                      <span>View saved credentials</span>
                      <ArrowRight size={11} strokeWidth={2} />
                    </div>
                  </button>
                ) : (
                  /* Unsaved Card */
                  <button
                    onClick={() => setIsWalletFormOpen(true)}
                    className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-[#2f6fd4] hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-[1px] transition-all cursor-pointer select-none flex flex-col"
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
                      Save USCIS Credentials
                    </h3>
                    <p className="text-[12px] text-[#6b8097] leading-[1.5]">
                      Securely store your USCIS login details in Rahvana&apos;s
                      Portal Wallet.
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-[#2f6fd4]">
                      <span>Open credential vault</span>
                      <ArrowRight size={11} strokeWidth={2} />
                    </div>
                  </button>
                )}
              </div>

              {/* Detailed View (Below Row, Only when saved) */}
              {uscisCredentials && (
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-5 flex flex-col">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#15744f] mb-[10px]">
                    USCIS Credentials — Saved
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]">
                      <span className="text-[12px] text-[#3a4f63] font-medium">
                        Username / Email
                      </span>
                      <span className="text-[12px] text-[#1c2b3a] font-semibold font-mono">
                        {uscisCredentials.username}
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
                        {uscisCredentials.security_questions.length} saved
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsWalletFormOpen(true)}
                    className="inline-flex items-center gap-[5px] mt-[12px] text-[12px] font-semibold text-[#15744f] hover:underline cursor-pointer w-fit"
                  >
                    <span>Edit or update in Portal Wallet</span>
                    <ExternalLink size={11} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[8px]">
            Rahvana provides structured guidance only. This is not legal advice.
            <br />
            Consult a licensed immigration attorney for case-specific decisions.
          </p>
        </div>
      </div>
    );
  };

  if (!currentStep) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-[64px] border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between px-5 md:px-8 shrink-0 z-40 shadow-sm sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6b8097] leading-none mb-1 px-0.5">
              Chapter {state.currentStage + 1} ·{" "}
              {activeIdxInStage !== -1
                ? `Step ${activeIdxInStage + 1}`
                : currentStep.id}
            </div>
            <h1 className="text-[15px] md:text-[16px] font-bold text-[#0f1f38] leading-none truncate max-w-[180px] md:max-w-md tracking-tight">
              {currentStep.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-2 px-5 py-2 rounded-full border-[1.5px] transition-all font-bold text-[12px] shadow-sm animate-in fade-in duration-300
              ${isCompleted ? "bg-[#eaf7f2] border-[#b5e0d0] text-[#1a7a5e]" : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:bg-[#fafcff] hover:border-[#3b7dd8] hover:text-[#3b7dd8]"} 
              ${completeFlash ? "scale-105 ring-6 ring-emerald-50 border-emerald-300 shadow-xl" : ""}`}
          >
            <Check size={15} strokeWidth={3} />
            <span>{isCompleted ? "Completed" : "Complete Step"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center relative ${
          currentStep.type === "quest" ? "" : "p-6 md:p-10 lg:p-12"
        }`}
      >
        {/* Quiz Overlay Refinement - Now absolute below headers */}
        {showQuiz && (
          <div className="absolute inset-0 z-50 bg-[#fafcff] animate-in slide-in-from-bottom-[20px] fade-in duration-[0.28s] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col font-sans">
            <header className="h-[64px] border-b border-[#e1eefc] bg-white flex items-center px-[24px] shrink-0 gap-[32px]">
              <button
                onClick={() => setShowQuiz(false)}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-slate-50 text-slate-400 hover:text-slate-600"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              <div className="flex-1">
                <div className="h-[4px] w-full bg-[#e1eefc] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: quizResult
                        ? "100%"
                        : `${((quizScreenIdx + 1) / (currentStep.filingData?.quiz?.screens.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-[12px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                {quizResult
                  ? "Done"
                  : `${quizScreenIdx + 1} / ${currentStep.filingData?.quiz?.screens.length}`}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto flex flex-col items-center bg-[#fafcff] p-[48px_24px_32px]">
              <div className="w-full max-w-[560px] flex flex-col items-center">
                {!quizResult ? (
                  (() => {
                    const screen =
                      currentStep.filingData?.quiz?.screens[quizScreenIdx];
                    if (!screen) return null;
                    const selVal = quizAnswers[screen.id]?.value;
                    return (
                      <div className="animate-in fade-in slide-in-from-right-[10px] duration-[0.22s] ease-out w-full">
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#3b7dd8] mb-[14px]">
                          Step 3 · Decide Filing Method
                        </div>
                        <h2 className="text-[clamp(20px,3.5vw,26px)] font-serif text-[#0f1f38] mb-[10px] leading-[1.35]">
                          {screen.question}
                        </h2>
                        <p className="text-[#3a4f63] text-[14px] leading-[1.6] mb-[28px]">
                          {screen.helper}
                        </p>

                        <div className="flex flex-col gap-[10px] mb-[24px]">
                          {screen.options.map((opt) => (
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
                              className={`w-full p-[16px_20px] rounded-[14px] border-[1.5px] text-left transition-all duration-[0.22s] flex items-start gap-[14px] select-none
                                      ${selVal === opt.value ? "border-[#3b7dd8] bg-[rgba(59,125,216,0.15)] shadow-[0_0_0_3px_rgba(59,125,216,0.12)]" : "border-[#d0e4f7] bg-[#fafcff] hover:border-[#3b7dd8] hover:bg-[rgba(59,125,216,0.15)]"}`}
                            >
                              <div
                                className={`w-[20px] h-[20px] mt-[1px] rounded-full border-[2px] flex items-center justify-center shrink-0 transition-colors duration-[0.22s] ${selVal === opt.value ? "border-[#3b7dd8] bg-[#3b7dd8]" : "border-[#d0e4f7]"}`}
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
                              ? "bg-[#3b7dd8] text-white hover:bg-[#2d4a6e] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(59,125,216,0.28)]"
                              : "bg-[#d0e4f7] text-[#6b8097] cursor-not-allowed opacity-50"
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

                    <h2 className="text-[clamp(22px,3.5vw,28px)] font-serif text-[#0f1f38] mb-[10px] leading-[1.3] text-center w-full">
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
                              <span className="text-[14px] text-[#3a4f63] leading-[1.5]">
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
                          className={`flex flex-col relative w-full p-[18px_20px] text-left rounded-[14px] border-[2px] transition-all duration-[0.2s] group select-none hover:-translate-y-[1px]
                          ${quizResult.emphasize === "online" || quizResult.type === "lean-online" ? "bg-[#f0faf6] border-[#8ecdb8] hover:bg-[#0e5c42] hover:border-[#0a4330]" : "bg-white border-[#d0e4f7] hover:border-[#3b7dd8]"}`}
                        >
                          <div
                            className={`text-[10px] font-bold tracking-[0.09em] uppercase mb-[6px] transition-colors
                            ${quizResult.emphasize === "online" || quizResult.type === "lean-online" ? "text-[#0e5c42] group-hover:text-white/85" : "text-[#3b7dd8]"}`}
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
                            <div className="absolute top-[14px] right-[14px] text-[9px] font-bold uppercase tracking-[0.06em] px-[9px] py-[3px] rounded-full bg-[#3b7dd8] text-white">
                              Recommended
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setShowQuiz(false);
                            handleConfirmation("paper");
                          }}
                          className={`flex flex-col relative w-full p-[18px_20px] text-left rounded-[14px] border-[2px] transition-all duration-[0.2s] group select-none hover:-translate-y-[1px]
                          ${quizResult.emphasize === "paper" ? "bg-[#f2f0fb] border-[#b0a6e2] hover:bg-[#2e1f72] hover:border-[#1e1348]" : "bg-white border-[#d0e4f7] hover:border-[#3b7dd8]"}`}
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
                            <div className="absolute top-[14px] right-[14px] text-[9px] font-bold uppercase tracking-[0.06em] px-[9px] py-[3px] rounded-full bg-[#3b7dd8] text-white">
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
          className={`w-full ${currentStep.type === "quest" ? "" : "max-w-4xl"}`}
        >
          {currentStep.type === "quest" ? (
            <div className="w-full min-h-[600px] flex flex-col items-center">
              <QuestRenderer
                quest={currentStep.questData as unknown as QuestSuite}
                onComplete={handleToggleComplete}
                state={state}
                actions={actions}
              />
            </div>
          ) : currentStep.type === "tool" ? (
            renderToolStep()
          ) : currentStep.type === "docs" ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {/* Header for Docs */}
              <div className="text-left w-full max-w-[740px] mb-[36px]">
                <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] leading-[1.2]">
                  {currentStep.name}
                </h1>
                <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[28px] max-w-[500px]">
                  {currentStep.description}
                </p>

                {/* Local Progress Bar - Refined like Reference */}
                {currentStep.documentItems &&
                  currentStep.documentItems.length > 0 && (
                    <div className="w-full flex items-center gap-[12px] mt-3">
                      <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#3b7dd8] to-[#6aa8f0] transition-all duration-1000 ease-out"
                          style={{
                            width: `${(currentStep.documentItems.filter((d) => state.documentChecklist[d.name]).length / currentStep.documentItems.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap">
                        {
                          currentStep.documentItems.filter(
                            (d) => state.documentChecklist[d.name],
                          ).length
                        }{" "}
                        of {currentStep.documentItems.length} reviewed
                      </span>
                    </div>
                  )}
              </div>

              {/* Document Cards */}
              <div className="w-full max-w-[740px]">
                <div className="w-full">
                  {[
                    "Required Now",
                    "Required if Applicable",
                    "Gather Now for Later",
                  ].map((groupName) => {
                    const groupItems = currentStep.documentItems?.filter(
                      (d) => (d.group || "Required Now") === groupName,
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
                          {/* {groupName === "Required Now" && (
                            <span className="text-[10px] font-semibold tracking-[0.06em] uppercase px-[9px] py-[3px] rounded-full bg-[#ffeaea] text-[#a01c1c] border border-[#f5bebe]">
                              Required
                            </span>
                          )} */}
                          {/* {groupName === "Required if Applicable" && (
                            <span className="text-[10px] font-semibold tracking-[0.06em] uppercase px-[9px] py-[3px] rounded-full bg-[#fef8e8] text-[#8a6200] border border-[#f0d98a]">
                              Conditional
                            </span>
                          )}
                          {groupName === "Gather Now for Later" && (
                            <span className="text-[10px] font-semibold tracking-[0.06em] uppercase px-[9px] py-[3px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">
                              Gather
                            </span>
                          )} */}
                          <div className="h-px flex-1 bg-[#d0e4f7]" />
                        </div>

                        <div className="flex flex-col">
                          {groupItems.map((doc, idx) => {
                            const isReviewed =
                              state.documentChecklist[doc.name];
                            const hasAttachment =
                              state.docUploads[doc.name] ||
                              state.notes[doc.name];
                            const isInProgress = hasAttachment && !isReviewed;
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
                                    window.open(doc.guideUrl, "_blank");
                                  } else {
                                    setSelectedGuideId(doc.id || null);
                                  }
                                }}
                                className={`group flex items-center gap-[16px] px-[20px] py-[18px] rounded-[14px] border-[1.5px] transition-all cursor-pointer relative shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] hover:border-[#3b7dd8] hover:shadow-[0_8px_32px_rgba(15,31,56,0.12),0_2px_8px_rgba(15,31,56,0.06)] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] mb-[10px]
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
                                        : "bg-[#e8f1fb] border-[#d0e4f7] text-[#2d4a6e]"
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
                                            ? "bg-[#e8f1fb] text-[#2d4a6e]"
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

                                <div className="shrink-0 flex items-center justify-center">
                                  <div
                                    className={`px-[11px] py-[5px] rounded-full border text-[12px] font-medium tracking-normal transition-all
                                    ${
                                      isReviewed
                                        ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0]"
                                        : isInProgress
                                          ? "bg-[#fff9e6] text-[#d97706] border-[#fde68a]"
                                          : "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-[#3b7dd8] hover:text-[#3b7dd8]"
                                    }`}
                                  >
                                    {isReviewed
                                      ? "Reviewed"
                                      : isInProgress
                                        ? "In progress"
                                        : "Not started"}
                                  </div>
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
          ) : currentStep.type === "filing" ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="flex flex-col w-full max-w-[660px] pb-[80px] px-[24px]">
                <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] leading-[1.2]">
                  {currentStep.name}
                </h1>
                <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[28px] max-w-[500px]">
                  {currentStep.description}
                </p>

                <div className="flex flex-wrap gap-[8px] mb-[36px]">
                  <span className="text-[11px] font-semibold tracking-[0.06em] uppercase px-[12px] py-[5px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">
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
                      <h3 className="text-[19px] font-serif font-medium text-white mb-[2px] leading-[1.2]">
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
                      {currentStep.filingData?.methods.map((method) => {
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
                            className={`relative text-left p-[22px_20px_20px] rounded-[14px] border-[2px] transition-all duration-[0.24s] select-none
                                ${
                                  isSelected
                                    ? `${pSelBg} border-transparent shadow-[0_0_0_3px_${shadowLight},0_8px_32px_rgba(15,31,56,0.13),0_2px_8px_rgba(15,31,56,0.06)] transform -translate-y-[2px]`
                                    : `${pIdleBg} ${pIdleBorder} hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(15,31,56,0.13),0_2px_8px_rgba(15,31,56,0.06)]`
                                }`}
                          >
                            <div
                              className={`absolute top-[13px] right-[13px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold transition-opacity duration-[0.24s]
                              ${isSelected ? `opacity-100 ${pSelFee}` : "opacity-0"}`}
                            >
                              ✓
                            </div>

                            <div
                              className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-[10px] transition-colors duration-[0.24s] ${isSelected ? pSelText : pIdleText}`}
                            >
                              {isOnline ? "Online Filing" : "Paper Filing"}
                            </div>
                            <h3
                              className={`text-[20px] font-serif leading-[1.2] mb-[8px] transition-colors duration-[0.24s] ${isSelected ? "text-white" : pIdleText}`}
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
                                ? "bg-[#0e5c42] hover:bg-[#0a4330] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(14,92,66,0.35)]"
                                : "bg-[#2e1f72] hover:bg-[#1e1348] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(46,31,114,0.35)]"
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
                        className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] text-[#3a4f63] rounded-[14px] font-medium text-[14px] hover:border-[#3b7dd8] hover:text-[#3b7dd8] hover:bg-[#3b7dd8]/[0.12] transition-all flex items-center justify-center gap-[9px] group"
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
                      Fees as of March 2026 per the USCIS G-1055 fee schedule.
                      Processing time is the same for both methods. Always
                      verify at uscis.gov before filing.
                    </p>
                  </div>
                )}

                <div className="mt-8 p-[12px_16px] bg-[#e8f1fb] rounded-[9px] text-[12px] text-[#6b8097] leading-[1.6] m-0">
                  Rahvana provides structured guidance only. This is not legal
                  advice.
                  <br />
                  Consult a licensed immigration attorney for case-specific
                  decisions.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#d0e4f7] rounded-[32px] p-10 md:p-14 lg:p-20 shadow-xl shadow-[#0f1f38]/5 animate-in fade-in zoom-in-95 duration-700 w-full max-w-[740px] mx-auto">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3b7dd8] mb-4 opacity-70">
                Case Update
              </div>
              <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0f1f38] leading-[1.2]">
                {currentStep.name}
              </h1>
              <p className="text-[#3a4f63] text-[15px] leading-[1.65] mb-[28px] max-w-[500px]">
                {currentStep.description}
              </p>

              {currentStep.actions && currentStep.actions.length > 0 && (
                <div className="space-y-3 mb-12">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#6b8097]">
                      Key Tasks
                    </span>
                    <div className="h-px flex-1 bg-[#d0e4f7]/50" />
                  </div>
                  {currentStep.actions.map((act: string, i: number) => (
                    <div
                      key={i}
                      className="flex gap-4 p-5 rounded-[20px] bg-[#fafcff] border border-[#d0e4f7] group hover:border-[#3b7dd8] transition-all"
                    >
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-[#d0e4f7] flex items-center justify-center shrink-0 group-hover:border-[#3b7dd8] transition-colors mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d0e4f7] group-hover:bg-[#3b7dd8]" />
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

      {/* Bottom Navigation Footer */}
      <footer className="h-20 border-t border-slate-200 bg-white flex items-center justify-between px-6 md:px-8 shrink-0 z-40 shadow-[0_-4px_30_rgba(0,0,0,0.02)]">
        <button
          onClick={() => prevStep && handleNavigate(prevStep.id)}
          className={`flex items-center gap-3 text-[13px] font-black text-slate-900 transition-colors hover:text-primary ${!prevStep ? "opacity-0 pointer-events-none" : "hover:translate-x-[-6px]"}`}
        >
          <ArrowLeft size={16} strokeWidth={3} />
          Previous
        </button>

        <div className="flex-1 max-w-xs md:max-w-sm px-6 flex flex-col items-center">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(13,115,119,0.2)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
            Progress <span className="text-slate-900">{progressPct}%</span>
          </div>
        </div>

        <div className="min-w-[120px] flex justify-end">
          <button
            onClick={() => nextStep && handleNavigate(nextStep.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-md bg-primary text-white text-[13px] font-black shadow-xl shadow-primary/25 transition-all
              ${!nextStep || !isCompleted ? "opacity-0 pointer-events-none" : "hover:translate-x-2 hover:bg-primary/90 active:scale-95"}`}
          >
            Next
            <ArrowRight size={16} strokeWidth={3} />
          </button>
        </div>
      </footer>

      {/* Global Modals */}
      <CredentialFormModal
        isOpen={isWalletFormOpen}
        onClose={() => setIsWalletFormOpen(false)}
        portalType="USCIS"
        mode={uscisCredentials ? "edit" : "add"}
        icon={<ShieldCheck className="text-teal-600" />}
        initialData={
          uscisCredentials
            ? {
                username: uscisCredentials.username,
                password: "",
                securityQuestions: uscisCredentials.security_questions.map(
                  (sq) => ({
                    id: sq.id,
                    question: sq.question,
                    answer: "",
                  }),
                ),
              }
            : undefined
        }
        onSubmit={handleSaveCredentials}
        isSubmitting={isSubmittingCreds}
      />

      <ViewCredentialModal
        isOpen={isWalletViewOpen}
        onClose={() => setIsWalletViewOpen(false)}
        portalType="USCIS"
        credential={uscisCredentials}
        icon={<ShieldCheck className="text-primary" />}
        onRevealPassword={handleRevealPassword}
        onRevealAnswer={handleRevealAnswer}
        onRevealCaseNumber={async () => ""}
        onRevealInvoiceId={async () => ""}
        onEdit={() => {
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
          await handleDeleteCredentials("USCIS");
          setShowDeleteConfirmation(false);
        }}
        loading={isSubmittingCreds}
      />

      {/* Guide Shell Overlay */}
      {selectedGuideId && InlineGuideData[selectedGuideId] && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ease-out">
          {/* Guide Topbar */}
          <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
            <button
              onClick={() => setSelectedGuideId(null)}
              className="w-[36px] h-[36px] rounded-full border-none bg-[#f5f7fa] cursor-pointer flex items-center justify-center transition-all hover:bg-[#e8f1fb] shrink-0 outline-none focus:ring-2 focus:ring-[#3b7dd8]"
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
            <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#3b7dd8] to-[#6aa8f0] transition-all duration-300 w-full" />
            </div>
            <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
              Guide
            </div>
          </div>

          {/* Guide Body */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-[48px_24px_40px] bg-white">
            <div className="w-full max-w-[600px] flex flex-col">
              {/* <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#3b7dd8] mb-[16px]">
                Step 2 · Gather Required Documents
              </div> */}
              <div className="inline-flex items-center gap-[5px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full p-[4px_12px] text-[11px] font-medium text-[#3a4f63] mb-[24px] w-fit">
                <div
                  className={`w-[6px] h-[6px] rounded-full shrink-0 ${InlineGuideData[selectedGuideId].sourceType === "internal" ? "bg-[#6b8097]" : "bg-[#3b7dd8]"}`}
                />
                {InlineGuideData[selectedGuideId].sourceType === "internal"
                  ? "Roadmap Module"
                  : `Rahvana Guide — ${InlineGuideData[selectedGuideId].title}`}
              </div>
              <h2 className="font-black font-serif text-[clamp(22px,3.5vw,28px)] text-[#0f1f38] mb-[6px] leading-[1.25]">
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
                      className="bg-[#f5f7fa] border border-[#d0e4f7] rounded-[14px] p-[22px_24px] mb-[14px]"
                    >
                      <div className="text-[13px] font-semibold tracking-[0.05em] uppercase text-[#6b8097] mb-[12px]">
                        {section.title}
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: section.htmlContent,
                        }}
                      />
                    </div>
                  ),
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-[10px] mt-[28px] max-w-[600px] w-full">
                <button
                  onClick={() => {
                    setSelectedGuideId(null);
                  }}
                  className="p-[14px_24px] bg-[#eaf7f2] text-[#1a7a5e] border-[1.5px] border-[#b5e0d0] rounded-[14px] text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#d2f0e4] hover:-translate-y-[1px] text-center"
                >
                  ✓ Mark as reviewed
                </button>
                <button
                  onClick={() => setSelectedGuideId(null)}
                  className="p-[14px_24px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[14px] text-[14px] font-medium cursor-pointer transition-colors hover:border-[#3a4f63] hover:text-[#1c2b3a] text-center"
                >
                  ← Back to document list
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tutorial Overlay */}
      {isTutorialOpen && (
        <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-[cubic-bezier(0.4,0,0.2,1)]">
          {/* Tutorial Topbar */}
          <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
            <button
              onClick={() => setIsTutorialOpen(false)}
              className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-all cursor-pointer"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-primary rounded-[10px] transition-all duration-[0.4s] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  width: `${((tutorialIdx + 1) / USCIS_TUTORIAL_STEPS.length) * 100}%`,
                }}
              />
            </div>

            <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
              {tutorialIdx + 1} / {USCIS_TUTORIAL_STEPS.length}
            </div>
          </div>

          {/* Tutorial Body */}
          <div className="flex-1 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center">
            <div className="w-full max-w-[580px] flex flex-col">
              <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#2f6fd4] mb-4">
                {USCIS_TUTORIAL_STEPS[tutorialIdx].label}
              </div>
              <h2 className="text-[clamp(20px,3.2vw,26px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
                {USCIS_TUTORIAL_STEPS[tutorialIdx].heading}
              </h2>
              <div
                className="text-[14px] text-[#3a4f63] leading-[1.7] mb-5"
                dangerouslySetInnerHTML={{
                  __html: USCIS_TUTORIAL_STEPS[tutorialIdx].instruction,
                }}
              />

              {/* Screenshot Wrap */}
              <div className="w-full bg-[#eef3fa] border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-5 relative flex flex-col">
                {/* Image Placeholder Area (aspect-[16/9])*/}
                <div className="bg-[#eef3fa] flex flex-col items-center justify-center p-9 text-center">
                  <div className="w-11 h-11 rounded-full bg-[#d0e4f7] flex items-center justify-center mb-2.5 shadow-sm">
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
                    {USCIS_TUTORIAL_STEPS[tutorialIdx].screenshot}
                  </div>
                  <div className="mt-4 text-[11px] text-[#6b8097] max-w-[300px] leading-[1.55]">
                    Place the real USCIS screenshot at the path above to display
                    it here.
                  </div>
                </div>

                {/* Caption Bar */}
                <div className="p-[8px_12px_10px] bg-[#f4f7fb] border-t border-[#d0e4f7] text-[11px] text-[#6b8097] leading-[1.5] text-left">
                  {USCIS_TUTORIAL_STEPS[tutorialIdx].caption}
                </div>
              </div>

              {/* Note Block */}
              {USCIS_TUTORIAL_STEPS[tutorialIdx].note && (
                <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[12px_15px] mb-[22px] flex flex-col">
                  <div className="text-[13px] text-[#8a6200] leading-[1.55]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: USCIS_TUTORIAL_STEPS[tutorialIdx].note
                          .replace("Important:", "<strong>Important:</strong>")
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
                {tutorialIdx < USCIS_TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTutorialIdx(tutorialIdx + 1)}
                    className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#2460bb] hover:-translate-y-[1px] active:translate-y-0 text-center"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTutorialOpen(false)}
                    className="flex-1 p-[13px_22px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-[1px] text-center"
                  >
                    Done — return to step
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
