// API Route: Download Document
// GET /api/documents/[id]/download
// Uses Supabase Storage (works on BOTH local AND Vercel)
//
// Security flow:
//   1. User must be authenticated (JWT check)
//   2. RLS ensures user can only fetch their own document metadata
//   3. We download the encrypted blob from Supabase Storage
//   4. Decrypt it server-side using AES-256-GCM (per-user key)
//   5. Send the decrypted bytes back to the user with correct Content-Type
//
// Owner / admin accessing Supabase Storage directly sees ONLY encrypted garbage.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DocumentDatabaseStorage } from '@/lib/document-vault/storage-database';
import { createClient as createClientJs } from '@supabase/supabase-js';
import { decryptFile, isEncryptedFile } from '@/lib/document-vault/file-encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Authenticate user ──────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // ── 2. Fetch document metadata (RLS enforced — only owner's docs) ─────────
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(id, user.id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ── 3. Download encrypted blob from Supabase Storage ──────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Storage not configured' },
        { status: 500 }
      );
    }

    const storageSupabase = createClientJs(supabaseUrl, serviceRoleKey);

    // Download the raw (encrypted) bytes from storage
    const { data: blobData, error: downloadError } = await storageSupabase.storage
      .from('document-vault')
      .download(document.storagePath);

    if (downloadError || !blobData) {
      console.error('[download] Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to retrieve file from storage' },
        { status: 500 }
      );
    }

    // Convert blob to Buffer
    const encryptedBuffer = Buffer.from(await blobData.arrayBuffer());

    // ── 4. Decrypt the file ───────────────────────────────────────────────────
    let fileBuffer: Buffer;

    if (isEncryptedFile(encryptedBuffer)) {
      // File is encrypted with our AES-256-GCM scheme — decrypt it
      try {
        fileBuffer = decryptFile(encryptedBuffer, user.id);
      } catch (decryptError) {
        console.error('[download] Decryption failed:', decryptError);
        return NextResponse.json(
          { error: 'Failed to decrypt file. Please contact support.' },
          { status: 500 }
        );
      }
    } else {
      // Legacy file (uploaded before encryption was enabled) — serve as-is
      console.warn(
        `[download] File ${document.storagePath} is not encrypted (legacy). Serving as-is.`
      );
      fileBuffer = encryptedBuffer;
    }

    // ── 5. Return decrypted file to user with correct headers ─────────────────
    const contentDisposition = `attachment; filename="${encodeURIComponent(document.originalFilename)}"`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': contentDisposition,
        'Content-Length': fileBuffer.length.toString(),
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[download] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
