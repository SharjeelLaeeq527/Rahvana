// API Route: Vault Configuration
// GET /api/documents/config - Get vault configuration
// POST /api/documents/config - Save vault configuration

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { resolveActiveJourneyId } from "@/lib/case-collaboration/helpers";
import { DocumentVaultConfig } from "@/lib/document-vault/types";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the SHARED case checklist config (both spouses see the same one).
    const journeyId = await resolveActiveJourneyId(supabase, user.id);
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const config = await dbStorage.getVaultConfig(user.id, journeyId);

    if (!config) {
      return NextResponse.json({ success: true, config: null, journeyId });
    }

    return NextResponse.json({
      success: true,
      config,
      journeyId, // lets the client subscribe to the shared case's realtime feed
    });
  } catch (error) {
    console.error("Get config error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    // Scope to the shared case so a checklist edit by either spouse writes the
    // single per-journey config row.
    const journeyId = await resolveActiveJourneyId(supabase, user.id);
    const config: DocumentVaultConfig = {
      userId: user.id,
      journeyId: journeyId ?? undefined,
      visaCategory: body.visaCategory,
      scenarioFlags: body.scenarioFlags || {},
      caseId: body.caseId,
      petitionerName: body.petitionerName,
      beneficiaryName: body.beneficiaryName,
      jointSponsorName: body.jointSponsorName,
      dynamicDocuments: body.dynamicDocuments || {},
    };

    // Validate required fields
    if (!config.visaCategory) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[visaCategory]" }) },
        { status: 400 }
      );
    }

    // Save configuration
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const savedConfig = await dbStorage.saveVaultConfig(config);

    return NextResponse.json({
      success: true,
      config: savedConfig,
      message: "Configuration saved successfully",
    });
  } catch (error) {
    console.error("Save config error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
