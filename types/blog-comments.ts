// types/blog-comments.ts

export type BlogCommentStatus = "approved" | "flagged" | "hidden" | "pending";

export interface BlogComment {
  id: string;
  articleSlug: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  status: BlogCommentStatus;
  parentId?: string | null;
  replyToName?: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  isAuthor?: boolean;
  replies?: BlogComment[];
}

export interface CreateCommentInput {
  articleSlug: string;
  content: string;
  parentId?: string | null;
  replyToName?: string | null;
}

export interface BlogCommentsResponse {
  comments: BlogComment[];
  count: number;
  isAuthenticated: boolean;
  currentUserId?: string | null;
}
