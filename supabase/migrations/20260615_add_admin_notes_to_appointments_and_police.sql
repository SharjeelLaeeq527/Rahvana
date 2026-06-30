-- Migration: Add admin_notes to appointments and police_verification_requests
-- Created: 2026-06-15

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';

ALTER TABLE public.police_verification_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
