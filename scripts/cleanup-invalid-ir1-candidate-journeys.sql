-- ============================================================================
-- One-off cleanup: remove INVALID IR-1 / CR-1 "candidate" journey rows
-- ============================================================================
--
-- WHY: IR-1 / CR-1 is a single-beneficiary journey and must NEVER have candidates.
-- Earlier the "Add Candidate" modal briefly allowed adding a Spouse (IR-1) candidate,
-- which created stray journey rows like `ir1_candidate-2` / `cr1_candidate-2`. Those
-- showed up as duplicate IR-1 cards in the Document Vault journey picker. The picker UI
-- now de-dupes them away, but the invalid rows still sit in the database. This script
-- deletes them for good. IR-5 / IR-2 candidate journeys (ir5_candidate-2, ...) are
-- legitimate and are NOT touched.
--
-- This is a DESTRUCTIVE, one-off data cleanup - it is NOT a schema migration and does
-- NOT live in supabase/migrations/. Run it by hand in the Supabase SQL editor.
--
-- HOW TO RUN:
--   1. Run STEP 1 (preview) and confirm the rows look correct (should only be
--      ir1_candidate* / cr1_candidate*).
--   2. Run STEP 2 (the transaction) to delete them.
--   3. Optionally run STEP 3 to verify nothing is left.
--
-- Cascade note: deleting a `journeys` row auto-removes its `chapters` (-> `steps`),
-- `case_data`, `documents`, and `journey_reminders` (all ON DELETE CASCADE). The four
-- journey-scoped tables that have NO FK to journeys (journey_documents, tool_sessions,
-- journey_portal_records, journey_appointments) do NOT cascade, so STEP 2 deletes from them
-- explicitly first to avoid orphaned rows. If any of those four tables does not exist in your
-- project, comment out its line (the transaction will otherwise roll back harmlessly).
-- ============================================================================

-- The match pattern: IR-1 / CR-1 base with a candidate suffix, case-insensitive.
-- Matches:  ir1_candidate2, ir1_candidate-2, CR1_candidate3, ...
-- Does NOT match:  ir1 (the real IR-1 journey), ir5_candidate-2, ir2_candidate-3.

-- ---------------------------------------------------------------------------
-- STEP 1 - PREVIEW (read-only). Run this first and eyeball the result.
-- ---------------------------------------------------------------------------
SELECT id, user_id, journey_type, status, created_at
FROM public.journeys
WHERE journey_type ~* '^(ir1|cr1)_candidate'
ORDER BY user_id, journey_type;

-- ---------------------------------------------------------------------------
-- STEP 2 - DELETE (destructive). Run only after the preview looks right.
-- ---------------------------------------------------------------------------
BEGIN;

-- Non-cascading journey-scoped children (delete BEFORE the journeys rows).
DELETE FROM public.journey_documents
WHERE journey_id IN (SELECT id FROM public.journeys WHERE journey_type ~* '^(ir1|cr1)_candidate');

DELETE FROM public.tool_sessions
WHERE journey_id IN (SELECT id FROM public.journeys WHERE journey_type ~* '^(ir1|cr1)_candidate');

DELETE FROM public.journey_portal_records
WHERE journey_id IN (SELECT id FROM public.journeys WHERE journey_type ~* '^(ir1|cr1)_candidate');

DELETE FROM public.journey_appointments
WHERE journey_id IN (SELECT id FROM public.journeys WHERE journey_type ~* '^(ir1|cr1)_candidate');

-- journey_reminders, chapters, steps, case_data, documents all have ON DELETE CASCADE to
-- journeys, so they are removed automatically by the journeys delete below - no manual
-- delete needed. notifications.journey_id is ON DELETE SET NULL (link is nulled, row kept).

-- Finally the journeys rows themselves. Cascade removes chapters/steps/case_data/documents.
DELETE FROM public.journeys
WHERE journey_type ~* '^(ir1|cr1)_candidate';

COMMIT;

-- ---------------------------------------------------------------------------
-- STEP 3 - VERIFY (optional). Should return 0 rows.
-- ---------------------------------------------------------------------------
-- SELECT id, user_id, journey_type FROM public.journeys
-- WHERE journey_type ~* '^(ir1|cr1)_candidate';
