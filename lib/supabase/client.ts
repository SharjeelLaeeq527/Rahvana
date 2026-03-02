import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns a fresh Supabase client instance.
 * For the browser, we no longer use a module-level singleton because it can lead to 
 * stale session state during client-side navigation. Each call now creates a fresh 
 * client that accurately reads the latest cookies/storage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
    cookieOptions: {
      name: 'sb-session',
      sameSite: 'lax',   // 'none' bhi ho sakta hai
      secure: true,      // production (HTTPS) ke liye لازمی
      path: '/',
    },
  }
  )
}
