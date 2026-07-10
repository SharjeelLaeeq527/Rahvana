-- ============================================================
-- Add metadata support to journey steps
-- Stores JSON-driven step UI/tool data from journey config files
-- ============================================================

ALTER TABLE steps
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_steps_metadata_gin
  ON steps USING GIN (metadata);

COMMENT ON COLUMN steps.metadata IS
  'Additional JSON-driven step metadata from journey config files, including actions, document_items, quest_data, filing_data, tool data, branch rules, and relevant tools.';
