export type ProfileCaseType = "IR1" | "IR5" | "IR6" | "K1" | "OTHER" | string;
export type ProfileCaseStatus = "current" | "previous" | "future";
export type ProfileCaseRole = "petitioner" | "beneficiary" | "sponsor" | "joint" | string;

export interface ProfileCaseContext {
  caseType?: ProfileCaseType;
  status?: ProfileCaseStatus;
  role?: ProfileCaseRole;
}

export interface ProfileSectionContext {
  hasAnyCase: boolean;
  hasIr1: boolean;
  hasIr5: boolean;
  cases: ProfileCaseContext[];
  hasSponsorData: boolean;
  hasRelationshipData: boolean;
}

export interface ProfileSectionDefinition {
  id: string;
  title: string;
  description: string;
  badge?: string;
  iconKey?: string;
  visibleWhen?: (ctx: ProfileSectionContext) => boolean;
}

export const profileSectionDefinitions: ProfileSectionDefinition[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Tell us the basics about you so we can reuse them across your forms.",
    badge: "Profile",
    visibleWhen: () => true,
  },
  {
    id: "sponsor",
    title: "Sponsor",
    description: "Add sponsor details if you’re filing with a petitioner or sponsor involved.",
    badge: "Relevant",
    visibleWhen: (ctx) => ctx.hasSponsorData || ctx.hasAnyCase,
  },
  {
    id: "contact",
    title: "Contact & Address",
    description: "Share your mailing address and contact details so they’re ready when needed.",
    badge: "Profile",
    visibleWhen: () => true,
  },
  {
    id: "family",
    title: "Family Background",
    description: "Add family details that may help explain your household and relationships.",
    badge: "Profile",
    visibleWhen: () => true,
  },
  {
    id: "employment",
    title: "Employment & Education",
    description: "Include your work, income, and education details if they support your case.",
    badge: "Profile",
    visibleWhen: () => true,
  },
  {
    id: "immigration",
    title: "Immigration History",
    description: "Share your travel and immigration history if it helps explain your background.",
    badge: "Profile",
    visibleWhen: () => true,
  },
  {
    id: "relationship",
    title: "Relationship Details",
    description: "Add your relationship and marriage details if they’re relevant to your case.",
    badge: "Relevant",
    visibleWhen: (ctx) => ctx.hasRelationshipData || ctx.hasIr1 || ctx.hasIr5 || ctx.hasAnyCase,
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload and keep your supporting documents in one place.",
    badge: "Profile",
    visibleWhen: () => true,
  },
  {
    id: "affidavit",
    title: "Affidavit Support",
    description: "Add sponsor support details if your case requires financial support information.",
    badge: "Relevant",
    visibleWhen: (ctx) => ctx.hasIr1 || ctx.hasIr5 || ctx.hasAnyCase,
  },
  {
    id: "visaContext",
    title: "Case Details",
    description: "Add case context if you want to keep your active or past applications organized.",
    badge: "Relevant",
    visibleWhen: (ctx) => ctx.hasAnyCase,
  },
  {
    id: "visaEligibility",
    title: "Eligibility Details",
    description: "Review the eligibility details if you want to understand whether a pathway applies to you.",
    badge: "Relevant",
    visibleWhen: (ctx) => ctx.hasIr1 || ctx.hasIr5 || ctx.hasAnyCase,
  },
];

export function getVisibleProfileSections(ctx: ProfileSectionContext) {
  return profileSectionDefinitions.filter((section) => {
    if (!section.visibleWhen) return true;
    return section.visibleWhen(ctx);
  });
}
