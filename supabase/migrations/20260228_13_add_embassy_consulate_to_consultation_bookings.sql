-- Add embassy_consulate column to consultation_bookings table
ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS embassy_consulate TEXT;
