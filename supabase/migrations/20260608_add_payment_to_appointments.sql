-- Add payment tracking to appointments table
DO $$ 
BEGIN
    -- Add payment_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;
    END IF;

    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN payment_status TEXT DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed'));
    END IF;
END $$;

-- Create index for payment_id
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON public.appointments(payment_id);
