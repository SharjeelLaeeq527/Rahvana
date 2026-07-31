-- Migration: Update unique constraints on document_vault_config table
-- Purpose: Support one document vault configuration per user/journey combination instead of a single config per user.

-- 1. Clean up any duplicate records in document_vault_config to ensure constraint creation succeeds
DELETE FROM public.document_vault_config a USING public.document_vault_config b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND COALESCE(a.journey_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(b.journey_id, '00000000-0000-0000-0000-000000000000'::uuid);

-- 2. Drop old UNIQUE(user_id) constraint if it exists (automatically created by Postgres as table_name_column_name_key)
ALTER TABLE public.document_vault_config 
DROP CONSTRAINT IF EXISTS document_vault_config_user_id_key;

-- 3. Drop existing unique constraint on user/journey if it exists to avoid duplication
ALTER TABLE public.document_vault_config 
DROP CONSTRAINT IF EXISTS uq_document_vault_config_user_journey;

-- 4. Add the new UNIQUE(user_id, journey_id) constraint
ALTER TABLE public.document_vault_config 
ADD CONSTRAINT uq_document_vault_config_user_journey UNIQUE (user_id, journey_id);
