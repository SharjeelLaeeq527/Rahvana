-- Harden the wallet RPCs from 20261013_04_create_wallet_rpcs.sql.
--
-- Problems fixed:
-- 1. EXECUTE grants. Postgres grants EXECUTE on new functions to PUBLIC, and the
--    20261013 file also granted deduct/usage/statement to `authenticated`. Every
--    function takes `p_user_id` and runs SECURITY DEFINER, so any signed-in (or anon)
--    caller could:
--      - call credit_wallet_topup_atomic and mint credits for free,
--      - call deduct_wallet_credits_atomic with p_credit_cost = 0 (free unlock of any
--        resource) or a NEGATIVE cost (balance - (-100) = +100 credits),
--      - read any other user's monthly statement.
--    All four are now service_role only. The Next.js API routes authenticate the user
--    and call them with the service-role client, passing the session user id and the
--    server-side catalog price (never a client price).
-- 2. Input validation: cost / top-up amount must be > 0, resource_type must be known.
-- 3. Race conditions. The idempotency and "already unlocked" checks ran BEFORE the
--    wallet row lock, so two concurrent launches of the same tool could both pass the
--    check and charge twice, and two concurrent wallet creations raised a unique
--    violation. The wallet row is now created with ON CONFLICT DO NOTHING and locked
--    FIRST; every check runs under that lock.
-- 4. Idempotency lookups are scoped to the caller's user_id.
--
-- Signatures are unchanged, so CREATE OR REPLACE swaps the bodies in place.

CREATE OR REPLACE FUNCTION public.deduct_wallet_credits_atomic(
    p_user_id UUID,
    p_resource_type VARCHAR,
    p_resource_id VARCHAR,
    p_credit_cost NUMERIC,
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
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
    END IF;
    IF p_credit_cost IS NULL OR p_credit_cost <= 0 THEN
        RAISE EXCEPTION 'INVALID_CREDIT_COST' USING ERRCODE = '22023';
    END IF;
    IF p_resource_type NOT IN ('tool', 'guide', 'service') THEN
        RAISE EXCEPTION 'INVALID_RESOURCE_TYPE' USING ERRCODE = '22023';
    END IF;
    IF p_resource_id IS NULL OR length(trim(p_resource_id)) = 0 THEN
        RAISE EXCEPTION 'INVALID_RESOURCE_ID' USING ERRCODE = '22023';
    END IF;

    -- 1. Ensure the wallet exists, then lock it. Every check below runs under this
    --    lock, so concurrent requests for the same user are fully serialized.
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
                'resource_id', p_resource_id
            );
        END IF;
    END IF;

    -- 3. Free re-entry: an active unlock is never charged again.
    IF EXISTS (
        SELECT 1 FROM public.standalone_unlocked_resources
        WHERE user_id = p_user_id
          AND resource_type = p_resource_type
          AND resource_id = p_resource_id
          AND status = 'active'
    ) THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_unlocked', TRUE,
            'balance', v_wallet.balance,
            'resource_id', p_resource_id
        );
    END IF;

    v_balance_before := v_wallet.balance;

    -- 4. Balance sufficiency
    IF v_wallet.balance < p_credit_cost THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INSUFFICIENT_CREDITS',
            'required', p_credit_cost,
            'available', v_wallet.balance,
            'deficit', (p_credit_cost - v_wallet.balance)
        );
    END IF;

    -- 5. Deduct
    v_new_balance := v_wallet.balance - p_credit_cost;

    UPDATE public.user_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet.id;

    v_line_description := COALESCE(
        p_description,
        INITCAP(REPLACE(p_resource_id, '-', ' ')) || ' - Standalone Access Unlock'
    );

    -- 6. Ledger row with before/after audit trail
    INSERT INTO public.credit_transactions (
        wallet_id, user_id, transaction_type, amount, amount_usd,
        balance_before, balance_after, description, resource_type, resource_id,
        status, idempotency_key, actor_type, metadata
    ) VALUES (
        v_wallet.id,
        p_user_id,
        CASE
            WHEN p_resource_type = 'tool' THEN 'tool_launch'
            WHEN p_resource_type = 'guide' THEN 'guide_unlock'
            ELSE 'service_booking'
        END,
        -p_credit_cost,
        p_credit_cost, -- $1 USD = 1 Credit
        v_balance_before,
        v_new_balance,
        v_line_description,
        p_resource_type,
        p_resource_id,
        'completed',
        p_idempotency_key,
        'user',
        COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_tx_id;

    -- 7. Grant persistent access (re-activates a revoked row)
    INSERT INTO public.standalone_unlocked_resources (
        user_id, resource_type, resource_id, transaction_id, status,
        usage_count, last_used_at, metadata
    ) VALUES (
        p_user_id, p_resource_type, p_resource_id, v_tx_id, 'active',
        1, NOW(), COALESCE(p_metadata, '{}'::jsonb)
    ) ON CONFLICT (user_id, resource_type, resource_id)
    DO UPDATE SET
        status = 'active',
        transaction_id = EXCLUDED.transaction_id,
        unlocked_at = NOW(),
        usage_count = public.standalone_unlocked_resources.usage_count + 1,
        last_used_at = NOW();

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_tx_id,
        'balance_before', v_balance_before,
        'balance', v_new_balance,
        'resource_id', p_resource_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wallet_topup_atomic(
    p_user_id UUID,
    p_amount NUMERIC,
    p_stripe_session_id TEXT,
    p_stripe_payment_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
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
    v_tx_user UUID;
    v_line_description TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_TOPUP_AMOUNT' USING ERRCODE = '22023';
    END IF;
    IF p_stripe_session_id IS NULL OR length(trim(p_stripe_session_id)) = 0 THEN
        RAISE EXCEPTION 'MISSING_STRIPE_SESSION' USING ERRCODE = '22023';
    END IF;

    -- 1. Ensure + lock the wallet. The webhook and verify-session can fire for the
    --    same session at the same moment; the lock makes the second one wait and
    --    then see the first one's ledger row below.
    INSERT INTO public.user_wallets (user_id, balance)
    VALUES (p_user_id, 0.00)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 2. Idempotency: a Stripe session is credited at most once (the unique index on
    --    stripe_session_id is the backstop).
    SELECT id, user_id INTO v_tx_id, v_tx_user
    FROM public.credit_transactions
    WHERE stripe_session_id = p_stripe_session_id;

    IF FOUND THEN
        IF v_tx_user <> p_user_id THEN
            RAISE EXCEPTION 'STRIPE_SESSION_USER_MISMATCH' USING ERRCODE = '22023';
        END IF;
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_processed', TRUE,
            'transaction_id', v_tx_id,
            'balance', v_wallet.balance
        );
    END IF;

    v_balance_before := v_wallet.balance;
    v_new_balance := v_wallet.balance + p_amount;

    UPDATE public.user_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet.id;

    v_line_description := COALESCE(
        p_description,
        'Wallet Top-Up: ' || p_amount::TEXT || ' Credits ($' || p_amount::TEXT || ' USD)'
    );

    INSERT INTO public.credit_transactions (
        wallet_id, user_id, transaction_type, amount, amount_usd,
        balance_before, balance_after, description, resource_type, status,
        payment_id, stripe_session_id, stripe_payment_id, actor_type, metadata
    ) VALUES (
        v_wallet.id,
        p_user_id,
        'top_up',
        p_amount,
        p_amount, -- $1 USD = 1 Credit
        v_balance_before,
        v_new_balance,
        v_line_description,
        'wallet',
        'completed',
        p_payment_id,
        p_stripe_session_id,
        p_stripe_payment_id,
        'stripe_webhook',
        COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_tx_id,
        'balance_before', v_balance_before,
        'balance', v_new_balance
    );
END;
$$;

-- EXECUTE: service_role only. Revoke the implicit PUBLIC grant and the explicit
-- authenticated grants from 20261013_04_create_wallet_rpcs.sql.
REVOKE ALL ON FUNCTION public.deduct_wallet_credits_atomic(UUID, VARCHAR, VARCHAR, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_wallet_topup_atomic(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_unlocked_resource_usage(UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_monthly_wallet_statement(UUID, INT, INT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.deduct_wallet_credits_atomic(UUID, VARCHAR, VARCHAR, NUMERIC, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_topup_atomic(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_unlocked_resource_usage(UUID, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_monthly_wallet_statement(UUID, INT, INT) TO service_role;
