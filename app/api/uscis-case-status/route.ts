import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import {
  USCIS_BASE_URL,
  getUscisAccessToken,
  uscisPortalHeaders,
  invalidateUscisToken,
} from "@/lib/uscis/portalClient";

// USCIS portal mechanics (OAuth2 client-credentials token, demo_id header,
// sandbox/production base URL) live in lib/uscis/portalClient.ts and are
// shared with the document-upload route.

// Checks that a receipt number looks valid before we bother calling USCIS.
// A valid receipt number is 3 uppercase letters followed by 10 digits (for example: EAC1234567890).
function validateReceiptNumber(receipt: string): boolean {
  return /^[A-Z]{3}\d{10}$/.test(receipt);
}

// This runs when the frontend sends a POST request to check a USCIS case status.
export async function POST(req: NextRequest) {
  try {
    // Create a Supabase client so we can check who is logged in and save history later.
    const supabase = await createClient();

    // Find out which user is making this request (from their login session).
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If nobody is logged in, reject the request with a 401 (Unauthorized).
    if (userError || !user) {
      console.error("USCIS Case Status GET unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Read the request body sent by the frontend and pull out the receipt number.
    const body = await req.json();
    const raw = body?.receiptNumber ?? "";

    // If the user did not send a receipt number, tell them it is required.
    if (!raw) {
      return NextResponse.json({ error: msg(E.USCIS_RECEIPT_REQUIRED) }, { status: 400 });
    }

    // Clean up the input: remove any dashes or spaces and make all letters uppercase.
    const normalized = raw.replace(/[-\s]/g, "").toUpperCase();

    // Make sure the cleaned-up receipt number is in the correct format before calling USCIS.
    if (!validateReceiptNumber(normalized)) {
      return NextResponse.json({ error: msg(E.USCIS_INVALID_RECEIPT) }, { status: 400 });
    }

    // Get a valid USCIS access token (reused from cache or freshly fetched).
    let accessToken = await getUscisAccessToken();

    // Ask USCIS for the current status of this case, sending our token to prove we are allowed.
    const fetchCaseStatus = (token: string) =>
      fetch(`${USCIS_BASE_URL}/case-status/${normalized}`, {
        headers: uscisPortalHeaders(token),
      });

    let caseRes = await fetchCaseStatus(accessToken);

    // Expired-token recovery: refresh once and retry transparently.
    if (caseRes.status === 401) {
      invalidateUscisToken();
      accessToken = await getUscisAccessToken();
      caseRes = await fetchCaseStatus(accessToken);
    }

    if (!caseRes.ok) {
      const errorBody = await caseRes.json().catch(() => null);
    
      console.error("USCIS Case API Error:", {
        status: caseRes.status,
        body: errorBody,
      });
    
      if (caseRes.status === 401) {
        invalidateUscisToken();
      }
    
      return NextResponse.json(
        {
          error: {
            code: errorBody?.code ?? caseRes.status,
            message:
              errorBody?.message ??
              "USCIS returned an error while processing the request.",
          },
        },
        { status: caseRes.status }
      );
    }

    // Read the successful response from USCIS.
    const caseData = await caseRes.json();

    // The useful details may be inside a "case_status" object, or the whole response may be the status.
    // This line picks whichever one actually holds the data.
    const caseStatus = caseData?.case_status ?? caseData;

    // Extract optional candidate association for multi-beneficiary scoping
    const candidateId = body?.candidateId || null;
    const candidateName = body?.candidateName || null;

    const rawDataToSave = {
      ...caseStatus,
      ...(candidateId ? { _candidateId: candidateId } : {}),
      ...(candidateName ? { _candidateName: candidateName } : {}),
    };

    // Save (or update) this lookup in our database so the user has a history of their checks.
    // "upsert" means: insert a new row, or update the existing row if this user already
    // checked this same receipt number before (that is what onConflict controls).
    const { error: historyError } = await supabase.from("uscis_case_history").upsert(
      {
        user_id: user.id,
        receipt_number: normalized,
        status: caseStatus.current_case_status_text_en ?? null,
        description: caseStatus.current_case_status_desc_en ?? null,
        form_type: caseStatus.formType ?? null,
        // Convert the "modified date" from USCIS into a standard date format, if it exists.
        modified_date: caseStatus.modifiedDate
          ? new Date(caseStatus.modifiedDate).toISOString()
          : null,
        checked_at: new Date().toISOString(),
        raw_data: rawDataToSave,
      },
      {
        // If a row already exists for this user + receipt number, update it instead of adding a duplicate.
        onConflict: "user_id,receipt_number",
      }
    );

    // If saving to history failed, just log it. We do not fail the whole request because the
    // user still got their case status - the history is a nice-to-have extra.
    if (historyError) {
      console.error("Failed to save USCIS history:", historyError);
    }

    // Send the case status back to the frontend.
    return NextResponse.json({
      receiptNumber: normalized,
      data: caseData,
    });
  } catch (err: unknown) {
    // Catch any unexpected error (network issue, bad JSON, etc.) so the app never crashes.
    console.error("USCIS Route Error:", err);
    return NextResponse.json({ error: msg(E.USCIS_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
