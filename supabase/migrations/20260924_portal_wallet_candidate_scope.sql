-- Migration: Scope portal_wallet_credentials per candidate
-- Previously unique on (user_id, portal_type); now per (user_id, candidate_id, portal_type)
-- This allows each candidate in a multi-candidate journey to have separate credentials.

-- 1. Add candidate_id column if not exists
ALTER TABLE public.portal_wallet_credentials
  ADD COLUMN IF NOT EXISTS candidate_id TEXT;

-- 2. Backfill existing legacy rows where candidate_id is NULL to 'candidate-1'
UPDATE public.portal_wallet_credentials
SET candidate_id = 'candidate-1'
WHERE candidate_id IS NULL;

-- 3. Drop legacy unique constraints if they exist
ALTER TABLE public.portal_wallet_credentials
  DROP CONSTRAINT IF EXISTS portal_wallet_credentials_user_id_portal_type_key;

ALTER TABLE public.portal_wallet_credentials
  DROP CONSTRAINT IF EXISTS portal_wallet_credentials_user_candidate_type_key;

-- 4. Add the new composite unique constraint
ALTER TABLE public.portal_wallet_credentials
  ADD CONSTRAINT portal_wallet_credentials_user_candidate_type_key
  UNIQUE (user_id, candidate_id, portal_type);

-- 5. Add index for fast lookup by (user_id, candidate_id)
CREATE INDEX IF NOT EXISTS idx_portal_wallet_creds_user_candidate
  ON public.portal_wallet_credentials (user_id, candidate_id);

