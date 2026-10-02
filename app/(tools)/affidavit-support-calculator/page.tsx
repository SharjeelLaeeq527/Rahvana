"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import SponsorshipCalculatorTool, {
  STANDALONE_SPONSORSHIP_STORAGE_KEY,
  STANDALONE_SPONSORSHIP_DRAFT_KEY,
  SponsorshipCalculatorDraft,
} from "@/components/tools/SponsorshipCalculatorTool";
import { useUserProfile } from "@/app/context/UserProfileContext";
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
        updateProfile(
          {
            standaloneSponsorshipCalc: undefined,
            standaloneSponsorshipDraft: undefined,
          },
          { silent: true }
        );
      }
      setSavedResult(null);
      setSavedDraft(null);
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
        <div className="animate-in fade-in text-center duration-700 max-w-lg bg-white/95 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-4">
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>Standalone Tool</span>
          </div>

          <h1 className="mb-2 text-3xl font-black text-[#0f1f38]">Affidavit of Support</h1>
          <p className="mb-6 text-[#3a4f63] text-sm leading-relaxed">
            Determine your income sponsorship threshold and required USCIS forms (I-864, I-864A,
            I-864EZ) under federal poverty guidelines.
          </p>

          {/* Saved Draft Notification (Client-rendered after mount) */}
          {mounted && savedDraft && !savedResult && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
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
            <div className="mb-6 p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
                  Last Saved Calculation
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold ${savedResult.isEligible ? "text-teal-700" : "text-rose-600"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
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

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-[12px] bg-[#0d7377] p-[14px_32px] font-semibold text-white shadow-lg transition-all hover:opacity-90 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              {mounted && savedDraft
                ? "Resume Draft"
                : mounted && savedResult
                  ? "Recalculate / View"
                  : "Launch Calculator"}
              <ArrowRight className="w-4 h-4" />
            </button>

            {mounted && (savedDraft || savedResult) && (
              <button
                onClick={handleClearStandaloneProgress}
                className="rounded-[12px] bg-slate-100 hover:bg-slate-200 border border-slate-300 p-[14px_20px] font-semibold text-slate-700 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                title="Clear saved standalone draft and calculation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start Fresh</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-start gap-2 text-left bg-slate-50 p-3 rounded-xl">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
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
