// import { NextRequest } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeError } from "@/lib/api/safeError";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("police_verification_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database Error:", error);
      return safeError(error);
    }

    return Response.json({ data });
  } catch (error) {
    console.error("Internal Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
