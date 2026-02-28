-- Add compressed file columns to documents table
-- These columns store information about auto-compressed versions for files > 4MB
-- Required for NVC/USCIS compliance (4MB file size limit)

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS has_compressed_version BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compressed_filename TEXT,
ADD COLUMN IF NOT EXISTS compressed_file_size BIGINT,
ADD COLUMN IF NOT EXISTS compressed_storage_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN documents.has_compressed_version IS 'Indicates if a compressed version exists (for files > 4MB)';
COMMENT ON COLUMN documents.compressed_filename IS 'Filename of the compressed version';
COMMENT ON COLUMN documents.compressed_file_size IS 'Size of the compressed file in bytes';
COMMENT ON COLUMN documents.compressed_storage_path IS 'Storage path of the compressed file';
