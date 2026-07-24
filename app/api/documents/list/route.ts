// API Route: List All Documents
// GET /api/documents/list

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journeyId") || undefined;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("documents/list unauthorized:", authError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Get all documents
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const documents = await dbStorage.getAllDocuments(user.id, journeyId);

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    console.error("List documents error:", error);
    return NextResponse.json({ error: msg(E.VAULT_SYNC_FAILED) }, { status: 500 });
  }
}
