-- Migration: Add journey_id to documents table
-- Purpose: Associate documents with specific journeys and support cross-journey uploads.

-- 1. Add journey_id column if not exists referencing the journeys table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE;

-- 2. Create index on journey_id for performance
CREATE INDEX IF NOT EXISTS idx_documents_journey_id ON public.documents(journey_id);

-- 3. Backfill existing documents with the user's first journey if currently null
UPDATE public.documents d
SET journey_id = (
  SELECT id FROM public.journeys j 
  WHERE j.user_id = d.user_id 
  LIMIT 1
)
WHERE d.journey_id IS NULL;
