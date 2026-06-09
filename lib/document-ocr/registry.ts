// lib/document-ocr/registry.ts
//
// Registry of which Document Vault definitions support automatic OCR auto-fill.
// When a user uploads one of these documents (anywhere — journey step or the
// Document Vault page), DocumentUploadModal runs OCR on the file and offers to
// auto-fill the user's MasterProfile.
//
// `target` decides WHOSE profile fields the extracted values map to:
//   - "self"        → top-level MasterProfile (the petitioner / account holder)
//   - "beneficiary" → MasterProfile.beneficiary.* (the foreign spouse)
//
// Phase 3: add more entries here (birth certificate, marriage certificate, …)
// alongside their parsers — the upload flow needs no further changes.

export type OcrDocType = "passport";
export type OcrTarget = "self" | "beneficiary";

export interface OcrDocConfig {
  /** Which parser/extractor endpoint to use. */
  docType: OcrDocType;
  /** Whose MasterProfile section the extracted fields belong to. */
  target: OcrTarget;
}

// Keyed by Document Vault definition id (see lib/document-vault/journey-mapping.ts).
const OCR_DOCS: Record<string, OcrDocConfig> = {
  "passport-petitioner": { docType: "passport", target: "self" },
  "passport-beneficiary": { docType: "passport", target: "beneficiary" },
  // The IR-1 journey surfaces the petitioner's identity doc as the broader
  // "Proof of U.S. Citizenship" (citizenship-proof-petitioner) — it has no
  // separate passport slot. Treat it as a passport for OCR so a petitioner who
  // uploads their U.S. passport gets DOB/name auto-filled to their own profile.
  // A birth/naturalization certificate simply yields no MRZ → fields stay blank
  // for manual entry (graceful), exactly like a blurry passport scan.
  "citizenship-proof-petitioner": { docType: "passport", target: "self" },
};

/** Returns the OCR config for a vault definition id, or null if not OCR-eligible. */
export function getOcrConfig(defId: string | null | undefined): OcrDocConfig | null {
  if (!defId) return null;
  return OCR_DOCS[defId] ?? null;
}
