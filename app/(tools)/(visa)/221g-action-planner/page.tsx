"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import CombinedIntakeFormWrapper from "./components/CombinedIntakeFormWrapper";
import {
  FormData,
  FormSelections,
  TwentyTwoOneGDraft,
  TwentyTwoOneGResult,
  STANDALONE_221G_DRAFT_KEY,
  STANDALONE_221G_STORAGE_KEY,
} from "./types/221g";
import { useUserProfile } from "@/app/context/UserProfileContext";
import {
  ToolLayout,
  type ToolRule,
  type ToolFaq,
  type ToolSource,
} from "@/components/tools/layout";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { CheckCircle2, CircleHelp, RotateCcw } from "lucide-react";

export default function TwentyTwoOneGActionPlanner() {
  const [mounted, setMounted] = useState(false);
  const [smartModeEnabled, setSmartModeEnabled] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formKey, setFormKey] = useState<string>("init-1");
  // Bumped by the header "What's this?" button; the wizard opens its welcome modal.
  const [welcomeRequest, setWelcomeRequest] = useState(0);

  const [savedResult, setSavedResult] = useState<TwentyTwoOneGResult | null>(null);
  const [savedDraft, setSavedDraft] = useState<TwentyTwoOneGDraft | null>(null);

  const { profile, updateProfile } = useUserProfile();
  const { showToast } = useToast();

  // Load isolated standalone saved action plan and draft from localStorage or user profile
  const loadStandaloneData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const cachedResult = localStorage.getItem(STANDALONE_221G_STORAGE_KEY);
      if (cachedResult) {
        setSavedResult(JSON.parse(cachedResult));
      } else if (profile?.standalone221gResult) {
        setSavedResult(profile.standalone221gResult);
      } else {
        setSavedResult(null);
      }

      const cachedDraft = localStorage.getItem(STANDALONE_221G_DRAFT_KEY);
      if (cachedDraft) {
        setSavedDraft(JSON.parse(cachedDraft));
      } else if (profile?.standalone221gDraft) {
        setSavedDraft(profile.standalone221gDraft);
      } else {
        setSavedDraft(null);
      }
    } catch {
      setSavedResult(null);
      setSavedDraft(null);
    }
  }, [profile]);

  useEffect(() => {
    setMounted(true);
    loadStandaloneData();
  }, [loadStandaloneData]);

  const initialData = useMemo(() => {
    if (savedDraft?.formData) return savedDraft.formData;
    if (savedResult?.formData) return savedResult.formData;
    return null;
  }, [savedDraft, savedResult]);

  const initialSelections = useMemo(() => {
    if (savedDraft?.selectedItems) return savedDraft.selectedItems;
    if (savedResult?.selectedItems) return savedResult.selectedItems;
    return null;
  }, [savedDraft, savedResult]);

  const initialStep = useMemo(() => {
    if (typeof savedDraft?.currentStep === "number") return savedDraft.currentStep;
    if (savedResult) return 4;
    return 1;
  }, [savedDraft, savedResult]);

  const initialOutputs = useMemo(() => {
    if (savedDraft?.outputs) return savedDraft.outputs;
    if (savedResult?.actionPlan || savedResult?.checklist) {
      return {
        actionPlan: savedResult.actionPlan,
        checklist: savedResult.checklist,
      };
    }
    return null;
  }, [savedDraft, savedResult]);

  const handleClearStandaloneProgress = () => {
    try {
      localStorage.removeItem(STANDALONE_221G_STORAGE_KEY);
      localStorage.removeItem(STANDALONE_221G_DRAFT_KEY);
      if (updateProfile) {
        updateProfile(
          {
            standalone221gDraft: undefined,
            standalone221gResult: undefined,
          },
          { silent: true }
        );
      }
      setSavedResult(null);
      setSavedDraft(null);
      setFormKey(`reset-${Date.now()}`);
      setShowResetConfirm(false);
      showToast("Standalone 221(g) Action Planner progress cleared.", "info");
    } catch (e) {
      console.error("Error clearing standalone 221g progress:", e);
    }
  };

  const handleProgressChange = (draft: TwentyTwoOneGDraft) => {
    setSavedDraft(draft);
  };

  return (
    <ToolLayout
      theme="g221"
      title="221(g) Action Planner"
      tagline="Build, organize, and export a structured 221(g) response packet step by step."
      quickAccessItem={{
        id: "221g-action-planner",
        title: "221(g) Action Planner",
        href: "/221g-action-planner",
        icon_name: "LifeBuoy",
      }}
      hideHelpButton
      headerActions={
        <>
          {mounted && (savedDraft || savedResult) && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/35 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
              title="Clear saved standalone draft and reset form"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Start Fresh</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setWelcomeRequest((n) => n + 1)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/35 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            <CircleHelp className="h-4 w-4" />
            <span>What&apos;s this?</span>
          </button>
        </>
      }
      layout="single"
      rules={RULES}
      faqs={FAQS}
      sources={SOURCES}
      disclaimer="221(g) notices may differ by embassy/consulate; always follow the instructions on your notice."
    >
      {/* Saved Result Notification (Client-rendered after mount) */}
      {mounted && savedResult && (
        <div className="mb-6 rounded-xl border border-[var(--tool-accent)]/25 bg-[var(--tool-accent-tint)] p-3.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--tool-accent-dark)] uppercase">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--tool-accent)]" />
              Last Saved Response Packet
            </span>
            <span className="text-xs font-semibold text-[var(--tool-accent-dark)]">
              {savedResult.formData.caseNumber || savedResult.formData.visaCategory || "Completed"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Your customized action plan and packet checklist are loaded and ready for review or
            export.
          </p>
        </div>
      )}

      {/* The wizard's "primary" colour follows this tool's accent on the standalone page. */}
      <div style={{ "--primary": "var(--tool-accent)" } as React.CSSProperties}>
        <CombinedIntakeFormWrapper
          key={`${formKey}-${smartModeEnabled ? "smart" : "basic"}`}
          initialData={initialData}
          initialSelections={initialSelections}
          initialStep={initialStep}
          initialOutputs={initialOutputs}
          smartModeEnabled={smartModeEnabled}
          mode="standalone"
          onProgressChange={handleProgressChange}
          onReset={loadStandaloneData}
          bare
          welcomeRequest={welcomeRequest}
        />
      </div>

      <ConfirmationModal
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Start Fresh?"
        description="This will clear your saved 221(g) draft, entered case details, and checklist selections. You will start with a blank form."
        confirmText="Yes, Start Fresh"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleClearStandaloneProgress}
      />
    </ToolLayout>
  );
}

// ── Drawer content. Every line restates something the planner already tells the user. ──

const RULES: ToolRule[] = [
  { label: "Time to respond", value: "Usually 1 year from the refusal, with no new fee" },
  { label: "Follow", value: "The instructions on your own 221(g) notice" },
  { label: "Steps", value: "Case basics, checklist, review, export" },
  { label: "After you send it", value: "Track the case on CEAC" },
];

const FAQS: ToolFaq[] = [
  {
    question: "How long do I have to respond?",
    answer:
      "Under Section 221(g), you generally have one year from the date of refusal to provide the requested information without paying a new fee.",
  },
  {
    question: "My notice looks different. Does that matter?",
    answer:
      "221(g) notices differ by embassy and consulate. Tick what is on your own notice, and always follow the instructions it gives.",
  },
  {
    question: "Is my progress saved?",
    answer:
      "Yes. Your answers, checklist and generated packet are saved as you go, so you can come back later. Start Fresh clears them.",
  },
  {
    question: "How do I check my case after I respond?",
    answer: "Use the State Department's CEAC visa status check with your case number.",
  },
];

const SOURCES: ToolSource[] = [
  {
    title: "Administrative processing information",
    domain: "travel.state.gov",
    url: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html",
  },
  {
    title: "CEAC visa status check",
    domain: "ceac.state.gov",
    url: "https://ceac.state.gov/CEACStatTracker/Status.aspx",
  },
  {
    title: "Form I-864, Affidavit of Support",
    domain: "uscis.gov",
    url: "https://www.uscis.gov/i-864",
  },
  {
    title: "Get your tax transcript",
    domain: "irs.gov",
    url: "https://www.irs.gov/individuals/get-transcript",
  },
];
