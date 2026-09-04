// components/blog/comments/CommentItem.tsx
"use client";

import React, { useState } from "react";
import CommentAvatar from "@/components/blog/comments/CommentAvatar";
import { formatCommentTime } from "@/lib/blog/time";
import type { BlogComment } from "@/types/blog-comments";
import { Clock, Trash2, Loader2 } from "lucide-react";

interface CommentItemProps {
  comment: BlogComment;
  canDelete?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export default function CommentItem({ comment, canDelete, onDelete }: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedTime = formatCommentTime(comment.createdAt);

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article className="group relative flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card/40 p-4.5 sm:p-5 backdrop-blur-xs transition-all duration-200 hover:border-border hover:bg-card/70">
      {/* Circular Profile Container */}
      <CommentAvatar
        name={comment.authorName}
        avatarUrl={comment.authorAvatarUrl}
        size="md"
        className="mt-0.5"
      />

      {/* Main Comment Content */}
      <div className="min-w-0 flex-1">
        {/* Author Header & Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {comment.authorName}
            </span>

            {comment.isAuthor && (
              <span className="rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-teal-600 dark:text-teal-400 border border-teal-500/20">
                You
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Timestamp */}
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground/80 font-normal"
              title={new Date(comment.createdAt).toLocaleString()}
            >
              <Clock className="h-3 w-3 shrink-0 opacity-70" />
              <span>{formattedTime || "Recently"}</span>
            </span>

            {/* Author / Admin Delete Action */}
            {canDelete && onDelete && (
              <div className="ml-1 flex items-center">
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-[11px] font-medium text-red-500 hover:text-red-600 underline disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete?"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete comment"
                    title="Delete your comment"
                    className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comment Body */}
        <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line break-words">
          {comment.content}
        </p>
      </div>
    </article>
  );
}
