-- ============================================================
-- Security Hardening - Batch 1 (low-risk, high-impact)
-- Date: 2026-09-21
--
-- Fixes confirmed against the LIVE database (see docs/DATABASE_AUDIT.md sec 0.6):
--   1. police_verification_requests: anon full access  (CRITICAL)
--   2. pdfs storage bucket: world read/write/delete     (CRITICAL)
--   3. document-vault: any user can delete any user's files (CRITICAL)
--   4. app_notifications: anyone can inject notifications (HIGH)
--   5. feature_usage: user can reset own quota            (MEDIUM)
--   6. self-upgrade subscription tier (user_profiles)     (CRITICAL)
--   7. self-promote to admin (profiles.role)              (CRITICAL)
--   8. interview_categories: any user can edit content    (MEDIUM)
--   9. SECURITY DEFINER functions missing search_path     (HIGH)
--  10. stray anon write grants + hardcoded email policy   (LOW)
--
-- SAFE TO RUN: idempotent, no data migration, no downtime.
-- Verified write paths so nothing legitimate breaks:
--   - app_notifications inserted via service role (supabaseAdmin)
--   - feature_usage written only via increment_feature_usage_atomic RPC
--   - profile saves write only {id, profile_details, updated_at}
--   - pdfs bucket is unused in application code
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. police_verification_requests: remove anonymous access
--    The policy "USING (auth.uid() IS NULL)" grants FOR ALL to the anon role.
--    Drop it (dynamically, whatever its name), and add a proper service-role policy.
--    The existing own-row SELECT/INSERT policies (auth.uid() = user_id) remain,
--    so real users keep working.
-- ------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'police_verification_requests'
      AND qual ILIKE '%auth.uid() is null%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.police_verification_requests', p.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "police_service_role_all" ON public.police_verification_requests;
CREATE POLICY "police_service_role_all" ON public.police_verification_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. pdfs storage bucket: make private + remove all public policies
--    (bucket is empty and not referenced anywhere in the app code)
-- ------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'pdfs';

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%pdfs%' OR with_check ILIKE '%pdfs%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 3. document-vault: remove the over-broad delete policy
--    "Allow authenticated deletes" lets ANY logged-in user delete ANY file
--    (it checks auth.role()='authenticated' but not folder ownership).
--    The correct folder-scoped policy "Users can delete own documents" stays.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- (safety net) drop any other document-vault delete policy that lacks a folder/owner check
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'DELETE'
      AND qual ILIKE '%document-vault%'
      AND qual NOT ILIKE '%foldername%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4. app_notifications: only the service role may INSERT
--    (all app inserts already go through supabaseAdmin / service role)
-- ------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_notifications'
      AND cmd = 'INSERT'
      AND with_check = 'true'
      AND NOT ('service_role' = ANY (roles))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.app_notifications', p.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "app_notifications_service_insert" ON public.app_notifications;
CREATE POLICY "app_notifications_service_insert" ON public.app_notifications
  FOR INSERT TO service_role WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. feature_usage: users may not write directly (only the RPC does)
--    Reads (SELECT) stay allowed. Writes go through
--    increment_feature_usage_atomic (SECURITY DEFINER), which is unaffected.
-- ------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.feature_usage FROM authenticated, anon;

-- ------------------------------------------------------------
-- 6 + 7. Block end users from escalating privileges / plan.
--    Guard triggers block ONLY authenticated end-users from changing
--    protected columns. The service role and dashboard (admin) are unaffected,
--    and normal profile-save (id/profile_details/updated_at) keeps working.
-- ------------------------------------------------------------

-- 7. profiles.role : no self-promotion to admin
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role IS DISTINCT FROM 'user' THEN
        RAISE EXCEPTION 'Changing role is not allowed';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Changing role is not allowed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_role ON public.profiles;
CREATE TRIGGER trg_guard_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- 6. user_profiles subscription/stripe columns : no self-upgrade
CREATE OR REPLACE FUNCTION public.guard_user_profile_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      -- new client rows may not set a paid tier / stripe ids
      IF coalesce(NEW.subscription_tier, 'core') IS DISTINCT FROM 'core'
         OR NEW.stripe_customer_id IS NOT NULL
         OR NEW.stripe_subscription_id IS NOT NULL THEN
        RAISE EXCEPTION 'Changing subscription fields is not allowed';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.subscription_tier   IS DISTINCT FROM OLD.subscription_tier
         OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
         OR NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id
         OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
         OR NEW.current_period_end     IS DISTINCT FROM OLD.current_period_end THEN
        RAISE EXCEPTION 'Changing subscription fields is not allowed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_profile_billing ON public.user_profiles;
CREATE TRIGGER trg_guard_user_profile_billing
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_profile_billing();

-- ------------------------------------------------------------
-- 8. interview_categories: shared content is not user-writable
--    Remove any write policy granted to authenticated; keep SELECT; add service role.
-- ------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'interview_categories'
      AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
      AND ('authenticated' = ANY (roles) OR 'public' = ANY (roles))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.interview_categories', p.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "interview_categories_select" ON public.interview_categories;
CREATE POLICY "interview_categories_select" ON public.interview_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "interview_categories_service_all" ON public.interview_categories;
CREATE POLICY "interview_categories_service_all" ON public.interview_categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 9. SECURITY DEFINER functions: pin search_path (injection hardening)
-- ------------------------------------------------------------
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) x WHERE x ILIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.sig);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 10. Cleanup: remove stray anon write grants + hardcoded-email policy
-- ------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.profiles      FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_profiles FROM anon;

-- remove the leftover policy that hardcodes a personal email
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_messages'
      AND with_check ILIKE '%@gmail.com%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_messages', p.policyname);
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- Post-run verification (optional - run separately, read-only):
--   SELECT policyname, cmd, roles, qual FROM pg_policies
--     WHERE tablename='police_verification_requests';
--   SELECT id, public FROM storage.buckets WHERE id='pdfs';           -- expect public=false
--   SELECT proname, proconfig FROM pg_proc
--     WHERE proname IN ('increment_feature_usage_atomic','is_admin');  -- expect search_path set
-- ============================================================
