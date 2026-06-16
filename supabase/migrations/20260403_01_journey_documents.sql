-- ============================================================
-- Migration: journey_documents
-- Developer: Hashir (Developer B - Supporting Features)
-- Purpose: Journey-linked document tracking for the IR-1 Roadmap
--          This is SEPARATE from the existing standalone `documents` table
--          which belongs to the Document Vault tool.
--          This table tracks per-step document requirements and statuses
--          within the roadmap journey context.
--
-- References:
--   - journeys.id (Hammad's table - FK added after journeys table exists)
--   - documents.id (existing vault - soft reference via vault_file_id, no FK constraint)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create ENUM types
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE journey_document_status AS ENUM (
    'not_started',
    'requested',
    'pending',
    'received',
    'uploaded',
    'expired',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Create the journey_documents table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Journey reference (FK to journeys table - Hammad's table)
  -- NOTE: FK constraint added after journeys table is confirmed created by Hammad
  journey_id UUID NOT NULL,

  -- Which roadmap step requires or collects this document
  -- Examples: 'I.2', 'II.4', 'III.2'
  step_key VARCHAR(20),

  -- Machine-readable document identifier
  -- Examples: 'proof_citizenship', 'marriage_cert', 'police_certificate', 'tax_returns_2024'
  document_type VARCHAR(100) NOT NULL,

  -- Human-readable label shown in UI
  -- Examples: 'Proof of U.S. Citizenship', 'Nikah Nama / Marriage Certificate'
  document_label VARCHAR(200),

  -- Current tracking status of this document
  status journey_document_status NOT NULL DEFAULT 'not_started',

  -- Is this document required for step completion?
  is_required BOOLEAN NOT NULL DEFAULT TRUE,

  -- Is this document recommended (but not blocking)?
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,

  -- Reference to the file stored in the existing Document Vault (documents table)
  -- This is a soft reference - no FK constraint to allow independence
  vault_file_id TEXT,

  -- Direct URL if file URL is stored separately
  vault_file_url TEXT,

  -- When the document was uploaded to vault
  uploaded_date TIMESTAMPTZ,

  -- When the document expires (e.g., police certificate validity, passport expiry)
  expiry_date TIMESTAMPTZ,

  -- User or system notes about this document
  notes TEXT,

  -- Soft delete support
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 3: Add CHECK constraints for data integrity
-- ────────────────────────────────────────────────────────────

ALTER TABLE journey_documents
  ADD CONSTRAINT chk_expiry_after_upload
    CHECK (expiry_date IS NULL OR uploaded_date IS NULL OR expiry_date > uploaded_date);

ALTER TABLE journey_documents
  ADD CONSTRAINT chk_not_both_required_and_not_recommended
    CHECK (NOT (is_required = FALSE AND is_recommended = FALSE AND status = 'not_started'));

-- ────────────────────────────────────────────────────────────
-- STEP 4: Create indexes for performance
-- ────────────────────────────────────────────────────────────

-- Fast lookup: all documents for a journey (most common query)
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_id
  ON journey_documents(journey_id);

-- Fast lookup: documents by status (find missing/pending docs)
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_status
  ON journey_documents(journey_id, status);

-- Fast lookup: documents for a specific step
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_step
  ON journey_documents(journey_id, step_key);

-- Fast lookup: documents expiring soon (for expiry alerts)
CREATE INDEX IF NOT EXISTS idx_journey_docs_expiry
  ON journey_documents(expiry_date)
  WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;

-- Fast lookup: uploaded documents (vault reference)
CREATE INDEX IF NOT EXISTS idx_journey_docs_vault_file
  ON journey_documents(vault_file_id)
  WHERE vault_file_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 5: Auto-update updated_at on any row change
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_journey_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journey_documents_updated_at
  BEFORE UPDATE ON journey_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_documents_updated_at();

-- ────────────────────────────────────────────────────────────
-- STEP 6: Enable Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE journey_documents ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- STEP 7: RLS Policies
-- NOTE: We verify ownership by checking journey_id matches a journey
--       owned by the authenticated user. Until Hammad's journeys table
--       exists, temporarily use a permissive policy that will be tightened.
-- ────────────────────────────────────────────────────────────

-- Policy: Users can SELECT their own documents
-- (journey must belong to authenticated user)
CREATE POLICY "journey_documents_select_own"
  ON journey_documents
  FOR SELECT
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can INSERT documents to their own journeys
CREATE POLICY "journey_documents_insert_own"
  ON journey_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can UPDATE their own documents
CREATE POLICY "journey_documents_update_own"
  ON journey_documents
  FOR UPDATE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can DELETE (soft delete) their own documents
CREATE POLICY "journey_documents_delete_own"
  ON journey_documents
  FOR DELETE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role (backend) has full access
CREATE POLICY "journey_documents_service_role_all"
  ON journey_documents
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ────────────────────────────────────────────────────────────
-- STEP 8: Add comments for documentation
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE journey_documents IS
  'Tracks document requirements and upload statuses per roadmap step.
   Separate from the standalone document_vault documents table.
   Developer: Hashir | Migration: 20260403_01';

COMMENT ON COLUMN journey_documents.journey_id IS 'FK to journeys table (Hammad). References the users active IR-1 journey.';
COMMENT ON COLUMN journey_documents.step_key IS 'Roadmap step key e.g. I.2, II.4, III.2';
COMMENT ON COLUMN journey_documents.document_type IS 'Machine-readable doc type e.g. proof_citizenship, marriage_cert';
COMMENT ON COLUMN journey_documents.status IS 'not_started | requested | pending | received | uploaded | expired | rejected';
COMMENT ON COLUMN journey_documents.vault_file_id IS 'Soft reference to documents.id in Document Vault. Not a FK constraint.';
COMMENT ON COLUMN journey_documents.expiry_date IS 'When document becomes invalid. Used for expiry alerts.';
COMMENT ON COLUMN journey_documents.deleted_at IS 'Soft delete timestamp. NULL means active record.';
