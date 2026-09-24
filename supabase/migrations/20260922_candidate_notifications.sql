-- supabase/migrations/20260922_candidate_notifications.sql
-- ============================================================================
-- Migration: Add candidate_id and candidate context to Notifications and Reminders
-- Enables multi-beneficiary scoping for notifications and email alerts (IR-5 / IR-2)
-- ============================================================================

-- 1. Add candidate_id to notifications table if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'candidate_id') THEN
      ALTER TABLE public.notifications ADD COLUMN candidate_id TEXT DEFAULT 'candidate-1';
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'candidate_name') THEN
      ALTER TABLE public.notifications ADD COLUMN candidate_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'candidate_role') THEN
      ALTER TABLE public.notifications ADD COLUMN candidate_role TEXT;
    END IF;
  END IF;
END $$;

-- 2. Add candidate columns to app_notifications table if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_notifications') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'app_notifications' AND column_name = 'candidate_id') THEN
      ALTER TABLE public.app_notifications ADD COLUMN candidate_id TEXT DEFAULT 'candidate-1';
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'app_notifications' AND column_name = 'candidate_name') THEN
      ALTER TABLE public.app_notifications ADD COLUMN candidate_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'app_notifications' AND column_name = 'candidate_role') THEN
      ALTER TABLE public.app_notifications ADD COLUMN candidate_role TEXT;
    END IF;
  END IF;
END $$;

-- 3. Add candidate_id to scheduled_notifications / reminders if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scheduled_notifications') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scheduled_notifications' AND column_name = 'candidate_id') THEN
      ALTER TABLE public.scheduled_notifications ADD COLUMN candidate_id TEXT DEFAULT 'candidate-1';
    END IF;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ceac_case_status') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ceac_case_status' AND column_name = 'candidate_id') THEN
      ALTER TABLE public.ceac_case_status ADD COLUMN candidate_id TEXT DEFAULT 'candidate-1';
    END IF;
  END IF;
END $$;

-- 4. Add candidate columns to appointments table if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'candidate_id') THEN
      ALTER TABLE public.appointments ADD COLUMN candidate_id TEXT DEFAULT 'candidate-1';
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'candidate_name') THEN
      ALTER TABLE public.appointments ADD COLUMN candidate_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'candidate_role') THEN
      ALTER TABLE public.appointments ADD COLUMN candidate_role TEXT;
    END IF;
  END IF;
END $$;

-- 5. Create performance indexes for candidate-scoped lookups
CREATE INDEX IF NOT EXISTS idx_notifications_candidate_id ON public.notifications (user_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_candidate_id ON public.app_notifications (user_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_appointments_candidate_id ON public.appointments (user_id, candidate_id);
