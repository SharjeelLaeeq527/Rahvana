// app/api/reviews/route.ts
// Public review API:
//   GET  /api/reviews?slug=<tool>  -> { reviews, stats } (approved only)
//   POST /api/reviews              -> submit/edit own review (auth required)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getApprovedReviews,
  getReviewStats,
  isValidReviewSlug,
  submitReview,
} from "@/lib/reviews/data-access";
import type { ToolReviewInput } from "@/types/reviews";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug || !isValidReviewSlug(slug)) {
      return NextResponse.json({ error: "Invalid tool slug" }, { status: 400 });
    }

    const [reviews, stats] = await Promise.all([
      getApprovedReviews(slug),
      getReviewStats(slug),
    ]);

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("[api/reviews] GET error:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to write a review" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Partial<ToolReviewInput> | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { toolSlug, rating, title, body: reviewBody, location } = body;

    if (!toolSlug || !isValidReviewSlug(toolSlug)) {
      return NextResponse.json({ error: "Invalid tool slug" }, { status: 400 });
    }
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be a whole number from 1 to 5" }, { status: 400 });
    }
    if (typeof reviewBody !== "string" || reviewBody.trim().length < 10) {
      return NextResponse.json({ error: "Please write at least 10 characters" }, { status: 400 });
    }
    if (reviewBody.trim().length > 2000) {
      return NextResponse.json({ error: "Review is too long (max 2000 characters)" }, { status: 400 });
    }

    // Resolve a display name: profile full name → user metadata → email prefix.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const reviewerName =
      (profile?.full_name as string | undefined)?.trim() ||
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      (user.email ? user.email.split("@")[0] : "Rahvana user");

    const saved = await submitReview(user.id, reviewerName, {
      toolSlug,
      rating,
      title: typeof title === "string" ? title : undefined,
      body: reviewBody,
      location: typeof location === "string" ? location : undefined,
    });

    return NextResponse.json(
      { review: saved, message: "Thanks! Your review was submitted and is pending approval." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/reviews] POST error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
