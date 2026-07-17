import { ALL_DOCUMENTS } from "./document-definitions";
import { VisaCategory } from "./types";

/**
 * Check whether any vault document matches a journey doc item,
 * considering dynamic-category parents.
 *
 * When a parent doc (e.g. "Proof of U.S. Citizenship") has `isDynamicCategory: true`,
 * the MultipleDocumentUploadModal stores uploads under the sub-type's mapped ID
 * (e.g. "passport-petitioner" for "U.S. passport") or a dynamic slot ID.
 * A simple `documentDefId === vaultId` check would miss those.
 */
export function isDocUploadedInVault(
  docName: string,
  mappedId: string,
  uploadedDocs: { documentDefId: string }[]
): boolean {
  // 1. Direct exact match
  if (uploadedDocs.some((d) => d.documentDefId === mappedId)) return true;

  // 2. Check if the mapped ID is a dynamic-category parent
  const parentDef = ALL_DOCUMENTS.find((d) => d.id === mappedId);
  if (!parentDef?.isDynamicCategory) return false;

  const parentCategory = (parentDef as any).category as string | undefined;

  // 3. Check sub-type mapped IDs from suggestions
  if (parentDef.suggestions) {
    for (const opt of parentDef.suggestions) {
      const subId = mapDocumentNameToId(opt);
      if (subId !== mappedId && subId !== "misc-document") {
        if (uploadedDocs.some((d) => d.documentDefId === subId)) return true;
      }
    }
  }

  // 4. Check dynamic slot IDs (pattern: dynamic-{CATEGORY}-{slug})
  // If ANY doc exists under this parent's category, it counts as uploaded.
  // The parent name (e.g. "Relationship Evidence") won't match individual
  // slot slugs (e.g. "communication-history"), so we match by category alone.
  if (parentCategory) {
    if (uploadedDocs.some((d) => d.documentDefId.startsWith(`dynamic-${parentCategory}-`))) {
      return true;
    }
  }

  return false;
}

/**
 * Maps common document names from journey JSONs to document tool definition IDs
 */
export function mapDocumentNameToId(name: string): string {
  const normalized = name.toLowerCase().trim();

  // Simple hardcoded mapping for common ones
  const mapping: Record<string, string> = {
    // Stage II (NVC) Specific Mappings
    "beneficiary passport biographic page": "passport-beneficiary",
    "marriage certificate / marriage registration record": "nadra-mrc",
    "pakistan police character certificate (pcc)": "police-certificate-pakistan",
    "death certificate of former spouse": "death-cert-prior-spouse",
    "name change documents": "name-change-proof",
    "missing document / record unavailability evidence": "missing-document-evidence",
    "organized translation set": "organized-translation-set",
    "upload-ready file copies": "upload-ready-copies",
    "relationship evidence backup set": "relationship-evidence-backup",
    "prior marriage termination documents": "divorce-decree-beneficiary",
    "interview letter": "interview-letter",
    "sealed medical envelope": "medical-results-envelope",

    // Parent / IR-5 Specific Mappings
    "petitioner's birth certificate": "birth-cert-petitioner",
    "parent identity and name-match evidence": "parent-identity-match",
    "parents' marriage certificate": "parents-marriage-cert",
    "evidence of a bona fide father-child relationship": "father-child-bona-fide",
    "marriage certificate creating the step-relationship": "stepparent-marriage-cert",
    "termination of prior marriages for step-relationship": "stepparent-prior-marriages",
    "final adoption decree": "adoption-decree",
    "legal custody and joint residence evidence": "adoption-custody-residence",
    "secondary parent-child relationship evidence": "secondary-relationship-evidence",
    "record unavailability evidence": "record-unavailability-evidence",
    "parent's marriage and prior-marriage records": "parent-marriage-history",

    // Exact matches from IR-1 journey JSON (lowercased for matching)
    "proof of u.s. citizenship": "citizenship-proof-petitioner",
    "beneficiary passport": "passport-beneficiary",
    "nikah nama (original)": "nikah-nama",
    "nadra marriage certificate": "nadra-mrc",
    "relationship evidence": "relationship-evidence-general",
    "prior marriage termination proof": "divorce-decree-beneficiary",
    translations: "certified-translations",
    "birth certificate": "birth-cert-beneficiary",
    "police character certificate": "police-certificate-pakistan",
    "passport photos": "passport-photos",

    // Supporting fallbacks
    // NOTE: the petitioner's I-02 entry is the combined "U.S. Passport/Birth
    // Certificate". Without this exact key the substring search below would pick
    // the longer "birth certificate" match (→ beneficiary birth cert), routing
    // the petitioner's passport to the wrong person and skipping passport OCR.
    "u.s. passport/birth certificate": "passport-petitioner",
    "u.s. passport or birth certificate (petitioner)": "passport-petitioner",
    "pakistani passport": "passport-beneficiary",
    "u.s. passport": "passport-petitioner",
    "passport biographic page": "passport-beneficiary",
    "nadra birth certificate": "birth-cert-beneficiary",
    "nikah nama": "nikah-nama",
    "union council marriage registration": "nadra-mrc",
    "marriage certificate": "nadra-mrc",
    "police certificate": "police-certificate-pakistan",
    "irs tax transcripts": "tax-returns-petitioner",
    "tax returns": "tax-returns-petitioner",
    "employment letter": "employment-letter",
    "pay stubs": "pay-stubs",
    "w-2 forms": "w2-forms",
    "bank statements": "bank-statements",
    "i-864 form": "i-864-affidavit",
    "marriage photos": "wedding-photos",
    "communication records": "communication-evidence",
    cnic: "cnic-beneficiary",
    "divorce decree": "divorce-decree-beneficiary",
    "talaq nama": "divorce-decree-beneficiary",
    "certified english translations": "certified-translations",
    "translated nikah nama": "nikah-nama-translation",
    "translated nadra mrc": "nadra-mrc-translation",
    "translated birth certificate": "birth-cert-translation",
    "translated divorce decree": "divorce-decree-translation",
    "other translated": "certified-translations",
    translation: "certified-translations",
  };

  // Try exact match first
  if (mapping[normalized]) return mapping[normalized];

  // Try substring matches, preferring longer (more specific) keys first
  const sortedKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) return mapping[key];
  }

  // Try to find in ALL_DOCUMENTS by name (fallback)
  const allMatches = ALL_DOCUMENTS.filter(
    (d) => normalized.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(normalized)
  );

  if (allMatches.length > 0) {
    // Return the one with the longest name match to be most specific
    return allMatches.sort((a, b) => b.name.length - a.name.length)[0].id;
  }

  return "misc-document";
}

export const FRIENDLY_JOURNEY_NAMES: Record<string, string> = {
  ir1: "IR-1 Spouse Visa Journey",
  "ir-1": "IR-1 Spouse Visa Journey",
  ir5: "IR-5 Parent Visa Journey",
  "ir-5": "IR-5 Parent Visa Journey",
};

export function getFriendlyJourneyName(journeyType: string, defaultName?: string): string {
  if (!journeyType) return defaultName || "Immigration Journey";
  const key = journeyType.toLowerCase().replace(/[^a-z0-9]/g, "");
  return FRIENDLY_JOURNEY_NAMES[key] || defaultName || `${journeyType.toUpperCase()} Journey`;
}

export const JOURNEY_TYPE_TO_VISA: Record<string, string> = {
  ir1: "IR-1",
  "ir-1": "IR-1",
  ir5: "IR-5",
  "ir-5": "IR-5",
};

export function journeyTypeToVisaCategory(journeyType: string): VisaCategory | null {
  if (!journeyType) return null;
  const key = journeyType.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (JOURNEY_TYPE_TO_VISA[key] as VisaCategory) || null;
}

export function isDocumentApplicableToJourney(
  documentDefId: string,
  documentName: string,
  journeyType: string
): boolean {
  if (!journeyType) return true;

  const visaCategory = journeyTypeToVisaCategory(journeyType);
  if (!visaCategory) return true;

  // 1. Resolve document definition from ID or custom name
  let targetId = documentDefId;
  if (documentDefId.startsWith("dynamic-")) {
    const mapped = mapDocumentNameToId(documentName);
    if (mapped && mapped !== "misc-document") {
      targetId = mapped;
    }
  }

  const doc = ALL_DOCUMENTS.find((d) => d.id === targetId);

  // 2. Check static rules (applicableVisas, requiredWhen)
  if (doc) {
    if (doc.applicableVisas && doc.applicableVisas.length > 0) {
      if (!doc.applicableVisas.includes(visaCategory)) {
        return false;
      }
    }

    if (doc.requiredWhen?.visaCategories && doc.requiredWhen.visaCategories.length > 0) {
      if (!doc.requiredWhen.visaCategories.includes(visaCategory)) {
        return false;
      }
    }

    // Spouse-relationship specific categories/documents should be hidden for parent (IR-5)
    if (doc.category === "RELATIONSHIP" && !["IR-1", "CR-1"].includes(visaCategory)) {
      return false;
    }
  }

  // 3. Fallback check for category of dynamic slots
  if (documentDefId.startsWith("dynamic-")) {
    const parts = documentDefId.split("-");
    const category = parts.length >= 2 ? parts[1] : "";
    if (category === "RELATIONSHIP" && !["IR-1", "CR-1"].includes(visaCategory)) {
      return false;
    }
  }

  return true;
}
