// POST /api/visa-checker/session/[id]/submit
import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;
    const response = await VisaCheckerSupabaseService.submitForScoring(sessionId);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error submitting session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || "Failed to submit session" },
      { status: 500 }
    );
  }
}