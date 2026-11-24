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
import { SponsorshipCalculatorLayout } from "@/components/tools/SponsorshipCalculatorLayout";

export default function AffidavitSupportCalculatorPage() {
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();
  const { profile, updateProfile } = useUserProfile();

  const [savedResult, setSavedResult] = useState<any>(null);
  const [savedDraft, setSavedDraft] = useState<SponsorshipCalculatorDraft | null>(null);
  // Bumped on "Start Fresh" to force the still-mounted SponsorshipCalculatorTool to
  // re-initialize from a clean slate.
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
  }, [loadStandaloneData]);

  const initialData = useMemo(() => {
    if (savedDraft?.data) return savedDraft.data;
    if (savedResult?.raw) return savedResult.raw;
    return null;
  }, [savedDraft, savedResult]);

  const initialStep = useMemo(() => {
    if (typeof savedDraft?.stepIdx === "number") return savedDraft.stepIdx;
    if (savedResult) {
      const isExempt = savedResult.isChildCitizenshipActExempt || savedResult.isExempt;
      return isExempt ? 3 : 10;
    }
    return undefined;
  }, [savedDraft, savedResult]);

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
  };

  const handleClearStandaloneProgress = () => {
    try {
      localStorage.removeItem(STANDALONE_SPONSORSHIP_STORAGE_KEY);
      localStorage.removeItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (updateProfile) {
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
      setResetKey((k) => k + 1);
      showToast("Standalone calculator progress cleared.", "info");
    } catch (e) {
      console.error("Error clearing standalone progress:", e);
    }
  };

  return (
    <SponsorshipCalculatorLayout>
      {mounted && (
        <SponsorshipCalculatorTool
          key={resetKey}
          isOpen={true}
          standalonePage={true}
          onSave={handleSave}
          initialData={initialData}
          initialStep={initialStep}
          lockState={false}
          mode="standalone"
        />
      )}
    </SponsorshipCalculatorLayout>
  );
}
