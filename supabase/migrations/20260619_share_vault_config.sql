-- ============================================================
-- Phase 5b (part 2) — Share the Document Vault CHECKLIST config across spouses
-- ============================================================
-- `document_vault_config` drives the "required documents" checklist a user sees
-- (visa category, scenario flags, custom/dynamic slots). It was PER-USER
-- (UNIQUE(user_id), RLS auth.uid() = user_id), so each spouse had their own
-- checklist layout. This makes it ONE shared config per case (journey): both
-- spouses see the same checklist, and a custom slot one adds shows for the other.
--
-- The uploaded files themselves were already shared in
-- 20260618_share_documents_vault.sql; this completes the picture.
--
-- Idempotent + re-runnable.

BEGIN;

-- ── 1. Add journey scope ───────────────────────────────────────────────────
ALTER TABLE public.document_vault_config
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE;

-- ── 2. Backfill from each owner's most recent journey ──────────────────────
UPDATE public.document_vault_config c
SET journey_id = j.id
FROM (
  SELECT DISTINCT ON (user_id) user_id, id
  FROM public.journeys
  ORDER BY user_id, updated_at DESC
) j
WHERE c.journey_id IS NULL
  AND c.user_id = j.user_id;

-- ── 3. Dedupe before adding UNIQUE(journey_id): if a journey somehow has more
--       than one config, keep the most recently updated and drop the rest.
DELETE FROM public.document_vault_config c
USING public.document_vault_config c2
WHERE c.journey_id IS NOT NULL
  AND c.journey_id = c2.journey_id
  AND c.id <> c2.id
  AND (c.updated_at < c2.updated_at
       OR (c.updated_at = c2.updated_at AND c.id < c2.id));

-- ── 4. Swap uniqueness: per-user → per-journey (one shared config per case).
--       Drop UNIQUE(user_id) so a spouse editing the shared row can't collide
--       with a stray pre-join personal config. Add a non-partial
--       UNIQUE(journey_id) (NULLs are distinct) so PostgREST upsert can target
--       it. Journey-less configs are handled in code (select-then-write).
ALTER TABLE public.document_vault_config
  DROP CONSTRAINT IF EXISTS document_vault_config_user_id_key;
ALTER TABLE public.document_vault_config
  DROP CONSTRAINT IF EXISTS document_vault_config_journey_uniq;
ALTER TABLE public.document_vault_config
  ADD CONSTRAINT document_vault_config_journey_uniq UNIQUE (journey_id);

CREATE INDEX IF NOT EXISTS idx_document_vault_config_journey_id
  ON public.document_vault_config(journey_id);

-- ── 5. Membership RLS ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own config"   ON public.document_vault_config;
DROP POLICY IF EXISTS "Users can insert their own config" ON public.document_vault_config;
DROP POLICY IF EXISTS "Users can update their own config" ON public.document_vault_config;
DROP POLICY IF EXISTS "Users can delete their own config" ON public.document_vault_config;

DROP POLICY IF EXISTS "Members can view case vault config"   ON public.document_vault_config;
DROP POLICY IF EXISTS "Members can insert case vault config" ON public.document_vault_config;
DROP POLICY IF EXISTS "Members can update case vault config" ON public.document_vault_config;
DROP POLICY IF EXISTS "Members can delete case vault config" ON public.document_vault_config;

CREATE POLICY "Members can view case vault config" ON public.document_vault_config
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );
CREATE POLICY "Members can insert case vault config" ON public.document_vault_config
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );
CREATE POLICY "Members can update case vault config" ON public.document_vault_config
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );
CREATE POLICY "Members can delete case vault config" ON public.document_vault_config
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );

-- ── 6. Realtime (so a partner's checklist edit can surface live later) ──────
ALTER TABLE public.document_vault_config REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'document_vault_config'
     )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.document_vault_config;
  END IF;
END $$;

COMMIT;
