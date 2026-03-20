-- 1. Fix overall_score precision (was DECIMAL(3,2) which caps at 9.99)
-- We change it to DECIMAL(5,2) to allow values up to 999.99
ALTER TABLE user_case_sessions ALTER COLUMN overall_score TYPE DECIMAL(5,2);

-- 2. Add missing summary columns to user_case_sessions
ALTER TABLE user_case_sessions ADD COLUMN IF NOT EXISTS summary_reasons TEXT[] DEFAULT '{}';
ALTER TABLE user_case_sessions ADD COLUMN IF NOT EXISTS improvement_suggestions TEXT[] DEFAULT '{}';

-- 3. Update flag_code ENUM to include missing values used in the codebase
-- We use separate ALTER TYPE commands because they cannot be run inside a transaction collectively with IF NOT EXISTS easily without DO block
-- But in Supabase SQL editor/migrations, it's safer to just run them.
ALTER TYPE flag_code ADD VALUE IF NOT EXISTS 'LONG_RELATIONSHIP_HISTORY';
ALTER TYPE flag_code ADD VALUE IF NOT EXISTS 'CR1_I751_REMINDER';
ALTER TYPE flag_code ADD VALUE IF NOT EXISTS 'NO_NADRA_MARRIAGE_CERT';
ALTER TYPE flag_code ADD VALUE IF NOT EXISTS 'MISSING_PRIOR_MARRIAGE_DOCS';
ALTER TYPE flag_code ADD VALUE IF NOT EXISTS 'I130_PROCESS_NOT_STARTED';
ALTER TYPE flag_code ADD VALUE IF NOT EXISTS 'PUBLIC_CHARGE_RISK';

-- 4. Re-verify columns to be sure
COMMENT ON TABLE user_case_sessions IS 'Stores AI assessment sessions for visa case strength';
