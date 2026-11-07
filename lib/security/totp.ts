// lib/security/totp.ts
/**
 * Edge-compatible TOTP (RFC 6238) and HMAC-signed session cookie utilities.
 * Uses native Web Crypto API (supported in Node.js, Vercel Edge, browsers).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const STAGING_SESSION_COOKIE_NAME = "staging_totp_session";
export const STAGING_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Generates a cryptographically random Base32 secret string (standard 20 bytes = 32 chars).
 */
export function generateBase32Secret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Builds the standard otpauth:// URI that authenticator apps expect.
 */
export function getOtpAuthUri(
  username: string,
  secret: string,
  issuer: string = "Rahvana Staging"
): string {
  const label = encodeURIComponent(`${issuer}:${username}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Decodes a Base32 string to bytes.
 */
function base32Decode(str: string): Uint8Array {
  const clean = str.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Generates a 6-digit TOTP token at a given timestamp using HMAC-SHA1.
 */
export async function generateTOTP(
  secret: string,
  time: number = Date.now(),
  step: number = 30,
  digits: number = 6
): Promise<string> {
  const counter = Math.floor(time / 1000 / step);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Big-endian 64-bit integer
  counterView.setUint32(0, Math.floor(counter / 0x100000000));
  counterView.setUint32(4, counter & 0xffffffff);

  const keyBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, counterBuffer);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, "0");
}

/**
 * Verifies a 6-digit TOTP token against a secret.
 * window = 1 checks current step, -30s, and +30s to tolerate phone clock drift.
 */
export async function verifyTOTP(
  token: string,
  secret: string,
  window: number = 1,
  step: number = 30
): Promise<boolean> {
  if (!token || !secret) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) return false;

  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    const checkTime = now + i * step * 1000;
    const expected = await generateTOTP(secret, checkTime, step);
    if (cleanToken === expected) {
      return true;
    }
  }
  return false;
}

// ==========================================
// User Secret Resolver (from STAGING_TOTP_KEYS)
// Format: username1:BASE32KEY,username2:BASE32KEY
// ==========================================

/**
 * Returns all active secrets configured for a given username.
 * Supports multiple keys per user (useful during key rotation or multiple devices).
 */
export function getAllStagingTotpSecretsForUser(username: string): string[] {
  if (!username) return [];
  const normalizedUser = username.trim().toLowerCase();

  const raw = process.env.STAGING_TOTP_KEYS || "";
  const entries = raw
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

  const secrets: string[] = [];
  for (const entry of entries) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) continue;
    const user = entry.substring(0, colonIdx).trim().toLowerCase();
    const secret = entry.substring(colonIdx + 1).trim();
    if (user === normalizedUser && secret && !secrets.includes(secret)) {
      secrets.push(secret);
    }
  }

  // Also check single fallback key if configured
  if (
    process.env.STAGING_TOTP_SECRET &&
    normalizedUser === "staging" &&
    !secrets.includes(process.env.STAGING_TOTP_SECRET.trim())
  ) {
    secrets.push(process.env.STAGING_TOTP_SECRET.trim());
  }

  return secrets;
}

export function getStagingTotpSecretForUser(username: string): string | null {
  const secrets = getAllStagingTotpSecretsForUser(username);
  return secrets.length > 0 ? secrets[0] : null;
}

export function getAllStagingTotpUsers(): string[] {
  const raw = process.env.STAGING_TOTP_KEYS || "";
  const entries = raw
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

  const users: string[] = [];
  for (const entry of entries) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) continue;
    const user = entry.substring(0, colonIdx).trim();
    if (user && !users.includes(user)) {
      users.push(user);
    }
  }
  return users;
}

// ==========================================
// Signed Session Cookie Creation & Validation
// ==========================================

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSigningSecret(): string {
  return (
    process.env.STAGING_AUTH_SECRET ||
    "rahvana-staging-auth-session-secret-key-2026-production-salt"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacSignKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Creates an HMAC-signed session cookie value valid for 30 days.
 */
export async function createStagingSessionToken(
  username: string,
  maxAgeSeconds: number = STAGING_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const payloadObj = {
    u: username.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadBytes = encoder.encode(JSON.stringify(payloadObj));
  const payloadStr = toBase64Url(payloadBytes);

  const secret = getSigningSecret();
  const key = await getHmacSignKey(secret);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
  const sigStr = toBase64Url(new Uint8Array(sigBuffer));

  return `${payloadStr}.${sigStr}`;
}

/**
 * Verifies the HMAC signature and expiration of a staging session token.
 */
export async function verifyStagingSessionToken(
  token?: string | null
): Promise<{ valid: boolean; username?: string; reason?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "missing" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "malformed" };
  }

  const [payloadStr, sigStr] = parts;
  const secret = getSigningSecret();
  const key = await getHmacSignKey(secret);
  const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
  const expectedSigStr = toBase64Url(new Uint8Array(expectedSigBuffer));

  // Constant-time compare signature
  if (sigStr !== expectedSigStr) {
    return { valid: false, reason: "invalid_signature" };
  }

  try {
    const payloadBytes = fromBase64Url(payloadStr);
    const payload = JSON.parse(decoder.decode(payloadBytes)) as { u: string; exp: number };
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || now > payload.exp) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true, username: payload.u };
  } catch {
    return { valid: false, reason: "payload_decode_failed" };
  }
}
