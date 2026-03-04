// POST /api/visa-checker/session
import { NextRequest, NextResponse } from "next/server";
import { CreateSessionRequest } from "@/lib/visa-checker/types";
import { VisaCheckerSupabaseService } from "@/lib/visa-checker/supabase";

export async function POST(request: NextRequest) {
  try {
    const reqBody: CreateSessionRequest = await request.json();
    const response = await VisaCheckerSupabaseService.createSession(reqBody);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || "Failed to create session" },
      { status: 500 }
    );
  }
}