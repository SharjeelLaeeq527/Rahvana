export type ProfileCaseType = "IR1" | "IR5" | "IR6" | "K1" | "CR1" | "OTHER" | string;
export type ProfileCaseStatus = "current" | "previous" | "future" | "active" | "past" | "planned";
export type ProfileCaseRole = "petitioner" | "beneficiary" | "sponsor" | "joint" | string;
export type ProfileSectionRelevance = "universal" | ProfileCaseType[];

export interface ProfileCaseContext {
  caseType?: ProfileCaseType;
  type?: ProfileCaseType;
  status?: ProfileCaseStatus;
  role?: ProfileCaseRole;
}

export interface ProfileSectionContext {
  hasAnyCase: boolean;
  hasIr1: boolean;
  hasIr5: boolean;
  cases: ProfileCaseContext[];
  activeCaseTypes?: ProfileCaseType[];
  hasSponsorData: boolean;
  hasRelationshipData: boolean;
}

export interface ProfileSectionDefinition {
  id: string;
  title: string;
  description: string;
  iconKey?: string;
  relevance?: ProfileSectionRelevance;
  visibleWhen?: (ctx: ProfileSectionContext) => boolean;
}

function normalizeCaseType(value?: string) {
  if (!value) return "";
  return value.toString().trim().toUpperCase().replace(/[-\s]/g, "");
}

function getCaseTypeValue(entry?: ProfileCaseContext) {
  const rawType = entry?.type ?? entry?.caseType;
  return normalizeCaseType(rawType ? String(rawType) : "");
}

function getActiveCaseTypes(ctx: ProfileSectionContext): ProfileCaseType[] {
  if (Array.isArray(ctx.activeCaseTypes) && ctx.activeCaseTypes.length > 0) {
    return ctx.activeCaseTypes
      .map((entry) => normalizeCaseType(String(entry)))
      .filter(Boolean) as ProfileCaseType[];
  }

  return ctx.cases
    .filter((entry) => {
      const status = String(entry.status ?? "").toLowerCase();
      return (
        status === "current" || status === "active" || status === "future" || status === "planned"
      );
    })
    .map((entry) => getCaseTypeValue(entry))
    .filter(Boolean) as ProfileCaseType[];
}

export const profileSectionDefinitions: ProfileSectionDefinition[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Your own details, name, birth, passport, and identifiers.",
    relevance: "universal",
    visibleWhen: () => true,
  },
  {
    id: "sponsor",
    title: "Sponsor",
    description: "The petitioner filing on your behalf, their details, not yours.",
    relevance: ["IR1", "CR1", "IR5", "K1"],
    visibleWhen: (ctx) =>
      ctx.hasSponsorData || ctx.hasAnyCase || getActiveCaseTypes(ctx).length > 0,
  },
  {
    id: "contact",
    title: "Contact & Address",
    description: "Your phone, current address, and mailing address.",
    relevance: "universal",
    visibleWhen: () => true,
  },
  {
    id: "family",
    title: "Family Background",
    description: "Your parents, names, birth details, and residence.",
    relevance: "universal",
    visibleWhen: () => true,
  },
  {
    id: "employment",
    title: "Employment & Education",
    description: "Your work history, income, and education.",
    relevance: "universal",
    visibleWhen: () => true,
  },
  {
    id: "immigration",
    title: "Immigration History",
    description: "Your travel and immigration record.",
    relevance: "universal",
    visibleWhen: () => true,
  },
  {
    id: "relationship",
    title: "Relationship Evidence",
    description: "Your marriage and relationship with the sponsor.",
    relevance: ["IR1", "CR1", "K1"],
    visibleWhen: (ctx) =>
      ctx.hasRelationshipData || ctx.hasAnyCase || getActiveCaseTypes(ctx).length > 0,
  },
  {
    id: "documents",
    title: "Documents",
    description: "The supporting documents you have ready.",
    relevance: "universal",
    visibleWhen: () => true,
  },
  {
    id: "affidavit",
    title: "Affidavit Support",
    description: "The sponsor's financial details for the Affidavit of Support.",
    relevance: ["IR1", "CR1", "IR5", "K1"],
    visibleWhen: (ctx) =>
      ctx.hasAnyCase || getActiveCaseTypes(ctx).length > 0 || ctx.hasSponsorData,
  },
  {
    id: "visaContext",
    title: "Case Details",
    description: "Background details for your case.",
    relevance: ["IR1", "CR1", "IR5", "K1"],
    visibleWhen: (ctx) => ctx.hasAnyCase || getActiveCaseTypes(ctx).length > 0,
  },
  {
    id: "visaEligibility",
    title: "Eligibility Details",
    description: "The eligibility details behind your case.",
    relevance: ["IR1", "CR1", "IR5", "K1"],
    visibleWhen: (ctx) => ctx.hasAnyCase || getActiveCaseTypes(ctx).length > 0,
  },
];

export function getVisibleProfileSections(ctx: ProfileSectionContext) {
  return profileSectionDefinitions.filter((section) => {
    if (section.relevance && section.relevance !== "universal") {
      const isRelevant = section.relevance.some((entry) =>
        getActiveCaseTypes(ctx).includes(normalizeCaseType(entry) as ProfileCaseType)
      );
      return isRelevant || (section.visibleWhen ? section.visibleWhen(ctx) : false);
    }

    if (!section.visibleWhen) return true;
    return section.visibleWhen(ctx);
  });
}