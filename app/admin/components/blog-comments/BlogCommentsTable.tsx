// app/admin/components/blog-comments/BlogCommentsTable.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  CornerDownRight,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { useToast } from "@/app/components/shared/ToastProvider";
import CommentAvatar from "@/components/blog/comments/CommentAvatar";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import type { BlogCommentStatus } from "@/types/blog-comments";

interface AdminCommentItem {
  id: string;
  articleSlug: string;
  userId: string;
  authorName: string;
  authorEmail: string | null;
  authorAvatarUrl: string | null;
  content: string;
  status: BlogCommentStatus;
  parentId: string | null;
  replyToName: string | null;
  createdAt: string;
  updatedAt: string;
}

type Filter = "all" | "approved" | "hidden" | "flagged";

const STATUS_STYLES: Record<BlogCommentStatus, string> = {
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  hidden: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  flagged: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function BlogCommentsTable() {
  const { showToast } = useToast();
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/blog-comments${qs}`);
      if (!res.ok) throw new Error("Failed to load blog comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
      showToast("Could not load comments", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const toggleVisibility = async (id: string, currentStatus: BlogCommentStatus) => {
    const action = currentStatus === "approved" ? "hide" : "unhide";
    setBusyId(id);

    try {
      const res = await fetch("/api/admin/blog-comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) throw new Error();

      showToast(
        action === "hide" ? "Comment is now hidden from public view" : "Comment approved and visible",
        "success"
      );
      await fetchComments();
    } catch {
      showToast("Failed to update comment visibility", "error");
    } finally {
      setBusyId(null);
    }
  };

  const removeComment = async (id: string) => {
    if (!window.confirm("Permanently delete this comment and any replies? This action cannot be undone.")) {
      return;
    }

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog-comments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      showToast("Comment permanently deleted", "success");
      await fetchComments();
    } catch {
      showToast("Failed to delete comment", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            options={[
              { value: "all", label: "All Comments" },
              { value: "approved", label: "Approved (Live)" },
              { value: "hidden", label: "Hidden (Suppressed)" },
              { value: "flagged", label: "Flagged" },
            ]}
            className="w-[180px] [&_button]:w-full [&_button]:min-w-0"
          />

          <span className="text-xs text-muted-foreground">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchComments()}
          disabled={loading}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader size="md" text="Loading comments..." />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">No comments found</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filter !== "all" ? `No comments with status '${filter}'` : "No comments submitted yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 font-semibold text-foreground">
              <tr>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Comment Body</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {comments.map((comment) => {
                const isReply = Boolean(comment.parentId);
                const isBusy = busyId === comment.id;

                return (
                  <tr
                    key={comment.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Author Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <CommentAvatar
                          name={comment.authorName}
                          avatarUrl={comment.authorAvatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[140px]">
                            {comment.authorName}
                          </p>
                          {comment.authorEmail && (
                            <p className="text-[10.5px] text-muted-foreground truncate max-w-[140px]">
                              {comment.authorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Article */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/blog/${comment.articleSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400 hover:underline max-w-[150px] truncate"
                        title={`View /blog/${comment.articleSlug}`}
                      >
                        <span className="truncate">{comment.articleSlug}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </Link>
                    </td>

                    {/* Content Preview */}
                    <td className="py-3 px-4 max-w-[260px]">
                      <p className="line-clamp-2 text-foreground/90 whitespace-pre-line break-words text-[12px] leading-snug">
                        {comment.content}
                      </p>
                    </td>

                    {/* Type: Top-level or Reply */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isReply ? (
                        <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-teal-600 dark:text-teal-400">
                          <CornerDownRight className="h-3 w-3" />
                          <span>Reply {comment.replyToName ? `@${comment.replyToName}` : ""}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Top-level</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`capitalize text-[11px] font-medium ${
                          STATUS_STYLES[comment.status] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {comment.status}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Hide / Unhide Button */}
                        {comment.status === "approved" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => toggleVisibility(comment.id, comment.status)}
                            className="h-7 px-2 text-[11px] text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 gap-1"
                            title="Hide this comment from public view"
                          >
                            <EyeOff className="h-3 w-3" />
                            <span>Hide</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => toggleVisibility(comment.id, comment.status)}
                            className="h-7 px-2 text-[11px] text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30 gap-1"
                            title="Unhide and make comment publicly visible"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Unhide</span>
                          </Button>
                        )}

                        {/* Permanent Delete Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => removeComment(comment.id)}
                          className="h-7 px-2 text-[11px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                          title="Permanently delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
