// API Route: Preview Document
// GET /api/documents/[id]/preview
// Uses Supabase Storage (works on BOTH local AND Vercel)
//
// Security: Files stored in Supabase are AES-256-GCM encrypted.
// We cannot redirect to a signed URL (browser can't decrypt it).
// Instead: download encrypted blob → decrypt server-side → stream to browser.

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

    // ── 2. Fetch document metadata (RLS enforced) ─────────────────────────────
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

    const { data: blobData, error: downloadError } = await storageSupabase.storage
      .from('document-vault')
      .download(document.storagePath);

    if (downloadError || !blobData) {
      console.error('[preview] Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to retrieve file from storage' },
        { status: 500 }
      );
    }

    const encryptedBuffer = Buffer.from(await blobData.arrayBuffer());

    // ── 4. Decrypt the file ───────────────────────────────────────────────────
    let fileBuffer: Buffer;

    if (isEncryptedFile(encryptedBuffer)) {
      try {
        fileBuffer = decryptFile(encryptedBuffer, user.id);
      } catch (decryptError) {
        console.error('[preview] Decryption failed:', decryptError);
        return NextResponse.json(
          { error: 'Failed to decrypt file' },
          { status: 500 }
        );
      }
    } else {
      // Legacy unencrypted file — serve as-is
      fileBuffer = encryptedBuffer;
    }

    // ── 5. Stream decrypted file for inline preview ───────────────────────────
    const mimeType = document.mimeType || 'application/octet-stream';
    // 'inline' tells browser to display it (PDF viewer, image) instead of downloading
    const contentDisposition = `inline; filename="${encodeURIComponent(document.originalFilename)}"`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': contentDisposition,
        'Content-Length': fileBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[preview] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
