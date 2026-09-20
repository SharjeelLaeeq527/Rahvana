-- ============================================================
-- Migration: Add per-journey subscription tier & Stripe ID
-- Description: Enables per-journey roadmap plan monetization
-- ============================================================

-- 1. Add subscription_tier column (default 'free')
ALTER TABLE journeys
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

-- 2. Add stripe_subscription_id column
ALTER TABLE journeys
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. Add index for performance queries on journey tier
CREATE INDEX IF NOT EXISTS idx_journeys_user_tier
  ON journeys(user_id, subscription_tier);

-- 4. Document columns
COMMENT ON COLUMN journeys.subscription_tier IS 'Plan tier for this specific journey instance: free | basic | premium | executive';
COMMENT ON COLUMN journeys.stripe_subscription_id IS 'Stripe subscription ID attached to this specific journey instance';
