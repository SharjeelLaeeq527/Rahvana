import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";
import { E, msg } from "@/lib/errors";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await context.params;

    const response = await VisaCheckerSupabaseService.submitForScoring(sessionId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting session:", error);

    return NextResponse.json(
      {
        error: msg(E.TOOL_VISA_SUBMIT_FAILED),
      },
      { status: 500 }
    );
  }
}
