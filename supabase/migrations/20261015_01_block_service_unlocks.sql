-- Rahvana Wallet: services can never be permanently unlocked with credits.
--
-- deduct_wallet_credits_atomic grants a permanent standalone_unlocked_resources row,
-- which is right for tools and guides (one unlock = unlimited standalone use) but
-- wrong for services (Medical, PCC, Translation, Consultation), which are paid per
-- booking. The API already refuses services (lib/wallet/catalog.ts `launchable:
-- false`); this enforces the same rule in the database so no server code path can
-- turn one paid booking into unlimited free bookings.
--
-- Per-booking service deduction will be a SEPARATE RPC (wallet plan, Phase 6) that
-- writes a ledger row and never an unlock row.
--
-- Only the resource_type check changes; the body is otherwise identical to
-- 20261014_01_harden_wallet_rpcs.sql. Same signature, so grants are kept, and they
-- are re-asserted below (service_role only).

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
    -- Services are booked per use and must never become a permanent unlock.
    -- Per-booking service payment gets its own RPC (wallet plan, Phase 6).
    IF p_resource_type = 'service' THEN
        RAISE EXCEPTION 'SERVICE_NOT_UNLOCKABLE' USING ERRCODE = '22023';
    END IF;
    IF p_resource_type IS NULL OR p_resource_type NOT IN ('tool', 'guide') THEN
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

REVOKE ALL ON FUNCTION public.deduct_wallet_credits_atomic(UUID, VARCHAR, VARCHAR, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_credits_atomic(UUID, VARCHAR, VARCHAR, NUMERIC, TEXT, TEXT, JSONB) TO service_role;

-- Defensive: no permanent service unlocks should exist (20261023_02 removes the
-- backfilled ones). Revoke any that slipped in so they grant nothing.
UPDATE public.standalone_unlocked_resources
SET status = 'revoked'
WHERE resource_type = 'service'
  AND status = 'active';
