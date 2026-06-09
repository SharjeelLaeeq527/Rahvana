-- ============================================================
-- Migration: Interview Session Uniqueness & Lifecycle Update
-- Purpose: 
--   1. Replace (user_id, category_slug) uniqueness with 
--      (user_id, category_slug, source) to allow coexistence
--   2. Preserve journey_id for historical tracking
--   3. Add archived_at timestamp for lifecycle management
-- ============================================================

-- Step 1: Drop old unique constraint on (user_id, category_slug)
-- This was added to enforce one session per user per category
-- We now allow one per user per category per SOURCE
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS unique_user_category_session;

-- Step 2: Drop old journey-based unique constraint
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS uq_journey_session;

-- Step 3: Add new unique constraint scoped by source
-- Allows: one journey session + one tool session per (user_id, category_slug)
-- Prevents: two tool sessions or two journey sessions for same (user_id, category_slug)
ALTER TABLE interview_prep_sessions
  ADD CONSTRAINT uq_session_user_category_source 
  UNIQUE (user_id, category_slug, source);

-- Step 4: Change journey_id FK to NOT cascade delete
-- Preserve historical relationship when journey is deleted
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS interview_prep_sessions_journey_id_fkey;

ALTER TABLE interview_prep_sessions
  ADD CONSTRAINT interview_prep_sessions_journey_id_fkey
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL;

-- Step 5: Add archived_at column for lifecycle tracking
-- Set when a journey-linked session is deactivated after journey completion
ALTER TABLE interview_prep_sessions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN interview_prep_sessions.archived_at IS 
  'Timestamp when session was archived (e.g., journey completed). NULL means active.';

-- Step 6: Update comments
COMMENT ON COLUMN interview_prep_sessions.journey_id IS 
  'FK to journeys table. Preserved for historical tracking even after journey completion. Only NULL for tool-based sessions.';

-- Step 7: Add index for archived sessions lookup
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_archived
  ON interview_prep_sessions(archived_at) WHERE archived_at IS NOT NULL;
