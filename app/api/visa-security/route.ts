import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

// ============================
// GET — Fetch user's own security questions (session-based)
// ============================
export async function GET(req: NextRequest) {
  try {
    // Step 1: Verify the logged-in user from session cookie
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Use service role to query — but only for the authenticated user's ID
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Force use of authenticated user.id — ignore any userId param from URL
    const { data, error } = await supabase
      .from('visa_security_questions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching security questions:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: data || null });
  } catch (error) {
    console.error('Unexpected error fetching security questions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// POST — Save user's security questions (session-based)
// ============================
export async function POST(req: NextRequest) {
  try {
    // Step 1: Verify the logged-in user from session cookie
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse body
    const body = await req.json();
    const { questions, portalUsername } = body;

    if (!questions) {
      return Response.json({ error: 'Missing questions' }, { status: 400 });
    }

    // Step 3: Use service role to upsert — always scoped to authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    const { data, error } = await supabase
      .from('visa_security_questions')
      .upsert(
        {
          user_id: user.id, // ← Always use session user — NOT from body/URL
          portal_username: portalUsername,
          question_1: questions.q1,
          answer_1: questions.a1,
          question_2: questions.q2,
          answer_2: questions.a2,
          question_3: questions.q3,
          answer_3: questions.a3,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving security questions:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (error) {
    console.error('Unexpected error saving security questions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
