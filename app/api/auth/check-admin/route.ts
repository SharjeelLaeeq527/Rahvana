// app/api/auth/check-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Specific admin emails — only these have admin access
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

// ─────────────────────────────────────────────────────────────────────────────
// WHY NO IN-MEMORY CACHE:
// Next.js runs on serverless functions (Vercel / AWS Lambda). Each request may
// hit a different cold instance where the Map is empty, making caching useless.
// The correct approach is to make this query so cheap it doesn't need caching:
//   • profiles table should have an index on `id` (Supabase adds this by default
//     as it's the primary key), so this query is a single PK lookup — ~1ms.
//   • If you need edge caching later, use Next.js `revalidate` or a Redis layer.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const { userId } = await request.json().catch(() => ({ userId: null }));

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[check-admin] Missing Supabase env vars");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Service role client — bypasses RLS for this admin check
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Single PK lookup — fast, no caching needed
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("email, role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      // Profile missing or DB error — deny access silently
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // Both conditions must be true: email whitelisted AND role set to admin in DB
    const isAdmin = ADMIN_EMAILS.includes(profile.email) && profile.role === "admin";

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("[check-admin] Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
