-- Migration: Add user_id to consultation_bookings
-- Created: 2026-06-13
-- Description:
--   Adds user_id column to consultation_bookings table for robust user matching

ALTER TABLE public.consultation_bookings 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for looking up consultation bookings by user
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id 
  ON public.consultation_bookings(user_id);

-- Backfill existing consultation bookings: match email to profiles
UPDATE public.consultation_bookings c
SET user_id = p.id
FROM public.profiles p
WHERE c.user_id IS NULL
  AND LOWER(c.email) = LOWER(p.email);
