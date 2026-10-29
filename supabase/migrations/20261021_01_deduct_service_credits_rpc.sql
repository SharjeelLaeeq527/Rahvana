-- ============================================================
-- Migration: 20261021_01_deduct_service_credits_rpc.sql
-- Description: Creates atomic stored procedure for deducting
--              wallet credits for standalone service bookings.
--
-- Why a separate RPC from deduct_wallet_credits_atomic?
-- 1. deduct_wallet_credits_atomic grants a permanent row in
--    standalone_unlocked_resources (appropriate for 1-time unlock of tools & guides).
-- 2. Services (Medical, PCC, Translation, Consultation) are consumable
--    per-booking transactions and must NEVER grant a permanent unlock
--    (as enforced in 20261015_01_block_service_unlocks.sql).
-- 3. deduct_service_credits_atomic deducts the credit cost under row lock,
--    records a 'service_booking' row in credit_transactions, and links
--    to the specific reference_id (booking / appointment / request id).
-- ============================================================

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
    v_balance_before NUMERIC;
    v_new_balance NUMERIC;
    v_tx_id UUID;
    v_line_description TEXT;
BEGIN
    -- Input validations
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
    END IF;
    IF p_credit_cost IS NULL OR p_credit_cost <= 0 THEN
        RAISE EXCEPTION 'INVALID_CREDIT_COST' USING ERRCODE = '22023';
    END IF;
    IF p_service_id IS NULL OR length(trim(p_service_id)) = 0 THEN
        RAISE EXCEPTION 'INVALID_SERVICE_ID' USING ERRCODE = '22023';
    END IF;

    -- 1. Ensure the wallet exists, then lock it with FOR UPDATE.
    --    All operations below run under this row lock, serializing concurrent requests.
    INSERT INTO public.user_wallets (user_id, balance)
    VALUES (p_user_id, 0.00)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 2. Idempotency: same key from the same user returns the original result.
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, balance_after INTO v_tx_id, v_new_balance
        FROM public.credit_transactions
        WHERE idempotency_key = p_idempotency_key
          AND user_id = p_user_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'already_processed', TRUE,
                'transaction_id', v_tx_id,
                'balance', v_wallet.balance,
                'service_id', p_service_id,
                'reference_id', p_reference_id
            );
        END IF;
    END IF;

    v_balance_before := v_wallet.balance;

    -- 3. Balance sufficiency
    IF v_wallet.balance < p_credit_cost THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INSUFFICIENT_CREDITS',
            'required', p_credit_cost,
            'available', v_wallet.balance,
            'deficit', (p_credit_cost - v_wallet.balance)
        );
    END IF;

    -- 4. Deduct credit amount
    v_new_balance := v_wallet.balance - p_credit_cost;

    UPDATE public.user_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet.id;

    v_line_description := COALESCE(
        p_description,
        INITCAP(REPLACE(p_service_id, '-', ' ')) || ' - Standalone Service Booking'
    );

    -- 5. Record ledger row in credit_transactions
    --    Notice: Never writes to standalone_unlocked_resources (consumable per-booking).
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
        jsonb_build_object(
            'reference_id', p_reference_id
        ) || COALESCE(p_metadata, '{}'::jsonb)
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

-- Security: Restrict execution to service_role ONLY (invoked from server-side APIs).
REVOKE ALL ON FUNCTION public.deduct_service_credits_atomic(UUID, VARCHAR, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_service_credits_atomic(UUID, VARCHAR, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO service_role;
