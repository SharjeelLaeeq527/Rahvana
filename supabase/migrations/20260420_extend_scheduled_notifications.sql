-- ============================================================
-- Migration: extend_scheduled_notifications
-- Purpose:   Extend ceac_scheduled_notifications to support ALL
--            journey reminders (not just CEAC phase).
--
-- New columns:
--   reminder_origin   — 'ceac' (default) or 'journey' (Ch1/Ch2/Ch3 registry)
--   step_trigger_key  — which step triggered this (for journey reminders)
-- ============================================================

ALTER TABLE ceac_scheduled_notifications
  ADD COLUMN IF NOT EXISTS reminder_origin TEXT NOT NULL DEFAULT 'ceac'
    CHECK (reminder_origin IN ('ceac', 'journey'));

ALTER TABLE ceac_scheduled_notifications
  ADD COLUMN IF NOT EXISTS step_trigger_key TEXT;

-- Index for querying journey reminders by origin
CREATE INDEX IF NOT EXISTS idx_csn_origin
  ON ceac_scheduled_notifications (journey_id, reminder_origin, status);

-- Index for trigger group queries (already exists for ceac, add for journey)
CREATE INDEX IF NOT EXISTS idx_csn_reminder_id
  ON ceac_scheduled_notifications (journey_id, reminder_id, status);

COMMENT ON COLUMN ceac_scheduled_notifications.reminder_origin IS
  'ceac = from CeacReminderEngine (Ch3 CEAC status reminders); journey = from UnifiedReminderEngine (Ch1/Ch2/Ch3 registry)';

COMMENT ON COLUMN ceac_scheduled_notifications.step_trigger_key IS
  'For journey reminders: which step_key triggered this reminder chain';
