-- Harden deduct_service_credits_atomic (20261021_01) and restore journey service rows.
--
-- 1. One charge per booking. The replay check matched only (idempotency_key,
--    user_id) and returned success without comparing the booking, so a key
--    already used for booking A "paid" bookings B, C, D for 0 credits (the app
--    then marked them paid). A missing / fresh key also let the same booking be
--    charged twice. Now:
--      * p_reference_id (the booking id) is required;
--      * an existing service_booking row for (user, service, reference) is the
--        replay, whatever key was sent;
--      * a key reused for a different booking or service is refused.
--    lib/wallet/serviceBooking.ts also derives the key from the booking id.
-- 2. Caller metadata can no longer overwrite the ledger's reference_id.
-- 3. A partial unique index backs (1) when no duplicates exist yet.
-- 4. Journey Medical / PCC rows were created with the column default
--    payment_status = 'pending' and, since the list filters started hiding
--    'pending' (17ed3393), disappeared from admin and user lists. Journey rows
--    are covered by the journey plan, so they are paid; the booking routes now
--    write that explicitly after verifying the journey.

CREATE OR REPLACE FUNCTION public.deduct_service_credits_atomic(
    p_user_id UUID,
    p_service_id VARCHAR,
    p_credit_cost NUMERIC,
    p_reference_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet RECORD;
    v_existing RECORD;
    v_balance_before NUMERIC;
    v_new_balance NUMERIC;
    v_tx_id UUID;
    v_line_description TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
    END IF;
    IF p_credit_cost IS NULL OR p_credit_cost <= 0 THEN
        RAISE EXCEPTION 'INVALID_CREDIT_COST' USING ERRCODE = '22023';
    END IF;
    IF p_service_id IS NULL OR length(trim(p_service_id)) = 0 THEN
        RAISE EXCEPTION 'INVALID_SERVICE_ID' USING ERRCODE = '22023';
    END IF;
    IF p_reference_id IS NULL OR length(trim(p_reference_id)) = 0 THEN
        RAISE EXCEPTION 'REFERENCE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- Lock the wallet first: every check below runs under this row lock.
    INSERT INTO public.user_wallets (user_id, balance)
    VALUES (p_user_id, 0.00)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- This booking was already charged: replay, never a second charge.
    SELECT id INTO v_existing
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'service_booking'
      AND resource_id = p_service_id
      AND metadata ->> 'reference_id' = p_reference_id
    ORDER BY created_at
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_processed', TRUE,
            'transaction_id', v_existing.id,
            'balance', v_wallet.balance,
            'service_id', p_service_id,
            'reference_id', p_reference_id
        );
    END IF;

    -- A key already spent on another booking / service must not unlock this one.
    IF p_idempotency_key IS NOT NULL THEN
        PERFORM 1
        FROM public.credit_transactions
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'IDEMPOTENCY_KEY_REUSED');
        END IF;
    END IF;

    v_balance_before := v_wallet.balance;

    IF v_wallet.balance < p_credit_cost THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INSUFFICIENT_CREDITS',
            'required', p_credit_cost,
            'available', v_wallet.balance,
            'deficit', (p_credit_cost - v_wallet.balance)
        );
    END IF;

    v_new_balance := v_wallet.balance - p_credit_cost;

    UPDATE public.user_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet.id;

    v_line_description := COALESCE(
        p_description,
        INITCAP(REPLACE(p_service_id, '-', ' ')) || ' - Standalone Service Booking'
    );

    -- Never writes to standalone_unlocked_resources (consumable per booking).
    INSERT INTO public.credit_transactions (
        wallet_id, user_id, transaction_type, amount, amount_usd,
        balance_before, balance_after, description, resource_type, resource_id,
        status, idempotency_key, actor_type, metadata
    ) VALUES (
        v_wallet.id,
        p_user_id,
        'service_booking',
        -p_credit_cost,
        p_credit_cost, -- $1 USD = 1 Credit
        v_balance_before,
        v_new_balance,
        v_line_description,
        'service',
        p_service_id,
        'completed',
        p_idempotency_key,
        'user',
        -- server-owned reference_id wins over caller metadata
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('reference_id', p_reference_id)
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_tx_id,
        'balance_before', v_balance_before,
        'balance', v_new_balance,
        'service_id', p_service_id,
        'reference_id', p_reference_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_service_credits_atomic(UUID, VARCHAR, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_service_credits_atomic(UUID, VARCHAR, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- Backstop for "one charge per booking". Skipped (with a notice) if historic
-- duplicates exist; those need a manual refund review first.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.credit_transactions
        WHERE transaction_type = 'service_booking'
          AND metadata ->> 'reference_id' IS NOT NULL
        GROUP BY user_id, resource_id, metadata ->> 'reference_id'
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE 'Duplicate service_booking charges exist; unique index not created. Review them, refund, then rerun.';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_tx_service_booking_reference
            ON public.credit_transactions (user_id, resource_id, (metadata ->> 'reference_id'))
            WHERE transaction_type = 'service_booking';
    END IF;
END $$;

-- Journey service rows are covered by the journey plan (see 4. above).
UPDATE public.appointments
SET payment_status = 'paid'
WHERE source = 'journey'
  AND awaiting_payment = FALSE
  AND payment_status = 'pending';

UPDATE public.police_verification_requests
SET payment_status = 'paid'
WHERE source = 'journey'
  AND awaiting_payment = FALSE
  AND payment_status = 'pending';
