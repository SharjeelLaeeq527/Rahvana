-- ============================================================
-- CLEANUP: remove the temporary diagnostic RPCs that were used to trace the
-- journeys INSERT RLS failure. They are no longer needed now that the real fix
-- (20260625_10_fix_journeys_select_returning.sql) is in place.
-- ============================================================

DROP FUNCTION IF EXISTS public.whoami();
DROP FUNCTION IF EXISTS public.authdiag();
DROP FUNCTION IF EXISTS public.try_insert_journey();

NOTIFY pgrst, 'reload schema';
