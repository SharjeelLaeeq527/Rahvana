-- Server-owned keys inside user_profiles.profile_details.
--
-- `authenticated` can UPDATE its own user_profiles row (RLS own-row), and
-- guard_user_profile_billing only protected the subscription COLUMNS. The
-- add-on ledger lives inside the profile_details JSONB, so a signed-in user could
-- write `purchased_addons` straight through PostgREST and own every add-on: free
-- standalone tools and guides (lib/wallet/catalog.ts resolveUnlockedItems), plan
-- add-on entitlements, and service credit pools. Clearing
-- `processed_addon_checkout_sessions` would also let an old checkout be applied
-- again.
--
-- Fix: for the `authenticated` role, these keys always keep their stored value
-- (on INSERT they are dropped). Nothing is raised, so an ordinary profile save
-- that carries a stale copy still succeeds and simply cannot change or erase a
-- purchase. service_role (Stripe verify-session / webhook) is unaffected.
-- Keep the list in sync with lib/profile/serverOwnedKeys.ts.

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
    'activated_by'
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

-- The trigger itself is unchanged (20260921_security_hardening_batch1.sql);
-- recreated so this file also works on its own.
DROP TRIGGER IF EXISTS trg_guard_user_profile_billing ON public.user_profiles;
CREATE TRIGGER trg_guard_user_profile_billing
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_profile_billing();
