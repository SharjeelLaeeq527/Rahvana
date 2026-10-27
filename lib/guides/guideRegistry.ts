import { VisaCategory } from "@/lib/document-vault/types";

export type GuideCategory = "Pakistan Document" | "Medical & Exam" | "Relationship & Eligibility";

export type GuideIconName =
  | "Globe"
  | "Shield"
  | "FileText"
  | "Heart"
  | "Syringe"
  | "BookOpen"
  | "Users";

export interface GuideMetadata {
  /** Unique guide identifier (e.g., 'passport', 'marriage-certificate') */
  id: string;
  /** Catalog resource identifier matching wallet catalog (e.g., 'guide-passport') */
  resourceId: string;
  /** Route slug identifier (e.g., 'passport-guide') */
  slug: string;
  /** Display title */
  title: string;
  subtitle?: string;
  description: string;
  category: GuideCategory;
  /** Relative URL path */
  href: string;
  /** Lucide icon name */
  iconName: GuideIconName;
  /** Entitlement feature key for plan access rules (e.g., 'guide_passport') */
  entitlementFeature?: string;
  /** Minimum tier required in the mapped journey to unlock (default: 'premium') */
  minJourneyTier?: "free" | "basic" | "premium" | "executive";
  /**
   * Declarative array of Visa Categories this guide belongs to.
   * If a user owns a Premium/Executive plan in ANY of these categories,
   * the guide is accessible in both journey and standalone environments.
   * Use '*' or 'ALL' for universal guides.
   */
  visaCategories: (VisaCategory | "*" | "ALL" | string)[];
  /** Whether the guide is available for purchase with wallet credits (default: true) */
  creditPayable?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
}

/**
 * Single source of truth for all Guides and their Visa Category mappings.
 *
 * Scalability:
 * To map a guide to a new journey (e.g. K-1, EB-1, F-4), simply add the
 * visa category string to the `visaCategories` array of that guide.
 */
export const GUIDE_REGISTRY: GuideMetadata[] = [
  {
    id: "passport",
    resourceId: "guide-passport",
    slug: "passport-guide",
    title: "Passport",
    subtitle: "",
    description:
      "DGIP roadmap for MRP and ePassport applications, renewals, and lost or damaged cases.",
    category: "Pakistan Document",
    href: "/guides/passport-guide",
    iconName: "Globe",
    entitlementFeature: "guide_passport",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1", "IR-2", "CR-2", "IR-5", "F-1 Student Visa"],
    creditPayable: true,
  },
  {
    id: "police-verification",
    resourceId: "guide-police",
    slug: "police-verification-guide",
    title: "Police Character Certificate",
    subtitle: "",
    description:
      "Province-wise PCC workflow with required documents, fee tiers, and verification steps.",
    category: "Pakistan Document",
    href: "/guides/police-verification-guide",
    iconName: "Shield",
    entitlementFeature: "guide_police",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1", "IR-2", "CR-2", "IR-5"],
    creditPayable: true,
  },
  {
    id: "cnic",
    resourceId: "guide-cnic",
    slug: "cnic-guide",
    title: "CNIC",
    subtitle: "Computerized National Identity Card",
    description:
      "NADRA CNIC workflow for new issuance, corrections, and replacement or renewal applications.",
    category: "Pakistan Document",
    href: "/guides/cnic-guide",
    iconName: "FileText",
    entitlementFeature: "guide_cnic",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1", "IR-2", "CR-2", "IR-5"],
    creditPayable: true,
  },
  {
    id: "birth-certificate",
    resourceId: "guide-birth-cert",
    slug: "birth-certificate-guide",
    title: "Birth Certificate",
    subtitle: "",
    description: "Union Council CBRC process for birth registration, correction, and replacement",
    category: "Pakistan Document",
    href: "/guides/birth-certificate-guide",
    iconName: "FileText",
    entitlementFeature: "guide_birth_cert",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1", "IR-2", "CR-2", "IR-5"],
    creditPayable: true,
  },
  {
    id: "frc",
    resourceId: "guide-frc",
    slug: "frc-guide",
    title: "FRC",
    subtitle: "NADRA Family Registration Certificate",
    description: "NADRA process to apply for an FRC and review registered family details.",
    category: "Pakistan Document",
    href: "/guides/frc-guide",
    iconName: "Globe",
    entitlementFeature: "guide_frc",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1", "IR-5"],
    creditPayable: true,
  },
  {
    id: "marriage-certificate",
    resourceId: "guide-nikah-nama",
    slug: "nikah-nama-guide",
    title: "Marriage Registration",
    subtitle: "",
    description:
      "Nikah Nama registration through Union Council and NADRA MRC issuance with attestation pathway.",
    category: "Pakistan Document",
    href: "/guides/nikah-nama-guide",
    iconName: "Heart",
    entitlementFeature: "guide_nikah_nama",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1"],
    creditPayable: true,
  },
  {
    id: "vaccinations",
    resourceId: "guide-polio",
    slug: "polio-vaccination-guide",
    title: "Polio Vaccination",
    subtitle: "",
    description: "Polio vaccination workflow with NIMS entry and travel certificate issuance.",
    category: "Medical & Exam",
    href: "/guides/polio-vaccination-guide",
    iconName: "Syringe",
    entitlementFeature: "polio_certificate",
    minJourneyTier: "premium",
    visaCategories: ["IR-1", "CR-1", "IR-2", "CR-2", "IR-5"],
    creditPayable: true,
  },
  {
    id: "step-parent",
    resourceId: "guide-step-parent",
    slug: "step-parent-guide",
    title: "Step-Parent",
    subtitle: "USCIS Eligibility & Document Compilation",
    description:
      "USCIS roadmap for sponsoring step-parents, marriage rules, and document requirements.",
    category: "Pakistan Document",
    href: "/guides/step-parent-guide",
    iconName: "BookOpen",
    minJourneyTier: "free",
    visaCategories: ["IR-5"],
    creditPayable: false,
  },
  {
    id: "adoptive-parent",
    resourceId: "guide-adoption",
    slug: "adoptive-parent-guide",
    title: "Adoptive Parent & Guardianship",
    subtitle: "USCIS Eligibility & Document Requirements",
    description:
      "USCIS adoption criteria, 2-year custody rule, and legal guardianship vs. U.S. adoption.",
    category: "Pakistan Document",
    href: "/guides/adoptive-parent-guide",
    iconName: "BookOpen",
    minJourneyTier: "free",
    visaCategories: ["IR-5"],
    creditPayable: false,
  },
];

/** Lookup map by id */
const GUIDES_BY_ID = new Map<string, GuideMetadata>(
  GUIDE_REGISTRY.map((g) => [g.id, g])
);

/** Lookup map by resourceId */
const GUIDES_BY_RESOURCE_ID = new Map<string, GuideMetadata>(
  GUIDE_REGISTRY.map((g) => [g.resourceId, g])
);

/** Lookup map by slug */
const GUIDES_BY_SLUG = new Map<string, GuideMetadata>(
  GUIDE_REGISTRY.map((g) => [g.slug, g])
);

/** Lookup map by href */
const GUIDES_BY_HREF = new Map<string, GuideMetadata>(
  GUIDE_REGISTRY.map((g) => [g.href, g])
);

/** Returns all registered guides */
export function getAllGuides(): GuideMetadata[] {
  return GUIDE_REGISTRY;
}

/** Finds a guide by its unique id (e.g. 'passport', 'marriage-certificate') */
export function getGuideById(id: string): GuideMetadata | undefined {
  return GUIDES_BY_ID.get(id);
}

/** Finds a guide by its catalog resourceId (e.g. 'guide-passport', 'guide-nikah-nama') */
export function getGuideByResourceId(resourceId: string): GuideMetadata | undefined {
  return GUIDES_BY_RESOURCE_ID.get(resourceId);
}

/** Finds a guide by its URL slug (e.g. 'passport-guide', 'nikah-nama-guide') */
export function getGuideBySlug(slug: string): GuideMetadata | undefined {
  return GUIDES_BY_SLUG.get(slug);
}

/** Finds a guide by its href (e.g. '/guides/passport-guide') */
export function getGuideByHref(href: string): GuideMetadata | undefined {
  const cleanHref = href.split("?")[0];
  return GUIDES_BY_HREF.get(cleanHref);
}

/**
 * Checks if a guide is mapped/relevant to a specific visa category.
 */
export function isGuideRelevantToVisaCategory(
  guide: GuideMetadata,
  category?: string | null
): boolean {
  if (!category) return false;
  const normalized = category.trim().toUpperCase();
  return guide.visaCategories.some((cat) => {
    if (cat === "*" || cat === "ALL") return true;
    return cat.trim().toUpperCase() === normalized;
  });
}

/**
 * Returns all guides that apply to a specific visa category (e.g. 'IR-1', 'IR-5').
 */
export function getGuidesForVisaCategory(category?: string | null): GuideMetadata[] {
  if (!category) return [];
  return GUIDE_REGISTRY.filter((g) => isGuideRelevantToVisaCategory(g, category));
}
