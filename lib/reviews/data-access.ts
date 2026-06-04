// Server-side data access for tool reviews.
// All writes go through the service-role client so server-controlled fields
// (status, verified_purchase) can never be spoofed by the client. RLS still
// protects the public/authed read paths used elsewhere.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { RESOURCE_SLUGS } from "@/app/(main)/pricing/data/resourceDetails";
import type {
  AdminToolReview,
  ToolReview,
  ToolReviewInput,
  ToolReviewStats,
  ToolReviewStatus,
} from "@/types/reviews";

const TABLE = "tool_reviews";

export function isValidReviewSlug(slug: string): boolean {
  return RESOURCE_SLUGS.includes(slug);
}

type Row = {
  id: string;
  tool_slug: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  reviewer_name: string;
  location: string | null;
  verified_purchase: boolean;
  status: ToolReviewStatus;
  created_at: string;
  updated_at: string;
};

function rowToReview(row: Row): ToolReview {
  return {
    id: row.id,
    toolSlug: row.tool_slug,
    rating: row.rating,
    title: row.title,
    body: row.body,
    reviewerName: row.reviewer_name,
    location: row.location,
    verifiedPurchase: row.verified_purchase,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Public read: approved reviews for a tool, newest first. */
export async function getApprovedReviews(slug: string): Promise<ToolReview[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("tool_slug", slug)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reviews] getApprovedReviews error:", error.message);
    return [];
  }
  return (data as Row[]).map(rowToReview);
}

/** Aggregate stats (average, count, 5→1 distribution) over approved reviews. */
export async function getReviewStats(slug: string): Promise<ToolReviewStats> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("rating")
    .eq("tool_slug", slug)
    .eq("status", "approved");

  const empty: ToolReviewStats = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
  if (error || !data || data.length === 0) {
    if (error) console.error("[reviews] getReviewStats error:", error.message);
    return empty;
  }

  const ratings = (data as { rating: number }[]).map((r) => r.rating);
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of ratings) {
    sum += r;
    const idx = 5 - r; // 5★ -> 0, 1★ -> 4
    if (idx >= 0 && idx < 5) distribution[idx] += 1;
  }
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
    distribution,
  };
}

/** The current user's own review for a tool (any status), or null. */
export async function getMyReview(userId: string, slug: string): Promise<ToolReview | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("tool_slug", slug)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[reviews] getMyReview error:", error.message);
    return null;
  }
  return data ? rowToReview(data as Row) : null;
}

/**
 * Best-effort "verified purchase" detection. We currently have no single
 * per-add-on purchase table, so we treat a recorded feature-usage row for the
 * tool as the signal. Returns false when there is no signal — never a false
 * positive. Refine the slug→feature_key map as purchase records mature.
 */
async function detectVerifiedPurchase(userId: string, slug: string): Promise<boolean> {
  const featureKey = SLUG_TO_FEATURE_KEY[slug] ?? slug;
  const { data, error } = await supabaseAdmin
    .from("feature_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error) {
    // feature_usage may not track every tool — fail closed (no badge).
    return false;
  }
  return !!data && (data as { usage_count: number }).usage_count > 0;
}

// Map resource slugs to feature_usage keys where they differ. Unmapped slugs
// fall back to the slug itself. Extend as real feature keys are confirmed.
const SLUG_TO_FEATURE_KEY: Record<string, string> = {
  // e.g. "case-strength": "case_strength_analyzer",
};

/**
 * Create or update the user's review for a tool. Always upserts on
 * (user_id, tool_slug), and resets status to 'pending' on every write so edits
 * are re-moderated. status + verified_purchase are set here, never by the client.
 */
export async function submitReview(
  userId: string,
  reviewerName: string,
  input: ToolReviewInput
): Promise<ToolReview> {
  const verified = await detectVerifiedPurchase(userId, input.toolSlug);

  const payload = {
    tool_slug: input.toolSlug,
    user_id: userId,
    rating: input.rating,
    title: input.title?.trim() || null,
    body: input.body.trim(),
    reviewer_name: reviewerName,
    location: input.location?.trim() || null,
    verified_purchase: verified,
    status: "pending" as ToolReviewStatus,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id,tool_slug" })
    .select("*")
    .single();

  if (error) {
    console.error("[reviews] submitReview error:", error.message);
    throw new Error("Failed to save review");
  }
  return rowToReview(data as Row);
}

// ── Admin moderation ────────────────────────────────────────────────────────

/** All reviews for the moderation queue, optionally filtered by status. */
export async function getAdminReviews(status?: ToolReviewStatus): Promise<AdminToolReview[]> {
  let query = supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("[reviews] getAdminReviews error:", error.message);
    return [];
  }

  const rows = data as Row[];
  // Attach author emails for admin context.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const emailById = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of (profiles as { id: string; email: string | null }[]) ?? []) {
      emailById.set(p.id, p.email);
    }
  }

  return rows.map((row) => ({
    ...rowToReview(row),
    userId: row.user_id,
    email: emailById.get(row.user_id) ?? null,
  }));
}

/** Approve or reject a review. */
export async function setReviewStatus(id: string, status: ToolReviewStatus): Promise<void> {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[reviews] setReviewStatus error:", error.message);
    throw new Error("Failed to update review status");
  }
}

/** Permanently delete a review. */
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error("[reviews] deleteReview error:", error.message);
    throw new Error("Failed to delete review");
  }
}
