import { NextRequest, NextResponse } from "next/server";
import { caseDataService } from "@/lib/journey/service";
import { E, msg } from "@/lib/errors";

// POST /api/case_data/validate - Validate case data inputs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.journey_id) {
      return NextResponse.json(
        {
          success: false,
          code: E.CASE_DATA_JOURNEY_ID_REQUIRED,
          message: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "journey_id" }),
        },
        { status: 400 }
      );
    }

    const validationResults = await caseDataService.validateAllCaseData(body.journey_id);

    return NextResponse.json({ success: true, data: validationResults }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/case-data/validate:", error);
    return NextResponse.json(
      { success: false, code: E.CASE_DATA_SAVE_FAILED, message: msg(E.CASE_DATA_SAVE_FAILED) },
      { status: 500 }
    );
  }
}
