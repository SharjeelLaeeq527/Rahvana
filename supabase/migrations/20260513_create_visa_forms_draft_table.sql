-- ============================================================
-- Visa Forms Draft Table
-- Stores in-progress visa form drafts for authenticated users
-- ============================================================

CREATE TABLE IF NOT EXISTS visa_forms_draft (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  -- Form Metadata
  form_code TEXT NOT NULL,

  -- Used later if same form exists across multiple journeys/cases
  journey_key TEXT NOT NULL DEFAULT 'global',

  -- Draft State
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  current_step INTEGER NOT NULL DEFAULT 1,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  view_mode TEXT NOT NULL DEFAULT 'form',
  progressive_sub_question_indices JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Used for future schema evolution
  config_version TEXT NOT NULL DEFAULT 'v1',
  
  -- Completion State
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
);

-- ============================================================
-- Table Comments
-- ============================================================

COMMENT ON TABLE visa_forms_draft IS
'Stores autosaved visa form drafts and progress state for users.';

COMMENT ON COLUMN visa_forms_draft.payload IS
'JSON snapshot of all form answers and temporary form state.';

COMMENT ON COLUMN visa_forms_draft.progressive_sub_question_indices IS
'Tracks progressive sub-question visibility indexes for conditional flows.';

COMMENT ON COLUMN visa_forms_draft.journey_key IS
'Logical grouping key for supporting multiple journeys/cases per form.';

COMMENT ON COLUMN visa_forms_draft.config_version IS
'Version of frontend form configuration used when saving the draft.';

COMMENT ON COLUMN visa_forms_draft.completed IS
'Whether the form draft has been finalized/completed.';

-- ============================================================
-- Performance Indexes
-- ============================================================

-- One draft per user/form/journey
CREATE UNIQUE INDEX IF NOT EXISTS visa_form_drafts_unique_idx
  ON visa_forms_draft (
    user_id,
    form_code,
    journey_key
  );

-- Fast user dashboard queries
CREATE INDEX IF NOT EXISTS visa_form_drafts_user_idx
  ON visa_forms_draft (
    user_id,
    updated_at DESC
  );

-- Fast form analytics/admin filtering
CREATE INDEX IF NOT EXISTS visa_form_drafts_form_idx
  ON visa_forms_draft (
    form_code,
    updated_at DESC
  );

-- Optional but useful for cleanup jobs
CREATE INDEX IF NOT EXISTS visa_form_drafts_completed_idx
  ON visa_forms_draft (
    completed,
    updated_at DESC
  );

-- ============================================================
-- Update Trigger Function
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Update Trigger
-- ============================================================

DROP TRIGGER IF EXISTS trg_visa_form_drafts_updated_at
ON visa_forms_draft;

CREATE TRIGGER trg_visa_form_drafts_updated_at
BEFORE UPDATE
ON visa_forms_draft
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Enable Row Level Security
-- ============================================================

ALTER TABLE visa_forms_draft
ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- SELECT
DROP POLICY IF EXISTS "Users can view their own visa drafts"
ON visa_forms_draft;

CREATE POLICY "Users can view their own visa drafts"
ON visa_forms_draft
FOR SELECT
USING (
  auth.uid() = user_id
);

-- INSERT
DROP POLICY IF EXISTS "Users can create their own visa drafts"
ON visa_forms_draft;

CREATE POLICY "Users can create their own visa drafts"
ON visa_forms_draft
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE
DROP POLICY IF EXISTS "Users can update their own visa drafts"
ON visa_forms_draft;

CREATE POLICY "Users can update their own visa drafts"
ON visa_forms_draft
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- DELETE
DROP POLICY IF EXISTS "Users can delete their own visa drafts"
ON visa_forms_draft;

CREATE POLICY "Users can delete their own visa drafts"
ON visa_forms_draft
FOR DELETE
USING (
  auth.uid() = user_id
);
