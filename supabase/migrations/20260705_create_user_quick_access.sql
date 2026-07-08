-- Migration: 20260705_create_user_quick_access.sql
-- Creates the user_quick_access table for per-user pinned tool shortcuts.

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_quick_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id     text NOT NULL,          -- stable tool key, e.g. "pdf", "interview-prep"
  title       text NOT NULL,          -- display name, e.g. "PDF Tools"
  href        text NOT NULL,          -- navigation path, e.g. "/pdf-processing"
  icon_name   text,                   -- optional lucide icon name
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- Each user can pin each tool only once
  CONSTRAINT user_quick_access_unique UNIQUE (user_id, item_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_quick_access_user_id
  ON public.user_quick_access (user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.user_quick_access ENABLE ROW LEVEL SECURITY;

-- Users can only read their own rows
CREATE POLICY "user_quick_access_select"
  ON public.user_quick_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own rows
CREATE POLICY "user_quick_access_insert"
  ON public.user_quick_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "user_quick_access_update"
  ON public.user_quick_access
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "user_quick_access_delete"
  ON public.user_quick_access
  FOR DELETE
  USING (auth.uid() = user_id);
