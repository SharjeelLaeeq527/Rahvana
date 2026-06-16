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

// DEPRECATED: Use /api/receipt/journey (case_data) for all new receipt storage.
export async function POST() {
  return Response.json(
    {
      error:
        "This endpoint is deprecated. Use /api/receipt/journey with journeyId for all receipt storage.",
    },
    { status: 410 }
  );
}
