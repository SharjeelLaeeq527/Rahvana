-- ============================================================
-- Migration: RLS for user_case_sessions + user_case_answers
-- Date: 2026-03-19
--
-- Problem: These tables had NO Row Level Security policies.
-- Any authenticated user could query another user's session data,
-- and the owner could see ALL sessions in the Supabase dashboard.
--
-- Fix:
--  1. Enable RLS on both tables
--  2. Users can only CRUD their own sessions/answers
--  3. Service role retains full access for admin/server functions
-- ============================================================

-- ── Step 1: Enable RLS ──────────────────────────────────────
ALTER TABLE user_case_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_answers  ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Drop old/missing policies (safe) ────────────────
DROP POLICY IF EXISTS "Users can view own sessions"   ON user_case_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions"  ON user_case_sessions;
DROP POLICY IF EXISTS "Users can update own sessions"  ON user_case_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions"  ON user_case_sessions;
DROP POLICY IF EXISTS "Service role manages sessions"  ON user_case_sessions;

DROP POLICY IF EXISTS "Users can view own answers"    ON user_case_answers;
DROP POLICY IF EXISTS "Users can insert own answers"  ON user_case_answers;
DROP POLICY IF EXISTS "Users can update own answers"  ON user_case_answers;
DROP POLICY IF EXISTS "Users can delete own answers"  ON user_case_answers;
DROP POLICY IF EXISTS "Service role manages answers"  ON user_case_answers;

-- ── Step 3: user_case_sessions policies ─────────────────────
-- User can only see their own sessions
CREATE POLICY "Users can view own sessions"
ON user_case_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- User can only create sessions for themselves
CREATE POLICY "Users can insert own sessions"
ON user_case_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- User can only update their own sessions
CREATE POLICY "Users can update own sessions"
ON user_case_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- User can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON user_case_sessions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role bypasses RLS (for server-side operations)
CREATE POLICY "Service role manages sessions"
ON user_case_sessions FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- ── Step 4: user_case_answers policies ──────────────────────
-- Answers are linked to sessions. User can see answers only if
-- they own the parent session.
CREATE POLICY "Users can view own answers"
ON user_case_answers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_case_sessions s
    WHERE s.id = user_case_answers.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own answers"
ON user_case_answers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_case_sessions s
    WHERE s.id = user_case_answers.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own answers"
ON user_case_answers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_case_sessions s
    WHERE s.id = user_case_answers.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own answers"
ON user_case_answers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_case_sessions s
    WHERE s.id = user_case_answers.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Service role manages answers"
ON user_case_answers FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- ── Step 5: Verify ──────────────────────────────────────────
-- Run these to confirm (paste in SQL Editor):
--
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('user_case_sessions','user_case_answers');
-- Expected: rowsecurity = true for both
--
-- SELECT policyname, tablename, cmd FROM pg_policies
-- WHERE tablename IN ('user_case_sessions','user_case_answers')
-- ORDER BY tablename, cmd;
-- Expected: 5 policies per table
-- ============================================================
