import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { factorId, challengeId, code } = await request.json();

    if (!factorId || !challengeId || !code) {
      return NextResponse.json(
        { error: "Missing factorId, challengeId, or code" },
        { status: 400 }
      );
    }

    // Verify the MFA code
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error("MFA verification error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get updated session after MFA verification
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session retrieval error:", sessionError);
      return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: sessionData.session?.user,
      session: sessionData.session,
    });
  } catch (error) {
    console.error("MFA verify login error:", error);
    return NextResponse.json({ error: "Failed to verify MFA code" }, { status: 500 });
  }
}
