-- Migration: Create security session RPCs
-- Purpose: Keep registry changes and their activity events atomic.

-- 1. Register a verified session and record login success 
CREATE OR REPLACE FUNCTION public.register_security_session(
  p_user_id UUID,
  p_session_id UUID,
  p_device_name TEXT,
  p_browser TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_revoked_at TIMESTAMPTZ;
  v_inserted BOOLEAN := FALSE;
BEGIN
  INSERT INTO public.user_sessions (
    user_id, session_id, device_name, browser, last_active_at
  )
  VALUES (
    p_user_id, p_session_id,
    COALESCE(NULLIF(p_device_name, ''), 'Unknown device'),
    COALESCE(NULLIF(p_browser, ''), 'Unknown browser'),
    NOW()
  )
  ON CONFLICT (user_id, session_id) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    v_inserted := TRUE;
  ELSE
    SELECT id, revoked_at INTO v_id, v_revoked_at
    FROM public.user_sessions
    WHERE user_id = p_user_id AND session_id = p_session_id;
    IF v_revoked_at IS NOT NULL THEN
      RAISE EXCEPTION 'A revoked session cannot be registered again';
    END IF;
  END IF;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Session registration failed';
  END IF;

  IF v_inserted THEN
    INSERT INTO public.login_activity (
      user_id, event_type, session_record_id, device_name, browser
    )
    VALUES (
      p_user_id, 'login_success', v_id,
      COALESCE(NULLIF(p_device_name, ''), 'Unknown device'),
      COALESCE(NULLIF(p_browser, ''), 'Unknown browser')
    );
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_security_session(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_security_session(UUID, UUID, TEXT, TEXT)
  TO service_role;

-- 2. Revoke one owned session and record the event 
CREATE OR REPLACE FUNCTION public.revoke_security_session(
  p_user_id UUID,
  p_record_id UUID,
  p_device_name TEXT,
  p_browser TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_session_id UUID;
BEGIN
  UPDATE public.user_sessions
  SET revoked_at = NOW()
  WHERE id = p_record_id
    AND user_id = p_user_id
    AND revoked_at IS NULL
  RETURNING id, session_id INTO v_id, v_session_id;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.login_activity (
    user_id, event_type, session_record_id, device_name, browser
  )
  VALUES (p_user_id, 'session_revoked', v_id, p_device_name, p_browser);

  RETURN jsonb_build_object('id', v_id, 'session_id', v_session_id);
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_security_session(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_security_session(UUID, UUID, TEXT, TEXT)
  TO service_role;

-- 3. Revoke all registered sessions and record the event 
CREATE OR REPLACE FUNCTION public.revoke_all_security_sessions(
  p_user_id UUID,
  p_device_name TEXT,
  p_browser TEXT,
  p_event_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_event_type NOT IN ('logout', 'mfa_disabled') THEN
    RAISE EXCEPTION 'Unsupported session revocation event';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW()
  WHERE user_id = p_user_id AND revoked_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.login_activity (
    user_id, event_type, device_name, browser
  )
  VALUES (p_user_id, p_event_type, p_device_name, p_browser);

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_all_security_sessions(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_all_security_sessions(UUID, TEXT, TEXT, TEXT)
  TO service_role;

-- 4. Check session state for privileged server routes 
CREATE OR REPLACE FUNCTION public.is_security_session_active(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_sessions AS s
    WHERE s.user_id = p_user_id
      AND s.session_id = p_session_id
      AND s.revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_security_session_active(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_security_session_active(UUID, UUID)
  TO service_role;

-- 5. List registered sessions for the server-side settings API 
CREATE OR REPLACE FUNCTION public.list_security_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  device_name TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id, s.session_id, s.device_name, s.browser, s.created_at, s.last_active_at
  FROM public.user_sessions AS s
  WHERE s.user_id = p_user_id
    AND s.revoked_at IS NULL
  ORDER BY s.last_active_at DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.list_security_sessions(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_security_sessions(UUID)
  TO service_role;

-- 6. RLS predicate for the session in the caller's JWT 
CREATE OR REPLACE FUNCTION public.is_current_app_session_active()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_sessions AS s
    WHERE s.user_id = auth.uid()
      AND s.session_id = (auth.jwt() ->> 'session_id')::uuid
      AND s.revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_app_session_active()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_app_session_active()
  TO authenticated;
