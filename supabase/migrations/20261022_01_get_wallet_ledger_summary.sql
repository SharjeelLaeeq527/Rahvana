-- Function: get_wallet_ledger_summary
-- Lifetime hero stats for the wallet transaction history page (/wallet/transactions):
-- current balance, total credits added, total credits spent, pending count.
-- Additive only: touches no existing tables, policies, or functions.
--
-- Follows the hardening policy from 20261014_01_harden_wallet_rpcs.sql:
-- SECURITY DEFINER with a locked search_path and service_role-only EXECUTE.
-- The Next.js route (app/api/wallet/transactions/route.ts) authenticates the caller first and passes the session user id — the browser can never call this function directly, and it can only ever describe p_user_id's own ledger.

CREATE OR REPLACE FUNCTION public.get_wallet_ledger_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance           NUMERIC(10, 2) := 0.00;
    v_total_added       NUMERIC(10, 2) := 0.00;
    v_total_spent       NUMERIC(10, 2) := 0.00;
    v_pending_count     BIGINT         := 0;
    v_transaction_count BIGINT         := 0;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(balance, 0.00) INTO v_balance
    FROM public.user_wallets
    WHERE user_id = p_user_id;

    -- Completed rows only feed the money totals; a charge that is still
    -- `pending` (or was `reversed`/`failed`) must not read as spent or added.
    SELECT
        COALESCE(SUM(amount)     FILTER (WHERE amount > 0 AND status = 'completed'), 0.00),
        COALESCE(SUM(-amount)    FILTER (WHERE amount < 0 AND status = 'completed'), 0.00),
        COALESCE(COUNT(*)        FILTER (WHERE status = 'pending'), 0),
        COUNT(*)
    INTO v_total_added, v_total_spent, v_pending_count, v_transaction_count
    FROM public.credit_transactions
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'balance', v_balance,
        'total_credits_added', v_total_added,
        'total_credits_spent', v_total_spent,
        'pending_count', v_pending_count,
        'transaction_count', v_transaction_count
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_wallet_ledger_summary(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_ledger_summary(UUID) TO service_role;
