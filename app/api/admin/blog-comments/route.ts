// app/api/admin/blog-comments/route.ts
// Admin moderation for blog comments and replies:
//   GET    /api/admin/blog-comments?status=all|approved|hidden|flagged
//   PATCH  /api/admin/blog-comments         -> { id, action: 'hide' | 'unhide' | 'approve' }
//   DELETE /api/admin/blog-comments?id=<id> -> permanently remove a comment or reply

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getServiceRoleClient } from "@/lib/api/authGuards";
import type { BlogCommentStatus } from "@/types/blog-comments";

export const dynamic = "force-dynamic";

interface AdminCommentRow {
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

export async function GET(request: NextRequest) {
  const { isAdmin, error } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Admin access required" }, { status: 403 });
  }

  try {
    const admin = getServiceRoleClient();
    const statusParam = new URL(request.url).searchParams.get("status");

    let query = admin
      .from("blog_comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusParam && statusParam !== "all") {
      query = query.eq("status", statusParam);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      console.error("[api/admin/blog-comments] GET error:", fetchError.message);
      return NextResponse.json({ error: "Failed to load blog comments" }, { status: 500 });
    }

    const rows = (data as AdminCommentRow[]) || [];

    // Attach author emails from profiles for administrative clarity
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const emailMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profileRows } = await admin
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      for (const p of (profileRows as { id: string; email: string | null }[]) || []) {
        if (p.email) emailMap.set(p.id, p.email);
      }
    }

    const comments = rows.map((r) => ({
      id: r.id,
      articleSlug: r.article_slug,
      userId: r.user_id,
      authorName: r.author_name,
      authorEmail: emailMap.get(r.user_id) || null,
      authorAvatarUrl: r.author_avatar_url,
      content: r.content,
      status: r.status,
      parentId: r.parent_id,
      replyToName: r.reply_to_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      editedAt: r.edited_at,
    }));

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[api/admin/blog-comments] GET unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Admin access required" }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      action?: "hide" | "unhide" | "approve" | "flag";
    };

    if (!body.id) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    let targetStatus: BlogCommentStatus;
    if (body.action === "hide") {
      targetStatus = "hidden";
    } else if (body.action === "unhide" || body.action === "approve") {
      targetStatus = "approved";
    } else if (body.action === "flag") {
      targetStatus = "flagged";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const admin = getServiceRoleClient();
    const { error: updateError } = await admin
      .from("blog_comments")
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (updateError) {
      console.error("[api/admin/blog-comments] PATCH error:", updateError.message);
      return NextResponse.json({ error: "Failed to update comment status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: targetStatus });
  } catch (err) {
    console.error("[api/admin/blog-comments] PATCH unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Admin access required" }, { status: 403 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const admin = getServiceRoleClient();
    const { error: deleteError } = await admin.from("blog_comments").delete().eq("id", id);

    if (deleteError) {
      console.error("[api/admin/blog-comments] DELETE error:", deleteError.message);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/blog-comments] DELETE unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
