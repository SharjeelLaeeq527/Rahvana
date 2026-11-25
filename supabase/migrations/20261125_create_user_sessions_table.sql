-- Migration: Create user_sessions
-- Purpose: Track Rahvana sessions without storing auth tokens.

-- 1. Create user_sessions 
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL,
  device_name     TEXT NOT NULL DEFAULT 'Unknown device',
  browser         TEXT NOT NULL DEFAULT 'Unknown browser',
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ,
  CONSTRAINT user_sessions_user_session_unique UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active_by_user
  ON public.user_sessions (user_id, last_active_at DESC)
  WHERE revoked_at IS NULL;

-- 2. Restrict direct access to the server role
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_service_role_all" ON public.user_sessions;

CREATE POLICY "user_sessions_service_role_all"
  ON public.user_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
