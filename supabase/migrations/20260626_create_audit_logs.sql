-- ============================================================
-- Migration: Create Audit Logs Table
-- Date: 2026-06-26
-- Purpose: Track security-relevant events for compliance,
--          debugging, and abuse detection.
--
-- Logged events include:
--   - Authentication: signup, login, password reset, MFA
--   - Data access: portal wallet view/save, admin access
--   - Security: rate limiting blocks
-- ============================================================

-- ── Step 1: Create the audit_logs table ─────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,                    -- e.g. 'auth.signup', 'auth.login_failed'
  resource    TEXT,                              -- e.g. 'profiles', 'portal_wallet_credentials'
  resource_id TEXT,                              -- ID of the affected resource (optional)
  ip_address  TEXT,                              -- Client IP (from x-forwarded-for)
  user_agent  TEXT,                              -- Client User-Agent string
  metadata    JSONB DEFAULT '{}'::jsonb,         -- Extra context (action-specific)
  status      TEXT DEFAULT 'success'             -- 'success', 'failure', 'blocked'
              CHECK (status IN ('success', 'failure', 'blocked')),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Step 2: Create indexes for common queries ───────────────

-- Admin dashboard: "Show me all events for user X"
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created
  ON audit_logs (user_id, created_at DESC);

-- Security review: "Show me all failed login attempts"
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs (action, created_at DESC);

-- Rate limit analysis: "Show me all events from IP X"
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_created
  ON audit_logs (ip_address, created_at DESC);

-- ── Step 3: Enable RLS ──────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── Step 4: RLS Policies ────────────────────────────────────

-- Users can view their own audit logs (account security page)
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role can do everything (server-side inserts)
DROP POLICY IF EXISTS "Service role manages audit logs" ON audit_logs;
CREATE POLICY "Service role manages audit logs"
ON audit_logs FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Admin users can view all audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- No one can update or delete audit logs (immutable trail)
-- (Only service_role can insert, via the policy above)

-- ── Step 5: Auto-cleanup old logs (optional, run manually) ──
-- To prevent the table from growing indefinitely, run this
-- periodically via a cron job or Supabase Edge Function:
--
--   DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
--
-- For now, logs are retained indefinitely.

-- ── Step 6: Verify ──────────────────────────────────────────
-- Run these to confirm:
--
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename = 'audit_logs';
-- Expected: rowsecurity = true
--
-- SELECT policyname, tablename, cmd FROM pg_policies
-- WHERE tablename = 'audit_logs'
-- ORDER BY cmd;
-- Expected: 3 policies (user SELECT, admin SELECT, service_role ALL)
-- ============================================================
