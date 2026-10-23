-- Phase 7: keep legacy add-on purchases as standalone unlocks, correctly and
-- going forward.
--
-- 20261013_05 was a one-time snapshot with a broad CASE (consumables, services
-- and every interview-prep category became permanent 'tool' rows, unknown ids
-- fell through as-is); 20261014_02 and 20261022_01 then cleaned that up. Gaps
-- that remained:
--   * add-ons bought AFTER that snapshot (the pricing page still sells them
--     through Stripe) never got a row, and
--   * 20261013_05 aborts on a non-array purchased_addons.
-- Access never depended on the rows (lib/wallet/catalog.ts resolveUnlockedItems
-- also reads purchased_addons live), but the table is meant to be complete.
--
-- This adds ONE mapping, the same as the catalog (`legacyAddonId` with
-- `legacyGrantsUnlock`), as a re-runnable function, runs it for everyone, keeps it
-- in sync with a trigger, and removes backfilled rows outside that mapping.
-- Never mapped: photo (2 uses per purchase), every service (one booking per
-- purchase), per-category interview prep ("interview-prep:<slug>"), anything
-- unknown. Existing rows are never changed (ON CONFLICT DO NOTHING), so a revoked
-- or credit-paid unlock is left as it is.
-- __tests__/wallet/legacyBackfill.test.ts fails if this mapping drifts from the
-- catalog.

CREATE OR REPLACE FUNCTION public.legacy_addon_unlock_map()
RETURNS TABLE (addon_id TEXT, resource_type TEXT, resource_id TEXT)
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  VALUES
    -- LEGACY_ADDON_MAP_START
    ('sponsor', 'tool', 'sponsorship-calculator'),
    ('smart', 'tool', 'form-forge'),
    ('221g', 'tool', '221g-planner'),
    ('interview-prep', 'tool', 'interview-prep'),
    ('pdf', 'tool', 'pdf-toolkit'),
    ('guide-passport', 'guide', 'guide-passport'),
    ('guide-police', 'guide', 'guide-police'),
    ('guide-cnic', 'guide', 'guide-cnic'),
    ('guide-birth-cert', 'guide', 'guide-birth-cert'),
    ('guide-frc', 'guide', 'guide-frc'),
    ('guide-nikah-nama', 'guide', 'guide-nikah-nama'),
    ('civil-guid', 'guide', 'civil-guid')
    -- LEGACY_ADDON_MAP_END
$$;

-- Insert the missing unlock rows for one user (or everyone when NULL).
-- Returns how many rows were added. Idempotent.
CREATE OR REPLACE FUNCTION public.sync_legacy_addon_unlocks(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.standalone_unlocked_resources (
    user_id, resource_type, resource_id, status, metadata, unlocked_at
  )
  SELECT DISTINCT ON (up.id, m.resource_type, m.resource_id)
    up.id,
    m.resource_type,
    m.resource_id,
    'active',
    jsonb_build_object(
      'migrated_from', 'user_profiles.profile_details.purchased_addons',
      'original_addon_key', m.addon_id,
      'migrated_at', NOW()
    ),
    NOW()
  FROM public.user_profiles up
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
      WHEN jsonb_typeof(up.profile_details -> 'purchased_addons') = 'array'
      THEN up.profile_details -> 'purchased_addons'
      ELSE '[]'::jsonb
    END
  ) AS addon(addon_id)
  JOIN public.legacy_addon_unlock_map() m ON m.addon_id = addon.addon_id
  WHERE (p_user_id IS NULL OR up.id = p_user_id)
    -- auth.users FK: skip orphaned profiles instead of failing the batch
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = up.id)
  ON CONFLICT (user_id, resource_type, resource_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_legacy_addon_unlocks(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_legacy_addon_unlocks(UUID) TO service_role;

-- Keep rows in sync whenever the add-on ledger changes (a Stripe add-on purchase).
-- Only service_role can change purchased_addons (20261023_01).
CREATE OR REPLACE FUNCTION public.handle_purchased_addons_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.sync_legacy_addon_unlocks(NEW.id);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_purchased_addons_changed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_legacy_addon_unlocks_ins ON public.user_profiles;
CREATE TRIGGER trg_sync_legacy_addon_unlocks_ins
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.profile_details -> 'purchased_addons' IS NOT NULL)
  EXECUTE FUNCTION public.handle_purchased_addons_changed();

DROP TRIGGER IF EXISTS trg_sync_legacy_addon_unlocks_upd ON public.user_profiles;
CREATE TRIGGER trg_sync_legacy_addon_unlocks_upd
  AFTER UPDATE OF profile_details ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.profile_details -> 'purchased_addons' IS DISTINCT FROM OLD.profile_details -> 'purchased_addons')
  EXECUTE FUNCTION public.handle_purchased_addons_changed();

-- Remove backfilled rows outside the mapping (leftovers of the 20261013_05 CASE,
-- e.g. retired add-on ids). Only rows the backfill created are touched.
DELETE FROM public.standalone_unlocked_resources r
WHERE r.transaction_id IS NULL
  AND r.metadata ->> 'migrated_from' = 'user_profiles.profile_details.purchased_addons'
  AND NOT EXISTS (
    SELECT 1 FROM public.legacy_addon_unlock_map() m
    WHERE m.resource_type = r.resource_type AND m.resource_id = r.resource_id
  );

-- Backfill everyone once.
SELECT public.sync_legacy_addon_unlocks(NULL);
