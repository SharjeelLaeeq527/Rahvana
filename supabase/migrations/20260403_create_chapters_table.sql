-- ============================================================
-- Visa Journey Roadmap: Chapters Table
-- Organizes steps into chapters (Chapter I: Petition, II: NVC, III: Medical+Interview)
-- ============================================================

CREATE TABLE IF NOT EXISTS chapters (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  
  -- Chapter Metadata
  chapter_key TEXT NOT NULL, -- 'chapter_1', 'chapter_2', 'chapter_3'
  chapter_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  chapter_name TEXT NOT NULL, -- 'Chapter I: USCIS Petition', 'Chapter II: NVC Processing', etc.
  chapter_description TEXT, -- Detailed description of what happens in this chapter
  
  -- Chapter Progress
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  completed_steps_count INTEGER NOT NULL DEFAULT 0,
  total_steps_count INTEGER NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100
  
  -- Display & Ordering
  display_order INTEGER NOT NULL DEFAULT 0, -- Order to display chapters (1, 2, 3, etc.)
  is_visible BOOLEAN NOT NULL DEFAULT TRUE, -- Can be hidden based on conditions
  
  -- Visibility Conditions (JSON)
  visible_when JSONB DEFAULT '{}'::jsonb, -- e.g., {"filing_method": "online"} - conditions for visibility
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: chapter_key unique per journey
  UNIQUE(journey_id, chapter_key)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_chapters_journey_id 
  ON chapters(journey_id);

CREATE INDEX IF NOT EXISTS idx_chapters_status 
  ON chapters(status);

CREATE INDEX IF NOT EXISTS idx_chapters_journey_status 
  ON chapters(journey_id, status);

CREATE INDEX IF NOT EXISTS idx_chapters_display_order 
  ON chapters(journey_id, display_order);

CREATE INDEX IF NOT EXISTS idx_chapters_created_at 
  ON chapters(created_at DESC);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_chapters_updated_at();

-- ============================================================
-- Automatic Completion Trigger
-- When all steps in chapter are completed, mark chapter as completed
-- ============================================================
CREATE OR REPLACE FUNCTION auto_complete_chapter()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all steps in this chapter are completed
  IF (SELECT COUNT(*) FROM steps WHERE chapter_id = NEW.chapter_id AND status != 'completed') = 0 THEN
    UPDATE chapters
    SET status = 'completed', completed_at = NOW()
    WHERE id = NEW.chapter_id AND status != 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger will be created in steps migration once steps table exists
-- CREATE TRIGGER trg_auto_complete_chapter
--   AFTER UPDATE ON steps
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_complete_chapter();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Users can view chapters from their own journeys
CREATE POLICY "Users can view own journey chapters"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = chapters.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Users can insert chapters for their own journeys
CREATE POLICY "Users can insert own journey chapters"
  ON chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = chapters.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Users can update chapters from their own journeys
CREATE POLICY "Users can update own journey chapters"
  ON chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = chapters.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Users can delete chapters from their own journeys
CREATE POLICY "Users can delete own journey chapters"
  ON chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = chapters.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

-- Admins can manage all chapters
CREATE POLICY "Admins can view all chapters"
  ON chapters FOR SELECT
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
COMMENT ON TABLE chapters IS 'Chapters organize steps in a journey. E.g., Chapter I: Petition, Chapter II: NVC, Chapter III: Medical & Interview (visa type specific).';

COMMENT ON COLUMN chapters.chapter_key IS 'Unique identifier for chapter (e.g., chapter_1, chapter_2)';

COMMENT ON COLUMN chapters.chapter_number IS 'Sequential chapter number (1, 2, 3, etc.)';

COMMENT ON COLUMN chapters.chapter_name IS 'User-friendly chapter name (e.g., "Chapter I: USCIS Petition")';

COMMENT ON COLUMN chapters.chapter_description IS 'Detailed description of what user will accomplish in this chapter';

COMMENT ON COLUMN chapters.status IS 'Chapter progress status: not_started, in_progress, or completed';

COMMENT ON COLUMN chapters.completion_percentage IS 'Percentage of steps completed in this chapter (0-100)';

COMMENT ON COLUMN chapters.visible_when IS 'JSON conditions determining when chapter is visible (e.g., filing_method, sponsor_type)';

COMMENT ON COLUMN chapters.started_at IS 'When user first started working on this chapter';

COMMENT ON COLUMN chapters.completed_at IS 'When user completed all steps in this chapter';
