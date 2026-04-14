"use client";

import React, { useState } from "react";
import {
  X, Shield, User, Users, Plus, Home, FileText, Check,
  ArrowRight, ArrowLeft, Heart, DollarSign, UserPlus,
  Trash2, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";

const I864_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf";
const I864EZ_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864ez.pdf";
const I864A_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864a.pdf";

const COLORS = {
  primary: "#0d7377",
  secondary: "#afdbdb",
  household: "#cdadcc",
  joint: "#89a4a0",
  danger: "#db8090",
};

export const POVERTY_GUIDELINES: Record<number, { level100: number; level125: number }> = {
  2: { level100: 20440, level125: 25550 },
  3: { level100: 25820, level125: 32275 },
  4: { level100: 31200, level125: 39000 },
  5: { level100: 36580, level125: 45725 },
  6: { level100: 41960, level125: 52450 },
  7: { level100: 47340, level125: 59175 },
  8: { level100: 52720, level125: 65900 },
};

const ADDITIONAL_MEMBER_COST = { level100: 5380, level125: 6725 };

export const getSponsorshipThreshold = (householdSize: number, level: 100 | 125) => {
  const key = level === 100 ? "level100" : "level125";
  const size = Math.max(householdSize, 2);
  if (size <= 8) return POVERTY_GUIDELINES[size][key];
  return POVERTY_GUIDELINES[8][key] + (size - 8) * ADDITIONAL_MEMBER_COST[key];
};

export const calculateSponsorshipHouseholdSize = (d: any): number => {
  const sponsoringOwnSpouse = d.isMarried && d.relationshipToApplicant?.toLowerCase() === "spouse";
  return (
    1 +
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
  if (d.isVAWA || d.isWidow || d.isSpecialImmigrant) {
    return {
      isEligible: true, isSelfPetition: true, householdSize: 1, requiredIncome: 0, totalIncome: 0,
      primaryIncome: 0, hmIncome: 0, jsIncome: 0, assetIncome: 0, shortfall: 0,
      forms: [{ name: "Form I-864W", sub: "Request for Exemption for Intending Immigrant", url: "#" }], raw: d,
    };
  }

  const householdSize = calculateSponsorshipHouseholdSize(d);
  const povertyLevel = d.isMilitary && d.currentSponsoredApplicant ? 100 : 125;
  const requiredIncome = getSponsorshipThreshold(householdSize, povertyLevel);

  // SINGLE income field — "Current Individual Annual Income" (I-864 Part 6)
  // = what sponsor expects to earn this calendar year
  // = appears as Total Income on IRS Form 1040 Line 9 at year-end
  const primaryIncome = d.currentAnnualIncome || 0;

  const hmIncome = (d.householdMembers || []).reduce((s: number, m: any) => s + (m.annualIncome || 0), 0);
  const jsIncome = (d.jointSponsors || []).reduce((s: number, j: any) => s + (j.annualIncome || 0), 0);
  const assetMultiplier = (d.relationshipToApplicant?.toLowerCase() === "spouse" || d.relationshipToApplicant?.toLowerCase() === "parent") ? 3 : 5;
  const usableAssets = (d.assetValue || 0) / assetMultiplier;
  const totalIncome = primaryIncome + hmIncome + jsIncome + usableAssets;
  const isEligible = totalIncome >= requiredIncome || d.sponsorDeceased;

  const forms: any[] = [];
  if (d.sponsorDeceased) {
    forms.push({ name: "Form I-864 — Substitute Sponsor", sub: "Required when original petitioner is deceased", url: I864_URL });
  } else if (!hmIncome && !jsIncome && !d.assetValue && primaryIncome >= requiredIncome) {
    forms.push({ name: "Form I-864EZ — Petitioner", sub: "Simplified affidavit — petitioner qualifies alone", url: I864EZ_URL });
  } else {
    forms.push({ name: "Form I-864 — Petitioner", sub: "Full affidavit of support for the petitioner", url: I864_URL });
  }
  (d.householdMembers || []).forEach((m: any, i: number) =>
    forms.push({ name: `Form I-864A — Household Member (${m.relationship || i + 1})`, sub: "Contract between sponsor and household member", url: I864A_URL })
  );
  if (jsIncome > 0) (d.jointSponsors || []).forEach((s: any, i: number) =>
    forms.push({ name: `Form I-864 — Joint Sponsor (${s.name || i + 1})`, sub: "Required for additional financial support", url: I864_URL })
  );

  return { isEligible, isSelfPetition: false, householdSize, requiredIncome, totalIncome, primaryIncome, hmIncome, jsIncome, assetIncome: usableAssets, shortfall: Math.max(0, requiredIncome - totalIncome), forms, raw: d };
};

interface SponsorshipCalculatorToolProps {
  isOpen: boolean; onClose: () => void; initialData?: any; onSave: (result: any) => void;
}

export default function SponsorshipCalculatorTool({ isOpen, onClose, initialData, onSave }: SponsorshipCalculatorToolProps) {
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
    // SINGLE income field — AGI field removed (redundant)
    currentAnnualIncome: initialData?.currentAnnualIncome || 0,
    householdMembers: initialData?.householdMembers || [],
    jointSponsors: initialData?.jointSponsors || [],
    assetValue: initialData?.assetValue || 0,
    sponsorDeceased: initialData?.sponsorDeceased || false,
    isVAWA: initialData?.isVAWA || false,
    isWidow: initialData?.isWidow || false,
    isSpecialImmigrant: initialData?.isSpecialImmigrant || false,
  });

  if (!isOpen) return null;
  const result = getSponsorshipResult(data);

  const STEP_COLORS: Record<number, string> = {
    1: COLORS.joint, 2: COLORS.primary, 3: COLORS.danger, 4: COLORS.joint,
    5: COLORS.primary, 6: COLORS.primary, 8: COLORS.household, 9: "#f59e0b",
  };
  const stepColor = STEP_COLORS[stepIdx] || COLORS.primary;

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const toggleOption = (id: string) => setExpandedOptions(p => ({ ...p, [id]: !p[id] }));

  const addHouseholdMember = () => setData({ ...data, householdMembers: [...data.householdMembers, { id: generateId(), relationship: "", annualIncome: 0 }] });
  const removeHouseholdMember = (id: string) => setData({ ...data, householdMembers: data.householdMembers.filter((m: any) => m.id !== id) });
  const updateHouseholdMember = (id: string, updates: any) => setData({ ...data, householdMembers: data.householdMembers.map((m: any) => m.id === id ? { ...m, ...updates } : m) });
  const addJointSponsor = () => setData({ ...data, jointSponsors: [...data.jointSponsors, { id: generateId(), name: "", annualIncome: 0 }] });
  const removeJointSponsor = (id: string) => setData({ ...data, jointSponsors: data.jointSponsors.filter((s: any) => s.id !== id) });
  const updateJointSponsor = (id: string, updates: any) => setData({ ...data, jointSponsors: data.jointSponsors.map((s: any) => s.id === id ? { ...s, ...updates } : s) });

  const BackBtn = ({ to }: { to: number }) => (
    <button onClick={() => setStepIdx(to)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2 shrink-0">
      <ArrowLeft size={14} /> Back
    </button>
  );
  const NextBtn = ({ to, disabled, label = "Continue" }: { to: number; disabled?: boolean; label?: string }) => (
    <button disabled={disabled} onClick={() => setStepIdx(to)}
      style={{ backgroundColor: disabled ? "#e2e8f0" : stepColor }}
      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${disabled ? "text-slate-400 cursor-not-allowed" : "text-white hover:opacity-90"}`}>
      {label} <ArrowRight size={14} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-white z-[150] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      {/* Topbar */}
      <div className="flex items-center h-[64px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-white">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#f4f7fb] flex items-center justify-center text-[#3a4f63] hover:bg-primary/10 transition-all cursor-pointer outline-none">
          <X size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${Math.round(((stepIdx + 1) / 11) * 100)}%`, backgroundColor: COLORS.primary }} />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">{stepIdx + 1} / 11</div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[560px] flex flex-col">
          {(() => {

            // ─── STEP 0: Welcome ────────────────────────────────────────
            if (stepIdx === 0) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: COLORS.primary }}>Sponsorship Calculator · Step 1 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-3 leading-[1.3]">Welcome to the Integrated Sponsorship Calculator</h2>
                <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-5">
                  This tool calculates your I-864 Affidavit of Support eligibility per USCIS requirements.
                  Your <strong className="text-[#0c1b33]">Current Annual Income</strong> will be compared
                  against the 125% Federal Poverty Guideline for your household size.
                </p>
                <div className="rounded-[10px] p-4 mb-6" style={{ backgroundColor: `${COLORS.secondary}20`, border: `1px solid ${COLORS.secondary}50` }}>
                  <p className="text-[13px] text-[#3a4f63] leading-[1.7]">
                    💡 Keep your most recent <strong>IRS Form 1040</strong> handy.
                    You'll need the <strong>Total Income figure (Line 9)</strong> — this is
                    what gets reported on Form I-864 and submitted to USCIS as evidence.
                  </p>
                </div>
                <button onClick={() => setStepIdx(1)} style={{ backgroundColor: COLORS.primary }}
                  className="w-full p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold hover:opacity-90 hover:-translate-y-px transition-all">
                  Get Started →
                </button>
              </div>
            );

            // ─── STEP 1: Petitioner Status ──────────────────────────────
            if (stepIdx === 1) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 2 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">Petitioner Status</h2>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[{ val: "citizen", label: "US Citizen", Icon: Shield }, { val: "greenCard", label: "Green Card Holder", Icon: User }].map(({ val, label, Icon }) => (
                    <button key={val} onClick={() => setData({ ...data, sponsorStatus: val })}
                      className="p-4 rounded-xl border-2 transition-all"
                      style={{ borderColor: data.sponsorStatus === val ? COLORS.joint : "#e2e8f0", backgroundColor: data.sponsorStatus === val ? `${COLORS.joint}10` : undefined }}>
                      <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.joint }} />
                      <p className="font-semibold text-slate-900 text-sm">{label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[14px] font-semibold text-[#0c1b33] mb-3">Are you active-duty US Military?</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[{ val: true, label: "Yes" }, { val: false, label: "No" }].map(({ val, label }) => (
                    <button key={String(val)} onClick={() => setData({ ...data, isMilitary: val })}
                      className="p-3 rounded-xl border-2 transition-all font-semibold"
                      style={{ borderColor: data.isMilitary === val ? COLORS.joint : "#e2e8f0", backgroundColor: data.isMilitary === val ? `${COLORS.joint}10` : undefined }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-[10px]"><BackBtn to={0} /><NextBtn to={2} disabled={!data.sponsorStatus || data.isMilitary === null} /></div>
              </div>
            );

            // ─── STEP 2: Marital Status ─────────────────────────────────
            if (stepIdx === 2) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 3 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Marital Status</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button onClick={() => setData({ ...data, isMarried: true })} className="p-6 rounded-xl border-2 transition-all"
                    style={{ borderColor: data.isMarried === true ? COLORS.primary : "#e2e8f0", backgroundColor: data.isMarried === true ? `${COLORS.primary}10` : undefined }}>
                    <Users className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.primary }} />
                    <p className="font-semibold text-slate-900">Married</p>
                  </button>
                  <button onClick={() => setData({ ...data, isMarried: false, relationshipToApplicant: "" })} className="p-6 rounded-xl border-2 transition-all"
                    style={{ borderColor: data.isMarried === false ? COLORS.primary : "#e2e8f0", backgroundColor: data.isMarried === false ? `${COLORS.primary}10` : undefined }}>
                    <User className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.primary }} />
                    <p className="font-semibold text-slate-900">Single / Not Married</p>
                  </button>
                </div>
                {data.isMarried && (
                  <div className="mb-6 animate-in zoom-in-95 duration-200">
                    <p className="text-[14px] font-semibold text-[#0c1b33] mb-3">Are you sponsoring your spouse?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ val: "spouse", label: "Yes" }, { val: "other", label: "No" }].map(({ val, label }) => (
                        <button key={val} onClick={() => setData({ ...data, relationshipToApplicant: val })}
                          className="p-3 rounded-xl border-2 transition-all font-semibold"
                          style={{ borderColor: data.relationshipToApplicant === val ? COLORS.primary : "#e2e8f0", backgroundColor: data.relationshipToApplicant === val ? `${COLORS.primary}10` : undefined }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-[10px]"><BackBtn to={1} /><NextBtn to={3} disabled={data.isMarried === null || (!!data.isMarried && !data.relationshipToApplicant)} /></div>
              </div>
            );

            // ─── STEP 3: Dependents ─────────────────────────────────────
            if (stepIdx === 3) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 4 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Dependents</h2>
                <div className="space-y-5 mb-8">
                  {[{ key: "numberOfChildren", label: "Your Children" }, { key: "taxDependents", label: "Other Tax Dependents" }].map(({ key, label }) => (
                    <div key={key} className="p-4 rounded-xl border" style={{ backgroundColor: `${COLORS.danger}05`, borderColor: `${COLORS.danger}30` }}>
                      <label className="text-[12px] font-bold uppercase tracking-wider mb-3 block" style={{ color: COLORS.danger }}>{label}</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setData({ ...data, [key]: Math.max(0, (data as any)[key] - 1) })} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xl font-bold">−</button>
                        <span className="text-2xl font-black w-12 text-center">{(data as any)[key]}</span>
                        <button onClick={() => setData({ ...data, [key]: (data as any)[key] + 1 })} style={{ backgroundColor: COLORS.danger }} className="w-10 h-10 rounded-lg text-white flex items-center justify-center text-xl font-bold">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-[10px]"><BackBtn to={2} /><NextBtn to={4} /></div>
              </div>
            );

            // ─── STEP 4: Previous Sponsorships ──────────────────────────
            if (stepIdx === 4) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 5 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">Previous Sponsorships</h2>
                <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-6 text-center">Have you filed an I-864 for anyone now a Lawful Permanent Resident?</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[{ val: true, label: "Yes" }, { val: false, label: "No" }].map(({ val, label }) => (
                    <button key={String(val)} onClick={() => setData({ ...data, hasPreviousSponsorship: val, ...(val === false ? { previousSponsoredCount: 0 } : {}) })}
                      className="p-4 rounded-xl border-2 transition-all font-semibold"
                      style={{ borderColor: data.hasPreviousSponsorship === val ? COLORS.joint : "#e2e8f0", backgroundColor: data.hasPreviousSponsorship === val ? `${COLORS.joint}10` : undefined }}>
                      {label}
                    </button>
                  ))}
                </div>
                {data.hasPreviousSponsorship && (
                  <div className="mb-6 animate-in zoom-in-95 duration-200">
                    <label className="text-[12px] font-bold text-[#6b8097] uppercase tracking-wider mb-3 block">How many people?</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setData({ ...data, previousSponsoredCount: Math.max(0, data.previousSponsoredCount - 1) })} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xl font-bold">−</button>
                      <span className="text-2xl font-black w-12 text-center">{data.previousSponsoredCount}</span>
                      <button onClick={() => setData({ ...data, previousSponsoredCount: data.previousSponsoredCount + 1 })} style={{ backgroundColor: COLORS.joint }} className="w-10 h-10 text-white rounded-lg flex items-center justify-center text-xl font-bold">+</button>
                    </div>
                  </div>
                )}
                <div className="flex gap-[10px]"><BackBtn to={3} /><NextBtn to={5} disabled={data.hasPreviousSponsorship === null} /></div>
              </div>
            );

            // ─── STEP 5: Who Are You Sponsoring ─────────────────────────
            if (stepIdx === 5) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 6 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">Who Are You Sponsoring?</h2>
                <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-6 text-center">Select all who are immigrating in this application.</p>
                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: `${COLORS.primary}30` }}>
                    <Check className="w-6 h-6 shrink-0" style={{ color: COLORS.primary }} />
                    <div><p className="font-semibold" style={{ color: COLORS.primary }}>Main Applicant</p><p className="text-xs text-slate-500">Always included.</p></div>
                  </div>
                  {data.relationshipToApplicant !== "spouse" && (
                    <label className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer"
                      style={{ backgroundColor: data.currentSponsoredSpouse ? `${COLORS.primary}10` : "white", borderColor: data.currentSponsoredSpouse ? COLORS.primary : "#e2e8f0" }}>
                      <input type="checkbox" checked={data.currentSponsoredSpouse} onChange={() => setData({ ...data, currentSponsoredSpouse: !data.currentSponsoredSpouse })} className="w-5 h-5 rounded" />
                      <div><p className="font-semibold text-slate-900">Applicant's Spouse</p><p className="text-xs text-slate-500">If immigrating with the main applicant.</p></div>
                    </label>
                  )}
                  <div className="p-4 rounded-xl border-2 border-slate-200 bg-white">
                    <p className="font-semibold text-slate-900 mb-3">Applicant's Children</p>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setData({ ...data, currentSponsoredChildren: Math.max(0, data.currentSponsoredChildren - 1) })} className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold">−</button>
                      <span className="text-xl font-black w-8 text-center">{data.currentSponsoredChildren}</span>
                      <button onClick={() => setData({ ...data, currentSponsoredChildren: data.currentSponsoredChildren + 1 })} style={{ backgroundColor: COLORS.primary }} className="w-9 h-9 text-white rounded-lg flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-[10px]"><BackBtn to={4} /><NextBtn to={6} /></div>
              </div>
            );

            // ─── STEP 6: Income ─────────────────────────────────────────
            if (stepIdx === 6) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: COLORS.primary }}>Step 7 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-3 text-center">Your Income</h2>

                {/* Explainer */}
                <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: `${COLORS.secondary}15`, border: `1.5px solid ${COLORS.secondary}60` }}>
                  <p className="text-[13px] font-bold text-[#0c1b33] mb-1">What to enter here?</p>
                  <p className="text-[12px] text-[#3a4f63] leading-[1.8]">
                    Enter the amount you <strong>expect to earn this full calendar year</strong>.
                    This is called <strong>"Current Individual Annual Income"</strong> on Form I-864 (Part 6, Line 7).
                    USCIS uses this to check against the 125% Federal Poverty Guideline.
                  </p>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: `${COLORS.secondary}50` }}>
                    <p className="text-[11px] text-[#6b8097] leading-[1.7]">
                      📋 <strong>Supporting evidence required:</strong> Attach your most recent IRS Form 1040.
                      Your income appears as <strong>Total Income on Line 9</strong> of that form.
                      This is the same figure — not AGI (Line 11), which is lower.
                    </p>
                  </div>
                </div>

                {/* Single income input */}
                <label className="text-[12px] font-black uppercase tracking-wider mb-2 block" style={{ color: COLORS.primary }}>
                  Current Individual Annual Income
                  <span className="ml-2 normal-case text-[10px] font-semibold text-slate-400">(I-864 Part 6 · Form 1040 Line 9)</span>
                </label>
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">$</span>
                  <input
                    type="number"
                    value={data.currentAnnualIncome || ""}
                    onChange={(e) => setData({ ...data, currentAnnualIncome: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-5 bg-slate-50 border-2 rounded-xl text-3xl font-black focus:outline-none transition-all"
                    style={{ borderColor: data.currentAnnualIncome > 0 ? COLORS.primary : "#e2e8f0" }}
                    placeholder="0"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mb-6">e.g. monthly salary $4,000 → enter $48,000</p>

                {/* Live threshold preview */}
                {data.currentAnnualIncome > 0 && (
                  <div className="rounded-xl p-4 mb-6 flex items-center justify-between animate-in zoom-in-95 duration-200"
                    style={{ backgroundColor: result.isEligible ? `${COLORS.secondary}20` : `${COLORS.danger}15`, border: `1.5px solid ${result.isEligible ? COLORS.secondary : COLORS.danger}` }}>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: result.isEligible ? COLORS.primary : COLORS.danger }}>
                        {result.isEligible ? "✓ Meets threshold" : "✗ Below threshold"}
                      </p>
                      <p className="text-[12px] text-slate-600 mt-0.5">
                        Required (household of {result.householdSize}): <strong>${result.requiredIncome.toLocaleString()}</strong>
                      </p>
                    </div>
                    <span className="text-xl font-black" style={{ color: result.isEligible ? COLORS.primary : COLORS.danger }}>
                      ${data.currentAnnualIncome.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-[10px]"><BackBtn to={5} /><NextBtn to={7} /></div>
              </div>
            );

            // ─── STEP 7: Initial Status ─────────────────────────────────
            if (stepIdx === 7) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: COLORS.primary }}>Step 8 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Initial Status</h2>
                <div className="p-6 rounded-2xl border-2 mb-6"
                  style={{ backgroundColor: result.isEligible ? `${COLORS.secondary}20` : `${COLORS.danger}20`, borderColor: result.isEligible ? COLORS.secondary : COLORS.danger }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Current Standing</span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase text-white"
                      style={{ backgroundColor: result.isEligible ? COLORS.secondary : COLORS.danger }}>
                      {result.isEligible ? "Qualified" : "Shortfall"}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-2">
                    ${result.primaryIncome.toLocaleString()} <span className="text-slate-400 text-xl font-normal">/</span> ${result.requiredIncome.toLocaleString()}
                  </div>
                  <p className="text-[13px] text-slate-600">
                    {result.isEligible
                      ? "You qualify as the sole sponsor."
                      : `You are $${result.shortfall.toLocaleString()} below the required threshold.`}
                  </p>
                </div>
                <div className="space-y-3 mb-8">
                  <button onClick={() => setStepIdx(8)} className="w-full p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary transition-all text-left flex items-center justify-between group bg-slate-50">
                    <div><p className="font-bold text-slate-900">Add Household Members / Joint Sponsors</p><p className="text-xs text-slate-500">Combine income with others.</p></div>
                    <Plus size={22} className="text-slate-400 group-hover:text-primary shrink-0" />
                  </button>
                  {!result.isEligible && (
                    <button onClick={() => setStepIdx(9)} className="w-full p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-400 transition-all text-left flex items-center justify-between group bg-slate-50">
                      <div><p className="font-bold text-slate-900">More Options</p><p className="text-xs text-slate-500">Assets, Substitute Sponsor, or Self-petition.</p></div>
                      <AlertTriangle size={22} className="text-slate-400 group-hover:text-amber-500 shrink-0" />
                    </button>
                  )}
                </div>
                <div className="flex gap-[10px]">
                  <BackBtn to={6} />
                  <button onClick={() => setStepIdx(10)} style={{ backgroundColor: COLORS.primary }}
                    className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                    View Final Plan <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );

            // ─── STEP 8: Support Resources ──────────────────────────────
            if (stepIdx === 8) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 9 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Support Resources</h2>
                <div className="space-y-6 mb-8">
                  {/* Household Members */}
                  <div className="border-2 rounded-2xl overflow-hidden" style={{ borderColor: `${COLORS.household}50`, backgroundColor: `${COLORS.household}05` }}>
                    <div className="p-4 flex justify-between items-center" style={{ backgroundColor: `${COLORS.household}15` }}>
                      <div className="flex items-center gap-2"><Home size={18} style={{ color: COLORS.household }} /><span className="font-bold text-slate-900">Household Members</span></div>
                      <button onClick={addHouseholdMember} style={{ backgroundColor: COLORS.household }} className="px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-80">+ Add</button>
                    </div>
                    <div className="p-4 space-y-3">
                      {data.householdMembers.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-2 italic">No members added</p>
                        : data.householdMembers.map((m: any) => (
                          <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex gap-2 mb-3">
                              <select value={m.relationship} onChange={(e) => updateHouseholdMember(m.id, { relationship: e.target.value })} className="flex-1 p-2 text-sm border-2 border-slate-100 rounded-lg bg-slate-50 outline-none">
                                <option value="">Relationship...</option>
                                <option>Spouse</option><option>Child</option><option>Parent</option><option>Sibling</option><option>Other Relative</option>
                              </select>
                              <button onClick={() => removeHouseholdMember(m.id)} className="p-2 text-red-300 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                            </div>
                            <input type="number" value={m.annualIncome || ""} onChange={(e) => updateHouseholdMember(m.id, { annualIncome: parseInt(e.target.value) || 0 })}
                              className="w-full p-3 text-lg border-2 border-slate-100 rounded-lg font-black" placeholder="$ Annual Income" />
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Joint Sponsors */}
                  <div className="border-2 rounded-2xl overflow-hidden" style={{ borderColor: `${COLORS.joint}50`, backgroundColor: `${COLORS.joint}05` }}>
                    <div className="p-4 flex justify-between items-center" style={{ backgroundColor: `${COLORS.joint}15` }}>
                      <div className="flex items-center gap-2"><UserPlus size={18} style={{ color: COLORS.joint }} /><span className="font-bold text-slate-900">Joint Sponsors</span></div>
                      <button onClick={addJointSponsor} style={{ backgroundColor: COLORS.joint }} className="px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-80">+ Add</button>
                    </div>
                    <div className="p-4 space-y-3">
                      {data.jointSponsors.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-2 italic">No joint sponsors added</p>
                        : data.jointSponsors.map((s: any) => (
                          <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex gap-2 mb-2">
                              <input type="text" value={s.name} onChange={(e) => updateJointSponsor(s.id, { name: e.target.value })} placeholder="Sponsor Name" className="flex-1 p-2 text-sm border-2 border-slate-100 rounded-lg bg-slate-50" />
                              <button onClick={() => removeJointSponsor(s.id)} className="p-2 text-red-300 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                            <input type="number" value={s.annualIncome || ""} onChange={(e) => updateJointSponsor(s.id, { annualIncome: parseInt(e.target.value) || 0 })}
                              className="w-full p-3 text-lg border-2 border-slate-100 rounded-lg font-black" placeholder="$ Annual Income" />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-[10px]"><BackBtn to={7} /><NextBtn to={9} /></div>
              </div>
            );

            // ─── STEP 9: Alternative Options ────────────────────────────
            if (stepIdx === 9) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: COLORS.primary }}>Step 10 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Alternative Options</h2>
                <div className="space-y-4 mb-8">
                  {/* Assets */}
                  <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                    <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleOption("assets")}>
                      <div className="flex items-center gap-2"><DollarSign size={18} style={{ color: COLORS.secondary }} /><span className="font-bold text-slate-800">Use Assets (Property / Savings)</span></div>
                      {expandedOptions.assets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {expandedOptions.assets && (
                      <div className="p-4 bg-white">
                        <p className="text-xs text-slate-500 mb-4">1/3 of assets used if sponsoring spouse or child of US citizen; otherwise 1/5 of total asset value.</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input type="number" value={data.assetValue || ""} onChange={(e) => setData({ ...data, assetValue: parseInt(e.target.value) || 0 })}
                            className="w-full pl-8 p-3 text-lg border-2 border-slate-100 rounded-lg" placeholder="Total Asset Value" />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Substitute Sponsor */}
                  <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                    <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleOption("substitute")}>
                      <div className="flex items-center gap-2"><Heart size={18} style={{ color: COLORS.danger }} /><span className="font-bold text-slate-800">Substitute Sponsor</span></div>
                      {expandedOptions.substitute ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {expandedOptions.substitute && (
                      <div className="p-4 bg-white">
                        <p className="text-xs text-slate-500 mb-3">If the original petitioner has passed away, an eligible substitute sponsor may file Form I-864.</p>
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                          <input type="checkbox" checked={data.sponsorDeceased} onChange={() => setData({ ...data, sponsorDeceased: !data.sponsorDeceased })} className="w-4 h-4 rounded" />
                          The Petitioner is Deceased
                        </label>
                      </div>
                    )}
                  </div>
                  {/* Self-Petition */}
                  <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                    <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleOption("self")}>
                      <div className="flex items-center gap-2"><Shield size={18} style={{ color: COLORS.primary }} /><span className="font-bold text-slate-800">Self-Petition Categories</span></div>
                      {expandedOptions.self ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {expandedOptions.self && (
                      <div className="p-4 bg-white space-y-3">
                        {[{ key: "isVAWA", label: "VAWA Self-petitioner" }, { key: "isWidow", label: "Widow(er) of US Citizen" }, { key: "isSpecialImmigrant", label: "Special Immigrant" }].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                            <input type="checkbox" checked={(data as any)[key]} onChange={() => setData({ ...data, [key]: !(data as any)[key] })} className="w-4 h-4 rounded" />
                            {label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-[10px]">
                  <BackBtn to={8} />
                  <button onClick={() => setStepIdx(10)} style={{ backgroundColor: COLORS.primary }}
                    className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                    View Results <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );

            // ─── STEP 10: Final Plan ─────────────────────────────────────
            if (stepIdx === 10) return (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: COLORS.primary }}>Step 11 of 11</div>
                <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Final Sponsorship Plan</h2>
                <div className="space-y-4 mb-8">
                  {/* Result */}
                  <div className="p-8 rounded-3xl border-2 text-center"
                    style={{ backgroundColor: result.isEligible ? `${COLORS.secondary}20` : `${COLORS.danger}20`, borderColor: result.isEligible ? COLORS.secondary : COLORS.danger }}>
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Final Conclusion</div>
                    <div className="text-3xl font-black mb-3" style={{ color: result.isEligible ? COLORS.primary : COLORS.danger }}>
                      {result.isEligible ? "ELIGIBLE ✓" : "NOT ELIGIBLE ✗"}
                    </div>
                    <p className="text-[14px] text-slate-600 leading-relaxed">
                      Your Total Income: <strong className="text-[#0c1b33] text-lg">${result.totalIncome.toLocaleString()}</strong><br />
                      Required (Household of {result.householdSize}): <strong className="text-[#0c1b33] text-lg">${result.requiredIncome.toLocaleString()}</strong>
                    </p>
                    {!result.isEligible && <p className="mt-2 text-sm font-bold" style={{ color: COLORS.danger }}>Shortfall: ${result.shortfall.toLocaleString()}</p>}
                  </div>
                  {/* Income Breakdown */}
                  <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50">
                    <div className="text-[11px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Income Breakdown</div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between"><span className="text-slate-600">Your Income (I-864 Part 6)</span><span className="font-black">${result.primaryIncome.toLocaleString()}</span></div>
                      {result.hmIncome > 0 && <div className="flex justify-between"><span className="text-slate-600">Household Members</span><span className="font-black">${result.hmIncome.toLocaleString()}</span></div>}
                      {result.jsIncome > 0 && <div className="flex justify-between"><span className="text-slate-600">Joint Sponsors</span><span className="font-black">${result.jsIncome.toLocaleString()}</span></div>}
                      {result.assetIncome > 0 && <div className="flex justify-between"><span className="text-slate-600">Assets (usable portion)</span><span className="font-black">${result.assetIncome.toLocaleString()}</span></div>}
                      <div className="flex justify-between border-t border-slate-200 pt-2 mt-1"><span className="font-bold text-slate-800">Total</span><span className="font-black text-slate-900">${result.totalIncome.toLocaleString()}</span></div>
                    </div>
                  </div>
                  {/* Required Forms */}
                  <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50">
                    <div className="text-[11px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Required Forms</div>
                    <div className="space-y-3">
                      {result.forms.map((f: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <FileText size={20} className="mt-1 shrink-0" style={{ color: COLORS.primary }} />
                          <div><div className="text-sm font-black text-slate-900">{f.name}</div><div className="text-[11px] text-slate-500">{f.sub}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-[10px]">
                  <BackBtn to={data.assetValue > 0 || data.sponsorDeceased ? 9 : 8} />
                  <button onClick={() => onSave(result)} style={{ backgroundColor: COLORS.primary }}
                    className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold shadow-lg hover:opacity-90 hover:-translate-y-px transition-all flex items-center justify-center gap-2">
                    Complete & Save Plan <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}