// POST /api/document-translation/[id]/confirm
// User accepts the translation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if document exists and is in TRANSLATED state
    const { data: existing, error: checkError } = await supabase
      .from('translation_documents')
      .select('status, translated_file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'TRANSLATED') {
      return NextResponse.json(
        { error: `Cannot confirm. Current status: ${existing.status}. Must be TRANSLATED.` },
        { status: 400 }
      );
    }

    if (!existing.translated_file_path) {
      return NextResponse.json(
        { error: 'No translated file available' },
        { status: 400 }
      );
    }

    // Update status to USER_CONFIRMED
    const { data: updated, error: updateError } = await supabase
      .from('translation_documents')
      .update({
        status: 'USER_CONFIRMED',
        user_confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm translation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: 'Translation confirmed successfully. Awaiting admin verification.',
    });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}