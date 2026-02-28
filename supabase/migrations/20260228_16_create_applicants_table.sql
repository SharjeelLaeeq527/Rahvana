CREATE TABLE applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to appointments table
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    
    -- Applicant details
    surname TEXT,
    given_name TEXT,
    gender TEXT,
    date_of_birth DATE,
    passport_number TEXT,
    passport_issue_date DATE,
    passport_expiry_date DATE,
    case_number TEXT,
    case_ref TEXT
);

-- Enable RLS
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can view all applicants" ON applicants
    FOR SELECT TO authenticated
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admin can insert applicants" ON applicants
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column_applicants()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column_applicants();