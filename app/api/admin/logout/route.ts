// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create regular Supabase client for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(_request: NextRequest) {
  try {
    // Sign out from Supabase using regular client
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Admin logout error:", error);
      return NextResponse.json(
        { error: "Failed to sign out", message: "An error occurred during logout" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin logout successful",
    });
  } catch (error) {
    console.error("Admin logout API error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
