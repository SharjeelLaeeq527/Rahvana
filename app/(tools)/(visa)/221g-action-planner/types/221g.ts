// types/221g.ts

export interface FormSelections {
  admin_processing?: boolean;
  passport?: boolean;
  medical_examination?: boolean;
  nadra_family_reg?: boolean;
  nadra_family_reg_name?: string;
  nadra_birth_cert?: boolean;
  nadra_birth_cert_petitioner?: boolean;
  nadra_birth_cert_beneficiary?: boolean;
  nadra_marriage_cert?: boolean;
  nikah_nama?: boolean;
  nadra_divorce_cert?: boolean;
  nadra_divorce_cert_petitioner?: boolean;
  nadra_divorce_cert_beneficiary?: boolean;
  us_divorce_decree?: boolean;
  death_certificate?: boolean;
  death_certificate_name?: string;
  police_certificate?: boolean;
  police_certificate_country?: string;
  english_translation?: boolean;
  english_translation_document?: string;
  i864_affidavit?: boolean;
  i864_courier?: boolean;
  i864_online?: boolean;
  i864_petitioner?: boolean;
  i864_joint_sponsor?: boolean;
  i864a?: boolean;
  i134?: boolean;
  i864w?: boolean;
  tax_1040?: boolean;
  w2?: boolean;
  irs_transcript?: boolean;
  proof_citizenship?: boolean;
  domicile?: boolean;
  i864_sponsor_structure?: "petitioner-only" | "petitioner-hm" | "joint-sponsor" | "joint-sponsor-hm";
  i864_petitioner_name?: string;
  i864_joint_sponsor_name?: string;
  i864_household_member_name?: string;
  i864_tax_years?: string;
  dna_test?: boolean;
  dna_test_name?: string;
  other?: boolean;
  other_details?: string;
  caseId?: string;
}

export interface FormData {
  // Step 1: Case Basics (matching reference HTML)
  visaType: string;         // immigrant | nonimmigrant
  visaCategory: string;     // IR-1, CR-1, F-1, etc.
  visaTypeOther: string;    // when visaCategory === 'other'
  interviewDate: string;
  consularPost: string;     // e.g. "U.S. Embassy Islamabad"
  ceacStatus: string;       // refused | administrative-processing | issued | ready | other
  caseNumber: string;
  beneficiaryName: string;
  passportNumber: string;
  dateOfBirth: string;      // beneficiary DOB (YYYY-MM-DD)
}
