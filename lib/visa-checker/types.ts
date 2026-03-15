export type CaseType = 'Spouse';

export type RiskLevel = 'PENDING' | 'WEAK' | 'MODERATE' | 'STRONG';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type QuestionKey =
  // Basic Profile
  | 'sponsor_dob'
  | 'beneficiary_dob'
  | 'country_of_residence'
  | 'marriage_date'
  | 'spousal_relationship_type'
  | 'intended_us_state_of_residence'
  // Relationship Strength
  | 'how_did_you_meet'
  | 'number_of_in_person_visits'
  | 'cohabitation_proof'
  | 'shared_financial_accounts'
  | 'wedding_photos_available'
  | 'communication_logs'
  | 'money_transfer_receipts_available'
  | 'driving_license_copy_available'
  // Immigration History
  | 'previous_visa_applications'
  | 'previous_visa_denial'
  | 'overstay_or_violation'
  | 'criminal_record'
  // Financial Profile
  | 'sponsor_annual_income'
  | 'household_size'
  | 'has_tax_returns'
  | 'has_employment_letter'
  | 'has_paystubs'
  | 'joint_sponsor_available'
  | 'i864_affidavit_submitted'
  | 'i864_supporting_financial_documents'
  // Core Identity Documents
  | 'urdu_marriage_certificate'
  | 'english_translation_certificate'
  | 'nadra_marriage_registration_cert'
  | 'family_registration_certificate'
  | 'birth_certificates'
  // Passport & Police Documents
  | 'passports_available'
  | 'passport_copy_available'
  | 'valid_police_clearance_certificate'
  // Interview & Medical Documents
  | 'ds260_confirmation'
  | 'interview_letter'
  | 'courier_registration'
  | 'medical_report_available'
  | 'polio_vaccination_certificate'

  | 'passport_photos_2x2';

export type FlagCode =
  // Relationship red flags
  | 'SHORT_RELATIONSHIP_DURATION'
  | 'AGE_GAP_HIGH'
  | 'NO_IN_PERSON_MEETINGS'
  | 'NO_COHABITATION_EVIDENCE'
  | 'NO_SHARED_FINANCIALS'
  | 'NO_WEDDING_PHOTOS'
  | 'NO_COMMUNICATION_HISTORY'
  // Immigration history risks
  | 'PREVIOUS_US_VISA_DENIAL'
  | 'PRIOR_IMMIGRATION_VIOLATION'
  | 'CRIMINAL_HISTORY_PRESENT'
  // Financial risks
  | 'SPONSOR_INCOME_BELOW_GUIDELINE'
  | 'NO_TAX_RETURNS_AVAILABLE'
  | 'NO_EMPLOYMENT_PROOF'
  | 'NO_PAYSTUBS'
  | 'NO_JOINT_SPONSOR_WHEN_REQUIRED'
  // Document risks
  | 'NO_MARRIAGE_CERTIFICATE'
  | 'NO_MARRIAGE_TRANSLATION'
  | 'NO_NADRA_MARRIAGE_CERT'
  | 'NO_BIRTH_CERTIFICATES'
  | 'NO_VALID_PASSPORTS'
  | 'DS260_NOT_SUBMITTED'
  | 'NO_INTERVIEW_LETTER'
  | 'NO_COURIER_REGISTRATION'
  | 'NO_MEDICAL_REPORT'
  | 'NO_POLIO_VACCINATION_PROOF'
  | 'CR1_I751_REMINDER'
  | 'NO_PASSPORT_PHOTOS_2X2'
  | 'NO_FRC_AVAILABLE'
  | 'NO_PASSPORT_COPY'
  | 'NO_VALID_POLICE_CLEARANCE_CERTIFICATE'
  | 'NO_I864_SUBMITTED'
  | 'I864_FINANCIAL_EVIDENCE_WEAK'
  | 'NO_FINANCIAL_INTERACTION_EVIDENCE'
  | 'CONSANGUINEOUS_MARRIAGE'
  | 'MARRIAGE_INVALID_IN_INTENDED_STATE'
  | 'WORKING_IN_DEFENSE_SECTOR'
  | 'SENSITIVE_RESEARCH_FIELD'
  | 'DUAL_USE_TECHNOLOGY_RISK';

export interface CreateSessionRequest {
  userEmail?: string;
  userName?: string;
  caseType: CaseType;
}

export interface CreateSessionResponse {
  sessionId: string;
  message: string;
}

export interface SaveAnswersRequest {
  answers: Record<string, unknown>;
}

export interface SessionDetailsResponse {
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  caseType: CaseType;
  overallScore?: number;
  riskLevel?: RiskLevel;
  completed: boolean;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitQuestionnaireRequest {
  calculateImmediately?: boolean;
}

export interface RiskFlagResponse {
  flagCode: FlagCode;
  severity: RiskSeverity;
  pointsDeducted: number;
  explanation: string;
  improvementSuggestions: string;
}

export interface ScoringResultsResponse {
  sessionId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  totalPossiblePoints: number;
  totalDeductedPoints: number;
  riskFlags: RiskFlagResponse[];
  summaryReasons: string[];
  improvementSuggestions: string[];
}

export interface DeleteSessionResponse {
  sessionId: string;
  deleted: boolean;
  message: string;
}