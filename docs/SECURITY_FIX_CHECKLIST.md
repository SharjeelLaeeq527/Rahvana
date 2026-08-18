# Rahvana Security - Fix Checklist

> Action tracker for the findings in `SECURITY_AUDIT_Breaking_and_Entering.md`.
> `[x]` = done, `[ ]` = pending. Update as you go.
>
> Last updated: 2026-08-03

---

## Legend

- **[x] DONE** - completed and verified
- **[~] STAGED** - code change made, not committed yet (review + commit)
- **[ ] TODO** - not started
- **Owner:** who should do it (Dev = code, Ops = deploy/keys, Team = decide together)

---

## A. Already done (by this session)

These are code edits + git changes. They are **staged, not committed** - review
the diff, then commit.

- [x] **Hide server version header** - `poweredByHeader: false` in
  `next.config.mjs:35`. Stops `X-Powered-By: Next.js` leaking our stack.
- [x] **Fix OAuth callback open redirect** - new helper
  `lib/security/safeRedirect.ts` + used in `app/api/auth/callback/route.ts`.
  Only same-origin relative paths are now allowed as the post-login target.
- [x] **Fix path traversal** -
  `app/api/visa-checker/categories/[slug]/questionnaire/route.ts` now sanitizes
  `slug` with `path.basename` + confirms the resolved path stays inside the base
  directory.
- [x] **Stop tracking PII uploads** - added `/uploads/` to `.gitignore` and ran
  `git rm -r --cached uploads/` (3 customer PDFs untracked; local copies kept).
- [x] **Generic client error messages** - new helper `lib/api/safeError.ts`;
  replaced raw `{ error: error.message }` with `safeError(error)` in 8 leaking
  routes (visa-security, notifications, quick-access, receipt/journey,
  police-verification/requests+apply, admin/appointments, admin/police-verifications).
  Import/usage consistency verified.
- [x] **Protect `scratch/`** - ignore all of `scratch/` except the two real
  `register_*.mjs` scripts; untracked the debug/test files (incl. the
  key-reading `db-check.js` and `test_db.ts`). Local copies kept.

### Next immediate step for these
- [~] **Commit the staged changes** (Owner: Dev)
  ```bash
  git add .gitignore next.config.mjs \
    lib/security/safeRedirect.ts lib/api/safeError.ts \
    app/api/auth/callback/route.ts \
    "app/api/visa-checker/categories/[slug]/questionnaire/route.ts" \
    app/api/visa-security/route.ts app/api/notifications/route.ts \
    app/api/quick-access/route.ts app/api/receipt/journey/route.ts \
    app/api/police-verification/requests/route.ts app/api/police-verification/apply/route.ts \
    app/api/admin/appointments/route.ts app/api/admin/police-verifications/route.ts
  # plus the staged uploads/ and scratch/ removals (already staged)
  git commit -m "security: hide powered-by, generic errors, fix open redirect + path traversal, untrack PII/scratch"
  ```
  Recommended before commit: `npm run build` to confirm nothing broke.

---

## B. Do now (this week - high priority, low effort)

- [ ] **Purge PII from git history** (Owner: Team - it rewrites history)
  - Untracking only stops future commits; the 3 PDFs are still in old commits.
  - Use `git filter-repo` or BFG, then force-push and have everyone re-clone.
  ```bash
  # example with git-filter-repo
  git filter-repo --path uploads/ --invert-paths
  ```
- [ ] **Rotate the Supabase service-role key** (Owner: Ops)
  - `scratch/db-check.js` and `scratch/test_db.ts` read `SUPABASE_SERVICE_ROLE_KEY`.
    Rotate it in the Supabase dashboard and update the env var everywhere.
- [ ] **Decide what to do with `scratch/`** (Owner: Team)
  - It has both throwaway test files AND real scripts (`register_*_guide.mjs`).
  - Keep the real scripts, untrack the rest, and add test artifacts to `.gitignore`.
- [ ] **Clear the easy dependency vulnerabilities** (Owner: Dev - test after)
  ```bash
  npm audit fix        # non-breaking fixes only (jspdf, next, undici, axios...)
  npm run build        # confirm nothing broke
  ```
- [ ] **Remove dead dependencies** (Owner: Dev - test after)
  ```bash
  npm remove express multer cors helmet libreoffice-convert node-qpdf fs path
  npm run build
  ```
- [x] **Add generic client error messages** - DONE (see section A). Helper
  `lib/api/safeError.ts` applied to the 8 worst-leaking routes. Remaining routes
  that still surface `error.message` (e.g. `book-appointment`, `steps/[id]`,
  `documents/upload`) can be migrated to `safeError` later - lower priority.

---

## C. Do soon (harden - medium effort)

- [x] **Rate-limit the real login path** (Owner: Dev) - DONE (staged)
  - New server route `app/api/auth/login/route.ts` (rate limit per IP + per
    email+IP, audit log, generic errors, MFA preserved). `AuthContext.signIn`
    now calls it instead of client-side `signInWithPassword`. Compile-clean
    (0 TS errors). See `LEARN_Rate_Limiting_And_Login_Security.md`.
  - STILL TODO: account lockout + exponential backoff (nice-to-have).
  - MUST test the login + MFA flow in a running app before merging.
- [ ] **Back rate limiting with Redis (Upstash)** (Owner: Dev/Ops)
  - Makes limits survive serverless cold starts and work across instances.
- [ ] **Switch on server-side upload content validation** (Owner: Dev)
  - Add a magic-byte check (`file-type` package) in
    `app/api/documents/upload/route.ts` before storing, in addition to the
    existing MIME/extension check. Apply to other upload routes too.
- [ ] **Add detection/alerting on `audit_logs`** (Owner: Dev)
  - Use existing `resend` (email) + `node-cron`. Alert on: 5+ failed logins in
    5 min, one user pulling 100+ others' files, 403 spikes, off-hours admin
    role changes.
- [ ] **Pin/replace no-fix parsers of untrusted input** (Owner: Dev)
  - `xlsx` and `pdfjs-dist` (they read user uploads and have no clean fix).
- [ ] **Pin the MODNet submodule** (Owner: Dev)
  - Pin `.gitmodules` to a reviewed commit, not a moving branch.
- [ ] **Add consistent request size limits** (Owner: Dev)
  - Add a size check to every upload route (e.g. `app/api/guides/upload/route.ts`
    has none) and set a global body cap.
- [ ] **Add DOMPurify for dynamic HTML** (Owner: Dev)
  - Sanitize any `dangerouslySetInnerHTML` that could ever render user/AI content
    (e.g. `q.note` in `DocumentNeedStep.tsx:274`). Plan removal of
    `unsafe-inline` from the CSP.
- [ ] **Guarantee `NEXT_PUBLIC_APP_URL` is set in production** (Owner: Ops)
  - So password-reset links never fall back to the request origin header.

---

## D. Do later (automate + mature - 90 day)

- [ ] **Pre-commit secret scanning** (gitleaks) - stops secrets/PII being committed.
- [ ] **Dependency scanning in CI** (Dependabot or an `npm audit` gate).
- [ ] **Protected branches + required review** on PRs.
- [ ] **Lightweight threat modeling** step for each new feature.
- [ ] **Backup RESTORE test** (not just snapshots).
- [ ] **Incident playbook** - contain -> eradicate -> recover -> learn.

---

## E. Deliberately NOT doing (and why)

- [x] **No custom SSRF fix** - we have no "fetch a user URL" feature, so there is
  nothing to patch. Rule adopted: add an internal-address block IF such a feature
  is ever built.
- [x] **No hand-rolled DDoS defense** - volumetric DDoS is the hosting platform's
  job (Vercel/Cloudflare). We only cover the cheap app-layer basics (size + rate
  limits).

---

## Progress summary

| Bucket | Done | Pending |
|--------|------|---------|
| A. Already done (staged) | 6 | 1 (commit) |
| B. Do now | 1 | 4 |
| C. Do soon | 1 | 8 |
| D. Do later | 0 | 6 |
| E. Decided not to do | 2 | 0 |

**Biggest remaining risks:** git history still contains PII (B), and the
service-role key needs rotating (B). Everything else is planned hardening.
