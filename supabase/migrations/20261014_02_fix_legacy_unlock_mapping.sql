-- Correct the legacy add-on backfill from 20261013_05_migrate_legacy_addons.sql.
--
-- That backfill wrote EVERY legacy add-on as a permanent `resource_type = 'tool'`
-- unlock. Two problems for Phase 3 (catalog + launch-tool):
--
-- 1. Guides were typed 'tool'. Unlocks are unique per (user, resource_type,
--    resource_id) and the deduct RPC checks the exact type, so a Phase 3 launch of
--    ('guide', 'guide-passport') would not see the legacy ('tool', 'guide-passport')
--    row and would charge the user again. Fix: retype them to 'guide'.
--
-- 2. Consumable add-ons became permanent unlocks. In the legacy model these are
--    credit pools, not unlocks: each ledger entry grants a fixed number of uses
--    (lib/entitlements/config.ts `creditsPerAddon`; lib/entitlements/helpers.ts
--    `getCreditPools` counts duplicate ids), spent through `feature_usage`:
--      photo        -> photo_booth           (2 uses per purchase)
--      medical      -> medical_booking       (1 use per purchase)
--      pcc          -> pcc_filing            (1 use per purchase)
--      translate    -> document_translation  (1 use per purchase)
--      consultation -> expert_consultation   (1 use per purchase)
--    A permanent 'active' row would turn one paid booking into unlimited free
--    bookings once standalone access starts reading this table. Fix: remove the
--    migrated rows. Nothing is lost: remaining legacy uses keep working through
--    the untouched profile_details.purchased_addons + feature_usage path.
--    `doc-review` (Expert Case Review, a service) is removed for the same reason.
--
-- Only rows created by the backfill are touched (no transaction_id, tagged
-- metadata), so credit-paid unlocks are never modified. Idempotent.

DO $$
DECLARE
    c_migrated CONSTANT TEXT := 'user_profiles.profile_details.purchased_addons';
BEGIN
    -- 1a. A user who somehow already has the correct 'guide' row: drop the
    --     mistyped duplicate so the retype below cannot hit the unique key.
    DELETE FROM public.standalone_unlocked_resources t
    WHERE t.resource_type = 'tool'
      AND t.transaction_id IS NULL
      AND t.metadata->>'migrated_from' = c_migrated
      AND (t.resource_id LIKE 'guide-%' OR t.resource_id = 'civil-guid')
      AND EXISTS (
          SELECT 1 FROM public.standalone_unlocked_resources g
          WHERE g.user_id = t.user_id
            AND g.resource_type = 'guide'
            AND g.resource_id = t.resource_id
      );

    -- 1b. Retype guides (and the Civil Document Guides bundle) to 'guide'.
    UPDATE public.standalone_unlocked_resources
    SET resource_type = 'guide'
    WHERE resource_type = 'tool'
      AND transaction_id IS NULL
      AND metadata->>'migrated_from' = c_migrated
      AND (resource_id LIKE 'guide-%' OR resource_id = 'civil-guid');

    -- 2. Remove consumable / service add-ons that were turned into permanent unlocks.
    --    Resource ids as written by the backfill's CASE mapping.
    DELETE FROM public.standalone_unlocked_resources
    WHERE transaction_id IS NULL
      AND metadata->>'migrated_from' = c_migrated
      AND resource_id IN (
          'photo-booth',
          'book-medical-appointment',
          'pcc-filing-service',
          'document-translation',
          'book-a-consultation',
          'doc-review'
      );
END $$;
