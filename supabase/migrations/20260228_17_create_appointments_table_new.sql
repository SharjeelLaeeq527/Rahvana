CREATE TYPE appointment_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User information
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Appointment details
    location TEXT,
    provider TEXT, -- AMC, IOM, etc.
    appointment_type TEXT,
    visa_type TEXT,
    medical_type TEXT,
    
    -- Personal details
    surname TEXT,
    given_name TEXT,
    gender TEXT,
    date_of_birth DATE,
    passport_number TEXT,
    passport_issue_date DATE,
    passport_expiry_date DATE,
    case_number TEXT,
    
    -- Status tracking
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    
    -- File information (stored as URLs or metadata)
    scanned_passport_url TEXT,
    k_one_letter_url TEXT,
    appointment_confirmation_letter_url TEXT,
    
    -- Preferred scheduling
    preferred_date DATE,
    preferred_time TIME,
    
    -- Additional fields
    estimated_charges TEXT,
    interview_date DATE,
    visa_category TEXT,
    had_medical_before TEXT,
    city TEXT,
    case_ref TEXT,
    number_of_applicants INTEGER
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can view all appointments" ON appointments
    FOR SELECT TO authenticated
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admin can update appointments" ON appointments
    FOR UPDATE TO authenticated
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();