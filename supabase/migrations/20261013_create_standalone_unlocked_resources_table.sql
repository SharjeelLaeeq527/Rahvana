-- Table: standalone_unlocked_resources
-- Includes its table definition, indexes, timestamp trigger, RLS policies, and table permissions.

-- 3. STANDALONE UNLOCKED RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.standalone_unlocked_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type VARCHAR(30) NOT NULL CHECK (resource_type IN ('tool', 'guide', 'service')),
    resource_id VARCHAR(100) NOT NULL,
    transaction_id UUID REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0), -- Tracks subsequent executions for backend metrics & abuse monitoring
    last_used_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_unlocked_resource UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_unlocked_res_user ON public.standalone_unlocked_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_res_lookup ON public.standalone_unlocked_resources(user_id, resource_id, status);

-- Auto-update updated_at trigger for unlocked resources
CREATE OR REPLACE FUNCTION public.handle_unlocked_res_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unlocked_res_updated_at ON public.standalone_unlocked_resources;
CREATE TRIGGER trg_unlocked_res_updated_at
    BEFORE UPDATE ON public.standalone_unlocked_resources
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_unlocked_res_updated_at();

DROP POLICY IF EXISTS "Users can view own unlocked resources" ON public.standalone_unlocked_resources;
CREATE POLICY "Users can view own unlocked resources"
    ON public.standalone_unlocked_resources FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to standalone_unlocked_resources" ON public.standalone_unlocked_resources;
CREATE POLICY "Service role full access to standalone_unlocked_resources"
    ON public.standalone_unlocked_resources FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT ON public.standalone_unlocked_resources TO authenticated;
