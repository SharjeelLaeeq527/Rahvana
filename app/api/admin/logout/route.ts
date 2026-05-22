// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { E, msg } from '@/lib/errors'

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout API error:", error);
    return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}