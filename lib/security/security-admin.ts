/**
 * Creates the service-role client for trusted backend security operations.
 * Authenticate the caller before using it for user-scoped operations.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSecurityAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Fail closed; security writes must never fall back to the anon key.
  if (!url || !serviceKey) {
    throw new Error("Security service-role credentials are not configured.");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
