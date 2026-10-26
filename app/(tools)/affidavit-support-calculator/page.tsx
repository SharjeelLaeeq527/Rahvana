"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import SponsorshipCalculatorTool, {
  STANDALONE_SPONSORSHIP_STORAGE_KEY,
  STANDALONE_SPONSORSHIP_DRAFT_KEY,
  SponsorshipCalculatorDraft,
} from "@/components/tools/SponsorshipCalculatorTool";
import { useUserProfile } from "@/app/context/UserProfileContext";
import type { MasterProfile } from "@/types/profile";
import { useToast } from "@/app/components/shared/ToastProvider";
import { CheckCircle2, Calculator, Info, RotateCcw, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AffidavitSupportCalculatorPage() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();
  const { profile, updateProfile } = useUserProfile();

  const [savedResult, setSavedResult] = useState<any>(null);
  const [savedDraft, setSavedDraft] = useState<SponsorshipCalculatorDraft | null>(null);
  // Bumped on "Start Fresh" to force the still-mounted SponsorshipCalculatorTool to
  // re-initialize from a clean slate (it keeps its form/step state alive while hidden).
  const [resetKey, setResetKey] = useState(0);

  // Load isolated standalone saved calculation and draft from localStorage or user profile
  const loadStandaloneData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const cachedResult = localStorage.getItem(STANDALONE_SPONSORSHIP_STORAGE_KEY);
      if (cachedResult) {
        setSavedResult(JSON.parse(cachedResult));
      } else if (profile?.standaloneSponsorshipCalc) {
        setSavedResult(profile.standaloneSponsorshipCalc);
      } else {
        setSavedResult(null);
      }

      const cachedDraft = localStorage.getItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (cachedDraft) {
        setSavedDraft(JSON.parse(cachedDraft));
      } else if (profile?.standaloneSponsorshipDraft) {
        setSavedDraft(profile.standaloneSponsorshipDraft);
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
    setIsOpen(true);
  }, [loadStandaloneData]);

  useEffect(() => {
    if (!isOpen && mounted) {
      loadStandaloneData();
    }
  }, [isOpen, mounted, loadStandaloneData]);

  const initialData = useMemo(() => {
    if (savedDraft?.data) return savedDraft.data;
    if (savedResult?.raw) return savedResult.raw;
    return null;
  }, [savedDraft, savedResult]);

  const initialStep = useMemo(() => {
    if (typeof savedDraft?.stepIdx === "number") return savedDraft.stepIdx;
    if (savedResult) return 10;
    return undefined;
  }, [savedDraft, savedResult]);

  const handleClose = () => {
    setIsOpen(false);
    loadStandaloneData();
  };

  const handleSave = (result: any) => {
    try {
      localStorage.setItem(STANDALONE_SPONSORSHIP_STORAGE_KEY, JSON.stringify(result));
      localStorage.removeItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (updateProfile) {
        updateProfile(
          {
            standaloneSponsorshipCalc: result,
            standaloneSponsorshipDraft: undefined,
          },
          { silent: true }
        );
      }
      setSavedResult(result);
      setSavedDraft(null);
      showToast("Sponsorship calculation saved to your account.", "success");
    } catch (e) {
      console.error("Error saving standalone sponsorship calculation:", e);
      showToast("Plan calculated successfully.", "info");
    }
    setIsOpen(false);
  };

  const handleClearStandaloneProgress = () => {
    try {
      localStorage.removeItem(STANDALONE_SPONSORSHIP_STORAGE_KEY);
      localStorage.removeItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (updateProfile) {
        // NOTE: `undefined` is ignored by deepMergeProfile (it `continue`s on
        // undefined), so clearing with `: undefined` was a silent no-op — the
        // profile/DB copy survived and loadStandaloneData restored it on the next
        // load/refresh. Send `null` so the value is actually overwritten to empty.
        updateProfile(
          {
            standaloneSponsorshipCalc: null,
            standaloneSponsorshipDraft: null,
          } as unknown as Partial<MasterProfile>,
          { silent: true }
        );
      }
      setSavedResult(null);
      setSavedDraft(null);
      // Remount the calculator so its internal (still-mounted) state resets too.
      setResetKey((k) => k + 1);
      showToast("Standalone calculator progress cleared.", "info");
    } catch (e) {
      console.error("Error clearing standalone progress:", e);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundImage: "url('/assets/images/affidavit-bg.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {!isOpen && (
        <div className="animate-in fade-in max-w-lg rounded-3xl border border-slate-200/80 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-md duration-700">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Calculator className="h-3.5 w-3.5 text-slate-500" />
            <span>Standalone Tool</span>
          </div>

          <h1 className="mb-2 text-3xl font-black text-[#0f1f38]">Affidavit of Support</h1>
          <p className="mb-6 text-sm leading-relaxed text-[#3a4f63]">
            Determine your income sponsorship threshold and required USCIS forms (I-864, I-864A,
            I-864EZ) under federal poverty guidelines.
          </p>

          {/* Saved Draft Notification (Client-rendered after mount) */}
          {mounted && savedDraft && !savedResult && (
            <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-left">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-900 uppercase">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  In-Progress Draft Saved
                </span>
                <span className="text-[11px] font-semibold text-amber-700">
                  Step {savedDraft.stepIdx + 1} of 11
                </span>
              </div>
              <p className="text-xs text-slate-600">
                You have an uncompleted calculation saved from your last session.
              </p>
            </div>
          )}

          {/* Completed Calculation Card (Client-rendered after mount) */}
          {mounted && savedResult && (
            <div className="mb-6 rounded-2xl border border-teal-200/80 bg-teal-50/80 p-4 text-left">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider text-teal-900 uppercase">
                  Last Saved Calculation
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold ${savedResult.isEligible ? "text-teal-700" : "text-rose-600"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {savedResult.isEligible ? "Eligible" : "Requires Joint Sponsor / Assets"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Household Size: <strong>{savedResult.householdSize}</strong> · Required:{" "}
                <strong>${(savedResult.requiredIncome ?? 0).toLocaleString()}</strong> · Total:{" "}
                <strong>${(savedResult.totalIncome ?? 0).toLocaleString()}</strong>
              </p>
            </div>
          )}

          <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#0d7377] p-[14px_32px] font-semibold text-white shadow-lg transition-all hover:opacity-90"
            >
              <Calculator className="h-4 w-4" />
              {mounted && savedDraft
                ? "Resume Draft"
                : mounted && savedResult
                  ? "Recalculate / View"
                  : "Launch Calculator"}
              <ArrowRight className="h-4 w-4" />
            </button>

            {mounted && (savedDraft || savedResult) && (
              <button
                onClick={handleClearStandaloneProgress}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-slate-300 bg-slate-100 p-[14px_20px] text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
                title="Clear saved standalone draft and calculation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Start Fresh</span>
              </button>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border-t border-slate-200/60 bg-slate-50 p-3 pt-4 text-left">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Want this calculation automatically applied to your petition forms and tracked on your
              roadmap?{" "}
              <Link
                href="/visa-exploration"
                className="font-semibold text-[#0d7377] hover:underline"
              >
                Explore Visa Journeys &rarr;
              </Link>
            </p>
          </div>
        </div>
      )}

      {mounted && (
        <SponsorshipCalculatorTool
          key={resetKey}
          isOpen={isOpen}
          onClose={handleClose}
          onSave={handleSave}
          initialData={initialData}
          initialStep={initialStep}
          lockState={false}
          mode="standalone"
        />
      )}
    </div>
  );
}
