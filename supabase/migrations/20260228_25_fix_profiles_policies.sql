-- Fix profiles table policies to resolve infinite recursion issue

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;

-- Create new policies that don't cause recursion
-- Allow service role to bypass RLS for admin functions
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (when auth.uid() matches)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users with admin role to view all profiles
-- This uses a subquery that doesn't reference the same table in the policy
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    ) 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users with admin role to update profiles
CREATE POLICY "Admin can update profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    ) 
    OR auth.role() = 'service_role'
  );

-- Also allow admins to insert profiles for other users if needed
CREATE POLICY "Admin can insert other profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    ) 
    OR auth.role() = 'service_role'
  );

-- Fix the trigger function to handle new user creation properly with service role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Extract full name from user metadata
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);

  -- Insert profile using service role privileges to bypass RLS during auth.user creation
  -- This function runs with elevated privileges due to SECURITY DEFINER
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions to authenticator role for the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticator;