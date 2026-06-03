// app/api/admin/reviews/route.ts
// Admin moderation for tool reviews:
//   GET    /api/admin/reviews?status=pending  -> list reviews (optional filter)
//   PATCH  /api/admin/reviews                 -> { id, action: 'approve'|'reject' }
//   DELETE /api/admin/reviews?id=<id>         -> permanently remove a review

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  deleteReview,
  getAdminReviews,
  setReviewStatus,
} from "@/lib/reviews/data-access";
import type { ToolReviewStatus } from "@/types/reviews";

export const dynamic = "force-dynamic";

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
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { isAdmin: false, error: "Authentication required" };
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return { isAdmin: false, error: "Admin access required" };
  }

  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { isAdmin: false, error: "Profile verification failed" };
  if (!profile || profile.role !== "admin") {
    return { isAdmin: false, error: "Admin role required" };
  }
  return { isAdmin: true, error: null };
}

export async function GET(request: NextRequest) {
  const { isAdmin, error } = await checkAdminRole(request);
  if (!isAdmin) return NextResponse.json({ error }, { status: 403 });

  try {
    const statusParam = new URL(request.url).searchParams.get("status");
    const status =
      statusParam && ["pending", "approved", "rejected"].includes(statusParam)
        ? (statusParam as ToolReviewStatus)
        : undefined;

    const reviews = await getAdminReviews(status);
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[api/admin/reviews] GET error:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await checkAdminRole(request);
  if (!isAdmin) return NextResponse.json({ error }, { status: 403 });

  try {
    const { id, action } = (await request.json().catch(() => ({}))) as {
      id?: string;
      action?: "approve" | "reject";
    };

    if (!id) return NextResponse.json({ error: "Review id is required" }, { status: 400 });
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await setReviewStatus(id, action === "approve" ? "approved" : "rejected");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/reviews] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await checkAdminRole(request);
  if (!isAdmin) return NextResponse.json({ error }, { status: 403 });

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Review id is required" }, { status: 400 });

    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/reviews] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
