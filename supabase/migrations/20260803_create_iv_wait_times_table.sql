-- ============================================================================
-- Table: iv_wait_times
--
-- Stores the latest Immigrant Visa (IV) wait time data scraped from the
-- U.S. Department of State website.
--
-- Each row represents a single U.S. Embassy/Consulate ("Post") and a visa
-- category (Immediate Relative or Family-Sponsored Preference) along with
-- the current documentarily qualified (DQ) processing date.
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS iv_wait_times (
  -- Unique identifier for each record
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Embassy / Consulate name (e.g. Islamabad)
  post text NOT NULL,

  -- Visa category (Immediate Relative / Family-Sponsored Preference)
  visa_category text NOT NULL,

  -- Current Documentary Qualified (DQ) month displayed by DOS
  dq_date text NOT NULL,

  -- Timestamps for record creation and last update
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE iv_wait_times IS
'Stores the latest Immigrant Visa wait times published by the U.S. Department of State for each embassy/consulate and visa category. Updated automatically by the scheduled scraper.';

COMMENT ON COLUMN iv_wait_times.id IS
'Primary key for the IV wait time record.';

COMMENT ON COLUMN iv_wait_times.post IS
'Name of the U.S. Embassy or Consulate (Post).';

COMMENT ON COLUMN iv_wait_times.visa_category IS
'Visa category published by DOS (e.g. Immediate Relative or Family-Sponsored Preference).';

COMMENT ON COLUMN iv_wait_times.dq_date IS
'Current documentarily qualified (DQ) processing date published for the corresponding post and visa category.';

COMMENT ON COLUMN iv_wait_times.created_at IS
'Timestamp when the record was initially created.';

COMMENT ON COLUMN iv_wait_times.updated_at IS
'Timestamp when the record was last updated by the automated scraper.';

-- Indexes
-- Prevent duplicate records for the same Post and Visa Category.
CREATE UNIQUE INDEX IF NOT EXISTS idx_iv_wait_times_post_category_unique
ON iv_wait_times (post, visa_category);

-- Improves filtering/searching by Post.
CREATE INDEX IF NOT EXISTS idx_iv_wait_times_post
ON iv_wait_times (post);

-- Improves filtering/searching by Visa Category.
CREATE INDEX IF NOT EXISTS idx_iv_wait_times_visa_category
ON iv_wait_times (visa_category);

-- Trigger Function
-- Automatically updates updated_at whenever a row changes.

CREATE OR REPLACE FUNCTION set_iv_wait_times_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_iv_wait_times_updated_at
ON iv_wait_times;

CREATE TRIGGER trg_iv_wait_times_updated_at
BEFORE UPDATE ON iv_wait_times
FOR EACH ROW
EXECUTE FUNCTION set_iv_wait_times_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
--
-- This table contains publicly available U.S. Department of State data.
-- It is read-only for application users and written only by backend jobs
-- using the Supabase Service Role key.
-- ============================================================================

ALTER TABLE iv_wait_times ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read IV wait time data.
CREATE POLICY "iv_wait_times_select"
ON iv_wait_times
FOR SELECT
TO authenticated
USING (true);

-- No INSERT, UPDATE, or DELETE policies are needed to be defined.
