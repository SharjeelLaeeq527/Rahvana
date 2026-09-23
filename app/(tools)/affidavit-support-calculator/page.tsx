"use client";

import React, { useState, useEffect, useMemo } from "react";
import SponsorshipCalculatorTool from "@/components/tools/SponsorshipCalculatorTool";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Users, CheckCircle2, Calculator } from "lucide-react";

export default function AffidavitSupportCalculatorPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { activeCandidate, activeCandidateId, isMultiCandidate } = useCandidate();
  const { showToast } = useToast();

  const [savedResult, setSavedResult] = useState<any>(null);

  // Standalone entry: pre-fill the saved sponsor state when available
  const presetState = profile?.sponsor?.address?.state || "";

  // Load candidate-scoped saved calculation or defaults
  useEffect(() => {
    try {
      const storageKey = `sponsorshipCalc_${activeCandidateId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        setSavedResult(JSON.parse(cached));
        return;
      }
      if (activeCandidateId === "candidate-1") {
        const fallback = localStorage.getItem("sponsorshipCalc");
        if (fallback) {
          setSavedResult(JSON.parse(fallback));
          return;
        }
      }

      // Check profile namespace
      const profileData =
        (profile as any)?.[`sponsorshipCalculator_${activeCandidateId}`] ||
        (activeCandidateId === "candidate-1" ? (profile as any)?.sponsorshipCalculator : null);

      if (profileData) {
        setSavedResult(profileData);
      } else {
        setSavedResult(null);
      }
    } catch {
      setSavedResult(null);
    }
  }, [activeCandidateId, profile]);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const initialData = useMemo(() => {
    const raw = savedResult?.raw;
    if (raw) {
      return {
        ...raw,
        state: raw.state || presetState,
      };
    }

    const relation = activeCandidate?.relation?.toLowerCase() || "";
    const isSpouse = relation === "spouse" || activeCandidate?.visaCategory === "IR-1" || activeCandidate?.visaCategory === "CR-1";

    return {
      state: presetState,
      isMarried: isSpouse ? true : null,
      relationshipToApplicant: isSpouse ? "spouse" : relation ? "other" : "",
    };
  }, [savedResult, presetState, activeCandidate]);

  const handleClose = () => setIsOpen(false);

  const handleSave = (result: any) => {
    try {
      const storageKey = `sponsorshipCalc_${activeCandidateId}`;
      localStorage.setItem(storageKey, JSON.stringify(result));

      if (activeCandidateId === "candidate-1") {
        localStorage.setItem("sponsorshipCalc", JSON.stringify(result));
      }

      const profileKey = `sponsorshipCalculator_${activeCandidateId}`;
      updateProfile(
        {
          [profileKey]: result,
          ...(activeCandidateId === "candidate-1" ? { sponsorshipCalculator: result } : {}),
        } as any,
        { immediate: true }
      );

      setSavedResult(result);
      showToast(
        `Sponsorship plan saved for ${activeCandidate?.fullName || activeCandidate?.label || "beneficiary"}.`,
        "success"
      );
    } catch (e) {
      console.error("Error saving sponsorship calculation:", e);
      showToast("Plan saved locally.", "info");
    }
    setIsOpen(false);
  };

  const beneficiaryName = activeCandidate?.fullName || activeCandidate?.label || "Beneficiary";
  const beneficiaryRelation = activeCandidate?.relation ? ` (${activeCandidate.relation})` : "";

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
        <div className="animate-in fade-in text-center duration-700 max-w-lg bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 shadow-xl">
          {isMultiCandidate && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 mb-4">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Beneficiary: {beneficiaryName}{beneficiaryRelation}</span>
            </div>
          )}

          <h1 className="mb-2 text-3xl font-black text-[#0f1f38]">Affidavit of Support</h1>
          <p className="mb-6 text-[#3a4f63] text-sm leading-relaxed">
            Determine your sponsorship threshold and form requirements under USCIS poverty guidelines for {beneficiaryName}.
          </p>

          {savedResult && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
                  Saved Plan Status
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${savedResult.isEligible ? "text-teal-700" : "text-rose-600"}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {savedResult.isEligible ? "Eligible" : "Requires Joint Sponsor / Assets"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Household Size: <strong>{savedResult.householdSize}</strong> · Required: <strong>${(savedResult.requiredIncome ?? 0).toLocaleString()}</strong> · Total: <strong>${(savedResult.totalIncome ?? 0).toLocaleString()}</strong>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-[12px] bg-[#0d7377] p-[14px_32px] font-semibold text-white shadow-lg transition-all hover:opacity-90 inline-flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              {savedResult ? "Update Calculation" : "Launch Calculator"}
            </button>
          </div>
        </div>
      )}

      <SponsorshipCalculatorTool
        isOpen={isOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={initialData}
        lockState={false}
        candidateInfo={{
          id: activeCandidateId,
          name: beneficiaryName,
          relation: activeCandidate?.relation,
          visaCategory: activeCandidate?.visaCategory,
        }}
      />
    </div>
  );
}
