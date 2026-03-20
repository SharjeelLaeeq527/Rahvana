-- ============================================================
-- Migration: Secure Document Vault Storage Policies
-- Date: 2026-03-19
-- Purpose: Lock down Supabase Storage so only the file owner
--          can upload/download their own documents.
--          (Bucket itself must be set to PRIVATE in dashboard
--           OR via the INSERT below)
-- ============================================================

-- Step 1: Make the bucket private (if it exists as public, this fixes it)
-- This prevents anyone from accessing files via public URL
UPDATE storage.buckets
SET public = false
WHERE name = 'document-vault';

-- Also insert if it doesn't exist yet (safe with ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-vault',
  'document-vault',
  false,   -- PRIVATE bucket
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'  -- encrypted files are stored as binary blob
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- Step 2: Drop any old/permissive storage policies
-- ============================================================
DROP POLICY IF EXISTS "Allow public read on document-vault" ON storage.objects;
DROP POLICY IF EXISTS "Public read document-vault" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;

-- ============================================================
-- Step 3: Add strict per-user storage policies
--
-- Files are stored at path: {userId}/{documentId}/{filename}
-- So we check that the first segment of the path = auth.uid()
-- ============================================================

-- UPLOAD: Only owner can upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-vault'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DOWNLOAD/READ: Only owner can download their own files
CREATE POLICY "Users can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-vault'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Only owner can update their own files
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'document-vault'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Only owner can delete their own files
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-vault'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- Step 4: Verify (run these SELECTs manually to confirm)
-- ============================================================
-- SELECT name, public FROM storage.buckets WHERE name = 'document-vault';
-- Expected: public = false
--
-- SELECT policyname, cmd FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';
-- Expected: 4 policies listed above
-- ============================================================
