-- Add `awaiting_payment` draft flag to Medical appointments and PCC requests.
--
-- Why: for standalone users who must pay (no plan / no credit), the request row is now
-- created as a DRAFT (awaiting_payment = true) and hidden from the user's "My Resources"
-- until payment succeeds. Credit-covered and journey bookings keep the default (false)
-- and remain visible immediately, exactly as before. Flipping a draft to paid (clearing
-- the flag) is done by the Stripe webhook / verify-session.
--
-- Idempotent + backfill-safe: NOT NULL DEFAULT FALSE means every existing row is a
-- normal (visible) request, so this migration alone changes nothing users can see.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'awaiting_payment'
    ) THEN
        ALTER TABLE public.appointments
        ADD COLUMN awaiting_payment BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'police_verification_requests'
        AND column_name = 'awaiting_payment'
    ) THEN
        ALTER TABLE public.police_verification_requests
        ADD COLUMN awaiting_payment BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Partial indexes for the (frequent) "hide drafts" list filters.
CREATE INDEX IF NOT EXISTS idx_appointments_awaiting_payment
    ON public.appointments(awaiting_payment) WHERE awaiting_payment = TRUE;
CREATE INDEX IF NOT EXISTS idx_police_verification_awaiting_payment
    ON public.police_verification_requests(awaiting_payment) WHERE awaiting_payment = TRUE;
