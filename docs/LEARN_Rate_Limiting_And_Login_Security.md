# Learn: Rate Limiting and Login Security

> A teaching companion to the login rate-limiting we just built in Rahvana.
> Written to make you interview-confident: concepts first (simple + technical),
> then exactly how our code implements each one, then a Q&A bank.

---

## 1. The one-sentence idea

**Rate limiting = capping how many times an action can be attempted in a time
window, so an attacker cannot try unlimited passwords (brute force) or hammer an
endpoint (scraping, spam, DoS).**

Analogy: a bank vault keypad that locks for 15 minutes after 5 wrong PINs. The
lock does not make your PIN stronger; it makes *guessing* impractical.

---

## 2. The problem we actually had (the key insight)

Before this change, Rahvana's login ran **in the browser**:

```ts
// client-side (old)
supabase.auth.signInWithPassword({ email, password })
```

That call goes **from the user's browser straight to Supabase's auth servers**
(`your-project.supabase.co/auth/v1/token`). It **never touches our server**.

Consequence: **we could not rate-limit login at all.** We can only rate-limit
requests that pass through *our* code. An attacker could run a script firing
thousands of guesses per second directly at Supabase, and our app would never
even see them.

> Interview soundbite: *"You can only enforce a control at a checkpoint the
> traffic actually passes through. Client-side login bypasses our server, so the
> fix was to move login behind our own server route - a proxy - and enforce the
> limit there."*

---

## 3. What we built (the architecture)

```
BEFORE:  Browser ───────────────► Supabase Auth      (our server never sees it)

AFTER:   Browser ──► /api/auth/login (OUR server) ──► Supabase Auth
                         │
                         ├─ 1. Rate limit check (per IP, per email+IP)
                         ├─ 2. If blocked -> 429 + audit "blocked"
                         ├─ 3. signInWithPassword (server-side)
                         ├─ 4. Audit success / failure
                         └─ 5. Set auth cookies on the response
```

Files:
- `app/api/auth/login/route.ts` - the new server route (the checkpoint).
- `app/context/AuthContext.tsx` - `signIn()` now `fetch("/api/auth/login")`
  instead of calling Supabase directly.
- `lib/security/rate-limit.ts` - the limiter (already existed; now used here).
- `lib/security/audit-log.ts` - records every attempt.

Why the session still works: our browser client is cookie-based
(`createBrowserClient` from `@supabase/ssr`). The server route sets the auth
cookies on its response; the login page then does a full page reload
(`window.location.assign`), and the browser re-reads the session from those
cookies. MFA verification was already server-side, so it keeps working.

---

## 4. Rate-limiting algorithms (classic interview question)

There are four you should be able to name and compare:

| Algorithm | How it works | Pro | Con |
|-----------|--------------|-----|-----|
| **Fixed window** | Count requests per fixed clock window (e.g. per minute). Reset at boundary. | Simplest | "Boundary burst": 2x allowed across a window edge |
| **Sliding window** | Window moves with time; count only requests in the last N ms. | Smooth, no boundary burst | Slightly more state |
| **Token bucket** | Bucket refills tokens at a fixed rate; each request spends one. Allows bursts up to bucket size. | Allows controlled bursts | Tuning burst vs rate |
| **Leaky bucket** | Requests queue and drain at a fixed rate. | Smooths output rate | Adds latency/queueing |

**What we use:** a **sliding-window-style** counter in
`lib/security/rate-limit.ts` - each key has `{ count, resetAt }`; when the window
expires it resets. (Technically a fixed window per key, kept simple on purpose.)

> Interview tip: token bucket is the most common answer for APIs because it
> allows short legitimate bursts while capping sustained rate.

---

## 5. What key do you limit on? (design tradeoffs)

The "key" decides *who* shares a limit. This is where most candidates are weak,
so know the tradeoffs:

| Key | Stops | Weakness |
|-----|-------|----------|
| **Per IP** | One machine spraying many accounts | Shared IPs (offices, NAT, mobile) hurt real users; attacker can rotate IPs |
| **Per account (email)** | One account being hammered from anywhere | Attacker can lock out a victim on purpose (DoS by lockout) |
| **Per IP + account** | One machine hammering one account | Distributed attack (many IPs, one account) slips through |
| **Global / per route** | Total flood | Too blunt; punishes everyone |

**Best practice:** combine several. We use **per-IP (10/15min)** AND
**per-email+IP (5/15min)** in `app/api/auth/login/route.ts`. The email cap is
tight; the IP cap catches spraying.

```ts
const ipLimit = checkRateLimit(request, "auth-login", { maxAttempts: 10 });
if (!ipLimit.allowed) return rateLimitResponse(ipLimit);
// ...
const emailLimit = checkRateLimit(request, `auth-login:${email}`, { maxAttempts: 5 });
if (!emailLimit.allowed) return rateLimitResponse(emailLimit);
```

---

## 6. In-memory vs distributed (the scaling limitation)

Our limiter stores counters in a **Map in memory**. On a serverless/multi-server
host (Vercel, Render) each instance has its **own** memory, so:

- The effective limit is *per instance*, so real limit ~= configured x number of
  instances.
- A cold start wipes the counters.

**Fix at scale:** a **shared store** - Redis, usually **Upstash** for
serverless. All instances read/write the same counters, so the limit is global
and survives restarts. Libraries: `@upstash/ratelimit`.

> Interview soundbite: *"In-memory rate limiting is fine for a single server but
> leaks across a serverless fleet because each instance has its own memory. For
> a real global limit you need a shared store like Redis/Upstash."*

Our code even documents this - see the header comment in `rate-limit.ts`.

---

## 7. HTTP semantics: 429 and Retry-After

When blocked, return **HTTP 429 Too Many Requests** with a **`Retry-After`**
header (seconds until they can try again). Optional: `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `X-RateLimit-Reset`.

Our `rateLimitResponse()` does exactly this:
```
HTTP 429
Retry-After: 812
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
```

Good clients (and CDNs) respect `Retry-After` and back off.

---

## 8. Account enumeration (why the error message matters)

If login says *"no such email"* vs *"wrong password"*, an attacker learns which
emails are registered - free reconnaissance. The fix: **one generic message for
both** ("Invalid email or password"). We do this in the route: any credential
failure returns the same `AUTH_LOGIN_FAILED` message. Same idea applies to signup
and password reset ("if that email exists, we sent a link").

> This ties rate limiting to a broader principle: **do not leak which guesses
> were 'close.'**

---

## 9. The full brute-force defense stack

Rate limiting is one layer. A strong login stacks several:

1. **Rate limiting** - slow the guessing (what we built).
2. **Account lockout / exponential backoff** - after N fails, add growing delays
   or a temporary lock. (Careful: pure lockout enables denial-of-service against
   a victim; backoff is often safer.)
3. **MFA (multi-factor)** - even a correct password is not enough. Rahvana has
   TOTP MFA (`/api/auth/mfa/verify-login`).
4. **CAPTCHA / proof-of-work** - after suspicious activity, force a human check.
5. **Breached-password check** - reject passwords found in known leaks
   (e.g. HaveIBeenPwned k-anonymity API). Defends **credential stuffing**
   (attackers reuse leaked email+password pairs).
6. **Strong password policy** - `lib/security/password.ts` (`validateStrongPassword`).
7. **Audit + detection** - log every attempt; alert on bursts (see section 10).

Know the difference:
- **Brute force** = guessing many passwords for one account.
- **Password spraying** = one common password against many accounts (evades
  per-account limits - why the per-IP cap matters).
- **Credential stuffing** = replaying leaked email+password pairs (rate limiting
  helps, but breached-password checks + MFA are the real fix).

---

## 10. Detection ties in

Rate limiting *prevents*; logging + alerting *detects*. Every login attempt now
writes to `audit_logs` (success/failure/blocked) via `lib/security/audit-log.ts`.
The next step (separate task) is **alerting** on patterns like "5+ failed logins
in 5 minutes" - which is exactly the data we now capture.

> Prevention closes the door; detection tells you if someone kept trying anyway.

---

## 11. How OUR code maps to the concepts (cheat sheet)

| Concept | Where in Rahvana |
|---------|------------------|
| Checkpoint / proxy | `app/api/auth/login/route.ts` |
| Client uses the proxy | `app/context/AuthContext.tsx` -> `signIn()` |
| Limiter algorithm + store | `lib/security/rate-limit.ts` |
| Keying (IP + email+IP) | `checkRateLimit(req, "auth-login" / \`auth-login:${email}\`)` |
| 429 + Retry-After | `rateLimitResponse()` |
| Generic error (anti-enumeration) | login route returns `AUTH_LOGIN_FAILED` for all cred failures |
| Audit success/failure/blocked | `lib/security/audit-log.ts` wrappers |
| MFA layer | `app/api/auth/mfa/verify-login/route.ts` |
| Strong password | `lib/security/password.ts` |
| Known limitation (Redis TODO) | header comment in `rate-limit.ts` |

---

## 12. Interview Q&A bank

**Q: What is rate limiting and why do you need it on login?**
A: Capping attempts per time window. On login it stops brute force / credential
stuffing - without it, an attacker can guess passwords indefinitely.

**Q: We had client-side login. Why couldn't we just add a limiter?**
A: The browser called the auth provider directly, bypassing our server. A control
only works at a checkpoint the traffic passes through, so we moved login behind a
server route and enforced the limit there.

**Q: Which algorithm would you use?**
A: Token bucket for general APIs (allows small bursts, caps sustained rate).
Sliding window if you want strict smoothing. Fixed window is simplest but has the
boundary-burst problem.

**Q: What do you key the limit on?**
A: A combination - per IP (stops spraying) and per account (stops hammering one
user). Pure per-account risks lockout-DoS; pure per-IP hurts shared networks.

**Q: Your limiter is in memory. What breaks at scale?**
A: Each server/serverless instance has its own memory, so the global limit is
looser than configured and resets on cold starts. Fix: a shared store like
Redis/Upstash.

**Q: What HTTP status and header?**
A: 429 Too Many Requests with Retry-After (seconds), optionally X-RateLimit-*.

**Q: How do you avoid account enumeration?**
A: Same generic message for "wrong email" and "wrong password"; same for reset
("if the email exists...").

**Q: Rate limiting vs account lockout?**
A: Rate limiting slows everyone a bit; lockout blocks an account after N fails but
can be abused to deny service to a victim. Exponential backoff is a middle ground.

**Q: How does this fit the bigger picture?**
A: Defense in depth - rate limit + MFA + strong passwords + breached-password
checks + audit/alerting. No single layer is enough.

---

## 13. What to test before shipping (behavioral)

Because this touches the login path, verify in a running app:
1. Correct credentials -> logged in and redirected.
2. Wrong password -> generic error, no hint about which field was wrong.
3. 6 quick wrong attempts on one email -> HTTP 429 with a "try again in N min".
4. MFA user -> code prompt appears and verification completes.
5. Unconfirmed email -> the specific "confirm your email" message still shows.

---

---

## 14. The Redis/Upstash upgrade (what we shipped)

We turned the single-server limiter into one that works across a serverless
fleet - **without adding a dependency**.

File: `lib/security/rate-limit-redis.ts`, function `checkRateLimitRedis()`.

How it decides:
- If `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set -> use Upstash.
- Otherwise -> fall back to the in-memory limiter (so dev/local still works).
- If Upstash errors or times out -> also fall back (fail OPEN, so a Redis outage
  never bricks login).

The Redis mechanic (fixed window) in one pipeline round trip:
```
INCR key            # atomic +1, returns the new count
PEXPIRE key ms NX   # set the window expiry only on the first hit
PTTL key            # ms left -> Retry-After
```
`INCR` is **atomic**, so even if 10 servers hit Redis at the same millisecond,
the count is exact - no race. That atomicity is the whole reason a shared store
beats per-instance memory.

To activate in production: create an Upstash Redis database, copy its REST URL +
token into the two env vars. No code change, no redeploy of logic - the limiter
detects the env vars and switches backends.

> Interview soundbite: *"We made the backend pluggable. In-memory for a single
> node, Redis for a fleet, and it fails open on a Redis outage so availability
> is never sacrificed for rate limiting."*

---

## 15. Detection and alerting (turning logs into an alarm)

Rate limiting is **prevention** - it slows the attack. **Detection** answers a
different question: *if someone keeps trying anyway, would we notice - in minutes
or in months?* Both security decks end on this exact point.

We already recorded events in `audit_logs` (every login success/failure/blocked).
The missing half was that **nobody was watching**. We added the watcher.

### What we built
- `lib/security/alerting.ts` -> `runSecurityScan()`: queries recent `audit_logs`,
  aggregates by IP and by account, and compares to thresholds:
  - 5+ failed logins from one IP in 5 min (brute force)
  - 5+ failed logins for one account in 5 min (targeted)
  - 10+ blocked/rate-limited hits from one IP in 10 min (probing/spray)
- When a threshold trips, it emails a human (Resend) and logs to the console.
- A **cooldown** (30 min per finding) stops alert spam.
- Two triggers:
  1. **Periodic** - Vercel Cron hits `GET /api/cron/security-scan` every 10 min
     (`vercel.json`), protected by a `CRON_SECRET` bearer token.
  2. **Near-real-time** - the login route calls a **self-throttled**
     `maybeRunSecurityScan()` (max once / 30s per instance) right after a failed
     login, so a burst is caught fast without flooding the DB.

### Key design ideas (interview-worthy)
- **Prevention vs detection**: *"You cannot prevent every attack, so you invest
  in noticing fast. Prevention closes the door; detection tells you if someone
  kept knocking."*
- **Thresholds + windows**: an alert is "N events of type X in the last M
  minutes." Too sensitive = alert fatigue; too loose = missed attacks.
- **Alert fatigue / cooldown**: if every event pages you, you stop reading the
  pages. Dedupe and cooldown are part of good alerting, not an afterthought.
- **Throttling the trigger**: detection must not become its own DoS. During a
  flood we run at most one scan per 30s, and the cron is the reliable backstop.
- **Protect the endpoint**: a cron route that anyone can call is itself an
  attack surface - hence the `CRON_SECRET` bearer check.
- **What to alert on** (the deck's list): failed-login bursts, unusual data
  export (one user reading many others' files), 403 spikes, admin/role changes
  outside business hours.

### How we proved it works (live)
Fired 6 failed logins from one spoofed IP, then called the scan:
```json
{ "findings": [ { "type": "failed_login_ip", "key": "203.0.113.55",
                  "count": 6, "threshold": 5, "windowMin": 5 } ],
  "alerted": true, "checked": { "failedLogins": 6, "blocked": 0 } }
```
And an unauthenticated call to the cron route returned `401` - the secret check
works.

### Env to set in production
| Var | Purpose |
|-----|---------|
| `CRON_SECRET` | Bearer token Vercel Cron sends; blocks public triggering |
| `SECURITY_ALERT_EMAIL` | Where alert emails go (falls back to first `ADMIN_EMAILS`) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Activate distributed rate limiting |

### Q&A additions
**Q: Difference between logging and monitoring/alerting?**
A: Logging records what happened; alerting watches those logs against thresholds
and notifies a human. Logs with nobody watching = evidence you only read after
the damage.

**Q: How do you avoid alert fatigue?**
A: Tune thresholds, dedupe, add cooldowns, and rank by severity. An alert nobody
reads is worse than none because it creates false confidence.

**Q: Isn't running a scan on every failed login expensive?**
A: Yes, so we self-throttle (once / 30s) and lean on a periodic cron as the
backstop. Detection must never become a self-inflicted DoS.

---

*Companion to `SECURITY_AUDIT_Breaking_and_Entering.md` and
`SECURITY_FIX_CHECKLIST.md`.*
