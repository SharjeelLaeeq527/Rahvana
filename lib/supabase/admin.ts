// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

// Service Role client for server-side tasks
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookieOptions: {
      name: 'sb-session',
      sameSite: 'lax',   // 'none' bhi ho sakta hai
      secure: true,      // production (HTTPS) ke liye لازمی
      path: '/',
    },
  }
);
