-- ============================================================
-- Blog Comments Table
-- Stores user-submitted comments on blog/article pages (/blog/[slug])
-- Comments display author name, circular profile pic (optional),
-- relative timestamp, and comment body.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_comments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target article slug (e.g. 'cr1-ir1-visa-complete-guide')
  article_slug TEXT NOT NULL,

  -- Author reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Author display info snapshot
  author_name TEXT NOT NULL,
  author_avatar_url TEXT, -- Optional: image URL from profile or OAuth metadata

  -- Comment content
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 2 AND 2000),

  -- Moderation status: approved (visible), flagged, hidden
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'flagged', 'hidden', 'pending')),

  -- Optional parent_id for threaded replies
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  reply_to_name TEXT, -- Optional display name of author being replied to

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  edited_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_blog_comments_slug_status_created 
  ON public.blog_comments(article_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id 
  ON public.blog_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id 
  ON public.blog_comments(parent_id);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_blog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_comments_updated_at ON public.blog_comments;
CREATE TRIGGER trg_blog_comments_updated_at
  BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_blog_comments_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (including anonymous visitors) can view approved comments
CREATE POLICY "Public can view approved blog comments"
  ON public.blog_comments FOR SELECT
  USING (status = 'approved');

-- 2. Authenticated users can read their own comments even if pending/flagged
CREATE POLICY "Users can view own comments"
  ON public.blog_comments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert comments"
  ON public.blog_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Authors can update their own comments
CREATE POLICY "Authors can update own comments"
  ON public.blog_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Authors can delete their own comments
CREATE POLICY "Authors can delete own comments"
  ON public.blog_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Admins have full access to manage comments
CREATE POLICY "Admins have full access to blog comments"
  ON public.blog_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role full access for backend APIs
CREATE POLICY "Service role full access on blog_comments"
  ON public.blog_comments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
