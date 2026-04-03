-- ============================================================
-- Visa Journey Roadmap: Case Data Table
-- Stores user decisions, responses, and case-specific information
-- ============================================================

CREATE TABLE IF NOT EXISTS case_data (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  
  -- Data Key (what type of data this is)
  data_key TEXT NOT NULL, -- e.g., 'filing_method', 'visa_category', 'beneficiary_age', etc.
  
  -- Data Value (flexible JSON to support any data type)
  data_value JSONB NOT NULL, -- Stores the actual value (string, number, boolean, array, object, null)
  
  -- Data Metadata
  data_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'array', 'object', 'date'
  label TEXT, -- User-friendly label for this data
  description TEXT, -- Description of what this data represents
  
  -- Source (where this data came from)
  source TEXT NOT NULL DEFAULT 'user_input', -- 'user_input', 'form_extraction', 'system_calculated', 'external_api', 'tool_output'
  source_reference TEXT, -- Reference to tool/form/API that provided this data (e.g., step_id, tool_name)
  
  -- Validation & Status
  is_validated BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this data has been validated
  validation_errors JSONB DEFAULT '[]'::jsonb, -- Array of validation errors if any
  is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Whether user verified this data
  
  -- Versioning (track changes to sensitive data)
  version INTEGER NOT NULL DEFAULT 1, -- Increment on updates for audit trail
  previous_value JSONB, -- Store previous value for audit trail
  
  -- Timestamps
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: One value per (journey, data_key)
  UNIQUE(journey_id, data_key)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_case_data_journey_id 
  ON case_data(journey_id);

CREATE INDEX IF NOT EXISTS idx_case_data_data_key 
  ON case_data(data_key);

CREATE INDEX IF NOT EXISTS idx_case_data_journey_key 
  ON case_data(journey_id, data_key);

CREATE INDEX IF NOT EXISTS idx_case_data_source 
  ON case_data(source);

CREATE INDEX IF NOT EXISTS idx_case_data_is_validated 
  ON case_data(is_validated);

CREATE INDEX IF NOT EXISTS idx_case_data_created_at 
  ON case_data(created_at DESC);

-- Index for sensitive data lookups (visa category, beneficiary info, etc.)
CREATE INDEX IF NOT EXISTS idx_case_data_journey_validated
  ON case_data(journey_id, is_validated);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_case_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = NEW.version + 1;
  NEW.previous_value = OLD.data_value;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_data_updated_at
  BEFORE UPDATE ON case_data
  FOR EACH ROW
  EXECUTE FUNCTION update_case_data_updated_at();

-- ============================================================
-- Trigger: Update Journey Timestamps When Case Data Changes
-- Mark journey as updated when case data is modified
-- ============================================================
CREATE OR REPLACE FUNCTION touch_journey_on_case_data_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE journeys
  SET updated_at = NOW()
  WHERE id = NEW.journey_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_journey_on_case_data
  AFTER INSERT OR UPDATE ON case_data
  FOR EACH ROW
  EXECUTE FUNCTION touch_journey_on_case_data_change();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE case_data ENABLE ROW LEVEL SECURITY;

-- Users can view case data from their own journeys
CREATE POLICY "Users can view own case data"
  ON case_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = case_data.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Users can insert case data for their own journeys
CREATE POLICY "Users can insert own case data"
  ON case_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = case_data.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Users can update case data from their own journeys
CREATE POLICY "Users can update own case data"
  ON case_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = case_data.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Users can delete case data from their own journeys
CREATE POLICY "Users can delete own case data"
  ON case_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = case_data.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Admins can view all case data
CREATE POLICY "Admins can view all case data"
  ON case_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Comments & Documentation
-- ============================================================
COMMENT ON TABLE case_data IS 'Stores user decisions and case-specific data throughout the journey. Key-value structure supporting any data type through JSONB. Includes version tracking and validation status.';

COMMENT ON COLUMN case_data.data_key IS 'Unique identifier for data type (e.g., filing_method, visa_category, beneficiary_full_name, nvc_case_number)';

COMMENT ON COLUMN case_data.data_value IS 'The actual data value stored as JSONB (supports string, number, bool, array, object, null)';

COMMENT ON COLUMN case_data.data_type IS 'Categorizes the value type for validation and processing (string, number, boolean, array, object, date)';

COMMENT ON COLUMN case_data.source IS 'Where data came from: user_input (manual entry), form_extraction (auto-filled), system_calculated, external_api, tool_output';

COMMENT ON COLUMN case_data.source_reference IS 'Details about source (e.g., step_id if from a form, tool_name if from external tool)';

COMMENT ON COLUMN case_data.is_validated IS 'Flag indicating whether data has passed validation rules';

COMMENT ON COLUMN case_data.validation_errors IS 'JSON array of validation error messages if validation failed';

COMMENT ON COLUMN case_data.is_verified IS 'Flag indicating whether user reviewed and verified this data is correct';

COMMENT ON COLUMN case_data.version IS 'Audit trail version number (increments on each update)';

COMMENT ON COLUMN case_data.previous_value IS 'Previous value before last update (for audit trail and undo functionality)';

COMMENT ON COLUMN case_data.captured_at IS 'When the data was initially captured or first occurred';

COMMENT ON COLUMN case_data.created_at IS 'When this record was first created in the database';

COMMENT ON COLUMN case_data.updated_at IS 'Last modification timestamp (auto-updated)';

-- ============================================================
-- Common Case Data Keys Reference
-- This is for documentation - these keys will be used throughout the system
-- ============================================================
/*
Common case_data keys (data_key values):
  
  JOURNEY & CASE INFORMATION:
  - filing_method: 'online' | 'paper'
  - visa_category: 'IR1' | 'IR2' | 'F1' | 'H1B' | etc.
  - case_id: External case ID for reference
  - case_status: Current case status for tracking
  
  BENEFICIARY INFORMATION:
  - beneficiary_full_name: Full name of the beneficiary
  - beneficiary_date_of_birth: Date of birth (ISO format)
  - beneficiary_nationality: Country code
  - beneficiary_passport_number: Passport number
  - beneficiary_nvc_case_number: NVC case number (received from NVC)
  
  SPONSOR/PETITIONER INFORMATION:
  - sponsor_structure: 'individual' | 'joint_sponsor'
  - sponsor_full_name: Name of primary sponsor/petitioner
  - joint_sponsor_name: Name of joint sponsor if applicable
  
  VISA INTERVIEW INFORMATION:
  - interview_location: Consulate/Embassy where interview scheduled
  - interview_date: Scheduled interview date
  - visa_medical_exam_date: Date of medical exam
  - visa_medical_exam_location: Location of medical exam
  
  DOCUMENT INFORMATION:
  - documents_ready: boolean - Are all required documents ready?
  - document_submission_date: When documents were submitted
  - document_approval_date: When documents were approved
  
  PORTAL INFORMATION:
  - ds160_form_number: DS-160 form confirmation number
  - ceac_case_status: Status from Consular Electronic Application Center
  
  APPLICATION DECISIONS:
  - role_in_case: 'petitioner' | 'beneficiary'
  - has_prior_applications: boolean
  - prior_application_context: Description of prior applications
*/
