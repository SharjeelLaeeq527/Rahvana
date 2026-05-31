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

    let savedData: Record<string, unknown> = {};
    let savedSelections = null;

    if (profile.actionPlanner?.questionnaire) {
      savedData = { ...(profile.actionPlanner.questionnaire.formData as unknown as FormData) };
      savedSelections = profile.actionPlanner.questionnaire
        .selectedItems as unknown as FormSelections;
    }

    // Prioritize standard fields from central profile if present
    if (profile.interviewDate) {
      savedData.interviewDate = profile.interviewDate;
    }
    if (profile.interviewLocation) {
      savedData.consularPost = profile.interviewLocation;
    }
    if (profile.caseStatus) {
      savedData.ceacStatus = profile.caseStatus;
    }
    if (profile.caseNumber) {
      savedData.caseNumber = profile.caseNumber;
    }
    if (profile.fullName) {
      savedData.beneficiaryName = profile.fullName;
    } else if (profile.name?.first) {
      savedData.beneficiaryName = `${profile.name.first} ${profile.name.last || ""}`.trim();
    }
    if (profile.passportNumber) {
      savedData.passportNumber = profile.passportNumber;
    }
    if (profile.dateOfBirth) {
      savedData.dateOfBirth = profile.dateOfBirth;
    }
    if (!savedData.visaCategory && profile.visaCategory) {
      savedData.visaCategory = profile.visaCategory;
    } else if (!savedData.visaCategory && profile.visaType) {
      savedData.visaCategory = profile.visaType;
    }

    if (Object.keys(savedData).length > 0) {
      setInitialData(savedData as unknown as FormData);
    }
    if (savedSelections) {
      setInitialSelections(savedSelections);
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

    // Use context's updateProfile to save both specific namespace and standard fields
    updateProfile(
      {
        actionPlanner: actionPlannerData,
        interviewDate: formData.interviewDate || undefined,
        caseStatus: formData.ceacStatus || undefined,
        caseNumber: formData.caseNumber || undefined,
        fullName: formData.beneficiaryName || undefined,
        passportNumber: formData.passportNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      } as any,
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
        <p className="mt-3 text-xs text-slate-500 italic leading-relaxed border-t border-slate-100 pt-2">
          Note: 221(g) notices may differ by embassy/consulate; always follow the specific instructions provided with your case notice.
        </p>
      </div>

      <CombinedIntakeFormWrapper
        key={`${smartModeEnabled ? "smart-mode" : "basic-mode"}-${initialData ? JSON.stringify(initialData) : "empty"}`}
        onSubmit={handleSubmit}
        onSaveToProfile={handleSaveToProfile}
        initialData={initialData}
        initialSelections={initialSelections}
        smartModeEnabled={smartModeEnabled}
      />
    </div>
  );
}
