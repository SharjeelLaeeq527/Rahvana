-- ============================================================
-- RLS verification for 20260616_create_case_collaboration.sql  (v2)
-- ------------------------------------------------------------
-- Run this v2 instead of the original test. The original used temp tables,
-- which are invisible after SET ROLE authenticated ("relation _u does not
-- exist"). This version keeps everything in ONE DO block using in-memory
-- PL/pgSQL variables, so role switching has no visibility problem.
--
-- HOW TO RUN
--   Supabase SQL editor (or psql) AFTER applying the migration.
--   Self-contained: creates throwaway data, switches identity to three
--   simulated users, asserts, then ROLLS BACK. Nothing persists.
--
-- WHY session_replication_role = replica
--   It disables TRIGGERS + FK checks for the run, so we can use fake user
--   UUIDs (no real auth.users rows) and the journeys "touch on case_data
--   change" trigger won't re-validate the fake FK. RLS is NOT affected by
--   this setting and stays fully enforced — if it somehow weren't, the
--   "stranger sees nothing" checks would fail loudly, so no silent false-pass.
--
-- WHAT IT PROVES
--   1. Owner sees their own journey + case_data.
--   2. Invited partner sees the SAME journey + case_data.
--   3. A stranger (non-member) sees nothing and is blocked.
--   4. Partner has FULL EDIT (can update case_data).
--   5. Stranger CANNOT insert case_data.
--   6. Partner CANNOT add a collaborator (owner-only).
--   7. Partner CANNOT delete the journey (owner-only).
-- ============================================================

BEGIN;

SET LOCAL session_replication_role = replica;

DO $$
DECLARE
  owner_id    uuid := gen_random_uuid();
  partner_id  uuid := gen_random_uuid();
  stranger_id uuid := gen_random_uuid();
  jid         uuid;
  got         int;
  ins_ok      boolean;
  failures    int := 0;
BEGIN
  -- ---- setup (privileged role; triggers/FK off) ----
  INSERT INTO public.journeys (user_id, journey_type)
    VALUES (owner_id, 'TEST_COLLAB_IR1')
    RETURNING id INTO jid;

  INSERT INTO public.case_data (journey_id, data_key, data_value)
    VALUES (jid, 'test_key', '"original"'::jsonb);

  INSERT INTO public.case_collaborators (journey_id, user_id, membership_role, case_role, status)
    VALUES (jid, owner_id,   'owner',   'beneficiary', 'active');
  INSERT INTO public.case_collaborators (journey_id, user_id, membership_role, case_role, status)
    VALUES (jid, partner_id, 'partner', 'petitioner',  'active');

  -- ===================== OWNER =====================
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT count(*) INTO got FROM public.journeys WHERE id = jid;
  IF got = 1 THEN RAISE NOTICE 'PASS  owner_sees_journey';
  ELSE RAISE WARNING 'FAIL  owner_sees_journey (got=%, want=1)', got; failures := failures + 1; END IF;

  SELECT count(*) INTO got FROM public.case_data WHERE journey_id = jid;
  IF got = 1 THEN RAISE NOTICE 'PASS  owner_sees_case_data';
  ELSE RAISE WARNING 'FAIL  owner_sees_case_data (got=%, want=1)', got; failures := failures + 1; END IF;

  EXECUTE 'RESET ROLE';

  -- ===================== PARTNER (invited spouse) =====================
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', partner_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT count(*) INTO got FROM public.journeys WHERE id = jid;
  IF got = 1 THEN RAISE NOTICE 'PASS  partner_sees_journey';
  ELSE RAISE WARNING 'FAIL  partner_sees_journey (got=%, want=1)', got; failures := failures + 1; END IF;

  SELECT count(*) INTO got FROM public.case_data WHERE journey_id = jid;
  IF got = 1 THEN RAISE NOTICE 'PASS  partner_sees_case_data';
  ELSE RAISE WARNING 'FAIL  partner_sees_case_data (got=%, want=1)', got; failures := failures + 1; END IF;

  -- Full edit: partner updates the shared case_data row.
  UPDATE public.case_data SET data_value = '"edited-by-partner"'::jsonb WHERE journey_id = jid;
  GET DIAGNOSTICS got = ROW_COUNT;
  IF got = 1 THEN RAISE NOTICE 'PASS  partner_can_update_case_data';
  ELSE RAISE WARNING 'FAIL  partner_can_update_case_data (rows=%, want=1)', got; failures := failures + 1; END IF;

  EXECUTE 'RESET ROLE';

  -- ===================== STRANGER (non-member) =====================
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', stranger_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT count(*) INTO got FROM public.journeys WHERE id = jid;
  IF got = 0 THEN RAISE NOTICE 'PASS  stranger_sees_no_journey';
  ELSE RAISE WARNING 'FAIL  stranger_sees_no_journey (got=%, want=0)', got; failures := failures + 1; END IF;

  SELECT count(*) INTO got FROM public.case_data WHERE journey_id = jid;
  IF got = 0 THEN RAISE NOTICE 'PASS  stranger_sees_no_case_data';
  ELSE RAISE WARNING 'FAIL  stranger_sees_no_case_data (got=%, want=0)', got; failures := failures + 1; END IF;

  -- Stranger must NOT be able to insert case_data into someone else's journey.
  BEGIN
    INSERT INTO public.case_data (journey_id, data_key, data_value)
      VALUES (jid, 'stranger_hack', '"x"'::jsonb);
    ins_ok := true;                 -- reached only if RLS WRONGLY allowed it
  EXCEPTION WHEN others THEN
    ins_ok := false;                -- blocked = correct
  END;
  IF ins_ok = false THEN RAISE NOTICE 'PASS  stranger_cannot_insert_case_data';
  ELSE RAISE WARNING 'FAIL  stranger_cannot_insert_case_data'; failures := failures + 1; END IF;

  EXECUTE 'RESET ROLE';

  -- ============ PARTNER write-restrictions (owner-only actions) ============
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', partner_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- Partner must NOT be able to add a collaborator.
  BEGIN
    INSERT INTO public.case_collaborators (journey_id, user_id, membership_role, status)
      VALUES (jid, gen_random_uuid(), 'partner', 'active');
    ins_ok := true;
  EXCEPTION WHEN others THEN
    ins_ok := false;
  END;
  IF ins_ok = false THEN RAISE NOTICE 'PASS  partner_cannot_add_collaborator';
  ELSE RAISE WARNING 'FAIL  partner_cannot_add_collaborator'; failures := failures + 1; END IF;

  -- Partner must NOT be able to delete the journey (owner-only).
  DELETE FROM public.journeys WHERE id = jid;
  GET DIAGNOSTICS got = ROW_COUNT;
  IF got = 0 THEN RAISE NOTICE 'PASS  partner_cannot_delete_journey';
  ELSE RAISE WARNING 'FAIL  partner_cannot_delete_journey (rows=%, want=0)', got; failures := failures + 1; END IF;

  EXECUTE 'RESET ROLE';

  -- ===================== Verdict =====================
  IF failures > 0 THEN
    RAISE EXCEPTION '% RLS check(s) FAILED — see WARNING lines above', failures;
  END IF;
  RAISE NOTICE 'ALL RLS CHECKS PASSED ✔';
END $$;

-- Nothing persists.
ROLLBACK;
