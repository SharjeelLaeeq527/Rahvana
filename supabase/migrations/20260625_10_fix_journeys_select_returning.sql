-- ============================================================
-- THE REAL FIX: journeys INSERT failed with RLS 42501 even though the INSERT
-- WITH CHECK (auth.uid() = user_id) passes.
--
-- Cause: createJourneyDB inserts with `.select()` -> `INSERT ... RETURNING`.
-- Postgres applies the SELECT policy to the RETURNING row. That policy was
-- member-only:  USING is_journey_member(id, auth.uid()).
-- is_journey_member() is SECURITY DEFINER + STABLE, so it reads the snapshot
-- from the start of the statement, which does NOT contain the row being
-- inserted. For the owner's brand-new journey there is also no
-- case_collaborators row yet -> the function returns FALSE -> the RETURNING
-- row is judged invisible -> 42501. Only ever hits the owner's FIRST/new
-- journey (existing users never re-create), which is exactly the
-- "delete then create fails" symptom.
--
-- Fix: let the SELECT (and UPDATE) policy also pass on a DIRECT column check
-- of the row itself (user_id = auth.uid()). That reads the NEW row's own
-- column with no table lookup, so it is true immediately during RETURNING.
-- Partner/spouse access stays intact via the is_journey_member() branch.
--
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

-- ── SELECT: owner (direct) OR any case member ────────────────────────────────
DROP POLICY IF EXISTS "Members can view case journeys" ON public.journeys;
DROP POLICY IF EXISTS "Users can view own journeys"    ON public.journeys;

CREATE POLICY "Members can view case journeys"
  ON public.journeys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_journey_member(id, auth.uid()));

-- ── UPDATE: same shape (robust + lets UPDATE ... RETURNING work for owner) ───
DROP POLICY IF EXISTS "Members can update case journeys" ON public.journeys;
DROP POLICY IF EXISTS "Users can update own journeys"    ON public.journeys;

CREATE POLICY "Members can update case journeys"
  ON public.journeys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_journey_member(id, auth.uid()));

-- INSERT ("Users can insert own journeys") and DELETE ("Users can delete own
-- journeys") are already correct owner-only policies — left untouched.

-- ── Verify final state ───────────────────────────────────────────────────────
SELECT policyname, cmd, permissive, roles,
       qual AS using_expr, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'journeys'
ORDER BY cmd, permissive;
