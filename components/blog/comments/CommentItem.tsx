// components/blog/comments/CommentItem.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CommentAvatar from "@/components/blog/comments/CommentAvatar";
import { formatCommentTime } from "@/lib/blog/time";
import type { BlogComment } from "@/types/blog-comments";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import {
  Clock,
  Trash2,
  Loader2,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Send,
  LogIn,
} from "lucide-react";

interface CommentItemProps {
  comment: BlogComment;
  canDelete?: boolean;
  onDelete?: (id: string, parentId?: string) => Promise<void>;
  onReplySubmit?: (parentId: string, content: string, replyToName?: string) => Promise<void>;
}

export default function CommentItem({
  comment,
  canDelete,
  onDelete,
  onReplySubmit,
}: CommentItemProps) {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  const [isDeleting, setIsDeleting] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    parentId?: string;
  } | null>(null);

  // Threading / Reply state
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyTarget, setReplyTarget] = useState<string>(comment.authorName);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Collapsible replies toggle
  const replies = comment.replies || [];
  const [areRepliesExpanded, setAreRepliesExpanded] = useState(true);

  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showReplyForm && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [showReplyForm]);

  const formattedTime = formatCommentTime(comment.createdAt);

  /**
   * Opens the delete confirmation modal for a comment/reply.
   */
  const handleOpenDeleteModal = (targetId: string, parentId?: string) => {
    setDeleteTarget({
      id: targetId,
      parentId,
    });
    setShowDeleteModal(true);
  };

  /**
   * Closes the delete confirmation modal.
   */
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;

    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  /**
   * Handles the actual deletion after confirmation.
   */
  const handleDelete = async (targetId: string, parentId?: string) => {
    if (!onDelete) return;

    setIsDeleting(true);

    try {
      await onDelete(targetId, parentId);

      // Close modal after successful deletion
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setIsDeleting(false);
    } catch {
      // Keep the modal available if deletion fails
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    await handleDelete(deleteTarget.id, deleteTarget.parentId);
  };

  const handleOpenReplyForm = (targetAuthor: string) => {
    setReplyTarget(targetAuthor);
    setShowReplyForm(true);
    setReplyError(null);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = replyContent.trim();

    if (trimmed.length < 2) {
      setReplyError("Reply must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 2000) {
      setReplyError("Reply cannot exceed 2,000 characters.");
      return;
    }

    if (!onReplySubmit) return;

    setIsSubmittingReply(true);
    setReplyError(null);

    try {
      await onReplySubmit(comment.id, trimmed, replyTarget);
      setReplyContent("");
      setShowReplyForm(false);
      setAreRepliesExpanded(true);
    } catch {
      setReplyError("Failed to send reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Current logged in user info for reply input
  const currentDisplayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    (user?.email ? user.email.split("@")[0] : "You");

  const currentAvatarUrl =
    profile?.avatar_url?.trim() ||
    (user?.user_metadata?.avatar_url as string | undefined)?.trim() ||
    (user?.user_metadata?.picture as string | undefined)?.trim() ||
    null;

  return (
    <div className="space-y-2">
      {/* ── Main Top-Level Comment ── */}
      <article className="group border-border/60 bg-card/40 hover:border-border hover:bg-card/70 relative flex items-start gap-3.5 rounded-2xl border p-4.5 backdrop-blur-xs transition-all duration-200 sm:p-5">
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
              <span className="text-foreground text-sm font-semibold tracking-tight">
                {comment.authorName}
              </span>

              {comment.isAuthor && (
                <span className="rounded-md border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-teal-600 dark:text-teal-400">
                  You
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Timestamp */}
              <span
                className="text-muted-foreground/80 flex items-center gap-1 text-xs font-normal"
                title={new Date(comment.createdAt).toLocaleString()}
              >
                <Clock className="h-3 w-3 shrink-0 opacity-70" />
                <span>{formattedTime || "Recently"}</span>
              </span>

              {/* Author / Admin Delete Action */}
              {canDelete && onDelete && (
                <div className="ml-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(comment.id)}
                    aria-label="Delete comment"
                    title="Delete your comment"
                    disabled={isDeleting}
                    className="text-muted-foreground/70 rounded-md p-1 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting && deleteTarget?.id === comment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comment Body */}
          <p className="text-foreground/90 mt-2 text-sm leading-relaxed break-words whitespace-pre-line">
            {comment.content}
          </p>

          {/* Action Bar: Reply Button */}
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenReplyForm(comment.authorName)}
              className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-teal-600 dark:hover:text-teal-400"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </article>

      {/* ── Inline Reply Box ── */}
      {showReplyForm && (
        <div className="bg-card/60 animate-in fade-in slide-in-from-top-2 ml-6 rounded-2xl border border-teal-500/30 p-3.5 duration-150 sm:ml-10 sm:p-4">
          {!user ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                Sign in to reply to <strong className="text-foreground">@{replyTarget}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
                >
                  <LogIn className="h-3 w-3" />
                  <span>Sign in</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendReply}>
              <div className="flex items-start gap-2.5">
                <CommentAvatar
                  name={currentDisplayName}
                  avatarUrl={currentAvatarUrl}
                  size="sm"
                  className="mt-1"
                />

                <div className="min-w-0 flex-1">
                  <div className="text-muted-foreground mb-1.5 text-[11.5px]">
                    Replying to{" "}
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      @{replyTarget}
                    </span>
                  </div>

                  <textarea
                    ref={replyTextareaRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={isSubmittingReply}
                    rows={2}
                    maxLength={2000}
                    placeholder={`Write a reply to @${replyTarget}...`}
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 w-full resize-y rounded-xl border px-3 py-2 text-xs transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                  />

                  {replyError && <p className="mt-1 text-xs text-red-500">{replyError}</p>}

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      disabled={isSubmittingReply}
                      className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingReply || replyContent.trim().length < 2}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-teal-500 disabled:opacity-50"
                    >
                      {isSubmittingReply ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Replying...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span>Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Nested Replies Section ── */}
      {replies.length > 0 && (
        <div className="ml-5 space-y-3 border-l-2 border-teal-500/25 pt-1 pl-3.5 sm:ml-7 sm:pl-5">
          {/* Collapsible toggle button */}
          <button
            type="button"
            onClick={() => setAreRepliesExpanded(!areRepliesExpanded)}
            className="flex items-center gap-1.5 py-0.5 text-xs font-semibold text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400"
          >
            {areRepliesExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Hide {replies.length === 1 ? "reply" : `${replies.length} replies`}</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>View {replies.length === 1 ? "1 reply" : `${replies.length} replies`}</span>
              </>
            )}
          </button>

          {/* Expanded Replies List */}
          {areRepliesExpanded && (
            <div className="animate-in fade-in space-y-2.5 duration-200">
              {replies.map((reply) => {
                const replyFormattedTime = formatCommentTime(reply.createdAt);

                return (
                  <article
                    key={reply.id}
                    className="group border-border/50 bg-card/30 hover:border-border hover:bg-card/50 relative flex items-start gap-2.5 rounded-xl border p-3 backdrop-blur-xs transition-colors sm:p-3.5"
                  >
                    {/* Smaller circular avatar for replies */}
                    <CommentAvatar
                      name={reply.authorName}
                      avatarUrl={reply.authorAvatarUrl}
                      size="sm"
                      className="mt-0.5"
                    />

                    <div className="min-w-0 flex-1">
                      {/* Author Header */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground text-xs font-semibold">
                            {reply.authorName}
                          </span>

                          {reply.isAuthor && (
                            <span className="py-0.2 rounded border border-teal-500/20 bg-teal-500/10 px-1 text-[10px] font-medium text-teal-600 dark:text-teal-400">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="text-muted-foreground/80 flex items-center gap-1 text-[11px]"
                            title={new Date(reply.createdAt).toLocaleString()}
                          >
                            <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" />
                            <span>{replyFormattedTime || "Recently"}</span>
                          </span>

                          {/* Delete Reply Button */}
                          {Boolean(reply.isAuthor) && onDelete && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(reply.id, comment.id)}
                              aria-label="Delete reply"
                              title="Delete this reply"
                              disabled={isDeleting}
                              className="text-muted-foreground/70 rounded-md p-1 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isDeleting && deleteTarget?.id === reply.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reply Body with @Mention Tag */}
                      <p className="text-foreground/90 mt-1 text-xs leading-relaxed break-words whitespace-pre-line">
                        {reply.replyToName && (
                          <span className="mr-1.5 font-medium text-teal-600 select-none dark:text-teal-400">
                            @{reply.replyToName}
                          </span>
                        )}
                        {reply.content}
                      </p>

                      {/* Quick Reply to this specific replier */}
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReplyForm(reply.authorName)}
                          className="text-muted-foreground inline-flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-teal-600 dark:hover:text-teal-400"
                        >
                          <CornerDownRight className="h-3 w-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteModal();
          } else {
            setShowDeleteModal(true);
          }
        }}
        title="Delete comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        confirmVariant="danger"
        onCancel={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
