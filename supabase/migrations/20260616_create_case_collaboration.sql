-- ============================================================
-- Partner / Spouse Collaboration — Phase 1: DB foundation
-- ------------------------------------------------------------
-- Spec: docs/partner-collaboration-spec.md
--
-- What this migration does:
--   1. case_collaborators  — links users to a shared journey + their case_role
--   2. case_invites        — secure, single-use, hashed email invites
--   3. is_journey_member() — membership primitive used by all RLS below
--   4. Backfill            — one 'owner' row per existing journey (guarded)
--   5. RLS rewrite         — journey-scoped tables switch owner-check ->
--                            membership-check so an invited partner can read/
--                            edit the same case. INSERT/DELETE of a journey
--                            itself stays owner-only.
--
-- Safe to re-run: every CREATE uses IF NOT EXISTS, every policy is dropped
-- with IF EXISTS before recreate, and the backfill uses ON CONFLICT DO NOTHING.
-- ============================================================

-- ============================================================
-- 1. case_collaborators
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_collaborators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- membership_role: who controls the case
  membership_role TEXT NOT NULL DEFAULT 'partner'
                  CHECK (membership_role IN ('owner', 'partner')),

  -- case_role: which side of the IR-1 case this person is (drives OCR/autofill)
  case_role       TEXT
                  CHECK (case_role IS NULL OR case_role IN ('petitioner', 'beneficiary')),

  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'removed')),

  invited_email   TEXT,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A user appears at most once per journey.
  UNIQUE (journey_id, user_id)
);

-- Exactly one active petitioner and one active beneficiary per journey.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_case_role_per_journey
  ON public.case_collaborators (journey_id, case_role)
  WHERE case_role IS NOT NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_case_collaborators_user
  ON public.case_collaborators (user_id);
CREATE INDEX IF NOT EXISTS idx_case_collaborators_journey
  ON public.case_collaborators (journey_id);

COMMENT ON TABLE public.case_collaborators IS
  'Maps users to a shared journey. owner = account creator; partner = invited spouse. case_role routes OCR/autofill/case-strength to the correct person.';

-- ============================================================
-- 2. case_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id    UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  invited_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,

  -- Store only the SHA-256 HASH of the token. The raw token lives only in the
  -- emailed link; acceptance hashes the incoming token and looks it up.
  token_hash    TEXT NOT NULL UNIQUE,

  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  accepted_by   UUID REFERENCES auth.users(id),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_invites_email
  ON public.case_invites (lower(invited_email));
CREATE INDEX IF NOT EXISTS idx_case_invites_journey
  ON public.case_invites (journey_id);

COMMENT ON TABLE public.case_invites IS
  'Secure single-use email invites for spouse collaboration. token_hash stores a SHA-256 hash, never the raw token.';

-- ============================================================
-- 3. Membership helper — the core sharing primitive
-- ------------------------------------------------------------
-- SECURITY DEFINER so it can be referenced inside RLS policies on the member
-- tables without triggering recursive RLS evaluation. STABLE: result is
-- constant within a statement for given args.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_journey_member(p_journey_id UUID, p_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.journeys j
      WHERE j.id = p_journey_id AND j.user_id = p_uid
  ) OR EXISTS (
    SELECT 1 FROM public.case_collaborators c
      WHERE c.journey_id = p_journey_id
        AND c.user_id = p_uid
        AND c.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_journey_member(UUID, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.is_journey_member(UUID, UUID) IS
  'TRUE if the user owns the journey OR is an active collaborator on it. Used by RLS across all journey-scoped tables.';

-- ============================================================
-- 4. Backfill — one owner row per existing journey
-- ------------------------------------------------------------
-- Preserves today's "account holder = beneficiary" default. Guarded against
-- orphaned journeys (user_id no longer in auth.users) which would otherwise
-- violate the case_collaborators.user_id FK and abort the migration.
-- ============================================================
INSERT INTO public.case_collaborators (journey_id, user_id, membership_role, case_role, status)
SELECT j.id, j.user_id, 'owner', 'beneficiary', 'active'
FROM public.journeys j
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = j.user_id)
ON CONFLICT (journey_id, user_id) DO NOTHING;

-- ============================================================
-- 5. RLS rewrite — owner-check -> membership-check
-- ============================================================

-- ---------- journeys ----------
-- SELECT/UPDATE open to members; INSERT/DELETE stay owner-only; admin untouched.
DROP POLICY IF EXISTS "Users can view own journeys"   ON public.journeys;
DROP POLICY IF EXISTS "Users can update own journeys" ON public.journeys;

CREATE POLICY "Members can view case journeys" ON public.journeys
  FOR SELECT USING (public.is_journey_member(id, auth.uid()));

CREATE POLICY "Members can update case journeys" ON public.journeys
  FOR UPDATE USING (public.is_journey_member(id, auth.uid()));
-- NOTE: "Users can insert own journeys" and "Users can delete own journeys"
-- are intentionally left in place — only the owner creates/deletes a journey.

-- ---------- chapters ----------
DROP POLICY IF EXISTS "Users can view own journey chapters"   ON public.chapters;
DROP POLICY IF EXISTS "Users can insert own journey chapters" ON public.chapters;
DROP POLICY IF EXISTS "Users can update own journey chapters" ON public.chapters;
DROP POLICY IF EXISTS "Users can delete own journey chapters" ON public.chapters;

CREATE POLICY "Members can view case chapters" ON public.chapters
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "Members can insert case chapters" ON public.chapters
  FOR INSERT WITH CHECK (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "Members can update case chapters" ON public.chapters
  FOR UPDATE USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "Members can delete case chapters" ON public.chapters
  FOR DELETE USING (public.is_journey_member(journey_id, auth.uid()));

-- ---------- steps (scoped via chapters -> journey) ----------
DROP POLICY IF EXISTS "Users can view own journey steps"   ON public.steps;
DROP POLICY IF EXISTS "Users can insert own journey steps" ON public.steps;
DROP POLICY IF EXISTS "Users can update own journey steps" ON public.steps;
DROP POLICY IF EXISTS "Users can delete own journey steps" ON public.steps;

CREATE POLICY "Members can view case steps" ON public.steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chapters c
            WHERE c.id = steps.chapter_id
              AND public.is_journey_member(c.journey_id, auth.uid()))
  );
CREATE POLICY "Members can insert case steps" ON public.steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.chapters c
            WHERE c.id = steps.chapter_id
              AND public.is_journey_member(c.journey_id, auth.uid()))
  );
CREATE POLICY "Members can update case steps" ON public.steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.chapters c
            WHERE c.id = steps.chapter_id
              AND public.is_journey_member(c.journey_id, auth.uid()))
  );
CREATE POLICY "Members can delete case steps" ON public.steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.chapters c
            WHERE c.id = steps.chapter_id
              AND public.is_journey_member(c.journey_id, auth.uid()))
  );

-- ---------- case_data ----------
DROP POLICY IF EXISTS "Users can view own case data"   ON public.case_data;
DROP POLICY IF EXISTS "Users can insert own case data" ON public.case_data;
DROP POLICY IF EXISTS "Users can update own case data" ON public.case_data;
DROP POLICY IF EXISTS "Users can delete own case data" ON public.case_data;

CREATE POLICY "Members can view case_data" ON public.case_data
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "Members can insert case_data" ON public.case_data
  FOR INSERT WITH CHECK (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "Members can update case_data" ON public.case_data
  FOR UPDATE USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "Members can delete case_data" ON public.case_data
  FOR DELETE USING (public.is_journey_member(journey_id, auth.uid()));

-- ---------- tool_sessions ----------
DROP POLICY IF EXISTS "tool_sessions_select_own" ON public.tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_insert_own" ON public.tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_update_own" ON public.tool_sessions;
DROP POLICY IF EXISTS "tool_sessions_delete_own" ON public.tool_sessions;

CREATE POLICY "tool_sessions_select_member" ON public.tool_sessions
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "tool_sessions_insert_member" ON public.tool_sessions
  FOR INSERT WITH CHECK (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "tool_sessions_update_member" ON public.tool_sessions
  FOR UPDATE USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "tool_sessions_delete_member" ON public.tool_sessions
  FOR DELETE USING (public.is_journey_member(journey_id, auth.uid()));
-- "tool_sessions_service_role_all" left in place.

-- ---------- journey_documents ----------
DROP POLICY IF EXISTS "journey_documents_select_own" ON public.journey_documents;
DROP POLICY IF EXISTS "journey_documents_insert_own" ON public.journey_documents;
DROP POLICY IF EXISTS "journey_documents_update_own" ON public.journey_documents;
DROP POLICY IF EXISTS "journey_documents_delete_own" ON public.journey_documents;

CREATE POLICY "journey_documents_select_member" ON public.journey_documents
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "journey_documents_insert_member" ON public.journey_documents
  FOR INSERT WITH CHECK (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "journey_documents_update_member" ON public.journey_documents
  FOR UPDATE USING (public.is_journey_member(journey_id, auth.uid()));
CREATE POLICY "journey_documents_delete_member" ON public.journey_documents
  FOR DELETE USING (public.is_journey_member(journey_id, auth.uid()));
-- "journey_documents_service_role_all" left in place.

-- ---------- documents (vault) — narrow, ADDITIVE share ----------
-- Do NOT open the owner's whole vault. Grant members SELECT only on vault docs
-- that are already linked to a shared journey via journey_documents.
-- (documents.id and journey_documents.vault_file_id are both TEXT.)
DROP POLICY IF EXISTS "Members can view case-linked vault docs" ON public.documents;
CREATE POLICY "Members can view case-linked vault docs" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journey_documents jd
      WHERE jd.vault_file_id = documents.id
        AND public.is_journey_member(jd.journey_id, auth.uid())
    )
  );

-- ============================================================
-- 6. RLS for the new tables
-- ============================================================

-- ---------- case_collaborators ----------
ALTER TABLE public.case_collaborators ENABLE ROW LEVEL SECURITY;

-- Any member can see the collaborator list of a case they belong to.
CREATE POLICY "Members can view collaborators" ON public.case_collaborators
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));

-- Only the journey owner can add/remove/update collaborator rows from the client.
-- (Acceptance of an invite inserts the partner row server-side via service role.)
CREATE POLICY "Owner manages collaborators" ON public.case_collaborators
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.journeys j
            WHERE j.id = case_collaborators.journey_id AND j.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.journeys j
            WHERE j.id = case_collaborators.journey_id AND j.user_id = auth.uid())
  );

CREATE POLICY "case_collaborators_service_role_all" ON public.case_collaborators
  FOR ALL USING (auth.role() = 'service_role');

-- ---------- case_invites ----------
ALTER TABLE public.case_invites ENABLE ROW LEVEL SECURITY;

-- Inviter can see invites they created. All token validation / acceptance is
-- server-side via the service role.
CREATE POLICY "Inviter views own invites" ON public.case_invites
  FOR SELECT USING (auth.uid() = invited_by);

CREATE POLICY "case_invites_service_role_all" ON public.case_invites
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 7. Table-level grants
-- ------------------------------------------------------------
-- RLS controls WHICH ROWS each role sees; these grants are the coarse gate that
-- lets the role touch the table at all. Without them the app (authenticated)
-- would get "permission denied" before RLS is even evaluated.
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_invites        TO authenticated;
GRANT ALL ON public.case_collaborators TO service_role;
GRANT ALL ON public.case_invites        TO service_role;
