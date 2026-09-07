-- ============================================================
-- USCIS Case History Table Migration
-- Stores records of USCIS case history for each user
-- ============================================================

CREATE TABLE IF NOT EXISTS uscis_case_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Receipt Details
  receipt_number TEXT NOT NULL,
  status TEXT,
  description TEXT,
  form_type TEXT,
  modified_date TIMESTAMP WITH TIME ZONE,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: Ensure one row per user and receipt number combination
  CONSTRAINT unique_user_receipt
  UNIQUE(user_id, receipt_number)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_uscis_case_history_user_id
ON uscis_case_history(user_id);

CREATE INDEX IF NOT EXISTS idx_uscis_case_history_user_checked
ON uscis_case_history(user_id, checked_at DESC);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_uscis_case_history_updated_at
  BEFORE UPDATE ON uscis_case_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE uscis_case_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own uscis case history
CREATE POLICY "Users can view own uscis case history"
  ON uscis_case_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own uscis case history
CREATE POLICY "Users can insert own uscis case history"
ON uscis_case_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own uscis case history
CREATE POLICY "Users can update own uscis case history"
ON uscis_case_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own uscis case history
CREATE POLICY "Users can delete own uscis case history"
  ON uscis_case_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Comments & Documentation
-- ============================================================
COMMENT ON TABLE uscis_case_history IS 'Table storing records of USCIS case history for each user.';

COMMENT ON COLUMN uscis_case_history.user_id IS 'The user who owns this case history.';

COMMENT ON COLUMN uscis_case_history.receipt_number IS 'The receipt number for the case.';

COMMENT ON COLUMN uscis_case_history.status IS 'The current status of the case.';

COMMENT ON COLUMN uscis_case_history.description IS 'A description of the case.';

COMMENT ON COLUMN uscis_case_history.form_type IS 'The type of form associated with the case.';

COMMENT ON COLUMN uscis_case_history.modified_date IS 'The date when the case was last modified.';

COMMENT ON COLUMN uscis_case_history.checked_at IS 'The date when the case was last checked.';

COMMENT ON COLUMN uscis_case_history.raw_data IS 'Raw data related to the case.';

COMMENT ON COLUMN uscis_case_history.created_at IS 'When the case history record was created.';

COMMENT ON COLUMN uscis_case_history.updated_at IS 'Last update timestamp (auto-updated on any change).';
