// GET /api/visa-checker/session/[id]
import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;
    const response = await VisaCheckerSupabaseService.getSessionDetails(sessionId);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching session details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch session details" },
      { status: 500 }
    );
  }
}