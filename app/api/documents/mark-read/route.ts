// API Route: Mark Document as Read
// GET /api/documents/mark-read?documentId=123

import {  NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DocumentDatabaseStorage } from '@/lib/document-vault/storage-database';
import { E, msg } from '@/lib/errors';

export async function PATCH(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Get the document ID from the request
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: '[documentId]' }) }, { status: 400 });
    }

    // Mark the document as read
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const document = await dbStorage.markDocumentAsRead(documentId, user.id);

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Mark document as read error:', error);
    return NextResponse.json(
      { error: msg(E.AUTH_UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}
