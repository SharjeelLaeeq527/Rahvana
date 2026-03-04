import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;

    const response =
      await VisaCheckerSupabaseService.submitForScoring(sessionId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting session:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit session",
      },
      { status: 500 }
    );
  }
}