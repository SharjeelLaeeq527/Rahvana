-- Mark the origin of service requests: journey-embedded vs standalone (My Resources).
-- Adds:
--   • appointments:                  source, journey_slug
--   • police_verification_requests:  source, journey_slug, received_at
-- Existing rows default to 'standalone' so My Resources keeps showing all legacy requests.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'standalone';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS journey_slug TEXT;

ALTER TABLE public.police_verification_requests
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'standalone';

ALTER TABLE public.police_verification_requests
  ADD COLUMN IF NOT EXISTS journey_slug TEXT;

-- Set when the applicant marks the PCC as received (drives the 6-month validity clock).
ALTER TABLE public.police_verification_requests
  ADD COLUMN IF NOT EXISTS received_at DATE;

-- Partial indexes for the scope filters used by /api/user-dashboard/services-status
CREATE INDEX IF NOT EXISTS idx_appointments_source
  ON public.appointments (source) WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_police_verification_requests_source
  ON public.police_verification_requests (source) WHERE source IS NOT NULL;
