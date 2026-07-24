-- Migration: Add purchase_id column to interview_prep_sessions
-- Purpose: Track purchase association for tool sessions

-- Add purchase_id column (nullable for backward compatibility)
ALTER TABLE interview_prep_sessions
  ADD COLUMN purchase_id UUID DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN interview_prep_sessions.purchase_id IS
  'Links tool sessions to specific purchases. NULL for journey sessions (included with journey) and legacy sessions.';

-- Create index for purchase_id queries
CREATE INDEX idx_interview_prep_sessions_purchase_id 
  ON interview_prep_sessions(purchase_id)
  WHERE purchase_id IS NOT NULL;

-- Create composite index for common queries
CREATE INDEX idx_interview_prep_sessions_user_source_category 
  ON interview_prep_sessions(user_id, source, category_slug);

-- Backfill existing data (all existing sessions get NULL purchase_id)
-- This grandfathers in existing tool sessions
UPDATE interview_prep_sessions
SET purchase_id = NULL
WHERE purchase_id IS NULL;
