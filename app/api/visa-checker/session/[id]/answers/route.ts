// POST /api/visa-checker/session/[id]/answers
import { NextRequest, NextResponse } from "next/server";
import { SaveAnswersRequest } from "@/lib/visa-checker/types";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;
    const reqBody: SaveAnswersRequest = await request.json();
    const response = await VisaCheckerSupabaseService.saveAnswers(sessionId, reqBody.answers);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error saving answers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || "Failed to save answers" },
      { status: 500 }
    );
  }
}