-- Migration: Add admin tracking fields to journeys table
-- Created: 2026-04-15
-- Purpose: Enable admin manual tracking for 5 non-auto-trackable steps
--   - Step 2.9: NVC Document Review
--   - Step 2.10: DQ Status
--   - Step 2.11: Interview Queue
--   - Step 2.12: Interview Scheduled
--   - Step 3.9: Administrative Processing

-- Add tracking_status JSONB column (default empty object)
ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS tracking_status jsonb DEFAULT '{}'::jsonb;

-- tracking_status structure:
-- {
--   "nvc_review_complete": false,
--   "nvc_review_date": null,
--   "dq_status": null,          -- null | "pending" | "qualified"
--   "dq_date": null,
--   "interview_queue": false,
--   "interview_date": null,
--   "interview_time": null,
--   "interview_embassy": null,
--   "ap_status": null,          -- null | "pending" | "cleared"
--   "ap_date": null,
--   "ap_cleared_date": null,
--   "last_admin_update": null
-- }

-- Add admin tracking metadata columns
ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS admin_last_checked_at timestamptz;

ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT '';

-- Add index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_journeys_admin_last_checked 
ON journeys(admin_last_checked_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_journeys_tracking_status 
ON journeys USING GIN(tracking_status);

-- Add comment for documentation
COMMENT ON COLUMN journeys.tracking_status IS 
'Admin-managed tracking for 5 non-auto-trackable steps: NVC review, DQ, interview queue, interview scheduled, AP';

COMMENT ON COLUMN journeys.admin_last_checked_at IS 
'Timestamp of last admin case review';

COMMENT ON COLUMN journeys.admin_notes IS 
'Internal admin notes about this case';
