-- ============================================================
-- Migration: Index audit_logs by (status, created_at)
-- Date: 2026-09-14
-- Purpose: The security scan filters audit_logs by
--          `status = 'blocked'` within a time window
--          (lib/security/alerting.ts). There was no index on
--          `status`, so Postgres had to SCAN the whole table
--          every run -- a growing Disk IO cost as the table
--          grows. The admin audit-logs viewer also filters by
--          `status`. This composite index makes both use an
--          index range instead of a full-table scan.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_status_created
  ON audit_logs (status, created_at DESC);

-- NOTE: recurring cleanup of old rows is handled in code by
-- pruneOldAuditLogs() (lib/security/alerting.ts), called daily
-- from the /api/cron/security-scan route (90-day retention).
