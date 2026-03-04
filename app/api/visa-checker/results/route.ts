// GET /api/visa-checker/results
import { NextRequest, NextResponse } from "next/server";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function GET(request: NextRequest) {
  try {
    const response = await VisaCheckerSupabaseService.getUserRequests();
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch user requests" },
      { status: 500 }
    );
  }
}