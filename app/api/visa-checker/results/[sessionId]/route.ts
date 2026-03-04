// app/api/visa-checker/results/[sessionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    const response =
      await VisaCheckerSupabaseService.getScoringResults(sessionId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching scoring results:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch scoring results",
      },
      { status: 500 }
    );
  }
}