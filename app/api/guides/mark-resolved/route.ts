// app/api/admin/guides/mark-resolved/route.ts
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

export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(request);

    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { feedbackId } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 },
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    );

    // Check if feedback exists
    const { data: existingFeedback, error: fetchError } = await supabase
      .from("guide_feedback")
      .select("id, status")
      .eq("id", feedbackId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching feedback:", fetchError);
      return NextResponse.json(
        { error: "Failed to verify feedback" },
        { status: 500 },
      );
    }

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 },
      );
    }

    if (existingFeedback.status === "resolved") {
      return NextResponse.json(
        { message: "Feedback already resolved" },
        { status: 200 },
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from("guide_feedback")
      .update({
        status: "resolved",
      })
      .eq("id", feedbackId);

    if (updateError) {
      console.error("Error updating feedback:", updateError);
      return NextResponse.json(
        { error: "Failed to update feedback status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Feedback marked as resolved successfully",
      feedbackId,
      status: "resolved",
    });
  } catch (error) {
    console.error("Resolve feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}