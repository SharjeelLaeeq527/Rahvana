-- ============================================================
-- Activity History (audit log) — §13b
-- ------------------------------------------------------------
-- Spec: docs/partner-collaboration-spec.md §13b
--
-- One append-only feed per shared case: "who did what, when". Both spouses
-- read it (view-only) from /case-history. Tracked actions in v1:
--   document.upload / document.delete
--   form.save / form.complete
--   step.complete / step.reopen
--   role.assign
--
-- Each row snapshots the actor's case_role at the time (actor_role) so a later
-- role swap never rewrites past history.
--
-- Safe to re-run: CREATE ... IF NOT EXISTS, and every policy is dropped with
-- IF EXISTS before recreate.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.case_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id    UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,

  -- Who performed the action. SET NULL on user deletion so the history row
  -- survives (we still show the role snapshot + label).
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Snapshot of the actor's case_role at the moment of the action. Frozen so a
  -- later petitioner<->beneficiary swap doesn't rewrite the past.
  actor_role    TEXT
                CHECK (actor_role IS NULL OR actor_role IN ('petitioner','beneficiary','owner')),

  action        TEXT NOT NULL
                CHECK (action IN (
                  'document.upload','document.delete',
                  'form.save','form.complete',
                  'step.complete','step.reopen',
                  'role.assign'
                )),

  -- Human label: doc name, form name ("Form I-130"), step title.
  target_label  TEXT,

  -- Extra context: form_code, step_key, document id, chosen role, etc.
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feed query: latest first within a case.
CREATE INDEX IF NOT EXISTS idx_case_activity_feed
  ON public.case_activity (journey_id, created_at DESC);

COMMENT ON TABLE public.case_activity IS
  'Append-only audit log per shared case. actor_role is a snapshot so role swaps never rewrite history. Written server-side via service role; both spouses read view-only.';

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.case_activity ENABLE ROW LEVEL SECURITY;

-- Members of the case can read its history.
DROP POLICY IF EXISTS "Members can view case activity" ON public.case_activity;
CREATE POLICY "Members can view case activity" ON public.case_activity
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));

-- A member may insert their OWN action into a case they belong to. (Logging is
-- normally done server-side with the service role, which bypasses RLS; this
-- policy is a safety net so a direct authed insert can't forge another actor.)
DROP POLICY IF EXISTS "Members can log own activity" ON public.case_activity;
CREATE POLICY "Members can log own activity" ON public.case_activity
  FOR INSERT WITH CHECK (
    actor_user_id = auth.uid()
    AND public.is_journey_member(journey_id, auth.uid())
  );

-- Service role full access (the logger uses it).
DROP POLICY IF EXISTS "Service role full access activity" ON public.case_activity;
CREATE POLICY "Service role full access activity" ON public.case_activity
  FOR ALL USING (auth.role() = 'service_role');
