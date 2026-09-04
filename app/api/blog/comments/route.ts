// app/api/blog/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApprovedComments, submitComment } from "@/lib/blog/comments";
import type { CreateCommentInput } from "@/types/blog-comments";

export const dynamic = "force-dynamic";

/**
 * GET /api/blog/comments?slug=<article_slug>
 * Fetches approved comments organized into threaded conversations for the given article slug.
 */
export async function GET(request: NextRequest) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ error: "Missing article slug" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { threads, totalCount } = await getApprovedComments(slug.trim(), user?.id ?? null);

    return NextResponse.json({
      comments: threads,
      count: totalCount,
      isAuthenticated: Boolean(user),
      currentUserId: user?.id ?? null,
    });
  } catch (error) {
    console.error("[api/blog/comments] GET error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

/**
 * POST /api/blog/comments
 * Creates a new top-level comment or threaded reply. Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to post a comment or reply." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as Partial<CreateCommentInput> | null;
    if (!body || !body.articleSlug || !body.content) {
      return NextResponse.json(
        { error: "Invalid request. articleSlug and content are required." },
        { status: 400 }
      );
    }

    const trimmedContent = body.content.trim();
    if (trimmedContent.length < 2) {
      return NextResponse.json(
        { error: "Comment must be at least 2 characters long." },
        { status: 400 }
      );
    }
    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: "Comment is too long (maximum 2,000 characters)." },
        { status: 400 }
      );
    }

    // Retrieve user profile for author_name and optional author_avatar_url
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const authorName =
      (profile?.full_name as string | undefined)?.trim() ||
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      (user.user_metadata?.name as string | undefined)?.trim() ||
      (user.email ? user.email.split("@")[0] : "Community Member");

    // author_avatar_url is optional
    const authorAvatarUrl =
      (profile?.avatar_url as string | undefined)?.trim() ||
      (user.user_metadata?.avatar_url as string | undefined)?.trim() ||
      (user.user_metadata?.picture as string | undefined)?.trim() ||
      null;

    const newComment = await submitComment(user.id, authorName, authorAvatarUrl, {
      articleSlug: body.articleSlug.trim(),
      content: trimmedContent,
      parentId: body.parentId || null,
      replyToName: body.replyToName || null,
    });

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("[api/blog/comments] POST error:", error);
    return NextResponse.json({ error: "Failed to submit comment." }, { status: 500 });
  }
}
