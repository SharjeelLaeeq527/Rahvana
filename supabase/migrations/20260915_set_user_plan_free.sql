-- Set a specific user's plan to FREE.
--
-- Target user: 9473c222-586f-4f8c-a9b7-a9c30eeada33
--
-- Why two updates are needed:
--   1. The app reads the *effective* tier from user_profiles.subscription_tier,
--      so that must be set to 'free' / 'inactive'.
--   2. reconcileUserPlan (lib/plan/reconcile.ts) re-grants a paid tier from any
--      payments row with product_type='journey_plan' AND status IN
--      ('succeeded','pending'). If we only touch user_profiles, the next
--      reconcile would upgrade the user again. So we mark those payment rows
--      'refunded' (a status reconcile ignores) to keep the downgrade sticky.
--
-- Idempotent: safe to run more than once.

BEGIN;

-- 1. Downgrade the profile to free.
UPDATE public.user_profiles
SET
  subscription_tier   = 'free',
  subscription_status = 'inactive',
  updated_at          = NOW()
WHERE id = '9473c222-586f-4f8c-a9b7-a9c30eeada33';

-- 2. Neutralize paid subscription payments so reconcile won't re-upgrade.
UPDATE public.payments
SET
  status     = 'refunded',
  updated_at = NOW()
WHERE user_id = '9473c222-586f-4f8c-a9b7-a9c30eeada33'
  AND product_type = 'journey_plan'
  AND status IN ('succeeded', 'pending');

COMMIT;
