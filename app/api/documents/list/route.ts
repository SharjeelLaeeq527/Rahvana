// API Route: List All Documents
// GET /api/documents/list

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";

export async function GET() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all documents
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const documents = await dbStorage.getAllDocuments(user.id);

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
