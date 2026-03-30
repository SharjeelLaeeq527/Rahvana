-- Migration to add missing keys to the question enum
-- This addresses the error: "invalid input value for enum case_question_key"

-- We use separate ALTER TYPE commands because they cannot be run inside a transaction collectively with IF NOT EXISTS easily without DO block
-- We try both 'case_question_key' and 'question_key' to be safe, as names vary between environments

-- For case_question_key (as seen in error message)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_question_key') THEN
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'sponsor_full_name';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'beneficiary_full_name';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'relationship_start_date';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'i130_status';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'children_together';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'prior_marriages_exist';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'nadra_marriage_registration_cert';
        ALTER TYPE case_question_key ADD VALUE IF NOT EXISTS 'prior_marriage_termination_docs';
    END IF;

    -- Also check for 'question_key' as defined in local migration files
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_key') THEN
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'sponsor_full_name';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'beneficiary_full_name';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'relationship_start_date';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'i130_status';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'children_together';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'prior_marriages_exist';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'nadra_marriage_registration_cert';
        ALTER TYPE question_key ADD VALUE IF NOT EXISTS 'prior_marriage_termination_docs';
    END IF;
END
$$;
