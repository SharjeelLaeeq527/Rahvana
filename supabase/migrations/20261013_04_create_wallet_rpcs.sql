-- Wallet/resource RPCs.

-- CONCURRENCY-SAFE ATOMIC DATABASE PROCEDURES (RPCs)
-- Procedure 1: Deduct credits and unlock standalone resource atomically
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
    v_already_unlocked BOOLEAN;
    v_line_description TEXT;
BEGIN
    -- 1. Idempotency Check: Return existing transaction if already processed
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, balance_after INTO v_tx_id, v_new_balance
        FROM public.credit_transactions
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'already_processed', TRUE,
                'transaction_id', v_tx_id,
                'balance', v_new_balance,
                'resource_id', p_resource_id
            );
        END IF;
    END IF;

    -- 2. Free Re-entry Check: If resource is already active, do not deduct again
    SELECT EXISTS (
        SELECT 1 FROM public.standalone_unlocked_resources
        WHERE user_id = p_user_id
          AND resource_type = p_resource_type
          AND resource_id = p_resource_id
          AND status = 'active'
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        SELECT balance INTO v_new_balance FROM public.user_wallets WHERE user_id = p_user_id;
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_unlocked', TRUE,
            'balance', COALESCE(v_new_balance, 0.00),
            'resource_id', p_resource_id
        );
    END IF;

    -- 3. Lock user wallet row FOR UPDATE to prevent concurrent double-spends
    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Auto-initialize empty wallet if not yet created
        INSERT INTO public.user_wallets (user_id, balance)
        VALUES (p_user_id, 0.00)
        RETURNING * INTO v_wallet;
    END IF;

    v_balance_before := v_wallet.balance;

    -- 4. Check balance sufficiency
    IF v_wallet.balance < p_credit_cost THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INSUFFICIENT_CREDITS',
            'required', p_credit_cost,
            'available', v_wallet.balance,
            'deficit', (p_credit_cost - v_wallet.balance)
        );
    END IF;

    -- 5. Calculate new balance & deduct
    v_new_balance := v_wallet.balance - p_credit_cost;

    UPDATE public.user_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet.id;

    -- Build human-friendly statement description
    v_line_description := COALESCE(
        p_description,
        INITCAP(REPLACE(p_resource_id, '-', ' ')) || ' - Standalone Access Unlock'
    );

    -- 6. Insert transaction into ledger with full before/after audit trail
    INSERT INTO public.credit_transactions (
        wallet_id,
        user_id,
        transaction_type,
        amount,
        amount_usd,
        balance_before,
        balance_after,
        description,
        resource_type,
        resource_id,
        status,
        idempotency_key,
        actor_type,
        metadata
    ) VALUES (
        v_wallet.id,
        p_user_id,
        CASE
            WHEN p_resource_type = 'tool' THEN 'tool_launch'
            WHEN p_resource_type = 'guide' THEN 'guide_unlock'
            ELSE 'service_booking'
        END,
        -p_credit_cost,
        p_credit_cost, -- $1 USD = 1 Credit equivalent
        v_balance_before,
        v_new_balance,
        v_line_description,
        p_resource_type,
        p_resource_id,
        'completed',
        p_idempotency_key,
        'user',
        p_metadata
    ) RETURNING id INTO v_tx_id;

    -- 7. Grant persistent access in unlocked resources table
    INSERT INTO public.standalone_unlocked_resources (
        user_id,
        resource_type,
        resource_id,
        transaction_id,
        status,
        usage_count,
        last_used_at,
        metadata
    ) VALUES (
        p_user_id,
        p_resource_type,
        p_resource_id,
        v_tx_id,
        'active',
        1,
        NOW(),
        p_metadata
    ) ON CONFLICT (user_id, resource_type, resource_id)
    DO UPDATE SET
        status = 'active',
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

-- Procedure 2: Top-up wallet balance atomically (invoked by Stripe Webhooks & verify-session)
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
    v_line_description TEXT;
BEGIN
    -- 1. Idempotency Check: Avoid duplicate credit deposits for identical Stripe sessions
    SELECT id, balance_after INTO v_tx_id, v_new_balance
    FROM public.credit_transactions
    WHERE stripe_session_id = p_stripe_session_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_processed', TRUE,
            'transaction_id', v_tx_id,
            'balance', v_new_balance
        );
    END IF;

    -- 2. Lock or initialize user wallet
    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.user_wallets (user_id, balance)
        VALUES (p_user_id, p_amount)
        RETURNING * INTO v_wallet;
        v_balance_before := 0.00;
        v_new_balance := p_amount;
    ELSE
        v_balance_before := v_wallet.balance;
        v_new_balance := v_wallet.balance + p_amount;
        UPDATE public.user_wallets
        SET balance = v_new_balance, updated_at = NOW()
        WHERE id = v_wallet.id;
    END IF;

    v_line_description := COALESCE(
        p_description,
        'Wallet Top-Up: ' || p_amount::TEXT || ' Credits ($' || p_amount::TEXT || ' USD)'
    );

    -- 3. Record deposit into transactions ledger
    INSERT INTO public.credit_transactions (
        wallet_id,
        user_id,
        transaction_type,
        amount,
        amount_usd,
        balance_before,
        balance_after,
        description,
        resource_type,
        status,
        payment_id,
        stripe_session_id,
        stripe_payment_id,
        actor_type,
        metadata
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
        p_metadata
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_tx_id,
        'balance_before', v_balance_before,
        'balance', v_new_balance
    );
END;
$$;

-- Procedure 3: Track usage of already unlocked standalone tools (metrics & abuse prevention)
CREATE OR REPLACE FUNCTION public.record_unlocked_resource_usage(
    p_user_id UUID,
    p_resource_id VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.standalone_unlocked_resources
    SET
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND resource_id = p_resource_id
      AND status = 'active';
END;
$$;

-- Procedure 4: Generate Bank-Like Monthly Statement Report
CREATE OR REPLACE FUNCTION public.get_monthly_wallet_statement(
    p_user_id UUID,
    p_year INT,
    p_month INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_opening_balance NUMERIC(10, 2) := 0.00;
    v_closing_balance NUMERIC(10, 2) := 0.00;
    v_total_added NUMERIC(10, 2) := 0.00;
    v_total_spent NUMERIC(10, 2) := 0.00;
    v_transactions JSONB;
BEGIN
    v_start_date := MAKE_TIMESTAMPTZ(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_end_date   := (v_start_date + INTERVAL '1 month');

    -- Opening Balance: Balance immediately preceding this month's start
    SELECT balance_after INTO v_opening_balance
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND created_at < v_start_date
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_opening_balance IS NULL THEN
        v_opening_balance := 0.00;
    END IF;

    -- Monthly aggregation totals
    SELECT
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0.00)
    INTO v_total_added, v_total_spent
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND created_at >= v_start_date
      AND created_at < v_end_date
      AND status = 'completed';

    -- Closing Balance: Balance at end of statement month
    SELECT balance_after INTO v_closing_balance
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND created_at < v_end_date
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_closing_balance IS NULL THEN
        v_closing_balance := v_opening_balance;
    END IF;

    -- Collect itemized transaction line items
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'date', created_at,
                'description', description,
                'type', transaction_type,
                'amount', amount,
                'amount_usd', amount_usd,
                'balance_before', balance_before,
                'balance_after', balance_after,
                'resource_id', resource_id,
                'status', status
            ) ORDER BY created_at ASC
        ),
        '[]'::jsonb
    )
    INTO v_transactions
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND created_at >= v_start_date
      AND created_at < v_end_date;

    RETURN jsonb_build_object(
        'statement_period', TO_CHAR(v_start_date, 'YYYY-MM'),
        'user_id', p_user_id,
        'period_start', v_start_date,
        'period_end', v_end_date,
        'opening_balance', v_opening_balance,
        'closing_balance', v_closing_balance,
        'total_credits_added', v_total_added,
        'total_credits_spent', v_total_spent,
        'transaction_count', jsonb_array_length(v_transactions),
        'transactions', v_transactions
    );
END;
$$;

-- RPC execution grants.
GRANT EXECUTE ON FUNCTION public.deduct_wallet_credits_atomic TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_topup_atomic TO service_role;
GRANT EXECUTE ON FUNCTION public.record_unlocked_resource_usage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_monthly_wallet_statement TO authenticated, service_role;
