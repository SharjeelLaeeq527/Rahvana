import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    const response =
      await VisaCheckerSupabaseService.deleteSession(sessionId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting session:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete session",
      },
      { status: 500 }
    );
  }
}