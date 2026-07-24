-- Migration: Update foreign key to cascade delete interview sessions
-- Purpose: Clean up interview sessions when journey is deleted

-- Drop existing foreign key constraint
ALTER TABLE interview_prep_sessions
  DROP CONSTRAINT IF EXISTS interview_prep_sessions_journey_id_fkey;

-- Add new foreign key with CASCADE delete
ALTER TABLE interview_prep_sessions
  ADD CONSTRAINT interview_prep_sessions_journey_id_fkey
  FOREIGN KEY (journey_id)
  REFERENCES journeys(id)
  ON DELETE CASCADE;

-- Add comment
COMMENT ON CONSTRAINT interview_prep_sessions_journey_id_fkey 
  ON interview_prep_sessions IS
  'Cascades delete to interview sessions when journey is deleted. Journey sessions are free and tied to journey lifecycle.';
