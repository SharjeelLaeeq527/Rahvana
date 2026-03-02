import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns a fresh Supabase client instance.
 * For the browser, we use a module-level singleton so we don't spam 
 * localStorage lock queues and create deadlocks across tabs.
 * On the server, we always return a fresh client to prevent cross-request pollution.
 */
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser && client) {
    return client
  }
  
  const newClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  if (isBrowser) {
    client = newClient
  }
  
  return newClient
}
