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
  createdAt: string;
  updatedAt: string;
  isAuthor?: boolean;
}

export interface CreateCommentInput {
  articleSlug: string;
  content: string;
  parentId?: string | null;
}

export interface BlogCommentsResponse {
  comments: BlogComment[];
  count: number;
  isAuthenticated: boolean;
  currentUserId?: string | null;
}
