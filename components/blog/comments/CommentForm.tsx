// components/blog/comments/CommentForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CommentAvatar from "@/components/blog/comments/CommentAvatar";
import type { BlogComment } from "@/types/blog-comments";
import { Send, LogIn, AlertCircle, Loader2 } from "lucide-react";

interface CommentFormProps {
  articleSlug: string;
  onCommentCreated: (newComment: BlogComment) => void;
}

export default function CommentForm({ articleSlug, onCommentCreated }: CommentFormProps) {
  const { user, profile, isLoading } = useAuth();
  const pathname = usePathname();

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive author display name and optional avatar URL
  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    (user?.email ? user.email.split("@")[0] : "You");

  const avatarUrl =
    profile?.avatar_url?.trim() ||
    (user?.user_metadata?.avatar_url as string | undefined)?.trim() ||
    (user?.user_metadata?.picture as string | undefined)?.trim() ||
    null;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/30 p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
      </div>
    );
  }

  // If user is not authenticated, show sign-in callout card
  if (!user) {
    const returnUrl = pathname || `/blog/${articleSlug}`;
    return (
      <div className="rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/5 via-teal-500/10 to-transparent p-5 sm:p-6 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <LogIn className="h-4 w-4 text-teal-500" />
              <span>Join the Conversation</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in to share your thoughts, ask questions, or connect with the community.
            </p>
          </div>
          <Link
            href={`/login?redirect=${encodeURIComponent(returnUrl)}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-500 hover:shadow-teal-500/20 hover:-translate-y-0.5"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign in to comment</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("Please write at least 2 characters.");
      return;
    }
    if (trimmed.length > 2000) {
      setError("Comments cannot exceed 2,000 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleSlug,
          content: trimmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to submit comment. Please try again.");
        return;
      }

      if (data?.comment) {
        onCommentCreated(data.comment);
        setContent("");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/70 bg-card/60 p-4.5 sm:p-6 backdrop-blur-xs shadow-xs"
    >
      <div className="flex items-start gap-3.5">
        {/* Author Avatar */}
        <CommentAvatar
          name={displayName}
          avatarUrl={avatarUrl}
          size="md"
          className="mt-0.5"
        />

        {/* Text Input Area */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Commenting as <span className="font-semibold text-foreground">{displayName}</span>
            </span>
            <span
              className={`text-[11px] ${
                content.length > 1900 ? "text-amber-500 font-medium" : "text-muted-foreground/70"
              }`}
            >
              {content.length} / 2,000
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            maxLength={2000}
            placeholder="Share your thoughts, experiences, or questions regarding this guide..."
            className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all disabled:opacity-50"
          />

          {error && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-500 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting || content.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-teal-500 hover:shadow-teal-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
