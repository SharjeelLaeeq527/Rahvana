-- Keep legacy Interview Prep purchases scoped to the category that was bought.
--
-- 20261013_05_migrate_legacy_addons.sql mapped every `interview-prep%` add-on to a
-- permanent ('tool', 'interview-prep') unlock. Interview Prep was sold per
-- category ("interview-prep:ir-1-spouse"), with one session per purchase
-- (lib/interview-prep/purchase-validation.ts). Once the standalone tool honours
-- wallet unlocks, that row would turn one category purchase into unlimited
-- sessions in every category.
--
-- Fix: remove backfilled interview-prep rows unless the user's ledger holds the
-- bare "interview-prep" add-on (the all-categories purchase). Category buyers keep
-- exactly what they bought through the untouched purchased_addons +
-- interview_prep_sessions path.
--
-- Only rows created by the backfill are touched (no transaction_id, tagged
-- metadata), so credit-paid unlocks are never modified. Idempotent.

DO $$
DECLARE
    c_migrated CONSTANT TEXT := 'user_profiles.profile_details.purchased_addons';
BEGIN
    DELETE FROM public.standalone_unlocked_resources r
    WHERE r.resource_type = 'tool'
      AND r.resource_id = 'interview-prep'
      AND r.transaction_id IS NULL
      AND r.metadata->>'migrated_from' = c_migrated
      AND NOT EXISTS (
          SELECT 1
          FROM public.user_profiles up,
          LATERAL jsonb_array_elements_text(
              CASE
                  WHEN jsonb_typeof(up.profile_details->'purchased_addons') = 'array'
                  THEN up.profile_details->'purchased_addons'
                  ELSE '[]'::jsonb
              END
          ) AS addon_item
          WHERE up.id = r.user_id
            AND addon_item = 'interview-prep'
      );
END $$;
