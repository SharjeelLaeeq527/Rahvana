-- ============================================================
-- Case role assignment — atomic, either-spouse, swap-safe
-- See docs/partner-collaboration-spec.md §7.1
-- ------------------------------------------------------------
-- EITHER active member can assign/swap who is petitioner vs beneficiary.
-- The caller declares THEIR OWN role; the other active member automatically
-- gets the opposite.
--
-- WHY a function (not a route-side UPDATE):
--   1. Atomicity. A naive swap (A: pet->ben, B: ben->pet) trips the
--      `uniq_case_role_per_journey` PARTIAL unique index: Postgres checks it
--      per-row mid-statement and sees a transient duplicate. Partial unique
--      *indexes* can't be DEFERRABLE. Fix = NULL-then-set: first NULL both
--      rows (NULLs are excluded from the partial index), then assign distinct
--      values. Done inside one function body = one implicit transaction.
--   2. Permissions. RLS on case_collaborators is owner-only for writes. Making
--      this SECURITY DEFINER lets EITHER member assign without loosening that
--      strict table policy. Membership is re-checked inside using auth.uid().
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_case_roles(
  p_journey_id  UUID,
  p_caller_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_other_role   TEXT;
  v_active_count INT;
BEGIN
  -- Must be authenticated.
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Validate the requested role.
  IF p_caller_role NOT IN ('petitioner', 'beneficiary') THEN
    RAISE EXCEPTION 'Invalid role: %', p_caller_role USING ERRCODE = '22023';
  END IF;
  v_other_role := CASE WHEN p_caller_role = 'petitioner'
                       THEN 'beneficiary' ELSE 'petitioner' END;

  -- Caller must be an ACTIVE member of this journey.
  IF NOT EXISTS (
    SELECT 1 FROM public.case_collaborators
    WHERE journey_id = p_journey_id
      AND user_id = v_caller
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not a member of this case' USING ERRCODE = '42501';
  END IF;

  -- Roles only make sense once BOTH spouses are in the case.
  SELECT count(*) INTO v_active_count
  FROM public.case_collaborators
  WHERE journey_id = p_journey_id AND status = 'active';

  IF v_active_count <> 2 THEN
    RAISE EXCEPTION 'Both spouses must be in the case before assigning roles (active members: %)', v_active_count
      USING ERRCODE = '22023';
  END IF;

  -- Step 1: clear both roles. NULLs are excluded from the partial unique
  -- index, so this can never collide.
  UPDATE public.case_collaborators
  SET case_role = NULL
  WHERE journey_id = p_journey_id AND status = 'active';

  -- Step 2: assign distinct roles. Caller -> chosen, the other -> opposite.
  -- Going NULL -> distinct values means no transient duplicate.
  UPDATE public.case_collaborators
  SET case_role = CASE WHEN user_id = v_caller THEN p_caller_role ELSE v_other_role END
  WHERE journey_id = p_journey_id AND status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.assign_case_roles(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_case_roles(UUID, TEXT) TO authenticated, service_role;
