// API Route: Upload Document
// POST /api/documents/upload
// Uses Supabase Storage (works on BOTH local AND Vercel)
// Files are encrypted with AES-256-GCM BEFORE upload — owner cannot read stored files

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateStandardizedFilename,
  isValidFileType,
  isValidFileSize,
  getFileExtension,
} from '@/lib/document-vault/file-utils';
import {
  generateDocumentId,
  getNextVersionNumber,
} from '@/lib/document-vault/storage-client';
import { DocumentDatabaseStorage } from '@/lib/document-vault/storage-database';
import { calculateExpirationDate } from '@/lib/document-vault/expiration-tracker';
import { ALL_DOCUMENTS } from '@/lib/document-vault/document-definitions';
import { UploadedDocument, DocumentRole } from '@/lib/document-vault/types';
import { createClient as createClientJs } from '@supabase/supabase-js';
import { encryptFile } from '@/lib/document-vault/file-encryption';

// NVC/USCIS file size limit (4MB)
const NVC_FILE_SIZE_LIMIT = 4 * 1024 * 1024;
// Python backend URL for PDF compression
const COMPRESSION_API_URL = process.env.COMPRESSION_API_URL ?? 'http://localhost:8000';

/**
 * Get Supabase client with SERVICE ROLE key (bypasses RLS)
 */
function getStorageSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }
  // Service role key bypasses RLS
  return createClientJs(supabaseUrl, serviceRoleKey);
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
  documentId: string
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    const supabase = getStorageSupabase();
    const bucketName = 'document-vault';
    const storagePath = `${userId}/${documentId}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, storagePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}



/**
 * Compress PDF file using Python backend
 */
async function compressPdf(buffer: Buffer, filename: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
    formData.append('file', blob, filename);

    const response = await fetch(`${COMPRESSION_API_URL}/api/v1/compress`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Compression failed' }));
      return { success: false, error: errorData.detail || 'Compression failed' };
    }

    const compressedBlob = await response.blob();
    const compressedBuffer = Buffer.from(await compressedBlob.arrayBuffer());

    return { success: true, buffer: compressedBuffer };
  } catch (error) {
    console.error('PDF compression error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Compression failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentDefId = formData.get('documentDefId') as string;
    const role = formData.get('role') as DocumentRole;
    const personName = formData.get('personName') as string;
    const caseId = formData.get('caseId') as string | undefined;
    const expirationDateStr = formData.get('expirationDate') as string | undefined;
    const notes = formData.get('notes') as string | undefined;

    // Validate required fields
    if (!file || !documentDefId || !role || !personName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileTypeValidation = isValidFileType(file.name, file.type);
    if (!fileTypeValidation.valid) {
      return NextResponse.json(
        { error: fileTypeValidation.message },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const fileSizeValidation = isValidFileSize(file.size, 10);
    if (!fileSizeValidation.valid) {
      return NextResponse.json(
        { error: fileSizeValidation.message },
        { status: 400 }
      );
    }

    // Find document definition
    const documentDef = ALL_DOCUMENTS.find((d) => d.id === documentDefId);
    if (!documentDef) {
      return NextResponse.json(
        { error: 'Invalid document definition' },
        { status: 400 }
      );
    }

    // Get existing documents for this definition
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const existingDocs = await dbStorage.getDocumentsByDefId(documentDefId, user.id);
    const version = getNextVersionNumber(existingDocs);

    // Generate standardized filename
    const extension = getFileExtension(file.name, file.type);
    const standardizedFilename = generateStandardizedFilename({
      caseId,
      role,
      personName,
      docKey: documentDef.key,
      date: new Date(),
      version,
      originalExtension: extension,
    });

    // Generate document ID
    const documentId = generateDocumentId();
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // ─── ENCRYPT FILE BEFORE UPLOAD ───────────────────────────────────────────
    // File is encrypted with AES-256-GCM using a per-user key derived from
    // PORTAL_WALLET_SECRET + userId. Owner (or anyone accessing Supabase
    // Storage directly) will only see an unreadable encrypted blob.
    const buffer = encryptFile(rawBuffer, user.id);
    // ──────────────────────────────────────────────────────────────────────────

    // Check if file needs compression
    // NOTE: We use rawBuffer size for NVC limit check (real file size)
    const isPdf = file.type === 'application/pdf';
    const needsCompression = rawBuffer.length > NVC_FILE_SIZE_LIMIT && isPdf;

    // Determine filename for original file
    const originalFilename = needsCompression
      ? standardizedFilename.replace(/\.pdf$/i, '_master.pdf')
      : standardizedFilename;

    // Upload encrypted buffer to Supabase Storage
    const uploadResult = await uploadToStorage(
      buffer,           // <-- encrypted bytes go to storage
      originalFilename,
      'application/octet-stream', // always store as binary blob
      user.id,
      documentId
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Auto-compress PDF files larger than 4MB (NVC/USCIS requirement)
    // Compress FIRST on raw bytes, then encrypt the compressed version
    let hasCompressedVersion = false;
    let compressedFilename: string | undefined;
    let compressedFileSize: number | undefined;
    let compressedStoragePath: string | undefined;

    if (needsCompression) {
      console.log(`File ${file.name} is ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB - auto-compressing...`);

      const compressionResult = await compressPdf(rawBuffer, file.name);

      if (compressionResult.success && compressionResult.buffer) {
        const rawCompressedSize = compressionResult.buffer.length;

        if (rawCompressedSize < rawBuffer.length) {
          compressedFilename = standardizedFilename;

          // Encrypt the compressed buffer before uploading
          const encryptedCompressedBuffer = encryptFile(compressionResult.buffer, user.id);

          // Upload encrypted-compressed file to Supabase Storage
          const compressedUploadResult = await uploadToStorage(
            encryptedCompressedBuffer,
            compressedFilename,
            'application/octet-stream', // store as binary blob
            user.id,
            documentId
          );

          if (compressedUploadResult.success) {
            hasCompressedVersion = true;
            compressedFileSize = rawCompressedSize; // store real size for UI display
            compressedStoragePath = compressedUploadResult.storagePath;

            console.log(`Compression + Encryption successful: ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB -> ${(rawCompressedSize / 1024 / 1024).toFixed(2)}MB (then encrypted)`);
          }
        }
      }
    }

    // Calculate expiration date
    const uploadDate = new Date();
    const expirationDate = expirationDateStr
      ? new Date(expirationDateStr)
      : calculateExpirationDate(documentDef, uploadDate);

    // Create document metadata
    // NOTE: fileSize stores the ORIGINAL (pre-encryption) file size for UI display
    // The actual stored file is larger due to encryption overhead (~37 bytes)
    const uploadedDocument: UploadedDocument = {
      id: documentId,
      userId: user.id,
      documentDefId,
      originalFilename: file.name,
      standardizedFilename: originalFilename,
      fileSize: file.size,           // real size shown to user
      mimeType: file.type,           // original MIME type preserved
      storagePath: uploadResult.storagePath!,
      hasCompressedVersion,
      compressedFilename,
      compressedFileSize,            // real compressed size shown to user
      compressedStoragePath,
      uploadedAt: uploadDate,
      uploadedBy: role,
      version,
      expirationDate,
      isExpired: false,
      status: 'UPLOADED',
      notes,
    };

    // Save document metadata to database
    const savedDocument = await dbStorage.saveDocument(uploadedDocument);

    return NextResponse.json({
      success: true,
      document: savedDocument,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
