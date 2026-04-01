// ============================================================================
// POVERTY GUIDELINES DATA (2025 HHS Poverty Guidelines)
// Source: https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
// ============================================================================

export const POVERTY_GUIDELINES: Record<
  number,
  { level100: number; level125: number }
> = {
  2: { level100: 21640, level125: 27050 },
  3: { level100: 27320, level125: 34150 },
  4: { level100: 33000, level125: 41250 },
  5: { level100: 38680, level125: 48350 },
  6: { level100: 44360, level125: 55450 },
  7: { level100: 50040, level125: 62550 },
  8: { level100: 55720, level125: 69650 },
};

// Additional person amount added for households larger than 8
export const ADDITIONAL_MEMBER_COST = {
  level100: 5680,
  level125: 7100,
};

// ============================================================================
// RELATIONSHIP OPTIONS
// ============================================================================

export const RELATIONSHIP_OPTIONS = [
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
// TYPES & INTERFACES
// ============================================================================

export type SponsorStatus = "citizen" | "greenCard";

export interface HouseholdMember {
  id: string;
  relationship: string;
  annualIncome: number;
}

export interface JointSponsor {
  id: string;
  name: string;
  relationship: string;
  annualIncome: number;
}

export interface AffidavitFormData {
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
  sponsorDeceased: boolean | null;
  assetValue: number;
  relationshipToApplicant: string;
  isVAWA: boolean | null;
  isWidow: boolean | null;
  isSpecialImmigrant: boolean | null;
  usedHouseholdRelationships: string[];
  usedJointSponsorRelationships: string[];
}

export interface CalculatorResult {
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

export const DEFAULT_FORM_DATA: AffidavitFormData = {
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
};

// ============================================================================
// FORMS INFO
// ============================================================================

export interface FormInfo {
  name: string;
  description: string;
  whereToFile: string;
  notes: string[];
}

export const getFormsInfo = (caseNumber: number): FormInfo[] => {
  const forms: Record<number, FormInfo[]> = {
    1: [
      {
        name: "I-864 – Affidavit of Support",
        description: "Official sponsor income verification form",
        whereToFile: "USCIS (United States Citizenship and Immigration Services)",
        notes: [
          "File online or by mail with your I-130/I-485 application",
          "Include copies of last 3 years of tax returns",
          "Sponsor must sign in presence of notary or USCIS officer",
        ],
      },
      {
        name: "I-864A – Contract Between Sponsor and Household Member",
        description: "Required if using household member's income",
        whereToFile: "USCIS (file with I-864)",
        notes: [
          "Each household member contributing income must sign this",
          "Include their tax returns and proof of residence",
        ],
      },
      {
        name: "I-864W – Request for Exemption (Optional)",
        description: "For VAWA/self-petition cases",
        whereToFile: "USCIS",
        notes: ["Only needed if sponsor is exempt from income requirements"],
      },
    ],
    5: [
      {
        name: "I-864 – Affidavit of Support",
        description: "Household member is the legal sponsor",
        whereToFile: "USCIS",
        notes: [
          "Household member must be US citizen or LPR",
          "They must meet household size requirements including their own family",
          "Include all required documentation",
        ],
      },
    ],
    6: [
      {
        name: "I-864 – Affidavit of Support",
        description: "Joint sponsor becomes primary sponsor",
        whereToFile: "USCIS",
        notes: [
          "Joint sponsor must fully meet income requirements alone",
          "Primary sponsor still files I-864A as contract",
          "Both sponsors are legally responsible",
        ],
      },
      {
        name: "I-864A – Contract Between Sponsor and Household Member",
        description: "Primary sponsor's contract",
        whereToFile: "USCIS (file with I-864)",
        notes: [
          "Primary sponsor acknowledges joint sponsorship",
          "Must provide financial documents",
        ],
      },
    ],
    7: [
      {
        name: "I-864 – Affidavit of Support",
        description: "Substitute sponsor form",
        whereToFile: "USCIS – File with I-130/I-485",
        notes: [
          "Must include Form I-363 Request to Designate or Substitute",
          "Original sponsor's death certificate required",
          "Substitute must be US citizen or LPR relative",
        ],
      },
      {
        name: "I-363 – Request to Designate or Substitute",
        description: "Official request for substitute sponsorship",
        whereToFile: "USCIS",
        notes: [
          "Required when original sponsor is deceased",
          "Must include proof of death",
          "Must show relationship to applicant",
        ],
      },
    ],
    8: [
      {
        name: "I-864 – Affidavit of Support",
        description: "Joint sponsor's form with household income",
        whereToFile: "USCIS",
        notes: [
          "Joint sponsor includes their household members",
          "Each household member signs I-864A",
          "Must prove household members live at same address",
        ],
      },
      {
        name: "I-864A – Contract for Each Household Member",
        description: "Joint sponsor's household contracts",
        whereToFile: "USCIS (file with I-864)",
        notes: [
          "Each contributing household member must sign",
          "Include their tax returns and proof of residence",
        ],
      },
    ],
    9: [
      {
        name: "I-864 – Affidavit of Support",
        description: "Asset-based sponsorship",
        whereToFile: "USCIS",
        notes: [
          "Use Form I-864 Supplement 3 for asset documentation",
          "Assets must be readily convertible to cash",
          "Include proof of ownership and value",
        ],
      },
      {
        name: "I-864 Supplement 3 – Identifying Information for Asset",
        description: "Asset documentation supplement",
        whereToFile: "USCIS (file with I-864)",
        notes: [
          "List all assets being used",
          "Provide valuation evidence",
          "Property must be free of liens",
        ],
      },
    ],
    10: [
      {
        name: "I-360 – Petition for Amerasian, Widow(er), or Special Immigrant",
        description: "Self-petition form",
        whereToFile: "USCIS",
        notes: [
          "No sponsor required for VAWA, widow, or special immigrant cases",
          "Include evidence of eligibility category",
          "Consult immigration attorney for specific requirements",
        ],
      },
      {
        name: "I-485 – Application to Register Permanent Residence",
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

  if ([2, 3, 4].includes(caseNumber)) return forms[1];
  return forms[caseNumber] ?? forms[1];
};
