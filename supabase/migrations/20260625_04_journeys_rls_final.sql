-- ============================================================
-- FIX: "new row violates row-level security policy for table journeys"
-- ------------------------------------------------------------
-- Symptom: deleting a journey and creating a fresh one (or any brand-new
-- journey) fails on INSERT with an RLS violation.
--
-- Root cause: the live DB drifted from the migration files. The owner-only
-- INSERT policy on public.journeys was replaced with a member-based check
-- (is_journey_member(id, auth.uid())) or dropped entirely. A member-based
-- INSERT can NEVER pass for a new journey: the row does not exist yet, so
-- there is no case_collaborators membership to satisfy the check -- a
-- chicken-and-egg deadlock that blocks every create.
--
-- This migration drops EVERY policy on public.journeys (whatever its name,
-- including any RESTRICTIVE ones that would veto an insert) and recreates
-- only the canonical four:
--   INSERT  -> owner-only      (auth.uid() = user_id)
--   DELETE  -> owner-only      (auth.uid() = user_id)
--   SELECT  -> case member     (is_journey_member) -- owner-only fallback
--   UPDATE  -> case member     (is_journey_member) -- owner-only fallback
--
-- The critical INSERT/DELETE owner policies are created FIRST and have no
-- external dependency, so the fix lands even if is_journey_member() is
-- missing in a drifted DB.
--
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

-- ── 1. Drop ALL existing policies on journeys, whatever their name ────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT polname
    FROM pg_policy
    JOIN pg_class     ON pg_class.oid = pg_policy.polrelid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_class.relname = 'journeys'
      AND pg_namespace.nspname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.journeys', pol.polname);
    RAISE NOTICE 'Dropped policy on journeys: %', pol.polname;
  END LOOP;
END $$;

-- ── 2. Recreate canonical INSERT/DELETE (owner-only, no dependencies) ─────────
CREATE POLICY "Users can insert own journeys"
  ON public.journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journeys"
  ON public.journeys FOR DELETE
  USING (auth.uid() = user_id);

-- ── 3. SELECT/UPDATE: member-based if is_journey_member() exists, else owner ──
DO $$
DECLARE
  has_member_fn BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_journey_member'
  ) INTO has_member_fn;

  IF has_member_fn THEN
    EXECUTE 'CREATE POLICY "Members can view case journeys"   ON public.journeys FOR SELECT USING (public.is_journey_member(id, auth.uid()))';
    EXECUTE 'CREATE POLICY "Members can update case journeys" ON public.journeys FOR UPDATE USING (public.is_journey_member(id, auth.uid()))';
  ELSE
    EXECUTE 'CREATE POLICY "Users can view own journeys"   ON public.journeys FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own journeys" ON public.journeys FOR UPDATE USING (auth.uid() = user_id)';
    RAISE NOTICE 'is_journey_member() not found - owner-only SELECT/UPDATE fallback used.';
  END IF;
END $$;

-- ── 4. VERIFY — final policy set on public.journeys ───────────────────────────
-- Expected:
--   INSERT  PERMISSIVE  with_check = (auth.uid() = user_id)
--   DELETE  PERMISSIVE  using      = (auth.uid() = user_id)
--   SELECT  PERMISSIVE  using      = is_journey_member(id, auth.uid())
--   UPDATE  PERMISSIVE  using      = is_journey_member(id, auth.uid())
-- Confirm: INSERT with_check is owner-based (NOT member-based), and NO row
-- is RESTRICTIVE (a RESTRICTIVE INSERT/ALL policy would veto the create).
SELECT
  polname AS policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'    ELSE polcmd::text
  END AS command,
  CASE WHEN polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS kind,
  pg_get_expr(polqual,      polrelid) AS using_expr,
  pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
JOIN pg_class ON pg_class.oid = pg_policy.polrelid
WHERE pg_class.relname = 'journeys'
ORDER BY command;
