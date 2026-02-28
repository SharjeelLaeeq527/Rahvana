-- ============================================================
-- User Journey Progress Table
-- Stores immigration journey progress for logged-in users
-- ============================================================

CREATE TABLE IF NOT EXISTS user_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which journey (e.g., 'ir1', 'ir5', 'f1', etc.)
  journey_id TEXT NOT NULL,

  -- Current position in the wizard
  current_stage INTEGER NOT NULL DEFAULT 0,
  current_step INTEGER NOT NULL DEFAULT 0,

  -- Completed steps stored as JSON array of step IDs
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Collapsed steps state
  collapsed_steps JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- User preferences
  role TEXT NOT NULL DEFAULT 'both',         -- 'both' | 'petitioner' | 'beneficiary'
  filing_type TEXT NOT NULL DEFAULT 'online', -- 'online' | 'paper' | 'both'

  -- Document checklist (checked/unchecked)
  document_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Notes per document
  notes JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Whether user has formally started (vs just opened the page)
  started BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One active journey per user per journey type
  UNIQUE(user_id, journey_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_ujp_user_id ON user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ujp_journey_id ON user_journey_progress(journey_id);
CREATE INDEX IF NOT EXISTS idx_ujp_user_journey ON user_journey_progress(user_id, journey_id);

-- Auto-update last_updated_at on any change
CREATE OR REPLACE FUNCTION update_ujp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ujp_updated_at
  BEFORE UPDATE ON user_journey_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_ujp_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE user_journey_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own journey progress
CREATE POLICY "Users can view own journey progress"
  ON user_journey_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own journey progress
CREATE POLICY "Users can insert own journey progress"
  ON user_journey_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own journey progress
CREATE POLICY "Users can update own journey progress"
  ON user_journey_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own journey progress (for "Start Fresh")
CREATE POLICY "Users can delete own journey progress"
  ON user_journey_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all journey progress
CREATE POLICY "Admins can view all journey progress"
  ON user_journey_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
