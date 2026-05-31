import { ALL_DOCUMENTS } from "./document-definitions";

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
