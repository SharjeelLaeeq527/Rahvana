// lib/document-ocr/registry.ts
//
// Registry of which Document Vault definitions support automatic OCR auto-fill.
// When a user uploads one of these documents (anywhere — journey step or the
// Document Vault page), DocumentUploadModal runs OCR on the file and offers to
// auto-fill the user's MasterProfile.
//
// `target` decides WHOSE profile fields the extracted values map to:
//   - "self"        → top-level MasterProfile = the BENEFICIARY (account holder)
//   - "sponsor"     → MasterProfile.sponsor.* (the US petitioner spouse)
//   - "beneficiary" → MasterProfile.beneficiary.* (legacy subsection; kept as a
//                     fallback source for forms, not a primary OCR target)
//
// Phase 3: add more entries here (birth certificate, marriage certificate, …)
// alongside their parsers — the upload flow needs no further changes.

export type OcrDocType = "passport" | "marriage" | "cnic" | "birth";
export type OcrTarget = "self" | "beneficiary" | "sponsor";

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

// CNIC (Pakistani national ID). The identity number is the most reliable field;
// name + DOB are bonus. Maps onto the beneficiary's profile (foreign spouse).
const CNIC_FIELDS: OcrFieldDescriptor[] = [
  { key: "name.first", label: "Given name" },
  { key: "name.last", label: "Family name" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "cnic", label: "CNIC number" },
];

// Birth certificate (NADRA computerized cert / Form-B). Feeds the applicant's own
// name, DOB and place of birth (DS-260 Section 1 / I-130A) plus the PARENTS' names
// (DS-260 Section 2 "Father's/Mother's Information" + I-130A parent section).
const BIRTH_FIELDS: OcrFieldDescriptor[] = [
  { key: "name.first", label: "Given name" },
  { key: "name.last", label: "Surname" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "placeOfBirth.city", label: "Place of birth (city)" },
  { key: "placeOfBirth.country", label: "Country" },
  { key: "father.name.first", label: "Father's given name" },
  { key: "father.name.last", label: "Father's family name" },
  { key: "mother.name.first", label: "Mother's given name" },
  { key: "mother.name.last", label: "Mother's family name" },
];

const OCR_DOCTYPE_META: Record<OcrDocType, OcrDocTypeMeta> = {
  passport: { endpoint: "/api/documents/extract-passport", fields: PASSPORT_FIELDS },
  marriage: { endpoint: "/api/documents/extract-marriage", fields: MARRIAGE_FIELDS },
  cnic: { endpoint: "/api/documents/extract-cnic", fields: CNIC_FIELDS },
  birth: { endpoint: "/api/documents/extract-birth", fields: BIRTH_FIELDS },
};

/** Endpoint + field set for a docType (drives the modal's confirm panel). */
export function getOcrDocTypeMeta(docType: OcrDocType): OcrDocTypeMeta {
  return OCR_DOCTYPE_META[docType];
}

// Keyed by Document Vault definition id (see lib/document-vault/journey-mapping.ts).
const OCR_DOCS: Record<string, OcrDocConfig> = {
  // The account holder is the BENEFICIARY, so the sponsor's (petitioner's)
  // documents land in MasterProfile.sponsor.* — never on the top-level profile.
  "passport-petitioner": { docType: "passport", target: "sponsor" },
  // The beneficiary's own passport = the account holder's passport → top-level.
  "passport-beneficiary": { docType: "passport", target: "self" },
  // The IR-1 journey surfaces the petitioner's identity doc as the broader
  // "Proof of U.S. Citizenship" (citizenship-proof-petitioner) — it has no
  // separate passport slot. Treat it as a passport for OCR so a petitioner who
  // uploads their U.S. passport gets DOB/name auto-filled to the sponsor section.
  // A birth/naturalization certificate simply yields no MRZ → fields stay blank
  // for manual entry (graceful), exactly like a blurry passport scan.
  "citizenship-proof-petitioner": { docType: "passport", target: "sponsor" },
  // Marriage proofs — doc-agnostic: Nikah Nama or NADRA MRC (or any page carrying
  // the marriage date). The marriage date maps to relationship.marriageDate on the
  // top-level (self) profile, which feeds the I-130 / DS-260 consistency widgets.
  "nikah-nama": { docType: "marriage", target: "self" },
  "nadra-mrc": { docType: "marriage", target: "self" },
  // The app's account holder IS the visa applicant (beneficiary), so their own
  // civil identity documents fill the TOP-LEVEL (self) profile — the same fields
  // the DS-260 (Section 1 + parents Section 2) and I-130A autofill from.
  "cnic-beneficiary": { docType: "cnic", target: "self" },
  "birth-cert-beneficiary": { docType: "birth", target: "self" },
};

/** Returns the OCR config for a vault definition id, or null if not OCR-eligible. */
export function getOcrConfig(defId: string | null | undefined): OcrDocConfig | null {
  if (!defId) return null;
  return OCR_DOCS[defId] ?? null;
}
