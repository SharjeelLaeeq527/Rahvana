// components/blog/comments/BlogCommentsSection.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import CommentForm from "@/components/blog/comments/CommentForm";
import CommentItem from "@/components/blog/comments/CommentItem";
import type { BlogComment, BlogCommentsResponse } from "@/types/blog-comments";
import { MessageSquare, MessageCircle, AlertCircle } from "lucide-react";

interface BlogCommentsSectionProps {
  slug: string;
}

export default function BlogCommentsSection({ slug }: BlogCommentsSectionProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load comments");
      }

      const data = (await res.json()) as BlogCommentsResponse;
      setComments(data.comments || []);
    } catch {
      setError("Unable to load comments at this time. Please refresh to try again.");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentCreated = (newComment: BlogComment) => {
    // Add new comment at the beginning of the list
    setComments((prev) => [newComment, ...prev]);
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/blog/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete comment");
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <section
      id="comments-section"
      className="border-border mt-16 scroll-mt-28 border-t pt-10"
      aria-label="Discussion and comments"
    >
      {/* Section Header with Counter */}
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">Comments</h2>
          <span className="ml-1 rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-500 dark:text-teal-400">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Comment Input Form */}
      <div className="mb-8">
        <CommentForm articleSlug={slug} onCommentCreated={handleCommentCreated} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="border-border/50 bg-card/30 flex animate-pulse items-start gap-3.5 rounded-2xl border p-5"
            >
              <div className="bg-muted h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <div className="bg-muted h-3.5 w-28 rounded-md" />
                <div className="bg-muted/60 h-3 w-full rounded-md" />
                <div className="bg-muted/40 h-3 w-3/4 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length > 0 && (
        <div className="space-y-3.5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={Boolean(comment.isAuthor)}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && comments.length === 0 && !error && (
        <div className="border-border/70 bg-card/20 rounded-2xl border border-dashed p-8 text-center sm:p-10">
          <div className="bg-muted/80 text-muted-foreground mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="text-foreground text-sm font-semibold">No comments yet</h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
            Have questions or insights about this guide? Be the first to share your thoughts!
          </p>
        </div>
      )}
    </section>
  );
}
