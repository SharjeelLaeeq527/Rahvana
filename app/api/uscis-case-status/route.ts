import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

// This route talks to the official USCIS "Torch" API to look up a case status.
// There are two USCIS servers: a test one (sandbox) and the real one (production).
// We pick the real server only when USCIS_ENV is set to "production", otherwise we use the test server.
const IS_PRODUCTION = process.env.USCIS_ENV === "production";
const BASE_URL = IS_PRODUCTION ? "https://api.uscis.gov" : "https://api-int.uscis.gov";

// USCIS gives us a temporary "access token" (like a short-lived password) to call their API.
// We keep the last token here in memory so we don't have to ask for a new one on every request.
// Note: on serverless this memory can reset on a cold start, which is fine - we just fetch a fresh one.
let cachedToken: { token: string; expiresAt: number } | null = null;

// Gets a valid USCIS access token: reuse the saved one if it is still good, otherwise fetch a new one.
async function getAccessToken(): Promise<string> {
  // If we already have a token and it will not expire in the next 60 seconds, reuse it.
  // The 60-second buffer avoids using a token that dies mid-request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  // Read our USCIS login credentials from environment variables (kept secret, not in the code).
  const clientId = process.env.USCIS_CLIENT_ID;
  const clientSecret = process.env.USCIS_CLIENT_SECRET;

  // If the credentials were never set up, stop here with a clear error.
  if (!clientId || !clientSecret) {
    throw new Error("USCIS API credentials are not configured.");
  }

  // Ask USCIS for a fresh access token using our client id and secret (OAuth "client credentials" flow).
  const tokenRes = await fetch(`${BASE_URL}/oauth/accesstoken?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      demo_id: "3734",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  // If USCIS did not give us a token, log the reason and throw so the caller can handle it.
  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("USCIS Token Error:", errorText);
    throw new Error(`Failed to obtain USCIS access token (${tokenRes.status})`);
  }

  // Read the token details from the response.
  const tokenData = await tokenRes.json();
  // USCIS tokens normally last 30 minutes (1800 seconds). If they do not tell us, assume 30 minutes.
  const expiresIn = tokenData.expires_in ?? 1800;

  // Save the new token and calculate the exact time it will expire (now + lifetime).
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

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
    const accessToken = await getAccessToken();

    // Ask USCIS for the current status of this case, sending our token to prove we are allowed.
    const caseRes = await fetch(`${BASE_URL}/case-status/${normalized}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        demo_id: "3734",
      },
    });

    // If USCIS did not return a successful response, figure out why and reply accordingly.
    if (!caseRes.ok) {
      // 404 means USCIS has no case with this receipt number.
      if (caseRes.status === 404) {
        return NextResponse.json({ error: msg(E.USCIS_NO_CASE_FOUND) }, { status: 404 });
      }

      // 401 means our token was rejected. Throw away the saved token so the next request gets a new one.
      if (caseRes.status === 401) {
        cachedToken = null;
        return NextResponse.json({ error: msg(E.USCIS_AUTH_FAILED) }, { status: 401 });
      }

      // Any other error: log the details and pass the same status code back to the caller.
      const errorBody = await caseRes.text();
      console.error("USCIS Case API Error:", caseRes.status, errorBody);
      return NextResponse.json({ error: msg(E.USCIS_SERVICE_ERROR) }, { status: caseRes.status });
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
        status: caseStatus.current_case_status_en ?? null,
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
