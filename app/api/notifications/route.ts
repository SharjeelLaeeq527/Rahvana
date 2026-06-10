// app/api/notifications/route.ts
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

    const { data: notifications, error } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching notifications:", error);
      return Response.json({ error: error.message }, { status: 500 });
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
      return Response.json({ error: error.message }, { status: 500 });
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
