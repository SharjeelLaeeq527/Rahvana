-- Migration: Interview Prep Sessions Candidate Scoping
-- Purpose:
--   1. Add candidate_id column to interview_prep_sessions table to attribute sessions
--      to specific beneficiaries (e.g. candidate-1 for Mother, candidate-2 for Father).
--   2. Backfill existing records from journeys table when suffixed by candidate.
--   3. Create indexes on (user_id, candidate_id) and (user_id, candidate_id, category_slug) for fast queries.

-- Step 1: Add candidate_id column if not exists
ALTER TABLE public.interview_prep_sessions
  ADD COLUMN IF NOT EXISTS candidate_id TEXT DEFAULT 'candidate-1';

-- Step 2: Backfill existing journey sessions from journeys table where candidate suffix exists
UPDATE public.interview_prep_sessions s
SET candidate_id = CASE
  WHEN j.journey_type ~* 'candidate-?([0-9]+)' THEN 'candidate-' || substring(j.journey_type from '(?i)candidate-?([0-9]+)')
  ELSE 'candidate-1'
END
FROM public.journeys j
WHERE s.journey_id = j.id AND (s.candidate_id IS NULL OR s.candidate_id = 'candidate-1');

-- Step 3: Backfill any remaining NULLs to 'candidate-1'
UPDATE public.interview_prep_sessions
SET candidate_id = 'candidate-1'
WHERE candidate_id IS NULL;

-- Step 4: Add column comment
COMMENT ON COLUMN public.interview_prep_sessions.candidate_id IS
'Identifies which candidate/beneficiary this interview session belongs to (e.g. candidate-1, candidate-2). Defaults to candidate-1.';

-- Step 5: Add index for user + candidate queries
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_user_candidate
  ON public.interview_prep_sessions (user_id, candidate_id);

-- Step 6: Add index for user + candidate + category lookups
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_user_cand_cat
  ON public.interview_prep_sessions (user_id, candidate_id, category_slug);
