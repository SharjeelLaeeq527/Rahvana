-- Main interview prep results table
CREATE TABLE interview_prep_results (
    -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session Id
  session_id UUID NOT NULL UNIQUE
    REFERENCES interview_prep_sessions(id) ON DELETE CASCADE,

  -- Generated interview content
  generated_questions JSONB NOT NULL,
  
--   Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE interview_prep_results IS
'Stores generated interview questions and suggested answers so users can revisit and practice without regenerating.';
