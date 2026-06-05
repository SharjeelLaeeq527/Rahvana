// Shared types for the tool-review feature (/resources/[slug] reviews).

export type ToolReviewStatus = "pending" | "approved" | "rejected";

/** A persisted review row (as returned to clients — no internal-only fields). */
export interface ToolReview {
  id: string;
  toolSlug: string;
  rating: number; // 1..5
  title: string | null;
  body: string;
  reviewerName: string;
  location: string | null;
  verifiedPurchase: boolean;
  status: ToolReviewStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted from the submission form. */
export interface ToolReviewInput {
  toolSlug: string;
  rating: number;
  title?: string;
  body: string;
  location?: string;
}

/** Aggregate stats used by the rating summary + distribution bars. */
export interface ToolReviewStats {
  average: number;
  count: number;
  /** [count of 5★, 4★, 3★, 2★, 1★] */
  distribution: [number, number, number, number, number];
}

/** Admin moderation row — includes user_id + email for context. */
export interface AdminToolReview extends ToolReview {
  userId: string;
  email: string | null;
}
