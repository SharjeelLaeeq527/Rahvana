"use client";

import { useState, useEffect } from "react";
import CombinedIntakeFormWrapper from "./components/CombinedIntakeFormWrapper";
import { FormData, FormSelections } from "./types/221g";
import { useUserProfile } from "@/app/context/UserProfileContext";

export default function TwentyTwoOneGActionPlanner() {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedItems, setSelectedItems] = useState<FormSelections | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [initialSelections, setInitialSelections] = useState<FormSelections | null>(null);
  const [smartModeEnabled, setSmartModeEnabled] = useState(true);

  const { profile, isProfileLoading, updateProfile } = useUserProfile();

  // Restore session from profile (now reads from context instead of direct Supabase)
  useEffect(() => {
    if (isProfileLoading || !profile) return;

    if (profile.actionPlanner?.questionnaire) {
      const savedData = profile.actionPlanner.questionnaire.formData as unknown as FormData;
      const savedSelections = profile.actionPlanner.questionnaire
        .selectedItems as unknown as FormSelections;

      if (savedData) setInitialData(savedData);
      if (savedSelections) setInitialSelections(savedSelections);
    }
  }, [profile, isProfileLoading]);

  const handleSubmit = (data: FormData, selectedItems: FormSelections = {}) => {
    setFormData(data);
    setSelectedItems(selectedItems);
  };

  const handleSaveToProfile = async () => {
    if (!formData) return;

    const actionPlannerData = {
      questionnaire: {
        formData,
        selectedItems,
      },
      caseStatus: formData.ceacStatus,
      interviewDate: formData.interviewDate,
    };

    // Use context's updateProfile instead of direct Supabase upsert
    updateProfile(
      { actionPlanner: actionPlannerData } as any,
      { immediate: true }
    );
  };

  return (
    <div className="w-full site-main-px site-main-py mt-10">
      <div className="mb-5 rounded-2xl border border-slate-200 px-4 py-4 md:px-6 md:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
          Visa Response Toolkit
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          221(g) Action Planner
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Build and export a structured 221(g) response packet step by step.
        </p>
      </div>

      <CombinedIntakeFormWrapper
        key={smartModeEnabled ? "smart-mode" : "basic-mode"}
        onSubmit={handleSubmit}
        onSaveToProfile={handleSaveToProfile}
        initialData={initialData}
        initialSelections={initialSelections}
        smartModeEnabled={smartModeEnabled}
      />
    </div>
  );
}
