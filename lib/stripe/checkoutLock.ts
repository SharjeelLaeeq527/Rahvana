/**
 * lib/stripe/checkoutLock.ts
 *
 * Short-lived per-user lock around the subscription-checkout critical section.
 *
 * WHY: the Stripe `subscriptions.list()` guard in the checkout route prevents
 * duplicates in the common case, but two concurrent requests can BOTH read
 * "no subscription" before either creates one (a classic check-then-act race,
 * e.g. a double-clicked "Subscribe" button or a retried request). This lock
 * makes the guard+create sequence mutually exclusive per user, so the second
 * request is rejected instead of creating a second subscription.
 *
 * Backend: Upstash Redis via its REST API (atomic `SET NX PX`) when configured —
 * the only option that works across serverless/multi-instance hosts. When
 * Upstash is absent we fall back to a best-effort in-process lock (correct only
 * within a single instance). Either way this is defence-in-depth: the
 * verify-session / webhook `cancelDuplicateSubscriptions` cleanup is the
 * backstop that guarantees a single live sub even if the lock fails open.
 *
 * The lock auto-expires after LOCK_TTL_MS, so a crash mid-checkout can never
 * deadlock a user out of purchasing.
 *
 * OWNERSHIP (why the token): each acquire stores a unique random token as the
 * lock value and hands it back to the caller. Release only removes the lock if
 * it STILL holds that exact token (an atomic compare-and-delete). Without this,
 * a slow request whose lock had already expired and been re-acquired by another
 * request would delete the OTHER request's live lock on the way out, letting a
 * third request in. The token makes "release only what I own" safe.
 */

import * as crypto from "crypto";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function upstashEnabled(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

// Enough to cover a Stripe session create + payment-row insert; auto-expires.
const LOCK_TTL_MS = 15000;

// Best-effort single-instance fallback: key -> { expiry(ms), token }.
const memoryLocks = new Map<string, { expiry: number; token: string }>();

/**
 * Result of an acquire attempt.
 *  - ok=true  → the caller may proceed. `token` is the ownership token to pass
 *               back to releaseCheckoutLock (null when we failed OPEN on a Redis
 *               error and therefore hold nothing to release).
 *  - ok=false → another checkout for this user is in flight; caller must reject.
 */
export interface CheckoutLockResult {
  ok: boolean;
  token: string | null;
}

let warnedInMemory = false;
function warnInMemoryLockOnce() {
  if (warnedInMemory) return;
  warnedInMemory = true;
  console.warn(
    "[checkoutLock] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory lock. " +
      "This does NOT prevent duplicate checkouts across multiple server instances. " +
      "Set Upstash in production for cross-instance protection."
  );
}

async function upstashPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    return json.map((entry) => entry.result);
  } catch {
    return null;
  }
}

function lockKey(userId: string): string {
  return `lock:checkout:${userId}`;
}

/**
 * Tries to acquire the checkout lock for `userId`.
 * @returns { ok, token } — see CheckoutLockResult. Fails OPEN (ok:true,
 *   token:null) if the Redis backend errors — availability over strictness,
 *   with the cleanup step as the safety net.
 */
export async function acquireCheckoutLock(userId: string): Promise<CheckoutLockResult> {
  const key = lockKey(userId);
  const token = crypto.randomBytes(16).toString("hex");

  if (upstashEnabled()) {
    const results = await upstashPipeline([
      ["SET", key, token, "NX", "PX", String(LOCK_TTL_MS)],
    ]);
    // Network/config error -> fail open so a Redis blip never blocks purchases.
    // We set nothing, so we own nothing: token is null and release is a no-op.
    if (results === null) return { ok: true, token: null };
    // "OK" => we set it (acquired); null => key already existed (held elsewhere).
    if (results[0] === "OK") return { ok: true, token };
    return { ok: false, token: null };
  }

  // In-process fallback (single instance only). Warn once so ops know the lock is
  // NOT effective across multiple serverless instances until Upstash is set.
  warnInMemoryLockOnce();
  const now = Date.now();
  const existing = memoryLocks.get(key);
  if (existing && existing.expiry > now) return { ok: false, token: null };
  memoryLocks.set(key, { expiry: now + LOCK_TTL_MS, token });
  return { ok: true, token };
}

/**
 * Releases the checkout lock for `userId`, but ONLY if it still holds `token`
 * (the value returned by acquireCheckoutLock). Passing a null/undefined token
 * (e.g. after a fail-open acquire) is a safe no-op. Never throws.
 */
export async function releaseCheckoutLock(
  userId: string,
  token: string | null
): Promise<void> {
  if (!token) return; // we own nothing — never delete another request's lock.
  const key = lockKey(userId);

  if (upstashEnabled()) {
    // Atomic compare-and-delete: remove the key only if its value is OUR token.
    await upstashPipeline([
      [
        "EVAL",
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        "1",
        key,
        token,
      ],
    ]);
    return;
  }

  const existing = memoryLocks.get(key);
  if (existing && existing.token === token) memoryLocks.delete(key);
}
