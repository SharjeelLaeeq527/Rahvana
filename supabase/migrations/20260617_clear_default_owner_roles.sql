-- ============================================================
-- Clear premature default owner roles
-- See docs/partner-collaboration-spec.md §7.1
-- ------------------------------------------------------------
-- The Phase-1 backfill (and an earlier self-heal) set owner rows to
-- case_role = 'beneficiary' by default. The confirmed product decision is that
-- roles are chosen LATER, by either spouse, only once BOTH are in the case.
--
-- So: for any journey that does NOT yet have an active partner, the owner's
-- case_role is premature — reset it to NULL. Cases that already have a partner
-- (a real two-person setup where roles may have been assigned) are left alone.
--
-- Safe + re-runnable: only touches owner rows in solo (partner-less) cases.
-- ============================================================

UPDATE public.case_collaborators owner_row
SET case_role = NULL
WHERE owner_row.membership_role = 'owner'
  AND owner_row.status = 'active'
  AND owner_row.case_role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.case_collaborators partner_row
    WHERE partner_row.journey_id = owner_row.journey_id
      AND partner_row.membership_role = 'partner'
      AND partner_row.status = 'active'
  );
