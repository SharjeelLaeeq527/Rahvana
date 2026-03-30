import { Dispatch, SetStateAction } from "react";

export type CaseType = "Spouse";

export interface FormData {
  caseType: CaseType | "";
  // Basic Profile
  sponsor_full_name?: string;
  beneficiary_full_name?: string;
  sponsor_dob?: string;
  beneficiary_dob?: string;
  country_of_residence?: string;
  marriage_date?: string;
  relationship_start_date?: string;
  spousal_relationship_type?: string;
  intended_us_state_of_residence?: string;
  i130_status?: string;
  // Education & Employment Background
  highest_education_level?: string;
  highest_education_field?: string;
  current_occupation_role?: string;
  industry_sector?: string;
  prior_military_service?: boolean;
  specialized_weapons_training?: boolean;
  unofficial_armed_groups?: boolean;
  employer_type?: string;
  // Relationship Strength
  how_did_you_meet?: string;
  number_of_in_person_visits?: number;
  cohabitation_proof?: boolean;
  shared_financial_accounts?: boolean;
  wedding_photos_available?: boolean;
  communication_logs?: boolean;
  money_transfer_receipts_available?: boolean;
  driving_license_copy_available?: boolean;
  children_together?: boolean;
  // Immigration History
  previous_visa_applications?: boolean;
  previous_visa_denial?: boolean;
  overstay_or_violation?: boolean;
  criminal_record?: boolean;
  // Financial Profile
  sponsor_annual_income?: number;
  household_size?: number;
  has_tax_returns?: boolean;
  has_employment_letter?: boolean;
  has_paystubs?: boolean;
  joint_sponsor_available?: boolean;
  i864_affidavit_submitted?: boolean;
  i864_supporting_financial_documents?: boolean;
  // Core Identity Documents
  urdu_marriage_certificate?: boolean;
  english_translation_certificate?: boolean;
  nadra_marriage_registration_cert?: boolean;
  family_registration_certificate?: boolean;
  birth_certificates?: boolean;
  prior_marriages_exist?: boolean;
  prior_marriage_termination_docs?: boolean;
  // Passport & Police Documents
  passports_available?: boolean;
  passport_copy_available?: boolean;
  valid_police_clearance_certificate?: boolean;
  // Interview & Medical Documents
  ds260_confirmation?: boolean;
  interview_letter?: boolean;
  courier_registration?: boolean;
  medical_report_available?: boolean;
  polio_vaccination_certificate?: boolean;
  passport_photos_2x2?: boolean;
}

export interface CaseTypeStepProps {
  formData: FormData;
  error: string | null;
  onCaseTypeChange: (caseType: CaseType) => void;
  isAuthenticated: boolean;
  loading?: boolean;
  onNext: () => void;
  onBack: () => void;
}

export interface QuestionStepProps {
  title: string;
  description: string;
  questions: Array<{
    id: keyof FormData;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
    options?: string | string[];
    risk_tag?: string;
  }>;
  formData: FormData;
  error: string | null;
  loading?: boolean;
  onChange: (id: keyof FormData, value: unknown) => void;
  setFormData: Dispatch<SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
  onSaveForLater?: () => void;
}

export interface ReviewStepProps {
  formData: FormData;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onSaveForLater?: () => void;
  onSaveToProfile?: () => Promise<void>;
}
