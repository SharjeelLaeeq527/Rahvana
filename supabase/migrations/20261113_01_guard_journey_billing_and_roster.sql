-- S1: a signed-in user could give themselves a paid journey plan.
--
-- 1. `journeys` has an own-row UPDATE policy (20260403_create_journeys_table.sql) and
--    nothing pinned the billing columns, so `authenticated` could PATCH
--    journeys.subscription_tier = 'executive' straight through PostgREST.
-- 2. The candidate roster in user_profiles.profile_details.candidates (each entry has a
--    `tier`) and the legacy stored tier map (journeyTiers / journey_tiers) were client
--    writable, and /api/journeys/initialize copied a paid value from them onto the
--    journey row ("self-heal").
--
-- Fix (with the app change in the same release):
--  - guard_journey_billing: for `authenticated` / `anon` writes, subscription_tier and
--    stripe_subscription_id keep their stored values on UPDATE and are forced to
--    'free' / NULL on INSERT. Nothing is raised, so ordinary journey writes (position,
--    filing method, progress) keep working. service_role (Stripe verify-session /
--    webhook / provisioning, the Stripe-verified tier repair in initialize) is
--    unaffected.
--  - guard_user_profile_billing: the roster (`candidates`), the id high-water mark
--    (`candidateIdHighWater`) and the legacy tier map join the server-owned keys. Only
--    /api/candidate/create and /api/candidate/delete (service_role, after auth) and the
--    Stripe paths write them. Keep the list in sync with lib/profile/serverOwnedKeys.ts.
--
-- Deletes are not guarded here: "reset progress" deletes the user's own journey row
-- today (lib/journey/journeyProgressService.ts), see the release notes.
--
-- Apply by hand AFTER the app release that stops writing tiers with the user session
-- (initialize self-heal moved to service_role). Applying it first only makes that old
-- self-heal a no-op, it does not break paid users.

-- ── 1. journeys billing columns ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_journey_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.subscription_tier := 'free';
      NEW.stripe_subscription_id := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.subscription_tier := OLD.subscription_tier;
      NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_journey_billing ON public.journeys;
CREATE TRIGGER trg_guard_journey_billing
  BEFORE INSERT OR UPDATE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.guard_journey_billing();

-- ── 2. server-owned profile_details keys (adds the roster) ──────────────────────

CREATE OR REPLACE FUNCTION public.guard_user_profile_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  c_server_keys CONSTANT TEXT[] := ARRAY[
    'purchased_addons',
    'processed_addon_checkout_sessions',
    'stripe_subscription_id',
    'active_plan',
    'plan_visa_category',
    'plan_purchase_date',
    'activated_by',
    'candidates',
    'candidateIdHighWater',
    'journeyTiers',
    'journey_tiers'
  ];
  v_details JSONB;
  v_key TEXT;
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      -- new client rows may not set a paid tier / stripe ids
      IF coalesce(NEW.subscription_tier, 'core') IS DISTINCT FROM 'core'
         OR NEW.stripe_customer_id IS NOT NULL
         OR NEW.stripe_subscription_id IS NOT NULL THEN
        RAISE EXCEPTION 'Changing subscription fields is not allowed';
      END IF;
      IF jsonb_typeof(NEW.profile_details) = 'object' THEN
        NEW.profile_details := NEW.profile_details - c_server_keys;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.subscription_tier   IS DISTINCT FROM OLD.subscription_tier
         OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
         OR NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id
         OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
         OR NEW.current_period_end     IS DISTINCT FROM OLD.current_period_end THEN
        RAISE EXCEPTION 'Changing subscription fields is not allowed';
      END IF;

      IF NEW.profile_details IS DISTINCT FROM OLD.profile_details THEN
        v_details := CASE
          WHEN jsonb_typeof(NEW.profile_details) = 'object' THEN NEW.profile_details - c_server_keys
          ELSE '{}'::jsonb
        END;
        IF jsonb_typeof(OLD.profile_details) = 'object' THEN
          FOREACH v_key IN ARRAY c_server_keys LOOP
            IF OLD.profile_details ? v_key THEN
              v_details := v_details || jsonb_build_object(v_key, OLD.profile_details -> v_key);
            END IF;
          END LOOP;
        END IF;
        NEW.profile_details := v_details;
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
