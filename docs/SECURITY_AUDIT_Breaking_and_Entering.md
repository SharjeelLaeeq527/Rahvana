# Rahvana Security - Complete Master Guide

> **One document for everything.** It merges the two security decks
> (`Breaking-and-Entering.pdf` = how attacks happen, and
> `Security_Roadmap_for_SaaS.pptx.pdf` = how to defend and mature) with a real,
> read-only audit of the Rahvana codebase.
>
> Every item is written **twice**: a **Simple version** (plain English, for the
> boss or any non-technical person, with an analogy) and a **Technical version**
> (what actually happens in code, with file and line evidence). It clearly
> splits **what we HAVE built** from **what we have NOT built yet**, and tells you
> exactly **how to explain each gap to your boss**.

- **App:** Rahvana (Next.js App Router + Supabase + Python/FastAPI backend)
- **Sources:** `docs/Breaking-and-Entering.pdf`, `docs/Security_Roadmap_for_SaaS.pptx.pdf`
- **Audit date:** 2026-08-03 (findings verified directly against the code)
- **Scope:** Defensive, read-only. No production data touched.

---

## Table of contents

1. [Executive summary (read this to the boss)](#1-executive-summary-read-this-to-the-boss)
2. [Why security matters](#2-why-security-matters)
3. [How attacks actually happen (the Kill Chain)](#3-how-attacks-actually-happen-the-kill-chain)
4. [OWASP Top 10:2025 mapped to us](#4-owasp-top-102025-mapped-to-us)
5. [Master scorecard (one screen)](#5-master-scorecard-one-screen)
6. [What we HAVE implemented (our strengths)](#6-what-we-have-implemented-our-strengths)
7. [What we have NOT implemented yet (the gaps)](#7-what-we-have-not-implemented-yet-the-gaps)
8. [Defense checklists by area](#8-defense-checklists-by-area)
9. [Our 90-day roadmap](#9-our-90-day-roadmap)
10. [Ready-to-use boss briefing script](#10-ready-to-use-boss-briefing-script)
11. [Glossary](#11-glossary)

---

## 1. Executive summary (read this to the boss)

**Simple version (say this out loud):**
"I checked our app against two professional security guides and the industry
standard OWASP Top 10. The good news is our foundation is strong - the way we
protect customer data in the database, the way we handle logins and passwords,
and our basic protections are all solid, better than most startups. There are
some gaps, and almost all of them are cheap to fix. Two of them I want to fix
today because they are live risks. I have written a simple 30/60/90 day plan."

**One-line version:**
"Core security is strong; the gaps are dependency cleanup, login rate-limiting,
alerting, and finishing upload validation - mostly hours of work, and two items
(committed customer files + critical dependencies) should be done today."

**The numbers:**

| | Count |
|---|---|
| Things we already do well | 8 |
| Gaps to fix (partial or missing) | 8 |
| Live risks to fix immediately | 2 |
| Known dependency vulnerabilities | 38 (2 critical, 33 high) |

---

## 2. Why security matters

**Simple version:** Our product holds people's passports, personal documents,
and immigration data. That trust IS the product. If that data leaks, we do not
lose a feature - we lose the company's reputation, customers, and possibly face
legal trouble. Security is not a separate feature; it is part of the product
working at all.

**Technical version:** The roadmap deck frames it as three business drivers -
**Trust** (customers hand us PII), **Continuity** (a breach stops the business,
not just a feature), and **Compliance** (handling PII carries legal duties). The
stated goal: *prevent predictable failures before production, detect abuse
quickly, and recover without chaos.* We are not chasing a perfect wall; we are
removing cheap, obvious holes and making sure we would notice a break-in in
hours, not months.

---

## 3. How attacks actually happen (the Kill Chain)

**Simple version:** A break-in is never one dramatic moment. A burglar first
walks the street and checks for cameras and dogs, then tries a few doors, gets
in, moves room to room, takes the valuables, and leaves - hopefully setting off
an alarm. Digital attacks follow the exact same steps. If we defend each step,
we win even if one step fails.

**Technical version:** Both decks describe the same 5-stage model:

| Stage | Burglar | Digital attack |
|-------|---------|----------------|
| 1. Recon | Walk the block | Read headers, errors, DNS, find hidden pages |
| 2. Get in | Pick the lock | Phishing, brute force, SQLi, XSS, open redirect |
| 3. Move around | Room to room | Path traversal, bad file uploads, SSRF |
| 4. Take the goods | Steal valuables | Exfiltrate documents, PII, financial data |
| 5. Get caught (or not) | Alarm or silence | Detection and alerting |

**The key lesson from both decks:** most breaches are chains of small
weaknesses, not one "Hollywood hack." We do not need perfection - we need to
raise the attacker's cost at every stage and detect fast when something slips.

---

## 4. OWASP Top 10:2025 mapped to us

**Simple version:** OWASP Top 10 is the security industry's official list of the
10 most common ways web apps get hacked. Here is how we score on each - green
means we are good, yellow means partial, red means weak.

**Technical version:**

| OWASP 2025 | Plain meaning | Our status |
|------------|---------------|------------|
| A01 Broken Access Control | Users reach data they should not | Strong (RLS) + 2 small gaps |
| A02 Security Misconfiguration | Leaky defaults, headers, errors | Concern |
| A03 Supply Chain Failures | Vulnerable dependencies | Weakest area |
| A04 Cryptographic Failures | Weak or misused crypto | Good |
| A05 Injection | SQLi, XSS | SQLi strong; XSS partial |
| A06 Insecure Design | Missing controls by design | Partial |
| A07 Authentication Failures | Weak login/brute-force defense | Partial |
| A08 Software/Data Integrity | Untrusted code/updates, CI/CD | Partial |
| A09 Logging & Alerting Failures | Cannot detect abuse | Partial |
| A10 Exceptional Conditions | Errors leak or fail unsafely | Concern |

**Priority order for a SaaS (from the roadmap):** Access Control ->
Misconfiguration -> Supply Chain -> Auth -> Logging. Our plan in Part 9 follows
exactly this.

---

## 5. Master scorecard (one screen)

Legend: DONE = implemented well. PARTIAL = started but has a gap. MISSING = not
built. FIX NOW = live risk.

| # | Topic | OWASP | Status |
|---|-------|-------|--------|
| 1 | Database access control (RLS) | A01 | DONE |
| 2 | SQL injection protection | A05 | DONE |
| 3 | Security headers | A02 | DONE |
| 4 | Password reset security | A04/A07 | DONE |
| 5 | Audit logging (recording events) | A09 | DONE |
| 6 | Guarded debug/admin endpoints | A01 | DONE |
| 7 | CORS allowlist (no wildcard) | A02 | DONE |
| 8 | Input schema validation (zod) | A03 | DONE |
| 9 | Login brute-force / rate limiting | A07 | PARTIAL |
| 10 | Open redirect (OAuth callback) | A01 | PARTIAL |
| 11 | File upload content validation | A06 | PARTIAL |
| 12 | Path traversal protection | A01 | PARTIAL |
| 13 | Verbose error messages | A02/A10 | PARTIAL |
| 14 | Request size / DoS limits | A06 | PARTIAL |
| 15 | XSS sanitization | A05 | PARTIAL |
| 16 | Detection / alerting | A09 | MISSING |
| 17 | Server version header hidden | A02 | MISSING |
| 18 | Dependency vulnerabilities | A03/A08 | MISSING |
| 19 | Customer files committed to git | A02 | FIX NOW |
| 20 | SSRF | A01 | Not applicable (no such feature yet) |

---

## 6. What we HAVE implemented (our strengths)

> Lead with these when talking to the boss - they build confidence and are all
> genuinely verified in the code.

### 6.1 Database access control (RLS) - DONE

- **Simple version:** Being logged in does not mean you can open anyone's files.
  Our database itself checks "is this row yours?" on every read and write, like a
  filing cabinet that physically refuses to open another person's drawer even if
  you have a key to the building.
- **Technical version:** Row-Level Security is enabled with owner-scoped policies
  (`USING (user_id = auth.uid())`) across the schema - verified 38 files contain
  `create policy` / `enable row level security`, plus a centralized guard
  (`lib/api/authGuards.ts`). Even server routes that use the powerful
  service-role key still filter `.eq("user_id", user.id)`.
- **Why it matters:** this is the single most important protection for the PII
  attackers actually want. It blocks the deck's "read another user's file" goal.

### 6.2 SQL injection protection - DONE

- **Simple version:** One classic attack is typing special characters into a
  login box to trick the database. We are immune because we never paste user text
  into database commands - the text is always treated as plain data, never as a
  command.
- **Technical version:** all DB access uses the Supabase query builder
  (parameterized); the only `.rpc()` calls pass params objects; the single raw
  `exec_sql` is a dev migration script, not request-facing.
- **Why it matters:** SQL injection is one of the oldest and most damaging
  attacks; we are safe by design, not by luck.

### 6.3 Security headers - DONE

- **Simple version:** Our site tells browsers a set of safety rules - do not let
  other sites embed us (stops clickjacking), always use HTTPS, do not guess file
  types. These are like the building's standard safety signs and locks.
- **Technical version:** `next.config.mjs` sets `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, HSTS, Referrer-Policy, Permissions-Policy,
  and a Content-Security-Policy. (One weakness noted in 7.7: the CSP allows
  `unsafe-inline`.)
- **Why it matters:** covers several recon and clickjacking vectors for free.

### 6.4 Password reset security - DONE

- **Simple version:** When you reset your password, the email link is built from
  our own official address, never from anything an attacker can fake, and the
  reset code is long, random, expires in an hour, and is stored scrambled.
- **Technical version:** links use `process.env.NEXT_PUBLIC_APP_URL`
  (`app/api/auth/forgot-password/route.ts:96`), not the Host header; tokens are
  `crypto.randomBytes(32)`, SHA-256 hashed at rest, 1-hour expiry, constant-time
  compare. (Minor: keep `NEXT_PUBLIC_APP_URL` always set so the origin fallback
  never runs.)
- **Why it matters:** blocks the deck's "Host header injection" attack on reset
  emails.

### 6.5 Audit logging - DONE (recording), see 7.8 for the gap

- **Simple version:** We keep a security diary - who logged in, from what
  address, success or failure. Most startups do not even have this.
- **Technical version:** `lib/security/audit-log.ts` writes to an `audit_logs`
  table (user, action, IP, user-agent, success/failure/blocked) on auth events.
- **Why it matters:** it is the foundation for detection. The missing half
  (alerting) is in 7.8.

### 6.6 Guarded debug/admin endpoints - DONE

- **Simple version:** Our test and admin doors are locked and hidden in
  production - they simply return "not found" to outsiders.
- **Technical version:** `app/api/dev/debug-reminders/route.ts:6` returns 404
  when `NODE_ENV === "production"` and checks auth+ownership; admin routes
  re-verify `profile.role === "admin"` on top of middleware.
- **Why it matters:** closes the deck's "directory discovery" of forgotten
  admin/debug pages.

### 6.7 CORS allowlist - DONE

- **Simple version:** Only our own known websites are allowed to talk to our
  backend - not the whole internet.
- **Technical version:** the Python backend (`backend/main.py`) uses an explicit
  origin allowlist, not a `*` wildcard, so the dangerous "wildcard + credentials"
  combination does not exist.
- **Why it matters:** stops other sites from making authenticated calls on a
  user's behalf.

### 6.8 Input schema validation - DONE

- **Simple version:** Before we trust incoming data, we check it has the right
  shape and types, like a form that rejects a phone number typed into the email
  box.
- **Technical version:** `zod` is installed and used to validate request
  schemas.
- **Why it matters:** reduces the chance of malformed or malicious input reaching
  deeper logic.

---

## 7. What we have NOT implemented yet (the gaps)

> Each gap has: Simple version, Technical version, the Problem, the Solution, and
> exactly what to Say to the boss.

### 7.1 Customer files committed to git - FIX NOW (live risk)

- **Simple version:** Real customer documents, and a script that can read our
  master database key, are accidentally saved inside our code history. Anyone with
  access to the code repo can see them. This is like leaving copies of clients'
  passports inside the office blueprint that we hand to contractors.
- **Technical version (verified):** `git ls-files` shows 3 real PII PDFs under
  `uploads/document-vault/...` and `scratch/db-check.js` + `scratch/test_db.ts`,
  both of which read `SUPABASE_SERVICE_ROLE_KEY`. `.env.local` itself is correctly
  untracked.
- **Problem:** live exposure of customer PII and a key-reading script in version
  control.
- **Solution:**
  ```bash
  git rm -r --cached uploads/ scratch/
  # add both to .gitignore, then purge from history (git filter-repo or BFG)
  ```
  Then **rotate the Supabase service-role key** as a precaution.
- **Say to the boss:** "We have real customer files saved in our code history by
  accident. It is a live privacy risk. I want to remove them and rotate the key
  today - it takes an hour and there is no downside."

### 7.2 Dependency vulnerabilities - MISSING (weakest area)

- **Simple version:** Our app is built on many third-party building blocks. 38 of
  them have publicly known security holes, 2 of them serious, and the worst ones
  are in the parts that open user-uploaded PDFs and spreadsheets. Old blocks with
  known holes are open doors.
- **Technical version (verified):** `npm audit --omit=dev` = 38 vulnerabilities
  (2 critical, 33 high). Highest live risk: `xlsx` (prototype pollution + ReDoS,
  no fix) and `pdfjs-dist` (high, no fix) - both parse untrusted uploads. Fixable
  now: `jspdf` (critical), `next`, `undici`, `axios`. Dead, unused deps that add
  risk for nothing: `express`, `multer`, `cors`, `helmet`, `libreoffice-convert`,
  `node-qpdf`, and `"fs": "^0.0.1-security"` (a placeholder squat package).
  `.gitmodules` pulls in third-party `MODNet` unpinned.
- **Problem:** 38 known holes ship in the app, some in code that reads attacker
  files.
- **Solution (staged):** `npm audit fix` for the easy ones; remove the dead deps;
  pin or replace `xlsx` and `pdfjs-dist`; pin the MODNet submodule; add automatic
  dependency scanning (Dependabot) so it never piles up again.
- **Say to the boss:** "This is our biggest and cheapest win. Any external
  security review would flag '38 known vulnerabilities' immediately. We can clear
  most in a day and turn on automatic scanning so it stays clean."

### 7.3 Login brute-force / rate limiting - PARTIAL

- **Simple version:** An attacker can run a script that tries thousands of
  passwords on our login. We built a "too many tries, slow down" bouncer, but our
  main login page does not actually use it yet - it leans only on Supabase's
  built-in limit.
- **Technical version (verified):** `lib/security/rate-limit.ts` exists and
  covers signup, forgot/reset/change-password, and MFA. But email+password login
  runs client-side via `app/context/AuthContext.tsx:483`
  (`supabase.auth.signInWithPassword`), bypassing our limiter. It is also IP-only
  and in-memory (resets on cold start), with no account lockout.
- **Problem:** our primary login door has no strong, app-controlled brute-force
  defense.
- **Solution:** route login through a server action that calls `checkRateLimit`
  (keyed on email + IP) before `signInWithPassword`; add lockout and exponential
  backoff; back the limiter with Redis (Upstash) so it survives across instances.
- **Say to the boss:** "We already built the lock, we just did not put it on the
  main door. Routing login through it plus adding a lockout is a few hours and
  closes a top OWASP risk (account takeover)."

### 7.4 File upload content validation - PARTIAL (the deck's key hint)

- **Simple version:** A file's name is not proof of what it is - anyone can
  rename `virus.exe` to `passport.pdf`. Right now we trust the name/label. Real
  checking looks inside the file. The deck literally said "the code for this
  exists, it just is not switched on" - and that is true.
- **Technical version (verified):** vault upload validates by MIME + extension
  only (`isValidFileType`, `lib/document-vault/file-utils.ts:141`, called at
  `app/api/documents/upload/route.ts:153`). The file bytes are read
  (`arrayBuffer()` at line 293) only for storage, never inspected for a real
  signature. Real content validation exists in
  `221g-action-planner/utils/documentValidation.ts` but only runs client-side,
  never in the server upload path.
- **Problem:** we accept files on a spoofable label; the real content check never
  runs on the server.
- **Solution:** add a server-side magic-byte check before storing:
  ```ts
  import { fileTypeFromBuffer } from "file-type";
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = await fileTypeFromBuffer(buf);
  if (!kind || !["application/pdf","image/png","image/jpeg"].includes(kind.mime))
    return Response.json({ error: "Unsupported file content" }, { status: 415 });
  ```
- **Say to the boss:** "The security deck pointed this out directly. We check a
  file's name but not its real contents. Reading the actual file bytes on upload
  is quick and stops disguised malicious files entering our vault."

### 7.5 Open redirect (OAuth callback) - PARTIAL

- **Simple version:** Our "after login, go here" feature can be tricked on one
  path (Google sign-in) into sending users to an attacker's site. Because it
  starts on our real domain, the victim trusts it.
- **Technical version (verified):** the login page validates the target
  (`app/(auth)/login/page.tsx:75`, must start with `/` and not `//`), but
  `app/api/auth/callback/route.ts:15` takes `next` from the URL/cookie and builds
  `${origin}${next}` / `https://${forwardedHost}${next}` with no validation.
- **Problem:** the OAuth callback can redirect users off-site.
- **Solution:** reuse one shared safe-redirect helper (only allow paths starting
  with `/` and not `//`) in the callback, same as the login page already does.
- **Say to the boss:** "We already protect this on the login page; we just need
  the same one-line check on the Google sign-in path. Tiny fix."

### 7.6 Path traversal - PARTIAL

- **Simple version:** One endpoint builds a file location from what the user asks
  for, without checking for `..` tricks that climb into other folders.
- **Technical version (verified):**
  `app/api/visa-checker/categories/[slug]/questionnaire/route.ts:8` does
  `path.join(process.cwd(), "data", ..., slug, "questionnaire.json")` with no
  sanitizing of `slug`. Impact is limited (it reads a fixed leaf file), but the
  defense is missing. Document download/preview routes are safe (they use the id
  as a DB key, not a file path).
- **Problem:** user input flows into a filesystem path unchecked.
- **Solution:** `const safeSlug = path.basename(slug)` and confirm the resolved
  path stays inside the base folder; better still, validate `slug` against a known
  category allowlist.
- **Say to the boss:** "Low risk today but a textbook hole - we sanitize the input
  and confirm it stays inside the intended folder. Minutes of work."

### 7.7 Verbose error messages + server version + XSS (misconfig cluster) - PARTIAL

- **Simple version:** A few small "leaky defaults." Our error pages sometimes
  reveal internal database details, our server announces its framework, and we
  display some HTML without cleaning it (safe today because that content is ours,
  risky the day it becomes user- or AI-written).
- **Technical version (verified):**
  - Verbose errors: many routes return `{ error: error.message }` (e.g.
    `app/api/notifications/route.ts:70`), leaking DB detail.
  - Server header: `next.config.mjs` never sets `poweredByHeader: false`, so
    `X-Powered-By: Next.js` is sent.
  - XSS: no sanitizer (DOMPurify) anywhere; ~40 `dangerouslySetInnerHTML` sinks
    (mostly static developer JSON; the one to watch is `q.note` at
    `DocumentNeedStep.tsx:274`); the CSP allows `unsafe-inline`, so it would not
    stop an injected inline script.
- **Problem:** small information leaks now; a latent XSS risk when HTML becomes
  user/AI-sourced.
- **Solution:** return generic client errors + log detail server-side (a
  `safeError` helper); add `poweredByHeader: false`; add DOMPurify for any dynamic
  HTML and plan to remove `unsafe-inline` from the CSP.
- **Say to the boss:** "A batch of small, cheap hardening items - hide our error
  details and framework version, and add HTML cleaning before we ever show user
  or AI content. An afternoon of work."

### 7.8 Detection / alerting - MISSING

- **Simple version:** We keep a security diary (good), but nobody reads it in real
  time. If someone tried to break in last night, we would only find out by
  accident later. Detection is the alarm bell, not the lock.
- **Technical version (verified):** `audit_logs` is populated, but a grep of
  `lib/security/` finds no threshold logic, no Sentry, no notification - it is
  pull-only via an admin viewer.
- **Problem:** we collect evidence but nothing watches it.
- **Solution:** add threshold alerts on `audit_logs`, pushed to Slack/email (we
  already have `resend` for email and `node-cron` installed): 5+ failed logins in
  5 min, one user pulling 100+ others' files, a spike of 403s, admin role changes
  off-hours.
- **Say to the boss:** "This is the cheapest big win - we already collect the
  logs, we just add a watcher that pings us on obvious warning signs. It turns
  'discovered by accident months later' into 'caught in hours.'"

### 7.9 Request size / DoS limits - PARTIAL

- **Simple version:** Some attackers just want to knock us offline with huge or
  flooding requests. We limit sizes in most places but not everywhere, and there
  is no single overall cap.
- **Technical version (verified):** per-route caps exist (10MB vault, 1MB OCR) but
  `app/api/guides/upload/route.ts` has none; no global body limit; checks run
  after the body is buffered into memory.
- **Problem:** uneven limits, no global cap.
- **Solution:** add a size check to every upload route, set a global body cap, and
  rely on the hosting platform (Vercel/Cloudflare) for real volumetric DDoS.
- **Say to the boss:** "We cover the cheap app-level basics (size limits
  everywhere) and let our hosting platform handle real flood attacks - building
  our own DDoS defense would be wasted effort."

### 7.10 SSRF - NOT APPLICABLE (guard the future)

- **Simple version:** This attack tricks our server into fetching its own internal
  systems via a user-supplied link. We do not have any "fetch this URL" feature, so
  there is nothing to fix now - we just need a rule for the future.
- **Technical version (verified):** no server fetch of a user-supplied URL exists;
  every server fetch targets a hardcoded/env host. No sink = no vulnerability, but
  also no internal-address guard for later.
- **Problem:** none today.
- **Solution:** do NOT write speculative code. Adopt a rule: any future
  "fetch a user URL" feature must block internal addresses (127.0.0.1, 10.x,
  192.168.x, 169.254.x, localhost) from day one.
- **Say to the boss:** "We do not have this weakness because we never fetch
  user-provided links. The only action is a rule to add protection IF we ever
  build such a feature. No work needed now."

---

## 8. Defense checklists by area

From the roadmap deck, with our status (x = done, ~ = partial, [ ] = todo):

**Authentication and sessions**
- [x] Secure cookies (HttpOnly, Secure, SameSite) via Supabase SSR
- [~] Rate-limit login/OTP/reset/invite - login not covered yet
- [x] Strong reset tokens, hashed, short expiry
- [ ] Revoke sessions on suspicious activity

**Authorization and tenant isolation**
- [x] Object-level checks on every read/write (RLS)
- [x] User id from trusted server context (`auth.uid()`)
- [x] Admin paths require separate privileges + audit logs

**API security**
- [x] Validate request schema/types (zod)
- [~] Rate-limit by IP/user/route
- [x] Restrict CORS, no wildcard-with-credentials
- [ ] Return safe errors, log detail server-side
- [~] Body/upload limits

**Data and database**
- [x] Encrypt in transit + at rest
- [x] Tenant scoping + least privilege (RLS)
- [ ] Backup RESTORE tests (not just snapshots)
- [x] Audit who accessed sensitive data

**Secrets and configuration**
- [x] No hardcoded secrets (all via env)
- [ ] Remove committed `uploads/` PII + `scratch/` script; rotate the key
- [ ] Pre-commit secret scan + protected CI secrets
- [x] Separate dev/staging/prod credentials

**CI/CD and DevOps**
- [~] Protected branches + required reviews
- [ ] Dependency scanning in CI (Dependabot)
- [ ] Pin the MODNet submodule

**Monitoring and incident response**
- [x] Central-ish auth/audit logs
- [ ] Alert on failed logins, privilege changes, unusual exports
- [ ] Incident playbook: contain -> eradicate -> recover -> learn

---

## 9. Our 90-day roadmap

### 30 days - Baseline (cheap wins + stop the bleeding)
1. Remove committed PII (`uploads/`, `scratch/`), purge history, rotate the
   service-role key. (Live risk - do first.)
2. `npm audit fix` + remove dead deps.
3. `poweredByHeader: false` + generic client error messages.
4. Fix the OAuth callback open redirect.
5. Sanitize the path-traversal `slug` route.
6. Switch on server-side magic-byte upload validation.

### 60 days - Harden
7. Rate-limit the real login path; add lockout; back with Redis (Upstash).
8. Threshold alerting on `audit_logs` -> Slack/email.
9. Pin/replace `xlsx` and `pdfjs-dist`; pin the MODNet submodule.
10. Global body-size cap + size checks on every upload route.
11. Add DOMPurify for dynamic HTML; plan CSP `unsafe-inline` removal.
12. Backup RESTORE test.

### 90 days - Automate
13. Pre-commit secret scan (gitleaks) + dependency scanning (Dependabot) in CI.
14. Protected branches + required security review on PRs.
15. Lightweight threat-modeling step for new features.
16. Write and rehearse an incident playbook.

### Do NOT build now (guard the future instead)
- SSRF fix: no user-URL fetch exists; add the guard only when such a feature is
  built.
- Hand-rolled DDoS defense: that is the hosting platform's job (Vercel/Cloudflare).

---

## 10. Ready-to-use boss briefing script

Say this almost word for word:

> "I audited our app against two security guides and the OWASP Top 10. The good
> news: our core is strong - database-level access control so users can only see
> their own data, safe queries so SQL injection is impossible, real security
> headers, strong password-reset tokens, and we even keep an audit log, which
> most startups skip.
>
> The gaps are the usual ones and mostly cheap. In priority order: first, we have
> a live exposure - customer documents and a key-reading script are committed to
> our code history; I want to remove those and rotate the key today. Second,
> dependency cleanup - we have 38 known vulnerabilities, two critical, and the
> worst are in code that opens user-uploaded files; most clear in a day. Third,
> our actual login is not rate-limited, so it is guessable - I want to route it
> through the limiter we already built and add lockout. Fourth, we log security
> events but nothing watches them - I want basic alerts on failed logins and
> admin changes so we catch problems in hours, not months. Fifth, we should
> finish upload validation - we check a file's name but not its real contents.
>
> I have this as a 30/60/90-day plan. The 30-day items are a day or two of work
> total and remove our biggest risks. A couple of things - full DDoS defense and
> any URL-fetch protection - I deliberately recommend we do NOT build now, because
> they are the hosting platform's job or a feature we do not even have."

---

## 11. Glossary

- **Cyber Kill Chain** - the 5-stage model of how attacks unfold.
- **OWASP Top 10** - the industry's list of the most common web app risks.
- **CVE** - a public catalog entry for a known software vulnerability.
- **Reconnaissance** - info gathering before an attack.
- **Rate limiting** - capping how many times an action can be tried in a window.
- **Brute force** - trying many passwords/keys until one works.
- **Open redirect** - abusing an unvalidated "redirect to X" feature.
- **SQL injection (SQLi)** - injecting database commands through an input field.
- **Parameterized query** - sending input strictly as data, never as SQL.
- **XSS** - injecting code that runs in another user's browser.
- **CSP (Content Security Policy)** - a header restricting what scripts a page may
  run; weakened by `unsafe-inline`.
- **Sanitization** - cleaning user input (e.g. stripping HTML) before rendering.
- **Host header injection** - abusing the request `Host` header to poison links.
- **Supply chain attack** - compromising a library/tool you depend on.
- **SCA** - automated scanning of dependencies for known vulnerabilities.
- **Path traversal** - using `../` to escape an intended folder.
- **Magic bytes** - the first bytes of a file that reveal its true type.
- **SSRF** - tricking the server into fetching internal addresses.
- **DoS / DDoS** - flooding a service to knock it offline (one source vs many).
- **IDOR** - changing an id in a request to access another user's object.
- **RLS (Row-Level Security)** - DB rules that only return rows a user owns.
- **Tenant isolation** - keeping one customer's data unreachable by another.
- **Service-role key** - a Supabase key that bypasses RLS; safe only if every
  query checks ownership.
- **Audit log** - a record of security-relevant events.
- **Detection / alerting** - watching logs and notifying a human on anomalies.
- **Least privilege** - giving each user/service only the access it truly needs.

---

*Prepared as a defensive review of Rahvana against `Breaking-and-Entering.pdf`
and `Security_Roadmap_for_SaaS.pptx.pdf`, plus a read-only code inspection and
`npm audit`. All findings were verified directly against the code on the audit
date above and are advisory.*
