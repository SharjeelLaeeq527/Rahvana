-- Require a registered, non-revoked auth session for authenticated access to private user and admin data, while leaving each table's existing ownership and role policies unchanged.

BEGIN;

DO $$
DECLARE
  v_table TEXT;
  v_relation REGCLASS;
  v_rls_enabled BOOLEAN;
  v_private_tables TEXT[] := ARRAY[
    'user_profiles',
    'payments',
    'user_guides',
    'user_guide_steps',
    'user_guide_files',
    'applicants',
    'appointments',
    'document_vault_config',
    'documents',
    'guide_feedback',
    'profiles',
    'police_verification_requests',
    'user_case_sessions',
    'user_case_answers',
    'interview_user_answers',
    'journeys',
    'chapters',
    'steps',
    'case_data',
    'journey_documents',
    'tool_sessions',
    'journey_portal_records',
    'journey_appointments',
    'journey_reminders',
    'ceac_case_status',
    'ceac_scheduled_notifications',
    'visa_forms_draft',
    'interview_prep_session_progress',
    'notifications',
    'feature_usage',
    'app_notifications',
    'audit_logs',
    'user_quick_access',
    'uscis_case_history',
    'account_deletion_feedback',
    'user_wallets',
    'credit_transactions',
    'standalone_unlocked_resources',
    'consultation_bookings'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_private_tables LOOP
    v_relation := to_regclass(format('public.%I', v_table));
    IF v_relation IS NULL THEN
      RAISE EXCEPTION 'Expected private table public.% does not exist', v_table;
    END IF;

    SELECT c.relrowsecurity
    INTO v_rls_enabled
    FROM pg_class AS c
    WHERE c.oid = v_relation;

    IF NOT COALESCE(v_rls_enabled, FALSE) THEN
      RAISE EXCEPTION 'Row level security is not enabled on public.%', v_table;
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %s',
      'require_active_session',
      v_relation
    );
    EXECUTE format(
      'CREATE POLICY %I ON %s AS RESTRICTIVE FOR ALL TO authenticated
       USING (public.is_current_app_session_active())
       WITH CHECK (public.is_current_app_session_active())',
      'require_active_session',
      v_relation
    );
  END LOOP;
END;
$$;

-- Keep other Storage buckets unchanged; apply the session check only to the private document-vault bucket. The existing per-user path policies still determine which files the active user can access.
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT c.relrowsecurity
  INTO v_rls_enabled
  FROM pg_class AS c
  WHERE c.oid = 'storage.objects'::regclass;

  IF NOT COALESCE(v_rls_enabled, FALSE) THEN
    RAISE EXCEPTION 'Row level security is not enabled on storage.objects';
  END IF;
END;
$$;

DROP POLICY IF EXISTS "require_active_session_document_vault" ON storage.objects;
CREATE POLICY "require_active_session_document_vault"
  ON storage.objects AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (
    bucket_id <> 'document-vault'
    OR public.is_current_app_session_active()
  )
  WITH CHECK (
    bucket_id <> 'document-vault'
    OR public.is_current_app_session_active()
  );

COMMIT;
