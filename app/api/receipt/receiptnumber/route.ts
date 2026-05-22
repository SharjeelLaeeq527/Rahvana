// app/api/receipt/[receiptNumber]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { listReceiptRecords } from "@/lib/supabase/receipts";
import { E, msg } from '@/lib/errors';

export async function GET(
  req: Request,
  { params }: { params: { receiptNumber: string } }
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('[receipt/receiptnumber] Unauthorized access');
    return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
  }

  // Use legacy listReceiptRecords (returns array) and pick latest
  const { data: records, error: listError } = await listReceiptRecords(user.id);

  if (listError) {
    console.error('Error listing receipt records:', listError);
    return NextResponse.json({ error: msg(E.JOURNEY_RECEIPT_FETCH_FAILED) }, { status: 500 });
  }

  const data = (records && records.length > 0) ? records[0] : null;

  if (!data) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({
    receipt_number:    data.receiptNumber,
    notice_date:       data.noticeDate,
    priority_date:     data.priorityDate,
    case_label:        data.caseLabel,
    source:            data.source,
    tracking_enabled:  data.trackingEnabled,
    last_known_status: data.lastKnownStatus,
    last_checked_at:   data.lastCheckedAt,
    saved_at:          data.savedAt,
  });
}