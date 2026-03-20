// Type definitions for Interview Preparation components

export type CaseType = "Spouse";

export interface InterviewFormData {
  caseType: CaseType | "";
  visaCategory?: string;
  // Basic Case Information
  beneficiary_country?: string;
  age_range?: string;
  highest_education?: string;
  marriage_date?: string;
  months_since_marriage?: number;
  marriage_location?: string;
  previous_marriages?: string;
  // Relationship Origin
  relationship_origin_type?: string;
  total_time_spent_together?: string;
  number_of_in_person_visits?: number;
  proposal_details?: string;
  courtship_duration?: string;
  // Married Life & Daily Interaction
  current_living_arrangement?: string;
  spouse_address?: string;
  communication_frequency?: string;
  daily_communication?: string;
  shared_activities?: string;
  important_dates_knowledge?: boolean;
  // Family & Social Knowledge
  met_spouse_family?: boolean;
  family_reaction_to_marriage?: string;
  wedding_attendees?: string;
  marriage_type?: string;
  mutual_friends?: boolean;
  // Petitioner Information
  petitioner_status?: string;
  petitioner_income_level?: string;
  household_size?: string;
  // Background & Future Plans
  beneficiary_employment?: string;
  sponsor_employment?: string;
  military_or_defense_background?: boolean;
  previous_us_visits?: boolean;
  previous_visa_refusal?: boolean;
  visa_overstay_history?: boolean;
  criminal_history?: boolean;
  english_proficiency?: string;
  intended_us_state?: string;
  living_arrangements_in_us?: string;
  future_plans?: string;
  // Finances & Household Management
  joint_finances?: boolean;
  financial_arrangement_description?: string;
}

export interface CaseTypeStepProps {
  formData: InterviewFormData;
  error: string | null;
  onCaseTypeChange: (caseType: CaseType) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface Question {
  key: keyof InterviewFormData;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
  options?: string | string[];
  required?: boolean;
}

export interface QuestionStepProps {
  title: string;
  description: string;
  questions: Question[];
  formData: InterviewFormData;
  error: string | null;
  onChange: (id: keyof InterviewFormData, value: unknown) => void;
  setFormData: React.Dispatch<React.SetStateAction<InterviewFormData>>;
  onNext: () => void;
  onBack: () => void;
}

export interface ReviewStepProps {
  formData: InterviewFormData;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
  categorySlug?: string;
}
