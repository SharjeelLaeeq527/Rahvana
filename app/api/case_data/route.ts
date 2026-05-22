import { NextRequest, NextResponse } from "next/server";
import { caseDataService } from "@/lib/journey/service";
import { encrypt, decrypt } from "@/lib/encryption";
import { E, msg } from '@/lib/errors';

// POST /api/case_data - Create or update case data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.journey_id) {
      return NextResponse.json(
        { success: false, code: E.CASE_DATA_JOURNEY_ID_REQUIRED, message: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: 'journey_id' }) },
        { status: 400 },
      );
    }

    // Batch operation
    if (body.batch && body.operations) {
      if (!Array.isArray(body.operations) || body.operations.length === 0) {
        return NextResponse.json(
          { success: false, code: E.CASE_DATA_OPERATIONS_INVALID, message: msg(E.CASE_DATA_OPERATIONS_INVALID, { fields: 'operations' }) },
          { status: 400 },
        );
      }

      const results = await caseDataService.batchSetCaseData(
        body.journey_id,
        body.operations.reduce((acc: Record<string, any>, op: any) => {
          if (op.operation === "set" || op.operation === "update") {
            const sensitiveKeys = ["nvcCaseNum", "nvcInvoice", "passportNumber", "surname"];
            let value = op.data_value;
            
            // Encrypt sensitive keys if not already encrypted
            if (sensitiveKeys.includes(op.data_key) && value && typeof value === 'string' && !value.startsWith('gcm:')) {
              value = encrypt(value);
            }
            
            acc[op.data_key] = value;
          }
          return acc;
        }, {}),
      );

      return NextResponse.json(
        { success: true, data: results },
        { status: 201 },
      );
    }

    // Single operation
    if (!body.data_key || body.data_value === undefined) {
      return NextResponse.json(
        { success: false, code: E.CASE_DATA_DATAKEY_REQUIRED, message: msg(E.CASE_DATA_DATAKEY_REQUIRED, { fields: 'data_key, data_value' }) },
        { status: 400 },
      );
    }

    const sensitiveKeys = ["nvcCaseNum", "nvcInvoice", "passportNumber", "surname"];
    let finalValue = body.data_value;
    if (sensitiveKeys.includes(body.data_key) && finalValue && typeof finalValue === 'string' && !finalValue.startsWith('gcm:')) {
      finalValue = encrypt(finalValue);
    }

    const result = await caseDataService.setCaseData(
      body.journey_id,
      body.data_key,
      finalValue,
      {
        is_verified: body.is_verified,
        source: body.source,
        source_reference: body.source_reference,
      },
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/case-data:", error);
    return NextResponse.json(
      {
        success: false,
        code: E.CASE_DATA_SAVE_FAILED,
        message: msg(E.CASE_DATA_SAVE_FAILED),
      },
      { status: 500 },
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
        { status: 400 },
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
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    };

    const caseProfile = await caseDataService.getCaseProfile(journeyId);

    // Decrypt sensitive fields in the response
    if (caseProfile.all_data) {
      Object.keys(caseProfile.all_data).forEach((key) => {
        const item = caseProfile.all_data[key];
        if (item && typeof item.data_value === 'string' && item.data_value.startsWith('gcm:')) {
          item.data_value = decrypt(item.data_value);
        }
      });
    }

    return NextResponse.json(
      { success: true, data: caseProfile },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/case-data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
