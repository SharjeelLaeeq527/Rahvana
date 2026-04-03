-- ============================================================
-- Migration: journey_appointments
-- Developer: Hashir (Developer B - Supporting Features)
-- Purpose: Journey-linked appointment tracking for the IR-1 Roadmap.
--          Tracks medical exams, consular interviews, and other
--          time-sensitive appointments. Also tracks which reminder
--          notifications have been sent (14-day, 7-day, 1-day before).
--
--          This is SEPARATE from the existing appointments table which
--          is an admin-managed system for Rahvana consultation bookings.
--          This roadmap version is USER-managed (users enter their own
--          appointment dates for medical/interview tracking).
--
-- References:
--   - journeys.id (Hammad's table)
--
-- Appointment types:
--   - medical                     → Embassy-approved physician medical exam
--   - interview                   → Consular interview at embassy
--   - police_certificate_followup → Follow-up call to police dept
--   - other                       → Any other tracked appointment
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create ENUM types
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE journey_appointment_type AS ENUM (
    'medical',
    'interview',
    'police_certificate_followup',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE journey_appointment_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'rescheduled',
    'pending_confirmation'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Create the journey_appointments table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_appointments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Journey reference (FK to journeys table - Hammad's)
  journey_id UUID NOT NULL,

  -- Which roadmap step this appointment belongs to
  -- Examples: 'III.1' (medical), 'III.4' (interview)
  step_key VARCHAR(20),

  -- What type of appointment this is
  appointment_type journey_appointment_type NOT NULL,

  -- ── Date & Time ──────────────────────────────────────────

  -- Date of the appointment (required)
  appointment_date DATE NOT NULL,

  -- Time of the appointment (optional - user may know date but not time yet)
  appointment_time TIME,

  -- Combined datetime for easier querying and reminder calculation
  -- Should be set whenever appointment_date is set
  appointment_datetime TIMESTAMPTZ,

  -- ── Location & Provider ──────────────────────────────────

  -- Where the appointment is
  -- Examples: 'U.S. Embassy, Islamabad', 'Agha Khan Hospital Karachi'
  location VARCHAR(300),

  -- Who is conducting the appointment
  -- Examples: 'Dr. Siddiqui Medical Center', 'U.S. Consulate Officer'
  provider VARCHAR(200),

  -- Full address
  address TEXT,

  -- Contact phone number for the location/provider
  phone_number VARCHAR(50),

  -- User notes about this appointment
  notes TEXT,

  -- ── Status ───────────────────────────────────────────────

  -- Current status of the appointment
  status journey_appointment_status NOT NULL DEFAULT 'scheduled',

  -- ── Reminder Tracking ────────────────────────────────────
  -- These columns track WHEN each reminder was sent.
  -- NULL = reminder has not been sent yet.
  -- Non-NULL = reminder was sent at this timestamp, do not resend.
  -- When appointment is rescheduled, these should be reset to NULL
  -- so reminders are sent again relative to the new date.

  -- Was the 14-day-before reminder sent?
  reminder_sent_14d TIMESTAMPTZ,

  -- Was the 7-day-before reminder sent?
  reminder_sent_7d  TIMESTAMPTZ,

  -- Was the 1-day-before reminder sent?
  reminder_sent_1d  TIMESTAMPTZ,

  -- ── Timestamps ───────────────────────────────────────────

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 3: Add CHECK constraints
-- ────────────────────────────────────────────────────────────

-- appointment_datetime must be consistent with appointment_date when both present
-- (We can't enforce exact equality of datetime vs date+time via simple CHECK,
--  but we ensure datetime is not before the appointment date)
ALTER TABLE journey_appointments
  ADD CONSTRAINT chk_appointment_datetime_consistent
    CHECK (
      appointment_datetime IS NULL
      OR DATE(appointment_datetime AT TIME ZONE 'UTC') = appointment_date
      OR appointment_datetime::date = appointment_date
    );

-- ────────────────────────────────────────────────────────────
-- STEP 4: Create indexes for performance
-- ────────────────────────────────────────────────────────────

-- Fast lookup: get upcoming appointments for a journey (dashboard card)
CREATE INDEX IF NOT EXISTS idx_journey_appts_journey_date
  ON journey_appointments(journey_id, appointment_date DESC);

-- Fast lookup: appointments by type (e.g., find the medical appointment)
CREATE INDEX IF NOT EXISTS idx_journey_appts_journey_type
  ON journey_appointments(journey_id, appointment_type);

-- Fast lookup: find appointments needing 14-day reminder (cron job query)
-- Future notification job will use: WHERE reminder_sent_14d IS NULL AND appointment_datetime <= NOW() + 14 days
CREATE INDEX IF NOT EXISTS idx_journey_appts_reminder_14d
  ON journey_appointments(appointment_datetime, reminder_sent_14d)
  WHERE status = 'scheduled' AND reminder_sent_14d IS NULL;

-- Fast lookup: find appointments needing 7-day reminder
CREATE INDEX IF NOT EXISTS idx_journey_appts_reminder_7d
  ON journey_appointments(appointment_datetime, reminder_sent_7d)
  WHERE status = 'scheduled' AND reminder_sent_7d IS NULL;

-- Fast lookup: find appointments needing 1-day reminder
CREATE INDEX IF NOT EXISTS idx_journey_appts_reminder_1d
  ON journey_appointments(appointment_datetime, reminder_sent_1d)
  WHERE status = 'scheduled' AND reminder_sent_1d IS NULL;

-- Fast lookup: scheduled upcoming appointments across all journeys (for cron job)
CREATE INDEX IF NOT EXISTS idx_journey_appts_upcoming_scheduled
  ON journey_appointments(appointment_datetime)
  WHERE status = 'scheduled';

-- ────────────────────────────────────────────────────────────
-- STEP 5: Auto-update updated_at + compute appointment_datetime
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_journey_appointments_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update updated_at
  NEW.updated_at = NOW();

  -- Auto-compute appointment_datetime from date + time if time is provided
  IF NEW.appointment_time IS NOT NULL THEN
    NEW.appointment_datetime = (NEW.appointment_date::TEXT || ' ' || NEW.appointment_time::TEXT)::TIMESTAMPTZ;
  ELSE
    -- If no time, set to midnight of the appointment date (UTC)
    NEW.appointment_datetime = NEW.appointment_date::TIMESTAMPTZ;
  END IF;

  -- If appointment is being rescheduled (date changed), reset all reminder sent flags
  -- so reminders will fire again relative to the new date
  IF TG_OP = 'UPDATE' AND OLD.appointment_date != NEW.appointment_date THEN
    NEW.reminder_sent_14d = NULL;
    NEW.reminder_sent_7d  = NULL;
    NEW.reminder_sent_1d  = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journey_appointments_on_change
  BEFORE INSERT OR UPDATE ON journey_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_appointments_on_change();

-- ────────────────────────────────────────────────────────────
-- STEP 6: Enable Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE journey_appointments ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- STEP 7: RLS Policies
-- ────────────────────────────────────────────────────────────

-- Policy: Users can view their own appointments
CREATE POLICY "journey_appointments_select_own"
  ON journey_appointments
  FOR SELECT
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert appointments for their own journeys
CREATE POLICY "journey_appointments_insert_own"
  ON journey_appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own appointments
-- (reschedule, mark complete, add notes, etc.)
CREATE POLICY "journey_appointments_update_own"
  ON journey_appointments
  FOR UPDATE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own appointments
-- (cancel and remove)
CREATE POLICY "journey_appointments_delete_own"
  ON journey_appointments
  FOR DELETE
  TO authenticated
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role has full access (cron jobs, backend)
CREATE POLICY "journey_appointments_service_role_all"
  ON journey_appointments
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ────────────────────────────────────────────────────────────
-- STEP 8: Add comments
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE journey_appointments IS
  'User-managed appointment tracking for the IR-1 Roadmap journey.
   Tracks medical exams, consular interviews, and other time-sensitive appointments.
   DIFFERENT from the Rahvana admin appointments table (consultation bookings).
   Reminder columns track when notifications were sent to prevent duplicates.
   Developer: Hashir | Migration: 20260403_04';

COMMENT ON COLUMN journey_appointments.step_key IS 'Roadmap step: III.1 (medical), III.4 (interview). Logical ref to steps.step_key.';
COMMENT ON COLUMN journey_appointments.appointment_datetime IS 'Auto-computed from date+time by trigger. Reset to midnight if no time provided.';
COMMENT ON COLUMN journey_appointments.reminder_sent_14d IS 'NULL = 14-day reminder not sent yet. Non-NULL = sent at this time.';
COMMENT ON COLUMN journey_appointments.reminder_sent_7d IS 'NULL = 7-day reminder not sent yet. Non-NULL = sent at this time.';
COMMENT ON COLUMN journey_appointments.reminder_sent_1d IS 'NULL = 1-day reminder not sent yet. Non-NULL = sent at this time.';
