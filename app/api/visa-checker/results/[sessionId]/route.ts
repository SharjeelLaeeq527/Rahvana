// GET /api/visa-checker/results/[sessionId]
import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const response = await VisaCheckerSupabaseService.getScoringResults(sessionId);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching scoring results:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch scoring results" },
      { status: 500 }
    );
  }
}