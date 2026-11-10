"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import {
  X,
  Shield,
  User,
  Users,
  Plus,
  Home,
  FileText,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Heart,
  DollarSign,
  UserPlus,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { US_STATES } from "@/lib/formConfig/constants";
import {
  POVERTY_GUIDELINES,
  getSponsorshipThreshold,
  resolveJurisdiction,
  getJurisdictionLabel,
} from "@/lib/tools/sponsorship/povertyGuidelines";

// --- CONSTANTS ---
const I864_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf";
const I864EZ_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864ez.pdf";
const I864A_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864a.pdf";
const I864W_URL = "https://www.uscis.gov/sites/default/files/document/forms/i-864w.pdf";
const I864P_URL = "https://www.uscis.gov/i-864p";

// --- COLOR PALETTE ---
const COLORS = {
  primary: "#0d7377", // Dark Teal
  secondary: "#afdbdb", // Light Aqua
  household: "#cdadcc", // Soft Purple
  joint: "#89a4a0", // Sage
  danger: "#db8090", // Rose/Coral
};

// Poverty guideline data + threshold logic live in the shared module
// (lib/tools/sponsorship/povertyGuidelines.ts), which is state/jurisdiction
// aware. Re-exported here for any existing consumers of these names.
export { POVERTY_GUIDELINES, getSponsorshipThreshold };

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
  // Child Citizenship Act of 2000 (INA Section 320) Exemption Check
  const isChildIna320Exempt =
    Boolean(d.isChildCitizenshipActExempt) ||
    (d.beneficiaryRelationship === "child" &&
      d.sponsorStatus === "citizen" &&
      d.childAgeBand === "under_18" &&
      d.childRelationshipType !== "stepchild" &&
      d.childLivesInUSCitizenCustody === true);

  if (isChildIna320Exempt) {
    return {
      isEligible: true,
      isExempt: true,
      isChildCitizenshipActExempt: true,
      exemptionReason: "Child Citizenship Act of 2000 (INA Section 320)",
      feeExempt: true,
      householdSize: 1,
      requiredIncome: 0,
      totalIncome: d.currentAnnualIncome || 0,
      primaryIncome: d.currentAnnualIncome || 0,
      hmIncome: 0,
      jsIncome: 0,
      assetIncome: 0,
      shortfall: 0,
      state: d.state || "",
      jurisdiction: resolveJurisdiction(d.state),
      forms: [
        {
          id: "i864w",
          name: "Form I-864W",
          sub: "Request for Exemption for Intending Immigrant (Child Citizenship Act — INA Section 320)",
          url: I864W_URL,
        },
      ],
      raw: d,
    };
  }

  // Self-petition Check
  if (d.isVAWA || d.isWidow || d.isSpecialImmigrant) {
    return {
      isEligible: true,
      isSelfPetition: true,
      householdSize: 1,
      requiredIncome: 0,
      totalIncome: d.currentAnnualIncome || 0,
      primaryIncome: d.currentAnnualIncome || 0,
      hmIncome: 0,
      jsIncome: 0,
      assetIncome: 0,
      shortfall: 0,
      state: d.state || "",
      jurisdiction: resolveJurisdiction(d.state),
      forms: [
        {
          id: "i864w",
          name: "Form I-864W",
          sub: "Request for Exemption for Intending Immigrant",
          url: I864W_URL,
        },
      ],
      raw: d,
    };
  }

  const householdSize = calculateSponsorshipHouseholdSize(d);
  const jurisdiction = resolveJurisdiction(d.state);
  const povertyLevel = d.isMilitary && d.currentSponsoredApplicant ? 100 : 125;
  const requiredIncome = getSponsorshipThreshold(householdSize, povertyLevel, jurisdiction);

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
    d.relationshipToApplicant?.toLowerCase() === "parent" ||
    d.beneficiaryRelationship === "child" ||
    d.relationshipToApplicant?.toLowerCase() === "child"
      ? 3
      : 5;
  const usableAssets = (d.assetValue || 0) / assetMultiplier;

  const totalIncome = primaryIncome + hmIncome + jsIncome + usableAssets;
  const isEligible = totalIncome >= requiredIncome;

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
    state: d.state || "",
    jurisdiction,
    forms,
    raw: d,
  };
};

export const STANDALONE_SPONSORSHIP_STORAGE_KEY = "standalone_sponsorship_calc";
export const STANDALONE_SPONSORSHIP_DRAFT_KEY = "standalone_sponsorship_calc_draft";

export const getJourneySponsorshipDraftKey = (
  journeySlug: string,
  candidateId: string = "candidate-1"
) => {
  const normSlug = journeySlug || "journey";
  const normCand = candidateId || "candidate-1";
  return `journey_${normSlug}_${normCand}_sponsorship_draft`;
};

export interface SponsorshipFormData {
  state: string;
  sponsorStatus: string;
  isMilitary: boolean | null;
  isMarried: boolean | null;
  relationshipToApplicant: string;
  numberOfChildren: number;
  taxDependents: number;
  hasPreviousSponsorship: boolean | null;
  previousSponsoredCount: number;
  currentSponsoredApplicant: boolean;
  currentSponsoredSpouse: boolean;
  currentSponsoredChildren: number;
  agi: number;
  currentAnnualIncome: number;
  householdMembers: Array<{ id: string; relationship: string; annualIncome: number }>;
  jointSponsors: Array<{ id: string; name: string; relationship: string; annualIncome: number }>;
  assetValue: number;
  sponsorDeceased: boolean;
  isVAWA: boolean;
  isWidow: boolean;
  isSpecialImmigrant: boolean;
  // Child & INA 320 specific fields
  beneficiaryRelationship?: "spouse" | "child" | "parent" | "other" | "";
  childAgeBand?: "under_18" | "18_20" | "";
  childRelationshipType?: "biological" | "adopted" | "stepchild" | "";
  childLivesInUSCitizenCustody?: boolean | null;
  isChildCitizenshipActExempt?: boolean;
}

export interface SponsorshipCalculatorDraft {
  stepIdx: number;
  data: SponsorshipFormData;
  updatedAt: string;
}

export interface SponsorshipCalculatorToolProps extends ToolModeProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  initialStep?: number;
  onSave?: (result: any) => void;
  onProgressChange?: (draft: SponsorshipCalculatorDraft) => void;
  // When true, the sponsor state was supplied by the Journey/profile and is
  // shown read-only (the user is not asked to re-enter it). Defaults to false
  // (standalone), where a required state selector is shown.
  lockState?: boolean;
  candidateInfo?: {
    id?: string;
    name?: string;
    relation?: string;
    visaCategory?: string;
  };
  journeyTier?: string | null;
  /** Journey chrome: when true the tool renders inline under the roadmap breadcrumb
   *  (no fixed overlay, no own topbar, no body scroll-lock) — the same pattern as
   *  Medical / PCC / Consultation. Passed by EmbeddedToolContainer for toolbox launches. */
  embedded?: boolean;
}

const getDefaultFormData = (initial?: any): SponsorshipFormData => ({
  state: initial?.state || "",
  sponsorStatus: initial?.sponsorStatus || "",
  isMilitary: initial?.isMilitary ?? null,
  isMarried: initial?.isMarried ?? null,
  relationshipToApplicant: initial?.relationshipToApplicant || "",
  numberOfChildren: initial?.numberOfChildren || 0,
  taxDependents: initial?.taxDependents || 0,
  hasPreviousSponsorship: initial?.hasPreviousSponsorship ?? null,
  previousSponsoredCount: initial?.previousSponsoredCount || 0,
  currentSponsoredApplicant: true,
  currentSponsoredSpouse: initial?.currentSponsoredSpouse || false,
  currentSponsoredChildren: initial?.currentSponsoredChildren || 0,
  agi: initial?.agi || 0,
  currentAnnualIncome: initial?.currentAnnualIncome || 0,
  householdMembers: initial?.householdMembers || [],
  jointSponsors: initial?.jointSponsors || [],
  // Advanced Options
  assetValue: initial?.assetValue || 0,
  sponsorDeceased: initial?.sponsorDeceased || false,
  isVAWA: initial?.isVAWA || false,
  isWidow: initial?.isWidow || false,
  isSpecialImmigrant: initial?.isSpecialImmigrant || false,
  // Child & INA 320 specific fields
  beneficiaryRelationship: initial?.beneficiaryRelationship || (initial?.relationshipToApplicant === "spouse" ? "spouse" : initial?.relationshipToApplicant === "child" ? "child" : initial?.relationshipToApplicant === "parent" ? "parent" : ""),
  childAgeBand: initial?.childAgeBand || "",
  childRelationshipType: initial?.childRelationshipType || "",
  childLivesInUSCitizenCustody: initial?.childLivesInUSCitizenCustody ?? null,
  isChildCitizenshipActExempt: initial?.isChildCitizenshipActExempt || false,
});

export default function SponsorshipCalculatorTool({
  isOpen,
  onClose,
  initialData,
  initialStep,
  onSave,
  onProgressChange,
  lockState = false,
  candidateInfo,
  embedded,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: SponsorshipCalculatorToolProps) {
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  const accountPlan = usePlan();
  const { profile, updateProfile } = useUserProfile();

  // Determine effective plan tier: in journey mode, evaluate against the specific journey's tier (matching RoadmapLayoutEngine), otherwise account tier
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const effectiveTier: PlanTier = useMemo(() => {
    if (isJourney) {
      if (rawJourneyTier) {
        return normalizePlanTier(rawJourneyTier);
      }
      if (journeyContext?.journeyCategory && accountPlan.journeyTiers[journeyContext.journeyCategory]) {
        return accountPlan.journeyTiers[journeyContext.journeyCategory];
      }
    }
    return accountPlan.tier;
  }, [isJourney, rawJourneyTier, journeyContext, accountPlan.journeyTiers, accountPlan.tier]);

  const effectiveDraftKey = React.useMemo(() => {
    if (isJourney && journeyContext?.journeySlug) {
      return getJourneySponsorshipDraftKey(journeyContext.journeySlug, journeyContext.candidateId);
    }
    return STANDALONE_SPONSORSHIP_DRAFT_KEY;
  }, [isJourney, journeyContext]);

  // Synchronously compute initial state on first mount to prevent race conditions
  const getInitialState = React.useCallback((): { step: number; formData: SponsorshipFormData } => {
    // 1. If explicit initialData passed with keys
    if (initialData && Object.keys(initialData).length > 0) {
      return {
        step: typeof initialStep === "number" ? initialStep : 0,
        formData: getDefaultFormData(initialData),
      };
    }

    // 2. Try loading isolated draft from localStorage
    if (typeof window !== "undefined") {
      try {
        const draftJson = localStorage.getItem(effectiveDraftKey);
        if (draftJson) {
          const draft: SponsorshipCalculatorDraft = JSON.parse(draftJson);
          if (draft && draft.data) {
            return {
              step:
                typeof initialStep === "number"
                  ? initialStep
                  : typeof draft.stepIdx === "number"
                    ? draft.stepIdx
                    : 0,
              formData: getDefaultFormData(draft.data),
            };
          }
        }
      } catch (e) {
        console.warn("Could not parse sponsorship calculator draft:", e);
      }

      // 3. If standalone and user is logged in, check profile DB
      if (!isJourney && profile?.standaloneSponsorshipDraft?.data) {
        return {
          step:
            typeof initialStep === "number"
              ? initialStep
              : (profile.standaloneSponsorshipDraft.stepIdx ?? 0),
          formData: getDefaultFormData(profile.standaloneSponsorshipDraft.data),
        };
      }

      // 4. If standalone and saved result exists, restore raw data
      if (!isJourney) {
        try {
          const cachedStandalone = localStorage.getItem(STANDALONE_SPONSORSHIP_STORAGE_KEY);
          if (cachedStandalone) {
            const parsed = JSON.parse(cachedStandalone);
            if (parsed?.raw) {
              return {
                step: typeof initialStep === "number" ? initialStep : 10,
                formData: getDefaultFormData(parsed.raw),
              };
            }
          }
        } catch (e) {}
      }
    }

    return {
      step: typeof initialStep === "number" ? initialStep : 0,
      formData: getDefaultFormData(initialData),
    };
  }, [initialData, initialStep, effectiveDraftKey, isJourney, profile]);

  const [stepIdx, setStepIdx] = useState<number>(() => getInitialState().step);
  const [data, setData] = useState<SponsorshipFormData>(() => getInitialState().formData);
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});

  // Auto-detect beneficiary relationship from journeyContext or candidateInfo
  React.useEffect(() => {
    const category = journeyContext?.journeyCategory || candidateInfo?.visaCategory;
    if (category === "IR-2" || category === "CR-2") {
      setData((prev) => {
        if (!prev.beneficiaryRelationship) {
          return {
            ...prev,
            beneficiaryRelationship: "child",
            relationshipToApplicant: "child",
          };
        }
        return prev;
      });
    } else if (category === "IR-1" || category === "CR-1") {
      setData((prev) => {
        if (!prev.beneficiaryRelationship) {
          return {
            ...prev,
            beneficiaryRelationship: "spouse",
            relationshipToApplicant: "spouse",
          };
        }
        return prev;
      });
    } else if (category === "IR-5") {
      setData((prev) => {
        if (!prev.beneficiaryRelationship) {
          return {
            ...prev,
            beneficiaryRelationship: "parent",
            relationshipToApplicant: "parent",
          };
        }
        return prev;
      });
    }
  }, [journeyContext?.journeyCategory, candidateInfo?.visaCategory]);

  React.useEffect(() => {
    if (isOpen && !embedded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, embedded]);

  const prevInitialDataRef = React.useRef<string>(JSON.stringify(initialData || {}));
  const prevIsOpenRef = React.useRef<boolean>(isOpen);
  const lastSavedSnapshotRef = React.useRef<string>("");

  // Sync state only if initialData actually changed or when modal opens
  React.useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!isOpen) return;

    const currentInitStr = JSON.stringify(initialData || {});
    if (isOpening || (currentInitStr !== prevInitialDataRef.current && Object.keys(initialData || {}).length > 0)) {
      prevInitialDataRef.current = currentInitStr;
      if (initialData && Object.keys(initialData).length > 0) {
        setData((prev) => ({
          ...prev,
          ...getDefaultFormData(initialData),
          state: initialData.state ?? prev.state,
        }));
        if (typeof initialStep === "number") {
          setStepIdx(initialStep);
        }
      }
    }
  }, [isOpen, initialData, initialStep]);

  // Auto-save draft progress on changes while open (guarded by snapshot comparison)
  React.useEffect(() => {
    if (!isOpen) return;

    const currentSnapshot = JSON.stringify({ stepIdx, data });
    if (lastSavedSnapshotRef.current === currentSnapshot) return;
    lastSavedSnapshotRef.current = currentSnapshot;

    const draftPayload: SponsorshipCalculatorDraft = {
      stepIdx,
      data,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(effectiveDraftKey, JSON.stringify(draftPayload));
      onProgressChange?.(draftPayload);

      // Save to Supabase user_profiles if in standalone mode and user is logged in
      if (!isJourney && updateProfile) {
        updateProfile({ standaloneSponsorshipDraft: draftPayload }, { silent: true });
      }
    } catch (e) {
      console.warn("Error auto-saving sponsorship draft:", e);
    }
  }, [isOpen, stepIdx, data, effectiveDraftKey, onProgressChange, isJourney, updateProfile]);

  const handleResetProgress = () => {
    try {
      localStorage.removeItem(effectiveDraftKey);
      if (!isJourney && updateProfile) {
        updateProfile({
          standaloneSponsorshipDraft: undefined,
        }, { silent: true });
      }
    } catch {}
    const defaultData = getDefaultFormData(lockState ? { state: data.state } : undefined);
    setData(defaultData);
    setStepIdx(0);
    onProgressChange?.({
      stepIdx: 0,
      data: defaultData,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCompleteSave = () => {
    const finalResult = getSponsorshipResult(data);
    try {
      // Clear draft once completed
      localStorage.removeItem(effectiveDraftKey);

      // In standalone mode, persist to standalone storage and database
      if (!isJourney) {
        localStorage.setItem(STANDALONE_SPONSORSHIP_STORAGE_KEY, JSON.stringify(finalResult));
        localStorage.removeItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
        if (updateProfile) {
          updateProfile({
            standaloneSponsorshipCalc: finalResult,
            standaloneSponsorshipDraft: undefined,
          }, { silent: true });
        }
      }
    } catch (e) {
      console.warn("Error finalizing sponsorship storage:", e);
    }

    onSave?.(finalResult);
  };

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

  // Check if current data qualifies for the INA Section 320 4-step exemption flow
  const isExemptChild =
    Boolean(data.isChildCitizenshipActExempt) ||
    (data.beneficiaryRelationship === "child" &&
      data.sponsorStatus === "citizen" &&
      data.childAgeBand === "under_18" &&
      data.childRelationshipType !== "stepchild" &&
      data.childLivesInUSCitizenCustody === true);

  const totalSteps = isExemptChild ? 4 : 11;
  const currentDisplayStep = isExemptChild ? Math.min(stepIdx + 1, 4) : stepIdx + 1;

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
    <div
      className={
        embedded
          ? "flex w-full flex-col font-sans"
          : "fixed inset-0 bg-white z-[150] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans"
      }
    >
      {/* Topbar (overlay / standalone only — journey uses the roadmap breadcrumb) */}
      {!embedded && (
      <div className="flex items-center h-[64px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary"
        >
          <X size={16} strokeWidth={2} />
        </button>
        {candidateInfo?.name && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-800 shrink-0">
            <Users className="w-3 h-3 text-teal-600" />
            <span>Beneficiary: {candidateInfo.name} {candidateInfo.relation ? `(${candidateInfo.relation})` : ""}</span>
          </div>
        )}
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r transition-all duration-500"
            style={{
              width: `${Math.round((currentDisplayStep / totalSteps) * 100)}%`,
              backgroundColor: COLORS.primary,
            }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {currentDisplayStep} / {totalSteps}
        </div>
        <button
          onClick={handleResetProgress}
          title="Reset progress and start over"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer border-none text-xs"
        >
          <RotateCcw size={13} />
        </button>
        <QuickAccessButton
          item={{
            id: "sponsorship-calculator",
            title: "Sponsorship Calculator",
            href: "/affidavit-support-calculator",
            icon_name: "Calculator",
          }}
          mode="icon"
        />
      </div>
      )}

      {/* Body */}
      <div className={embedded ? "flex flex-col items-center p-[32px_24px_40px]" : "flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center"}>
        <div className="w-full max-w-[560px] flex flex-col">
          {(() => {
            const step = stepIdx;

            const renderFinalPlan = (isExemptFlow: boolean) => (
              <ResultGate
                feature="sponsorship_calc"
                planTier={effectiveTier}
                standaloneToolId={isJourney ? undefined : "sponsorship-calculator"}
              >
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center"
                    style={{ color: COLORS.primary }}
                  >
                    Step {isExemptFlow ? 4 : 11} of {isExemptFlow ? 4 : 11}
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">
                    {isExemptFlow ? "Final Exemption Plan" : "Final Sponsorship Plan"}
                  </h2>

                  <div className="space-y-4 mb-8">
                    <div
                      className="p-8 rounded-3xl border-2 text-center"
                      style={{
                        backgroundColor: result.isEligible ? `${COLORS.secondary}20` : `${COLORS.danger}20`,
                        borderColor: result.isEligible ? COLORS.secondary : COLORS.danger,
                      }}
                    >
                      {result.isChildCitizenshipActExempt ? (
                        <>
                          <div className="text-[10px] font-black uppercase text-teal-700 tracking-widest mb-2">
                            Exemption Status
                          </div>
                          <div className="text-2xl sm:text-3xl font-black mb-3 text-teal-800">
                            EXEMPT FROM I-864 &#x2713;
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-4">
                            Child Citizenship Act of 2000 (INA Section 320)
                          </div>
                          <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                            Your child automatically acquires U.S. citizenship upon admission to the United States as a permanent resident. No minimum income requirement or joint sponsor is required.
                          </p>
                        </>
                      ) : (
                        <>
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
                            Total Household Income: <strong className="text-[#0c1b33] text-lg">${(result.totalIncome ?? 0).toLocaleString()}</strong><br />
                            Required (Household of {result.householdSize}): <strong className="text-[#0c1b33] text-lg">${(result.requiredIncome ?? 0).toLocaleString()}</strong>
                            {result.jurisdiction && (
                              <>
                                <br />
                                <span className="text-[12px] text-slate-500">Based on {getJurisdictionLabel(result.jurisdiction)} poverty guidelines</span>
                              </>
                            )}
                          </p>
                        </>
                      )}
                    </div>

                    {result.feeExempt && (
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-left">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900">
                              $120 CEAC Affidavit of Support Fee Waiver
                            </p>
                            <p className="text-[12px] text-amber-800 leading-relaxed mt-0.5">
                              Intending immigrants filing Form I-864W are exempt from paying the $120 Affidavit of Support fee. If CEAC bills this fee, submit an inquiry to NVC via their Public Inquiry Form to request the fee be waived before paying.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {data.beneficiaryRelationship === "child" && !result.isChildCitizenshipActExempt && (
                      <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/70 text-left">
                        <p className="text-xs font-bold text-sky-900">
                          Child Sponsorship Note (Form I-864 Required)
                        </p>
                        <p className="text-[12px] text-sky-800 leading-relaxed mt-0.5">
                          {data.childRelationshipType === "stepchild"
                            ? "Stepchildren do not acquire automatic citizenship under INA Section 320. Form I-864 and 125% of HHS Poverty Guidelines apply."
                            : data.childAgeBand === "18_20"
                            ? "Children aged 18 to 20 at admission do not qualify under INA Section 320. Standard Form I-864 and 125% Poverty Guidelines apply."
                            : "Standard Form I-864 is required. As the child of a U.S. citizen, the statutory 3x asset multiplier applies (8 CFR Section 213a.2(c)(2)(iii)(B))."}
                        </p>
                      </div>
                    )}

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
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-4 tracking-wider">Required Forms</div>
                      <div className="space-y-3">
                        {result.forms.map((f: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <FileText size={20} className="mt-1 shrink-0" style={{ color: COLORS.primary }} />
                            <div>
                              <div className="text-sm font-black text-slate-900 leading-tight">{f.name}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{f.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      type="button"
                      onClick={() => setStepIdx(isExemptFlow ? 2 : (data.assetValue > 0 || data.sponsorDeceased ? 9 : 8))}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Edit Info
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteSave}
                      style={{ backgroundColor: COLORS.primary }}
                      className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold shadow-lg transition-all hover:opacity-90 hover:-translate-y-px flex items-center justify-center gap-2"
                    >
                      {isJourney ? "Complete & Save to Roadmap" : "Complete & Save Calculation"} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </ResultGate>
            );

            if (step === 0) {
              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className="text-[11px] font-semibold tracking-widest uppercase"
                      style={{ color: COLORS.primary }}
                    >
                      Sponsorship Calculator · Step 1 of {totalSteps}
                    </div>
                    {candidateInfo?.name && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[10px] font-semibold text-teal-800">
                        <Users className="w-2.5 h-2.5 text-teal-600" />
                        <span>{candidateInfo.name}</span>
                      </div>
                    )}
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
                    Step 2 of {totalSteps}
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-4 text-center">
                    Petitioner Status
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setData({ ...data, sponsorStatus: "citizen" })}
                      className={`p-4 rounded-xl border-2 transition-all ${data.sponsorStatus === "citizen" ? "" : "border-slate-200 hover:bg-slate-50"}`}
                      style={{
                        borderColor: data.sponsorStatus === "citizen" ? "#0d7377" : undefined,
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
                        borderColor: data.sponsorStatus === "greenCard" ? "#0d7377" : undefined,
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
                          borderColor: data.isMilitary === true ? "#0d7377" : undefined,
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
                          borderColor: data.isMilitary === false ? "#0d7377" : undefined,
                          backgroundColor:
                            data.isMilitary === false ? `${COLORS.joint}10` : undefined,
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-[14px] font-semibold text-[#0c1b33] mb-3">
                      Sponsor's state of residence
                    </p>
                    {lockState && data.state ? (
                      <div
                        className="rounded-[10px] p-[12px_16px] flex items-center justify-between"
                        style={{
                          backgroundColor: `${COLORS.secondary}20`,
                          border: `1px solid ${COLORS.secondary}50`,
                        }}
                      >
                        <span className="text-[14px] font-semibold text-[#0c1b33]">
                          {US_STATES.find((s) => s.value === data.state)?.label || data.state}
                        </span>
                        <span className="text-[12px] text-[#6b8097]">From your profile</span>
                      </div>
                    ) : (
                      <>
                        <CustomDropdown
                          options={US_STATES}
                          value={data.state}
                          onChange={(value: string) => setData({ ...data, state: value })}
                          placeholder="Select your state"
                        />
                        <p className="text-[12px] text-[#6b8097] mt-2">
                          Poverty guidelines are higher for Alaska and Hawaii. All other states
                          use the same federal thresholds.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => setStepIdx(0)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      disabled={!data.sponsorStatus || data.isMilitary === null || !data.state}
                      onClick={() => setStepIdx(2)}
                      style={{
                        backgroundColor:
                          !data.sponsorStatus || data.isMilitary === null || !data.state
                            ? "#e2e8f0"
                            : "#0d7377",
                      }}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${!data.sponsorStatus || data.isMilitary === null || !data.state ? "text-slate-400 cursor-not-allowed" : "text-white hover:opacity-90"}`}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 2) {
              const isChild = data.beneficiaryRelationship === "child";
              const isChildExempt =
                data.sponsorStatus === "citizen" &&
                data.childAgeBand === "under_18" &&
                data.childRelationshipType !== "stepchild" &&
                data.childLivesInUSCitizenCustody === true;

              const isChildScreenerAnswered =
                Boolean(data.childAgeBand) &&
                Boolean(data.childRelationshipType) &&
                data.childLivesInUSCitizenCustody !== null;

              const isStep2Complete =
                data.isMarried !== null &&
                Boolean(data.beneficiaryRelationship) &&
                (!isChild || isChildScreenerAnswered);

              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                  <div
                    className="text-[11px] font-semibold tracking-widest uppercase mb-4"
                    style={{ color: stepColor }}
                  >
                    Step 3 of {totalSteps}
                  </div>
                  <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6">
                    Marital & Beneficiary Status
                  </h2>

                  {/* Section 1: Sponsor Marital Status */}
                  <div className="mb-6">
                    <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3 text-left">
                      1. What is your marital status?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setData({ ...data, isMarried: true })}
                        className={`p-4 rounded-xl border-2 transition-all ${data.isMarried === true ? "" : "border-slate-200 hover:bg-slate-50"}`}
                        style={{
                          borderColor: data.isMarried === true ? COLORS.primary : undefined,
                          backgroundColor:
                            data.isMarried === true ? `${COLORS.primary}10` : undefined,
                        }}
                      >
                        <Users className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
                        <p className="font-semibold text-slate-900">Married</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setData({ ...data, isMarried: false })}
                        className={`p-4 rounded-xl border-2 transition-all ${data.isMarried === false ? "" : "border-slate-200 hover:bg-slate-50"}`}
                        style={{
                          borderColor: data.isMarried === false ? COLORS.primary : undefined,
                          backgroundColor:
                            data.isMarried === false ? `${COLORS.primary}10` : undefined,
                        }}
                      >
                        <User className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
                        <p className="font-semibold text-slate-900">Single / Not Married</p>
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Beneficiary Relationship */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wider text-left">
                        2. Whom are you petitioning for / sponsoring?
                      </p>
                      {journeyContext?.journeyCategory && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800">
                          {journeyContext.journeyCategory} Journey
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "spouse", label: "Spouse", sub: "IR-1 / CR-1" },
                        { id: "child", label: "Child", sub: "IR-2 / CR-2" },
                        { id: "parent", label: "Parent", sub: "IR-5" },
                        { id: "other", label: "Other Relative", sub: "Family Preference" },
                      ].map((item) => {
                        const isSelected = data.beneficiaryRelationship === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setData({
                                ...data,
                                beneficiaryRelationship: item.id as any,
                                relationshipToApplicant: item.id,
                                ...(item.id !== "child"
                                  ? {
                                      childAgeBand: "",
                                      childRelationshipType: "",
                                      childLivesInUSCitizenCustody: null,
                                      isChildCitizenshipActExempt: false,
                                    }
                                  : {}),
                              });
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${isSelected ? "" : "border-slate-200 hover:bg-slate-50"}`}
                            style={{
                              borderColor: isSelected ? COLORS.primary : undefined,
                              backgroundColor: isSelected ? `${COLORS.primary}10` : undefined,
                            }}
                          >
                            <p className="font-bold text-sm text-slate-900">{item.label}</p>
                            <p className="text-[11px] text-slate-500">{item.sub}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Child Citizenship Act (INA § 320) Screener */}
                  {isChild && (
                    <div className="mb-6 rounded-2xl border-2 border-teal-200/80 bg-teal-50/40 p-5 text-left animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-teal-700 shrink-0" />
                        <h3 className="text-sm font-bold text-teal-950">
                          Child Citizenship Act of 2000 (INA Section 320) Screener
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Answer the following 3 questions to check if your child qualifies for automatic U.S. citizenship upon entry (Form I-864W exemption) or requires standard financial sponsorship (Form I-864):
                      </p>

                      {/* Question A: Child Age */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-800 mb-2">
                          A. Child's age at expected U.S. admission:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childAgeBand: "under_18" })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childAgeBand === "under_18" ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            Under 18 years old
                          </button>
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childAgeBand: "18_20" })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childAgeBand === "18_20" ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            18 to 20 years old
                          </button>
                        </div>
                      </div>

                      {/* Question B: Relationship Type */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-800 mb-2">
                          B. Child's legal relationship to U.S. citizen parent:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childRelationshipType: "biological" })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childRelationshipType === "biological" ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            Biological
                          </button>
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childRelationshipType: "adopted" })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childRelationshipType === "adopted" ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            Legally Adopted
                          </button>
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childRelationshipType: "stepchild" })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childRelationshipType === "stepchild" ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            Stepchild
                          </button>
                        </div>
                      </div>

                      {/* Question C: Legal & Physical Custody */}
                      <div className="mb-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-2">
                          C. Will the child reside in the U.S. in the legal and physical custody of the U.S. citizen parent?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childLivesInUSCitizenCustody: true })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childLivesInUSCitizenCustody === true ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            Yes (Custody in U.S.)
                          </button>
                          <button
                            type="button"
                            onClick={() => setData({ ...data, childLivesInUSCitizenCustody: false })}
                            className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${data.childLivesInUSCitizenCustody === false ? "border-teal-600 bg-white text-teal-900 shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Real-time Screener Determination Result */}
                      {isChildScreenerAnswered && (
                        <div className="mt-4 pt-3 border-t border-teal-200/80 animate-in fade-in duration-200">
                          {isChildExempt ? (
                            <div className="p-4 rounded-xl border border-teal-300 bg-white shadow-sm">
                              <div className="flex items-center gap-2 mb-1.5">
                                <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
                                <span className="text-sm font-bold text-teal-950">
                                  Qualified for Form I-864W Exemption (INA Section 320)
                                </span>
                              </div>
                                                            <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                Your child qualifies for automatic U.S. citizenship upon entry and is completely exempt from Form I-864 financial sponsorship, joint sponsors, and the $120 CEAC AOS fee. Click Continue to view your finalized exemption plan.
                              </p>
                              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-teal-900">
                                <span className="px-2 py-0.5 rounded bg-teal-100/70">Form I-864W (Part 2, Item 2.a)</span>
                                <span className="px-2 py-0.5 rounded bg-teal-100/70">Required Income: $0</span>
                                <span className="px-2 py-0.5 rounded bg-teal-100/70">AOS Fee: Exempt</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-amber-300 bg-white shadow-sm">
                              <div className="flex items-center gap-2 mb-1.5">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <span className="text-sm font-bold text-amber-950">
                                  Standard Form I-864 Required
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed mb-2">
                                {data.sponsorStatus !== "citizen"
                                  ? "The petitioning parent must be a U.S. citizen for INA Section 320 to apply. Green card holders sponsoring a child must file Form I-864."
                                  : data.childRelationshipType === "stepchild"
                                  ? "Under 8 CFR Section 320.1, stepchildren do not acquire automatic citizenship under INA Section 320. Standard Form I-864 and 125% Poverty Guidelines apply."
                                  : data.childAgeBand === "18_20"
                                  ? "Children aged 18 to 20 at admission do not qualify for automatic citizenship under INA Section 320. Standard Form I-864 applies."
                                  : "INA Section 320 requires the child to reside in the legal and physical custody of the U.S. citizen parent. Standard Form I-864 applies."}
                              </p>
                              <p className="text-[11px] font-semibold text-teal-800">
                                Note: As the child of a U.S. citizen, the statutory 3x asset multiplier applies (8 CFR Section 213a.2(c)(2)(iii)(B)).
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-[10px]">
                    <button
                      type="button"
                      onClick={() => setStepIdx(1)}
                      className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!isStep2Complete}
                      onClick={() => setStepIdx(3)}
                      style={{
                        backgroundColor: !isStep2Complete ? "#e2e8f0" : stepColor,
                      }}
                      className={`flex-1 p-[14px_22px] rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${!isStep2Complete ? "text-slate-400 cursor-not-allowed" : "text-white hover:opacity-90"}`}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            if (step === 3) {
              if (isExemptChild) {
                return renderFinalPlan(true);
              }

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
                          style={{ backgroundColor: "#B85467" }}
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
                          style={{ backgroundColor: "#B85467" }}
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
                      style={{ backgroundColor: "#B85467" }}
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
                        borderColor: data.hasPreviousSponsorship === true ? "#0d7377" : undefined,
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
                        borderColor: data.hasPreviousSponsorship === false ? "#0d7377" : undefined,
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
                          style={{ backgroundColor: "#0d7377" }}
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
                          data.hasPreviousSponsorship === null ? "#e2e8f0" : "#0d7377",
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
                    {/* Applicant's Spouse option removed for IR-1 category — the main applicant is the spouse. */}
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
                <ResultGate
                  feature="sponsorship_calc"
                  planTier={effectiveTier}
                  standaloneToolId={isJourney ? undefined : "sponsorship-calculator"}
                >
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: COLORS.primary }}>Step 8 of 11</div>
                    <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Initial Status</h2>
                    
                    <div className={`p-6 rounded-2xl border-2 mb-6`} 
                      style={{ 
                        backgroundColor: result.isEligible ? `${COLORS.secondary}20` : `${COLORS.danger}20`,
                        borderColor: result.isEligible ? COLORS.secondary : COLORS.danger 
                      }}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Current Standing</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase" 
                          style={{ backgroundColor: result.isEligible ? COLORS.secondary : COLORS.danger, color: 'white' }}>
                          {result.isEligible ? "Qualified" : "Shortfall"}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 mb-1">
                        ${(result.primaryIncome ?? 0).toLocaleString()} / ${(result.requiredIncome ?? 0).toLocaleString()}
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
                      <p className="text-[14px] font-bold text-slate-900">Do you need to add support?</p>
                      <button 
                        onClick={() => setStepIdx(8)}
                        className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary transition-all text-left flex items-center justify-between group bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-slate-900">Add Support Income</p>
                          <p className="text-xs text-slate-500">Household members or Joint sponsors.</p>
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
                            <p className="text-xs text-slate-500">Substitute sponsor, Assets, or Self-petition.</p>
                          </div>
                          <AlertTriangle size={24} className="text-slate-400 group-hover:text-amber-500" />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-[10px]">
                      <button onClick={() => setStepIdx(6)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2">
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button onClick={() => setStepIdx(10)} style={{ backgroundColor: COLORS.primary }} className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2">
                        View Final Plan <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </ResultGate>
              );
            }

            if (step === 8) {
              return (
                <ResultGate
                  feature="sponsorship_calc"
                  planTier={effectiveTier}
                  standaloneToolId={isJourney ? undefined : "sponsorship-calculator"}
                >
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: stepColor }}>Step 9 of 11</div>
                    <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Support Resources</h2>
                    
                    <div className="space-y-6 mb-8 text-left">
                      <div className="border-2 rounded-2xl overflow-hidden" 
                        style={{ borderColor: `${COLORS.household}40`, backgroundColor: `${COLORS.household}05` }}>
                        <div className="p-4 flex justify-between items-center" style={{ backgroundColor: `${COLORS.household}15` }}>
                          <div className="flex items-center gap-2">
                            <Home size={18} style={{ color: COLORS.household }} />
                            <span className="font-bold text-slate-900">Household Members</span>
                          </div>
                          <button onClick={addHouseholdMember} style={{ backgroundColor: COLORS.household }} className="p-1 px-4 text-white rounded-lg text-xs font-bold hover:opacity-80 transition-all">+ Add</button>
                        </div>
                        <div className="p-4 space-y-3">
                          {data.householdMembers.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2 italic font-medium">No members added</p>
                          ) : (
                            data.householdMembers.map((m: any) => (
                              <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
                                  <button onClick={() => removeHouseholdMember(m.id)} className="p-2 text-red-300 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                                <input 
                                  type="number" 
                                  value={m.annualIncome || ""} 
                                  onChange={(e) => updateHouseholdMember(m.id, {annualIncome: parseInt(e.target.value) || 0})}
                                  className="w-full p-3 text-lg border-2 border-slate-100 rounded-lg font-black text-slate-900"
                                  placeholder="$ Income"
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="border-2 rounded-2xl overflow-hidden" 
                        style={{ borderColor: `${COLORS.joint}40`, backgroundColor: `${COLORS.joint}05` }}>
                        <div className="p-4 flex justify-between items-center" style={{ backgroundColor: `${COLORS.joint}15` }}>
                          <div className="flex items-center gap-2">
                            <UserPlus size={18} style={{ color: COLORS.joint }} />
                            <span className="font-bold text-slate-900">Joint Sponsors</span>
                          </div>
                          <button onClick={addJointSponsor} style={{ backgroundColor: COLORS.joint }} className="p-1 px-4 text-white rounded-lg text-xs font-bold hover:opacity-80 transition-all">+ Add</button>
                        </div>
                        <div className="p-4 space-y-3">
                          {data.jointSponsors.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2 italic font-medium">No joint sponsors added</p>
                          ) : (
                            data.jointSponsors.map((s: any) => (
                              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <input 
                                  type="text"
                                  value={s.name}
                                  onChange={(e) => updateJointSponsor(s.id, {name: e.target.value})}
                                  placeholder="Sponsor Name"
                                  className="w-full p-2 mb-2 text-sm border-2 border-slate-100 rounded-lg bg-slate-50"
                                />
                                <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    value={s.annualIncome || ""} 
                                    onChange={(e) => updateJointSponsor(s.id, {annualIncome: parseInt(e.target.value) || 0})}
                                    className="flex-1 p-3 text-lg border-2 border-slate-100 rounded-lg font-black text-slate-900"
                                    placeholder="$ Income"
                                  />
                                  <button onClick={() => removeJointSponsor(s.id)} className="p-3 text-red-300 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-[10px]">
                      <button onClick={() => setStepIdx(7)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2">
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button onClick={() => setStepIdx(9)} style={{ backgroundColor: stepColor }} className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2">
                        Continue <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </ResultGate>
              );
            }

            if (step === 9) {
              return (
                <ResultGate
                  feature="sponsorship_calc"
                  planTier={effectiveTier}
                  standaloneToolId={isJourney ? undefined : "sponsorship-calculator"}
                >
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: COLORS.primary }}>Step 10 of 11</div>
                    <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-6 text-center">Alternative Options</h2>
                    
                    <div className="space-y-4 mb-8">
                      {/* Assets Option */}
                      <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                        <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleOption('assets')}>
                          <div className="flex items-center gap-2">
                            <DollarSign size={18} style={{ color: COLORS.secondary }} />
                            <span className="font-bold text-slate-800">Use Assets (Property/Savings)</span>
                          </div>
                          {expandedOptions.assets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        {expandedOptions.assets && (
                          <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                            <p className="text-xs text-slate-500 mb-4">You can use 1/3 (spouse/child of USC) or 1/5 of asset value to meet the requirement.</p>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                              <input 
                                type="number" 
                                value={data.assetValue || ""} 
                                onChange={(e) => setData({...data, assetValue: parseInt(e.target.value) || 0})}
                                className="w-full pl-8 p-3 text-lg border-2 border-slate-100 rounded-lg"
                                placeholder="Total Asset Value"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Substitute Sponsor Option */}
                      <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                        <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleOption('substitute')}>
                          <div className="flex items-center gap-2">
                            <Heart size={18} style={{ color: COLORS.danger }} />
                            <span className="font-bold text-slate-800">Substitute Sponsor</span>
                          </div>
                          {expandedOptions.substitute ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        {expandedOptions.substitute && (
                          <div className="p-4 bg-white">
                            <p className="text-xs text-slate-500 mb-3">If the original petitioner has passed away.</p>
                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={data.sponsorDeceased} 
                                onChange={() => setData({...data, sponsorDeceased: !data.sponsorDeceased})}
                                className="w-4 h-4 rounded"
                              />
                              The Petitioner is Deceased
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Self-Petition Option */}
                      <div className="border-2 rounded-xl overflow-hidden border-slate-200">
                        <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleOption('self')}>
                          <div className="flex items-center gap-2">
                            <Shield size={18} style={{ color: COLORS.primary }} />
                            <span className="font-bold text-slate-800">Self-Petition Categories</span>
                          </div>
                          {expandedOptions.self ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        {expandedOptions.self && (
                          <div className="p-4 bg-white space-y-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={data.isVAWA} onChange={() => setData({...data, isVAWA: !data.isVAWA})} /> VAWA Self-petitioner
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={data.isWidow} onChange={() => setData({...data, isWidow: !data.isWidow})} /> Widow(er) of US Citizen
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={data.isSpecialImmigrant} onChange={() => setData({...data, isSpecialImmigrant: !data.isSpecialImmigrant})} /> Special Immigrant
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-[10px]">
                      <button onClick={() => setStepIdx(7)} className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-medium hover:border-[#3a4f63] flex items-center gap-2">
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button onClick={() => setStepIdx(10)} style={{ backgroundColor: COLORS.primary }} className="flex-1 p-[14px_22px] text-white rounded-[10px] text-[15px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2">
                        View Results <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </ResultGate>
              );
            }

            if (step === 10) {
              return renderFinalPlan(isExemptChild);
            }
          })()}
        </div>
      </div>
    </div>
  );
}
