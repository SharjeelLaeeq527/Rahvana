// API Route: List All Documents
// GET /api/documents/list

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { resolveActiveJourneyId } from "@/lib/case-collaboration/helpers";
import { E, msg } from "@/lib/errors";

export async function GET() {
  try {
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

    // Scope to the SHARED case so both spouses see each other's uploads. Falls
    // back to the user's own docs only when they have no journey yet.
    const journeyId = await resolveActiveJourneyId(supabase, user.id);

    // Get all documents for the case
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const documents = await dbStorage.getAllDocuments(user.id, journeyId);

    return NextResponse.json({
      success: true,
      documents,
      journeyId, // lets the client subscribe to the shared case's realtime feed
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    console.error("List documents error:", error);
    return NextResponse.json({ error: msg(E.VAULT_SYNC_FAILED) }, { status: 500 });
  }
}
