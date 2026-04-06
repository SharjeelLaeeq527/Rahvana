-- ============================================================
-- Migration: tool_sessions
-- Developer: Hashir (Developer B - Supporting Features)
-- Purpose: Saves and resumes tool state for IR-1 Roadmap tools.
--          When a user opens the I-130 AutoFormFiller or Affidavit
--          Support Calculator, their progress is saved here so they
--          can leave and come back without losing work.
--
-- References:
--   - journeys.id (Hammad's table)
--   - steps.step_key (logical reference only, not FK to avoid tight coupling)
--
-- Tools that use this table:
--   - form_filler_i130        → Step I.4
--   - affidavit_calculator    → Step II.5
--   - ds260_prep              → Step II.3
--   - interview_prep          → Step III.3
--   - case_strength_checker   → Dashboard
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create the tool_sessions table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tool_sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Journey reference (FK to journeys table - Hammad's)
  journey_id UUID NOT NULL,

  -- Which roadmap step this tool session belongs to
  -- Examples: 'I.4', 'II.3', 'II.5', 'III.3'
  -- Logical reference — matches steps.step_key from Hammad's table
  step_key VARCHAR(20) NOT NULL,

  -- Identifies which tool this session is for
  -- Examples: 'form_filler_i130', 'affidavit_calculator', 'ds260_prep', 'interview_prep'
  tool_key VARCHAR(100) NOT NULL,

  -- Full serialized state of the tool at time of last save
  -- Structure varies by tool, e.g.:
  --   I-130: { "currentPage": 5, "formAnswers": { "petitionerName": "John", ... } }
  --   Affidavit: { "currentStep": 2, "householdSize": 3, "income": 65000, ... }
  session_state JSONB,

  -- How far through the tool the user is (0-100)
  completion_percentage INT NOT NULL DEFAULT 0,

  -- Has the user fully completed and submitted this tool?
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Final output stored after tool completion
  -- Structure varies by tool, e.g.:
  --   I-130: { "pdfUrl": "https://...", "formData": {...} }
  --   Affidavit: { "sponsorStructure": "with_joint_sponsor", "formsNeeded": ["I-864", "I-864A"] }
  tool_output JSONB,

  -- When user first started this tool
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- When state was last saved (auto-saves frequently while tool is open)
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- When tool was marked fully complete
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 2: Add UNIQUE constraint
-- Only ONE session per tool per step per journey
-- (Prevents duplicate sessions; use UPSERT on this constraint)
-- ────────────────────────────────────────────────────────────

ALTER TABLE tool_sessions
  ADD CONSTRAINT uq_tool_sessions_journey_step_tool
    UNIQUE (journey_id, step_key, tool_key);

-- ────────────────────────────────────────────────────────────
-- STEP 3: Add CHECK constraints
-- ────────────────────────────────────────────────────────────

ALTER TABLE tool_sessions
  ADD CONSTRAINT chk_completion_percentage_range
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE tool_sessions
  ADD CONSTRAINT chk_completed_at_requires_is_completed
    CHECK (completed_at IS NULL OR is_completed = TRUE);

ALTER TABLE tool_sessions
  ADD CONSTRAINT chk_completion_means_100_percent
    CHECK (is_completed = FALSE OR completion_percentage = 100);

-- ────────────────────────────────────────────────────────────
-- STEP 4: Create indexes for performance
-- ────────────────────────────────────────────────────────────

-- Fast lookup: get specific tool session for a journey (most common - resume flow)
CREATE INDEX IF NOT EXISTS idx_tool_sessions_journey_tool
  ON tool_sessions(journey_id, tool_key);

-- Fast lookup: get session for specific step+tool
CREATE INDEX IF NOT EXISTS idx_tool_sessions_journey_step_tool
  ON tool_sessions(journey_id, step_key, tool_key);

-- Fast lookup: find all incomplete sessions for a journey (dashboard resume CTAs)
CREATE INDEX IF NOT EXISTS idx_tool_sessions_journey_incomplete
  ON tool_sessions(journey_id, is_completed)
  WHERE is_completed = FALSE;

-- Fast lookup: recently saved sessions (for "resume" ordering)
CREATE INDEX IF NOT EXISTS idx_tool_sessions_last_saved
  ON tool_sessions(journey_id, last_saved_at DESC);

-- ────────────────────────────────────────────────────────────
-- STEP 5: Auto-update timestamps
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_tool_sessions_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_saved_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tool_sessions_updated_at
  BEFORE UPDATE ON tool_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_sessions_timestamps();

-- ────────────────────────────────────────────────────────────
-- STEP 6: Enable Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE tool_sessions ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- STEP 7: RLS Policies
-- ────────────────────────────────────────────────────────────

-- Policy: Users can view their own tool sessions
CREATE POLICY "tool_sessions_select_own"
  ON tool_sessions
  FOR SELECT
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert tool sessions for their own journeys
CREATE POLICY "tool_sessions_insert_own"
  ON tool_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own tool sessions
CREATE POLICY "tool_sessions_update_own"
  ON tool_sessions
  FOR UPDATE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own tool sessions (rare - e.g., restart tool)
CREATE POLICY "tool_sessions_delete_own"
  ON tool_sessions
  FOR DELETE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role has full access (backend calls use this)
CREATE POLICY "tool_sessions_service_role_all"
  ON tool_sessions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ────────────────────────────────────────────────────────────
-- STEP 8: Add comments
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE tool_sessions IS
  'Saves and resumes tool progress for IR-1 Roadmap tools (I-130, Affidavit Calculator, etc).
   One session per tool per step per journey. Use UPSERT on (journey_id, step_key, tool_key).
   Developer: Hashir | Migration: 20260403_02';

COMMENT ON COLUMN tool_sessions.step_key IS 'Roadmap step key. Logical reference to steps.step_key (Hammad). E.g. I.4, II.5';
COMMENT ON COLUMN tool_sessions.tool_key IS 'Tool identifier: form_filler_i130 | affidavit_calculator | ds260_prep | interview_prep | case_strength_checker';
COMMENT ON COLUMN tool_sessions.session_state IS 'Full tool state as JSONB. Structure is tool-specific. Updated on every auto-save.';
COMMENT ON COLUMN tool_sessions.tool_output IS 'Final output after tool completion. E.g. PDF URL, sponsor structure, form data.';
COMMENT ON COLUMN tool_sessions.completion_percentage IS 'Progress 0-100. Must be 100 when is_completed = true.';
COMMENT ON COLUMN tool_sessions.last_saved_at IS 'Auto-updated on every PATCH. Used for "resume" recency ordering.';
