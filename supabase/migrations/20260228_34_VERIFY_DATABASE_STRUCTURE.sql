-- ================================================
-- DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check your database structure
-- ================================================

\echo '=========================================='
\echo 'STEP 1: Checking all public tables'
\echo '=========================================='

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo '=========================================='
\echo 'STEP 2: Checking PROFILES table structure'
\echo '=========================================='

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo 'STEP 3: Checking USER_PROFILES table structure'
\echo '=========================================='

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo 'STEP 4: Count rows in both tables'
\echo '=========================================='

SELECT 'profiles table' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'user_profiles table' as table_name, COUNT(*) as row_count FROM user_profiles;

\echo ''
\echo '=========================================='
\echo 'STEP 5: Check if user_profiles has profile_details column'
\echo '=========================================='

SELECT 
  EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'profile_details'
  ) as has_profile_details_column;

\echo ''
\echo '=========================================='
\echo 'STEP 6: Sample data from user_profiles (if exists)'
\echo '=========================================='

SELECT 
  id,
  subscription_tier,
  subscription_status,
  CASE 
    WHEN profile_details IS NULL THEN 'NULL'
    ELSE 'HAS DATA'
  END as profile_details_status,
  created_at
FROM user_profiles
LIMIT 5;

\echo ''
\echo '=========================================='
\echo 'VERIFICATION COMPLETE!'
\echo 'Copy the OUTPUT and send to developer'
\echo '=========================================='
