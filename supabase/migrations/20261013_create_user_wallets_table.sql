-- Table: user_wallets
-- Includes its table definition, index, timestamp trigger, RLS policy, and table permissions.

-- 1. USER WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'credits',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_wallets_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);

-- Auto-update updated_at trigger for user_wallets
CREATE OR REPLACE FUNCTION public.handle_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER trg_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_wallet_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICY
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- User Read Policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
    ON public.user_wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service Role full access policies for backend server processes
DROP POLICY IF EXISTS "Service role full access to user_wallets" ON public.user_wallets;
CREATE POLICY "Service role full access to user_wallets"
    ON public.user_wallets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT ON public.user_wallets TO authenticated;
