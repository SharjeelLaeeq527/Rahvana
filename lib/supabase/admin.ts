// lib/supabase/admin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) {
    return _adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Fallback to anon key if service key is absent in the current environment
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      _adminClient = createClient(url, anonKey);
      return _adminClient;
    }
    throw new Error("Supabase credentials missing for admin client.");
  }

  _adminClient = createClient(url, serviceKey);
  return _adminClient;
}

// Service Role client for server-side tasks with lazy initialization
// to prevent eval-time crashes if environment variables are evaluated on the client
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
