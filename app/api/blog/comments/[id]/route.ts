// app/api/blog/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteComment, editComment } from "@/lib/blog/comments";
import { requireActiveSessionForRequest } from "@/lib/security/session-guard";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionGuard = await requireActiveSessionForRequest(_request);
    if (!sessionGuard.ok) return sessionGuard.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing comment ID" }, { status: 400 });
    }

    // Check if user is an admin
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sessionGuard.context.user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    const success = await deleteComment(id, sessionGuard.context.user.id, isAdmin);
    if (!success) {
      return NextResponse.json(
        { error: "Could not delete comment or permission denied." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/blog/comments/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete comment." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionGuard = await requireActiveSessionForRequest(request);
    if (!sessionGuard.ok) return sessionGuard.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing comment ID" }, { status: 400 });
    }

    const body = await request.json();
    const newContent = body.content;

    if (!newContent) {
      return NextResponse.json({ error: "Missing new content" }, { status: 400 });
    }

    const updatedComment = await editComment(id, sessionGuard.context.user.id, newContent);
    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error("[api/blog/comments/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to edit comment." }, { status: 500 });
  }
}
