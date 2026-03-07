// Document Personalization Rules Engine
// Determines required documents based on visa category and scenario flags

import {
  DocumentDefinition,
  VisaCategory,
  ScenarioFlags,
  DocumentVaultConfig,
  UploadedDocument,
} from "./types";
import { ALL_DOCUMENTS } from "./document-definitions";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Evaluates if a document is required based on visa category and scenario flags
 */
function isDocumentRequired(
  doc: DocumentDefinition,
  visaCategory: VisaCategory,
  scenarioFlags: ScenarioFlags,
): boolean {
  // If document has no conditional requirements, return its base required status
  if (!doc.requiredWhen) {
    return doc.required;
  }

  const { visaCategories, scenarioFlags: requiredFlags } = doc.requiredWhen;

  // Check visa category match
  if (visaCategories && visaCategories.length > 0) {
    if (!visaCategories.includes(visaCategory)) {
      return false; // Document not applicable to this visa category
    }
  }

  // Check scenario flags match
  if (requiredFlags) {
    const flagsMatch = Object.entries(requiredFlags).every(([flag, value]) => {
      return scenarioFlags[flag as keyof ScenarioFlags] === value;
    });

    if (!flagsMatch) {
      return false; // Scenario flags don't match
    }
  }

  // All conditions met
  return true;
}

/**
 * Generates personalized document list based on configuration
 */
export function generateRequiredDocuments(
  config: DocumentVaultConfig,
  includeOptional: boolean = true,
): DocumentDefinition[] {
  const { visaCategory, scenarioFlags } = config;

  // Filter documents based on requirements
  const requiredDocs = ALL_DOCUMENTS.filter((doc) =>
    isDocumentRequired(doc, visaCategory, scenarioFlags),
  );

  // If includeOptional is true, also add documents that are optional but applicable
  let finalDocs = requiredDocs;

  if (includeOptional) {
    const optionalDocs = ALL_DOCUMENTS.filter((doc) => {
      // Skip if already in requiredDocs
      if (requiredDocs.includes(doc)) return false;

      // Include if the document passes the requiredWhen check (it's applicable)
      // OR if it has no requiredWhen and is optional
      if (!doc.requiredWhen) {
        return true; // No restrictions, show all optional
      }

      // Check if document is applicable to this visa category/scenario
      const { visaCategories, scenarioFlags: requiredFlags } = doc.requiredWhen;

      // If visaCategories is set, only show if it matches
      if (visaCategories && visaCategories.length > 0) {
        if (!visaCategories.includes(visaCategory)) {
          return false;
        }
      }

      // If scenarioFlags are set, only show if they match
      if (requiredFlags) {
        const flagsMatch = Object.entries(requiredFlags).every(
          ([flag, value]) => {
            return scenarioFlags[flag as keyof ScenarioFlags] === value;
          },
        );
        if (!flagsMatch) {
          return false;
        }
      }

      return true;
    });

    finalDocs = [...requiredDocs, ...optionalDocs];
  }

  // Sort by category and then by name
  return finalDocs.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gets documents by category for a specific configuration
 */
export function getDocumentsByCategory(
  config: DocumentVaultConfig,
  includeOptional: boolean = true,
) {
  const requiredDocs = generateRequiredDocuments(config, includeOptional);

  const byCategory: Record<string, DocumentDefinition[]> = {};

  requiredDocs.forEach((doc) => {
    if (!byCategory[doc.category]) {
      byCategory[doc.category] = [];
    }
    byCategory[doc.category].push(doc);
  });

  return byCategory;
}

/**
 * Calculates document statistics
 */
export function calculateDocumentStats(
  requiredDocs: DocumentDefinition[],
  uploadedDocs: UploadedDocument[],
) {
  const mandatoryDocs = requiredDocs.filter((d) => d.required);
  const total = mandatoryDocs.length;

  const uploaded = mandatoryDocs.filter((md) =>
    uploadedDocs.some(
      (ud) =>
        ud.documentDefId === md.id &&
        (ud.status === "UPLOADED" || ud.status === "NEEDS_ATTENTION"),
    ),
  ).length;

  const missing = mandatoryDocs.filter(
    (md) => !uploadedDocs.some((ud) => ud.documentDefId === md.id),
  ).length;

  const expiring = uploadedDocs.filter(
    (d) => d.status === "NEEDS_ATTENTION",
  ).length;
  const expired = uploadedDocs.filter((d) => d.status === "EXPIRED").length;

  return {
    total,
    uploaded,
    missing,
    expiring,
    expired,
    percentComplete: total > 0 ? Math.round((uploaded / total) * 100) : 0,
  };
}

/**
 * Validates scenario flags for consistency
 */
export function validateScenarioFlags(flags: ScenarioFlags): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Example validation: if joint sponsor is used, at least one financial flag should be set
  if (flags.joint_sponsor_used) {
    // Joint sponsor requires their own I-864
    // This is just an example of validation logic
  }

  // Add more validation rules as needed

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Gets category display name
 */
export function getCategoryDisplayName(
  category: string,
  t?: TranslateFn,
): string {
  if (t) {
    const translated = t(`documentVaultPage.categories.${category}`);
    if (translated !== `documentVaultPage.categories.${category}`) {
      return translated;
    }
  }

  const names: Record<string, string> = {
    // Original categories
    CIVIL: "Civil Documents",
    FINANCIAL: "Financial / Sponsor Documents",
    RELATIONSHIP: "Relationship Evidence",
    POLICE: "Police / Court / Military",
    MEDICAL: "Medical Documents",
    PHOTOS: "Photographs",
    TRANSLATIONS: "Translations / Certifications",
    MISC: "Miscellaneous / Case Evidence",
    // New comprehensive categories
    EDUCATION: "Education Documents",
    WORK: "Work / Employment Documents",
    TRAVEL: "Travel Documents",
    IDENTITY: "Identity Documents",
    PROPERTY: "Property & Assets",
    IMMIGRATION: "Immigration History",
    TAX: "Tax Documents (Pakistan)",
    LEGAL: "Legal Documents",
    HEALTH_INSURANCE: "Health Insurance",
    SOCIAL_MEDIA: "Social Media",
    ADDRESS_PROOF: "Address Proof",
    OTHER: "Other Documents",
  };

  return names[category] || category;
}

/**
 * Gets visa category display name
 */
export function getVisaCategoryDisplayName(
  category: VisaCategory,
  t?: TranslateFn,
): string {
  if (t) {
    const translated = t(`documentVaultPage.visaCategories.${category}`);
    if (translated !== `documentVaultPage.visaCategories.${category}`) {
      // Return translated but keep the ID prefix if desired (e.g., "IR-1: ...")
      // In ur.json I already added IR-1: prefix to the translations
      return translated;
    }
  }

  const names: Record<VisaCategory, string> = {
    "IR-1": "IR-1: Immediate Relative - Spouse of U.S. Citizen",
    "CR-1": "CR-1: Conditional Resident - Spouse of U.S. Citizen",
    "IR-2": "IR-2: Immediate Relative - Unmarried Child under 21",
    "CR-2": "CR-2: Conditional Resident - Unmarried Child under 21",
    "IR-5": "IR-5: Immediate Relative - Parent of U.S. Citizen",
    F1: "F1: Unmarried Sons/Daughters of U.S. Citizens",
    F2A: "F2A: Spouses/Children of Lawful Permanent Residents",
    F2B: "F2B: Unmarried Sons/Daughters of LPR",
    F3: "F3: Married Sons/Daughters of U.S. Citizens",
    F4: "F4: Siblings of U.S. Citizens",
  };

  return names[category] || category;
}

/**
 * Determines if police certificate is required based on age and residency
 */
export function isPoliceCertificateRequired(beneficiaryAge: number): boolean {
  // Police certificate required if:
  // 1. Beneficiary is 16+ years old
  // 2. And lived in any country for 12+ months after age 16

  if (beneficiaryAge < 16) {
    return false;
  }

  // For simplicity, assuming if they lived in Pakistan (their current country)
  // In real implementation, you'd track time lived in each country
  return true;
}

/**
 * Gets document missing reasons (why is it required?)
 */
export function getDocumentRequirementReason(
  doc: DocumentDefinition,
  config: DocumentVaultConfig,
  t?: TranslateFn,
): string[] {
  const reasons: string[] = [];

  if (doc.required) {
    reasons.push(
      t
        ? t("documentVaultPage.logic.requirements.requiredForAll", {
            category: config.visaCategory,
          })
        : "Required for all " + config.visaCategory + " cases",
    );
  }

  if (doc.requiredWhen?.visaCategories) {
    reasons.push(
      (t
        ? t("documentVaultPage.logic.requirements.requiredForVisa")
        : "Required for visa categories: ") +
        doc.requiredWhen.visaCategories.join(", "),
    );
  }

  if (doc.requiredWhen?.scenarioFlags) {
    const flags = Object.entries(doc.requiredWhen.scenarioFlags);
    flags.forEach(([flag, value]) => {
      if (config.scenarioFlags[flag as keyof ScenarioFlags] === value) {
        reasons.push(
          (t
            ? t("documentVaultPage.logic.requirements.requiredBecause")
            : "Required because: ") + flag.replace(/_/g, " ").toLowerCase(),
        );
      }
    });
  }

  return reasons;
}
