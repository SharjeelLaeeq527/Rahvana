-- Main interview prep sessions table
CREATE TABLE interview_prep_sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User (can be nullable for now)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,  -- Store email for reference 
  user_name TEXT,   -- Store name for reference

  -- Case Classification
  category_slug TEXT NOT NULL,  -- e.g., 'ir-1-spouse'

  -- Interview Prep Session Details  
  completed BOOLEAN DEFAULT FALSE,                   -- Session completion status

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL   
);

-- Indexes
CREATE INDEX idx_interview_prep_sessions_user_id ON interview_prep_sessions(user_id);
CREATE INDEX idx_interview_prep_sessions_category_slug ON interview_prep_sessions(category_slug);

-- Updated_at trigger
CREATE TRIGGER set_interview_prep_sessions_updated_at
BEFORE UPDATE ON interview_prep_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
