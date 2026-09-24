-- Migration: Scope portal_wallet_credentials per candidate
-- Previously unique on (user_id, portal_type); now per (user_id, candidate_id, portal_type)
-- This allows each candidate in a multi-candidate journey to have separate credentials.

-- 1. Add candidate_id column (nullable so existing rows don't break)
ALTER TABLE public.portal_wallet_credentials
  ADD COLUMN IF NOT EXISTS candidate_id TEXT;

-- 2. Drop the old unique constraint (may be named differently; DROP IF EXISTS is safe)
ALTER TABLE public.portal_wallet_credentials
  DROP CONSTRAINT IF EXISTS portal_wallet_credentials_user_id_portal_type_key;

-- 3. Add the new composite unique constraint
ALTER TABLE public.portal_wallet_credentials
  DROP CONSTRAINT IF EXISTS portal_wallet_credentials_user_candidate_type_key;

ALTER TABLE public.portal_wallet_credentials
  ADD CONSTRAINT portal_wallet_credentials_user_candidate_type_key
  UNIQUE (user_id, candidate_id, portal_type);

-- 4. Add index for fast lookup by (user_id, candidate_id)
CREATE INDEX IF NOT EXISTS idx_portal_wallet_creds_user_candidate
  ON public.portal_wallet_credentials (user_id, candidate_id);
