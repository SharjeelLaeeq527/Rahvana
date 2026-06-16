-- ============================================================
-- Migration: Interview Session Uniqueness & Lifecycle Update
-- Purpose:
--   1. Replace (user_id, category_slug) uniqueness with
--      (user_id, category_slug, source) to allow coexistence
--   2. Journey sessions are deleted when journey completes/deletes
--      to free the uniqueness slot for future journeys
-- ============================================================

-- Step 1: Drop old unique constraint on (user_id, category_slug)
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS unique_user_category_session;

-- Step 2: Drop old journey-based unique constraint
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS uq_journey_session;

-- Step 3: Add new unique constraint scoped by source
-- Allows: one journey session + one tool session per (user_id, category_slug)
ALTER TABLE interview_prep_sessions
  ADD CONSTRAINT uq_session_user_category_source
  UNIQUE (user_id, category_slug, source);

-- Step 4: Preserve journey_id FK as safety net
-- Journey sessions are explicitly deleted before journey deletion
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS interview_prep_sessions_journey_id_fkey;

ALTER TABLE interview_prep_sessions
  ADD CONSTRAINT interview_prep_sessions_journey_id_fkey
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL;

-- Step 5: Remove archived_at column if previously added (no longer needed)
ALTER TABLE interview_prep_sessions
  DROP COLUMN IF EXISTS archived_at;

-- Step 6: Drop archived index if it exists
DROP INDEX IF EXISTS idx_interview_prep_sessions_archived;

-- Step 7: Update comments
COMMENT ON COLUMN interview_prep_sessions.source IS
  'Session origin: journey (auto-created from IR-1 journey) or tool (standalone interview prep tool)';

COMMENT ON COLUMN interview_prep_sessions.journey_id IS
  'FK to journeys table. Preserved while journey is active. Session deleted when journey completes or is removed.';
