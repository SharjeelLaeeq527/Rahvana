-- Create table for police verification requests
CREATE TABLE IF NOT EXISTS public.police_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Optional: Link to registered user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Request Tracking
    request_id TEXT UNIQUE, -- Custom tracking ID (e.g., PV-17042024-1234)
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected

    -- Personal Information
    full_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    
    -- IDs
    cnic TEXT,
    cnic_issue_date DATE,
    cnic_expiry_date DATE,
    passport_number TEXT,
    passport_issue_date DATE,
    passport_expiry_date DATE,

    -- Request Details
    province TEXT,
    district TEXT,
    purpose TEXT,
    delivery_type TEXT,
    
    -- Address & Stay
    current_address TEXT,
    stay_from DATE,
    stay_to DATE,
    residing_in TEXT, -- "Pakistan" or "Abroad"
    residing_country TEXT,
    target_country TEXT,

    -- Arrest History
    was_arrested BOOLEAN DEFAULT FALSE,
    fir_no TEXT,
    fir_year TEXT,
    police_station TEXT,
    arrest_status TEXT,

    -- Witnesses
    witness1_name TEXT,
    witness1_father TEXT,
    witness1_cnic TEXT,
    witness1_contact TEXT,
    witness1_address TEXT,

    witness2_name TEXT,
    witness2_father TEXT,
    witness2_cnic TEXT,
    witness2_contact TEXT,
    witness2_address TEXT,

    -- Document URLs
    photograph_url TEXT,
    passport_copy_url TEXT,
    utility_bill_url TEXT,
    police_letter_url TEXT,
    judgment_copy_url TEXT
);

-- Enable RLS
ALTER TABLE public.police_verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust as needed)
-- Service Role can do anything
CREATE POLICY "Enable all access for service role" ON public.police_verification_requests
    FOR ALL
    USING (auth.uid() IS NULL); -- Or distinct service role check

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.police_verification_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests" ON public.police_verification_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
