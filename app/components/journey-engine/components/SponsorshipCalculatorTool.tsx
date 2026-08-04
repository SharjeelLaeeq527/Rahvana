"use client";

import React, { useState } from "react";
import {
  X,
  Shield,
  User,
  Users,
  Plus,
  Home,
  FileText,
  Check,
  ArrowRight,
  ArrowLeft,
  Heart,
  DollarSign,
  UserPlus,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

// --- CONSTANTS ---
const I864_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf";
const I864EZ_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864ez.pdf";
const I864A_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864a.pdf";
const I864P_URL = "https://www.uscis.gov/i-864p";

// --- COLOR PALETTE ---
const COLORS = {
  primary: "#0d7377", // Dark Teal
  secondary: "#afdbdb", // Light Aqua
  household: "#cdadcc", // Soft Purple
  joint: "#89a4a0", // Sage
  danger: "#db8090", // Rose/Coral
};

export const POVERTY_GUIDELINES: Record<number, { level100: number; level125: number }> = {
  2: { level100: 21640, level125: 27050 },
  3: { level100: 27320, level125: 34150 },
  4: { level100: 33000, level125: 41250 },
  5: { level100: 38680, level125: 48350 },
  6: { level100: 44360, level125: 55450 },
  7: { level100: 50040, level125: 62550 },
  8: { level100: 55720, level125: 69650 },
};

const ADDITIONAL_MEMBER_COST = {
  level100: 5680,
  level125: 7100,
};

// --- EXPORTED LOGIC FOR REUSE ---
export const getSponsorshipThreshold = (householdSize: number, level: 100 | 125) => {
  const key = level === 100 ? "level100" : "level125";
  const size = Math.max(householdSize, 2);
  if (size <= 8) return POVERTY_GUIDELINES[size][key];
  const extraMembers = size - 8;
  return POVERTY_GUIDELINES[8][key] + extraMembers * ADDITIONAL_MEMBER_COST[key];
};

export const calculateSponsorshipHouseholdSize = (d: any): number => {
  const sponsoringOwnSpouse = d.isMarried && d.relationshipToApplicant?.toLowerCase() === "spouse";

  return (
    1 + // Sponsor
    (d.isMarried && !sponsoringOwnSpouse ? 1 : 0) +
    (d.numberOfChildren || 0) +
    (d.taxDependents || 0) +
    (d.previousSponsoredCount || 0) +
    (d.currentSponsoredApplicant ? 1 : 0) +
    (d.currentSponsoredSpouse ? 1 : 0) +
    (d.currentSponsoredChildren || 0)
  );
};

export const getSponsorshipResult = (d: any) => {
  // Self-petition Check
  if (d.isVAWA || d.isWidow || d.isSpecialImmigrant) {
    return {
      isEligible: true,
      isSelfPetition: true,
      householdSize: 1,
      requiredIncome: 0,
      totalIncome: 0,
      forms: [
        {
          id: "i864w",
          name: "Form I-864W",
          sub: "Request for Exemption for Intending Immigrant",
          url: "#",
        },
      ],
      raw: d,
    };
  }

  const householdSize = calculateSponsorshipHouseholdSize(d);
  const povertyLevel = d.isMilitary && d.currentSponsoredApplicant ? 100 : 125;
  const requiredIncome = getSponsorshipThreshold(householdSize, povertyLevel);

  // Primary Income Logic (AGI Fallback)
  const primaryIncome = d.currentAnnualIncome > 0 ? d.currentAnnualIncome : d.agi || 0;

  const hmIncome = (d.householdMembers || []).reduce(
    (sum: number, m: any) => sum + (m.annualIncome || 0),
    0
  );
  const jsIncome = (d.jointSponsors || []).reduce(
    (sum: number, s: any) => sum + (s.annualIncome || 0),
    0
  );

  // Assets Logic
  const assetMultiplier =
    d.relationshipToApplicant?.toLowerCase() === "spouse" ||
    d.relationshipToApplicant?.toLowerCase() === "parent"
      ? 3
      : 5;
  const usableAssets = (d.assetValue || 0) / assetMultiplier;

  const totalIncome = primaryIncome + hmIncome + jsIncome + usableAssets;
  const isEligible = totalIncome >= requiredIncome || d.sponsorDeceased; // Substitute sponsor logic simplified

  const forms: any[] = [];
  if (d.sponsorDeceased) {
    forms.push({
      id: "i864",
      name: "Form I-864 \u2014 Substitute Sponsor",
      sub: "Required when original petitioner is deceased",
      url: I864_URL,
    });
  } else if (
    !hmIncome &&
    !jsIncome &&
    (d.assetValue || 0) === 0 &&
    primaryIncome >= requiredIncome
  ) {
    forms.push({
      id: "i864ez",
      name: "Form I-864EZ \u2014 Petitioner",
      sub: "Simplified affidavit \u2014 petitioner qualifies alone with wage/salary income",
      url: I864EZ_URL,
    });
  } else {
    forms.push({
      id: "i864",
      name: "Form I-864 \u2014 Petitioner",
      sub: "Full affidavit of support for the petitioner",
      url: I864_URL,
    });
  }

  (d.householdMembers || []).forEach((m: any, i: number) => {
    forms.push({
      id: "i864a",
      name: `Form I-864A \u2014 Household Member (${m.relationship || i + 1})`,
      sub: "Contract between sponsor and household member",
      url: I864A_URL,
    });
  });

  if (jsIncome > 0) {
    (d.jointSponsors || []).forEach((s: any, i: number) => {
      forms.push({
        id: "i864",
        name: `Form I-864 \u2014 Joint Sponsor (${s.name || i + 1})`,
        sub: "Required for additional financial support",
        url: I864_URL,
      });
    });
  }

  return {
    isEligible,
    householdSize,
    requiredIncome,
    totalIncome,
    primaryIncome,
    hmIncome,
    jsIncome,
    assetIncome: usableAssets,
    shortfall: Math.max(0, requiredIncome - totalIncome),
    forms,
    raw: d,
  };
};

interface SponsorshipCalculatorToolProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (result: any) => void;
}

export default function SponsorshipCalculatorTool({
  isOpen,
  onClose,
  initialData,
  onSave,
}: SponsorshipCalculatorToolProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});
  const [data, setData] = useState({
    sponsorStatus: initialData?.sponsorStatus || "",
    isMilitary: initialData?.isMilitary ?? null,
    isMarried: initialData?.isMarried ?? null,
    relationshipToApplicant: initialData?.relationshipToApplicant || "",
    numberOfChildren: initialData?.numberOfChildren || 0,
    taxDependents: initialData?.taxDependents || 0,
    hasPreviousSponsorship: initialData?.hasPreviousSponsorship ?? null,
    previousSponsoredCount: initialData?.previousSponsoredCount || 0,
    currentSponsoredApplicant: true,
    currentSponsoredSpouse: initialData?.currentSponsoredSpouse || false,
    currentSponsoredChildren: initialData?.currentSponsoredChildren || 0,
    agi: initialData?.agi || 0,
    currentAnnualIncome: initialData?.currentAnnualIncome || 0,
    householdMembers: initialData?.householdMembers || [],
    jointSponsors: initialData?.jointSponsors || [],
    // Advanced Options
    assetValue: initialData?.assetValue || 0,
    sponsorDeceased: initialData?.sponsorDeceased || false,
    isVAWA: initialData?.isVAWA || false,
    isWidow: initialData?.isWidow || false,
    isSpecialImmigrant: initialData?.isSpecialImmigrant || false,
  });

  if (!isOpen) return null;

  const result = getSponsorshipResult(data);
  const getStepColor = (idx: number) => {
    switch (idx) {
      case 1:
        return COLORS.joint; // Petitioner
      case 2:
        return COLORS.primary; // Marital
      case 3:
        return COLORS.danger; // Dependents
      case 4:
        return COLORS.joint; // Previous
      case 5:
        return COLORS.primary; // Sponsoring
      case 6:
        return COLORS.secondary; // Income
      case 8:
        return COLORS.household; // Household
      case 9:
        return "#f59e0b"; // Alternatives (Amber)
      default:
        return COLORS.primary;
    }
  };
  const stepColor = getStepColor(stepIdx);

  // --- INTERNAL HELPERS ---
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const toggleOption = (id: string) => setExpandedOptions((prev) => ({ ...prev, [id]: !prev[id] }));

  const addHouseholdMember = () => {
    setData({
      ...data,
      householdMembers: [
        ...data.householdMembers,
        { id: generateId(), relationship: "", annualIncome: 0 },
      ],
    });
  };

  const removeHouseholdMember = (id: string) => {
    setData({
      ...data,
      householdMembers: data.householdMembers.filter((m: any) => m.id !== id),
    });
  };

  const updateHouseholdMember = (id: string, updates: any) => {
    setData({
      ...data,
      householdMembers: data.householdMembers.map((m: any) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  };

  const addJointSponsor = () => {
    setData({
      ...data,
      jointSponsors: [
        ...data.jointSponsors,
        { id: generateId(), name: "", relationship: "", annualIncome: 0 },
      ],
    });
  };

  const removeJointSponsor = (id: string) => {
    setData({
      ...data,
      jointSponsors: data.jointSponsors.filter((s: any) => s.id !== id),
    });
  };

  const updateJointSponsor = (id: string, updates: any) => {
    setData({
      ...data,
      jointSponsors: data.jointSponsors.map((s: any) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[150] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center h-[64px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r transition-all duration-500"
            style={{
              width: `${Math.round(((stepIdx + 1) / 11) * 100)}%`,
              backgroundColor: COLORS.primary,
            }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {stepIdx + 1} / 11
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[560px] flex flex-col">
          {(() => {
            const step = stepIdx;

            if (step === 0) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4"
                    style={{ color: COLORS.primary }}
                  >
                    Sponsorship Calculator · Step 1 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
                    Welcome to the Sponsorship Calculator
                  </h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-6">
                    This tool determines your sponsorship strategy based on USCIS requirements. We
                    use your <strong className="text-[#0c1b33]">Current Annual Income</strong> for
                    eligibility, and your{" "}
                    <strong className="text-[#0c1b33]">AGI from tax records</strong> as documentary
                    evidence.
                  </p>
                  <div
                    className="rounded-[10px] p-[14px_16px] mb-4"
                    style={{
                      backgroundColor: `${COLORS.secondary}20`,
                      border: `1px solid ${COLORS.secondary}50`,
                    }}
                  >
                    <p className="text-[13px] text-[#3a4f63] leading-[1.6]">
                      Keep your most recent federal tax return (Form 1040) and current pay stubs
                      handy.
                    </p>
                  </div>
                  <div className="text-[12px] text-[#6b8097] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <span>Poverty guidelines last updated: <strong>March 1, 2026</strong></span>
                    <a
                      href={I864P_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-semibold flex items-center gap-1 transition-all hover:opacity-85"
                      style={{ color: COLORS.primary }}
                    >
                      Official USCIS I-864P Guidelines &rarr;
                    </a>
                  </div>
                  <button
                    onClick={() => setStepIdx(1)}
                    style={{ backgroundColor: COLORS.primary }}
                    className="w-full p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
                  >
                    Get Started →
                  </button>
                </div>
              );
            }

            if (step === 1) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: stepColor }}
                  >
                    Step 2 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">
                    Petitioner Status
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setData({ ...data, sponsorStatus: "citizen" })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.sponsorStatus === "citizen" ? "" : "border-slate-200 hover:bg-slate-50"}`}
                      style={{
                        borderColor: data.sponsorStatus === "citizen" ? COLORS.joint : undefined,
                        backgroundColor:
                          data.sponsorStatus === "citizen" ? `${COLORS.joint}10` : undefined,
                      }}
                    >
                      <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.joint }} />
                      <p className="font-semibold text-slate-900">US Citizen</p>
                    </button>
                    <button
                      onClick={() => setData({ ...data, sponsorStatus: "greenCard" })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.sponsorStatus === "greenCard" ? "" : "border-slate-200 hover:bg-slate-50"}`}
                      style={{
                        borderColor: data.sponsorStatus === "greenCard" ? COLORS.joint : undefined,
                        backgroundColor:
                          data.sponsorStatus === "greenCard" ? `${COLORS.joint}10` : undefined,
                      }}
                    >
                      <User className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.joint }} />
                      <p className="font-semibold text-slate-900">Green Card Holder</p>
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className="text-[14px] font-semibold text-[#0c1b33] mb-3">
                      Are you active-duty US Military?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setData({ ...data, isMilitary: true })}
                        className={`p-3 rounded-xl border-2 transition-all ${data.isMilitary === true ? "" : "border-slate-200"}`}
                        style={{
                          borderColor: data.isMilitary === true ? COLORS.joint : undefined,
                          backgroundColor:
                            data.isMilitary === true ? `${COLORS.joint}10` : undefined,
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setData({ ...data, isMilitary: false })}
                        className={`p-3 rounded-xl border-2 transition-all ${data.isMilitary === false ? "" : "border-slate-200"}`}
                        style={{
                          borderColor: data.isMilitary === false ? COLORS.joint : undefined,
                          backgroundColor:
                            data.isMilitary === false ? `${COLORS.joint}10` : undefined,
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(0)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      disabled={!data.sponsorStatus || data.isMilitary === null}
                      onClick={() => setStepIdx(2)}
                      style={{
                        backgroundColor:
                          !data.sponsorStatus || data.isMilitary === null ? "#e2e8f0" : stepColor,
                      }}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${!data.sponsorStatus || data.isMilitary === null ? "text-slate-400 cursor-not-allowed" : "text-white hover:opacity-90"}`}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 2) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4"
                    style={{ color: stepColor }}
                  >
                    Step 3 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6">
                    Marital Status
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setData({ ...data, isMarried: true })}
                      className={`p-6 rounded-xl border-2 transition-all ${data.isMarried === true ? "" : "border-slate-200"}`}
                      style={{
                        borderColor: data.isMarried === true ? COLORS.primary : undefined,
                        backgroundColor:
                          data.isMarried === true ? `${COLORS.primary}10` : undefined,
                      }}
                    >
                      <Users className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.primary }} />
                      <p className="font-semibold text-slate-900">Married</p>
                    </button>
                    <button
                      onClick={() =>
                        setData({ ...data, isMarried: false, relationshipToApplicant: "" })
                      }
                      className={`p-6 rounded-xl border-2 transition-all ${data.isMarried === false ? "" : "border-slate-200"}`}
                      style={{
                        borderColor: data.isMarried === false ? COLORS.primary : undefined,
                        backgroundColor:
                          data.isMarried === false ? `${COLORS.primary}10` : undefined,
                      }}
                    >
                      <User className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.primary }} />
                      <p className="font-semibold text-slate-900">Single / Not Married</p>
                    </button>
                  </div>
                  {data.isMarried && (
                    <div className="mb-6 animate-in zoom-in-95 duration-200">
                      <p className="text-[14px] font-semibold text-[#0c1b33] mb-3 text-left">
                        Are you sponsoring your spouse?
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setData({ ...data, relationshipToApplicant: "spouse" })}
                          className={`p-3 rounded-xl border-2 transition-all ${data.relationshipToApplicant === "spouse" ? "" : "border-slate-200"}`}
                          style={{
                            borderColor:
                              data.relationshipToApplicant === "spouse"
                                ? COLORS.primary
                                : undefined,
                            backgroundColor:
                              data.relationshipToApplicant === "spouse"
                                ? `${COLORS.primary}10`
                                : undefined,
                          }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setData({ ...data, relationshipToApplicant: "other" })}
                          className={`p-3 rounded-xl border-2 transition-all ${data.relationshipToApplicant === "other" ? "" : "border-slate-200"}`}
                          style={{
                            borderColor:
                              data.relationshipToApplicant === "other" ? COLORS.primary : undefined,
                            backgroundColor:
                              data.relationshipToApplicant === "other"
                                ? `${COLORS.primary}10`
                                : undefined,
                          }}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(1)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      disabled={
                        data.isMarried === null || (data.isMarried && !data.relationshipToApplicant)
                      }
                      onClick={() => setStepIdx(3)}
                      style={{
                        backgroundColor:
                          data.isMarried === null ||
                          (data.isMarried && !data.relationshipToApplicant)
                            ? "#e2e8f0"
                            : stepColor,
                      }}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${data.isMarried === null || (data.isMarried && !data.relationshipToApplicant) ? "text-slate-400 cursor-not-allowed" : "text-white hover:opacity-90"}`}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 3) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4"
                    style={{ color: stepColor }}
                  >
                    Step 4 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Dependents
                  </h2>
                  <div className="space-y-6 mb-8 text-left">
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: `${COLORS.danger}05`,
                        borderColor: `${COLORS.danger}30`,
                      }}
                    >
                      <label
                        className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
                        style={{ color: COLORS.danger }}
                      >
                        Your Children
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            setData({
                              ...data,
                              numberOfChildren: Math.max(0, data.numberOfChildren - 1),
                            })
                          }
                          className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold w-12 text-center">
                          {data.numberOfChildren}
                        </span>
                        <button
                          onClick={() =>
                            setData({ ...data, numberOfChildren: data.numberOfChildren + 1 })
                          }
                          style={{ backgroundColor: COLORS.danger }}
                          className="w-10 h-10 rounded-lg text-white flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: `${COLORS.danger}05`,
                        borderColor: `${COLORS.danger}30`,
                      }}
                    >
                      <label
                        className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
                        style={{ color: COLORS.danger }}
                      >
                        Other Tax Dependents
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            setData({ ...data, taxDependents: Math.max(0, data.taxDependents - 1) })
                          }
                          className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold w-12 text-center">
                          {data.taxDependents}
                        </span>
                        <button
                          onClick={() =>
                            setData({ ...data, taxDependents: data.taxDependents + 1 })
                          }
                          style={{ backgroundColor: COLORS.danger }}
                          className="w-10 h-10 rounded-lg text-white flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(2)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setStepIdx(4)}
                      style={{ backgroundColor: stepColor }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 4) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: stepColor }}
                  >
                    Step 5 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Previous Sponsorships
                  </h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-6 text-center">
                    Have you filed an I-864 for anyone else who is now a Lawful Permanent Resident?
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                    <button
                      onClick={() => setData({ ...data, hasPreviousSponsorship: true })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.hasPreviousSponsorship === true ? "" : "border-slate-200"}`}
                      style={{
                        borderColor:
                          data.hasPreviousSponsorship === true ? COLORS.joint : undefined,
                        backgroundColor:
                          data.hasPreviousSponsorship === true ? `${COLORS.joint}10` : undefined,
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() =>
                        setData({
                          ...data,
                          hasPreviousSponsorship: false,
                          previousSponsoredCount: 0,
                        })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${data.hasPreviousSponsorship === false ? "" : "border-slate-200"}`}
                      style={{
                        borderColor:
                          data.hasPreviousSponsorship === false ? COLORS.joint : undefined,
                        backgroundColor:
                          data.hasPreviousSponsorship === false ? `${COLORS.joint}10` : undefined,
                      }}
                    >
                      No
                    </button>
                  </div>
                  {data.hasPreviousSponsorship && (
                    <div className="mb-6 animate-in zoom-in-95 duration-200">
                      <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-2 block">
                        How many people?
                      </label>
                      <div className="flex items-center gap-4 justify-center">
                        <button
                          onClick={() =>
                            setData({
                              ...data,
                              previousSponsoredCount: Math.max(0, data.previousSponsoredCount - 1),
                            })
                          }
                          className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold w-12 text-center">
                          {data.previousSponsoredCount}
                        </span>
                        <button
                          onClick={() =>
                            setData({
                              ...data,
                              previousSponsoredCount: data.previousSponsoredCount + 1,
                            })
                          }
                          style={{ backgroundColor: COLORS.joint }}
                          className="w-10 h-10 text-white rounded-lg flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(3)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      disabled={data.hasPreviousSponsorship === null}
                      onClick={() => setStepIdx(5)}
                      style={{
                        backgroundColor:
                          data.hasPreviousSponsorship === null ? "#e2e8f0" : stepColor,
                      }}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${data.hasPreviousSponsorship === null ? "text-slate-400 cursor-not-allowed" : "text-white hover:opacity-90"}`}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 5) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: stepColor }}
                  >
                    Step 6 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">
                    Who are you Sponsoring?
                  </h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-6 text-center">
                    Select all who are immigrating in this application.
                  </p>
                  <div className="space-y-4 mb-8">
                    <div
                      className="p-4 rounded-xl border flex items-center gap-4 bg-opacity-10"
                      style={{
                        backgroundColor: `${COLORS.primary}10`,
                        borderColor: `${COLORS.primary}30`,
                      }}
                    >
                      <Check className="w-6 h-6" style={{ color: COLORS.primary }} />
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: COLORS.primary }}>
                          Main Applicant
                        </p>
                        <p className="text-xs text-slate-500">
                          The primary person being sponsored.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-slate-200 bg-white">
                      <p className="font-semibold text-slate-900 mb-2">Applicant's Children</p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            setData({
                              ...data,
                              currentSponsoredChildren: Math.max(
                                0,
                                data.currentSponsoredChildren - 1
                              ),
                            })
                          }
                          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold w-8 text-center">
                          {data.currentSponsoredChildren}
                        </span>
                        <button
                          onClick={() =>
                            setData({
                              ...data,
                              currentSponsoredChildren: data.currentSponsoredChildren + 1,
                            })
                          }
                          style={{ backgroundColor: COLORS.primary }}
                          className="w-8 h-8 text-white rounded-lg flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(4)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setStepIdx(6)}
                      style={{ backgroundColor: stepColor }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 6) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: stepColor }}
                  >
                    Step 7 of 11
                  </div>

                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Income Details
                  </h2>

                  <div className="space-y-8 mb-8">
                    {/* SINGLE INPUT ONLY */}
                    <div
                      className="p-6 rounded-2xl border-2"
                      style={{
                        backgroundColor: `${COLORS.secondary}05`,
                        borderColor: `${COLORS.secondary}30`,
                      }}
                    >
                      <label
                        className="text-[12px] font-black uppercase tracking-wider mb-2 block"
                        style={{ color: COLORS.secondary }}
                      >
                        Current Annual Income (AGI)
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">
                          $
                        </span>

                        <input
                          type="number"
                          value={data.currentAnnualIncome || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              currentAnnualIncome: parseInt(e.target.value) || 0,
                              agi: parseInt(e.target.value) || 0, // sync AGI automatically
                            })
                          }
                          className="w-full pl-8 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-2xl font-bold focus:border-primary outline-none transition-all"
                          placeholder="0"
                        />
                      </div>

                      {/* UPDATED DESCRIPTION */}
                      <p className="text-[11px] text-slate-500 mt-2">
                        Adjusted Gross Income (AGI), Line 11 of your most recent IRS Form 1040.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(5)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    <button
                      onClick={() => setStepIdx(7)}
                      style={{ backgroundColor: COLORS.primary }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 7) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: COLORS.primary }}
                  >
                    Step 8 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Initial Status
                  </h2>

                  <div
                    className={`p-6 rounded-2xl border-2 mb-6`}
                    style={{
                      backgroundColor: result.isEligible
                        ? `${COLORS.secondary}20`
                        : `${COLORS.danger}20`,
                      borderColor: result.isEligible ? COLORS.secondary : COLORS.danger,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Current Standing
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-[11px] font-bold uppercase"
                        style={{
                          backgroundColor: result.isEligible ? COLORS.secondary : COLORS.danger,
                          color: "white",
                        }}
                      >
                        {result.isEligible ? "Qualified" : "Shortfall"}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">
                      ${result.primaryIncome.toLocaleString()} / $
                      {result.requiredIncome.toLocaleString()}
                    </div>
                    <p className="text-[13px] text-slate-600 font-medium">
                      {result.isEligible
                        ? "Based on your income and household size, you qualify as the sole sponsor."
                        : `You are $${(result.shortfall ?? 0).toLocaleString()} below the threshold.`}
                    </p>
                  </div>

                  <div className="text-[12px] text-[#6b8097] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 px-1">
                    <span>Poverty guidelines last updated: <strong>March 1, 2026</strong></span>
                    <a
                      href={I864P_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-semibold flex items-center gap-1 transition-all hover:opacity-85"
                      style={{ color: COLORS.primary }}
                    >
                      Official USCIS I-864P Guidelines &rarr;
                    </a>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-[14px] font-bold text-slate-900">
                      Do you need to add support?
                    </p>
                    <button
                      onClick={() => setStepIdx(8)}
                      className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary transition-all text-left flex items-center justify-between group bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-900">Add Support Income</p>
                        <p className="text-xs text-slate-500">
                          Household members or Joint sponsors.
                        </p>
                      </div>
                      <Plus size={24} className="text-slate-400 group-hover:text-primary" />
                    </button>
                    {!result.isEligible && (
                      <button
                        onClick={() => setStepIdx(9)}
                        className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary transition-all text-left flex items-center justify-between group bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-slate-900">More Options / What-if</p>
                          <p className="text-xs text-slate-500">
                            Substitute sponsor, Assets, or Self-petition.
                          </p>
                        </div>
                        <AlertTriangle
                          size={24}
                          className="text-slate-400 group-hover:text-amber-500"
                        />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(6)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setStepIdx(10)}
                      style={{ backgroundColor: COLORS.primary }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      View Final Plan <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 8) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: stepColor }}
                  >
                    Step 9 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Support Resources
                  </h2>

                  <div className="space-y-6 mb-8 text-left">
                    <div
                      className="border-2 rounded-2xl overflow-hidden"
                      style={{
                        borderColor: `${COLORS.household}40`,
                        backgroundColor: `${COLORS.household}05`,
                      }}
                    >
                      <div
                        className="p-4 flex justify-between items-center"
                        style={{ backgroundColor: `${COLORS.household}15` }}
                      >
                        <div className="flex items-center gap-2">
                          <Home size={18} style={{ color: COLORS.household }} />
                          <span className="font-bold text-slate-900">Household Members</span>
                        </div>
                        <button
                          onClick={addHouseholdMember}
                          style={{ backgroundColor: COLORS.household }}
                          className="p-1 px-4 text-white rounded-lg text-xs font-bold hover:opacity-80 transition-all"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {data.householdMembers.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2 italic font-medium">
                            No members added
                          </p>
                        ) : (
                          data.householdMembers.map((m: any) => (
                            <div
                              key={m.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                            >
                              <div className="flex gap-2 mb-3">
                                <CustomDropdown
                                  value={m.relationship}
                                  onChange={(value) => updateHouseholdMember(m.id, { relationship: value })}
                                  options={[
                                    { value: "", label: "Relationship..." },
                                    { value: "Spouse", label: "Spouse" },
                                    { value: "Child", label: "Child" },
                                    { value: "Parent", label: "Parent" },
                                    { value: "Sibling", label: "Sibling" },
                                    { value: "Other Living in Household", label: "Other Relative" },
                                  ]}
                                  placeholder="Relationship..."
                                  className="flex-1 [&_button]:w-full [&_button]:min-w-0 [&_button]:bg-slate-50"
                                />
                                <button
                                  onClick={() => removeHouseholdMember(m.id)}
                                  className="p-2 text-red-300 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.annualIncome || ""}
                                onChange={(e) =>
                                  updateHouseholdMember(m.id, {
                                    annualIncome: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full p-3 text-lg border-2 border-slate-100 rounded-lg font-black text-slate-900"
                                placeholder="$ Income"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div
                      className="border-2 rounded-2xl overflow-hidden"
                      style={{
                        borderColor: `${COLORS.joint}40`,
                        backgroundColor: `${COLORS.joint}05`,
                      }}
                    >
                      <div
                        className="p-4 flex justify-between items-center"
                        style={{ backgroundColor: `${COLORS.joint}15` }}
                      >
                        <div className="flex items-center gap-2">
                          <UserPlus size={18} style={{ color: COLORS.joint }} />
                          <span className="font-bold text-slate-900">Joint Sponsors</span>
                        </div>
                        <button
                          onClick={addJointSponsor}
                          style={{ backgroundColor: COLORS.joint }}
                          className="p-1 px-4 text-white rounded-lg text-xs font-bold hover:opacity-80 transition-all"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {data.jointSponsors.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2 italic font-medium">
                            No joint sponsors added
                          </p>
                        ) : (
                          data.jointSponsors.map((s: any) => (
                            <div
                              key={s.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                            >
                              <input
                                type="text"
                                value={s.name}
                                onChange={(e) => updateJointSponsor(s.id, { name: e.target.value })}
                                placeholder="Sponsor Name"
                                className="w-full p-2 mb-2 text-sm border-2 border-slate-100 rounded-lg bg-slate-50"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={s.annualIncome || ""}
                                  onChange={(e) =>
                                    updateJointSponsor(s.id, {
                                      annualIncome: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="flex-1 p-3 text-lg border-2 border-slate-100 rounded-lg font-black text-slate-900"
                                  placeholder="$ Income"
                                />
                                <button
                                  onClick={() => removeJointSponsor(s.id)}
                                  className="p-3 text-red-300 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(7)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setStepIdx(9)}
                      style={{ backgroundColor: stepColor }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 9) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: COLORS.primary }}
                  >
                    Step 10 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Alternative Options
                  </h2>

                  <div className="space-y-4 mb-8">
                    {/* Assets Option */}
                    <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                      <div
                        className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleOption("assets")}
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign size={18} style={{ color: COLORS.secondary }} />
                          <span className="font-bold text-slate-800">
                            Use Assets (Property/Savings)
                          </span>
                        </div>
                        {expandedOptions.assets ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                      {expandedOptions.assets && (
                        <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                          <p className="text-xs text-slate-500 mb-4">
                            You can use 1/3 (spouse/child of USC) or 1/5 of asset value to meet the
                            requirement.
                          </p>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                              $
                            </span>
                            <input
                              type="number"
                              value={data.assetValue || ""}
                              onChange={(e) =>
                                setData({ ...data, assetValue: parseInt(e.target.value) || 0 })
                              }
                              className="w-full pl-8 p-3 text-lg border-2 border-slate-100 rounded-lg"
                              placeholder="Total Asset Value"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Substitute Sponsor Option */}
                    <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                      <div
                        className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleOption("substitute")}
                      >
                        <div className="flex items-center gap-2">
                          <Heart size={18} style={{ color: COLORS.danger }} />
                          <span className="font-bold text-slate-800">Substitute Sponsor</span>
                        </div>
                        {expandedOptions.substitute ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                      {expandedOptions.substitute && (
                        <div className="p-4 bg-white">
                          <p className="text-xs text-slate-500 mb-3">
                            If the original petitioner has passed away.
                          </p>
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.sponsorDeceased}
                              onChange={() =>
                                setData({ ...data, sponsorDeceased: !data.sponsorDeceased })
                              }
                              className="w-4 h-4 rounded"
                            />
                            The Petitioner is Deceased
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Self-Petition Option */}
                    <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                      <div
                        className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleOption("self")}
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={18} style={{ color: COLORS.primary }} />
                          <span className="font-bold text-slate-800">Self-Petition Categories</span>
                        </div>
                        {expandedOptions.self ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                      {expandedOptions.self && (
                        <div className="p-4 bg-white space-y-3">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.isVAWA}
                              onChange={() => setData({ ...data, isVAWA: !data.isVAWA })}
                            />{" "}
                            VAWA Self-petitioner
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.isWidow}
                              onChange={() => setData({ ...data, isWidow: !data.isWidow })}
                            />{" "}
                            Widow(er) of US Citizen
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.isSpecialImmigrant}
                              onChange={() =>
                                setData({ ...data, isSpecialImmigrant: !data.isSpecialImmigrant })
                              }
                            />{" "}
                            Special Immigrant
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(7)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setStepIdx(10)}
                      style={{ backgroundColor: COLORS.primary }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      View Results <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 10) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: COLORS.primary }}
                  >
                    Step 11 of 11
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    Final Sponsorship Plan
                  </h2>

                  <div className="space-y-4 mb-8">
                    <div
                      className={`p-8 rounded-3xl border-2 text-center`}
                      style={{
                        backgroundColor: result.isEligible
                          ? `${COLORS.secondary}20`
                          : `${COLORS.danger}20`,
                        borderColor: result.isEligible ? COLORS.secondary : COLORS.danger,
                      }}
                    >
                      <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">
                        Final Conclusion
                      </div>
                      <div
                        className="text-3xl font-black mb-3"
                        style={{ color: result.isEligible ? COLORS.primary : COLORS.danger }}
                      >
                        {result.isEligible ? "ELIGIBLE \u2713" : "NOT ELIGIBLE \u2717"}
                      </div>
                      <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                        Total Household Income:{" "}
                        <strong className="text-[#0c1b33] text-lg">
                          ${result.totalIncome.toLocaleString()}
                        </strong>
                        <br />
                        Required (Household of {result.householdSize}):{" "}
                        <strong className="text-[#0c1b33] text-lg">
                          ${result.requiredIncome.toLocaleString()}
                        </strong>
                      </p>
                    </div>

                    <div className="text-[12px] text-[#6b8097] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 px-1">
                      <span>Poverty guidelines last updated: <strong>March 1, 2026</strong></span>
                      <a
                        href={I864P_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline font-semibold flex items-center gap-1 transition-all hover:opacity-85"
                        style={{ color: COLORS.primary }}
                      >
                        Official USCIS I-864P Guidelines &rarr;
                      </a>
                    </div>

                    <div className="p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-4 tracking-wider">
                        Required Forms
                      </div>
                      <div className="space-y-3">
                        {result.forms.map((f: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
                          >
                            <FileText
                              size={20}
                              className="mt-1 shrink-0"
                              style={{ color: COLORS.primary }}
                            />
                            <div>
                              <div className="text-sm font-black text-slate-900 leading-tight">
                                {f.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">{f.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      onClick={() =>
                        setStepIdx(data.assetValue > 0 || data.sponsorDeceased ? 9 : 8)
                      }
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Edit Info
                    </button>
                    <button
                      onClick={() => onSave(result)}
                      style={{ backgroundColor: COLORS.primary }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold shadow-lg transition-all hover:opacity-90 hover:-translate-y-px flex items-center justify-center gap-2"
                    >
                      Complete & Save Plan <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
}
