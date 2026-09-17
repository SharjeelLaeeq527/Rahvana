// API Route: List All Documents
// GET /api/documents/list
// Optional query params:
//   journeyId   - scope to a journey (existing behavior)
//   candidateId - scope to a candidate (IR-5+ multi-candidate). When present, only that
//                 candidate's documents are returned, each annotated with whether its
//                 physical file is shared with other candidates in the same journey.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { UploadedDocument } from "@/lib/document-vault/types";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journeyId") || undefined;
    const candidateId = searchParams.get("candidateId") || undefined;

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

    const dbStorage = new DocumentDatabaseStorage(supabase);

    // Without a journey we cannot reason about candidate sharing; keep legacy behavior.
    if (!journeyId) {
      const documents = await dbStorage.getAllDocuments(user.id);
      return NextResponse.json({ success: true, documents });
    }

    // Fetch ALL of this journey's documents (not candidate-filtered) so we can detect
    // shared physical files (rows that reuse the same storage_path under other candidates).
    const journeyDocs = await dbStorage.getAllDocuments(user.id, journeyId);

    // Map candidate id -> label from the roster for friendly "shared with" text, and note
    // the first candidate so legacy (candidate_id null) documents stay visible under it.
    const labelById: Record<string, string> = {};
    let firstCandidateId: string | undefined;
    try {
      const config = await dbStorage.getVaultConfig(user.id, journeyId);
      const roster = config?.candidates || [];
      firstCandidateId = roster[0]?.id;
      for (const c of roster) labelById[c.id] = c.label;
    } catch (cfgErr) {
      console.error("documents/list failed to load vault config for labels:", cfgErr);
    }

    // Group candidate ids by storage_path to compute per-document sharing.
    const candidatesByPath = new Map<string, Set<string>>();
    for (const d of journeyDocs) {
      if (!d.candidateId) continue; // legacy / single-candidate rows are never "shared"
      const set = candidatesByPath.get(d.storagePath) ?? new Set<string>();
      set.add(d.candidateId);
      candidatesByPath.set(d.storagePath, set);
    }

    const annotate = (d: UploadedDocument): UploadedDocument => {
      const others = new Set(candidatesByPath.get(d.storagePath) ?? []);
      if (d.candidateId) others.delete(d.candidateId);
      const otherIds = Array.from(others);
      return {
        ...d,
        isShared: otherIds.length > 0,
        sharedCandidateLabels: otherIds.map((id) => labelById[id] || id),
      };
    };

    // Legacy rows (candidate_id null) belong to the first candidate so they never vanish
    // when a single-candidate journey gains a second candidate.
    const scoped = candidateId
      ? journeyDocs.filter(
          (d) =>
            d.candidateId === candidateId ||
            (!d.candidateId && candidateId === firstCandidateId)
        )
      : journeyDocs;

    return NextResponse.json({
      success: true,
      documents: scoped.map(annotate),
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
