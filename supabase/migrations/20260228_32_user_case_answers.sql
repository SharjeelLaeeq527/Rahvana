-- Create ENUM for Question keys
DROP TYPE IF EXISTS question_key CASCADE;
CREATE TYPE question_key AS ENUM (
  -- basic profile
  'sponsor_dob',
  'beneficiary_dob',
  'country_of_residence',
  'marriage_date',
  'spousal_relationship_type',
  'intended_us_state_of_residence',

  -- education & employment
  'highest_education_level',
  'highest_education_field',
  'current_occupation_role',
  'industry_sector',
  'prior_military_service',
  'specialized_weapons_training',
  'unofficial_armed_groups',
  'employer_type',

  -- relationship strength
  'how_did_you_meet',
  'number_of_in_person_visits',
  'cohabitation_proof',
  'shared_financial_accounts',
  'wedding_photos_available',
  'communication_logs',

  -- immigration history
  'previous_visa_applications',
  'previous_visa_denial',
  'overstay_or_violation',
  'criminal_record',

  -- financial profile
  'sponsor_annual_income',
  'household_size',
  'has_tax_returns',
  'has_employment_letter',
  'has_paystubs',
  'joint_sponsor_available',

  -- document checklist
  'urdu_marriage_certificate',
  'english_translation_certificate',
  'union_council_certificate',
  'birth_certificates',
  'passports_available',
  'driving_license_copy_available',

  -- interview & application docs
  'ds260_confirmation',
  'interview_letter',
  'courier_registration',
  'medical_report_available',
  'polio_vaccination_certificate',
  'covid_vaccination_certificate',

  -- applicant photos
  'passport_photos_2x2',

  -- nadra records
  'family_registration_certificate',

  -- passport copies
  'passport_copy_available',

  -- police certificate distinction
  'valid_police_clearance_certificate',
  
  -- i-864
  'i864_affidavit_submitted',
  'i864_supporting_financial_documents',

  'money_transfer_receipts_available'
);

-- Main user case answers table
CREATE TABLE user_case_answers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session Id
  session_id UUID NOT NULL REFERENCES user_case_sessions(id) ON DELETE CASCADE,

  -- Q/A
  question_key question_key NOT NULL,
  answer_value JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,   
);

-- Indexes
CREATE INDEX idx_user_case_answers_session_id ON user_case_answers(session_id);
CREATE UNIQUE INDEX uq_session_question ON user_case_answers(session_id, question_key);

-- Comments
COMMENT ON COLUMN user_case_answers.answer_value IS 'Stores the user answer in JSONB format to allow flexibility for different question types';