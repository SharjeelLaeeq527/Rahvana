import { NextRequest, NextResponse } from "next/server";

// USCIS Torch API — sandbox: api-int.uscis.gov | production: api.uscis.gov
const IS_PRODUCTION = process.env.USCIS_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://api.uscis.gov"
  : "https://api-int.uscis.gov";

// Simple in-memory token cache (acceptable for serverless cold-start resets)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token with 60-second buffer before expiry
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.USCIS_CLIENT_ID;
  const clientSecret = process.env.USCIS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("USCIS API credentials are not configured.");
  }

  const tokenRes = await fetch(
    `${BASE_URL}/oauth/accesstoken?grant_type=client_credentials`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("USCIS Token Error:", errorText);
    throw new Error(`Failed to obtain USCIS access token (${tokenRes.status})`);
  }

  const tokenData = await tokenRes.json();
  // Access tokens expire every 30 minutes per USCIS docs
  const expiresIn = tokenData.expires_in ?? 1800;

  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

function validateReceiptNumber(receipt: string): boolean {
  // Format: 3 uppercase letters + 10 digits
  return /^[A-Z]{3}\d{10}$/.test(receipt);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = body?.receiptNumber ?? "";

    if (!raw) {
      return NextResponse.json(
        { error: "Receipt number is required." },
        { status: 400 }
      );
    }

    // Normalize: strip dashes/spaces, uppercase
    const normalized = raw.replace(/[-\s]/g, "").toUpperCase();

    if (!validateReceiptNumber(normalized)) {
      return NextResponse.json(
        {
          error:
            "Invalid receipt number format. Expected 3 letters followed by 10 digits (e.g. MSC2490000001).",
        },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const caseRes = await fetch(`${BASE_URL}/case-status/${normalized}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!caseRes.ok) {
      if (caseRes.status === 404) {
        return NextResponse.json(
          {
            error:
              "No case found for this receipt number. Please verify the number and try again.",
          },
          { status: 404 }
        );
      }

      if (caseRes.status === 401) {
        // Clear cached token so next request re-authenticates
        cachedToken = null;
        return NextResponse.json(
          { error: "Authentication failed. Please try again shortly." },
          { status: 401 }
        );
      }

      const errorBody = await caseRes.text();
      console.error("USCIS Case API Error:", caseRes.status, errorBody);
      return NextResponse.json(
        { error: `USCIS service returned an error (${caseRes.status}).` },
        { status: caseRes.status }
      );
    }

    const caseData = await caseRes.json();

    return NextResponse.json({
      receiptNumber: normalized,
      data: caseData,
    });
  } catch (err: unknown) {
    console.error("USCIS Route Error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
