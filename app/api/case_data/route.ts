import { NextRequest, NextResponse } from "next/server";
import { caseDataService } from "@/lib/journey/service";
import { encrypt, decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";
import { syncCaseDataToProfile } from "@/lib/autoFill/journeyProfileBridge";
import type { MasterProfile } from "@/types/profile";

// SECURE SERVER-SIDE BRIDGE: Mirrors roadmap case_data changes back to standard user_profile fields
async function syncJourneyMetadataToUserProfile(
  userId: string,
  updatedMetadata: Record<string, any>,
  journeyId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Fetch current profile
    const { data: profileRow, error: fetchError } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[case_data API] Failed to fetch user profile for sync:", fetchError);
      return;
    }

    const currentProfile = (profileRow?.profile_details || {}) as Record<string, any>;

    // 2. Map the new journey metadata changes to profile paths
    const profileDelta = syncCaseDataToProfile(updatedMetadata, currentProfile as MasterProfile, journeyId);

    if (Object.keys(profileDelta).length === 0) {
      return; // Nothing mapped
    }

    // 3. Simple deep merge helper
    const deepMerge = (target: any, source: any) => {
      for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], value);
        } else {
          target[key] = value;
        }
      }
      return target;
    };

    const newProfileDetails = deepMerge({ ...currentProfile }, profileDelta);

    // 3b. No-op guard: if the merge produced nothing new, skip the write.
    // profile_details is a JSONB column, so an upsert rewrites the WHOLE row
    // (+ WAL). This sync fires on every case_data save; without this guard we
    // rewrote the entire profile even when the values were identical to what
    // was already there -- a needless Supabase Disk IO cost.
    if (JSON.stringify(newProfileDetails) === JSON.stringify(currentProfile)) {
      return;
    }

    // 4. Save synced profile details back to database
    const { error: upsertError } = await supabase.from("user_profiles").upsert(
      {
        id: userId,
        profile_details: newProfileDetails,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("[case_data API] Failed to save synced profile details:", upsertError);
    } else {
      console.log("[case_data API] Synced journey metadata to user_profile:", profileDelta);
    }
  } catch (err) {
    console.error("[case_data API] Unexpected error in user profile sync:", err);
  }
}
import { E, msg } from "@/lib/errors";

// POST /api/case_data - Create or update case data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.journey_id) {
      return NextResponse.json(
        { success: false, message: "Journey_id is required" },
        { status: 400 }
      );
    }

    // Batch operation
    if (body.batch && body.operations) {
      if (!Array.isArray(body.operations) || body.operations.length === 0) {
        return NextResponse.json(
          { success: false, error: "operations must be a non-empty array" },
          { status: 400 }
        );
      }

      const results = await caseDataService.batchSetCaseData(
        body.journey_id,
        body.operations.reduce((acc: Record<string, any>, op: any) => {
          if (op.operation === "set" || op.operation === "update") {
            const sensitiveKeys = ["nvcCaseNum", "nvcInvoice", "passportNumber", "surname"];
            let value = op.data_value;

            // Encrypt sensitive keys if not already encrypted
            if (
              sensitiveKeys.includes(op.data_key) &&
              value &&
              typeof value === "string" &&
              !value.startsWith("gcm:")
            ) {
              value = encrypt(value);
            }

            acc[op.data_key] = value;
          }
          return acc;
        }, {})
      );

      // Sync to UserProfile if authenticated
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const metadataBatch: Record<string, any> = {};
        body.operations.forEach((op: any) => {
          if (op.operation === "set" || op.operation === "update") {
            metadataBatch[op.data_key] = op.data_value;
          }
        });
        syncJourneyMetadataToUserProfile(user.id, metadataBatch, body.journey_id);
      }

      return NextResponse.json({ success: true, data: results }, { status: 201 });
    }

    // Single operation
    if (!body.data_key || body.data_value === undefined) {
      return NextResponse.json(
        { success: false, error: "data_key and data_value are required" },
        { status: 400 }
      );
    }

    const sensitiveKeys = ["nvcCaseNum", "nvcInvoice", "passportNumber", "surname"];
    let finalValue = body.data_value;
    if (
      sensitiveKeys.includes(body.data_key) &&
      finalValue &&
      typeof finalValue === "string" &&
      !finalValue.startsWith("gcm:")
    ) {
      finalValue = encrypt(finalValue);
    }

    const result = await caseDataService.setCaseData(body.journey_id, body.data_key, finalValue, {
      is_verified: body.is_verified,
      source: body.source,
      source_reference: body.source_reference,
    });

    // Sync to UserProfile if authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      syncJourneyMetadataToUserProfile(user.id, { [body.data_key]: body.data_value }, body.journey_id);
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/case-data:", error);
    return NextResponse.json(
      {
        success: false,
        code: E.CASE_DATA_SAVE_FAILED,
        message: msg(E.CASE_DATA_SAVE_FAILED),
      },
      { status: 500 }
    );
  }
}

// GET /api/case_data?journeyId=xxx - Get all case data for a journey
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const journeyId = searchParams.get("journey_id");

    if (!journeyId) {
      return NextResponse.json(
        { success: false, error: "journey_id query parameter is required" },
        { status: 400 }
      );
    }

    const filters = {
      source: searchParams.get("source") || undefined,
      is_validated: searchParams.get("is_validated")
        ? searchParams.get("is_validated") === "true"
        : undefined,
      is_verified: searchParams.get("is_verified")
        ? searchParams.get("is_verified") === "true"
        : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    };

    const caseProfile = await caseDataService.getCaseProfile(journeyId);

    // Decrypt sensitive fields in the response
    if (caseProfile.all_data) {
      Object.keys(caseProfile.all_data).forEach((key) => {
        const item = caseProfile.all_data[key];
        if (item && typeof item.data_value === "string" && item.data_value.startsWith("gcm:")) {
          item.data_value = decrypt(item.data_value);
        }
      });
    }

    return NextResponse.json({ success: true, data: caseProfile }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/case-data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
