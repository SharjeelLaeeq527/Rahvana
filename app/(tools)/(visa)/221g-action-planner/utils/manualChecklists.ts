import { DocumentType } from "./documentValidation";

export interface ChecklistItem {
  id: string;
  label: string;
}

export const manualChecklists: Record<DocumentType, ChecklistItem[]> = {
  passport: [
    { id: "passport_number", label: "Passport Number is clearly visible" },
    { id: "full_name", label: "Full Name matches application" },
    { id: "dob", label: "Date of Birth is legible" },
    { id: "expiry_date", label: "Expiry Date is visible and valid" },
    { id: "photo", label: "Photo is clear and recognizable" },
    { id: "signature", label: "Holder's signature is present" },
  ],
  nikah_nama: [
    { id: "bride_name", label: "Bride's Full Name is clearly visible" },
    { id: "groom_name", label: "Groom's Full Name is clearly visible" },
    { id: "marriage_date", label: "Date of Marriage is legible" },
    { id: "official_stamp", label: "Official Union Council Stamp/Seal is present" },
    { id: "signatures", label: "Signatures of Bride, Groom, and Witnesses are present" },
  ],
  birth_certificate: [
    { id: "full_name", label: "Full Name is clearly visible" },
    { id: "dob", label: "Date of Birth is legible" },
    { id: "place_of_birth", label: "Place of Birth is visible" },
    { id: "parents_names", label: "Parents' Names are listed" },
    { id: "official_seal", label: "Official Seal/Stamp is present" },
    { id: "registration_number", label: "Registration Number is visible" },
  ],
  marriage_certificate: [
    { id: "spouse1_name", label: "Spouse 1 Name is clearly visible" },
    { id: "spouse2_name", label: "Spouse 2 Name is clearly visible" },
    { id: "marriage_date", label: "Date of Marriage is legible" },
    { id: "officiant", label: "Officiant's Name/Signature is present" },
    { id: "official_seal", label: "Official Seal/Stamp is present" },
  ],
  divorce_certificate: [
    { id: "parties_names", label: "Names of both parties are visible" },
    { id: "divorce_date", label: "Date of Divorce/Dissolution is legible" },
    { id: "judge_signature", label: "Judge's Signature is present" },
    { id: "court_seal", label: "Court Seal is visible" },
    { id: "final_decree", label: 'Document indicates "Final Decree" or equivalent' },
  ],
  death_certificate: [
    { id: "deceased_name", label: "Deceased Person's Name is visible" },
    { id: "death_date", label: "Date of Death is legible" },
    { id: "cause_of_death", label: "Cause of Death is listed (if applicable)" },
    { id: "official_seal", label: "Official Seal/Stamp is present" },
  ],
  police_certificate: [
    { id: "full_name", label: "Full Name matches application" },
    { id: "clearance_status", label: 'Clearance Status (e.g., "No Record Found") is clear' },
    { id: "issue_date", label: "Date of Issue is legible" },
    { id: "authority", label: "Issuing Police Authority is visible" },
    { id: "validity", label: "Certificate is within validity period (usually 1 year)" },
  ],
  medical_examination: [
    { id: "full_name", label: "Applicant's Name is visible" },
    { id: "physician_signature", label: "Panel Physician's Signature is present" },
    { id: "vaccination_record", label: "Vaccination Record is complete" },
    { id: "exam_date", label: "Date of Examination is legible" },
    {
      id: "sealed_envelope",
      label: "If physical, confirm envelope is sealed (for user reference)",
    },
  ],
  i864_affidavit: [
    { id: "sponsor_name", label: "Sponsor's Name is visible" },
    { id: "beneficiary_name", label: "Beneficiary's Name is visible" },
    { id: "income", label: "Annual Income is clearly stated" },
    { id: "signature", label: "Sponsor's Signature is present" },
    { id: "tax_year", label: "Tax Year is correct" },
  ],
  translation: [
    { id: "translator_statement", label: "Translator's Certification Statement is present" },
    { id: "translator_signature", label: "Translator's Signature is visible" },
    { id: "original_copy", label: "Copy of Original Document is attached" },
    { id: "accuracy", label: "Translation appears complete and accurate" },
  ],
  irs_transcript: [
    { id: "tax_year", label: "Tax Year is clearly visible" },
    { id: "taxpayer_name", label: "Taxpayer Name matches Sponsor" },
    { id: "agi", label: "Adjusted Gross Income is visible" },
    { id: "filing_status", label: "Filing Status is visible" },
  ],
  form_1040: [
    { id: "tax_year", label: "Tax Year is clearly visible" },
    { id: "taxpayer_name", label: "Taxpayer Name matches Sponsor" },
    { id: "total_income", label: "Total Income is visible" },
    { id: "signature", label: "Taxpayer Signature is present" },
  ],
  w2: [
    { id: "employer_name", label: "Employer Name is visible" },
    { id: "employee_name", label: "Employee Name is visible" },
    { id: "wages", label: "Wages, Tips, Other Compensation is visible" },
    { id: "tax_year", label: "Tax Year is correct" },
  ],
  form_1099: [
    { id: "payer_name", label: "Payer Name is visible" },
    { id: "recipient_name", label: "Recipient Name is visible" },
    { id: "payment_amount", label: "Payment Amount is visible" },
    { id: "tax_year", label: "Tax Year is correct" },
  ],
};
