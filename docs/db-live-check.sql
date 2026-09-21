-- ============================================================
-- Rahvana - LIVE database read-only audit queries
-- ============================================================
-- Purpose: read the REAL policies/RLS/grants/functions from the
--          live database (the migration files are out of sync).
--
-- SAFE: every statement below is a SELECT against system catalogs.
--       It writes NOTHING and changes NOTHING. Run it in the
--       Supabase Dashboard -> SQL Editor and share the results.
--
-- Run each block and copy the output back.
-- ============================================================

-- 1) Which tables have RLS ENABLED vs DISABLED? (disabled = open to the world)
SELECT n.nspname AS schema,
       c.relname  AS table,
       c.relrowsecurity  AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, c.relname;   -- disabled tables show first

-- 2) Every RLS policy: which command, which roles, and the USING / WITH CHECK text.
--    Look for: USING(true), WITH CHECK(true), auth.uid() IS NULL, missing WITH CHECK on UPDATE,
--    policies applied TO {public} instead of {service_role}.
SELECT schemaname,
       tablename,
       policyname,
       cmd,                 -- SELECT / INSERT / UPDATE / DELETE / ALL
       roles,               -- {public} / {authenticated} / {service_role}
       qual        AS using_expr,
       with_check  AS check_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 3) Tables that have RLS enabled but ZERO policies (locked out) OR are exposed with none.
SELECT c.relname AS table, c.relrowsecurity AS rls_enabled,
       COUNT(p.policyname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public' AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY policy_count ASC, c.relname;

-- 4) Table privileges granted to anon / authenticated (column-level write = paywall/role risk).
--    Look for UPDATE granted to 'authenticated' on user_profiles / profiles (self-escalation).
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT','UPDATE','DELETE')
ORDER BY table_name, grantee, privilege_type;

-- 4b) Column-level UPDATE grants (shows exactly which columns anon/authenticated may write).
SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated')
  AND privilege_type = 'UPDATE'
  AND table_name IN ('user_profiles','profiles')
ORDER BY table_name, grantee, column_name;

-- 5) SECURITY DEFINER functions missing a fixed search_path (search-path injection risk).
SELECT n.nspname AS schema, p.proname AS function,
       p.prosecdef AS security_definer,
       p.proconfig AS settings   -- should contain search_path=... for SECURITY DEFINER funcs
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- 6) Triggers on auth.users (signup provisioning) and on the hot 'steps' table.
SELECT event_object_schema AS schema, event_object_table AS table,
       trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('users','steps','case_data','journeys','chapters')
ORDER BY event_object_table, trigger_name;

-- 7) Storage buckets and public flag (confirm nothing sensitive is public).
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- 8) Storage policies (who can read/write files in each bucket).
SELECT policyname, cmd, roles, qual AS using_expr, with_check AS check_expr
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 9) Foreign keys on the journey child tables (confirm CR/H-1: are the FKs actually there?).
SELECT tc.table_name, kcu.column_name, ccu.table_name AS references_table, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('journey_documents','tool_sessions','journey_portal_records','journey_appointments','notifications','documents')
ORDER BY tc.table_name;

-- 10) The real payments.product_type CHECK (confirm CR-6 drift).
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.payments'::regclass AND contype = 'c';
