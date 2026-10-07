/**
 * Shared client for the official USCIS Developer Portal
 * (https://api.uscis.gov | sandbox: https://api-int.uscis.gov).
 *
 * Centralizes the mechanics validated during the Production Access demo:
 *  1. OAuth 2.0 client-credentials tokens (cached; refreshed near expiry).
 *  2. The assigned 4-digit `demo_id` header on every request
 *     (set USCIS_DEMO_ID; falls back to our current demo assignment).
 *  3. Sandbox/production base-URL switching via USCIS_ENV.
 */

const IS_PRODUCTION = process.env.USCIS_ENV === "production";

export const USCIS_BASE_URL = IS_PRODUCTION ? "https://api.uscis.gov" : "https://api-int.uscis.gov";

/** Demo ID assigned by USCIS to this application. Override via env when re-issued. */
export const USCIS_DEMO_ID = process.env.USCIS_DEMO_ID ?? "3734";

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Drop the cached token (e.g. after a 401) so the next call fetches a fresh one. */
export function invalidateUscisToken(): void {
  cachedToken = null;
}

/**
 * Get a valid USCIS access token: reuse the cached one when it is still good,
 * otherwise request a new one via the OAuth2 client-credentials flow.
 */
export async function getUscisAccessToken(): Promise<string> {
  // 60-second buffer avoids using a token that dies mid-request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.USCIS_CLIENT_ID;
  const clientSecret = process.env.USCIS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("USCIS API credentials are not configured.");
  }

  const tokenRes = await fetch(`${USCIS_BASE_URL}/oauth/accesstoken?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      demo_id: USCIS_DEMO_ID,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("USCIS Token Error:", errorText);
    throw new Error(`Failed to obtain USCIS access token (${tokenRes.status})`);
  }

  const tokenData = await tokenRes.json();
  // USCIS tokens normally last 30 minutes (1800 seconds).
  const expiresIn = tokenData.expires_in ?? 1800;

  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

/** Standard headers for USCIS portal data endpoints (auth + Accept + demo_id). */
export function uscisPortalHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    demo_id: USCIS_DEMO_ID,
  };
}
