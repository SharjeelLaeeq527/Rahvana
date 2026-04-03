-- ============================================================
-- Migration: journey_portal_records
-- Developer: Hashir (Developer B - Supporting Features)
-- Purpose: Journey-linked Portal Wallet for the IR-1 Roadmap.
--          Stores quick-reference access info for USCIS, CEAC,
--          and embassy booking portals — WITHOUT passwords.
--
--          This is DIFFERENT from the existing portal_wallet_credentials
--          table which encrypts passwords for the standalone Portal Wallet tool.
--          This roadmap version deliberately stores NO passwords.
--          It is a reference card for quick access, not a credential vault.
--
-- References:
--   - journeys.id (Hammad's table)
--
-- Portal types:
--   - uscis           → USCIS Online Account
--   - ceac            → CEAC (NVC/Embassy Portal)
--   - embassy_booking → Embassy appointment booking system
--   - other           → Any other portal
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create ENUM types
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE journey_portal_type AS ENUM (
    'uscis',
    'ceac',
    'embassy_booking',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Create the journey_portal_records table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_portal_records (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Journey reference (FK to journeys table - Hammad's)
  journey_id UUID NOT NULL,

  -- Which type of portal this record represents
  portal_type journey_portal_type NOT NULL,

  -- Human-readable name for the portal
  -- Examples: 'USCIS Online Account', 'CEAC - Islamabad', 'Embassy VFS Booking'
  portal_name VARCHAR(200),

  -- Direct URL to the portal login page
  portal_url VARCHAR(500),

  -- Email address used for the portal account
  -- SECURITY: This is the ONLY credential-adjacent field we store
  -- Passwords are NEVER stored anywhere in this table
  account_email VARCHAR(200),

  -- Username if different from email (some portals use separate usernames)
  account_username VARCHAR(200),

  -- General identifier for the account (receipt number, application ID, etc.)
  account_identifier VARCHAR(200),

  -- NVC-specific fields (used when portal_type = 'ceac')
  nvc_case_number VARCHAR(100),
  nvc_invoice_id VARCHAR(100),

  -- When this portal record was first saved by the user
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Track when user last accessed/used this portal record
  last_accessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 3: Add UNIQUE constraint
-- One record per portal type per journey
-- (user can update their USCIS record but not create two)
-- ────────────────────────────────────────────────────────────

ALTER TABLE journey_portal_records
  ADD CONSTRAINT uq_portal_records_journey_portal_type
    UNIQUE (journey_id, portal_type);

-- ────────────────────────────────────────────────────────────
-- STEP 4: Add CHECK constraints
-- ────────────────────────────────────────────────────────────

-- NVC case fields should only be populated for CEAC portal type
ALTER TABLE journey_portal_records
  ADD CONSTRAINT chk_nvc_fields_only_for_ceac
    CHECK (
      portal_type = 'ceac'
      OR (nvc_case_number IS NULL AND nvc_invoice_id IS NULL)
    );

-- Portal URL must look like a URL if provided
ALTER TABLE journey_portal_records
  ADD CONSTRAINT chk_portal_url_format
    CHECK (
      portal_url IS NULL
      OR portal_url LIKE 'http://%'
      OR portal_url LIKE 'https://%'
    );

-- ────────────────────────────────────────────────────────────
-- STEP 5: Create indexes for performance
-- ────────────────────────────────────────────────────────────

-- Fast lookup: all portals for a journey (portal wallet display)
CREATE INDEX IF NOT EXISTS idx_portal_records_journey_id
  ON journey_portal_records(journey_id);

-- Fast lookup: specific portal type for a journey (quick access by type)
CREATE INDEX IF NOT EXISTS idx_portal_records_journey_type
  ON journey_portal_records(journey_id, portal_type);

-- ────────────────────────────────────────────────────────────
-- STEP 6: Auto-update updated_at
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_journey_portal_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journey_portal_records_updated_at
  BEFORE UPDATE ON journey_portal_records
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_portal_records_updated_at();

-- ────────────────────────────────────────────────────────────
-- STEP 7: Enable Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE journey_portal_records ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- STEP 8: RLS Policies
-- ────────────────────────────────────────────────────────────

-- Policy: Users can view their own portal records
CREATE POLICY "portal_records_select_own"
  ON journey_portal_records
  FOR SELECT
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert portal records for their own journeys
CREATE POLICY "portal_records_insert_own"
  ON journey_portal_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own portal records
CREATE POLICY "portal_records_update_own"
  ON journey_portal_records
  FOR UPDATE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own portal records
CREATE POLICY "portal_records_delete_own"
  ON journey_portal_records
  FOR DELETE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "portal_records_service_role_all"
  ON journey_portal_records
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ────────────────────────────────────────────────────────────
-- STEP 9: Add comments
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE journey_portal_records IS
  'Journey-linked portal quick-reference cards (Portal Wallet for roadmap).
   SECURITY: Passwords are NEVER stored. Only email, username, case numbers.
   Different from portal_wallet_credentials which encrypts passwords for standalone tool.
   Developer: Hashir | Migration: 20260403_03';

COMMENT ON COLUMN journey_portal_records.portal_type IS 'uscis | ceac | embassy_booking | other';
COMMENT ON COLUMN journey_portal_records.account_email IS 'Email used for portal. ONLY credential-adjacent field. No passwords ever.';
COMMENT ON COLUMN journey_portal_records.nvc_case_number IS 'NVC Case Number. Only valid when portal_type = ceac.';
COMMENT ON COLUMN journey_portal_records.nvc_invoice_id IS 'NVC Invoice ID (fee invoice). Only valid when portal_type = ceac.';
COMMENT ON COLUMN journey_portal_records.last_accessed_at IS 'Updated when user clicks to open this portal from roadmap.';
