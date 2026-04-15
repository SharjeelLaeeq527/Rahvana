-- ============================================================
-- Migration: journey_reminders
-- Developer: Hashir (Developer B - Supporting Features)
-- Purpose: In-app reminder engine for the IR-1 Roadmap.
--          Stores auto-generated reminders triggered by journey
--          state (missing docs, approaching appointments, etc.)
--          Supports dismiss and snooze actions per reminder.
--
-- Reminder Types Covered (from IR1_Roadmap_Feature_Detail_Document.md §8.8, §10.3):
--   - missing_document          → required doc not uploaded
--   - appointment_approaching   → appointment within 14/7/1 days
--   - police_certificate_pending→ PCC requested but not received
--   - receipt_not_captured      → filed but no receipt number in case_data
--   - nvc_fee_not_confirmed     → NVC fee step done but not confirmed
--   - account_setup_incomplete  → USCIS account step done, no wallet record
--   - ceac_upload_incomplete    → CEAC upload step done but not confirmed
--   - tool_session_abandoned    → tool started 3+ days ago, not completed
--   - step_pending_too_long     → step in-progress for 7+ days
--   - appointment_not_recorded  → appointment step complete, no date saved
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create reminder_type ENUM
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE journey_reminder_type AS ENUM (
    'missing_document',
    'appointment_approaching',
    'police_certificate_pending',
    'receipt_not_captured',
    'nvc_fee_not_confirmed',
    'account_setup_incomplete',
    'ceac_upload_incomplete',
    'tool_session_abandoned',
    'step_pending_too_long',
    'appointment_not_recorded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Create reminder_priority ENUM
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE journey_reminder_priority AS ENUM (
    'critical',
    'high',
    'normal',
    'low'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 3: Create the journey_reminders table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_reminders (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Journey reference
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,

  -- ── Reminder Content ────────────────────────────────────

  -- What category of reminder this is
  reminder_type journey_reminder_type NOT NULL,

  -- Priority for UI ordering and salience
  priority journey_reminder_priority NOT NULL DEFAULT 'normal',

  -- Human-readable content shown to the user
  title TEXT NOT NULL,
  body  TEXT NOT NULL,

  -- ── Context ─────────────────────────────────────────────

  -- Which roadmap step generated this reminder (optional)
  step_key TEXT,

  -- Optional reference to a specific record (appointment_id, document_id, etc.)
  reference_id UUID,

  -- Where to send the user when they tap/click the reminder
  action_url TEXT,

  -- CTA label e.g. "Upload Now", "View Step", "Record Date"
  action_label TEXT,

  -- ── State ────────────────────────────────────────────────

  -- Whether the user has permanently dismissed this reminder
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  -- Snooze: hide until this datetime (NULL = not snoozed)
  snoozed_until TIMESTAMPTZ,

  -- ── Deduplication ────────────────────────────────────────
  -- Prevents duplicate reminders of the same type for the same context.
  -- Format: '{journey_id}:{reminder_type}:{step_key_or_ref}'
  -- UNIQUE constraint ensures only one active reminder per context.
  dedup_key TEXT NOT NULL UNIQUE,

  -- ── Timestamps ───────────────────────────────────────────
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 4: Indexes for performance
-- ────────────────────────────────────────────────────────────

-- Primary query: get all active reminders for a journey (dashboard)
CREATE INDEX IF NOT EXISTS idx_reminders_journey_active
  ON journey_reminders(journey_id, is_dismissed, snoozed_until)
  WHERE is_dismissed = FALSE;

-- Priority ordering index
CREATE INDEX IF NOT EXISTS idx_reminders_journey_priority
  ON journey_reminders(journey_id, priority);

-- Type-based lookup (e.g., find all appointment_approaching reminders)
CREATE INDEX IF NOT EXISTS idx_reminders_type
  ON journey_reminders(reminder_type);

-- Dedup lookup (used by ReminderEngine before inserting)
CREATE INDEX IF NOT EXISTS idx_reminders_dedup_key
  ON journey_reminders(dedup_key);

-- ────────────────────────────────────────────────────────────
-- STEP 5: Auto-update updated_at trigger
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_journey_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journey_reminders_updated_at
  BEFORE UPDATE ON journey_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_reminders_updated_at();

-- ────────────────────────────────────────────────────────────
-- STEP 6: Enable Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE journey_reminders ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- STEP 7: RLS Policies
-- ────────────────────────────────────────────────────────────

-- Users can view their own reminders
CREATE POLICY "journey_reminders_select_own"
  ON journey_reminders
  FOR SELECT
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Users can update their own reminders (dismiss / snooze)
CREATE POLICY "journey_reminders_update_own"
  ON journey_reminders
  FOR UPDATE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Service role (backend) can insert/update/delete freely (for ReminderEngine)
CREATE POLICY "journey_reminders_service_role_all"
  ON journey_reminders
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ────────────────────────────────────────────────────────────
-- STEP 8: Comments
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE journey_reminders IS
  'Auto-generated in-app reminders for the IR-1 Roadmap journey.
   Created by ReminderEngine when a trigger condition is detected.
   Supports dismiss and snooze. dedup_key prevents duplicate reminders.
   Developer: Hashir | Migration: 20260407';

COMMENT ON COLUMN journey_reminders.reminder_type    IS 'Category of reminder — maps to trigger condition in ReminderEngine.ts';
COMMENT ON COLUMN journey_reminders.priority         IS 'UI salience: critical > high > normal > low';
COMMENT ON COLUMN journey_reminders.dedup_key        IS 'Unique key preventing duplicate reminders. Format: {journeyId}:{type}:{stepKeyOrRef}';
COMMENT ON COLUMN journey_reminders.reference_id     IS 'Optional FK to related record (appointment_id, document_id, tool_session_id)';
COMMENT ON COLUMN journey_reminders.action_url       IS 'URL to navigate user when they click the reminder CTA';
COMMENT ON COLUMN journey_reminders.snoozed_until    IS 'Hide reminder until this datetime. NULL = not snoozed. If NOW() > snoozed_until, show again.';
COMMENT ON COLUMN journey_reminders.is_dismissed     IS 'TRUE = user permanently dismissed. Never show again.';
