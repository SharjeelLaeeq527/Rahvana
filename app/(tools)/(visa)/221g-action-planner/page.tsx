"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Clock, CheckCircle2, RotateCcw } from "lucide-react";

export default function TwentyTwoOneGActionPlanner() {
  const [mounted, setMounted] = useState(false);
  const [smartModeEnabled, setSmartModeEnabled] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formKey, setFormKey] = useState<string>("init-1");

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
    <div className="w-full site-main-px site-main-py mt-10">
      <div className="mb-5 rounded-2xl border border-slate-200 px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            Visa Response Toolkit · Standalone Tool
          </p>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              221(g) Action Planner
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Build, organize, and export a structured 221(g) response packet step by step.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (savedDraft || savedResult) && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                title="Clear saved standalone draft and reset form"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start Fresh</span>
              </button>
            )}
            <QuickAccessButton
              item={{
                id: "221g-action-planner",
                title: "221(g) Action Planner",
                href: "/221g-action-planner",
                icon_name: "LifeBuoy",
              }}
            />
          </div>
        </div>

        {/* Saved Draft Notification (Client-rendered after mount) */}
        {mounted && savedDraft && !savedResult && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                In-Progress Draft Saved
              </span>
              <span className="text-xs font-semibold text-amber-800">
                Step {savedDraft.currentStep} of 4
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Your previous answers and checklist selections have been restored.
            </p>
          </div>
        )}

        {/* Saved Result Notification (Client-rendered after mount) */}
        {mounted && savedResult && (
          <div className="mt-4 p-3.5 rounded-xl bg-teal-50/90 border border-teal-200 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Last Saved Response Packet
              </span>
              <span className="text-xs font-semibold text-teal-800">
                {savedResult.formData.caseNumber || savedResult.formData.visaCategory || "Completed"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Your customized action plan and packet checklist are loaded and ready for review or export.
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500 italic leading-relaxed border-t border-slate-100 pt-2">
          Note: 221(g) notices may differ by embassy/consulate; always follow the specific instructions provided with your case notice.
        </p>
      </div>

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
      />

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
    </div>
  );
}
