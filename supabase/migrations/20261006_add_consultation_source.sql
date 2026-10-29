-- Origin tagging for consultation bookings (journey-embedded vs standalone).
ALTER TABLE public.consultation_bookings
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'standalone';

ALTER TABLE public.consultation_bookings
  ADD COLUMN IF NOT EXISTS journey_slug TEXT;

ALTER TABLE public.consultation_bookings
  ADD COLUMN IF NOT EXISTS candidate_id TEXT;

CREATE INDEX IF NOT EXISTS idx_consultation_bookings_source
  ON public.consultation_bookings (source) WHERE source IS NOT NULL;
