-- ============================================================
-- Migration: ceac_tracking
-- Purpose:   CEAC status tracking + notification queue for the
--            post-NVC / post-interview phase of the IR-1 journey.
--
-- Two tables:
--   1. ceac_case_status          — current status per journey + history
--   2. ceac_scheduled_notifications — delivery queue (replaces BullMQ)
--
-- Tracking starts ONLY when user reports a status beyond "At NVC".
-- Valid progression: at_nvc → in_transit → ready → ap | issued | refused
-- Refused sub-branch: 221g → (docs submitted) → possibly issued
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ENUM: ceac_status_value
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE ceac_status_value AS ENUM (
    'at_nvc',        -- default/starting state — tracking NOT active
    'in_transit',    -- case left NVC, heading to embassy
    'ready',         -- embassy has the file, interview approaching
    'ap',            -- administrative processing (post-interview)
    'issued',        -- visa stamped and sent for courier delivery
    'refused'        -- refusal (may be 221g or final — needs sub-branch)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- ENUM: refused_sub_type
-- Only relevant when status = 'refused'
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE refused_sub_type AS ENUM (
    'pending_clarification',  -- user has not yet told us which type
    'refusal_221g',           -- 221(g) temporary — docs requested
    'refusal_final'           -- final denial under INA ground
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- ENUM: notification_channel
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'push',
    'email',
    'push_and_email'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- ENUM: notification_status
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'pending',    -- waiting to fire
    'sent',       -- successfully delivered
    'cancelled',  -- suppressed before firing
    'failed'      -- delivery attempt failed (will retry)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: ceac_case_status
-- One row per journey. Updated in-place + history appended to
-- status_history JSONB array.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ceac_case_status (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      UUID        NOT NULL UNIQUE REFERENCES journeys(id) ON DELETE CASCADE,

  -- Current status
  current_status  ceac_status_value NOT NULL DEFAULT 'at_nvc',

  -- Sub-type for refused (null unless current_status = 'refused')
  refused_sub     refused_sub_type  DEFAULT NULL,

  -- When the CURRENT status was entered by the user (ISO)
  status_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- TRUE once user has confirmed passport physically received after Issued
  passport_received BOOLEAN NOT NULL DEFAULT FALSE,
  passport_received_at TIMESTAMPTZ,

  -- TRUE once user has submitted 221(g) docs (for Reminder 12 recurring trigger)
  docs_221g_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  docs_221g_submitted_at TIMESTAMPTZ,

  -- Audit: who last changed and when
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Full history: [{status, entered_at, set_by_user_id}]
  -- Appended on every status change — never mutated
  status_history  JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ceac_status_journey ON ceac_case_status(journey_id);
CREATE INDEX IF NOT EXISTS idx_ceac_status_current  ON ceac_case_status(current_status);

-- ─────────────────────────────────────────────────────────────
-- TABLE 2: ceac_scheduled_notifications
-- Replaces BullMQ — Supabase acts as the queue.
-- recurringJobRunner queries rows WHERE fire_at <= NOW()
-- AND status = 'pending', then sends and updates.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ceac_scheduled_notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      UUID        NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,

  -- Maps directly to the 13 reminder IDs in reminderConfig.ts
  reminder_id     TEXT        NOT NULL,
  -- e.g. 'status_in_transit', 'ap_biweekly_check', 'refused_221g_followup'

  -- Trigger group — used for bulk cancellation on status change
  -- e.g. 'in_transit', 'ready', 'ap', 'issued', 'refused'
  trigger_group   TEXT        NOT NULL,

  -- 'ACTION' | 'URGENT' | 'WAITING' | 'FOLLOW-UP'
  reminder_type   TEXT        NOT NULL,

  -- Content
  title           TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  channel         notification_channel NOT NULL DEFAULT 'push',

  -- Scheduling
  fire_at         TIMESTAMPTZ NOT NULL, -- when to send
  status          notification_status NOT NULL DEFAULT 'pending',

  -- For WAITING recurring reminders: re-enqueue after send
  is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  interval_days   INT,                  -- NULL for one-shot
  recurrence_count INT NOT NULL DEFAULT 0, -- how many times already sent

  -- Delivery audit
  sent_at         TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,       -- e.g. 'status_advanced', 'passport_received'
  last_error      TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceac_notif_journey
  ON ceac_scheduled_notifications(journey_id);

-- The primary query used by recurringJobRunner
CREATE INDEX IF NOT EXISTS idx_ceac_notif_fire_pending
  ON ceac_scheduled_notifications(fire_at, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ceac_notif_group
  ON ceac_scheduled_notifications(journey_id, trigger_group, status);

CREATE INDEX IF NOT EXISTS idx_ceac_notif_reminder_id
  ON ceac_scheduled_notifications(journey_id, reminder_id, status);

-- ─────────────────────────────────────────────────────────────
-- Auto updated_at triggers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ceac_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ceac_status_updated_at
  BEFORE UPDATE ON ceac_case_status
  FOR EACH ROW EXECUTE FUNCTION update_ceac_updated_at();

CREATE TRIGGER trg_ceac_notif_updated_at
  BEFORE UPDATE ON ceac_scheduled_notifications
  FOR EACH ROW EXECUTE FUNCTION update_ceac_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ceac_case_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own status
CREATE POLICY "ceac_status_own"
  ON ceac_case_status FOR ALL TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()))
  WITH CHECK (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

-- Users can read their own notifications (read-only)
CREATE POLICY "ceac_notif_select_own"
  ON ceac_scheduled_notifications FOR SELECT TO authenticated
  USING (journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid()));

-- Service role has full access (used by CeacReminderEngine + recurringJobRunner)
CREATE POLICY "ceac_status_service_all"
  ON ceac_case_status FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "ceac_notif_service_all"
  ON ceac_scheduled_notifications FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────
COMMENT ON TABLE ceac_case_status IS
  'Current CEAC status per IR-1 journey. Tracking starts only after status moves past at_nvc.
   Refused cases need refused_sub clarification before sub-branch reminders fire.
   Migration: 20260420 | Developer: Hashir';

COMMENT ON TABLE ceac_scheduled_notifications IS
  'Notification delivery queue. recurringJobRunner polls fire_at <= NOW() AND status=pending.
   WAITING reminders re-enqueue themselves on send (is_recurring=true).
   suppressionEngine cancels rows by setting status=cancelled.
   Migration: 20260420 | Developer: Hashir';
