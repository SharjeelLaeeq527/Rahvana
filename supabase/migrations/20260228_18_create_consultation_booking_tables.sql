-- Create consultation bookings table
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id TEXT UNIQUE NOT NULL,
  issue_category TEXT NOT NULL,
  visa_category TEXT NOT NULL,
  case_stage TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
  preferred_language TEXT DEFAULT 'English',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  case_summary TEXT NOT NULL,
  attachments TEXT[], -- Array of attachment filenames
  selected_slot TIMESTAMPTZ NOT NULL,
  alternate_slots TIMESTAMPTZ[], -- Array of alternate slot timestamps
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'alternatives_proposed', 'needs_more_info', 'confirmed', 'completed', 'canceled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'pending', 'confirmed')),
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_reference_id ON consultation_bookings(reference_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_selected_slot ON consultation_bookings(selected_slot);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_created_at ON consultation_bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_datetime ON time_slots(date, start_time, end_time);

-- Create RLS policies for consultation bookings
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultation_bookings_updated_at 
    BEFORE UPDATE ON consultation_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at 
    BEFORE UPDATE ON time_slots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();