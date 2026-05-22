// API Route: Export Individual Document
// GET /api/documents/[id]/export
// Exports single document as ZIP with original + compressed versions (if exists)

import { NextRequest, NextResponse } from 'next/server';
import { E, msg } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { DocumentFileManager } from '@/lib/document-vault/storage-server';
import { DocumentDatabaseStorage } from '@/lib/document-vault/storage-database';
import { ALL_DOCUMENTS } from '@/lib/document-vault/document-definitions';
import JSZip from 'jszip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[documents/export] Unauthorized:', authError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { id } = await params;
    const documentId = id;

    // Get document metadata
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(documentId, user.id);

    if (!document) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    // Get document definition for naming
    const docDef = ALL_DOCUMENTS.find(d => d.id === document.documentDefId);
    const docName = docDef?.name || document.documentDefId;

    const fileManager = new DocumentFileManager();

    // If document has compressed version, export as ZIP with both files
    if (document.hasCompressedVersion && document.compressedStoragePath && document.compressedFilename) {
      const zip = new JSZip();

      // Add original file
      const originalResult = await fileManager.readFile(document.storagePath);
      if (originalResult.success && originalResult.buffer) {
        zip.file(document.standardizedFilename, originalResult.buffer);
      }

      // Add compressed file
      const compressedResult = await fileManager.readFile(document.compressedStoragePath);
      if (compressedResult.success && compressedResult.buffer) {
        zip.file(document.compressedFilename, compressedResult.buffer);
      }

      // Generate ZIP
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Clean document name for filename
      const cleanDocName = docName.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${cleanDocName}_${timestamp}.zip`;

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });
    }

    // No compressed version - return single file directly
    const readResult = await fileManager.readFile(document.storagePath);

    if (!readResult.success || !readResult.buffer) {
      console.error('[documents/export] read error:', readResult.error);
      return NextResponse.json(
        { error: msg(E.CASE_DATA_NOT_FOUND) },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(readResult.buffer), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.standardizedFilename}"`,
        'Content-Length': document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Export document error:', error);
    console.error('Export document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
