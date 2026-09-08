// lib/blog/comments.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BlogComment, BlogCommentStatus, CreateCommentInput } from "@/types/blog-comments";

const TABLE = "blog_comments";

interface CommentRow {
  id: string;
  article_slug: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  status: BlogCommentStatus;
  parent_id: string | null;
  reply_to_name: string | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
}

function mapRowToComment(row: CommentRow, currentUserId?: string | null): BlogComment {
  return {
    id: row.id,
    articleSlug: row.article_slug,
    userId: row.user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url || null,
    content: row.content,
    status: row.status,
    parentId: row.parent_id,
    replyToName: row.reply_to_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editedAt: row.edited_at,
    isAuthor: Boolean(currentUserId && row.user_id === currentUserId),
    replies: [],
  };
}

export { formatCommentTime } from "@/lib/blog/time";

/**
 * Organizes flat list of comments into threaded hierarchy:
 * - Top-level comments sorted newest first.
 * - Replies grouped under parent comments and sorted chronologically (oldest first).
 */
export function organizeCommentThreads(comments: BlogComment[]): {
  threads: BlogComment[];
  totalCount: number;
} {
  const topLevel: BlogComment[] = [];
  const repliesMap = new Map<string, BlogComment[]>();

  for (const comment of comments) {
    if (comment.parentId) {
      const list = repliesMap.get(comment.parentId) || [];
      list.push(comment);
      repliesMap.set(comment.parentId, list);
    } else {
      topLevel.push({ ...comment, replies: [] });
    }
  }

  // Attach replies sorted chronologically (oldest first) so conversation flows naturally
  for (const parent of topLevel) {
    const threadReplies = repliesMap.get(parent.id) || [];
    threadReplies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    parent.replies = threadReplies;
  }

  return {
    threads: topLevel,
    totalCount: comments.length,
  };
}

/** Fetches approved comments for a specific blog article slug, organized as threaded conversations. */
export async function getApprovedComments(
  slug: string,
  currentUserId?: string | null
): Promise<{ threads: BlogComment[]; totalCount: number }> {
  try {
    let query = supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("article_slug", slug)
      .order("created_at", { ascending: false });

    if (currentUserId) {
      // Fetch approved comments OR comments created by the current user
      query = query.or(`status.eq.approved,user_id.eq.${currentUserId}`);
    } else {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error) {
      console.error("[blog_comments] getApprovedComments error:", error.message);
      return { threads: [], totalCount: 0 };
    }

    const flatComments = (data as CommentRow[]).map((row) => mapRowToComment(row, currentUserId));
    return organizeCommentThreads(flatComments);
  } catch (err) {
    console.error("[blog_comments] unexpected error in getApprovedComments:", err);
    return { threads: [], totalCount: 0 };
  }
}

/** Submits a new comment or reply for an article. */
export async function submitComment(
  userId: string,
  authorName: string,
  authorAvatarUrl: string | null | undefined,
  input: CreateCommentInput
): Promise<BlogComment> {
  const cleanContent = input.content.trim();
  if (cleanContent.length < 2) {
    throw new Error("Comment must be at least 2 characters long.");
  }
  if (cleanContent.length > 2000) {
    throw new Error("Comment must not exceed 2,000 characters.");
  }

  const payload = {
    article_slug: input.articleSlug,
    user_id: userId,
    author_name: authorName,
    author_avatar_url: authorAvatarUrl || null,
    content: cleanContent,
    status: "approved" as BlogCommentStatus,
    parent_id: input.parentId || null,
    reply_to_name: input.replyToName || null,
  };

  const { data, error } = await supabaseAdmin.from(TABLE).insert(payload).select("*").single();

  if (error) {
    console.error("[blog_comments] submitComment error:", error.message);
    throw new Error("Failed to post comment.");
  }

  return mapRowToComment(data as CommentRow, userId);
}

/** Deletes a comment by ID if the caller is the author or an admin. */
export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin = false
): Promise<boolean> {
  let query = supabaseAdmin.from(TABLE).delete().eq("id", commentId);

  // If not admin, restrict deletion to the comment's author
  if (!isAdmin) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;
  if (error) {
    console.error("[blog_comments] deleteComment error:", error.message);
    return false;
  }

  return true;
}

// Edits an existing comment by ID
export async function editComment(
  commentId: string,
  userId: string,
  newContent: string
): Promise<BlogComment> {
  const cleanContent = newContent.trim();
  if (cleanContent.length < 2) {
    throw new Error("Comment must be at least 2 characters long.");
  }
  if (cleanContent.length > 2000) {
    throw new Error("Comment must not exceed 2,000 characters.");
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ content: cleanContent, edited_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("[blog_comments] editComment error:", error.message);
    throw new Error("Failed to edit comment.");
  }

  return mapRowToComment(data as CommentRow, userId);
}
