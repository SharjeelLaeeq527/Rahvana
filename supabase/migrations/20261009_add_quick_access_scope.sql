-- Add context/scope to existing favorites.
ALTER TABLE public.user_quick_access
  ADD COLUMN IF NOT EXISTS scope_type text NOT NULL DEFAULT 'account',
  ADD COLUMN IF NOT EXISTS journey_id uuid NULL
    REFERENCES public.journeys(id) ON DELETE CASCADE;

-- Only allow supported scopes and consistent journey references.
ALTER TABLE public.user_quick_access
  ADD CONSTRAINT user_quick_access_scope_check
  CHECK (
    (scope_type = 'account' AND journey_id IS NULL)
    OR
    (scope_type = 'journey' AND journey_id IS NOT NULL)
  );

-- Remove the old constraint that prevented the same resource from being favorited in multiple contexts.
ALTER TABLE public.user_quick_access
  DROP CONSTRAINT IF EXISTS user_quick_access_unique;

-- Account-wide favorites: one favorite per user/resource.
CREATE UNIQUE INDEX IF NOT EXISTS
  user_quick_access_account_unique
ON public.user_quick_access (user_id, item_id)
WHERE scope_type = 'account';

-- Journey favorites: one favorite per user/journey/resource.
CREATE UNIQUE INDEX IF NOT EXISTS
  user_quick_access_journey_unique
ON public.user_quick_access (user_id, journey_id, item_id)
WHERE scope_type = 'journey';

-- Efficient lookup by journey.
CREATE INDEX IF NOT EXISTS
  idx_user_quick_access_journey
ON public.user_quick_access (user_id, journey_id)
WHERE scope_type = 'journey';
