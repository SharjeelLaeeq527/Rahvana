// API Route: Mark all Document as Read
// GET /api/documents/mark-all-read

import {  NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DocumentDatabaseStorage } from '@/lib/document-vault/storage-database';

export async function PATCH() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all documents as read
    const dbStorage = new DocumentDatabaseStorage(supabase);
    const documents = await dbStorage.markAllDocumentsAsRead(user.id);

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('Mark documents as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
