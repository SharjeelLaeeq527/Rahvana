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
} from "lucide-react";

// --- CONSTANTS ---
const I864_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf";
const I864EZ_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864ez.pdf";
const I864A_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864a.pdf";

export const POVERTY_GUIDELINES: Record<number, { level100: number; level125: number }> = {
  2: { level100: 20440, level125: 25550 },
  3: { level100: 25820, level125: 32275 },
  4: { level100: 31200, level125: 39000 },
  5: { level100: 36580, level125: 45725 },
  6: { level100: 41960, level125: 52450 },
  7: { level100: 47340, level125: 59175 },
  8: { level100: 52720, level125: 65900 },
};

const ADDITIONAL_MEMBER_COST = {
  level100: 5380,
  level125: 6725,
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
  const sponsoringOwnSpouse =
    d.isMarried &&
    d.relationshipToApplicant?.toLowerCase() === "spouse";

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
  const householdSize = calculateSponsorshipHouseholdSize(d);
  const povertyLevel = d.isMilitary && d.currentSponsoredApplicant ? 100 : 125;
  const requiredIncome = getSponsorshipThreshold(householdSize, povertyLevel);

  // FIX: Current Annual Income is the primary eligibility figure.
  // AGI (from tax return) is documentary evidence only — used as fallback
  // if user hasn't entered current income yet.
  const primaryIncome =
    d.currentAnnualIncome > 0
      ? d.currentAnnualIncome
      : (d.agi || 0);

  const hmIncome = (d.householdMembers || []).reduce(
    (sum: number, m: any) => sum + (m.annualIncome || 0),
    0
  );
  const jsIncome = (d.jointSponsors || []).reduce(
    (sum: number, s: any) => sum + (s.annualIncome || 0),
    0
  );
  const totalIncome = primaryIncome + hmIncome + jsIncome;
  const isEligible = totalIncome >= requiredIncome;

  const forms: any[] = [];
  if (!hmIncome && !jsIncome && primaryIncome >= requiredIncome) {
    forms.push({
      name: "Form I-864EZ — Petitioner",
      sub: "Simplified affidavit — petitioner qualifies alone with wage/salary income",
      url: I864EZ_URL,
    });
  } else {
    forms.push({
      name: "Form I-864 — Petitioner",
      sub: "Full affidavit of support for the petitioner",
      url: I864_URL,
    });
  }

  (d.householdMembers || []).forEach((m: any, i: number) => {
    forms.push({
      name: `Form I-864A — Household Member (${m.relationship || i + 1})`,
      sub: "Contract between sponsor and household member",
      url: I864A_URL,
    });
  });

  if (jsIncome > 0) {
    (d.jointSponsors || []).forEach((s: any, i: number) => {
      forms.push({
        name: `Form I-864 — Joint Sponsor (${s.name || i + 1})`,
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
  });

  if (!isOpen) return null;

  const result = getSponsorshipResult(data);

  const generateId = () => Math.random().toString(36).substr(2, 9);

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
      jointSponsors: data.jointSponsors.map((s: any) =>
        s.id === id ? { ...s, ...updates } : s
      ),
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
            className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
            style={{
              width: `${Math.round(((stepIdx + 1) / 10) * 100)}%`,
            }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {stepIdx + 1} / 10
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[560px] flex flex-col">
          {(() => {
            const step = stepIdx;

            // ─── STEP 0: Welcome ───────────────────────────────────────────
            if (step === 0) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                    Sponsorship Calculator · Step 1 of 10
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
                    Welcome to the Integrated Sponsorship Calculator
                  </h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-6">
                    This tool determines your sponsorship strategy based on USCIS requirements.
                    We use your <strong className="text-[#0c1b33]">Current Annual Income</strong> for
                    eligibility, and your <strong className="text-[#0c1b33]">AGI from tax records</strong> as
                    documentary evidence — both are required by USCIS.
                  </p>
                  <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[14px_16px] mb-6">
                    <p className="text-[13px] text-[#3a4f63] leading-[1.6]">
                      Keep your most recent federal tax return (Form 1040) and current pay stubs handy.
                    </p>
                  </div>
                  <button
                    onClick={() => setStepIdx(1)}
                    className="w-full p-[14px_22px] bg-primary text-white rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80 hover:-translate-y-px"
                  >
                    Get Started →
                  </button>
                </div>
              );
            }

            // ─── STEP 1: Petitioner Status ─────────────────────────────────
            if (step === 1) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
                    Sponsorship Calculator · Step 2 of 10
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">
                    Petitioner Status
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setData({ ...data, sponsorStatus: "citizen" })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.sponsorStatus === "citizen" ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:border-primary/50"}`}
                    >
                      <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-slate-900">US Citizen</p>
                    </button>
                    <button
                      onClick={() => setData({ ...data, sponsorStatus: "greenCard" })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.sponsorStatus === "greenCard" ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:border-primary/50"}`}
                    >
                      <User className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-slate-900">Green Card Holder</p>
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className="text-[14px] font-semibold text-[#0c1b33] mb-3">Are you active-duty US Military?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setData({ ...data, isMilitary: true })}
                        className={`p-3 rounded-xl border-2 transition-all ${data.isMilitary === true ? "border-primary bg-primary/5" : "border-slate-200"}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setData({ ...data, isMilitary: false })}
                        className={`p-3 rounded-xl border-2 transition-all ${data.isMilitary === false ? "border-primary bg-primary/5" : "border-slate-200"}`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(0)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button
                      disabled={!data.sponsorStatus || data.isMilitary === null}
                      onClick={() => setStepIdx(2)}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all ${(!data.sponsorStatus || data.isMilitary === null) ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/80"}`}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              );
            }

            // ─── STEP 2: Marital Status ────────────────────────────────────
            if (step === 2) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">Step 3 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6">Marital Status</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setData({ ...data, isMarried: true })}
                      className={`p-6 rounded-xl border-2 transition-all ${data.isMarried === true ? "border-primary bg-primary/5" : "border-slate-200"}`}
                    >
                      <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <p className="font-semibold text-slate-900">Married</p>
                    </button>
                    <button
                      onClick={() => setData({ ...data, isMarried: false, relationshipToApplicant: "" })}
                      className={`p-6 rounded-xl border-2 transition-all ${data.isMarried === false ? "border-primary bg-primary/5" : "border-slate-200"}`}
                    >
                      <User className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <p className="font-semibold text-slate-900">Single / Not Married</p>
                    </button>
                  </div>
                  {data.isMarried && (
                    <div className="mb-6 animate-in zoom-in-95 duration-200">
                      <p className="text-[14px] font-semibold text-[#0c1b33] mb-3 text-left">Are you sponsoring your spouse?</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setData({ ...data, relationshipToApplicant: "spouse" })}
                          className={`p-3 rounded-xl border-2 transition-all ${data.relationshipToApplicant === "spouse" ? "border-primary bg-primary/5" : "border-slate-200"}`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setData({ ...data, relationshipToApplicant: "other" })}
                          className={`p-3 rounded-xl border-2 transition-all ${data.relationshipToApplicant === "other" ? "border-primary bg-primary/5" : "border-slate-200"}`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(1)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button
                      disabled={data.isMarried === null || (data.isMarried && !data.relationshipToApplicant)}
                      onClick={() => setStepIdx(3)}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all ${(data.isMarried === null || (data.isMarried && !data.relationshipToApplicant)) ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/80"}`}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              );
            }

            // ─── STEP 3: Dependents ────────────────────────────────────────
            if (step === 3) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">Step 4 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6">Dependents</h2>
                  <div className="space-y-6 mb-8 text-left">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-2 block">Your Children</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setData({ ...data, numberOfChildren: Math.max(0, data.numberOfChildren - 1) })} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">-</button>
                        <span className="text-2xl font-bold w-12 text-center">{data.numberOfChildren}</span>
                        <button onClick={() => setData({ ...data, numberOfChildren: data.numberOfChildren + 1 })} className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">+</button>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-2 block">Other Tax Dependents</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setData({ ...data, taxDependents: Math.max(0, data.taxDependents - 1) })} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">-</button>
                        <span className="text-2xl font-bold w-12 text-center">{data.taxDependents}</span>
                        <button onClick={() => setData({ ...data, taxDependents: data.taxDependents + 1 })} className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(2)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button onClick={() => setStepIdx(4)} className="flex-1 p-[14px_22px] bg-primary text-white rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80">Continue →</button>
                  </div>
                </div>
              );
            }

            // ─── STEP 4: Previous Sponsorships ────────────────────────────
            if (step === 4) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 text-center">Step 5 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Previous Sponsorships</h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-6 text-center">
                    Have you filed an I-864 for anyone else who is now a Lawful Permanent Resident?
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setData({ ...data, hasPreviousSponsorship: true })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.hasPreviousSponsorship === true ? "border-primary bg-primary/5" : "border-slate-200"}`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setData({ ...data, hasPreviousSponsorship: false, previousSponsoredCount: 0 })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.hasPreviousSponsorship === false ? "border-primary bg-primary/5" : "border-slate-200"}`}
                    >
                      No
                    </button>
                  </div>
                  {data.hasPreviousSponsorship && (
                    <div className="mb-6 animate-in zoom-in-95 duration-200">
                      <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-2 block">How many people?</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setData({ ...data, previousSponsoredCount: Math.max(0, data.previousSponsoredCount - 1) })} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">-</button>
                        <span className="text-2xl font-bold w-12 text-center">{data.previousSponsoredCount}</span>
                        <button onClick={() => setData({ ...data, previousSponsoredCount: data.previousSponsoredCount + 1 })} className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">+</button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(3)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button
                      disabled={data.hasPreviousSponsorship === null}
                      onClick={() => setStepIdx(5)}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all ${data.hasPreviousSponsorship === null ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/80"}`}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              );
            }

            // ─── STEP 5: Current Sponsoring ───────────────────────────────
            if (step === 5) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 text-center">Step 6 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Current Sponsoring</h2>
                  <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-6 text-center">
                    Who else is being sponsored in this application?
                  </p>
                  <div className="space-y-4 mb-8">
                    <label className="flex items-center gap-4 p-4 rounded-xl border-2 bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed">
                      <input type="checkbox" checked={true} readOnly className="w-5 h-5 rounded border-slate-300 text-primary" />
                      <div>
                        <p className="font-semibold text-slate-900">Main Applicant</p>
                        <p className="text-xs text-slate-500">The person you filed the I-130 for.</p>
                      </div>
                    </label>
                    {data.relationshipToApplicant !== "spouse" && (
                      <button
                        onClick={() => setData({ ...data, currentSponsoredSpouse: !data.currentSponsoredSpouse })}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${data.currentSponsoredSpouse ? "border-primary bg-primary/5" : "bg-white border-slate-200"}`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${data.currentSponsoredSpouse ? "bg-primary border-primary" : "border-slate-300"}`}>
                          {data.currentSponsoredSpouse && <Check size={14} className="text-white" />}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-900">Applicant's Spouse</p>
                          <p className="text-xs text-slate-500">If they are immigrating at the same time.</p>
                        </div>
                      </button>
                    )}
                    <div className="p-4 rounded-xl border-2 border-slate-200 bg-white">
                      <p className="font-semibold text-slate-900 mb-2">Applicant's Children</p>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setData({ ...data, currentSponsoredChildren: Math.max(0, data.currentSponsoredChildren - 1) })} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">-</button>
                        <span className="text-xl font-bold w-8 text-center">{data.currentSponsoredChildren}</span>
                        <button onClick={() => setData({ ...data, currentSponsoredChildren: data.currentSponsoredChildren + 1 })} className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(4)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button onClick={() => setStepIdx(6)} className="flex-1 p-[14px_22px] bg-primary text-white rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80">Continue →</button>
                  </div>
                </div>
              );
            }

            // ─── STEP 6: Income Details ────────────────────────────────────
            if (step === 6) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 text-center">Step 7 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">Income Details</h2>

                  {/* Explainer banner */}
                  <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[12px_14px] mb-8">
                    <p className="text-[12px] text-[#3a4f63] leading-[1.6]">
                      <strong className="text-[#0c1b33]">How USCIS uses these:</strong><br />
                      ① <strong>Current Income</strong> — determines eligibility (125% Federal Poverty Guideline).<br />
                      ② <strong>AGI from tax return</strong> — documentary evidence, submitted alongside Form I-864.
                    </p>
                  </div>

                  <div className="space-y-8 mb-8">
                    {/* ── Field 1: Current Annual Income (PRIMARY — eligibility) */}
                    <div>
                      <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-1 block">
                        1. Current Annual Income
                        <span className="ml-2 text-[10px] normal-case font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-[2px] rounded-full">Eligibility Check</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={data.currentAnnualIncome || ""}
                          onChange={(e) => setData({ ...data, currentAnnualIncome: parseInt(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-2xl font-bold focus:border-primary outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Your expected income this calendar year (e.g. current monthly salary × 12).
                        USCIS uses this to verify you meet the 125% poverty threshold.
                      </p>
                    </div>

                    {/* ── Field 2: AGI from Tax Return (DOCUMENTARY EVIDENCE) */}
                    <div>
                      <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-1 block">
                        2. Most Recent AGI (Tax Record)
                        <span className="ml-2 text-[10px] normal-case font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-[2px] rounded-full">Documentary Evidence</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={data.agi || ""}
                          onChange={(e) => setData({ ...data, agi: parseInt(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-2xl font-bold focus:border-primary outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Adjusted Gross Income — <strong>Line 11</strong> of your most recent IRS Form 1040.
                        Required by USCIS as supporting evidence; also used as a fallback if current income is not entered.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(5)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button onClick={() => setStepIdx(7)} className="flex-1 p-[14px_22px] bg-primary text-white rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80">Continue →</button>
                  </div>
                </div>
              );
            }

            // ─── STEP 7: Initial Status ────────────────────────────────────
            if (step === 7) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 text-center">Step 8 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Initial Status</h2>

                  <div className={`p-6 rounded-2xl border-2 mb-8 ${result.isEligible ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Current Standing</span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${result.isEligible ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                        {result.isEligible ? "Qualified" : "Shortfall"}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">
                      ${result.primaryIncome.toLocaleString()} / ${result.requiredIncome.toLocaleString()}
                    </div>
                    <p className="text-[13px] text-slate-600">
                      {result.isEligible
                        ? "Based on your income and household size, you appear to qualify as the sole sponsor."
                        : `You are $${result.shortfall.toLocaleString()} below the required threshold.`}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-[14px] font-bold text-slate-900">Do you need to add support?</p>
                    <button
                      onClick={() => setStepIdx(8)}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-primary transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Add Support Income</p>
                        <p className="text-xs text-slate-500">Add household members or joint sponsors.</p>
                      </div>
                      <Plus size={18} className="text-slate-400 group-hover:text-primary" />
                    </button>
                  </div>

                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(6)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button onClick={() => setStepIdx(9)} className="flex-1 p-[14px_22px] bg-primary text-white rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80">View Final Plan →</button>
                  </div>
                </div>
              );
            }

            // ─── STEP 8: Support Resources ────────────────────────────────
            if (step === 8) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 text-center">Step 9 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Support Resources</h2>

                  <div className="space-y-6 mb-8 text-left">
                    {/* Household Members */}
                    <div className="border-2 border-primary/20 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="p-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Home size={16} className="text-primary" />
                          <span className="font-bold text-slate-900">Household Members</span>
                        </div>
                        <button onClick={addHouseholdMember} className="p-1 px-3 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/80 transition-all">+ Add</button>
                      </div>
                      <div className="p-4 space-y-3">
                        {data.householdMembers.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No members added</p>
                        ) : (
                          data.householdMembers.map((m: any) => (
                            <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="flex gap-2 mb-2">
                                <select
                                  value={m.relationship}
                                  onChange={(e) => updateHouseholdMember(m.id, { relationship: e.target.value })}
                                  className="flex-1 p-2 text-xs border rounded-lg bg-slate-50"
                                >
                                  <option value="">Relationship...</option>
                                  <option value="Spouse">Spouse</option>
                                  <option value="Child">Child</option>
                                  <option value="Parent">Parent</option>
                                  <option value="Sibling">Sibling</option>
                                </select>
                                <button onClick={() => removeHouseholdMember(m.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><X size={14} /></button>
                              </div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input
                                  type="number"
                                  value={m.annualIncome || ""}
                                  onChange={(e) => updateHouseholdMember(m.id, { annualIncome: parseInt(e.target.value) || 0 })}
                                  className="w-full pl-6 p-2 text-sm border rounded-lg font-bold"
                                  placeholder="Income"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Joint Sponsors */}
                    <div className="border-2 border-primary/20 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="p-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-primary" />
                          <span className="font-bold text-slate-900">Joint Sponsors</span>
                        </div>
                        <button onClick={addJointSponsor} className="p-1 px-3 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/80 transition-all">+ Add</button>
                      </div>
                      <div className="p-4 space-y-3">
                        {data.jointSponsors.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No joint sponsors added</p>
                        ) : (
                          data.jointSponsors.map((s: any) => (
                            <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={s.name}
                                  onChange={(e) => updateJointSponsor(s.id, { name: e.target.value })}
                                  placeholder="Sponsor Name"
                                  className="flex-1 p-2 text-xs border rounded-lg bg-slate-50"
                                />
                                <button onClick={() => removeJointSponsor(s.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><X size={14} /></button>
                              </div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input
                                  type="number"
                                  value={s.annualIncome || ""}
                                  onChange={(e) => updateJointSponsor(s.id, { annualIncome: parseInt(e.target.value) || 0 })}
                                  className="w-full pl-6 p-2 text-sm border rounded-lg font-bold"
                                  placeholder="Income"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(7)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Back</button>
                    <button onClick={() => setStepIdx(9)} className="flex-1 p-[14px_22px] bg-primary text-white rounded-[10px] text-[15px] font-semibold transition-all hover:bg-primary/80">Continue →</button>
                  </div>
                </div>
              );
            }

            // ─── STEP 9: Final Plan ────────────────────────────────────────
            if (step === 9) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 text-center">Step 10 of 10</div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Final Sponsorship Plan</h2>

                  <div className="space-y-4 mb-8">
                    {/* Result card */}
                    <div className={`p-6 rounded-2xl border-2 ${result.isEligible ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Final Conclusion</div>
                        <div className={`text-2xl font-black mb-2 ${result.isEligible ? "text-emerald-700" : "text-rose-700"}`}>
                          {result.isEligible ? "Requirement Met ✓" : "Threshold Gap Not Met ✗"}
                        </div>
                        <p className="text-[13px] text-slate-600">
                          Total Household Income: <strong className="text-[#0c1b33]">${result.totalIncome.toLocaleString()}</strong><br />
                          Required for Household of {result.householdSize}: <strong className="text-[#0c1b33]">${result.requiredIncome.toLocaleString()}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Income breakdown */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-3">Income Breakdown</div>
                      <div className="space-y-2 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Primary Income
                            <span className="ml-1 text-[10px] text-slate-400">
                              {data.currentAnnualIncome > 0 ? "(Current Annual)" : "(AGI Fallback)"}
                            </span>
                          </span>
                          <span className="font-bold">${result.primaryIncome.toLocaleString()}</span>
                        </div>
                        {result.hmIncome > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Household Members</span>
                            <span className="font-bold">${result.hmIncome.toLocaleString()}</span>
                          </div>
                        )}
                        {result.jsIncome > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Joint Sponsors</span>
                            <span className="font-bold">${result.jsIncome.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                          <span className="font-bold text-slate-800">Total</span>
                          <span className="font-black text-slate-900">${result.totalIncome.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Required forms */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-3">Required Forms</div>
                      <div className="space-y-2">
                        {result.forms.map((f: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100">
                            <FileText size={16} className="text-primary mt-1 shrink-0" />
                            <div>
                              <div className="text-sm font-bold text-slate-900">{f.name}</div>
                              <div className="text-[11px] text-slate-500">{f.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button onClick={() => setStepIdx(8)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63]">← Edit Support</button>
                    <button
                      onClick={() => onSave(result)}
                      className="flex-1 p-[14px_22px] bg-emerald-600 text-white rounded-[10px] text-[15px] font-semibold shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:-translate-y-px"
                    >
                      Complete & Save Plan →
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