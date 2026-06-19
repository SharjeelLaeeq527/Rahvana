-- ============================================================
-- Phase 5b — Share the Document Vault across both spouses of a case
-- ============================================================
-- Until now the vault table `documents` was PER-USER (RLS: auth.uid() = user_id)
-- and the journey "required documents" step reads it via /api/documents/list.
-- So when one spouse uploaded (e.g. the beneficiary passport), the partner saw
-- nothing. This migration makes the vault CASE-scoped: add journey_id, backfill
-- existing docs to the owner's journey, and switch to membership RLS so BOTH
-- spouses share one vault.
--
-- Encryption note: files stay encrypted with the UPLOADER's per-user key
-- (SHA-256(secret + uploader user_id)). No re-encryption needed — the
-- download/preview routes now decrypt with the stored documents.user_id (the
-- uploader), so a partner can open files the other uploaded.
--
-- Idempotent + re-runnable.

BEGIN;

-- ── 1. Add journey scope to the vault ──────────────────────────────────────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE;

-- ── 2. Backfill: attach each existing vault doc to its owner's most recent
--       journey. Owner = documents.user_id. Users with no journey stay NULL
--       (still readable by themselves via the user_id arm of the RLS below).
UPDATE public.documents d
SET journey_id = j.id
FROM (
  SELECT DISTINCT ON (user_id) user_id, id
  FROM public.journeys
  ORDER BY user_id, updated_at DESC
) j
WHERE d.journey_id IS NULL
  AND d.user_id = j.user_id;

CREATE INDEX IF NOT EXISTS idx_documents_journey_id ON public.documents(journey_id);

-- ── 3. Swap owner-only RLS for membership RLS ──────────────────────────────
-- Keep the `auth.uid() = user_id` arm so a doc with no journey still belongs to
-- its uploader, and the uploader always passes the INSERT check.
DROP POLICY IF EXISTS "Users can view their own documents"   ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
-- The narrow journey_documents-linked SELECT policy (20260616) is now superseded
-- by the broad member policy below; drop it to avoid overlapping SELECT policies.
DROP POLICY IF EXISTS "Members can view case-linked vault docs" ON public.documents;

DROP POLICY IF EXISTS "Members can view case vault docs"   ON public.documents;
DROP POLICY IF EXISTS "Members can insert case vault docs" ON public.documents;
DROP POLICY IF EXISTS "Members can update case vault docs" ON public.documents;
DROP POLICY IF EXISTS "Members can delete case vault docs" ON public.documents;

CREATE POLICY "Members can view case vault docs" ON public.documents
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );
CREATE POLICY "Members can insert case vault docs" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );
CREATE POLICY "Members can update case vault docs" ON public.documents
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );
CREATE POLICY "Members can delete case vault docs" ON public.documents
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_journey_member(journey_id, auth.uid())
  );

-- ── 4. Realtime (lets a partner's upload surface live if the UI subscribes) ─
ALTER TABLE public.documents REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'documents'
     )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  END IF;
END $$;

COMMIT;
