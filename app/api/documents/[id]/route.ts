// API Routes: Document Operations
// GET /api/documents/[id] - Get document metadata
// DELETE /api/documents/[id] - Delete document
// PATCH /api/documents/[id] - Update document metadata
// Uses Supabase Storage (works on BOTH local AND Vercel)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { createClient as createClientJs } from "@supabase/supabase-js";
import { E, msg } from "@/lib/errors";
// GET - Get document metadata
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { id } = await params;
    const documentId = id;
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(documentId, user.id);

    if (!document) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete document (from Supabase Storage)
//
// Query param `scope` (IR-5+ multi-candidate, safe for shared physical files):
//   "candidate" (default) - remove ONLY this row (this candidate's copy). The physical
//                           blob is removed only if no other row references its storage_path.
//   "all"                 - remove every row in THIS journey that shares this storage_path
//                           (all candidates' copies), then remove the blob if nothing else
//                           (e.g. a cross-journey share) still references it.
//
// The storage_path reference count also fixes the pre-existing cross-journey orphan bug:
// a plain single delete no longer removes a blob that another row still points at.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const documentId = id;
    const scope = new URL(request.url).searchParams.get("scope") === "all" ? "all" : "candidate";

    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(documentId, user.id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // All rows (any journey / candidate) that reference the same physical blob.
    const sharingRows = await dbStorage.getDocumentsByStoragePath(document.storagePath, user.id);

    // Which metadata rows to delete for this request.
    let rowsToDelete = [document];
    if (scope === "all") {
      rowsToDelete = sharingRows.filter((d) => d.journeyId === document.journeyId);
      // Always include the targeted row (covers journeyId === null grouping).
      if (!rowsToDelete.some((d) => d.id === document.id)) rowsToDelete.push(document);
    }

    const deleteIds = new Set(rowsToDelete.map((d) => d.id));

    // Delete the metadata rows.
    for (const row of rowsToDelete) {
      await dbStorage.deleteDocument(row.id, user.id);
    }

    // Remove the physical blob(s) ONLY when no surviving row references the storage_path.
    const survivorsReferenceBlob = sharingRows.some((d) => !deleteIds.has(d.id));
    if (!survivorsReferenceBlob) {
      const storageSupabase = createClientJs(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const filesToDelete = [document.storagePath];
      if (document.hasCompressedVersion && document.compressedStoragePath) {
        filesToDelete.push(document.compressedStoragePath);
      }

      await storageSupabase.storage.from("document-vault").remove(filesToDelete);
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      deletedCount: rowsToDelete.length,
      fileRemoved: !survivorsReferenceBlob,
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update document metadata
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const documentId = id;
    const body = await request.json();
    const { expirationDate, notes, status } = body;

    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(documentId, user.id);

    if (!document) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    // Update document
    const updates: Record<string, unknown> = {};
    if (expirationDate !== undefined) {
      updates.expirationDate = expirationDate ? new Date(expirationDate) : undefined;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }
    if (status !== undefined) {
      updates.status = status;
    }

    const updatedDocument = await dbStorage.updateDocument(documentId, user.id, updates);

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: "Document updated successfully",
    });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
