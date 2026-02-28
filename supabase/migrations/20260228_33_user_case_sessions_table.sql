-- Create ENUM for Risk level
DROP TYPE IF EXISTS risk_level CASCADE;;
CREATE TYPE risk_level AS ENUM (
    'PENDING',  -- Risk level not yet determined
    'WEAK',     -- Low risk
    'MODERATE', -- Medium risk
    'STRONG'   -- High risk
);

-- Create ENUM for Case type
DROP TYPE IF EXISTS case_type CASCADE;;
CREATE TYPE case_type AS ENUM (
    'Spouse'     -- Spouse-related case
);

-- Main user case sessions table
CREATE TABLE user_case_sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User (can be nullable for now)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,  -- Store email for reference 
  user_name TEXT,   -- Store name for reference

  -- Case Classification
  case_type case_type NOT NULL,  -- e.g., 'Spouse'

  -- Case Details  
  overall_score DECIMAL(3,2),                        -- Overall risk score
  risk_level risk_level NOT NULL DEFAULT 'PENDING',  -- Risk level classification
  completed BOOLEAN DEFAULT FALSE,                   -- Case completion status

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL   
);

-- Indexes
CREATE INDEX idx_user_case_sessions_user_id ON user_case_sessions(user_id);
CREATE INDEX idx_user_case_sessions_case_type ON user_case_sessions(case_type);
CREATE INDEX idx_user_case_sessions_risk_level ON user_case_sessions(risk_level);

-- Updated_at trigger
CREATE TRIGGER set_user_case_sessions_updated_at
BEFORE UPDATE ON user_case_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN user_case_sessions.overall_score IS 'Overall risk score (0-100) calculated based on user inputs';
COMMENT ON COLUMN user_case_sessions.risk_level IS 'Risk level classification (PENDING, WEAK, MODERATE, STRONG) based on overall score';