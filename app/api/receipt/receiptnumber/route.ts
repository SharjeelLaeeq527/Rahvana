// app/api/receipt/[receiptNumber]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getReceiptRecord } from "@/lib/supabase/receipts";

export async function GET(req: Request, { params }: { params: { receiptNumber: string } }) {
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pass authenticated supabase so RLS works — receipt number param is ignored
  const { data, error } = await getReceiptRecord("", user.id, supabase);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({
    receipt_number: data.receiptNumber,
    notice_date: data.noticeDate,
    priority_date: data.priorityDate,
    case_label: data.caseLabel,
    source: data.source,
    tracking_enabled: data.trackingEnabled,
    last_known_status: data.lastKnownStatus,
    last_checked_at: data.lastCheckedAt,
    saved_at: data.savedAt,
  });
}
