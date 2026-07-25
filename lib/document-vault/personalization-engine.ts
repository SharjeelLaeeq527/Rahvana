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

export const DYNAMIC_CATEGORIES = [
  "PROPERTY",
  "RELATIONSHIP",
  "ADDRESS_PROOF",
  "EDUCATION",
  "WORK",
  "CIVIL",
  "MISC",
  "TRANSLATIONS",
  "CITIZENSHIP_PROOF",
  "OTHER",
];

export const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  PROPERTY: [
    "Bank Assets in Pakistan",
    "Investment Certificates",
    "NRA (Non-Resident Alien) Certificate",
    "Property ownership document (Deeds/Registry)",
    "Vehicle registration papers",
  ],
  RELATIONSHIP: [
    "Nikah Nama (Marriage Certificate)",
    "Wedding Photos",
    "Communication Evidence (Chat logs/Call records)",
    "Joint Bank Accounts or Assets",
    "Affidavits from friends/family",
  ],
  ADDRESS_PROOF: [
    "Utility Bills (Electricity/Gas/Water)",
    "Rent Agreement",
    "Property Tax Bills",
    "PO Box Address Proof",
  ],
  EDUCATION: [
    "Degree Certificates",
    "Transcripts / Mark Sheets",
    "Standardized Test Scores (IELTS/TOEFL/SAT)",
    "School Leaving Certificates",
  ],
  WORK: [
    "Experience Letters from previous employers",
    "Current Employment Contracts",
    "Salary Slips (Recent 3-6 months)",
    "NOC (No Objection Certificate)",
  ],
  CITIZENSHIP_PROOF: [
    "U.S. passport",
    "U.S. birth certificate",
    "Certificate of Naturalization (Form N-550)",
    "Certificate of Citizenship (Form N-560)",
    "Consular Report of Birth Abroad (Form FS-240 / DS-1350)",
  ],
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Evaluates if a document is required based on visa category and scenario flags
 */
function isDocumentRequired(
  doc: DocumentDefinition,
  visaCategory: VisaCategory,
  scenarioFlags: ScenarioFlags
): boolean {
  // If applicableVisas is defined, check if current visa is in the list
  if (doc.applicableVisas && doc.applicableVisas.length > 0) {
    if (!doc.applicableVisas.includes(visaCategory)) {
      return false; // Document explicitly not for this visa
    }
  }

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
  uploadedDocuments: UploadedDocument[] = []
): DocumentDefinition[] {
  const { visaCategory, scenarioFlags } = config;
  const uploadedDocIds = uploadedDocuments.map((d) => d.documentDefId);

  // Helper to dynamically determine the appropriate roles for a category based on the static templates
  const getCategoryRoles = (cat: string): DocumentRole[] => {
    if (cat === "CITIZENSHIP_PROOF") {
      return ["PETITIONER"];
    }
    const catDocs = ALL_DOCUMENTS.filter((d) => d.category === cat);
    if (catDocs.length > 0) {
      const petitionerCount = catDocs.filter((d) => d.roles?.includes("PETITIONER")).length;
      const beneficiaryCount = catDocs.filter((d) => d.roles?.includes("BENEFICIARY")).length;
      if (petitionerCount > beneficiaryCount) {
        return ["PETITIONER"];
      } else if (petitionerCount > 0 && beneficiaryCount > 0) {
        return ["BENEFICIARY", "PETITIONER"];
      }
    }
    return ["BENEFICIARY"];
  };

  const sponsorBaseIds = [
    "joint-i864",
    "joint-tax-returns",
    "joint-w2",
    "joint-employment-letter",
    "joint-pay-stubs",
    "joint-assets",
    "joint-citizenship-proof",
    "i-864a-contract",
    "household-member-income",
    "household-member-residence",
    "hh-marriage",
    "hh-id",
    "hh-birth",
    "hh-family-link"
  ];

  // Filter documents based on requirements
  let requiredDocs = ALL_DOCUMENTS.filter((doc) => {
    if (sponsorBaseIds.includes(doc.id)) {
      return false; // Skip base templates; will expand dynamically below
    }
    // Some categories are dynamic BUT should still keep their static definitions
    // (e.g., CIVIL has Nikah Nama, MISC has generic docs, etc.)
    const keepStatic = ["CIVIL", "MISC", "TRANSLATIONS", "CITIZENSHIP_PROOF"];
    if (DYNAMIC_CATEGORIES.includes(doc.category) && !keepStatic.includes(doc.category)) {
      return false;
    }
    return isDocumentRequired(doc, visaCategory, scenarioFlags);
  });

  // Helper to expand a base document with suffix and new display name
  const expandSponsorDoc = (baseDocId: string, suffix: string, name: string): DocumentDefinition | null => {
    const baseDoc = ALL_DOCUMENTS.find((d) => d.id === baseDocId);
    if (!baseDoc) return null;
    return {
      ...baseDoc,
      id: `${baseDoc.id}${suffix}`,
      name,
    };
  };

  // Dynamically generate Joint Sponsor documents if used
  if (scenarioFlags.joint_sponsor_used) {
    const jsCount = Math.max(1, Number(scenarioFlags.jsCount || 1));
    for (let i = 1; i <= jsCount; i++) {
      const label = `Joint Sponsor ${i}`;
      const suffix = `-joint-sponsor-${i}`;

      const jsDocs = [
        expandSponsorDoc("joint-i864", suffix, `Form I-864 — ${label}`),
        expandSponsorDoc("joint-tax-returns", suffix, `Most Recent IRS Tax Transcript — ${label}`),
        expandSponsorDoc("joint-w2", suffix, `W-2, 1099, and Relevant Tax Schedules — ${label}`),
        expandSponsorDoc("joint-employment-letter", suffix, `Employment Verification Letter — ${label}`),
        expandSponsorDoc("joint-pay-stubs", suffix, `Current Pay Records — ${label}`),
        expandSponsorDoc("joint-assets", suffix, `Asset Evidence — ${label}`),
        expandSponsorDoc("joint-citizenship-proof", suffix, `Proof of U.S. Status — ${label}`),
        expandSponsorDoc("organized-income-packet", suffix, `Organized Income Packet — ${label}`),
      ];

      jsDocs.forEach((doc) => {
        if (doc) requiredDocs.push(doc);
      });
    }
  }

  // Dynamically generate Household Member documents if used
  if (scenarioFlags.household_member_used) {
    const hhCount = Math.max(1, Number(scenarioFlags.hhCount || 1));
    const rels = (scenarioFlags.hhRelationships as Record<string, string>) || {};

    for (let i = 1; i <= hhCount; i++) {
      const label = `Household Member ${i}`;
      const suffix = `-household-member-${i}`;
      const relationship = rels[i] || rels[String(i)] || "other-hh";

      const hmDocs = [
        expandSponsorDoc("i-864a-contract", suffix, `Form I-864A (Household Member Contract) — ${label}`),
        expandSponsorDoc("household-member-income", suffix, `Proof of Household Member Income — ${label}`),
        expandSponsorDoc("household-member-residence", suffix, `Proof of Shared Residence — ${label}`),
      ];

      if (relationship === "spouse") {
        hmDocs.push(expandSponsorDoc("hh-marriage", suffix, `Marriage Certificate — ${label}`));
        hmDocs.push(expandSponsorDoc("hh-id", suffix, `Identity Document — ${label}`));
      } else if (relationship === "child") {
        hmDocs.push(expandSponsorDoc("hh-birth", suffix, `Birth Certificate — ${label}`));
        hmDocs.push(expandSponsorDoc("hh-id", suffix, `Identity Document — ${label}`));
      } else if (relationship === "parent") {
        hmDocs.push(expandSponsorDoc("hh-id", suffix, `Identity Document — ${label}`));
        const petBirth = ALL_DOCUMENTS.find((d) => d.id === "birth-cert-petitioner");
        if (petBirth && !requiredDocs.some((d) => d.id === petBirth.id)) {
          requiredDocs.push(petBirth);
        }
      } else if (relationship === "sibling") {
        hmDocs.push(expandSponsorDoc("hh-birth", suffix, `Birth Certificate — ${label}`));
        hmDocs.push(expandSponsorDoc("hh-id", suffix, `Identity Document — ${label}`));
        const petBirth = ALL_DOCUMENTS.find((d) => d.id === "birth-cert-petitioner");
        if (petBirth && !requiredDocs.some((d) => d.id === petBirth.id)) {
          requiredDocs.push(petBirth);
        }
      } else {
        hmDocs.push(expandSponsorDoc("hh-family-link", suffix, `Supporting Family-Link Evidence — ${label}`));
        hmDocs.push(expandSponsorDoc("hh-id", suffix, `Identity Document — ${label}`));
      }

      hmDocs.forEach((doc) => {
        if (doc) requiredDocs.push(doc);
      });
    }
  }

  // Add dynamic documents from config
  DYNAMIC_CATEGORIES.forEach((category) => {
    const slots = config.dynamicDocuments?.[category] || [];
    const rolesForCategory = getCategoryRoles(category);

    if (slots.length === 0) {
      // Don't show default slot for these categories to keep it clean
      if (["CIVIL", "MISC", "TRANSLATIONS", "OTHER"].includes(category)) return;

      // Default first slot if none exist
      const displayName = getCategoryDisplayName(category);
      // Remove "Documents" or "Evidence" from suffix for cleaner naming if exists
      const baseName = displayName.replace(/ (Documents|Evidence)$/, "");

      requiredDocs.push({
        id: `dynamic-${category}-1`,
        key: `DYNAMIC_${category}_1`,
        name: `${baseName} Document (1)`,
        description: `User-added ${category.toLowerCase()} document`,
        category: category as any,
        roles: rolesForCategory,
        stages: ["NVC", "INTERVIEW"],
        required: false, // Per user feedback: not required
        multipleFilesAllowed: true,
        validityType: "none",
      });
    } else {
      const seenNames = new Set<string>();
      slots.forEach((slot, index) => {
        const normalizedName = slot.name.trim().toLowerCase();
        if (seenNames.has(normalizedName)) return; // Skip duplicates
        seenNames.add(normalizedName);

        requiredDocs.push({
          id: slot.id,
          key: `DYNAMIC_${category}_${index + 1}`,
          name: slot.name,
          description: `User-added ${category.toLowerCase()} document`,
          category: category as any,
          roles: rolesForCategory,
          stages: ["NVC", "INTERVIEW"],
          required: false,
          multipleFilesAllowed: true,
          validityType: "none",
        });
      });
    }
  });

  // SAFETY NET: Recover missing rows from orphans (ANY doc uploaded but missing from the requirement list)
  const seenSafetyNetNames = new Set<string>();

  uploadedDocuments.forEach((doc) => {
    if (!doc || !doc.documentDefId) return;

    // Check if this document's definition ID is already represented in our required list
    const exists = requiredDocs.some((d) => d.id === doc.documentDefId);

    if (!exists) {
      const staticDef = ALL_DOCUMENTS.find((d) => d.id === doc.documentDefId);
      let category = "MISC";
      if (staticDef) {
        category = staticDef.category;
      } else if (doc.documentDefId.startsWith("dynamic-")) {
        const parts = doc.documentDefId.split("-");
        category = parts.length >= 2 ? parts[1] : "MISC";
      }

      // Try to get a clean name from the notes
      let recoveredName = "";
      if (doc.notes?.startsWith("Type: ")) {
        recoveredName = doc.notes.split("\n")[0].replace("Type: ", "").trim();
      }

      // If no specific name, use the definition name or category
      if (!recoveredName) {
        if (staticDef) {
          recoveredName = staticDef.name;
        } else {
          recoveredName = getCategoryDisplayName(category).replace(/ (Documents|Evidence)$/, "");
        }
      }

      // DEDUPLICATION: Only add one row per name in the safety net
      const normalizedName = recoveredName.toLowerCase().trim();
      if (seenSafetyNetNames.has(normalizedName)) return;
      seenSafetyNetNames.add(normalizedName);

      // Check if a requirement with this name already exists (perhaps under a different ID)
      const nameExists = requiredDocs.some((d) => d.name.toLowerCase().trim() === normalizedName);
      if (nameExists) return;

      const rolesForCategory = getCategoryRoles(category);

      requiredDocs.push({
        id: doc.documentDefId,
        key: `RECOVERED_${normalizedName.replace(/[^a-z0-9]/g, "_")}`,
        name: recoveredName,
        description: `Previously uploaded document`,
        category: category as any,
        roles: rolesForCategory,
        stages: ["NVC", "INTERVIEW"],
        required: false,
        multipleFilesAllowed: true,
        validityType: "none",
      });
    }
  });

  // If includeOptional is true, also add documents that are optional but applicable
  let finalDocs = requiredDocs;

  if (includeOptional) {
    const optionalDocs = ALL_DOCUMENTS.filter((doc) => {
      // Skip if already in requiredDocs or if it's a base template
      if (requiredDocs.includes(doc) || sponsorBaseIds.includes(doc.id)) return false;

      // Check applicableVisas first
      if (doc.applicableVisas && doc.applicableVisas.length > 0) {
        if (!doc.applicableVisas.includes(visaCategory)) {
          return false;
        }
      }

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
        const flagsMatch = Object.entries(requiredFlags).every(([flag, value]) => {
          return scenarioFlags[flag as keyof ScenarioFlags] === value;
        });
        if (!flagsMatch) {
          return false;
        }
      }

      return true;
    });

    finalDocs = [...requiredDocs, ...optionalDocs];
  }

  // Ensure documents that have been uploaded are ALWAYS present, even if their scenario flag wasn't set!
  if (uploadedDocIds.length > 0) {
    const forcedUploadDocs = ALL_DOCUMENTS.filter(
      (doc) => uploadedDocIds.includes(doc.id) && !finalDocs.includes(doc) && !sponsorBaseIds.includes(doc.id)
    );
    finalDocs = [...finalDocs, ...forcedUploadDocs];
  }

  // Filter out documents that should be hidden until uploaded
  finalDocs = finalDocs.filter((doc) => {
    if (doc.hideUntilUploaded) {
      return uploadedDocIds.includes(doc.id);
    }
    return true;
  });

  // FINAL CLEANUP: If we have a named row and a generic placeholder for the same type,
  // remove the generic placeholder (e.g., "Proof of U.S. Citizenship Document (1)" is redundant if we have "Certificate of Naturalization")
  const namedRequirementCategories = new Set<string>();
  finalDocs.forEach((d) => {
    if (!d.name.includes(" Document (") && !d.name.includes(" Evidence (")) {
      namedRequirementCategories.add(`${d.category}-${d.name.toLowerCase().trim()}`);
    }
  });

  // Also look at uploaded docs to see what names we have
  uploadedDocuments.forEach((ud) => {
    if (ud.notes?.startsWith("Type: ")) {
      const type = ud.notes.split("\n")[0].replace("Type: ", "").trim().toLowerCase();
      // Use the logic from the engine to determine which category it belongs to
      const staticDef = ALL_DOCUMENTS.find((d) => d.id === ud.documentDefId);
      let category = "MISC";
      if (staticDef) {
        category = staticDef.category;
      } else if (ud.documentDefId.startsWith("dynamic-")) {
        const parts = ud.documentDefId.split("-");
        category = parts.length >= 2 ? parts[1] : "MISC";
      }
      namedRequirementCategories.add(`${category}-${type}`);
    }
  });

  finalDocs = finalDocs.filter((d) => {
    const isGeneric = d.name.includes(" Document (") || d.name.includes(" Evidence (");
    if (!isGeneric) return true;

    // Check if there's any named version of this category's docs uploaded
    const baseName = d.name.split(" Document (")[0].split(" Evidence (")[0].toLowerCase().trim();

    const hasNamedMatch = Array.from(namedRequirementCategories).some(
      (nc) => nc.startsWith(d.category) && nc.includes(baseName)
    );
    return !hasNamedMatch;
  });

  // Apply visa-specific overrides to document names for consistency with journey steps
  finalDocs = finalDocs.map((doc) => {
    let customName = doc.name;

    if (visaCategory === "IR-5") {
      const ir5Map: Record<string, string> = {
        "passport-beneficiary": "Parent Beneficiary Passport Biographic Page",
        "birth-cert-beneficiary": "Parent Beneficiary Birth Certificate",
        "birth-cert-petitioner": "Petitioner's Birth Certificate",
        "police-certificate-pakistan": "Police Certificate",
        "parent-mrc": "Parent Beneficiary Marriage Certificate",
        "parent-mrc-translation": "Translated Parent Beneficiary Marriage Certificate",
        "divorce-decree-beneficiary": "Prior Marriage Termination Documents",
        "death-cert-prior-spouse": "Death Certificate of Former Spouse",
        "father-child-bona-fide": "Father-Child Relationship Evidence",
        "stepparent-marriage-cert": "Stepparent Relationship Records",
        "adoption-decree": "Adoption, Legal Custody, and Joint Residence Records",
        "name-change-proof": "Name Change or Identity Discrepancy Documents",
        "court-records": "Court and Prison Records",
        "military-records": "Military or Service Records",
        "certified-translations": "Certified English Translations",
        "missing-document-evidence": "Missing Document / Record Unavailability Evidence",
        "relationship-evidence-backup": "IR-5 Relationship Evidence Backup Set",
        "organized-translation-set": "Organized Translation Set",
        "upload-ready-copies": "Upload-Ready File Copies",
        "interview-originals": "Interview Originals and Certified Copies Set",
        
        // Petitioner financial templates
        "i864-affidavit": "Form I-864 Affidavit of Support - Petitioner",
        "tax-returns-petitioner": "Most Recent IRS Tax Transcript or Complete Federal Tax Return - Petitioner",
        "w2-forms": "W-2, 1099, and Relevant Tax Schedules (if applicable)",
        "pay-stubs": "Current Pay Stubs and Employment Verification Letter (if current income must be documented)",
        "domicile-proof-petitioner": "Proof of U.S. Domicile - Petitioner",
        "citizenship-proof-petitioner": "U.S. Passport, Birth Certificate, Naturalization Certificate, or Citizenship Certificate (Petitioner)",
      };
      if (ir5Map[doc.id]) {
        customName = ir5Map[doc.id];
      }
    } else if (visaCategory === "IR-1" || visaCategory === "CR-1") {
      const ir1Map: Record<string, string> = {
        "passport-beneficiary": "Beneficiary Passport",
        "birth-cert-beneficiary": "Birth Certificate",
        // "birth-cert-petitioner": "Birth Certificate of Petitioner",
        "police-certificate-pakistan": "Police Character Certificate",
        "nadra-mrc": "NADRA Marriage Certificate",
        "nikah-nama": "Nikah Nama (Original)",
        "divorce-decree-beneficiary": "Prior Marriage Termination Proof",
        "death-cert-prior-spouse": "Death Certificate of Former Spouse",
        "certified-translations": "Translations",
        "passport-photos": "Passport Photos",
        "i864-affidavit": "Form I-864 Affidavit of Support - Petitioner",
        "tax-returns-petitioner": "Federal Tax Returns (Past 3 Years)",
        "w2-forms": "W-2 Forms",
        "pay-stubs": "Employment Letter & Pay Stubs",
        "domicile-proof-petitioner": "Proof of U.S. Domicile",
        "citizenship-proof-petitioner": "Proof of U.S. Citizenship",
      };
      if (ir1Map[doc.id]) {
        customName = ir1Map[doc.id];
      }
    }

    if (customName === doc.name) {
      return doc;
    }
    return {
      ...doc,
      name: customName,
    };
  });

  // FINAL DEDUPLICATION: Ensure no two rows share the same name in the same category
  const seenFinalNames = new Set<string>();
  finalDocs = finalDocs.filter((doc) => {
    const key = `${doc.category}-${doc.name.trim().toLowerCase()}`;
    if (seenFinalNames.has(key)) return false;
    seenFinalNames.add(key);
    return true;
  });

  // Sort by category and then by name
  return finalDocs.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }

    // Special logic for translations: place them immediately after the original
    const getSortName = (doc: DocumentDefinition) => {
      if (doc.translationOf) {
        const original = ALL_DOCUMENTS.find((d) => d.id === doc.translationOf);
        if (original) {
          return `${original.name} - Translation`;
        }
      }
      return doc.name;
    };

    const nameA = getSortName(a);
    const nameB = getSortName(b);

    return nameA.localeCompare(nameB);
  });
}

/**
 * Gets documents by category for a specific configuration
 */
export function getDocumentsByCategory(
  config: DocumentVaultConfig,
  includeOptional: boolean = true,
  uploadedDocuments: UploadedDocument[] = []
) {
  const requiredDocs = generateRequiredDocuments(config, includeOptional, uploadedDocuments);

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
  uploadedDocs: UploadedDocument[]
) {
  const mandatoryDocs = requiredDocs.filter((d) => d.required);
  const total = mandatoryDocs.length;

  const uploaded = mandatoryDocs.filter((md) =>
    uploadedDocs.some(
      (ud) =>
        ud.documentDefId === md.id && (ud.status === "UPLOADED" || ud.status === "NEEDS_ATTENTION")
    )
  ).length;

  const missing = mandatoryDocs.filter(
    (md) => !uploadedDocs.some((ud) => ud.documentDefId === md.id)
  ).length;

  const expiring = uploadedDocs.filter((d) => d.status === "NEEDS_ATTENTION").length;
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
export function getCategoryDisplayName(category: string, t?: TranslateFn): string {
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
    CITIZENSHIP_PROOF: "Proof of U.S. Citizenship",
    OTHER: "Other Documents",
  };

  return names[category] || category;
}

/**
 * Gets visa category display name
 */
export function getVisaCategoryDisplayName(category: VisaCategory, t?: TranslateFn): string {
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
    // F1: "F1: Unmarried Sons/Daughters of U.S. Citizens",
    "F-1 Student Visa": "F-1 Student Visa",
    "Australia Student Visa (Subclass 500)": "Australia Student Visa (Subclass 500)",
    "China Student Visa (X1 & X2)": "China Student Visa (X1 & X2)",
    // F2A: "F2A: Spouses/Children of Lawful Permanent Residents",
    // F2B: "F2B: Unmarried Sons/Daughters of LPR",
    // F3: "F3: Married Sons/Daughters of U.S. Citizens",
    // F4: "F4: Siblings of U.S. Citizens",
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
  t?: TranslateFn
): string[] {
  const reasons: string[] = [];

  if (doc.required) {
    reasons.push(
      t
        ? t("documentVaultPage.logic.requirements.requiredForAll", {
            category: config.visaCategory,
          })
        : "Required for all " + config.visaCategory + " cases"
    );
  }

  if (doc.requiredWhen?.visaCategories) {
    reasons.push(
      (t
        ? t("documentVaultPage.logic.requirements.requiredForVisa")
        : "Required for visa categories: ") + doc.requiredWhen.visaCategories.join(", ")
    );
  }

  if (doc.requiredWhen?.scenarioFlags) {
    const flags = Object.entries(doc.requiredWhen.scenarioFlags);
    flags.forEach(([flag, value]) => {
      if (config.scenarioFlags[flag as keyof ScenarioFlags] === value) {
        reasons.push(
          (t ? t("documentVaultPage.logic.requirements.requiredBecause") : "Required because: ") +
            flag.replace(/_/g, " ").toLowerCase()
        );
      }
    });
  }

  return reasons;
}
