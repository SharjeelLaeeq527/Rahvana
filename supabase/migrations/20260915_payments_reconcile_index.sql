-- ============================================================
-- Migration: Composite index for the plan-reconcile query
-- Date: 2026-09-15
-- Purpose: reconcileUserPlan (lib/plan/reconcile.ts) runs:
--     WHERE user_id = ? AND product_type = 'journey_plan'
--           AND status IN ('succeeded','pending')
--     ORDER BY created_at DESC LIMIT 10
--   Existing indexes are single-column (user_id / product_type /
--   status), so Postgres could use only one and then filter +
--   SORT the rest. This composite index matches the equality
--   filters and the sort order, so the query becomes an index
--   range scan with no separate sort step.
--   (Reconcile is now throttled to 1/day per user, but this keeps
--   each run cheap.)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_user_product_created
  ON public.payments (user_id, product_type, created_at DESC);
