-- ============================================================
-- Spouse collaboration — Phase 5: shared FORMS + live progress
-- ------------------------------------------------------------
-- Spec: docs/partner-collaboration-spec.md
--
-- Goal: the autofiller forms (I-130, I-130A, DS-260, I-864) and all tool /
-- step progress must be visible — and editable — by BOTH spouses on a shared
-- case, updating in real time.
--
-- tool_sessions, steps, chapters, journeys, case_data were already switched to
-- membership-scoped RLS in 20260616. The ONE table left behind is
-- visa_forms_draft: it is keyed by user_id with journey_key = 'global', so a
-- partner can neither see nor edit the owner's form. This migration makes the
-- form draft CASE-scoped (one shared draft per journey + form_code) and opens
-- it to members, then enables Supabase Realtime on the progress tables so the
-- panel can update live.
--
-- Safe to re-run: guarded with IF EXISTS / IF NOT EXISTS and existence checks.
-- ============================================================

-- ------------------------------------------------------------
-- 1. visa_forms_draft → case-scoped
-- ------------------------------------------------------------

-- 1a. Link each draft to a journey (the shared case).
ALTER TABLE public.visa_forms_draft
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE;

-- 1b. Backfill: map every existing per-user draft to that user's most recent
--     journey. Solo users keep working unchanged; once a partner joins, both
--     now point at the same journey row. Drafts whose user has no journey stay
--     NULL and continue to work via the user_id fallback path below.
UPDATE public.visa_forms_draft d
SET journey_id = j.id
FROM (
  SELECT DISTINCT ON (user_id) user_id, id
  FROM public.journeys
  ORDER BY user_id, updated_at DESC
) j
WHERE d.journey_id IS NULL
  AND d.user_id = j.user_id;

-- 1c. Safety dedupe: if two drafts somehow map to the same (journey_id,
--     form_code), keep the most recently saved one so the unique constraint
--     below can be created. (Expected to be a no-op.)
DELETE FROM public.visa_forms_draft d
USING public.visa_forms_draft keep
WHERE d.journey_id IS NOT NULL
  AND d.journey_id = keep.journey_id
  AND d.form_code  = keep.form_code
  AND (
    d.last_saved_at < keep.last_saved_at
    OR (d.last_saved_at = keep.last_saved_at AND d.id < keep.id)
  );

-- 1d. One shared draft per case + form. NULL journey_id rows (journey-less
--     legacy / pre-journey saves) are excluded automatically because NULLs are
--     distinct, so they still use the per-user index. Non-partial so the
--     PostgREST upsert can target it via ON CONFLICT (journey_id, form_code).
ALTER TABLE public.visa_forms_draft
  DROP CONSTRAINT IF EXISTS visa_forms_draft_journey_form_uniq;
ALTER TABLE public.visa_forms_draft
  ADD CONSTRAINT visa_forms_draft_journey_form_uniq UNIQUE (journey_id, form_code);

CREATE INDEX IF NOT EXISTS visa_forms_draft_journey_idx
  ON public.visa_forms_draft (journey_id, updated_at DESC);

COMMENT ON COLUMN public.visa_forms_draft.journey_id IS
  'The shared case this draft belongs to. One draft per (journey_id, form_code) — both spouses read/write the same row. NULL only for legacy/journey-less drafts (fall back to per-user keying).';

-- 1e. RLS: a member of the journey may read/write the shared draft. Keep the
--     user_id path so journey-less legacy drafts (journey_id NULL) still work.
DROP POLICY IF EXISTS "Users can view their own visa drafts"   ON public.visa_forms_draft;
DROP POLICY IF EXISTS "Users can create their own visa drafts" ON public.visa_forms_draft;
DROP POLICY IF EXISTS "Users can update their own visa drafts" ON public.visa_forms_draft;
DROP POLICY IF EXISTS "Users can delete their own visa drafts" ON public.visa_forms_draft;

CREATE POLICY "Members can view case visa drafts" ON public.visa_forms_draft
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_journey_member(journey_id, auth.uid())
  );

CREATE POLICY "Members can create case visa drafts" ON public.visa_forms_draft
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.is_journey_member(journey_id, auth.uid())
  );

CREATE POLICY "Members can update case visa drafts" ON public.visa_forms_draft
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.is_journey_member(journey_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_journey_member(journey_id, auth.uid())
  );

CREATE POLICY "Members can delete case visa drafts" ON public.visa_forms_draft
  FOR DELETE USING (
    auth.uid() = user_id
    OR public.is_journey_member(journey_id, auth.uid())
  );

-- ------------------------------------------------------------
-- 2. Realtime — let the live progress panel react to changes
-- ------------------------------------------------------------
-- Supabase streams INSERT/UPDATE/DELETE over the `supabase_realtime`
-- publication. case_data is already published (used by package tracking); add
-- the progress tables. REPLICA IDENTITY FULL ensures the journey_id used as the
-- subscription filter is present on every change event (incl. UPDATE/DELETE).

ALTER TABLE public.visa_forms_draft REPLICA IDENTITY FULL;
ALTER TABLE public.tool_sessions    REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public' AND tablename = 'visa_forms_draft'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.visa_forms_draft;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public' AND tablename = 'tool_sessions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_sessions;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public' AND tablename = 'journeys'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.journeys;
    END IF;
  END IF;
END $$;
