-- ============================================================
-- Account Deletion Feedback Table Migration
-- Stores records of account deletion feedback for each user
-- ============================================================

CREATE TABLE IF NOT EXISTS account_deletion_feedback (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Feedback Details
  reason TEXT NOT NULL,

  additional_comments TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Valid deletion reasons
  CONSTRAINT account_deletion_feedback_reason_check
  CHECK (
    reason IN (
      'journey_completed',
      'couldnt_find_needed',
      'missing_features',
      'technical_problem',
      'privacy_security_concern',
      'found_alternative',
      'other'
    )
  )
);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_account_deletion_feedback_user_id
ON account_deletion_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_feedback_created_at
ON account_deletion_feedback(created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE account_deletion_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own account deletion feedback
CREATE POLICY "Users can insert own account deletion feedback"
ON account_deletion_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Comments & Documentation
-- ============================================================

COMMENT ON TABLE account_deletion_feedback IS
'Table storing records of account deletion feedback for each user.';

COMMENT ON COLUMN account_deletion_feedback.user_id IS
'The user who owns this account deletion feedback.';

COMMENT ON COLUMN account_deletion_feedback.reason IS
'The reason provided by the user for account deletion.';

COMMENT ON COLUMN account_deletion_feedback.additional_comments IS
'Any additional comments provided by the user regarding their account deletion.';

COMMENT ON COLUMN account_deletion_feedback.created_at IS
'When the account deletion feedback record was created.';