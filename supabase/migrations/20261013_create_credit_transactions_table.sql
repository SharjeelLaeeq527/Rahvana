-- Table: credit_transactions
-- Includes its table definition, indexes, RLS policies, and table permissions.

-- 2. CREDIT TRANSACTIONS LEDGER TABLE (Monthly Statement Fields - Ready)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN ('top_up', 'tool_launch', 'guide_unlock', 'service_booking', 'refund', 'adjustment', 'bonus')
    ),
    amount NUMERIC(10, 2) NOT NULL, -- Positive for deposits (+), negative for deductions (-)
    amount_usd NUMERIC(10, 2),       -- USD monetary equivalent for accounting and statement transparency
    balance_before NUMERIC(10, 2) NOT NULL CHECK (balance_before >= 0.00),
    balance_after NUMERIC(10, 2) NOT NULL CHECK (balance_after >= 0.00),
    description TEXT NOT NULL,       -- Human-readable statement line item (e.g., 'Wallet Top-up via Stripe', 'Sponsorship Calculator Unlock')
    resource_type VARCHAR(30) CHECK (resource_type IN ('tool', 'guide', 'service', 'wallet', 'adjustment')),
    resource_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'reversed', 'failed')),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL, -- Direct link to Rahvana central payments
    stripe_session_id TEXT,
    stripe_payment_id TEXT,
    stripe_invoice_id TEXT,          -- Useful for customer tax invoices / receipts
    idempotency_key TEXT,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'admin', 'stripe_webhook')),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Track admin/support identity for manual adjustments
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & monthly statement query indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON public.credit_transactions(status);

-- Idempotency and webhook deduplication indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_tx_stripe_session ON public.credit_transactions(stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_tx_idempotency ON public.credit_transactions(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions"
    ON public.credit_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "Service role full access to credit_transactions" ON public.credit_transactions;
CREATE POLICY "Service role full access to credit_transactions"
    ON public.credit_transactions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


GRANT SELECT ON public.credit_transactions TO authenticated;
