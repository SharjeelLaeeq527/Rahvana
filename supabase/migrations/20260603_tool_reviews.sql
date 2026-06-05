-- ============================================================
-- Tool Reviews Table
-- Stores user-submitted reviews for individual resource tools
-- (the /resources/[slug] add-on pages). Reviews are admin-moderated:
-- they are created as 'pending' and only shown publicly once 'approved'.
-- ============================================================

CREATE TABLE IF NOT EXISTS tool_reviews (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which tool this review is for (one of the resource slugs, e.g. 'case-strength')
  tool_slug TEXT NOT NULL,

  -- Author
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 2000),

  -- Display snapshot (so reviews render without joining profiles)
  reviewer_name TEXT NOT NULL,
  location TEXT,

  -- Server-controlled fields (never trusted from the client)
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- One review per user per tool (re-submitting upserts/edits the existing row)
  UNIQUE (user_id, tool_slug)
);

-- ============================================================
-- Indexes
-- ============================================================
-- Public page read: approved reviews for a given tool, newest first
CREATE INDEX IF NOT EXISTS idx_tool_reviews_slug_status
  ON tool_reviews(tool_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_reviews_user_id
  ON tool_reviews(user_id);

-- Admin moderation queue: pending first, newest first
CREATE INDEX IF NOT EXISTS idx_tool_reviews_status_created
  ON tool_reviews(status, created_at DESC);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_tool_reviews_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tool_reviews_updated_at ON tool_reviews;
CREATE TRIGGER trg_tool_reviews_updated_at
  BEFORE UPDATE ON tool_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_reviews_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE tool_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read APPROVED reviews
CREATE POLICY "Public can view approved reviews"
  ON tool_reviews FOR SELECT
  USING (status = 'approved');

-- Authors can read their own review regardless of status
-- (so they can see their pending/rejected submission)
CREATE POLICY "Users can view own review"
  ON tool_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authors can insert their own review
CREATE POLICY "Users can insert own review"
  ON tool_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authors can update their own review (edits reset to pending server-side)
CREATE POLICY "Users can update own review"
  ON tool_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all reviews (moderation queue)
CREATE POLICY "Admins can view all reviews"
  ON tool_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update any review (approve / reject)
CREATE POLICY "Admins can update all reviews"
  ON tool_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete reviews (spam / abuse removal)
CREATE POLICY "Admins can delete reviews"
  ON tool_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Comments & Documentation
-- ============================================================
COMMENT ON TABLE tool_reviews IS 'User-submitted, admin-moderated reviews for individual resource tools (/resources/[slug]).';
COMMENT ON COLUMN tool_reviews.tool_slug IS 'Resource slug the review belongs to (e.g. case-strength, smart, photo).';
COMMENT ON COLUMN tool_reviews.status IS 'Moderation state: pending (default), approved (public), rejected (hidden). Server-controlled.';
COMMENT ON COLUMN tool_reviews.verified_purchase IS 'TRUE when the author has a usage/purchase signal for this tool. Server-controlled.';
COMMENT ON COLUMN tool_reviews.reviewer_name IS 'Display-name snapshot captured at submission time.';
