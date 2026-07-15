-- Migration: Fix critical RLS security gaps
-- Created: 2026-07-15
-- Description:
--   Closes four data-exposure holes found in a security audit. All four tables
--   store sensitive/PII data but were reachable with only the public anon key:
--
--     1. consultation_bookings  — had `SELECT TO public USING (true)` (full PII leak)
--                                  and `INSERT TO public WITH CHECK (true)` (spam).
--     2. translation_documents  — RLS was never enabled (wide open).
--     3. interview_prep_sessions / _answers / _results — RLS never enabled.
--     4. risk_flags             — RLS never enabled.
--
--   Access-pattern verified before writing (so this does NOT break the app):
--     - consultation_bookings: all server writes/reads go through the SERVICE ROLE
--       key (consultationService.ts, book-appointment, consultation routes), which
--       BYPASSES RLS. Anonymous public bookings are inserted server-side via that
--       key, so removing the public policies is safe.
--     - translation_documents: list/upload routes use the authed SSR client and
--       filter/insert by user.id (owner policy fits); admin/verify/upload-translation
--       routes use the service-role key (bypass RLS).
--     - interview_prep_* and risk_flags: data-access uses the authed SSR client and
--       filters by user_id / parent-session ownership (owner + EXISTS policies fit).
--
--   The service_role policies below are belt-and-suspenders; the service role has
--   BYPASSRLS in Supabase and works regardless, but we add them for consistency
--   with the rest of the migration set.

BEGIN;

-- ============================================================================
-- 1. consultation_bookings — replace public SELECT/INSERT with owner-scoped
-- ============================================================================
-- RLS is already ENABLED (see 20260228_18). We only swap out the two dangerous
-- public policies; the existing "Admin can manage consultation bookings" policy
-- is left intact.

DROP POLICY IF EXISTS "Public can view consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Public can create consultation bookings" ON public.consultation_bookings;

-- Authenticated users may read only their own bookings.
CREATE POLICY "Users can view own consultation bookings"
  ON public.consultation_bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users may create a booking only for themselves.
-- (Anonymous / not-logged-in bookings are inserted server-side via the service
--  role, which bypasses RLS, so no public INSERT policy is needed.)
CREATE POLICY "Users can create own consultation bookings"
  ON public.consultation_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. translation_documents — enable RLS + owner-scoped policies
-- ============================================================================
ALTER TABLE public.translation_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own translation documents" ON public.translation_documents;
DROP POLICY IF EXISTS "Users can insert own translation documents" ON public.translation_documents;
DROP POLICY IF EXISTS "Users can update own translation documents" ON public.translation_documents;
DROP POLICY IF EXISTS "Service role manages translation documents" ON public.translation_documents;

CREATE POLICY "Users can view own translation documents"
  ON public.translation_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translation documents"
  ON public.translation_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own translation documents"
  ON public.translation_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin workflow (upload-translation, verify, admin listing) runs via the
-- service-role key. Explicit ALL policy for clarity/defense-in-depth.
CREATE POLICY "Service role manages translation documents"
  ON public.translation_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. interview_prep_sessions / _answers / _results — enable RLS + policies
-- ============================================================================

-- 3a. Sessions (owns user_id directly)
ALTER TABLE public.interview_prep_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own interview sessions" ON public.interview_prep_sessions;
DROP POLICY IF EXISTS "Service role manages interview sessions" ON public.interview_prep_sessions;

CREATE POLICY "Users manage own interview sessions"
  ON public.interview_prep_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages interview sessions"
  ON public.interview_prep_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3b. Answers (scoped through parent session ownership)
ALTER TABLE public.interview_prep_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own interview answers" ON public.interview_prep_answers;
DROP POLICY IF EXISTS "Service role manages interview answers" ON public.interview_prep_answers;

CREATE POLICY "Users manage own interview answers"
  ON public.interview_prep_answers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.interview_prep_sessions s
    WHERE s.id = interview_prep_answers.session_id
      AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_prep_sessions s
    WHERE s.id = interview_prep_answers.session_id
      AND s.user_id = auth.uid()
  ));

CREATE POLICY "Service role manages interview answers"
  ON public.interview_prep_answers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3c. Results (scoped through parent session ownership)
ALTER TABLE public.interview_prep_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own interview results" ON public.interview_prep_results;
DROP POLICY IF EXISTS "Service role manages interview results" ON public.interview_prep_results;

CREATE POLICY "Users manage own interview results"
  ON public.interview_prep_results
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.interview_prep_sessions s
    WHERE s.id = interview_prep_results.session_id
      AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_prep_sessions s
    WHERE s.id = interview_prep_results.session_id
      AND s.user_id = auth.uid()
  ));

CREATE POLICY "Service role manages interview results"
  ON public.interview_prep_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. risk_flags — enable RLS, scoped through parent user_case_sessions
-- ============================================================================
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own risk flags" ON public.risk_flags;
DROP POLICY IF EXISTS "Service role manages risk flags" ON public.risk_flags;

CREATE POLICY "Users view own risk flags"
  ON public.risk_flags
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_case_sessions s
    WHERE s.id = risk_flags.session_id
      AND s.user_id = auth.uid()
  ));

-- Risk flags are generated server-side (case-strength engine) via the service
-- role; users only ever read them, so no owner INSERT/UPDATE policy is granted.
CREATE POLICY "Service role manages risk flags"
  ON public.risk_flags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
