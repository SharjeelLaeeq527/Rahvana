
-- TABLE 1: journey_documents
-- Tracks per-step document requirements and upload statuses
-- ══════════════════════════════════════════════════════════════════

-- Create ENUM
DO $$ BEGIN
  CREATE TYPE journey_document_status AS ENUM (
    'not_started', 'requested', 'pending', 'received',
    'uploaded', 'expired', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create table
CREATE TABLE IF NOT EXISTS journey_documents (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id           UUID    NOT NULL,
  step_key             VARCHAR(20),
  document_type        VARCHAR(100) NOT NULL,
  document_label       VARCHAR(200),
  status               journey_document_status NOT NULL DEFAULT 'not_started',
  is_required          BOOLEAN NOT NULL DEFAULT TRUE,
  is_recommended       BOOLEAN NOT NULL DEFAULT FALSE,
  vault_file_id        TEXT,
  vault_file_url       TEXT,
  uploaded_date        TIMESTAMPTZ,
  expiry_date          TIMESTAMPTZ,
  notes                TEXT,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraint: expiry must be after upload if both present
ALTER TABLE journey_documents
  DROP CONSTRAINT IF EXISTS chk_expiry_after_upload;
ALTER TABLE journey_documents
  ADD CONSTRAINT chk_expiry_after_upload
    CHECK (expiry_date IS NULL OR uploaded_date IS NULL OR expiry_date > uploaded_date);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_id     ON journey_documents(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_status ON journey_documents(journey_id, status);
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_step   ON journey_documents(journey_id, step_key);
CREATE INDEX IF NOT EXISTS idx_journey_docs_expiry         ON journey_documents(expiry_date) WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_journey_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journey_documents_updated_at ON journey_documents;
CREATE TRIGGER trg_journey_documents_updated_at
  BEFORE UPDATE ON journey_documents
  FOR EACH ROW EXECUTE FUNCTION update_journey_documents_updated_at();

-- RLS
ALTER TABLE journey_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journey_documents_select_own"       ON journey_documents;
DROP POLICY IF EXISTS "journey_documents_insert_own"       ON journey_documents;
DROP POLICY IF EXISTS "journey_documents_update_own"       ON journey_documents;
DROP POLICY IF EXISTS "journey_documents_delete_own"       ON journey_documents;
DROP POLICY IF EXISTS "journey_documents_service_role_all" ON journey_documents;

CREATE POLICY "journey_documents_select_own"
  ON journey_documents FOR SELECT TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_documents_insert_own"
  ON journey_documents FOR INSERT TO authenticated
  WITH CHECK (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_documents_update_own"
  ON journey_documents FOR UPDATE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_documents_delete_own"
  ON journey_documents FOR DELETE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_documents_service_role_all"
  ON journey_documents FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- Comments
COMMENT ON TABLE journey_documents IS 'Roadmap journey document tracking. Separate from Document Vault standalone tool. Developer: Hashir';
COMMENT ON COLUMN journey_documents.step_key      IS 'Roadmap step e.g. I.2, II.4, III.2';
COMMENT ON COLUMN journey_documents.document_type IS 'Machine ID e.g. proof_citizenship, marriage_cert, police_certificate';
COMMENT ON COLUMN journey_documents.vault_file_id IS 'Soft ref to documents.id in Document Vault. NOT a FK.';
COMMENT ON COLUMN journey_documents.deleted_at    IS 'Soft delete. NULL = active.';


-- ══════════════════════════════════════════════════════════════════
-- TABLE 2: tool_sessions
-- Saves and resumes tool progress (I-130, Affidavit Calc, etc.)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tool_sessions (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id            UUID    NOT NULL,
  step_key              VARCHAR(20)  NOT NULL,
  tool_key              VARCHAR(100) NOT NULL,
  session_state         JSONB,
  completion_percentage INT     NOT NULL DEFAULT 0,
  is_completed          BOOLEAN NOT NULL DEFAULT FALSE,
  tool_output           JSONB,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_saved_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one session per tool per step per journey (use UPSERT on this)
ALTER TABLE tool_sessions
  DROP CONSTRAINT IF EXISTS uq_tool_sessions_journey_step_tool;
ALTER TABLE tool_sessions
  ADD CONSTRAINT uq_tool_sessions_journey_step_tool
    UNIQUE (journey_id, step_key, tool_key);

-- Check constraints
ALTER TABLE tool_sessions DROP CONSTRAINT IF EXISTS chk_completion_pct_range;
ALTER TABLE tool_sessions ADD CONSTRAINT chk_completion_pct_range
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE tool_sessions DROP CONSTRAINT IF EXISTS chk_completed_at_requires_flag;
ALTER TABLE tool_sessions ADD CONSTRAINT chk_completed_at_requires_flag
  CHECK (completed_at IS NULL OR is_completed = TRUE);

ALTER TABLE tool_sessions DROP CONSTRAINT IF EXISTS chk_completed_means_100;
ALTER TABLE tool_sessions ADD CONSTRAINT chk_completed_means_100
  CHECK (is_completed = FALSE OR completion_percentage = 100);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tool_sessions_journey_tool       ON tool_sessions(journey_id, tool_key);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_journey_step_tool  ON tool_sessions(journey_id, step_key, tool_key);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_journey_incomplete ON tool_sessions(journey_id, is_completed) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_tool_sessions_last_saved         ON tool_sessions(journey_id, last_saved_at DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_tool_sessions_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_saved_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tool_sessions_updated_at ON tool_sessions;
CREATE TRIGGER trg_tool_sessions_updated_at
  BEFORE UPDATE ON tool_sessions
  FOR EACH ROW EXECUTE FUNCTION update_tool_sessions_timestamps();

-- RLS
ALTER TABLE tool_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tool_sessions_select_own"       ON tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_insert_own"       ON tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_update_own"       ON tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_delete_own"       ON tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_service_role_all" ON tool_sessions;

CREATE POLICY "tool_sessions_select_own"
  ON tool_sessions FOR SELECT TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "tool_sessions_insert_own"
  ON tool_sessions FOR INSERT TO authenticated
  WITH CHECK (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "tool_sessions_update_own"
  ON tool_sessions FOR UPDATE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "tool_sessions_delete_own"
  ON tool_sessions FOR DELETE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "tool_sessions_service_role_all"
  ON tool_sessions FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- Comments
COMMENT ON TABLE tool_sessions IS 'Saves/resumes tool progress per step. One session per (journey, step, tool). Use UPSERT. Developer: Hashir';
COMMENT ON COLUMN tool_sessions.tool_key              IS 'form_filler_i130 | affidavit_calculator | ds260_prep | interview_prep | case_strength_checker';
COMMENT ON COLUMN tool_sessions.session_state         IS 'Full serialized tool state. Tool-specific JSON structure.';
COMMENT ON COLUMN tool_sessions.tool_output           IS 'Final result after completion. E.g. {pdfUrl, sponsorStructure, formData}';
COMMENT ON COLUMN tool_sessions.completion_percentage IS '0-100. Must equal 100 when is_completed = true (enforced by constraint).';


-- ══════════════════════════════════════════════════════════════════
-- TABLE 3: journey_portal_records
-- Portal Wallet (roadmap version) — NO passwords stored
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE journey_portal_type AS ENUM (
    'uscis', 'ceac', 'embassy_booking', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS journey_portal_records (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id          UUID    NOT NULL,
  portal_type         journey_portal_type NOT NULL,
  portal_name         VARCHAR(200),
  portal_url          VARCHAR(500),
  account_email       VARCHAR(200),
  account_username    VARCHAR(200),
  account_identifier  VARCHAR(200),
  nvc_case_number     VARCHAR(100),
  nvc_invoice_id      VARCHAR(100),
  saved_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one record per portal type per journey
ALTER TABLE journey_portal_records
  DROP CONSTRAINT IF EXISTS uq_portal_records_journey_type;
ALTER TABLE journey_portal_records
  ADD CONSTRAINT uq_portal_records_journey_type
    UNIQUE (journey_id, portal_type);

-- NVC fields only for CEAC
ALTER TABLE journey_portal_records DROP CONSTRAINT IF EXISTS chk_nvc_only_for_ceac;
ALTER TABLE journey_portal_records ADD CONSTRAINT chk_nvc_only_for_ceac
  CHECK (portal_type = 'ceac' OR (nvc_case_number IS NULL AND nvc_invoice_id IS NULL));

-- URL format check
ALTER TABLE journey_portal_records DROP CONSTRAINT IF EXISTS chk_portal_url_format;
ALTER TABLE journey_portal_records ADD CONSTRAINT chk_portal_url_format
  CHECK (portal_url IS NULL OR portal_url LIKE 'http://%' OR portal_url LIKE 'https://%');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portal_records_journey_id   ON journey_portal_records(journey_id);
CREATE INDEX IF NOT EXISTS idx_portal_records_journey_type ON journey_portal_records(journey_id, portal_type);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_journey_portal_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journey_portal_records_updated_at ON journey_portal_records;
CREATE TRIGGER trg_journey_portal_records_updated_at
  BEFORE UPDATE ON journey_portal_records
  FOR EACH ROW EXECUTE FUNCTION update_journey_portal_records_updated_at();

-- RLS
ALTER TABLE journey_portal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_records_select_own"       ON journey_portal_records;
DROP POLICY IF EXISTS "portal_records_insert_own"       ON journey_portal_records;
DROP POLICY IF EXISTS "portal_records_update_own"       ON journey_portal_records;
DROP POLICY IF EXISTS "portal_records_delete_own"       ON journey_portal_records;
DROP POLICY IF EXISTS "portal_records_service_role_all" ON journey_portal_records;

CREATE POLICY "portal_records_select_own"
  ON journey_portal_records FOR SELECT TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "portal_records_insert_own"
  ON journey_portal_records FOR INSERT TO authenticated
  WITH CHECK (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "portal_records_update_own"
  ON journey_portal_records FOR UPDATE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "portal_records_delete_own"
  ON journey_portal_records FOR DELETE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "portal_records_service_role_all"
  ON journey_portal_records FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- Comments
COMMENT ON TABLE journey_portal_records IS 'Roadmap Portal Wallet — quick access reference cards. SECURITY: NO PASSWORDS EVER. Different from portal_wallet_credentials. Developer: Hashir';
COMMENT ON COLUMN journey_portal_records.account_email  IS 'Only credential-adjacent field stored. Passwords never stored.';
COMMENT ON COLUMN journey_portal_records.nvc_case_number IS 'Only valid when portal_type = ceac. Enforced by constraint.';


-- ══════════════════════════════════════════════════════════════════
-- TABLE 4: journey_appointments
-- User-managed appointment tracking with reminder timestamp columns
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE journey_appointment_type AS ENUM (
    'medical', 'interview', 'police_certificate_followup', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE journey_appointment_status AS ENUM (
    'scheduled', 'completed', 'cancelled', 'rescheduled', 'pending_confirmation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS journey_appointments (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id            UUID    NOT NULL,
  step_key              VARCHAR(20),
  appointment_type      journey_appointment_type   NOT NULL,
  appointment_date      DATE    NOT NULL,
  appointment_time      TIME,
  appointment_datetime  TIMESTAMPTZ,
  location              VARCHAR(300),
  provider              VARCHAR(200),
  address               TEXT,
  phone_number          VARCHAR(50),
  notes                 TEXT,
  status                journey_appointment_status NOT NULL DEFAULT 'scheduled',
  reminder_sent_14d     TIMESTAMPTZ,
  reminder_sent_7d      TIMESTAMPTZ,
  reminder_sent_1d      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journey_appts_journey_date      ON journey_appointments(journey_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_journey_appts_journey_type      ON journey_appointments(journey_id, appointment_type);
CREATE INDEX IF NOT EXISTS idx_journey_appts_upcoming_sched    ON journey_appointments(appointment_datetime) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_journey_appts_reminder_14d      ON journey_appointments(appointment_datetime, reminder_sent_14d) WHERE status = 'scheduled' AND reminder_sent_14d IS NULL;
CREATE INDEX IF NOT EXISTS idx_journey_appts_reminder_7d       ON journey_appointments(appointment_datetime, reminder_sent_7d)  WHERE status = 'scheduled' AND reminder_sent_7d  IS NULL;
CREATE INDEX IF NOT EXISTS idx_journey_appts_reminder_1d       ON journey_appointments(appointment_datetime, reminder_sent_1d)  WHERE status = 'scheduled' AND reminder_sent_1d  IS NULL;

-- Smart trigger: auto-compute appointment_datetime + reset reminders on reschedule
CREATE OR REPLACE FUNCTION update_journey_appointments_on_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-compute appointment_datetime
  IF NEW.appointment_time IS NOT NULL THEN
    NEW.appointment_datetime = (NEW.appointment_date::TEXT || ' ' || NEW.appointment_time::TEXT)::TIMESTAMPTZ;
  ELSE
    NEW.appointment_datetime = NEW.appointment_date::TIMESTAMPTZ;
  END IF;

  -- If date changed on update → reset reminder flags so they re-fire for new date
  IF TG_OP = 'UPDATE' AND OLD.appointment_date != NEW.appointment_date THEN
    NEW.reminder_sent_14d = NULL;
    NEW.reminder_sent_7d  = NULL;
    NEW.reminder_sent_1d  = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journey_appointments_on_change ON journey_appointments;
CREATE TRIGGER trg_journey_appointments_on_change
  BEFORE INSERT OR UPDATE ON journey_appointments
  FOR EACH ROW EXECUTE FUNCTION update_journey_appointments_on_change();

-- RLS
ALTER TABLE journey_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journey_appointments_select_own"       ON journey_appointments;
DROP POLICY IF EXISTS "journey_appointments_insert_own"       ON journey_appointments;
DROP POLICY IF EXISTS "journey_appointments_update_own"       ON journey_appointments;
DROP POLICY IF EXISTS "journey_appointments_delete_own"       ON journey_appointments;
DROP POLICY IF EXISTS "journey_appointments_service_role_all" ON journey_appointments;

CREATE POLICY "journey_appointments_select_own"
  ON journey_appointments FOR SELECT TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_appointments_insert_own"
  ON journey_appointments FOR INSERT TO authenticated
  WITH CHECK (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_appointments_update_own"
  ON journey_appointments FOR UPDATE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_appointments_delete_own"
  ON journey_appointments FOR DELETE TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

CREATE POLICY "journey_appointments_service_role_all"
  ON journey_appointments FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- Comments
COMMENT ON TABLE journey_appointments IS 'User-managed appointment tracking for roadmap. Different from Rahvana admin consultations table. Reminder columns track sent status to prevent duplicate notifications. Developer: Hashir';
COMMENT ON COLUMN journey_appointments.appointment_datetime IS 'Auto-computed by trigger from date+time. Resets to midnight if no time given.';
COMMENT ON COLUMN journey_appointments.reminder_sent_14d   IS 'NULL = not sent yet. Non-NULL = sent at this timestamp. Reset to NULL on reschedule.';
COMMENT ON COLUMN journey_appointments.reminder_sent_7d    IS 'NULL = not sent yet. Non-NULL = sent at this timestamp. Reset to NULL on reschedule.';
COMMENT ON COLUMN journey_appointments.reminder_sent_1d    IS 'NULL = not sent yet. Non-NULL = sent at this timestamp. Reset to NULL on reschedule.';


