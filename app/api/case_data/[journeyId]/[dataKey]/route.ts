import { NextRequest, NextResponse } from "next/server";
import { caseDataService } from "@/lib/journey/service";
import * as db from "@/lib/journey/data-access";
import type { CaseDataUpdate } from "@/lib/journey/types";

// GET /api/case_data/[journeyId]/[dataKey] - Retrieve single case data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; dataKey: string }> },
) {
  try {
    const { journeyId, dataKey } = await params;

    const result = await caseDataService.getCaseData(journeyId, dataKey);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(`Error in GET /api/case-data/[journeyId]/[dataKey]:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 500,
      },
    );
  }
}

// PATCH /api/case_data/[journeyId]/[dataKey] - Update single case data
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; dataKey: string }> },
) {
  try {
    const { journeyId, dataKey } = await params;
    const updates: CaseDataUpdate = await request.json();

    const result = await db.updateCaseDataDB(journeyId, dataKey, updates);

    return NextResponse.json(
      { success: true, data: { ...result, is_editable: true } },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `Error in PATCH /api/case-data/[journeyId]/[dataKey]:`,
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 500,
      },
    );
  }
}

// DELETE /api/case_data/[journeyId]/[dataKey] - Delete single case data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; dataKey: string }> },
) {
  try {
    const { journeyId, dataKey } = await params;

    await caseDataService.deleteCaseData(journeyId, dataKey);

    return NextResponse.json(
      {
        success: true,
        data: {
          deleted_key: dataKey,
          message: "Case data deleted successfully",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `Error in DELETE /api/case-data/[journeyId]/[dataKey]:`,
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 500,
      },
    );
  }
}
