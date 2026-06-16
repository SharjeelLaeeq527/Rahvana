-- Add ceac_status_update to the journey_reminder_type ENUM
-- This allows CEAC notifications to appear in the in-app bell icon

ALTER TYPE journey_reminder_type ADD VALUE IF NOT EXISTS 'ceac_status_update';
