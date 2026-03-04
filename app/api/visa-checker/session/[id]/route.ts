import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;

    const response =
      await VisaCheckerSupabaseService.getSessionDetails(sessionId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching session details:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch session details",
      },
      { status: 500 }
    );
  }
}