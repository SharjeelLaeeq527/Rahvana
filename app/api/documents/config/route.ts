// API Route: Vault Configuration
// GET /api/documents/config - Get vault configuration
// POST /api/documents/config - Save vault configuration

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { DocumentVaultConfig } from "@/lib/document-vault/types";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journeyId") || undefined;

    // Get vault configuration
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const config = await dbStorage.getVaultConfig(user.id, journeyId);

    if (!config) {
      return NextResponse.json({ success: true, config: null });
    }

    return NextResponse.json({
      success: true,
      config,
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
    const config: DocumentVaultConfig = {
      userId: user.id,
      visaCategory: body.visaCategory,
      scenarioFlags: body.scenarioFlags || {},
      caseId: body.caseId,
      petitionerName: body.petitionerName,
      beneficiaryName: body.beneficiaryName,
      jointSponsorName: body.jointSponsorName,
      dynamicDocuments: body.dynamicDocuments || {},
      journeyId: body.journeyId,
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
