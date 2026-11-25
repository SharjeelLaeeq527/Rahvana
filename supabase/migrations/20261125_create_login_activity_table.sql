-- Migration: Create login_activity
-- Purpose: Store security events without retaining raw failed-login attempts.
-- 1. Create login_activity table
CREATE TABLE
    IF NOT EXISTS public.login_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
        event_type TEXT NOT NULL CHECK (
            event_type IN (
                'login_success',
                'login_failure',
                'session_revoked',
                'logout',
                'password_changed',
                'mfa_enabled',
                'mfa_disabled'
            )
        ),
        -- HMAC-SHA256 of normalized email for login failures. Never store raw email.
        identifier_hmac CHAR(64),
        identifier_hmac_key_version SMALLINT,
        failure_reason TEXT CHECK (
            failure_reason IS NULL
            OR failure_reason IN (
                'invalid_credentials',
                'email_unconfirmed',
                'invalid_mfa',
                'rate_limited',
                'account_locked',
                'provider_error'
            )
        ),
        session_record_id UUID REFERENCES public.user_sessions (id) ON DELETE SET NULL,
        device_name TEXT NOT NULL DEFAULT 'Unknown device',
        browser TEXT NOT NULL DEFAULT 'Unknown browser',
        ip_address INET,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        CONSTRAINT login_activity_failure_fields_check CHECK (
            (
                event_type = 'login_failure'
                AND identifier_hmac IS NOT NULL
                AND identifier_hmac_key_version IS NOT NULL
                AND identifier_hmac_key_version > 0
                AND failure_reason IS NOT NULL
            )
            OR (
                event_type <> 'login_failure'
                AND identifier_hmac IS NULL
                AND identifier_hmac_key_version IS NULL
                AND failure_reason IS NULL
            )
        )
    );

-- 2. Index account and failed-login lookups
CREATE INDEX IF NOT EXISTS idx_login_activity_by_user ON public.login_activity (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_login_activity_by_identifier ON public.login_activity (
    identifier_hmac,
    identifier_hmac_key_version,
    created_at DESC,
    id DESC
)
WHERE
    identifier_hmac IS NOT NULL;

-- 3. Restrict direct access to the server role
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_activity_service_role_all" ON public.login_activity;

CREATE POLICY "login_activity_service_role_all" ON public.login_activity FOR ALL TO service_role USING (true)
WITH
    CHECK (true);