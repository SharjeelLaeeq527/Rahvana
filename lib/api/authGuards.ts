// lib/api/authGuards.ts
// Shared authentication / authorization guards for API route handlers.
//
// WHY THIS EXISTS: several routes use the Supabase SERVICE ROLE key, which
// BYPASSES Row-Level Security. Any route using the service role MUST first
// (1) authenticate the caller and (2) authorize the specific action/resource.
// Centralizing that here prevents routes from silently shipping without a gate.

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

/**
 * Returns the authenticated user from the request session cookies, or null.
 * Uses the anon client + cookies (RLS-respecting) — never the service role.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Service-role client (BYPASSES RLS). Use ONLY after auth + ownership checks.
 */
export function getServiceRoleClient(): SupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Verifies the caller is an admin: logged in, email in ADMIN_EMAILS, and
 * profiles.role === "admin". Mirrors the existing checkAdminRole pattern.
 */
export async function requireAdmin(): Promise<{
  user: User | null;
  isAdmin: boolean;
  error: string | null;
}> {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, isAdmin: false, error: "Authentication required" };
  if (!user.email || !ADMIN_EMAILS.includes(user.email))
    return { user, isAdmin: false, error: "Admin access required" };

  const admin = getServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return { user, isAdmin: false, error: "Profile verification failed" };
  if (!profile || profile.role !== "admin")
    return { user, isAdmin: false, error: "Admin role required" };

  return { user, isAdmin: true, error: null };
}
