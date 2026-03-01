-- ============================================================
-- COMPLETE PROFILE SYSTEM FIX - RUN THIS IN SUPABASE
-- This migration fixes all profile-related issues in one go
-- ============================================================

\echo '=========================================='
\echo 'Starting Complete Profile System Setup...'
\echo '=========================================='

-- ============================================================
-- STEP 1: Ensure user_profiles table exists with all columns
-- ============================================================

\echo 'Step 1: Checking/Creating user_profiles table...'

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  subscription_tier TEXT DEFAULT 'core',
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  profile_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo 'user_profiles table ready!'

-- ============================================================
-- STEP 2: Add profile_details column if it doesn't exist
-- ============================================================

\echo 'Step 2: Adding profile_details column (if missing)...'

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'profile_details'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_details JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added profile_details column';
  ELSE
    RAISE NOTICE 'profile_details column already exists';
  END IF;
END $$;

\echo 'profile_details column ready!'

-- ============================================================
-- STEP 3: Enable RLS on user_profiles
-- ============================================================

\echo 'Step 3: Setting up Row Level Security...'

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

\echo 'RLS policies created!'

-- ============================================================
-- STEP 4: Create updated_at trigger
-- ============================================================

\echo 'Step 4: Creating updated_at trigger...'

CREATE OR REPLACE FUNCTION public.handle_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER on_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_profiles_updated_at();

\echo 'updated_at trigger created!'

-- ============================================================
-- STEP 5: Create trigger to auto-create user_profiles on signup
-- ============================================================

\echo 'Step 5: Creating auto-insert trigger for new users...'

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    subscription_tier, 
    subscription_status, 
    profile_details,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    'core',
    'active',
    '{}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

GRANT EXECUTE ON FUNCTION public.handle_new_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile() TO service_role;

\echo 'Auto-insert trigger created!'

-- ============================================================
-- STEP 6: Backfill user_profiles for existing users
-- ============================================================

\echo 'Step 6: Creating user_profiles rows for existing users...'

INSERT INTO public.user_profiles (
  id, 
  subscription_tier, 
  subscription_status, 
  profile_details,
  created_at, 
  updated_at
)
SELECT 
  au.id,
  'core',
  'active',
  '{}'::jsonb,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

\echo 'Backfill complete!'

-- ============================================================
-- STEP 7: Verification
-- ============================================================

\echo '=========================================='
\echo 'VERIFICATION RESULTS:'
\echo '=========================================='

\echo 'Total users in auth.users:'
SELECT COUNT(*) FROM auth.users;

\echo ''
\echo 'Total rows in user_profiles:'
SELECT COUNT(*) FROM user_profiles;

\echo ''
\echo 'Users WITH profile_details column:'
SELECT COUNT(*) FROM user_profiles WHERE profile_details IS NOT NULL;

\echo ''
\echo 'Sample user_profiles data:'
SELECT 
  up.id,
  au.email,
  up.subscription_tier,
  up.subscription_status,
  CASE 
    WHEN up.profile_details::text = '{}'::text THEN 'EMPTY'
    WHEN up.profile_details IS NULL THEN 'NULL'
    ELSE 'HAS DATA'
  END as profile_status,
  up.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
LIMIT 5;

\echo ''
\echo '=========================================='
\echo '✅ MIGRATION COMPLETE!'
\echo 'All users now have user_profiles rows'
\echo 'profile_details column is ready'
\echo 'Triggers are active for new signups'
\echo '=========================================='
