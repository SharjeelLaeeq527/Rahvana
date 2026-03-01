-- Create ENUM for risk severity
DROP TYPE IF EXISTS risk_severity CASCADE;
CREATE TYPE risk_severity AS ENUM (
    'LOW',       -- Low risk
    'MEDIUM',    -- Medium risk 
    'HIGH'      -- High risk
);

-- Create ENUM for flag_codes
DROP TYPE IF EXISTS flag_code CASCADE;
CREATE TYPE flag_code AS ENUM (
  -- relationship red flags
  'SHORT_RELATIONSHIP_DURATION',
  'AGE_GAP_HIGH',
  'NO_IN_PERSON_MEETINGS',
  'NO_COHABITATION_EVIDENCE',
  'NO_SHARED_FINANCIALS',
  'NO_WEDDING_PHOTOS',
  'NO_COMMUNICATION_HISTORY',

  -- immigration history risks
  'PREVIOUS_US_VISA_DENIAL',
  'PRIOR_IMMIGRATION_VIOLATION',
  'CRIMINAL_HISTORY_PRESENT',

  -- financial risks
  'SPONSOR_INCOME_BELOW_GUIDELINE',
  'NO_TAX_RETURNS_AVAILABLE',
  'NO_EMPLOYMENT_PROOF',
  'NO_PAYSTUBS',
  'NO_JOINT_SPONSOR_WHEN_REQUIRED',

  -- document risks
  'NO_MARRIAGE_CERTIFICATE',
  'NO_MARRIAGE_TRANSLATION',
  'NO_UNION_COUNCIL_CERTIFICATE',
  'NO_BIRTH_CERTIFICATES',
  'NO_VALID_PASSPORTS',
  'DS260_NOT_SUBMITTED',
  'NO_INTERVIEW_LETTER',
  'NO_COURIER_REGISTRATION',
  'NO_MEDICAL_REPORT',
  'NO_POLIO_VACCINATION_PROOF',
  'NO_COVID_VACCINATION_PROOF',
  'NO_PASSPORT_PHOTOS_2X2',
  'NO_FRC_AVAILABLE',
  'NO_PASSPORT_COPY',
  'NO_VALID_POLICE_CLEARANCE_CERTIFICATE',
  'NO_I864_SUBMITTED',
  'I864_FINANCIAL_EVIDENCE_WEAK',
  'NO_FINANCIAL_INTERACTION_EVIDENCE',
  'CONSANGUINEOUS_MARRIAGE',
  'MARRIAGE_INVALID_IN_INTENDED_STATE',
  'WORKING_IN_DEFENSE_SECTOR',
  'SENSITIVE_RESEARCH_FIELD',
  'DUAL_USE_TECHNOLOGY_RISK'
);

-- Main risk flags table
CREATE TABLE risk_flags (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session Id
  session_id UUID NOT NULL REFERENCES user_case_sessions(id) ON DELETE CASCADE,
    
    -- Risk Flag Details
    flag_code flag_code NOT NULL,         -- Specific risk flag code
    severity risk_severity NOT NULL,      -- Severity level of the risk flag
    points_deducted INT NOT NULL,         -- Points deducted for this risk flag
    explanation TEXT,                     -- Explanation of the risk flag
    improvement_suggestions TEXT,         -- Suggestions to mitigate the risk flag
    improvement_priority INT DEFAULT 1,              -- Priority level for addressing the risk flag
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_risk_flags_session_id ON risk_flags(session_id);
CREATE INDEX idx_risk_flags_flag_code ON risk_flags(flag_code);
CREATE INDEX idx_risk_flags_severity ON risk_flags(severity);

-- Updated_at trigger
CREATE TRIGGER set_risk_flags_updated_at
BEFORE UPDATE ON risk_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN risk_flags.points_deducted IS 'Points deducted from overall score due to this risk flag';
COMMENT ON COLUMN risk_flags.severity IS 'Severity level of the risk flag (LOW, MEDIUM, HIGH)';