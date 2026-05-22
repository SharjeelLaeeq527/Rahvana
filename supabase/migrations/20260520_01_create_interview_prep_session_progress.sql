-- ============================================================
-- Interview Prep Session Progress Table
-- Stores adaptive rapid-fire training progress for a session
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_prep_session_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent session
  session_id UUID NOT NULL UNIQUE
    REFERENCES interview_prep_sessions(id) ON DELETE CASCADE,

  -- Round state
  current_round INTEGER NOT NULL DEFAULT 1,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  round_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  retry_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  mastered_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  question_responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  round_summary JSONB,

  -- Scoring and runtime state
  last_round_score INTEGER NOT NULL DEFAULT 0,
  total_rounds_completed INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  time_left INTEGER NOT NULL DEFAULT 10,
  show_answer BOOLEAN NOT NULL DEFAULT FALSE,
  is_flipped BOOLEAN NOT NULL DEFAULT FALSE,
  user_response TEXT,
  skipped_questions INTEGER NOT NULL DEFAULT 0,

  -- Screen / lifecycle
  screen TEXT NOT NULL DEFAULT 'training'
    CHECK (screen IN ('training', 'results', 'completed')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_prep_session_progress_session_id
  ON interview_prep_session_progress(session_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_interview_prep_session_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_interview_prep_session_progress_updated_at
BEFORE UPDATE ON interview_prep_session_progress
FOR EACH ROW
EXECUTE FUNCTION update_interview_prep_session_progress_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE interview_prep_session_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own interview prep progress" ON interview_prep_session_progress;
DROP POLICY IF EXISTS "Users can insert own interview prep progress" ON interview_prep_session_progress;
DROP POLICY IF EXISTS "Users can update own interview prep progress" ON interview_prep_session_progress;
DROP POLICY IF EXISTS "Users can delete own interview prep progress" ON interview_prep_session_progress;

CREATE POLICY "Users can view own interview prep progress"
ON interview_prep_session_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM interview_prep_sessions s
    WHERE s.id = interview_prep_session_progress.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own interview prep progress"
ON interview_prep_session_progress FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM interview_prep_sessions s
    WHERE s.id = interview_prep_session_progress.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own interview prep progress"
ON interview_prep_session_progress FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM interview_prep_sessions s
    WHERE s.id = interview_prep_session_progress.session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM interview_prep_sessions s
    WHERE s.id = interview_prep_session_progress.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own interview prep progress"
ON interview_prep_session_progress FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM interview_prep_sessions s
    WHERE s.id = interview_prep_session_progress.session_id
      AND s.user_id = auth.uid()
  )
);

COMMENT ON TABLE interview_prep_session_progress IS
'Persists adaptive rapid-fire interview progress for resume and round generation.';
