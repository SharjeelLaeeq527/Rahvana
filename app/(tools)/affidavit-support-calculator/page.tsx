"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Users,
  DollarSign,
  Shield,
  Flag,
  Heart,
  FileText,
  UserPlus,
  Plus,
  Trash2,
  Calculator,
  ArrowRight,
  Briefcase,
  Home,
  ChevronDown,
  ChevronUp,
  Send,
  Globe,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
// import { useRouter } from "next/navigation";

// ============================================================================
// POVERTY GUIDELINES DATA (2025 HHS Poverty Guidelines)
// ============================================================================

const POVERTY_GUIDELINES: Record<
  number,
  { level100: number; level125: number }
> = {
  1: { level100: 16510, level125: 20638 },
  2: { level100: 21150, level125: 26437 },
  3: { level100: 26650, level125: 33312 },
  4: { level100: 32150, level125: 40187 },
  5: { level100: 37650, level125: 47062 },
  6: { level100: 43150, level125: 53937 },
  7: { level100: 48650, level125: 60812 },
  8: { level100: 54150, level125: 67687 },
};

const ADDITIONAL_MEMBER_COST = {
  level100: 5500,
  level125: 6875,
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type SponsorStatus = "citizen" | "greenCard";

interface HouseholdMember {
  id: string;
  relationship: string;
  annualIncome: number;
}

interface JointSponsor {
  id: string;
  name: string;
  relationship: string;
  annualIncome: number;
}

interface FormData {
  sponsorStatus: SponsorStatus | null;
  isMilitary: boolean | null;
  isMarried: boolean | null;
  numberOfChildren: number;
  taxDependents: number;
  hasPreviousSponsorship: boolean | null;
  previousSponsoredCount: number;
  currentSponsoredApplicant: boolean;
  currentSponsoredSpouse: boolean;
  currentSponsoredChildren: number;
  annualIncome: number;
  householdMembers: HouseholdMember[];
  jointSponsors: JointSponsor[];
  // Case 7: Substitute sponsor info
  sponsorDeceased: boolean | null;
  // Case 9: Assets
  assetValue: number;
  relationshipToApplicant: string;
  // Case 10: Self-petition
  isVAWA: boolean | null;
  isWidow: boolean | null;
  isSpecialImmigrant: boolean | null;
  // Track used relationships for dropdown suggestions
  usedHouseholdRelationships: string[];
  usedJointSponsorRelationships: string[];
}

interface CalculatorResult {
  householdSize: number;
  requiredIncome: number;
  povertyLevel: number;
  ruleApplied: string;
  isEligible: boolean;
  shortfall: number;
  caseNumber: number;
  caseName: string;
  caseDescription: string;
}

// ============================================================================
// RELATIONSHIP OPTIONS
// ============================================================================

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Aunt/Uncle",
  "Niece/Nephew",
  "Cousin",
  "In-Law",
  "Friend",
  "Employer",
  "Other",
];

// ============================================================================
// CURRENCY INPUT COMPONENT
// ============================================================================

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

function formatCurrencyWithCommas(value: number): string {
  if (value == null || isNaN(value)) return "";
  if (value === 0) return "";
  const parts = value.toFixed(2).split(".");
  const integerPart = parseInt(parts[0]).toLocaleString();
  return `${integerPart}.${parts[1]}`;
}

function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  className = "",
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update display value when value prop changes (from parent)
  useEffect(() => {
    if (!isFocused) {
      if (value == null || isNaN(value)) {
        setDisplayValue("");
      } else if (value === 0) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatCurrencyWithCommas(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9.]/g, "");

    if (inputValue === "" || inputValue === ".") {
      setDisplayValue(inputValue);
      onChange(0);
      return;
    }

    const parts = inputValue.split(".");
    if (parts.length > 2) return;

    let validValue = inputValue;
    if (parts.length === 2 && parts[1].length > 2) {
      validValue = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    setDisplayValue(validValue);
    const numericValue = parseFloat(validValue);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format with commas when user leaves the field
    const numericValue = parseFloat(displayValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setDisplayValue(formatCurrencyWithCommas(numericValue));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw value without commas for easy editing
    if (value != null && !isNaN(value) && value > 0) {
      setDisplayValue(value.toString());
    } else {
      setDisplayValue("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xl sm:text-2xl pointer-events-none">
        $
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full pl-8 sm:pl-10 pr-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-left placeholder:text-slate-400"
      />
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

import { useAuth } from "@/app/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";
import { MasterProfile } from "@/types/profile";

export default function AffidavitSupportCalculator() {
  // const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    sponsorStatus: null,
    isMilitary: null,
    isMarried: null,
    numberOfChildren: 0,
    taxDependents: 0,
    hasPreviousSponsorship: null,
    previousSponsoredCount: 0,
    currentSponsoredApplicant: true,
    currentSponsoredSpouse: false,
    currentSponsoredChildren: 0,
    annualIncome: 0,
    householdMembers: [],
    jointSponsors: [],
    sponsorDeceased: null,
    assetValue: 0,
    relationshipToApplicant: "",
    isVAWA: null,
    isWidow: null,
    isSpecialImmigrant: null,
    usedHouseholdRelationships: [],
    usedJointSponsorRelationships: [],
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Auto-fill profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details && !profileLoaded) {
          const profile = data.profile_details as MasterProfile;

          // Map profile data to form structure
          const mappedData = mapProfileToGenericForm(profile, {
            sponsorStatus: formData.sponsorStatus,
            isMilitary: formData.isMilitary,
            isMarried: formData.isMarried,
            numberOfChildren: formData.numberOfChildren,
            taxDependents: formData.taxDependents,
            hasPreviousSponsorship: formData.hasPreviousSponsorship,
            previousSponsoredCount: formData.previousSponsoredCount,
            currentSponsoredApplicant: formData.currentSponsoredApplicant,
            currentSponsoredSpouse: formData.currentSponsoredSpouse,
            currentSponsoredChildren: formData.currentSponsoredChildren,
            annualIncome: formData.annualIncome,
            sponsorDeceased: formData.sponsorDeceased,
            assetValue: formData.assetValue,
            relationshipToApplicant: formData.relationshipToApplicant,
            isVAWA: formData.isVAWA,
            isWidow: formData.isWidow,
            isSpecialImmigrant: formData.isSpecialImmigrant,
          });

          setFormData((prev) => ({
            ...prev,
            ...mappedData,
          }));
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Error auto-filling profile:", err);
      }
    };

    fetchProfile();
  }, [user, profileLoaded, supabase, formData]);

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const addHouseholdMember = () => {
    setFormData({
      ...formData,
      householdMembers: [
        ...formData.householdMembers,
        { id: generateId(), relationship: "", annualIncome: 0 },
      ],
    });
    // Auto-expand the section
    setExpandedSections((prev) => ({ ...prev, household: true }));
  };

  const removeHouseholdMember = (id: string) => {
    setFormData({
      ...formData,
      householdMembers: formData.householdMembers.filter((m) => m.id !== id),
    });
  };

  const updateHouseholdMember = (
    id: string,
    updates: Partial<HouseholdMember>,
  ) => {
    // Track used relationships
    let newUsedRelationships = [...formData.usedHouseholdRelationships];
    if (
      updates.relationship &&
      !newUsedRelationships.includes(updates.relationship)
    ) {
      newUsedRelationships = [updates.relationship, ...newUsedRelationships];
    }

    setFormData({
      ...formData,
      householdMembers: formData.householdMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
      usedHouseholdRelationships: newUsedRelationships,
    });
  };

  const addJointSponsor = () => {
    setFormData({
      ...formData,
      jointSponsors: [
        ...formData.jointSponsors,
        { id: generateId(), name: "", relationship: "", annualIncome: 0 },
      ],
    });
    // Auto-expand the section
    setExpandedSections((prev) => ({ ...prev, joint: true }));
  };

  const removeJointSponsor = (id: string) => {
    setFormData({
      ...formData,
      jointSponsors: formData.jointSponsors.filter((s) => s.id !== id),
    });
  };

  const updateJointSponsor = (id: string, updates: Partial<JointSponsor>) => {
    // Track used relationships
    let newUsedRelationships = [...formData.usedJointSponsorRelationships];
    if (
      updates.relationship &&
      !newUsedRelationships.includes(updates.relationship)
    ) {
      newUsedRelationships = [updates.relationship, ...newUsedRelationships];
    }

    setFormData({
      ...formData,
      jointSponsors: formData.jointSponsors.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
      usedJointSponsorRelationships: newUsedRelationships,
    });
  };

  // ============================================================================
  // CALCULATION FUNCTIONS
  // ============================================================================

  const calculateHouseholdSize = (): number => {
    return (
      1 +
      (formData.isMarried ? 1 : 0) +
      formData.numberOfChildren +
      formData.taxDependents +
      formData.previousSponsoredCount +
      (formData.currentSponsoredApplicant ? 1 : 0) +
      (formData.currentSponsoredSpouse ? 1 : 0) +
      formData.currentSponsoredChildren
    );
  };

  const calculateRequiredIncome = (householdSize: number): number => {
    const isMilitarySpouseOrChild =
      formData.isMilitary &&
      (formData.currentSponsoredApplicant || formData.currentSponsoredSpouse);
    const povertyLevel = isMilitarySpouseOrChild ? 100 : 125;

    let baseIncome = POVERTY_GUIDELINES[8]?.[`level${povertyLevel}`] || 0;
    const additionalCost = ADDITIONAL_MEMBER_COST[`level${povertyLevel}`];

    if (householdSize <= 8 && POVERTY_GUIDELINES[householdSize]) {
      baseIncome = POVERTY_GUIDELINES[householdSize][`level${povertyLevel}`];
      return baseIncome;
    }

    const extraMembers = householdSize - 8;
    return baseIncome + extraMembers * additionalCost;
  };

  const calculateTotalIncome = (): number => {
    const householdTotal = formData.householdMembers.reduce(
      (sum, m) => sum + m.annualIncome,
      0,
    );
    const jointSponsorsTotal = formData.jointSponsors.reduce(
      (sum, s) => sum + s.annualIncome,
      0,
    );
    return formData.annualIncome + householdTotal + jointSponsorsTotal;
  };

  const calculateAssetAlternative = (): number => {
    const isSpouseOrParent = ["spouse", "parent"].includes(
      formData.relationshipToApplicant.toLowerCase(),
    );
    const multiplier = isSpouseOrParent ? 3 : 5;
    return formData.assetValue * multiplier;
  };

  // ============================================================================
  // FORMS INFO HELPER
  // ============================================================================

  interface FormInfo {
    name: string;
    description: string;
    whereToFile: string;
    notes: string[];
  }

  const getFormsInfo = (caseNumber: number): FormInfo[] => {
    const forms: Record<number, FormInfo[]> = {
      // Case 1-6: Regular sponsorship with income
      1: [
        {
          name: "I-864 - Affidavit of Support",
          description: "Official sponsor income verification form",
          whereToFile:
            "USCIS (United States Citizenship and Immigration Services)",
          notes: [
            "File online or by mail with your I-130/I-485 application",
            "Include copies of last 3 years of tax returns",
            "Sponsor must sign in presence of notary or USCIS officer",
          ],
        },
        {
          name: "I-864A - Contract Between Sponsor and Household Member",
          description: "Required if using household member's income",
          whereToFile: "USCIS (file with I-864)",
          notes: [
            "Each household member contributing income must sign this",
            "Include their tax returns and proof of residence",
          ],
        },
        {
          name: "I-864W - Request for Exemption (Optional)",
          description: "For VAWA/self-petition cases",
          whereToFile: "USCIS",
          notes: ["Only needed if sponsor is exempt from income requirements"],
        },
      ],
      // Case 5: Household member as sole sponsor
      5: [
        {
          name: "I-864 - Affidavit of Support",
          description: "Household member is the legal sponsor",
          whereToFile: "USCIS",
          notes: [
            "Household member must be US citizen or LPR",
            "They must meet household size requirements including their own family",
            "Include all required documentation",
          ],
        },
      ],
      // Case 6: Joint sponsor only
      6: [
        {
          name: "I-864 - Affidavit of Support",
          description: "Joint sponsor becomes primary sponsor",
          whereToFile: "USCIS",
          notes: [
            "Joint sponsor must fully meet income requirements alone",
            "Primary sponsor still files I-864A as contract",
            "Both sponsors are legally responsible",
          ],
        },
        {
          name: "I-864A - Contract Between Sponsor and Household Member",
          description: "Primary sponsor's contract",
          whereToFile: "USCIS (file with I-864)",
          notes: [
            "Primary sponsor acknowledges joint sponsorship",
            "Must provide financial documents",
          ],
        },
      ],
      // Case 7: Substitute sponsor
      7: [
        {
          name: "I-864 - Affidavit of Support",
          description: "Substitute sponsor form",
          whereToFile: "USCIS - File with I-130/I-485",
          notes: [
            "Must include Form I-363 Request to Designate or Substitute",
            "Original sponsor's death certificate required",
            "Substitute must be US citizen or LPR relative",
          ],
        },
        {
          name: "I-363 - Request to Designate or Substitute",
          description: "Official request for substitute sponsorship",
          whereToFile: "USCIS",
          notes: [
            "Required when original sponsor is deceased",
            "Must include proof of death",
            "Must show relationship to applicant",
          ],
        },
      ],
      // Case 8: Joint sponsor with their household
      8: [
        {
          name: "I-864 - Affidavit of Support",
          description: "Joint sponsor's form with household income",
          whereToFile: "USCIS",
          notes: [
            "Joint sponsor includes their household members",
            "Each household member signs I-864A",
            "Must prove household members live at same address",
          ],
        },
        {
          name: "I-864A - Contract for Each Household Member",
          description: "Joint sponsor's household contracts",
          whereToFile: "USCIS (file with I-864)",
          notes: [
            "Each contributing household member must sign",
            "Include their tax returns and proof of residence",
          ],
        },
      ],
      // Case 9: Using assets
      9: [
        {
          name: "I-864 - Affidavit of Support",
          description: "Asset-based sponsorship",
          whereToFile: "USCIS",
          notes: [
            "Use Form I-864 Supplement 3 for asset documentation",
            "Assets must be readily convertible to cash",
            "Include proof of ownership and value",
          ],
        },
        {
          name: "I-864 Supplement 3 - Identifying Information for Asset",
          description: "Asset documentation supplement",
          whereToFile: "USCIS (file with I-864)",
          notes: [
            "List all assets being used",
            "Provide valuation evidence",
            "Property must be free of liens",
          ],
        },
      ],
      // Case 10: Self-petitioning
      10: [
        {
          name: "I-360 - Petition for Amerasian, Widow(er), or Special Immigrant",
          description: "Self-petition form",
          whereToFile: "USCIS",
          notes: [
            "No sponsor required for VAWA, widow, or special immigrant cases",
            "Include evidence of eligibility category",
            "Consult immigration attorney for specific requirements",
          ],
        },
        {
          name: "I-485 - Application to Register Permanent Residence",
          description: "Green card application",
          whereToFile: "USCIS (after I-360 approval)",
          notes: [
            "File after I-360 is approved",
            "Include all supporting documents",
            "Biometrics appointment required",
          ],
        },
      ],
    };

    // Default forms for cases 2, 3, 4 (regular combined support)
    if ([2, 3, 4].includes(caseNumber)) {
      return forms[1];
    }

    return forms[caseNumber] || forms[1];
  };

  // ============================================================================
  // CASE CALCULATION FUNCTIONS
  // ============================================================================

  const checkCase1 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const requiredIncome = calculateRequiredIncome(householdSize);
    const totalIncome = formData.annualIncome;
    const isEligible = totalIncome >= requiredIncome;

    return {
      householdSize,
      requiredIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied:
        formData.isMilitary && formData.currentSponsoredApplicant
          ? "100% HHS Poverty Guidelines (Military)"
          : "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, requiredIncome - totalIncome),
      caseNumber: 1,
      caseName: "Primary Sponsor Alone",
      caseDescription:
        "Using only the primary sponsor's income to meet the poverty guideline requirement.",
    };
  };

  const checkCase2 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const requiredIncome = calculateRequiredIncome(householdSize);
    const totalIncome =
      formData.annualIncome +
      formData.householdMembers.reduce((sum, m) => sum + m.annualIncome, 0);
    const isEligible = totalIncome >= requiredIncome;

    return {
      householdSize,
      requiredIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied:
        formData.isMilitary && formData.currentSponsoredApplicant
          ? "100% HHS Poverty Guidelines (Military)"
          : "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, requiredIncome - totalIncome),
      caseNumber: 2,
      caseName: "Primary Sponsor + Household Members",
      caseDescription:
        "Including income from household members (spouse, dependents) living with the sponsor.",
    };
  };

  const checkCase3 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const requiredIncome = calculateRequiredIncome(householdSize);
    const totalIncome =
      formData.annualIncome +
      formData.jointSponsors.reduce((sum, s) => sum + s.annualIncome, 0);
    const isEligible = totalIncome >= requiredIncome;

    return {
      householdSize,
      requiredIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied:
        formData.isMilitary && formData.currentSponsoredApplicant
          ? "100% HHS Poverty Guidelines (Military)"
          : "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, requiredIncome - totalIncome),
      caseNumber: 3,
      caseName: "Primary Sponsor + Joint Sponsor(s)",
      caseDescription:
        "Using a joint sponsor who agrees to also be legally responsible for the immigrant.",
    };
  };

  const checkCase4 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const requiredIncome = calculateRequiredIncome(householdSize);
    const totalIncome = calculateTotalIncome();
    const isEligible = totalIncome >= requiredIncome;

    return {
      householdSize,
      requiredIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied:
        formData.isMilitary && formData.currentSponsoredApplicant
          ? "100% HHS Poverty Guidelines (Military)"
          : "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, requiredIncome - totalIncome),
      caseNumber: 4,
      caseName: "Combined Support",
      caseDescription:
        "Using both household members and joint sponsors to meet the income requirement.",
    };
  };

  const checkCase5 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const requiredIncome = calculateRequiredIncome(householdSize);
    const householdTotal = formData.householdMembers.reduce(
      (sum, m) => sum + m.annualIncome,
      0,
    );
    const isEligible =
      householdTotal >= requiredIncome && formData.annualIncome === 0;

    return {
      householdSize,
      requiredIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied:
        formData.isMilitary && formData.currentSponsoredApplicant
          ? "100% HHS Poverty Guidelines (Military)"
          : "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, requiredIncome - householdTotal),
      caseNumber: 5,
      caseName: "Household Member as Sole Sponsor",
      caseDescription:
        "When the primary sponsor has no income, a household member can sponsor using their income.",
    };
  };

  const checkCase6 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const requiredIncome = calculateRequiredIncome(householdSize);
    const jointTotal = formData.jointSponsors.reduce(
      (sum, s) => sum + s.annualIncome,
      0,
    );
    const isEligible =
      jointTotal >= requiredIncome && formData.annualIncome === 0;

    return {
      householdSize,
      requiredIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied:
        formData.isMilitary && formData.currentSponsoredApplicant
          ? "100% HHS Poverty Guidelines (Military)"
          : "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, requiredIncome - jointTotal),
      caseNumber: 6,
      caseName: "Joint Sponsor Only",
      caseDescription:
        "When the primary sponsor has no income, a joint sponsor can fully support the application.",
    };
  };

  const checkCase7 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const reqIncome = calculateRequiredIncome(householdSize);

    return {
      householdSize,
      requiredIncome: reqIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied: "Substitute Sponsor Requirements",
      isEligible: formData.sponsorDeceased === true,
      shortfall: reqIncome,
      caseNumber: 7,
      caseName: "Substitute Sponsor",
      caseDescription:
        "When the original sponsor has died, a US citizen/lawful permanent resident relative can become a substitute sponsor.",
    };
  };

  const checkCase8 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const reqIncome = calculateRequiredIncome(householdSize);

    // Calculate joint sponsor's household income
    let jointSponsorHouseholdIncome = 0;
    formData.jointSponsors.forEach((sponsor) => {
      jointSponsorHouseholdIncome += sponsor.annualIncome;
    });

    const isEligible = jointSponsorHouseholdIncome >= reqIncome;

    return {
      householdSize,
      requiredIncome: reqIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied: "125% HHS Poverty Guidelines",
      isEligible,
      shortfall: Math.max(0, reqIncome - jointSponsorHouseholdIncome),
      caseNumber: 8,
      caseName: "Joint Sponsor + Their Household",
      caseDescription:
        "The joint sponsor can include their spouse&apos;s income and other household members&apos; income.",
    };
  };

  const checkCase9 = (): CalculatorResult => {
    const householdSize = calculateHouseholdSize();
    const reqIncome = calculateRequiredIncome(householdSize);
    const assetAlternative = calculateAssetAlternative();
    const isEligible = assetAlternative >= reqIncome;

    return {
      householdSize,
      requiredIncome: reqIncome,
      povertyLevel:
        formData.isMilitary && formData.currentSponsoredApplicant ? 100 : 125,
      ruleApplied: "Asset-based Alternative (3x or 5x shortfall)",
      isEligible,
      shortfall: Math.max(0, reqIncome - assetAlternative),
      caseNumber: 9,
      caseName: "Using Assets",
      caseDescription:
        "If you don't have enough income, you can use assets (property, savings) worth 5x the shortfall. For spouse or parent sponsors, only 3x is needed.",
    };
  };

  const checkCase10 = (): CalculatorResult => {
    const isEligible =
      formData.isVAWA === true ||
      formData.isWidow === true ||
      formData.isSpecialImmigrant === true;
    const householdSize = 1;

    return {
      householdSize,
      requiredIncome: 0,
      povertyLevel: 0,
      ruleApplied: "Self-Petition Provisions",
      isEligible,
      shortfall: 0,
      caseNumber: 10,
      caseName: "Self-Petitioning",
      caseDescription:
        "Certain categories can self-petition without a sponsor: VAWA(Violence Against Women Act) self-petitioners, widows of US citizens, and special immigrants.",
    };
  };

  const calculateResult = (): CalculatorResult => {
    // Check all cases in order and return the first eligible one
    // Or return the best available option

    const case1 = checkCase1();
    if (case1.isEligible) return case1;

    // Try Case 2 if household members added
    if (formData.householdMembers.length > 0) {
      const case2 = checkCase2();
      if (case2.isEligible) return case2;
    }

    // Try Case 3 if joint sponsors added
    if (formData.jointSponsors.length > 0) {
      const case3 = checkCase3();
      if (case3.isEligible) return case3;
    }

    // Try Case 4 if both types added
    if (
      formData.householdMembers.length > 0 &&
      formData.jointSponsors.length > 0
    ) {
      const case4 = checkCase4();
      if (case4.isEligible) return case4;
    }

    // Try Case 5 if sponsor has no income but household does
    if (formData.annualIncome === 0 && formData.householdMembers.length > 0) {
      const case5 = checkCase5();
      if (case5.isEligible) return case5;
    }

    // Try Case 6 if sponsor has no income but joint sponsor does
    if (formData.annualIncome === 0 && formData.jointSponsors.length > 0) {
      const case6 = checkCase6();
      if (case6.isEligible) return case6;
    }

    // Try Case 7 for substitute sponsor
    if (formData.sponsorDeceased === true) {
      const case7 = checkCase7();
      if (case7.isEligible) return case7;
    }

    // Try Case 8 for joint sponsor with their household
    if (formData.jointSponsors.length > 0) {
      const case8 = checkCase8();
      if (case8.isEligible) return case8;
    }

    // Try Case 9 for asset-based alternative
    const case9 = checkCase9();
    if (case9.isEligible) return case9;

    // Try Case 10 for self-petitioning
    const case10 = checkCase10();
    if (case10.isEligible) return case10;

    // Return Case 1 as fallback (not eligible)
    return case1;
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleNext = () => {
    if (currentStep === 7) {
      const calcResult = calculateResult();
      setResult(calcResult);
      if (calcResult.isEligible) {
        setCurrentStep(11); // Direct to eligible result
      } else {
        setCurrentStep(8); // Go to add support
      }
    } else if (currentStep === 8) {
      const calcResult = calculateResult();
      setResult(calcResult);
      if (calcResult.isEligible) {
        setCurrentStep(11);
      } else {
        setCurrentStep(9); // Show options
      }
    } else if (currentStep === 9) {
      const calcResult = calculateResult();
      setResult(calcResult);
      if (calcResult.isEligible) {
        setCurrentStep(11);
      } else {
        setCurrentStep(10); // Additional cases
      }
    } else if (currentStep === 10) {
      const calcResult = calculateResult();
      setResult(calcResult);
      setCurrentStep(11); // Final results
    } else if (currentStep === 11) {
      const calcResult = calculateResult();
      if (!calcResult.isEligible) {
        setCurrentStep(10);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 11 && result && !result.isEligible) {
      setCurrentStep(10);
    } else if (currentStep === 11) {
      const calcResult = calculateResult();
      if (calcResult.isEligible) {
        setCurrentStep(7);
      } else {
        setCurrentStep(8);
      }
    } else if (currentStep === 10) {
      setCurrentStep(9);
    } else if (currentStep === 9) {
      setCurrentStep(8);
    } else if (currentStep === 8) {
      const calcResult = calculateResult();
      if (calcResult.isEligible) {
        setCurrentStep(7);
      } else {
        setCurrentStep(7);
      }
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFormData({
      sponsorStatus: null,
      isMilitary: null,
      isMarried: null,
      numberOfChildren: 0,
      taxDependents: 0,
      hasPreviousSponsorship: null,
      previousSponsoredCount: 0,
      currentSponsoredApplicant: true,
      currentSponsoredSpouse: false,
      currentSponsoredChildren: 0,
      annualIncome: 0,
      householdMembers: [],
      jointSponsors: [],
      sponsorDeceased: null,
      assetValue: 0,
      relationshipToApplicant: "",
      isVAWA: null,
      isWidow: null,
      isSpecialImmigrant: null,
      usedHouseholdRelationships: [],
      usedJointSponsorRelationships: [],
    });
    setResult(null);
    setExpandedSections({});
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.sponsorStatus !== null && formData.isMilitary !== null;
      case 2:
        return formData.isMarried !== null;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        if (formData.hasPreviousSponsorship === false) return true;
        return (
          Boolean(formData.hasPreviousSponsorship) &&
          formData.previousSponsoredCount > 0
        );
      case 6:
        return true;
      case 7:
        return formData.annualIncome >= 0;
      case 8:
        return true;
      case 9:
        return true;
      case 10:
        return true;
      default:
        return true;
    }
  };

  // ============================================================================
  // STEP RENDERERS
  // ============================================================================

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Sponsor Information
        </h3>
        <p className="text-slate-600 mt-2">
          Are you a US Citizen or Green Card Holder?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setFormData({ ...formData, sponsorStatus: "citizen" })}
          className={`p-4 rounded-xl border-2 transition-all ${
            formData.sponsorStatus === "citizen"
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold text-slate-900">US Citizen</p>
          </div>
        </button>
        <button
          onClick={() =>
            setFormData({ ...formData, sponsorStatus: "greenCard" })
          }
          className={`p-4 rounded-xl border-2 transition-all ${
            formData.sponsorStatus === "greenCard"
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-center">
            <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold text-slate-900">Green Card Holder</p>
          </div>
        </button>
      </div>

      {formData.sponsorStatus && (
        <div
          className="pt-4 border-t border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-slate-900 mb-3">
            Are you active-duty US Military?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setFormData({ ...formData, isMilitary: true })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.isMilitary === true
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-center">
                <Flag className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-slate-900">Yes, Active Duty</p>
              </div>
            </button>
            <button
              onClick={() => setFormData({ ...formData, isMilitary: false })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.isMilitary === false
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-center">
                <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-slate-900">No, Civilian</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Marital Status</h3>
        <p className="text-slate-600 mt-2">Are you married?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setFormData({ ...formData, isMarried: true })}
          className={`p-6 rounded-xl border-2 transition-all ${
            formData.isMarried === true
              ? "border-purple-500 bg-purple-50"
              : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-purple-600" />
            <p className="font-semibold text-slate-900">Yes, Married</p>
          </div>
        </button>
        <button
          onClick={() => setFormData({ ...formData, isMarried: false })}
          className={`p-6 rounded-xl border-2 transition-all ${
            formData.isMarried === false
              ? "border-purple-500 bg-purple-50"
              : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-center">
            <User className="w-10 h-10 mx-auto mb-3 text-purple-600" />
            <p className="font-semibold text-slate-900">No, Single</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Your Children</h3>
        <p className="text-slate-600 mt-2">How many children do you have?</p>
      </div>

      <div className="flex items-center gap-3 justify-center">
        <button
          onClick={() =>
            setFormData({
              ...formData,
              numberOfChildren: Math.max(0, formData.numberOfChildren - 1),
            })
          }
          className="w-12 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xl"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          value={formData.numberOfChildren}
          onChange={(e) =>
            setFormData({
              ...formData,
              numberOfChildren: Math.max(0, parseInt(e.target.value) || 0),
            })
          }
          className="w-24 text-center text-3xl font-bold text-slate-900 bg-transparent border-0 focus:outline-none"
        />
        <button
          onClick={() =>
            setFormData({
              ...formData,
              numberOfChildren: formData.numberOfChildren + 1,
            })
          }
          className="w-12 h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xl"
        >
          +
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Tax Dependents</h3>
        <p className="text-slate-600 mt-2">
          How many dependents on your tax return?
        </p>
      </div>

      <div className="flex items-center gap-3 justify-center">
        <button
          onClick={() =>
            setFormData({
              ...formData,
              taxDependents: Math.max(0, formData.taxDependents - 1),
            })
          }
          className="w-12 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xl"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          value={formData.taxDependents}
          onChange={(e) =>
            setFormData({
              ...formData,
              taxDependents: Math.max(0, parseInt(e.target.value) || 0),
            })
          }
          className="w-24 text-center text-3xl font-bold text-slate-900 bg-transparent border-0 focus:outline-none"
        />
        <button
          onClick={() =>
            setFormData({
              ...formData,
              taxDependents: formData.taxDependents + 1,
            })
          }
          className="w-12 h-12 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl"
        >
          +
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-linear-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Previous Sponsorships
        </h3>
        <p className="text-slate-600 mt-2">
          Have you previously sponsored anyone who has not yet become a U.S.
          citizen?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() =>
            setFormData({ ...formData, hasPreviousSponsorship: true })
          }
          className={`p-4 rounded-xl border-2 transition-all ${
            formData.hasPreviousSponsorship === true
              ? "border-red-500 bg-red-50"
              : "border-slate-200 hover:border-red-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="font-semibold text-slate-900">Yes</p>
          </div>
        </button>
        <button
          onClick={() =>
            setFormData({
              ...formData,
              hasPreviousSponsorship: false,
              previousSponsoredCount: 0,
            })
          }
          className={`p-4 rounded-xl border-2 transition-all ${
            formData.hasPreviousSponsorship === false
              ? "border-red-500 bg-red-50"
              : "border-slate-200 hover:border-red-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="font-semibold text-slate-900">No</p>
          </div>
        </button>
      </div>

      {formData.hasPreviousSponsorship && (
        <div
          className="pt-4 border-t border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-slate-900 mb-3">How many?</p>
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  previousSponsoredCount: Math.max(
                    1,
                    formData.previousSponsoredCount - 1,
                  ),
                })
              }
              className="w-12 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xl"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={formData.previousSponsoredCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  previousSponsoredCount: Math.max(
                    0,
                    parseInt(e.target.value) || 0,
                  ),
                })
              }
              className="w-24 text-center text-3xl font-bold text-slate-900 bg-transparent border-0 focus:outline-none"
            />
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  previousSponsoredCount: formData.previousSponsoredCount + 1,
                })
              }
              className="w-12 h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xl"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Who Are You Sponsoring?
        </h3>
      </div>

      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-indigo-600" />
          <p className="font-semibold text-indigo-900">
            Main Applicant (always included)
          </p>
        </div>
      </div>

      <label
        className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer hover:border-indigo-300"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={formData.currentSponsoredSpouse}
          onChange={(e) =>
            setFormData({
              ...formData,
              currentSponsoredSpouse: e.target.checked,
            })
          }
          className="w-5 h-5 rounded border-slate-300 text-indigo-600"
        />
        <div>
          <p className="font-semibold text-slate-900">Spouse of applicant</p>
          <p className="text-sm text-slate-500">Add 1 to household</p>
        </div>
      </label>

      <div onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-slate-900 mb-3">
          How many children of applicant?
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() =>
              setFormData({
                ...formData,
                currentSponsoredChildren: Math.max(
                  0,
                  formData.currentSponsoredChildren - 1,
                ),
              })
            }
            className="w-12 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xl"
          >
            -
          </button>
          <input
            type="number"
            min="0"
            value={formData.currentSponsoredChildren}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentSponsoredChildren: Math.max(
                  0,
                  parseInt(e.target.value) || 0,
                ),
              })
            }
            className="w-24 text-center text-3xl font-bold text-slate-900 bg-transparent border-0 focus:outline-none"
          />
          <button
            onClick={() =>
              setFormData({
                ...formData,
                currentSponsoredChildren: formData.currentSponsoredChildren + 1,
              })
            }
            className="w-12 h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => {
    const calcResult = calculateResult();
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            Your Annual Income
          </h3>
          <p className="text-slate-600 mt-2">Enter your total annual income</p>
        </div>

        <CurrencyInput
          value={formData.annualIncome || 0}
          onChange={(value) =>
            setFormData({ ...formData, annualIncome: value })
          }
          placeholder="0.00"
        />

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Required:</span> $
                {calcResult.requiredIncome.toLocaleString()}
              </p>
              <p className="text-xs text-blue-700">
                Household: {calcResult.householdSize} persons
              </p>
            </div>
            <p className="text-xs text-blue-600">{calcResult.ruleApplied}</p>
          </div>
        </div>
      </div>
    );
  };

  // Step 8: Add Support (Questionnaire Style)
  const renderStep8 = () => {
    const calcResult = calculateResult();
    const totalIncome = calculateTotalIncome();
    const remainingShortfall = Math.max(
      0,
      calcResult.requiredIncome - totalIncome,
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            Add Income Support
          </h3>
          <p className="text-slate-600 mt-2">
            You need{" "}
            <span className="font-bold text-amber-600">
              ${remainingShortfall.toLocaleString()}
            </span>{" "}
            more
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex justify-between">
            <p className="text-sm text-amber-900">
              Required: ${calcResult.requiredIncome.toLocaleString()} | Your
              Total: ${totalIncome.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Option 1: Household Members */}
        <div
          className={`border-2 rounded-xl overflow-hidden transition-all ${
            expandedSections.household
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-emerald-200"
          }`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-50/50"
            onClick={() => toggleSection("household")}
          >
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-slate-900">
                Household Members
              </h4>
            </div>
            {expandedSections.household ? (
              <ChevronUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          {expandedSections.household && (
            <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              {formData.householdMembers.length === 0 ? (
                <p className="text-sm text-slate-500 mb-4">
                  No household members added
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {formData.householdMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={member.relationship}
                          onChange={(e) =>
                            updateHouseholdMember(member.id, {
                              relationship: e.target.value,
                            })
                          }
                          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                        >
                          <option value="">Select relationship...</option>
                          {[
                            ...formData.usedHouseholdRelationships,
                            ...RELATIONSHIP_OPTIONS,
                          ]
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map((rel) => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => removeHouseholdMember(member.id)}
                          className="text-red-500 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <CurrencyInput
                        value={member.annualIncome || 0}
                        onChange={(value) =>
                          updateHouseholdMember(member.id, {
                            annualIncome: value,
                          })
                        }
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={addHouseholdMember}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Household Member
              </Button>
            </div>
          )}
        </div>

        {/* Option 2: Joint Sponsors */}
        <div
          className={`border-2 rounded-xl overflow-hidden transition-all ${
            expandedSections.joint
              ? "border-rose-500 bg-rose-50/50"
              : "border-rose-200"
          }`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-rose-50/50"
            onClick={() => toggleSection("joint")}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-600" />
              <h4 className="font-semibold text-slate-900">Joint Sponsors</h4>
            </div>
            {expandedSections.joint ? (
              <ChevronUp className="w-5 h-5 text-rose-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-rose-600" />
            )}
          </div>

          {expandedSections.joint && (
            <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              {formData.jointSponsors.length === 0 ? (
                <p className="text-sm text-slate-500 mb-4">
                  No joint sponsors added
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {formData.jointSponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={sponsor.name}
                          onChange={(e) =>
                            updateJointSponsor(sponsor.id, {
                              name: e.target.value,
                            })
                          }
                          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2"
                        />
                        <button
                          onClick={() => removeJointSponsor(sponsor.id)}
                          className="text-red-500 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={sponsor.relationship}
                          onChange={(e) =>
                            updateJointSponsor(sponsor.id, {
                              relationship: e.target.value,
                            })
                          }
                          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                        >
                          <option value="">Select relationship...</option>
                          {[
                            ...formData.usedJointSponsorRelationships,
                            ...RELATIONSHIP_OPTIONS,
                          ]
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map((rel) => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                        </select>
                      </div>
                      <CurrencyInput
                        value={sponsor.annualIncome || 0}
                        onChange={(value) =>
                          updateJointSponsor(sponsor.id, {
                            annualIncome: value,
                          })
                        }
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={addJointSponsor}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Joint Sponsor
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-100 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-slate-700">New Total Income:</p>
            <p className="text-xl font-bold text-slate-900">
              ${totalIncome.toLocaleString()}
            </p>
          </div>
        </div>

        <Button
          onClick={handleNext}
          className="w-full bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
          size="lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Check If Eligible Now
        </Button>
      </div>
    );
  };

  // Step 9: Options when still not eligible
  const renderStep9 = () => {
    const calcResult = calculateResult();

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            Still Short: ${calcResult.shortfall.toLocaleString()}
          </h3>
          <p className="text-slate-600 mt-2">Consider these options:</p>
        </div>

        {/* Option 7: Substitute Sponsor */}
        <div
          className={`border-2 rounded-xl overflow-hidden transition-all ${
            expandedSections.case7
              ? "border-slate-400 bg-slate-50"
              : "border-slate-300"
          }`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
            onClick={() => toggleSection("case7")}
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">
                Substitute Sponsor
              </h4>
            </div>
            {expandedSections.case7 ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {expandedSections.case7 && (
            <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-slate-600 mb-4">
                Did the primary sponsor pass away? A family member can become
                substitute sponsor.
              </p>

              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Requirement:</strong> The original sponsor must have
                    died, and the substitute sponsor must be a US citizen or
                    lawful permanent resident relative.
                  </p>
                </div>

                <p className="font-medium text-slate-900">
                  Did the sponsor pass away?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, sponsorDeceased: true })
                    }
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      formData.sponsorDeceased === true
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-semibold text-slate-900">Yes</span>
                  </button>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, sponsorDeceased: false })
                    }
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      formData.sponsorDeceased === false
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-semibold text-slate-900">No</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Option 8: Joint with their household */}
        <div
          className={`border-2 rounded-xl overflow-hidden transition-all ${
            expandedSections.case8
              ? "border-slate-400 bg-slate-50"
              : "border-slate-300"
          }`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
            onClick={() => toggleSection("case8")}
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">
                Joint Sponsor + Their Household
              </h4>
            </div>
            {expandedSections.case8 ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {expandedSections.case8 && (
            <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-slate-600 mb-4">
                Can your joint sponsor use their spouse&apos;s income to
                qualify?
              </p>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> Joint sponsors can include
                  their household members&apos; income (spouse, dependents)
                  toward the total income requirement.
                </p>
              </div>

              <Button
                onClick={() => {
                  setExpandedSections((prev) => ({ ...prev, joint: true }));
                  setCurrentStep(8);
                }}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add More Joint Sponsors
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handlePrevious} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Add More Supporters
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Next Options
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Step 10: Additional Cases (9 & 10)
  const renderStep10 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">More Options</h3>
          <p className="text-slate-600 mt-2">Alternative ways to qualify</p>
        </div>

        {/* Case 9: Assets */}
        <div
          className={`border-2 rounded-xl overflow-hidden transition-all ${
            expandedSections.case9
              ? "border-amber-500 bg-amber-50"
              : "border-amber-200"
          }`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50"
            onClick={() => toggleSection("case9")}
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">Use Assets</h4>
            </div>
            {expandedSections.case9 ? (
              <ChevronUp className="w-5 h-5 text-amber-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-600" />
            )}
          </div>

          {expandedSections.case9 && (
            <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-slate-600 mb-4">
                Use assets (property, savings) worth 5x the shortfall. For
                spouse or parent sponsors, only 3x needed.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Your Relationship to Applicant
                  </label>
                  <select
                    value={formData.relationshipToApplicant}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relationshipToApplicant: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-slate-200 rounded-lg"
                  >
                    <option value="">Select relationship...</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Total Asset Value
                  </label>
                  <CurrencyInput
                    value={formData.assetValue || 0}
                    onChange={(value) =>
                      setFormData({ ...formData, assetValue: value })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Asset Alternative:</strong> $
                    {calculateAssetAlternative().toLocaleString()}
                    {formData.relationshipToApplicant.toLowerCase() ===
                      "spouse" ||
                    formData.relationshipToApplicant.toLowerCase() ===
                      "parent" ? (
                      <span className="text-green-600">
                        {" "}
                        (3x multiplier applied)
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        {" "}
                        (5x multiplier applied)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Case 10: Self-Petitioning */}
        <div
          className={`border-2 rounded-xl overflow-hidden transition-all ${
            expandedSections.case10
              ? "border-indigo-500 bg-indigo-50"
              : "border-indigo-200"
          }`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-indigo-50"
            onClick={() => toggleSection("case10")}
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">Self-Petitioning</h4>
            </div>
            {expandedSections.case10 ? (
              <ChevronUp className="w-5 h-5 text-indigo-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-indigo-600" />
            )}
          </div>

          {expandedSections.case10 && (
            <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-slate-600 mb-4">
                Certain categories can self-petition without a sponsor.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.isVAWA === true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isVAWA: e.target.checked ? true : null,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      VAWA Self-Petitioner
                    </p>
                    <p className="text-xs text-slate-500">
                      Victims of domestic violence
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.isWidow === true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isWidow: e.target.checked ? true : null,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Widow of US Citizen
                    </p>
                    <p className="text-xs text-slate-500">
                      Surviving spouses of US citizens
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.isSpecialImmigrant === true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isSpecialImmigrant: e.target.checked ? true : null,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Special Immigrant
                    </p>
                    <p className="text-xs text-slate-500">
                      Religious workers, translators, etc.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handlePrevious} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-linear-to-r from-emerald-600 to-emerald-700"
          >
            See Results
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Step 11: Final Results
  const renderStep11 = () => {
    const calcResult = result || calculateResult();
    const totalIncome = calculateTotalIncome();
    const assetAlternative = calculateAssetAlternative();
    const isEligible =
      calcResult.isEligible ||
      formData.isVAWA ||
      formData.isWidow ||
      formData.isSpecialImmigrant ||
      assetAlternative >= calcResult.requiredIncome;

    return (
      <div className="space-y-6">
        {/* Eligibility Status */}
        <Card
          className={`border-2 ${isEligible ? "border-emerald-500 bg-emerald-50" : "border-red-500 bg-red-50"}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {isEligible ? (
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h4 className="text-2xl font-bold text-slate-900">
                  {isEligible ? "Eligible!" : "Not Eligible"}
                </h4>
                <p className="text-sm text-slate-600">
                  {isEligible
                    ? "Your income meets the requirement!"
                    : `Still short: $${calcResult.shortfall.toLocaleString()}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Info */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-2">
              How You&apos;re Qualifying
            </h4>
            <p className="text-lg font-bold text-slate-900 mb-1">
              {calcResult.caseName}
            </p>
            <p className="text-sm text-slate-600">
              {calcResult.caseDescription}
            </p>
          </CardContent>
        </Card>

        {/* Income Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">
              Income Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Your Income:</span>
                <span className="font-semibold">
                  ${formData.annualIncome.toLocaleString()}
                </span>
              </div>
              {formData.householdMembers
                .filter((m) => m.annualIncome > 0)
                .map((member, index) => (
                  <div
                    key={member.id}
                    className="flex justify-between text-emerald-600"
                  >
                    <span>
                      Household {index + 1} ({member.relationship}):
                    </span>
                    <span className="font-semibold">
                      +${member.annualIncome.toLocaleString()}
                    </span>
                  </div>
                ))}
              {formData.jointSponsors
                .filter((s) => s.annualIncome > 0)
                .map((sponsor, index) => (
                  <div
                    key={sponsor.id}
                    className="flex justify-between text-rose-600"
                  >
                    <span>
                      Joint {index + 1} ({sponsor.name || "Unnamed"}):
                    </span>
                    <span className="font-semibold">
                      +${sponsor.annualIncome.toLocaleString()}
                    </span>
                  </div>
                ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Income:</span>
                <span>${totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Required:</span>
                <span>${calcResult.requiredIncome.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Alternative (if applicable) */}
        {formData.assetValue > 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h4 className="font-semibold text-slate-900 mb-4">
                Asset Alternative
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Asset Value:</span>
                  <span className="font-semibold">
                    ${formData.assetValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Multiplier:</span>
                  <span className="font-semibold">
                    {formData.relationshipToApplicant.toLowerCase() ===
                      "spouse" ||
                    formData.relationshipToApplicant.toLowerCase() === "parent"
                      ? "3x"
                      : "5x"}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total Alternative:</span>
                  <span>${assetAlternative.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Household</p>
                  <p className="text-xl font-bold">
                    {calcResult.householdSize}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Required</p>
                  <p className="text-xl font-bold">
                    ${calcResult.requiredIncome.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <p className="text-sm font-semibold mb-2">Progress</p>
            <Progress
              value={Math.min(
                (totalIncome / calcResult.requiredIncome) * 100,
                100,
              )}
              className="h-3"
            />
            <p className="text-xs text-slate-500 mt-2">
              {calcResult.ruleApplied}
            </p>
          </CardContent>
        </Card>

        {/* Forms to File */}
        {isEligible && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Forms to File</h4>
              </div>

              <div className="space-y-4">
                {getFormsInfo(calcResult.caseNumber).map((form, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-slate-50 p-3 border-b border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900">
                            {form.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {form.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            Where to File:
                          </p>
                          <p className="text-sm text-slate-600">
                            {form.whereToFile}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            Important Notes:
                          </p>
                          <ul className="text-sm text-slate-600 space-y-1 mt-1">
                            {form.notes.map((note, noteIndex) => (
                              <li
                                key={noteIndex}
                                className="flex items-start gap-1.5"
                              >
                                <span className="text-slate-400">•</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Quick Access
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.uscis.gov/forms/all-forms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Download Forms
                  </a>
                  <a
                    href="https://www.uscis.gov/file-online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    File Online
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handlePrevious} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Add More Supporters
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Start Over
          </Button>
        </div>
      </div>
    );
  };

  const getDisplayStep = () => {
    if (currentStep <= 10) return currentStep;
    if (currentStep === 11) return 11;
    return currentStep;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Sponsor Info";
      case 2:
        return "Marital Status";
      case 3:
        return "Children";
      case 4:
        return "Dependents";
      case 5:
        return "Previous";
      case 6:
        return "Sponsoring";
      case 7:
        return "Income";
      case 8:
        return "Add Support";
      case 9:
        return "More Options";
      case 10:
        return "Other Options";
      case 11:
        return "Results";
      default:
        return `Step ${getDisplayStep()}`;
    }
  };

  const getProgressValue = (): number => {
    const stepConfig: Record<number, number> = {
      1: 9,
      2: 18,
      3: 27,
      4: 36,
      5: 45,
      6: 54,
      7: 63,
      8: 72,
      9: 82,
      10: 91,
      11: 100,
    };
    return stepConfig[currentStep] || (currentStep / 11) * 100;
  };

  return (
    <div className="bg-linear-to-br from-slate-50 to-slate-100 site-main-px site-main-py">
      <div className="">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button> */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Affidavit Calculator
              </h1>
              <p className="text-sm text-slate-600">
                Step {getDisplayStep()}: {getStepTitle()}
              </p>
            </div>
          </div>
          <Link href="/affidavit-support-calculator/guide">
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Read Guide
            </Button>
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={getProgressValue()} className="h-2" />
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardDescription>
              {currentStep === 11
                ? "Review your results"
                : "Complete all fields to proceed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}
              {currentStep === 7 && renderStep7()}
              {currentStep === 8 && renderStep8()}
              {currentStep === 9 && renderStep9()}
              {currentStep === 10 && renderStep10()}
              {currentStep === 11 && renderStep11()}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-slate-200">
              <div className="flex gap-3 w-full sm:w-auto">
                {currentStep > 1 && currentStep < 11 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="rounded-xl flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                )}
                {currentStep === 11 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="rounded-xl flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                )}
              </div>
              {currentStep < 11 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {currentStep === 7
                    ? "Check Eligibility"
                    : currentStep === 10
                      ? "See Results"
                      : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            2025 HHS Poverty Guidelines. Consult a lawyer for official purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
