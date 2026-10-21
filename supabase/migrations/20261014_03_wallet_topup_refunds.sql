-- Rahvana Wallet: reverse credits when a Stripe top-up is refunded.
--
-- Before this, a refunded top-up kept its credits. The webhook (`charge.refunded`)
-- now calls reverse_wallet_topup_atomic, which takes back credits in proportion to
-- what Stripe has refunded so far:
--
--   target   = ROUND(credits_added * amount_refunded / amount_captured, 2)
--   reversed = sum of credits_reversed on earlier refund rows for this top-up
--   delta    = target - reversed            (nothing to do when <= 0)
--
-- Both Stripe amounts are tax-inclusive, so a full refund reverses exactly the
-- credits that were added. Because it is cumulative, a replayed event or an older
-- partial-refund event arriving late reverses nothing extra (idempotent).
--
-- The balance never goes negative (CHECK on user_wallets / credit_transactions).
-- If the user already spent the credits, only the remaining balance is deducted and
-- the rest is recorded as `shortfall` in the ledger metadata for support.
--
-- The top-up row itself stays `completed` so the monthly statement keeps showing
-- both the top-up (+) and the refund (-) lines.

CREATE OR REPLACE FUNCTION public.reverse_wallet_topup_atomic(
    p_user_id UUID,
    p_stripe_session_id TEXT,
    p_amount_refunded_cents BIGINT,
    p_amount_captured_cents BIGINT,
    p_stripe_charge_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet RECORD;
    v_topup RECORD;
    v_target NUMERIC;
    v_already NUMERIC;
    v_delta NUMERIC;
    v_deduct NUMERIC;
    v_new_balance NUMERIC;
    v_tx_id UUID;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
    END IF;
    IF p_stripe_session_id IS NULL OR length(trim(p_stripe_session_id)) = 0 THEN
        RAISE EXCEPTION 'MISSING_STRIPE_SESSION' USING ERRCODE = '22023';
    END IF;
    IF p_amount_refunded_cents IS NULL OR p_amount_refunded_cents <= 0
       OR p_amount_captured_cents IS NULL OR p_amount_captured_cents <= 0 THEN
        RAISE EXCEPTION 'INVALID_REFUND_AMOUNT' USING ERRCODE = '22023';
    END IF;

    -- 1. Lock the wallet first so concurrent refund events serialize.
    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TOPUP_NOT_FOUND');
    END IF;

    -- 2. The original top-up for this Stripe session, owned by this user.
    SELECT id, amount INTO v_topup
    FROM public.credit_transactions
    WHERE stripe_session_id = p_stripe_session_id
      AND user_id = p_user_id
      AND transaction_type = 'top_up';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TOPUP_NOT_FOUND');
    END IF;

    -- 3. Cumulative target vs what earlier refund events already reversed.
    v_target := LEAST(
        v_topup.amount,
        ROUND(v_topup.amount * LEAST(p_amount_refunded_cents, p_amount_captured_cents)::NUMERIC
              / p_amount_captured_cents, 2)
    );

    SELECT COALESCE(SUM((metadata->>'credits_reversed')::NUMERIC), 0) INTO v_already
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'refund'
      AND metadata->>'topup_transaction_id' = v_topup.id::TEXT;

    v_delta := v_target - v_already;

    IF v_delta <= 0 THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_processed', TRUE,
            'credits_reversed', 0,
            'credits_deducted', 0,
            'shortfall', 0,
            'balance', v_wallet.balance
        );
    END IF;

    -- 4. Never below zero: spent credits become a recorded shortfall.
    v_deduct := LEAST(v_delta, v_wallet.balance);
    v_new_balance := v_wallet.balance - v_deduct;

    UPDATE public.user_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet.id;

    INSERT INTO public.credit_transactions (
        wallet_id, user_id, transaction_type, amount, amount_usd,
        balance_before, balance_after, description, resource_type, status,
        stripe_payment_id, actor_type, metadata
    ) VALUES (
        v_wallet.id,
        p_user_id,
        'refund',
        -v_deduct,
        v_deduct,
        v_wallet.balance,
        v_new_balance,
        'Wallet Top-Up Refunded: ' || v_delta::TEXT || ' Credits',
        'wallet',
        'completed',
        p_stripe_charge_id,
        'stripe_webhook',
        jsonb_build_object(
            'kind', 'topup_refund',
            'topup_transaction_id', v_topup.id,
            'stripe_session_id', p_stripe_session_id,
            'credits_reversed', v_delta,
            'shortfall', v_delta - v_deduct,
            'amount_refunded_cents', p_amount_refunded_cents,
            'amount_captured_cents', p_amount_captured_cents
        )
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_tx_id,
        'credits_reversed', v_delta,
        'credits_deducted', v_deduct,
        'shortfall', v_delta - v_deduct,
        'balance', v_new_balance
    );
END;
$$;

-- service_role only, like the other wallet RPCs (20261014_01_harden_wallet_rpcs.sql).
REVOKE ALL ON FUNCTION public.reverse_wallet_topup_atomic(UUID, TEXT, BIGINT, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_wallet_topup_atomic(UUID, TEXT, BIGINT, BIGINT, TEXT) TO service_role;
