-- Migration: Decouple Visa Checker from Enums for Scalability
-- Date: 2026-03-30
-- Purpose: Convert case_type and question_key to TEXT to allow config-driven scaling.

-- 1. Alter user_case_sessions to use TEXT for case_type
-- Note: We drop the default first if it exists to avoid type mismatch during alter.
ALTER TABLE user_case_sessions ALTER COLUMN case_type SET DEFAULT NULL;
ALTER TABLE user_case_sessions ALTER COLUMN case_type TYPE TEXT USING case_type::TEXT;
ALTER TABLE user_case_sessions ALTER COLUMN case_type SET NOT NULL;
ALTER TABLE user_case_sessions ALTER COLUMN case_type SET DEFAULT 'Spouse';

-- 2. Alter user_case_answers to use TEXT for question_key
ALTER TABLE user_case_answers ALTER COLUMN question_key TYPE TEXT USING question_key::TEXT;

-- 3. (Optional) Drop the now unused types to clean up
-- COMMENTED OUT: Keep them if other legacy tables might still use them, but normally safe if CASCADE was used.
-- DROP TYPE IF EXISTS case_type CASCADE;
-- DROP TYPE IF EXISTS question_key CASCADE;
-- DROP TYPE IF EXISTS risk_level CASCADE; -- We keep risk_level as it is relatively stable (PENDING, WEAK, MODERATE, STRONG)

COMMENT ON COLUMN user_case_sessions.case_type IS 'Visa category identifier (e.g., "ir-1", "k-1"). Now TEXT for modular scaling.';
COMMENT ON COLUMN user_case_answers.question_key IS 'Unique identifier for the question from the category configuration.';
