-- ============================================================
-- Feature Usage Table
-- Stores records of feature usage for each user
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_usage (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature Details
  feature_key TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,   
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: Ensure one row per user-feature combination
  UNIQUE(user_id, feature_key)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id 
  ON feature_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_key 
  ON feature_usage(feature_key); 

CREATE INDEX IF NOT EXISTS idx_feature_usage_usage_count 
  ON feature_usage(usage_count DESC); 

CREATE INDEX IF NOT EXISTS idx_feature_usage_created_at 
  ON feature_usage(created_at DESC);

-- ============================================================
-- Auto-Update Timestamp Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_feature_usage_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_feature_usage_atomic(
  p_user_id UUID,
  p_feature_key TEXT,
  p_limit INT
)
RETURNS JSON AS $$
DECLARE
  current_count INT;
BEGIN

  SELECT usage_count INTO current_count
  FROM feature_usage
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
  FOR UPDATE;

  IF current_count IS NULL THEN
    INSERT INTO feature_usage (user_id, feature_key, usage_count)
    VALUES (p_user_id, p_feature_key, 1);

    RETURN json_build_object(
      'allowed', TRUE,
      'used', 1,
      'limit', p_limit,
      'remaining', p_limit - 1
    );
  END IF;

  IF current_count >= p_limit THEN
    RETURN json_build_object(
      'allowed', FALSE,
      'used', current_count,
      'limit', p_limit,
      'remaining', 0
    );
  END IF;

  IF p_limit <= 0 THEN
  RETURN json_build_object(
    'allowed', FALSE,
    'used', 0,
    'limit', p_limit,
    'remaining', 0
  );
END IF;

  UPDATE feature_usage
  SET usage_count = current_count + 1
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key;

  RETURN json_build_object(
    'allowed', TRUE,
    'used', current_count + 1,
    'limit', p_limit,
    'remaining', p_limit - (current_count + 1)
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_feature_usage_updated_at
  BEFORE UPDATE ON feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_usage_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own feature usage
CREATE POLICY "Users can view own feature usage"
  ON feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feature usage
CREATE POLICY "Users can insert own feature usage"
  ON feature_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feature usage
CREATE POLICY "Users can update own feature usage"
  ON feature_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all feature usage
CREATE POLICY "Admins can view all feature usage"
  ON feature_usage FOR SELECT
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
COMMENT ON TABLE feature_usage IS 'Table storing records of feature usage for each user.';

COMMENT ON COLUMN feature_usage.feature_key IS 'Unique identifier for the feature.';

COMMENT ON COLUMN feature_usage.usage_count IS 'Number of times the feature has been used.';

COMMENT ON COLUMN feature_usage.created_at IS 'When feature usage record was created';

COMMENT ON COLUMN feature_usage.updated_at IS 'Last update timestamp (auto-updated on any change)';
