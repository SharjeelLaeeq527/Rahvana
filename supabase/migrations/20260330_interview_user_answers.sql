-- Create table for user answers
CREATE TABLE interview_user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  session_id UUID NOT NULL REFERENCES interview_prep_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,  
  
  -- User-written answer
  user_answer_text TEXT,  -- User's typed answer
  
  -- AI improvement tracking
  ai_improvements JSONB DEFAULT '[]'::jsonb,  -- Array of { original, improved, type, accepted }
  
  -- Status tracking
  status TEXT DEFAULT 'draft',  
  confidence_score INT,  
  
  -- Metadata
  word_count INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one answer per question per session
  UNIQUE(session_id, question_id),
  
  -- Indexes
  CREATE INDEX idx_interview_user_answers_session ON interview_user_answers(session_id);
  CREATE INDEX idx_interview_user_answers_created ON interview_user_answers(created_at DESC);
);

-- Add trigger for updated_at
CREATE TRIGGER set_interview_user_answers_updated_at
BEFORE UPDATE ON interview_user_answers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY 
ALTER TABLE interview_user_answers ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own answers" ON interview_user_answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON interview_user_answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON interview_user_answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON interview_user_answers;

-- POLICY 1: SELECT - Users can only see answers from THEIR sessions
CREATE POLICY "Users can view their own answers" ON interview_user_answers
  FOR SELECT
  USING (
    -- Security: Only show answers from sessions owned by logged-in user
    session_id IN (
      SELECT id FROM interview_prep_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- POLICY 2: INSERT - Users can only add answers to THEIR sessions
CREATE POLICY "Users can insert their own answers" ON interview_user_answers
  FOR INSERT
  WITH CHECK (
    -- Security: Only allow insert if session belongs to logged-in user
    session_id IN (
      SELECT id FROM interview_prep_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- POLICY 3: UPDATE - Users can only edit answers from THEIR sessions
CREATE POLICY "Users can update their own answers" ON interview_user_answers
  FOR UPDATE
  USING (
    -- Current row must belong to user's session
    session_id IN (
      SELECT id FROM interview_prep_sessions 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- New values must also stay in user's session (prevent reassignment)
    session_id IN (
      SELECT id FROM interview_prep_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- POLICY 4: DELETE - Users can DELETE answers from THEIR sessions only
CREATE POLICY "Users can delete their own answers" ON interview_user_answers
  FOR DELETE
  USING (
    -- Security: Only allow delete if answer was created by this user
    session_id IN (
      SELECT id FROM interview_prep_sessions 
      WHERE user_id = auth.uid()
    )
  );