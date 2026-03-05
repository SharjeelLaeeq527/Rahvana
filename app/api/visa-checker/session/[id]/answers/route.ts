import { NextRequest, NextResponse } from "next/server";
import { SaveAnswersRequest } from "@/lib/visa-checker/types";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;

    const reqBody: SaveAnswersRequest = await request.json();

    const response = await VisaCheckerSupabaseService.saveAnswers(
      sessionId,
      reqBody.answers
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving answers:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save answers",
      },
      { status: 500 }
    );
  }
}