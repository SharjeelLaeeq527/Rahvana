// app/api/notifications/route.ts
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeError } from "@/lib/api/safeError";

/**
 * Helper: Create an authenticated Supabase client from the request cookies
 * and return both the client and the current user.
 */
async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

/**
 * POST /api/notifications
 * Create a new in-app notification.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const body = await req.json();
    const {
      title,
      message,
      body: bodyText,
      type = "system",
      link = null,         // accepted from caller but mapped to action_url
      action_url = null,
      action_label = null,
      candidate_id = null,
      candidate_name = null,
      candidate_role = null,
      priority = "normal",
      metadata = {},
      user_id: explicitUserId,
    } = body;

    const targetUserId = explicitUserId || user?.id;

    if (!targetUserId) {
      return Response.json(
        { error: "Authentication required or user_id must be provided" },
        { status: 401 }
      );
    }

    const notificationBody = message || bodyText;
    if (!title || !notificationBody) {
      return Response.json(
        { error: "Title and message/body are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    const { data, error } = await supabase
      .from("app_notifications")
      .insert({
        user_id: targetUserId,
        title,
        body: notificationBody,
        type,
        // map link → action_url (no standalone "link" column in schema)
        action_url: action_url || link || null,
        action_label: action_label || null,
        candidate_id,
        candidate_name,
        candidate_role,
        priority,
        metadata,
        is_read: false,
        dismissed: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, notification: data });
  } catch (error: any) {
    console.error("Unexpected error creating notification:", error);
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications
 * Fetch the current user's non-dismissed notifications (latest 30).
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use service role to bypass RLS for reading (we filter by user_id manually)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    const candidateId = req.nextUrl.searchParams.get("candidateId");

    let query = supabase
      .from("app_notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(30);

    if (candidateId) {
      query = query.or(`candidate_id.eq.${candidateId},candidate_id.is.null`);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return safeError(error);
    }

    return Response.json({ notifications: notifications ?? [] });
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read or dismissed.
 *
 * Body:
 *   { id: string, action: "read" | "dismiss" }
 *   OR
 *   { ids: string[], action: "read" | "dismiss" }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ids, action } = body;

    if (!action || !["read", "dismiss"].includes(action)) {
      return Response.json(
        { error: "Invalid action. Must be 'read' or 'dismiss'." },
        { status: 400 }
      );
    }

    const notifIds: string[] = ids ? ids : id ? [id] : [];
    if (notifIds.length === 0) {
      return Response.json(
        { error: "Missing notification id(s)." },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    const updateData =
      action === "read" ? { is_read: true } : { dismissed: true };

    const { error } = await supabase
      .from("app_notifications")
      .update(updateData)
      .in("id", notifIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating notifications:", error);
      return safeError(error);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Unexpected error updating notifications:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
