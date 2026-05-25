// API Routes: Document Operations
// GET /api/documents/[id] - Get document metadata
// DELETE /api/documents/[id] - Delete document
// PATCH /api/documents/[id] - Update document metadata
// Uses Supabase Storage (works on BOTH local AND Vercel)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { createClient as createClientJs } from "@supabase/supabase-js";

// GET - Get document metadata
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(documentId, user.id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete document (from Supabase Storage)
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
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.getDocument(documentId, user.id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete files from Supabase Storage (using service role)
    const storageSupabase = createClientJs(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filesToDelete = [document.storagePath];
    if (document.hasCompressedVersion && document.compressedStoragePath) {
      filesToDelete.push(document.compressedStoragePath);
    }

    await storageSupabase.storage.from("document-vault").remove(filesToDelete);

    // Delete metadata
    await dbStorage.deleteDocument(documentId, user.id);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
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
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
