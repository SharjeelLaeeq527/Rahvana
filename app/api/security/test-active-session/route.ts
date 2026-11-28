import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Verify the authenticated user from the server.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Test the database's active-session function
  // using this request's authenticated JWT.
  const {
    data: isActive,
    error: sessionError,
  } = await supabase.rpc(
    "is_current_app_session_active"
  );

  if (sessionError) {
    console.error(
      "[test-active-session] RPC failed:",
      sessionError.message
    );

    return NextResponse.json(
      { error: "Session check failed" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    activeSession: isActive,
  });
}