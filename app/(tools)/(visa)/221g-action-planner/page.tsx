"use client";

import { useState, useEffect } from "react";
import CombinedIntakeFormWrapper from "./components/CombinedIntakeFormWrapper";
import { FormData, FormSelections } from "./types/221g";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { Users } from "lucide-react";

export default function TwentyTwoOneGActionPlanner() {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedItems, setSelectedItems] = useState<FormSelections | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [initialSelections, setInitialSelections] = useState<FormSelections | null>(null);
  const [smartModeEnabled, setSmartModeEnabled] = useState(true);

  const { profile, isProfileLoading, updateProfile } = useUserProfile();
  const { activeCandidate, activeCandidateId, isMultiCandidate } = useCandidate();

  // Restore session from candidate-scoped profile data
  useEffect(() => {
    if (isProfileLoading || !profile) return;

    let savedData: Record<string, unknown> = {};
    let savedSelections = null;

    const candidatePlanner =
      (profile as any)[`actionPlanner_${activeCandidateId}`] ||
      (activeCandidateId === "candidate-1" ? profile.actionPlanner : null);

    if (candidatePlanner?.questionnaire) {
      savedData = { ...(candidatePlanner.questionnaire.formData as unknown as FormData) };
      savedSelections = candidatePlanner.questionnaire
        .selectedItems as unknown as FormSelections;
    }

    // Prioritize standard fields from candidate / central profile if present
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
    // Resolve user-friendly beneficiary name (e.g. "Candidate 1 (Mother)" or "Candidate 2 (Father)")
    const candidateDefaultName =
      activeCandidate.fullName && activeCandidate.fullName.trim()
        ? activeCandidate.fullName.trim()
        : activeCandidate.relation && activeCandidate.relation !== "Other"
        ? `${activeCandidate.label || "Candidate"} (${activeCandidate.relation})`
        : activeCandidate.label || "Candidate 1";

    const currentBeneficiary =
      typeof savedData.beneficiaryName === "string" ? savedData.beneficiaryName.trim() : "";
    const isIdTypeOrEmpty = !currentBeneficiary || /^candidate[-_]\d+$/i.test(currentBeneficiary);

    if (isIdTypeOrEmpty) {
      savedData.beneficiaryName = candidateDefaultName;
    } else if (activeCandidate.fullName && activeCandidate.fullName.trim()) {
      savedData.beneficiaryName = activeCandidate.fullName.trim();
    }
    if (profile.passportNumber) {
      savedData.passportNumber = profile.passportNumber;
    }
    if (profile.dateOfBirth) {
      savedData.dateOfBirth = profile.dateOfBirth;
    }
    const candidateVisa = activeCandidate.visaCategory || profile.visaCategory || profile.visaType;
    if (candidateVisa) {
      savedData.visaCategory = candidateVisa;
    }
    // New cross-chapter autofill fields
    if (profile.interviewOutcome) {
      savedData.interviewOutcome = profile.interviewOutcome;
    }
    if (profile.outcome221gSubtype) {
      savedData.outcome221gSubtype = profile.outcome221gSubtype;
    }
    if (profile.receiptNumber && !savedData.receiptNumber) {
      savedData.receiptNumber = profile.receiptNumber;
    }
    if (profile.dqDate && !savedData.dqDate) {
      savedData.dqDate = profile.dqDate;
    }
    if (profile.dqPost && !savedData.consularPost) {
      savedData.consularPost = profile.dqPost;
    }

    if (Object.keys(savedData).length > 0) {
      setInitialData(savedData as unknown as FormData);
    }
    if (savedSelections) {
      setInitialSelections(savedSelections);
    }
  }, [profile, isProfileLoading, activeCandidateId, activeCandidate]);

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

    const actionPlannerKey = `actionPlanner_${activeCandidateId}`;

    // Use context's updateProfile to save both candidate-specific namespace and standard fields
    updateProfile(
      {
        [actionPlannerKey]: actionPlannerData,
        ...(activeCandidateId === "candidate-1" ? { actionPlanner: actionPlannerData } : {}),
        interviewDate: formData.interviewDate || undefined,
        interviewLocation: formData.consularPost || undefined,
        caseStatus: formData.ceacStatus || undefined,
        caseNumber: formData.caseNumber || undefined,
        fullName: formData.beneficiaryName || undefined,
        passportNumber: formData.passportNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        visaCategory: formData.visaCategory || undefined,
      } as any,
      { immediate: true }
    );
  };

  return (
    <div className="w-full site-main-px site-main-py mt-10">
      <div className="mb-5 rounded-2xl border border-slate-200 px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            Visa Response Toolkit
          </p>
          {isMultiCandidate && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-800">
              <Users className="w-3 h-3 text-teal-600" />
              <span>Beneficiary: {activeCandidate.fullName || activeCandidate.label} ({activeCandidate.relation})</span>
            </div>
          )}
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              221(g) Action Planner
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Build and export a structured 221(g) response packet step by step for {activeCandidate.fullName || activeCandidate.label}.
            </p>
          </div>
          <QuickAccessButton
            item={{
              id: "221g-action-planner",
              title: "221(g) Action Planner",
              href: "/221g-action-planner",
              icon_name: "LifeBuoy",
            }}
          />
        </div>
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
