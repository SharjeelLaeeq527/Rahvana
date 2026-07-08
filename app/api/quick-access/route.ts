// app/api/quick-access/route.ts
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Helper: build an authenticated Supabase server client from cookies.
 */
function buildClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
}

async function getAuthUser(request: NextRequest) {
  // Use anon key for auth check, then service key for data ops
  const anonClient = createServerClient(
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
  } = await anonClient.auth.getUser();
  return { user, error };
}

/**
 * GET /api/quick-access
 * Returns all quick access items for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);
  if (authError || !user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = buildClient(request);
  const { data, error } = await supabase
    .from("user_quick_access")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[quick-access GET]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}

/**
 * POST /api/quick-access
 * Body: { id: string; title: string; href: string; icon_name?: string }
 * Upserts an item (idempotent — safe to call multiple times).
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);
  if (authError || !user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { id?: string; title?: string; href?: string; icon_name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, title, href, icon_name } = body;
  if (!id || !title || !href) {
    return Response.json({ error: "id, title, and href are required" }, { status: 400 });
  }

  const supabase = buildClient(request);
  const { data, error } = await supabase
    .from("user_quick_access")
    .upsert(
      {
        user_id: user.id,
        item_id: id,
        title,
        href,
        icon_name: icon_name ?? null,
      },
      { onConflict: "user_id,item_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error("[quick-access POST]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ item: data }, { status: 201 });
}

/**
 * DELETE /api/quick-access
 * Body: { id: string } — removes a single item.
 * Body: { all: true } — clears all items for the user.
 */
export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);
  if (authError || !user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { id?: string; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = buildClient(request);

  if (body.all) {
    const { error } = await supabase
      .from("user_quick_access")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      console.error("[quick-access DELETE all]", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ success: true });
  }

  if (!body.id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_quick_access")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", body.id);

  if (error) {
    console.error("[quick-access DELETE]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
