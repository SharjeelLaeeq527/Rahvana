// app/api/quick-access/route.ts
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeError } from "@/lib/api/safeError";

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

type ScopeType = "account" | "journey";

/** Returns an error string, or null if the journey belongs to the user. */
async function assertJourneyOwnership(
  request: NextRequest,
  userId: string,
  journeyId: string | null | undefined
): Promise<string | null> {
  if (!journeyId) return "journey_id is required for journey scope";
  const supabase = buildClient(request);
  const { data, error } = await supabase
    .from("journeys")
    .select("id")
    .eq("id", journeyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return error.message;
  if (!data) return "journey_not_owned";
  return null;
}

/**
 * GET /api/quick-access?scope=account
 * GET /api/quick-access?scope=journey&journey_id=<uuid>
 * Returns ONLY the favorites for the requested scope.
 */
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);
  if (authError || !user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scopeType: ScopeType = searchParams.get("scope") === "journey" ? "journey" : "account";
  const journeyId = searchParams.get("journey_id");

  const supabase = buildClient(request);
  let query = supabase
    .from("user_quick_access")
    .select("*")
    .eq("user_id", user.id)
    .eq("scope_type", scopeType);

  if (scopeType === "journey") {
    const denied = await assertJourneyOwnership(request, user.id, journeyId);
    if (denied) {
      return Response.json({ error: "Forbidden journey scope" }, { status: 403 });
    }
    query = query.eq("journey_id", journeyId);
  } else {
    query = query.is("journey_id", null);
  }

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) {
    console.error("[quick-access GET]", error);
    return safeError(error);
  }
  return Response.json({ items: data ?? [] });
}

/**
 * POST /api/quick-access
 * Body: { id: string; title: string; href: string; icon_name?: string, scope_type?: "account" | "journey", journey_id?: string }
 * Idempotent within a scope (delete-then-insert avoids partial-index onConflict issues).
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);
  if (authError || !user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: {
    id?: string;
    title?: string;
    href?: string;
    icon_name?: string;
    scope_type?: ScopeType;
    journey_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, title, href, icon_name } = body;
  const scopeType: ScopeType = body.scope_type === "journey" ? "journey" : "account";
  const journeyId = scopeType === "journey" ? body.journey_id || null : null;

  if (!id || !title || !href) {
    return Response.json({ error: "id, title, and href are required" }, { status: 400 });
  }

  if (scopeType === "journey") {
    const denied = await assertJourneyOwnership(request, user.id, journeyId);
    if (denied) {
      return Response.json({ error: "Forbidden journey scope" }, { status: 403 });
    }
  }

  const supabase = buildClient(request);

  // 1. Remove any existing favorite for this exact (user, item, scope, journey).
  let rm = supabase
    .from("user_quick_access")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", id)
    .eq("scope_type", scopeType);
  rm = journeyId ? rm.eq("journey_id", journeyId) : rm.is("journey_id", null);
  const { error: rmError } = await rm;
  if (rmError) {
    console.error("[quick-access POST delete]", rmError);
    return safeError(rmError);
  }

  // 2. Insert the fresh row.
  const { data, error } = await supabase
    .from("user_quick_access")
    .insert({
      user_id: user.id,
      item_id: id,
      title,
      href,
      icon_name: icon_name ?? null,
      scope_type: scopeType,
      journey_id: journeyId,
    })
    .select()
    .single();

  if (error) {
    console.error("[quick-access POST insert]", error);
    return safeError(error);
  }
  return Response.json({ item: data }, { status: 201 });
}

/**
 * DELETE /api/quick-access
 * Body: { id, scope_type?, journey_id? }  — removes one item in one scope.
 * Body: { all: true, scope_type?, journey_id? } — clears ONLY that scope.
 * Clearing account never clears journeys; clearing IR-1 never clears IR-5.
 */
export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);
  if (authError || !user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { id?: string; all?: boolean; scope_type?: ScopeType; journey_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scopeType: ScopeType = body.scope_type === "journey" ? "journey" : "account";
  const journeyId = scopeType === "journey" ? (body.journey_id ?? null) : null;

  if (scopeType === "journey") {
    const denied = await assertJourneyOwnership(request, user.id, journeyId);
    if (denied) {
      return Response.json({ error: "Forbidden journey scope" }, { status: 403 });
    }
  }

  const supabase = buildClient(request);

  const applyScope = <T extends { eq: (c: string, v: string) => T; is: (c: string, v: null) => T }>(
    q: T
  ) => (journeyId ? q.eq("journey_id", journeyId) : q.is("journey_id", null));

  if (body.all) {
    const base = supabase
      .from("user_quick_access")
      .delete()
      .eq("user_id", user.id)
      .eq("scope_type", scopeType);
    const { error } = await applyScope(base);
    if (error) {
      console.error("[quick-access DELETE all]", error);
      return safeError(error);
    }
    return Response.json({ success: true });
  }

  if (!body.id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const base = supabase
    .from("user_quick_access")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", body.id)
    .eq("scope_type", scopeType);
  const { error } = await applyScope(base);

  if (error) {
    console.error("[quick-access DELETE]", error);
    return safeError(error);
  }
  return Response.json({ success: true });
}
