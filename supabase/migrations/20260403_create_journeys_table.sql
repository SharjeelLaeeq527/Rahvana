-- ============================================================
-- Visa Journey Roadmap: Journeys Table
-- Stores the main journey entry for each user's immigration case
-- ============================================================

CREATE TABLE IF NOT EXISTS journeys (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Journey Classification
  journey_type TEXT NOT NULL DEFAULT 'IR1', -- 'IR1', 'IR2', 'IR5', 'F1', etc.
  
  -- Case Information
  case_id TEXT UNIQUE, -- Optional: External case ID for reference
  
  -- Filing Details
  filing_method TEXT NOT NULL DEFAULT 'online', -- 'online' | 'paper'
  sponsor_structure TEXT NOT NULL DEFAULT 'individual', -- 'individual' | 'joint_sponsor'
  
  -- Journey Progress
  current_chapter_id UUID, -- Reference to current chapter (nullable until started)
  current_step_id UUID, -- Reference to current step (nullable until started)
  
  -- Journey Status
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed' | 'paused'
  
  -- Progress Tracking
  completed_steps_count INTEGER NOT NULL DEFAULT 0,
  total_steps_count INTEGER NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: One active journey per user per type
  UNIQUE(user_id, journey_type)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_journeys_user_id 
  ON journeys(user_id);

CREATE INDEX IF NOT EXISTS idx_journeys_status 
  ON journeys(status);

CREATE INDEX IF NOT EXISTS idx_journeys_user_status 
  ON journeys(user_id, status);

CREATE INDEX IF NOT EXISTS idx_journeys_journey_type 
  ON journeys(journey_type);

CREATE INDEX IF NOT EXISTS idx_journeys_created_at 
  ON journeys(created_at DESC);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_journeys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_journeys_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

-- Users can view their own journeys
CREATE POLICY "Users can view own journeys"
  ON journeys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own journeys
CREATE POLICY "Users can insert own journeys"
  ON journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own journeys
CREATE POLICY "Users can update own journeys"
  ON journeys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own journeys
CREATE POLICY "Users can delete own journeys"
  ON journeys FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all journeys
CREATE POLICY "Admins can view all journeys"
  ON journeys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Comments & Documentation
-- ============================================================
COMMENT ON TABLE journeys IS 'Main journey table storing user progression through IR-1 roadmap. Each user can have one active journey per journey type.';

COMMENT ON COLUMN journeys.journey_type IS 'Type of immigration journey (IR1, IR2, F1, etc.)';

COMMENT ON COLUMN journeys.filing_method IS 'Method of filing application: online or paper (affects step visibility)';

COMMENT ON COLUMN journeys.sponsor_structure IS 'Whether petition is filed by individual or joint sponsor (affects step visibility and requirements)';

COMMENT ON COLUMN journeys.current_chapter_id IS 'Currently active chapter. Updated as user progresses through steps.';

COMMENT ON COLUMN journeys.current_step_id IS 'Currently active step within the chapter.';

COMMENT ON COLUMN journeys.status IS 'Journey status: not_started (user opened but didn''t begin), in_progress (actively working), completed (all steps done), paused (saved for later)';

COMMENT ON COLUMN journeys.completion_percentage IS 'Overall progress percentage (0-100) calculated as completed_steps_count / total_steps_count * 100';

COMMENT ON COLUMN journeys.started_at IS 'When user formally started the journey (first step interaction)';

COMMENT ON COLUMN journeys.created_at IS 'When journey record was created';

COMMENT ON COLUMN journeys.updated_at IS 'Last update timestamp (auto-updated on any change)';
