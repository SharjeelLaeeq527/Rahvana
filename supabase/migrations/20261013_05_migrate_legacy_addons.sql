-- Idempotent legacy purchased-addons backfill.

-- IDEMPOTENT LEGACY BACKFILL MIGRATION
-- Migrate existing purchased addons from user_profiles to standalone_unlocked_resources
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_profiles'
          AND column_name = 'profile_details'
    ) THEN
        INSERT INTO public.standalone_unlocked_resources (
            user_id,
            resource_type,
            resource_id,
            status,
            metadata,
            unlocked_at
        )
        SELECT
            up.id AS user_id,
            'tool' AS resource_type,
            CASE
                WHEN addon_item = 'sponsor' THEN 'sponsorship-calculator'
                WHEN addon_item = 'smart' THEN 'form-forge'
                WHEN addon_item = 'photo' THEN 'photo-booth'
                WHEN addon_item = '221g' THEN '221g-planner'
                WHEN addon_item LIKE 'interview-prep%' THEN 'interview-prep'
                WHEN addon_item = 'pdf' THEN 'pdf-toolkit'
                WHEN addon_item = 'medical' THEN 'book-medical-appointment'
                WHEN addon_item = 'pcc' THEN 'pcc-filing-service'
                WHEN addon_item = 'translate' THEN 'document-translation'
                WHEN addon_item = 'consultation' THEN 'book-a-consultation'
                ELSE addon_item
            END AS resource_id,
            'active' AS status,
            jsonb_build_object(
                'migrated_from', 'user_profiles.profile_details.purchased_addons',
                'original_addon_key', addon_item,
                'migrated_at', NOW()
            ) AS metadata,
            NOW() AS unlocked_at
        FROM public.user_profiles up,
        LATERAL jsonb_array_elements_text(COALESCE(up.profile_details->'purchased_addons', '[]'::jsonb)) AS addon_item
        ON CONFLICT (user_id, resource_type, resource_id) DO NOTHING;
    END IF;
END $$;
