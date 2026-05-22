import { NextRequest, NextResponse } from "next/server";
import { caseDataService } from "@/lib/journey/service";

// POST /api/case_data/validate - Validate case data inputs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.journey_id) {
      return NextResponse.json(
        { success: false, error: "journey_id is required" },
        { status: 400 }
      );
    }

    const validationResults = await caseDataService.validateAllCaseData(body.journey_id);

    return NextResponse.json({ success: true, data: validationResults }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/case-data/validate:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
