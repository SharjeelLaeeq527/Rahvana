// API Route: Export Documents as ZIP
// GET /api/documents/export
// Supports: Export All, Export Single Document (original + compressed)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { E, msg } from '@/lib/errors';
import { DocumentFileManager } from '@/lib/document-vault/storage-server';
import { DocumentDatabaseStorage } from '@/lib/document-vault/storage-database';
import { getCategoryFolderName } from '@/lib/document-vault/file-utils';
import { ALL_DOCUMENTS } from '@/lib/document-vault/document-definitions';
import JSZip from 'jszip';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const structureByCategory = searchParams.get('structureByCategory') === 'true';
    // Metadata is disabled by default now
    const includeMetadata = false;

    // Get all documents
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const documents = await dbStorage.getAllDocuments(user.id);

    if (documents.length === 0) {
      return NextResponse.json(
        { error: msg(E.VAULT_NO_DOCUMENTS_TO_EXPORT) },
        { status: 400 }
      );
    }

    // Create ZIP
    const zip = new JSZip();
    const fileManager = new DocumentFileManager();

    // Create document definitions map for category lookup
    const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));

    // Add files to ZIP
    for (const doc of documents) {
      // Skip if status is not UPLOADED or NEEDS_ATTENTION
      if (doc.status === 'MISSING') continue;

      // Determine folder path based on category
      let categoryFolder = '';
      if (structureByCategory) {
        const docDef = defsMap.get(doc.documentDefId);
        if (docDef) {
          categoryFolder = getCategoryFolderName(docDef.category) + '/';
        }
      }

      // For files with compressed versions, create a subfolder with document name
      // e.g., 01_Civil_Documents/Birth_Certificate/original.pdf and compressed.pdf
      let docFolder = categoryFolder;
      if (doc.hasCompressedVersion && doc.compressedStoragePath) {
        // Create subfolder using document key
        const docDef = defsMap.get(doc.documentDefId);
        const docName = docDef?.key || doc.documentDefId;
        docFolder = categoryFolder + docName.replace(/_/g, ' ') + '/';
      }

      // Read and add original file
      const readResult = await fileManager.readFile(doc.storagePath);
      if (!readResult.success || !readResult.buffer) {
        console.warn(`Failed to read file: ${doc.storagePath}`);
        continue;
      }

      // Add original file to ZIP
      zip.file(docFolder + doc.standardizedFilename, readResult.buffer);

      // Add compressed file if exists
      if (doc.hasCompressedVersion && doc.compressedStoragePath && doc.compressedFilename) {
        const compressedResult = await fileManager.readFile(doc.compressedStoragePath);
        if (compressedResult.success && compressedResult.buffer) {
          zip.file(docFolder + doc.compressedFilename, compressedResult.buffer);
        } else {
          console.warn(`Failed to read compressed file: ${doc.compressedStoragePath}`);
        }
      }
    }

    // Add metadata file if requested
    if (includeMetadata) {
      const metadata = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        totalDocuments: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          documentDefId: doc.documentDefId,
          originalFilename: doc.originalFilename,
          standardizedFilename: doc.standardizedFilename,
          fileSize: doc.fileSize,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedBy,
          version: doc.version,
          expirationDate: doc.expirationDate,
          status: doc.status,
          notes: doc.notes,
        })),
      };

      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `document-vault-export-${timestamp}.zip`;

    // Return ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: msg(E.AUTH_UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}
