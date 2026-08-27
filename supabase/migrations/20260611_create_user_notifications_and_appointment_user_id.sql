-- ============================================================================
-- Migration: In-App Notifications + Appointment user_id
-- Created: 2026-06-11
-- Description:
--   1. Creates app_notifications table for in-app notifications
--   2. Adds user_id column to appointments table for robust user matching
-- ============================================================================

-- ============================================================================
-- 1. CREATE app_notifications TABLE
-- ============================================================================
DROP TABLE IF EXISTS app_notifications CASCADE;

CREATE TABLE app_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'appointment_status',
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  action_label TEXT,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by user + non-dismissed
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id 
  ON app_notifications(user_id, dismissed, created_at DESC);

-- Enable RLS
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON app_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark read/dismiss) their own notifications
CREATE POLICY "Users can update own notifications"
  ON app_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert notifications (from server-side API)
CREATE POLICY "Service role can insert notifications"
  ON app_notifications FOR INSERT
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access"
  ON app_notifications FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. ADD user_id TO appointments TABLE
-- ============================================================================
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for looking up appointments by user
CREATE INDEX IF NOT EXISTS idx_appointments_user_id 
  ON appointments(user_id);

-- Backfill existing appointments: match email to profiles
-- This updates rows where user_id is null and a matching profile email exists
UPDATE appointments a
SET user_id = p.id
FROM profiles p
WHERE a.user_id IS NULL
  AND LOWER(a.email) = LOWER(p.email);
