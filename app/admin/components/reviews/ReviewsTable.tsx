"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2, RefreshCw, BadgeCheck, MessageSquareText } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { useToast } from "@/app/components/shared/ToastProvider";
import type { AdminToolReview, ToolReviewStatus } from "@/types/reviews";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

type Filter = "pending" | "approved" | "rejected" | "all";

const STATUS_STYLES: Record<ToolReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

export default function ReviewsTable() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<AdminToolReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/reviews${qs}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
      showToast("Could not load reviews", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error();
      showToast(action === "approve" ? "Review approved" : "Review rejected", "success");
      await fetchReviews();
    } catch {
      showToast("Action failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Permanently delete this review? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showToast("Review deleted", "success");
      await fetchReviews();
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "all", label: "All" },
            ]}
            className="w-[160px] [&_button]:w-full [&_button]:min-w-0"
          />
          {filter === "pending" && pendingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-800">{pendingCount} awaiting</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader size="md" text="Loading reviews..." />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MessageSquareText className="mb-2 h-10 w-10 opacity-20" />
          <p>No {filter === "all" ? "" : filter} reviews.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold uppercase text-primary">
                    {r.reviewerName.charAt(0)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.reviewerName}</span>
                      {r.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.email || "—"}
                      {r.location ? ` · ${r.location}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {r.toolSlug}
                  </Badge>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              {/* Stars */}
              <div className="mt-3 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-500"
                    fill={i < r.rating ? "currentColor" : "transparent"}
                  />
                ))}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              {r.title && <p className="mt-2 text-sm font-semibold text-foreground">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {r.body}
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {r.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() => act(r.id, "approve")}
                    disabled={busyId === r.id}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act(r.id, "reject")}
                    disabled={busyId === r.id}
                    className="border-amber-500 text-amber-700 hover:bg-amber-50"
                  >
                    <X className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => remove(r.id)}
                  disabled={busyId === r.id}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
