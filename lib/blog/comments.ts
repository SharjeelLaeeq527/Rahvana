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
  created_at: string;
  updated_at: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isAuthor: Boolean(currentUserId && row.user_id === currentUserId),
  };
}

export { formatCommentTime } from "@/lib/blog/time";

/** Fetches approved comments for a specific blog article slug, newest first. */
export async function getApprovedComments(
  slug: string,
  currentUserId?: string | null
): Promise<BlogComment[]> {
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
      return [];
    }

    return (data as CommentRow[]).map((row) => mapRowToComment(row, currentUserId));
  } catch (err) {
    console.error("[blog_comments] unexpected error in getApprovedComments:", err);
    return [];
  }
}

/** Submits a new comment for an article. */
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
  };

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

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
