-- Add payment tracking to police_verification_requests table
DO $$ 
BEGIN
    -- Add payment_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'police_verification_requests' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.police_verification_requests 
        ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;
    END IF;

    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'police_verification_requests' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.police_verification_requests 
        ADD COLUMN payment_status TEXT DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed'));
    END IF;
END $$;

-- Create index for payment_id
CREATE INDEX IF NOT EXISTS idx_police_verification_payment_id ON public.police_verification_requests(payment_id);
