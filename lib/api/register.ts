import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  buildReceiptRecord,
  isValidReceiptNumber,
  normalizeReceipt,
  type RegisterReceiptPayload,
  type RegisterReceiptResponse,
} from "@/lib/register-receipt";
import { upsertReceiptRecord } from "../supabase/receipts";

export async function POST(req: Request): Promise<Response> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {}
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: "Unauthorized" } satisfies RegisterReceiptResponse,
      { status: 401 }
    );
  }

  let body: Partial<RegisterReceiptPayload>;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { receiptNumber, noticeDate, priorityDate, caseLabel, source } = body;

  if (!receiptNumber || !isValidReceiptNumber(normalizeReceipt(receiptNumber))) {
    return Response.json(
      { error: "Invalid receipt number" } satisfies RegisterReceiptResponse,
      { status: 400 }
    );
  }

  if (!source || !["manual", "upload"].includes(source)) {
    return Response.json(
      { error: "Invalid source" } satisfies RegisterReceiptResponse,
      { status: 400 }
    );
  }

  const record = buildReceiptRecord({
    receiptNumber,
    noticeDate,
    priorityDate,
    caseLabel,
    source,
  });

  // 🔥 IMPORTANT FIX: pass supabase client + user.id
  const { data, error } = await upsertReceiptRecord(
    supabase,
    record,
    user.id
  );

  if (error || !data) {
    console.error("[DB ERROR]", error);
    return Response.json(
      { error: "Failed to save receipt" } satisfies RegisterReceiptResponse,
      { status: 500 }
    );
  }

  return Response.json(data, { status: 200 });
}