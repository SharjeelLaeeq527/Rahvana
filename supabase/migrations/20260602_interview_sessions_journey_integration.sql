-- ============================================================
-- Migration: Interview Prep Sessions - Journey Integration
-- Purpose: Add source and journey_id fields to support
--          hybrid session management (journey-based vs tool-based)
-- ============================================================

-- Step 1: Create source enum type
DO $$ BEGIN
  CREATE TYPE interview_session_source AS ENUM ('journey', 'tool');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create session_status enum type (if not exists)
DO $$ BEGIN
  CREATE TYPE interview_session_status AS ENUM ('ready', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add new columns to interview_prep_sessions
ALTER TABLE interview_prep_sessions
  ADD COLUMN IF NOT EXISTS source interview_session_source NOT NULL DEFAULT 'tool',
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status interview_session_status NOT NULL DEFAULT 'ready';

-- Step 4: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_source 
  ON interview_prep_sessions(source);

CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_journey_id 
  ON interview_prep_sessions(journey_id);

CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_user_source 
  ON interview_prep_sessions(user_id, source);

CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_user_journey 
  ON interview_prep_sessions(user_id, journey_id);

-- Step 5: Create unique constraint - one journey session per user per journey
-- (allows multiple tool sessions but only one journey session per journey)
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS uq_journey_session;

ALTER TABLE interview_prep_sessions
  ADD CONSTRAINT uq_journey_session 
  UNIQUE (user_id, journey_id, source);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN interview_prep_sessions.source IS 
  'Session origin: journey (auto-created from IR-1 journey) or tool (standalone interview prep tool)';

COMMENT ON COLUMN interview_prep_sessions.journey_id IS 
  'FK to journeys table. Only populated for journey-based sessions. NULL for tool-based sessions.';

COMMENT ON COLUMN interview_prep_sessions.status IS 
  'Session lifecycle status: ready (created but not started), in_progress (questionnaire/interview in progress), completed (finished)';

-- Step 7: Update existing records - set all existing sessions to 'tool' source
UPDATE interview_prep_sessions 
SET source = 'tool' 
WHERE source IS NULL;
