-- ============================================================
-- Visa Journey Roadmap: Steps Table
-- Individual action items within chapters
-- ============================================================

CREATE TABLE IF NOT EXISTS steps (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  
  -- Step Metadata
  step_key TEXT NOT NULL, -- 'step_1_1', 'step_1_2', etc.
  step_number INTEGER NOT NULL, -- Sequential within chapter
  step_name TEXT NOT NULL, -- e.g., "Complete I-130 Form"
  step_description TEXT, -- Detailed description of what to do
  
  -- Step Type (determines which tool/form to show)
  step_type TEXT NOT NULL DEFAULT 'form_fillable', -- 'form_fillable', 'document_upload', 'form_submit', 'awaiting_response', 'appointment_scheduling', 'informational', 'review', 'decision'
  
  -- Tool Integration
  tool_integration TEXT, -- Which tool to launch ('autofill_i130', 'interview_prep', 'case_strength', etc.)
  tool_key TEXT, -- Unique key to identify tool in integrations
  
  -- Dependencies & Visibility
  dependencies JSONB DEFAULT '[]'::jsonb, -- [step_ids] that must be completed first
  visible_when JSONB DEFAULT '{}'::jsonb, -- Conditions for step visibility (e.g., {"filing_method": "online", "sponsor_structure": "individual"})
  visibility_rules TEXT, -- Human-readable description of visibility rules
  
  -- Step Progress
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped'
  substatus TEXT, -- More detailed status (e.g., 'awaiting_uscis_response', 'document_rejected')
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100
  
  -- Display & Ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_required BOOLEAN NOT NULL DEFAULT TRUE, -- Can step be skipped?
  
  -- Estimated Duration
  estimated_duration_days INTEGER, -- How many days this step typically takes
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE, -- Optional target date for completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: step_key unique per chapter
  UNIQUE(chapter_id, step_key)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_steps_chapter_id 
  ON steps(chapter_id);

CREATE INDEX IF NOT EXISTS idx_steps_status 
  ON steps(status);

CREATE INDEX IF NOT EXISTS idx_steps_chapter_status 
  ON steps(chapter_id, status);

CREATE INDEX IF NOT EXISTS idx_steps_display_order 
  ON steps(chapter_id, display_order);

CREATE INDEX IF NOT EXISTS idx_steps_tool_integration 
  ON steps(tool_integration);

CREATE INDEX IF NOT EXISTS idx_steps_is_visible 
  ON steps(is_visible);

CREATE INDEX IF NOT EXISTS idx_steps_created_at 
  ON steps(created_at DESC);

-- GIN index for fast JSONB queries on dependencies and visibility
CREATE INDEX IF NOT EXISTS idx_steps_dependencies_gin 
  ON steps USING GIN (dependencies);

CREATE INDEX IF NOT EXISTS idx_steps_visible_when_gin 
  ON steps USING GIN (visible_when);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_steps_updated_at
  BEFORE UPDATE ON steps
  FOR EACH ROW
  EXECUTE FUNCTION update_steps_updated_at();

-- ============================================================
-- Update Chapter Progress When Step Changes
-- Recalculate chapter completion percentage whenever a step is updated
-- ============================================================
CREATE OR REPLACE FUNCTION update_chapter_progress_on_step_change()
RETURNS TRIGGER AS $$
DECLARE
  chapter_id UUID;
  total_steps INTEGER;
  completed_steps INTEGER;
  completion_pct DECIMAL(5,2);
BEGIN
  -- Get chapter_id
  chapter_id := NEW.chapter_id;
  
  -- Count total and completed steps in this chapter
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_steps, completed_steps
  FROM steps
  WHERE steps.chapter_id = chapter_id;
  
  -- Calculate percentage
  completion_pct := CASE WHEN total_steps > 0 THEN (completed_steps::DECIMAL / total_steps) * 100 ELSE 0 END;
  
  -- Update chapter
  UPDATE chapters
  SET 
    completed_steps_count = completed_steps,
    total_steps_count = total_steps,
    completion_percentage = completion_pct,
    status = CASE 
      WHEN completed_steps = total_steps AND total_steps > 0 THEN 'completed'
      WHEN completed_steps > 0 THEN 'in_progress'
      ELSE 'not_started'
    END
  WHERE id = chapter_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_chapter_progress
  AFTER UPDATE ON steps
  FOR EACH ROW
  EXECUTE FUNCTION update_chapter_progress_on_step_change();

-- ============================================================
-- Update Journey Progress When Step Changes
-- Recalculate journey completion whenever a step is updated
-- ============================================================
CREATE OR REPLACE FUNCTION update_journey_progress_on_step_change()
RETURNS TRIGGER AS $$
DECLARE
  journey_id UUID;
  total_steps INTEGER;
  completed_steps INTEGER;
  completion_pct DECIMAL(5,2);
BEGIN
  -- Get journey_id through chapter
  SELECT c.journey_id INTO journey_id
  FROM chapters c
  WHERE c.id = NEW.chapter_id;
  
  -- Count total and completed steps in entire journey
  SELECT COUNT(*), COUNT(*) FILTER (WHERE s.status = 'completed')
  INTO total_steps, completed_steps
  FROM steps s
  JOIN chapters c ON s.chapter_id = c.id
  WHERE c.journey_id = journey_id;
  
  -- Calculate percentage
  completion_pct := CASE WHEN total_steps > 0 THEN (completed_steps::DECIMAL / total_steps) * 100 ELSE 0 END;
  
  -- Update journey
  UPDATE journeys
  SET 
    completed_steps_count = completed_steps,
    total_steps_count = total_steps,
    completion_percentage = completion_pct,
    status = CASE 
      WHEN completed_steps = total_steps AND total_steps > 0 THEN 'completed'
      WHEN completed_steps > 0 THEN 'in_progress'
      ELSE 'not_started'
    END
  WHERE id = journey_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_journey_progress
  AFTER UPDATE ON steps
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_progress_on_step_change();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- Users can view steps from their own chapters
CREATE POLICY "Users can view own journey steps"
  ON steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN journeys j ON c.journey_id = j.id
      WHERE c.id = steps.chapter_id
      AND j.user_id = auth.uid()
    )
  );

-- Users can insert steps for their own chapters
CREATE POLICY "Users can insert own journey steps"
  ON steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN journeys j ON c.journey_id = j.id
      WHERE c.id = steps.chapter_id
      AND j.user_id = auth.uid()
    )
  );

-- Users can update steps in their own chapters
CREATE POLICY "Users can update own journey steps"
  ON steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN journeys j ON c.journey_id = j.id
      WHERE c.id = steps.chapter_id
      AND j.user_id = auth.uid()
    )
  );

-- Users can delete steps in their own chapters
CREATE POLICY "Users can delete own journey steps"
  ON steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN journeys j ON c.journey_id = j.id
      WHERE c.id = steps.chapter_id
      AND j.user_id = auth.uid()
    )
  );

-- Admins can manage all steps
CREATE POLICY "Admins can view all steps"
  ON steps FOR SELECT
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
COMMENT ON TABLE steps IS 'Individual steps/actions within a chapter. Each step represents a specific task (form filling, document upload, etc.) in the immigration journey.';

COMMENT ON COLUMN steps.step_key IS 'Unique identifier for step (e.g., step_1_1_petition_form)';

COMMENT ON COLUMN steps.step_type IS 'Categorizes step behavior: form_fillable (form to fill), document_upload, form_submit, awaiting_response (USCIS processing), appointment_scheduling, informational, review, decision';

COMMENT ON COLUMN steps.tool_integration IS 'Identifies which external tool to integrate (e.g., autofill_i130, interview_prep, case_strength)';

COMMENT ON COLUMN steps.dependencies IS 'JSON array of step IDs that must be completed before this step becomes available';

COMMENT ON COLUMN steps.visible_when IS 'JSON conditions for step visibility (e.g., {"filing_method": "online"} means step only shows if filing method is online)';

COMMENT ON COLUMN steps.status IS 'Progress status: not_started, in_progress, completed, blocked (dependencies not met), skipped (user chose not to do it)';

COMMENT ON COLUMN steps.substatus IS 'Additional detail on status (e.g., awaiting_uscis_response, document_rejected for context)';

COMMENT ON COLUMN steps.estimated_duration_days IS 'Estimated number of days for user to complete this step (for planning purposes)';

COMMENT ON COLUMN steps.due_date IS 'Optional target completion date (e.g., filing deadline)';
