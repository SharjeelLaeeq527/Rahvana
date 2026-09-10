-- Add expiration tracking fields to journey_documents table
ALTER TABLE journey_documents
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expiration_warning_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS is_expirable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expiration_status TEXT CHECK (
    expiration_status IN ('valid', 'expiring_soon', 'expired')
) DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS source_step_key TEXT,
ADD COLUMN IF NOT EXISTS document_category TEXT CHECK (
    document_category IN (
        'already_uploaded',
        'expirable',
        'post_interview',
        'general'
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journey_documents_expiry ON journey_documents (journey_id, expiry_date)
WHERE
    is_expirable = true;

CREATE INDEX IF NOT EXISTS idx_journey_documents_category ON journey_documents (journey_id, document_category, status);
