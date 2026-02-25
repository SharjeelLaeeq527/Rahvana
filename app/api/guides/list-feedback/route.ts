// app/api/guides/list-feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Specific admin emails - ONLY these emails can access admin panel
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

async function checkAdminRole(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return { isAdmin: false, error: "Authentication required" };
  if (!user.email || !ADMIN_EMAILS.includes(user.email))
    return { isAdmin: false, error: "Admin access required" };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { isAdmin: false, error: "Profile verification failed" };
  }

  if (!profile || profile.role !== "admin")
    return { isAdmin: false, error: "Admin role required" };

  return { isAdmin: true, error: null };
}

export async function GET(request: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(request);
    if (!isAdmin)
      return NextResponse.json(
        { error: authError || "Admin access required" },
        { status: 403 },
      );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    );

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("guide_feedback")
      .select(
        `
        id,
        feedback_type,
        description,
        step_key,
        status,
        created_at,
        guides(title),
        profiles:user_id (email, full_name)
      `,
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      page,
      limit,
      data,
    });
  } catch (error) {
    console.error("Admin feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
