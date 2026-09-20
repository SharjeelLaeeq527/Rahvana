-- ==========================================
-- Rahvana Multi-Candidate Guides Isolation Migration
-- Adds candidate_id column and composite unique constraint
-- ==========================================

-- 1. Add candidate_id column if not already present
ALTER TABLE user_guides 
ADD COLUMN IF NOT EXISTS candidate_id TEXT DEFAULT 'candidate-1';

-- 2. Backfill existing records with null candidate_id to candidate-1
UPDATE user_guides 
SET candidate_id = 'candidate-1' 
WHERE candidate_id IS NULL;

-- 3. Update unique constraint to allow distinct guide sessions per candidate
ALTER TABLE user_guides 
DROP CONSTRAINT IF EXISTS user_guides_user_id_guide_id_key;

ALTER TABLE user_guides 
DROP CONSTRAINT IF EXISTS user_guides_user_id_guide_id_candidate_id_key;

ALTER TABLE user_guides 
ADD CONSTRAINT user_guides_user_id_guide_id_candidate_id_key 
UNIQUE(user_id, guide_id, candidate_id);

-- 4. Index for fast querying by user and candidate
CREATE INDEX IF NOT EXISTS idx_user_guides_user_candidate 
ON user_guides(user_id, candidate_id);
