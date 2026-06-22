-- ============================================================
-- Case roles are ONE-TIME — no swapping after assignment
-- See docs/partner-collaboration-spec.md §7.1
-- ------------------------------------------------------------
-- Product decision (owner): roles must be chosen carefully ONCE. The UI shows a
-- confirmation modal before committing, and roles can NOT be swapped afterward.
-- This replaces the earlier swap-capable assign_case_roles() (20260617): the
-- function now refuses to run if EITHER active member already has a case_role.
--
-- Because we only ever go from all-NULL -> set-once, the old transient-duplicate
-- problem on the partial unique index can't occur, but we keep the NULL-then-set
-- shape for safety/idempotence.
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
  v_already_set  INT;
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

  -- ONE-TIME guard: if a role is already set for this case, refuse. Roles are
  -- chosen once (with a confirmation) and cannot be swapped afterward.
  SELECT count(*) INTO v_already_set
  FROM public.case_collaborators
  WHERE journey_id = p_journey_id AND status = 'active' AND case_role IS NOT NULL;

  IF v_already_set > 0 THEN
    RAISE EXCEPTION 'Roles have already been assigned for this case and cannot be changed.'
      USING ERRCODE = '22023';
  END IF;

  -- Step 1: clear both roles (no-op here since none are set, kept for safety).
  UPDATE public.case_collaborators
  SET case_role = NULL
  WHERE journey_id = p_journey_id AND status = 'active';

  -- Step 2: assign distinct roles. Caller -> chosen, the other -> opposite.
  UPDATE public.case_collaborators
  SET case_role = CASE WHEN user_id = v_caller THEN p_caller_role ELSE v_other_role END
  WHERE journey_id = p_journey_id AND status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.assign_case_roles(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_case_roles(UUID, TEXT) TO authenticated, service_role;
