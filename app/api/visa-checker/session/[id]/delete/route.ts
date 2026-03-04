import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;

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