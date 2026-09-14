-- Add a dedicated stripe_subscription_id column to payments.
--
-- WHY: subscription checkouts were storing the Stripe SUBSCRIPTION id (sub_...)
-- in `stripe_payment_id`, which is meant for the PaymentIntent id (pi_...). That
-- conflates two different Stripe object types and makes reconciliation/debugging
-- error-prone. This gives each Stripe id its own home:
--   stripe_payment_id          -> pi_...  (one-time payments)
--   stripe_subscription_id     -> sub_... (subscriptions)
--   stripe_checkout_session_id -> cs_...  (already present, UNIQUE NOT NULL)
--
-- Non-breaking: nullable, additive. Apply this migration BEFORE deploying the
-- code that writes the column.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription_id
  ON public.payments(stripe_subscription_id);

-- Backfill: existing subscription rows put the sub id in stripe_payment_id.
-- Copy it into the correct column (non-destructive — we leave the old value in
-- place for history; readers prefer the new column). Only rows that clearly hold
-- a subscription id are touched.
UPDATE public.payments
SET stripe_subscription_id = stripe_payment_id
WHERE stripe_payment_id LIKE 'sub\_%'
  AND stripe_subscription_id IS NULL;
