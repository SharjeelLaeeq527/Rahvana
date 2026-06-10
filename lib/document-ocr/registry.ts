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

export type OcrDocType = "passport" | "marriage";
export type OcrTarget = "self" | "beneficiary";

export interface OcrDocConfig {
  /** Which parser/extractor endpoint to use. */
  docType: OcrDocType;
  /** Whose MasterProfile section the extracted fields belong to. */
  target: OcrTarget;
}

/** A single editable field shown in the upload modal's confirm panel. */
export interface OcrFieldDescriptor {
  /** MasterProfile dot-path the value is saved to (e.g. "dateOfBirth"). */
  key: string;
  label: string;
}

/** Per-docType wiring: which API endpoint to call and which fields to confirm. */
export interface OcrDocTypeMeta {
  endpoint: string;
  fields: OcrFieldDescriptor[];
}

// Both petitioner (self) and beneficiary passports carry the same biographic
// fields; the profile stores them for either person.
const PASSPORT_FIELDS: OcrFieldDescriptor[] = [
  { key: "name.first", label: "Given name" },
  { key: "name.last", label: "Surname" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "nationality", label: "Nationality" },
  { key: "passportNumber", label: "Passport number" },
  { key: "passportExpiry", label: "Passport expiry" },
  { key: "passportCountry", label: "Issuing country" },
];

// Marriage proof (NADRA MRC / Nikah Nama). The journey needs the marriage date;
// place of marriage is a best-effort bonus.
const MARRIAGE_FIELDS: OcrFieldDescriptor[] = [
  { key: "relationship.marriageDate", label: "Marriage date" },
  { key: "relationship.marriagePlace.city", label: "Place of marriage (city)" },
];

const OCR_DOCTYPE_META: Record<OcrDocType, OcrDocTypeMeta> = {
  passport: { endpoint: "/api/documents/extract-passport", fields: PASSPORT_FIELDS },
  marriage: { endpoint: "/api/documents/extract-marriage", fields: MARRIAGE_FIELDS },
};

/** Endpoint + field set for a docType (drives the modal's confirm panel). */
export function getOcrDocTypeMeta(docType: OcrDocType): OcrDocTypeMeta {
  return OCR_DOCTYPE_META[docType];
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
  // Marriage proofs — doc-agnostic: Nikah Nama or NADRA MRC (or any page carrying
  // the marriage date). The marriage date maps to relationship.marriageDate on the
  // top-level (self) profile, which feeds the I-130 / DS-260 consistency widgets.
  "nikah-nama": { docType: "marriage", target: "self" },
  "nadra-mrc": { docType: "marriage", target: "self" },
};

/** Returns the OCR config for a vault definition id, or null if not OCR-eligible. */
export function getOcrConfig(defId: string | null | undefined): OcrDocConfig | null {
  if (!defId) return null;
  return OCR_DOCS[defId] ?? null;
}
