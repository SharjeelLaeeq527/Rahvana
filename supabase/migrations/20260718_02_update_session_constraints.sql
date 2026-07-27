-- Migration: Update uniqueness constraints for interview prep sessions
-- Purpose: Allow multiple tool sessions per category (validated via purchase logic)
--          Maintain one session per journey

-- Drop old constraint that limited one tool session per category
ALTER TABLE interview_prep_sessions
DROP CONSTRAINT IF EXISTS uq_session_user_category_source;

-- Remove old index if it exists
DROP INDEX IF EXISTS uq_journey_session_per_journey;

-- Create partial unique index
CREATE UNIQUE INDEX uq_journey_session_per_journey
ON interview_prep_sessions (user_id, journey_id)
WHERE journey_id IS NOT NULL;

-- Add comment
COMMENT ON INDEX uq_journey_session_per_journey IS
'Ensures one interview session per journey. Tool sessions have NULL journey_id and are excluded.';
