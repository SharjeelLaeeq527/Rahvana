-- Create ENUM for translation status
DROP TYPE IF EXISTS translation_status CASCADE;
CREATE TYPE translation_status AS ENUM (
  'PENDING',            -- User uploaded, awaiting admin review
  'IN_REVIEW',          -- Admin actively working on translation
  'TRANSLATED',         -- Admin uploaded translated version
  'USER_CONFIRMED',     -- User accepted the translation
  'CHANGES_REQUESTED',  -- User rejected, needs revision
  'VERIFIED'            -- Admin verified and certified (final state)
);

-- Main translation documents table
CREATE TABLE translation_documents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Details
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,  -- Store email for reference 
  user_name TEXT,   -- Store name for reference
  
  -- Document Classification
  document_type TEXT NOT NULL,  -- e.g., 'marriage', 'birth', 'death'
  
  -- Original File (Urdu)
  original_file_path TEXT NOT NULL,       -- Supabase Storage path
  original_filename TEXT NOT NULL,
  original_file_size BIGINT NOT NULL,
  original_mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  
  -- Translated File (English)
  translated_file_path TEXT,              -- Supabase Storage path
  translated_filename TEXT,
  translated_file_size BIGINT,
  translated_mime_type TEXT,
  translated_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  -- Status & Workflow
  status translation_status NOT NULL DEFAULT 'PENDING',
  version DECIMAL(3,1) DEFAULT 1.0,               -- Versioning for translations

  -- Additional Notes (Optional)
  user_notes TEXT,                        -- User's notes during upload
  admin_notes TEXT,                       -- Admin's notes during translation
  rejection_reason TEXT,                  -- User's reason if CHANGES_REQUESTED
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_confirmed_at TIMESTAMP WITH TIME ZONE,
  admin_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,     -- Extra info (IP, browser, etc)
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (original_file_size > 0 AND original_file_size <= 50 * 1024 * 1024)  -- 50MB max
);

-- Indexes 
CREATE INDEX idx_translation_documents_user_id ON translation_documents(user_id);
CREATE INDEX idx_translation_documents_status ON translation_documents(status);
CREATE INDEX idx_translation_documents_created_at ON translation_documents(created_at DESC);
CREATE INDEX idx_translation_documents_document_type ON translation_documents(document_type);

-- Updated_at trigger
CREATE TRIGGER set_translation_documents_updated_at
BEFORE UPDATE ON translation_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE translation_documents IS 'Stores manual translation workflow for Urdu to English documents';
COMMENT ON COLUMN translation_documents.status IS 'PENDING → IN_REVIEW → TRANSLATED → USER_CONFIRMED → VERIFIED (or CHANGES_REQUESTED)';