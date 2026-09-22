# Rahvana - Supabase Database Audit (Read-Only)

> **What this is.** A full, production-grade audit of the Rahvana Supabase (Postgres)
> database: schema, security, RLS, indexes, scalability, migrations, storage, and the
> app code that talks to the database. Written in plain English.
>
> **Important:** This is an AUDIT ONLY. Nothing in the database or code was changed.
> No fixes have been applied. Do not action anything here until it is approved.
>
> **Date:** 2026-09-21
> **Scope:** 81 migration files in `supabase/migrations/`, the Supabase client wrappers
> in `lib/supabase/*`, and the API/route/context code that reads and writes the database.
>
> **How findings were checked.** Every CRITICAL security finding below was verified by
> reading the actual SQL, not guessed. Where something could not be confirmed from the
> files alone (for example, buckets or constraints that may have been changed by hand in
> the Supabase dashboard), it is clearly marked **NOT VERIFIED**.
>
> **Addendum (2026-09-21).** The multi-candidate / Document-Vault-sharing notes (Sections 12,
> 15, 16 and M-4) were reconciled with the now-finalized app design: candidates are separate
> `journeys` rows (no `candidate_id`), cross-candidate document sharing rides
> `documents.shareWithJourneyIds` **restricted to same-base-category siblings** (IR-1 stays
> out of the candidate system), and the delete path reference-counts `storage_path`. **No
> database schema, RLS, or data was changed** by this addendum - it only keeps the doc in
> sync with the code; all security findings above stand unchanged.

---

## 0. LIVE DATABASE VERIFICATION (ground truth - read this first)

The first version of this audit was based on the migration files. But the migration files
are **not** the source of truth: several fixes were applied by hand in the Supabase
dashboard (never written to a migration), and several tables exist only in the live
database. So I connected to the **live database** (read-only, count-only, no PII pulled)
and tested the real behavior. Here is what is actually true right now.

**How this was tested:** using the project's own Supabase URL + keys, I (1) pulled the live
API schema (real tables + columns), (2) compared what the public "anon" key can read vs
what the server "service role" can read on each table - if anon sees the same rows, that
table is genuinely open right now, and (3) listed the storage buckets and their public flag.
No data was written or deleted. No row contents were fetched (only row counts).

### 0.1 What the LIVE database shows

**Confirmed ACTIVE breach (fix immediately):**
- **`police_verification_requests` is readable by anyone on the internet.** The anon key
  returned all **24 real rows** (anon count 24 = service count 24). This holds CNIC,
  passport, arrest history, and witness data. **This is a live data breach - CR-1 is real
  and happening now.**

**Good news - most migration-file "criticals" were already fixed in the dashboard:**
On the live database, the anon key sees **0 rows** on all of these, i.e. RLS is working:
`consultation_bookings` (0 of 43), `translation_documents` (0 of 57), `risk_flags`
(0 of 718), `interview_prep_sessions/answers/results`, `app_notifications` (0 of 70),
`payments`, `user_profiles`, `profiles`, `journeys`, `chapters`, `steps`, `case_data`,
`documents`, `portal_wallet_credentials` (0 of 9), `portal_wallet_security_questions`,
`user_221g_cases`, `user_case_*`, `support_chats/messages`, and the rest.
So **CR-4 and most of CR-5 are NOT true on the live database** - they were fixed directly
in the dashboard. (This is exactly why you said not to trust the migration files.)

**Tables open to anon that are open BY DESIGN (not a problem):** `guides` (15),
`time_slots` (59), `blog_comments` (2), `feature_announcements` (2). These are public
content/listing tables - fine.

### 0.2 The reproducibility trap (this is the real danger now)

Because the security fixes live **only in the dashboard, not in migrations**, the
`supabase/migrations/` folder does **not** describe your real database. This creates two
serious problems:

1. **If you ever rebuild from migrations (new environment, disaster recovery, a fresh
   `supabase db reset`), all the "fixed" holes come back** - consultation_bookings,
   translation_documents, risk_flags, and interview_prep_* would be world-open again,
   because the migration files still contain the broken policies (and CR-5's missing RLS).
2. **11 live tables have NO migration file at all** and would simply not exist after a
   rebuild (see 0.4). Several hold real, sensitive data.

So the migration-file findings (Sections 2-11) are still important - not because the live
DB is broken today, but because **your recovery/rebuild path is broken**. The fix is to
bring the migrations back in sync with the live database.

### 0.3 Storage buckets (ground truth - resolves the earlier "NOT VERIFIED")

| Bucket | Public? | Notes |
|---|---|---|
| `document-vault` | **private** | 50MB limit, correct MIME allow-list, per-user folders, encrypted. **BUT see 0.6 - a delete policy lets any logged-in user delete anyone's vault files.** Migration said 10MB; live is 50MB (minor drift). |
| `pdfs` | **PUBLIC + world-writable** | Empty today, but the live policies allow **anyone (even not logged in) to READ, UPLOAD, UPDATE and DELETE** files in it (`SELECT/INSERT/UPDATE/DELETE -> public, bucket_id='pdfs'`). This is worse than "public read": anyone can dump files into your storage (abuse, cost, malware hosting) or delete what is there. Make it private + signed URLs, or lock the policies to the service role. |

### 0.4 Tables that exist in the LIVE database but have NO migration (confirmed drift)

These 11 tables were created directly in the database. They are not reproducible from the
repo, and some hold sensitive data (row counts from the live DB in brackets):

- `portal_wallet_credentials` (9) and `portal_wallet_security_questions` (13) - the
  standalone Portal Wallet (encrypted credentials). RLS SELECT is working (anon sees 0).
- `support_chats` (1), `support_messages` (6) - a support chat feature.
- `user_221g_cases` (42) - 221(g) tracking.
- `case_collaborators` (5), `case_invites` (0), `case_activity` (0) - a case-collaboration
  / invite feature not described anywhere in the migrations or docs.
- `user_notifications` (0), `feature_announcements` (2), `interview_categories` (3).

**Other confirmed drift:** `payments.product_type` CHECK (CR-6), the `document-vault` size
limit (10MB in migration vs 50MB live). There are almost certainly more column/constraint
differences that cannot be seen without catalog access (see 0.5).

### 0.6 Write-side verification (CONFIRMED against the live database)

The catalog query resolved the write-side items that were previously "NOT VERIFIED." These
are now confirmed on the real database:

**CONFIRMED CRITICAL - live:**
1. **`police_verification_requests`** - policy `FOR ALL TO public USING (auth.uid() IS NULL)`
   = anonymous full access. Matches the live read of all 24 rows. (CR-1)
2. **Self-upgrade subscription (CR-2)** - `authenticated` has column-level **UPDATE grants on
   `user_profiles.subscription_tier`, `subscription_status`, `stripe_customer_id`**, and the
   UPDATE policy is only `USING (auth.uid() = id)`. So a logged-in user can PATCH their own
   row and set `subscription_tier='pro'`. Confirmed.
3. **Self-promote to admin (CR-3)** - `authenticated` has a column UPDATE grant on
   **`profiles.role`**, and the UPDATE policy is `USING (auth.uid() = id)`. So a logged-in
   user can set their own `role='admin'`. Confirmed. (Note: an `is_admin()` helper exists,
   but the escalation is via the writable `role` column, so the helper does not stop it.)
4. **`pdfs` bucket world read+write+delete** - see 0.3.
5. **`document-vault` cross-user delete** - the storage policy **"Allow authenticated deletes"**
   is `FOR DELETE TO public USING (bucket_id='document-vault' AND auth.role()='authenticated')`
   - it checks only that the caller is logged in, **not** that they own the folder. So any
   logged-in user can delete any other user's vault files. (A separate correct folder-scoped
   delete policy also exists, but policies are OR'd, so the broad one wins.)
6. **`app_notifications` INSERT (H-6)** - policy `FOR INSERT TO public WITH CHECK (true)` =
   anyone (even anon) can insert notifications for any user. Phishing vector. Confirmed.

**CONFIRMED HIGH/MEDIUM - live:**
- **`feature_usage` quota self-reset (M-7)** - UPDATE policy `USING (auth.uid() = user_id)`
  with no column guard; a user can reset their own `usage_count`. Confirmed.
- **`interview_categories`** - `FOR ALL TO authenticated USING (true) WITH CHECK (true)` =
  any logged-in user can insert/update/delete this shared reference content. Should be
  admin/service only.
- **SECURITY DEFINER without `search_path`** - confirmed on `increment_feature_usage_atomic`
  and `is_admin` (both `proconfig = NULL`). Search-path hardening needed.
- **Wrong grants to `anon`** - `anon` has UPDATE grants on `profiles.role` and
  `user_profiles.*`. Anon cannot exploit it (no `auth.uid()` to pass the policy), but the
  grant is wrong and should be revoked.
- **Personal email hardcoded in a policy** - `support_messages` has an INSERT policy
  `WITH CHECK ((auth.jwt() ->> 'email') = 'k...@gmail.com')`. Not a hole (it is restrictive),
  but a developer's personal email is baked into the live schema - remove it.

**CONFIRMED RESOLVED on live (migration files are stale):**
- **CR-4** consultation_bookings - live policies are proper own-row
  (`TO authenticated USING (auth.uid() = user_id)`). The world-open migration policy was
  replaced in the dashboard.
- **CR-5** - **no table has RLS disabled on the live database.** All five previously-flagged
  tables (translation_documents, risk_flags, interview_prep_*) now have RLS + own-row/
  session-join policies. Fixed in the dashboard.
- The `profiles` self-recursion risk (RLS-2) - an `is_admin()` SECURITY DEFINER helper now
  exists, so admin checks avoid querying `profiles` from inside a `profiles` policy.

**Reminder:** all of the "resolved" items are resolved **only in the live dashboard, not in
the migration files** - so a rebuild from `supabase/migrations/` still reopens them (see 0.2).

### 0.5 What is STILL not verified

The catalog scan (0.6) closed the earlier write-side gaps (CR-2, CR-3, H-6, M-7 are now
CONFIRMED). What remains genuinely unchecked is small:

- **Whether the app itself exercises any of the risky grants** (e.g. does any legit client
  flow rely on `authenticated` updating `subscription_tier` directly? It should not - that
  is the server's job - but confirm before revoking the grant).
- **Exact column list** the app writes to `profiles`/`user_profiles` from the client, to
  scope the replacement column grants precisely.
- **Data-volume / retention** decisions and backup/PITR configuration (Section 13) - these
  are settings, not schema, and need a look at the Supabase project dashboard.

> **Bottom line:** The live database is in **much better shape** than the migration files
> suggested - only `police_verification_requests` is an active read breach, and the `pdfs`
> bucket is a latent risk. But your **migrations no longer match production**, which breaks
> disaster recovery and hides the write-side policies. Priorities: (1) close the police
> table, (2) make `pdfs` private or confirm it stays empty, (3) run the SQL in 0.5 to
> finish the write-side check, (4) re-sync migrations with the live DB.

---

## 1. Executive Summary (in simple English)

Rahvana stores everything in one Supabase Postgres database. Each user has a **journey**
(their immigration case). A journey has **chapters**, chapters have **steps**, and the
journey collects facts in **case_data**. Users also have **profiles**, **documents**
(the Document Vault), **payments**, **interview prep** data, **notifications**, and
several service tables (consultations, translations, police verification).

The newer, core part of the database (journeys, chapters, steps, case_data, document
vault, portal records) is **well built**: good foreign keys, good cascade-delete rules,
proper per-user security, and clean separation between normal users and the server
"service role."

However, the **older tables and some service tables have serious problems**, and there is
clear evidence that the live database no longer matches the migration files (someone made
changes by hand in the Supabase dashboard). The most urgent issues are:

- **Some tables with sensitive personal data are open to the public internet.** Police
  verification records (passport, CNIC, arrest history, witnesses) can be read by anyone
  with the public key. Consultation bookings can be read and written by anyone. Five
  tables (including translation documents and criminal-history risk flags) never had
  security turned on at all.
- **Users can give themselves a paid plan or make themselves an admin.** The security
  rules protect *which rows* a user can touch, but not *which columns*. Because the app
  also grants column update rights, a user can edit their own row and set
  `subscription_tier = 'pro'` or `role = 'admin'`.
- **The migration files no longer match the real database.** The payments table's rule
  forbids a value the app depends on, an "RLS security fix" migration is empty, and two
  user tables are defined twice with different shapes.

The good news: **every one of these is fixable with a small SQL migration**. None need
downtime, and most need no data migration. There are also real (but lower-priority)
scalability and performance issues that will bite as the user base grows, mostly around
the `steps` table triggers and unbounded log tables.

Findings are grouped by priority below. A full action plan (NOW / NEXT / LATER / DO NOT)
is in Section 16, and a list of exact files to fix is at the very end.

---

## 2. Critical Issues (fix before real production traffic)

These are confirmed by reading the SQL directly. They are live and easy to exploit
through the public Supabase REST API using only the public "anon" key or a normal user
login.

### CR-1. Police verification records are readable/writable by ANY anonymous user
**File:** `supabase/migrations/20260228_29_police_verification_schema.sql` (line 75-77)

```sql
CREATE POLICY "Enable all access for service role" ON public.police_verification_requests
    FOR ALL
    USING (auth.uid() IS NULL);  -- Or distinct service role check
```

- **What is wrong:** The policy was meant to give the server ("service role") full access.
  Instead it says "allow everyone whose `auth.uid()` is NULL." That is true for **any
  unauthenticated request** using the public anon key. So anyone can read, insert, update,
  or delete every row.
- **Why it matters:** This table holds CNIC, passport numbers, arrest/FIR history, and two
  witnesses' names, CNICs, contacts and addresses, plus links to uploaded documents. This
  is a serious data breach of immigration PII.
- **Severity:** CRITICAL. **Fix now.**
- **Fix:** Replace with `FOR ALL TO service_role USING (true) WITH CHECK (true)` and add
  proper own-row policies for users. Migration only, no downtime.

### CR-2. Any logged-in user can upgrade their own plan (paywall bypass)
**Files:** `20260127_add_subscription_fields.sql` (line 64), `20260228_15_COMPLETE_PROFILE_FIX.sql` (line 74-75)

```sql
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);   -- controls rows, NOT columns
```

- **What is wrong:** RLS controls which *rows* a user may edit, not which *columns*. The
  app also grants column-level UPDATE to all logged-in users. So a normal user can send a
  request that sets `subscription_tier = 'pro'` and `subscription_status = 'active'` on
  their own row.
- **Why it matters:** The app reads the effective plan from `user_profiles.subscription_tier`,
  and `reconcileUserPlan` never downgrades a user. So a self-granted paid tier sticks -
  full free access to executive/premium features.
- **Severity:** CRITICAL. **Fix now.**
- **Fix:** Remove column update rights on the sensitive columns from normal users
  (`REVOKE UPDATE ...; GRANT UPDATE (profile_details, updated_at) ...`) or add a
  BEFORE UPDATE trigger that blocks changes to `subscription_tier`, `subscription_status`,
  and `stripe_*` unless done by the service role.

### CR-3. Any logged-in user can make themselves an admin
**File:** `20260228_25_fix_profiles_policies.sql` (line 24)

```sql
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);   -- no column guard on the `role` column
```

- **What is wrong:** Same problem as CR-2, but on the `profiles.role` column. A user can
  set their own `role = 'admin'`.
- **Why it matters:** The admin RLS policies on many tables (journeys, chapters, steps,
  case_data, feature_usage, audit_logs, and more) only check `role = 'admin'`. The extra
  "admin email whitelist" check lives only in the app middleware, **not** in the database.
  So a self-promoted user can bypass the app and directly read every other user's journeys,
  case data, and audit logs through the REST API.
- **Severity:** CRITICAL. **Fix now.**
- **Fix:** Block users from changing their own `role` (column grant or trigger). Better:
  make the admin RLS checks use a `SECURITY DEFINER` `is_admin()` helper (that also checks
  the whitelist), or move admin status to a separate table users cannot write.

### CR-4. Consultation bookings are readable and writable by the whole world
**File:** `20260228_14_add_rls_policies_for_consultation.sql` (lines 4-24)

```sql
CREATE POLICY ... FOR SELECT TO public USING (true);
CREATE POLICY ... FOR INSERT TO public WITH CHECK (true);
```

- **What is wrong:** `TO public USING (true)` means anyone (even not logged in) can read
  every booking, and `WITH CHECK (true)` means anyone can insert rows. A `user_id` column
  was added later, but these open policies were never removed.
- **Why it matters:** Bookings contain full name, email, WhatsApp number, case summary,
  and attachments. Anyone can dump them all, and spam the table with unlimited rows.
- **Severity:** CRITICAL. **Fix now.**
- **Fix:** Drop both public policies; scope SELECT/INSERT to `auth.uid() = user_id` (or to
  the service role for the booking API).

### CR-5. Five tables never had security (RLS) turned on
**Confirmed:** none of these files, or any later migration, runs `ENABLE ROW LEVEL SECURITY`.

| Table | File | Sensitive data inside |
|---|---|---|
| `translation_documents` | `20260228_22_*` | user email/name, file paths to marriage/birth/death certs, admin notes, IP/browser metadata |
| `risk_flags` | `20260228_30_*` | criminal history, visa-denial, defense-sector, consanguinity flags |
| `interview_prep_sessions` | `20260228_28_*` | user id/email/name |
| `interview_prep_answers` | `20260228_26_*` | answers incl. criminal history, overstay, finances |
| `interview_prep_results` | `20260228_27_*` | generated Q&A |

- **What is wrong:** In Supabase, any table in the `public` schema is exposed on the public
  REST API. If RLS is not enabled, the default role grants make it **fully readable and
  writable by anyone**.
- **Why it matters:** Highly sensitive immigration and criminal-history data is exposed.
  Note: the child tables `interview_user_answers` and `interview_prep_session_progress`
  *do* have correct RLS, but they join back to the unprotected parent, so the parent is
  the hole.
- **Severity:** CRITICAL (translation_documents, risk_flags) / HIGH (interview prep).
  **Fix now.**
- **Fix:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on each, then add own-row policies
  (direct `user_id = auth.uid()` where the column exists, session-join where it does not)
  plus a service-role policy. Quickly confirm no legitimate anonymous read path depends on
  these before enabling.

### CR-6. Payments table constraint no longer matches the app (schema drift)
**File:** `20260127_create_payments_table.sql` (line 10)

```sql
product_type TEXT NOT NULL CHECK (product_type IN ('subscription', 'consultation')),
```

But the app writes these `product_type` values (verified in `app/api/stripe/checkout/route.ts`):
`journey_plan`, `standalone_addon`, `consultation`, `medical_booking`, `pcc_filing`,
`document_translations`. And `lib/plan/reconcile.ts` reads `product_type = 'journey_plan'`.

- **UPDATE (verified against the live DB):** The **live** constraint is
  `CHECK (product_type = ANY (ARRAY['journey_plan','consultation','subscription']))` -
  different from the migration file, confirming the dashboard was edited by hand. The app
  writes more raw types (`standalone_addon`, `medical_booking`, `pcc_filing`,
  `document_translations`), but `app/api/stripe/checkout/route.ts:825-832` deliberately
  **maps them down** to `journey_plan` / `consultation` before the DB insert (keeping the
  real type in `metadata.original_product_type`). So **payments record correctly on the
  live DB - there is no active failure.** This is drift only, not a live bug.
- **Why it still matters:** This is on the money/revenue path and the migration files no
  longer match production. If the constraint were ever re-applied from the files (fresh
  environment rebuild / `db reset`), `journey_plan` inserts and `reconcileUserPlan` would
  break. No one can trust the migration files to rebuild production.
- **Severity:** Downgraded to **HIGH** (drift / reproducibility, not an active outage).
- **Fix:** Add a migration that drops the old CHECK and re-adds the live one (or drops the
  CHECK and validates in the app). Then audit the dashboard for other hand-made changes.

---

## 3. High Priority Issues

### H-1. Four journey child tables have no foreign key to `journeys` (orphan risk)
**Files:** `20260403_01_journey_documents.sql`, `20260403_02_tool_sessions.sql`,
`20260403_03_journey_portal_records.sql`, `20260403_04_journey_appointments.sql`
(and the combined file).

Each declares `journey_id UUID NOT NULL` but **no `REFERENCES journeys(id)`**. The
comments even say "FK added after journeys table is confirmed" - it never was. Only
`interview_prep_sessions` got its FK fixed later (`20260718_03`).

- **Why it matters:** When a journey (or user) is deleted, these tables keep orphaned
  rows - including `journey_portal_records`, which holds NVC case numbers and account
  emails. That is stale PII surviving account deletion (a privacy/deletion gap). There is
  also no protection against inserting a bad `journey_id`.
- **Severity:** HIGH.
- **Fix:** Clean any existing orphans, then add
  `FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE` to each.

### H-2. `notifications.journey_id` has no index (slow deletes + slow lookups)
**File:** `20260421_create_notifications_table.sql` (line 7)

`journey_id UUID REFERENCES public.journeys(id) ON DELETE SET NULL` has no index.

- **Why it matters:** Every time a journey is deleted, Postgres must scan the whole
  `notifications` table to null out the link. As the table grows, journey deletes get slow
  and any "notifications for journey X" query scans the whole table.
- **Severity:** MEDIUM-HIGH.
- **Fix:** `CREATE INDEX idx_notifications_journey_id ON notifications(journey_id);`

### H-3. No generated TypeScript types - the app is blind to the schema
**Confirmed:** there is no `database.types.ts` (or equivalent) anywhere in the repo, and
both `lib/supabase/client.ts` and `server.ts` call `createBrowserClient(...)` /
`createServerClient(...)` **without the `<Database>` type**.

- **Why it matters:** Every `.from('...').select()` returns loosely typed data. There is
  zero compile-time link between the SQL schema and the app. Combined with the build
  ignoring TypeScript errors (`ignoreBuildErrors: true`), a renamed or dropped column would
  fail silently at runtime instead of at build time. This is exactly how schema drift like
  CR-6 goes unnoticed.
- **Severity:** HIGH.
- **Fix:** Add `supabase gen types typescript` to the workflow, commit
  `types/database.types.ts`, and pass `<Database>` to both clients.

### H-4. No database or RLS tests exist
**Confirmed:** `__tests__/` has case-strength, stripe (mocked DB), security unit tests, and
app-logic tests, but **zero tests that spin up Postgres or check RLS / user isolation**.

- **Why it matters:** RLS is the *only* wall between user A and user B's data. Given the
  RLS holes found above (CR-1 to CR-5), there is nothing in the test suite that would have
  caught them. The single most valuable missing test: "user A cannot read/update user B's
  journeys, case_data, documents, or portal wallet."
- **Severity:** HIGH (arguably critical, since it is why the CR-level holes shipped).
- **Fix:** Add an integration suite (`supabase start` + pgTAP or two seeded auth users)
  that proves per-user isolation on every user table, plus tests for the progress triggers
  and cascade deletes.

### H-5. `audit_logs` grows forever (no cleanup)
**File:** `20260626_create_audit_logs.sql` (lines 78-84, cleanup is commented out)

The file literally says "logs are retained indefinitely." It is written on every signup,
login, failed login, portal-wallet view, and admin access, and has 4 indexes (each insert
maintains all 4).

- **Why it matters:** At scale this becomes the fastest-growing table with no automatic
  purge - rising storage cost and slower writes.
- **Severity:** HIGH (cost/scale).
- **Fix:** The daily `cron/security-scan` route already runs - attach a
  `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';` (or move old rows
  to cold storage).

### H-6. In-app notifications can be injected by anyone (phishing)
**File:** `20260611_create_user_notifications_and_appointment_user_id.sql` (lines 46-49)

```sql
CREATE POLICY "Service role can insert notifications"
  ON app_notifications FOR INSERT WITH CHECK (true);  -- no TO clause = applies to everyone
```

- **Why it matters:** The intent was "service role only," but with no `TO service_role`
  clause it applies to all roles. Any user can insert a notification for any other user with
  an arbitrary title, body, and `action_url` - an in-app phishing link inside the trusted UI.
- **Severity:** HIGH.
- **Fix:** Add `TO service_role` (a separate service-role policy already covers legit inserts).

### H-7. `user_profiles` and the journey tables are defined twice / inconsistently (drift)
- `user_profiles` is created by both `20260127_add_subscription_fields.sql`
  (with `CHECK (subscription_tier IN ('core','plus','pro'))`) and
  `20260228_15_COMPLETE_PROFILE_FIX.sql` (no CHECK, extra columns). Both use
  `CREATE TABLE IF NOT EXISTS`, so **whichever runs first wins** and the other's columns/
  constraint are silently ignored. If the old CHECK wins, the later
  `20260915_set_user_plan_free.sql` (which sets tier `'free'`) would fail.
- The 4 journey child tables are created both in the individual `20260403_0x_*` files and
  again in `20260403_HASHIR_ALL_TABLES_COMBINED.sql`, with **different constraint sets**.
- **Severity:** HIGH (nondeterministic schema depending on apply order).
- **Fix:** Pick one authoritative definition per table; make the combined file a no-op or
  delete it; use `ADD COLUMN IF NOT EXISTS` and `DROP CONSTRAINT IF EXISTS` + `ADD` so
  re-runs are safe.

### H-8. Empty "RLS security fix" migration
**File:** `20260715_fix_rls_security_gaps.sql` is **empty (2 bytes)**.

The project docs cite this file as an RLS-hardening pass. It does nothing. This very likely
explains why the CR-1 to CR-6 holes still exist - the intended fix was never written, or was
applied by hand in the dashboard and lost.
- **Severity:** HIGH (security posture cannot be reproduced from the repo).
- **Fix:** Recover the intended statements from git history / dashboard and re-commit, or
  remove the file and correct the docs.

### H-9. `app_notifications` migration drops the table with CASCADE
**File:** `20260611_*` runs `DROP TABLE IF EXISTS app_notifications CASCADE;` before creating it.

- **Why it matters:** Any accidental re-run or fresh rebuild silently deletes the table and
  all notifications. Forward migrations should never destroy data.
- **Severity:** HIGH (data-loss footgun).
- **Fix:** Use `CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`; never `DROP TABLE`
  in a forward migration.

### H-10. `profiles.id` has no `ON DELETE` rule (blocks user deletion)
**File:** `20260228_21_create_profiles_and_roles.sql` - `id UUID REFERENCES auth.users(id) PRIMARY KEY`
(no cascade).

- **Why it matters:** The default is RESTRICT, so deleting a user in `auth.users` is blocked
  while a `profiles` row exists. There is an account-deletion feature, and `user_profiles`
  cascades correctly, but `profiles` does not - so hard deletion errors or leaves orphans.
- **Severity:** HIGH.
- **Fix:** Re-create the FK with `ON DELETE CASCADE`.

---

## 4. Medium Priority Issues

### M-1. `steps` triggers do heavy work on every single update (write amplification)
**File:** `20260403_create_steps_table.sql`

Every `UPDATE` on a step fires three triggers, two of which re-count all steps:
- `trg_update_chapter_progress` - `COUNT(*)` of all steps in the chapter, then updates `chapters`.
- `trg_update_journey_progress` - `COUNT(*)` of all steps in the whole journey (join), then updates `journeys`.

Neither has a `WHEN (OLD.status IS DISTINCT FROM NEW.status)` guard, so they run even when
nothing relevant changed. And the app layer *also* recalculates progress separately.

- **Why it matters:** Marking one step complete = full recount of the journey + writes to
  the shared `chapters` and `journeys` rows. This is double work, causes lock contention on
  shared rows during concurrent activity, and is a direct contributor to the known Supabase
  Disk-IO pressure. Also, these triggers are UPDATE-only, so seeding/removing steps leaves
  the stored counters stale.
- **Severity:** MEDIUM.
- **Fix:** Add `WHEN (OLD.status IS DISTINCT FROM NEW.status)` to both; consider one combined
  trigger; and pick either the DB or the app as the single source of progress (not both).

### M-2. The main journey-save path is slow (N+1 upserts + repeated ownership reads)
**Files:** `lib/journey/service.ts` (`batchSetCaseData`), `lib/journey/data-access.ts`

- `batchUpdateCaseDataDB` loops and upserts case_data keys **one at a time**, and each
  upsert first runs a full `SELECT * FROM journeys` ownership check. So saving N keys =
  ~2N round-trips.
- Almost every read/write in `data-access.ts` re-runs `getJourneyDB` (a `SELECT *`) as an
  ownership guard, even though RLS already enforces ownership. `calculateChapterProgress`
  makes ~6 queries where 3 would do.
- **Why it matters:** This is the hottest path (every metadata change), and it multiplies
  database IO - the exact Disk-IO issue already on record.
- **Severity:** MEDIUM (HIGH for cost).
- **Fix:** One `upsert(arrayOfRows, { onConflict: 'journey_id,data_key' })` with a single
  ownership check up front; stop re-reading `getJourneyDB` on every call and rely on RLS.

### M-3. Journey creation writes many tables with no transaction (partial-write risk)
**Files:** `lib/journey/service.ts` (`createJourneyFromConfig`), `app/api/journeys/initialize/route.ts`

Journey seeding inserts the journey, then loops inserting chapters and steps, then
recalculates progress, then creates interview sessions - all as separate statements. The
Supabase JS client has no transaction. If any insert fails mid-way, the user is left with a
half-built journey and there is no rollback.

- **Severity:** MEDIUM.
- **Fix:** Move the whole seed into one Postgres function called via `supabase.rpc(...)` so
  it commits atomically, or delete the journey in the catch block on failure.

### M-4. Document delete/upload are not atomic (orphaned files + a ref-count race)
**Files:** `app/api/documents/[id]/route.ts`, `app/api/documents/upload/route.ts`

- On delete, the metadata row is removed first, then the storage blob. If the storage step
  fails, the file is orphaned. The reference-count guard itself is **correct and user-scoped**
  (`getDocumentsByStoragePath(storagePath, userId)` -> the blob is removed only when no other
  row for that user still references it; verified in code review), so a shared cross-candidate
  copy is not orphaned in the normal case. The remaining risk is purely **concurrency**: two
  simultaneous deletes of two rows that share one storage path can race the count check and
  either orphan the blob or delete one a sibling still needs. (This is why M-4's fix is to do
  the ref-count + delete inside a single DB function/RPC, not to change the guard's logic.)
- On upload, the blob is written first, then the metadata row; if the row insert fails, the
  blob is orphaned.
- **Severity:** MEDIUM.
- **Fix:** Do the ref-count + delete inside a DB function/RPC; add a compensating storage
  delete if the metadata write fails.

### M-5. Some server routes bypass RLS and filter by user_id in code instead
**Files:** `app/api/notifications/route.ts`, `app/api/user-dashboard/services-status/route.ts`

These use the service-role client (which ignores RLS) and then filter by `user_id` manually.
One dropped or wrong filter would leak all users' data. RLS exists precisely to prevent that.
- **Severity:** MEDIUM.
- **Fix:** Use the authenticated session client and let RLS scope the rows. Keep the service
  role only for genuinely session-less contexts (webhooks, cron, storage ops).

### M-6. `case_data` version/touch triggers run on every write (even no-ops)
**File:** `20260403_create_case_data_table.sql`

`update_case_data_updated_at` bumps `version` and copies `data_value` into `previous_value`
on every update (doubling storage for a single level of history), and
`touch_journey_on_case_data_change` writes `journeys.updated_at` on every insert/update.
No "did the value actually change?" guard.
- **Severity:** MEDIUM.
- **Fix:** Guard with `WHEN (OLD.data_value IS DISTINCT FROM NEW.data_value)`.

### M-7. `increment_feature_usage_atomic` can be abused if exposed as an RPC
**File:** `20260430_feature_usage.sql`

The function is `SECURITY DEFINER` (runs with elevated rights) with **no `SET search_path`**
(search-path injection risk), takes the quota `p_limit` **from the caller**, and takes
`p_user_id` (so it can touch any user's counter). If it is callable by `authenticated`
through PostgREST, a user could pass a huge `p_limit` to bypass quotas, or another user's id.
Also, the `feature_usage` UPDATE policy has no `WITH CHECK`, so a user could directly reset
their own `usage_count` to 0.
- **Severity:** MEDIUM.
- **Fix:** Add `SET search_path = public, pg_temp`; `REVOKE EXECUTE` from anon/authenticated
  (call only via service role); derive the limit server-side, not from the argument.

### M-8. Security-question answers stored in plain text
**File:** `20260228_24_create_visa_security_questions.sql` - `answer_1/2/3 text not null`.

Portal security answers are credential-equivalent. RLS is correct, so this is at-rest
exposure (to backups, service role, dashboard), unlike portal-wallet passwords which are
encrypted.
- **Severity:** MEDIUM.
- **Fix:** Encrypt at the API layer (reuse `lib/encryption.ts`) before insert.

### M-9. `journeys.current_chapter_id` / `current_step_id` are not real foreign keys
**File:** `20260403_create_journeys_table.sql` - plain `UUID`, no `REFERENCES`.

When a step/chapter is deleted or re-seeded, these pointers can dangle to rows that no
longer exist.
- **Severity:** MEDIUM.
- **Fix:** Add FKs with `ON DELETE SET NULL`, or null them via a delete trigger.

### M-10. `documents` uses a client-supplied text primary key
**File:** `20260228_19_create_document_vault_tables.sql` - `id TEXT PRIMARY KEY` (no default).

Unlike every other table (which uses `gen_random_uuid()`), the app supplies the id. This
relies entirely on the app for uniqueness/unguessability and is inconsistent.
- **Severity:** MEDIUM (leave as-is if the text ids are load-bearing, but document the scheme).

### M-11. Legacy `user_journey_progress` table duplicates the journey model
**File:** `20260228_23_create_user_journey_progress.sql`

This is the old wizard-state blob (`current_stage` INTEGER, `completed_steps` JSONB,
`journey_id` as TEXT), superseded by journeys/chapters/steps/case_data. Two parallel
"progress" representations invite desync.
- **Severity:** MEDIUM.
- **Fix:** Confirm it is dead, then deprecate/drop it in its own migration.

---

## 5. Low Priority / Improvements

- **L-1. `GRANT SELECT ... TO anon` on `payments` and `user_profiles`.** RLS blocks the
  rows today, so no leak, but the grant is needless attack surface. Revoke it.
- **L-2. ~15 near-identical `updated_at` trigger functions**, and `handle_updated_at()` is
  redefined in several files. Standardize on one shared `set_updated_at()`.
- **L-3. Inconsistent timestamps.** Older tables use nullable `created_at/updated_at`
  (e.g. `documents`), newer ones use `TIMESTAMPTZ NOT NULL DEFAULT NOW()`. Standardize.
- **L-4. Dead enum types** left over after the visa-checker columns were converted to TEXT
  (`20260330_decouple_visa_checker_enums.sql`). Drop once confirmed unused.
- **L-5. Two notification tables modeled differently** (`notifications` uses a status enum
  and references `profiles`; `app_notifications` uses boolean flags and references
  `auth.users`). Consider unifying.
- **L-6. `payments` lets users insert their own rows.** Mitigated today because
  `reconcile.ts` re-verifies with Stripe and fails safe, but future readers of the table
  should not trust `status`/`product_type`. Restrict INSERT to the service role.
- **L-7. `select("*")` almost everywhere.** Fine behind RLS, but over-fetches full rows
  (including `role`, `email`) to the browser. Project explicit columns on hot/browser reads
  (e.g. `AuthContext.fetchProfile`).

---

## 6. Security Findings (summary)

| # | Finding | Severity | Verified |
|---|---|---|---|
| CR-1 | police_verification readable/writable by anon | CRITICAL | Yes (SQL) |
| CR-2 | users can self-upgrade subscription tier | CRITICAL | Yes (SQL) |
| CR-3 | users can self-promote to admin | CRITICAL | Yes (SQL) |
| CR-4 | consultation_bookings world read/write | CRITICAL | Yes (SQL) |
| CR-5 | 5 tables never have RLS enabled | CRITICAL/HIGH | Yes (SQL) |
| H-6 | anyone can inject in-app notifications | HIGH | Yes (SQL) |
| M-7 | feature-usage RPC abuse + quota self-reset | MEDIUM | Yes (SQL) |
| M-8 | security-question answers in plaintext | MEDIUM | Yes (SQL) |

**Positives (already good):**
- No `.env` files are committed; `.env*` is gitignored; the service-role key is never
  exposed with a `NEXT_PUBLIC_` prefix. **Verified.**
- The Document Vault storage bucket is private and correctly scoped per user
  (`foldername[1] = auth.uid()`), and vault files are AES-256-GCM encrypted with a per-user
  key. **Verified.**
- `journey_portal_records` stores no passwords (by design). **Verified.**
- Webhooks (Stripe, EasyPost) are HMAC-verified and idempotent; login is rate-limited with
  progressive lockout; audit logging exists.

**NOT VERIFIED (needs a check against the live project):**
- **Storage buckets other than `document-vault`.** Only the vault bucket has storage
  policies in the migrations. Files for `translation_documents`, `police_verification_requests`,
  `appointments` (scanned passport, K-1 letter), and `user_guide_files` are referenced by
  URL but have **no storage policies in any migration**. If those buckets were created in the
  dashboard as public, the files are directly downloadable by URL regardless of table RLS.
  **Check each bucket's `public` flag and `storage.objects` policies.**

---

## 7. RLS Findings (full coverage matrix)

Legend: **own** = correctly scoped to `auth.uid()`; **own(j)** = scoped via a
`journey_id -> journeys.user_id` subquery; **admin** = `role='admin'` check; **svc** =
service_role; **—** = no policy for that action (denied unless another policy allows it);
**OPEN** = readable/writable by everyone.

| Table | RLS On | SELECT | INSERT | UPDATE | DELETE | Risk |
|---|---|---|---|---|---|---|
| profiles | yes | own + admin | own | own (no column guard) | — | **CRITICAL** self-admin (CR-3) |
| user_profiles | yes | own (+anon grant) | own | own (no column guard) | — | **CRITICAL** self-tier (CR-2) |
| police_verification_requests | yes | **anon + own** | **anon + own** | **anon** | — | **CRITICAL** (CR-1) |
| consultation_bookings | yes | **OPEN** | **OPEN** | admin | — | **CRITICAL** (CR-4) |
| translation_documents | **NO** | OPEN | OPEN | OPEN | OPEN | **CRITICAL** (CR-5) |
| risk_flags | **NO** | OPEN | OPEN | OPEN | OPEN | **CRITICAL** (CR-5) |
| interview_prep_sessions | **NO** | OPEN | OPEN | OPEN | OPEN | **HIGH** (CR-5) |
| interview_prep_answers | **NO** | OPEN | OPEN | OPEN | OPEN | **HIGH** (CR-5) |
| interview_prep_results | **NO** | OPEN | OPEN | OPEN | OPEN | **MEDIUM** (CR-5) |
| app_notifications | yes | own | **OPEN** | own | — | **HIGH** phishing (H-6) |
| payments | yes (+anon grant) | own | own | — | — | MEDIUM self-insert (L-6) |
| feature_usage | yes | own + admin | own | own (no WITH CHECK) | — | MEDIUM quota reset (M-7) |
| visa_security_questions | yes | own | own | own | — | MEDIUM plaintext (M-8) |
| journeys | yes | own + admin | own | own | own | OK |
| chapters / steps / case_data | yes | own(j) + admin | own(j) | own(j) | own(j) | OK |
| documents / document_vault_config | yes | own | own | own | own | OK |
| journey_documents / tool_sessions / journey_portal_records / journey_appointments | yes | own(j) + svc | own(j) | own(j) | own(j) | OK |
| journey_reminders / ceac_case_status / ceac_scheduled_notifications | yes | own(j) + svc | own(j) | own(j) | own(j)/— | OK |
| receipt_records / uscis_case_history / user_quick_access / visa_forms_draft / user_journey_progress | yes | own (+admin) | own | own | own | OK |
| interview_user_answers / interview_prep_session_progress | yes | own via session | own | own | own | OK, but parent table is open (CR-5) |
| audit_logs | yes | own + admin | svc | — | — | OK (immutable) |
| notifications (admin) | yes | own | — | own | — | OK |
| tool_reviews / blog_comments | yes | public-approved + own + admin | own | own + admin | admin | OK (public read intended) |
| guides / user_guides / user_guide_steps / user_guide_files | yes | public / own | own | own | own | OK |
| applicants / appointments | yes | admin/svc | admin/svc | admin/svc | — | OK (admin-only) |
| blog_subscribers | yes | svc | svc | svc | svc | OK |

**Two structural RLS problems that affect many tables:**

- **RLS-1 (performance): `auth.uid()` is not wrapped.** Every policy is written
  `USING (auth.uid() = user_id)`. Postgres re-runs `auth.uid()` for every row on big scans.
  The documented Supabase fix is `USING (user_id = (select auth.uid()))`, which runs it once.
  Matters most on `steps`, `case_data`, `journey_documents`, `audit_logs`. **HIGH (perf).**
- **RLS-2 (possible bug): the `profiles` admin policy queries `profiles` itself.**
  `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` inside a policy
  *on* `profiles` can cause Postgres error `infinite recursion detected in policy for
  relation "profiles"`. This is a well-known Supabase trap. **NOT VERIFIED at runtime** -
  the app may avoid it by reading profiles through the service role - but it should be tested
  on the live database and, if confirmed, moved to a `SECURITY DEFINER is_admin()` helper.

---

## 8. Performance Findings

- **`steps` progress triggers** re-count the whole journey on every step update, with no
  change-guard, and the app recalculates too (see M-1). Biggest single perf/IO issue.
- **`auth.uid()` not wrapped** in RLS policies (RLS-1) - per-row re-evaluation on large reads.
- **Redundant / low-value indexes** on the write-hot journey core (over-indexing):
  - `steps` (~9 indexes + 3 GIN): `idx_steps_chapter_id` (covered by the composites and the
    UNIQUE), `idx_steps_is_visible` (boolean - near useless), `idx_steps_status`,
    `idx_steps_tool_integration` (mostly NULL), `idx_steps_created_at`. Every step update
    maintains all of them.
  - `journeys`: `idx_journeys_user_id` (covered by `idx_journeys_user_status` and the UNIQUE).
  - `chapters`: `idx_chapters_journey_id` (covered by composites + UNIQUE).
  - `case_data`: four indexes lead with `journey_id`; keep `idx_case_data_journey_key`, drop
    the journey_id-only, `is_validated` (boolean), and `source` ones.
  - `feature_usage`: `usage_count DESC` and `created_at` indexes have near-zero read value.
- **GIN indexes on `steps.dependencies`, `steps.visible_when`, `steps.metadata`** are almost
  certainly pure write overhead - these JSONB fields are evaluated in TypeScript
  (`getActiveStepsForStage`), not with SQL JSONB operators. Confirm no SQL `@>`/`?` queries
  hit them, then drop. (This platform is over-GIN'd on `steps`, not under-GIN'd anywhere.)
- **N+1 query patterns** in `data-access.ts` (M-2), `unlockDependentSteps` (per-step
  updates), `deleteAllJourneysDB` (per-journey session deletes), and the cross-share upload
  loop.
- **`services-status` route** runs 4 independent queries in sequence; should be `Promise.all`.

**Good perf practices already present:** `journeys/initialize` is a single combined load with
a 30s cache and parallel `Promise.all`; `getJourneyProgressSummary` fixed an older N+1; the
admin audit-logs route is properly paginated; case_data profile-sync has a no-op guard.

---

## 9. Scalability Findings

Assume the user base grows. The largest / fastest-growing tables and where they hurt:

- **`steps`** - one row per step per journey (~50-80 per IR-1 journey). ~5-8M rows at
  100k users, ~50-80M at 1M. Made worse because stale step rows are never deleted
  (`syncStepsBackground` only inserts) and every update fires the recount triggers. This is
  the #1 scale concern. Fix the triggers (M-1) and add a stale-row cleanup.
- **`audit_logs`** - unbounded, no retention (H-5). Fastest-growing at scale.
- **`notifications` / `app_notifications` / `ceac_scheduled_notifications`** - no cleanup.
  `notifications` also has `REPLICA IDENTITY FULL` and is in the realtime publication, so
  every change writes a full-row to the WAL - extra IO as volume grows. Purge delivered/read
  rows periodically.
- **`case_data`** - bounded per journey (one row per key), but the touch/version triggers
  fan out a `journeys` write on every change (M-6). And `previous_value` doubles storage.
- **`user_profiles.profile_details`** (the MasterProfile JSONB blob) is read whole on every
  profile load and grows as candidate rosters and mirrored case_data are stored inside it.
  Monitor its size; consider splitting candidates out if it gets large.
- **`feature_usage`** - has no time-window column, so recurring (e.g. monthly) quotas cannot
  be expressed in the schema; a reset needs an app-driven update. Fine at low scale, awkward
  later.

**Rough trigger points:**
- **~1k-10k users:** current design is fine; the RLS holes are the only "must fix."
- **~10k-100k users:** the `steps` triggers, unwrapped `auth.uid()`, and `audit_logs`
  growth start to show up as IO/latency. Do the perf/retention fixes here.
- **~100k-1M users:** you will want incremental progress counters (not full recounts),
  table partitioning or archival for `audit_logs`/notifications, and connection pooling
  (Supabase's Supavisor/pgBouncer) tuned for serverless.

---

## 10. Data Integrity Findings

- Missing foreign keys on 4 journey child tables (H-1) and on `journeys.current_*` (M-9),
  and soft references (`journey_documents.vault_file_id`, `journey_reminders.reference_id`).
- Deleting a journey cascades to `documents` rows but leaves **orphaned storage blobs**
  (nothing cleans the actual files) - verified in `20260717_add_journey_id_to_documents.sql`
  plus the delete route.
- `profiles.id` cannot be deleted (H-10), so account deletion can fail or orphan.
- Dual-definition drift on `user_profiles` and the journey tables (H-7).
- `payments.product_type` CHECK contradicts the app (CR-6) - the clearest sign the live DB
  differs from the migrations.
- The `documents` update RLS policy has no `WITH CHECK` (defaults to USING for UPDATE, so
  it is safe, but inconsistent with the stricter tables).

---

## 11. Migration Findings

- **No rollback / down migrations anywhere** - all 81 files are forward-only, and there is no
  sign of the Supabase CLI migration-tracking table. Rollback strategy = none.
- **Ordering relies on filename timestamps**, and many share a day with ad-hoc numeric
  prefixes. Child tables (`20260403_01..04`) sort *before* the `journeys` create - it only
  works because those children have no FK to journeys (which is finding H-1).
- **`psql`-only syntax** (`\i`, `\echo`) in `20260228_31_run_all_migrations.sql`,
  `20260228_15_COMPLETE_PROFILE_FIX.sql`, `20260203_create_user_profile_trigger.sql` - these
  do not run in the Supabase SQL editor / dashboard.
- **`20260228_31_run_all_migrations.sql` is misleading** - it includes only 3 files despite
  the name.
- **A per-user data patch is committed as a schema migration** -
  `20260915_set_user_plan_free.sql` hardcodes one user's UUID and flips their tier/payments.
  This runs on every fresh build. Move one-off ops to an ad-hoc script outside `migrations/`.
- **Uneven idempotency** - most tables use `CREATE TABLE IF NOT EXISTS` and enum guards
  (good), but there are bare `ADD CONSTRAINT` (individual `20260403_01`), a `DROP TABLE ...
  CASCADE` (H-9), and duplicate `CREATE POLICY` in the combined file that would fail on re-run.
- **Possible syntax errors that would abort a file** (need runtime confirmation):
  `interview_prep_answers` trailing comma (`20260228_26`), `CREATE INDEX` inside a
  `CREATE TABLE` body (`20260330_interview_user_answers.sql`), and a broken
  `NEW updated_at = NOW()` (missing dot) in `20260228_17` (later re-created correctly).

**Recommendation:** adopt the Supabase CLI migration workflow (tracked history, ordered
timestamps), make every migration idempotent, and stop editing the dashboard.

---

## 12. Storage Findings

- **Document Vault bucket: good.** Private bucket, 10MB limit, per-user folder policies
  (`{userId}/{documentId}/{filename}` with `foldername[1] = auth.uid()`), files AES-256-GCM
  encrypted with a per-user key. Verified in `20260319_secure_document_vault_storage.sql`.
- **Other buckets: NOT VERIFIED and a likely gap.** No storage policies exist in migrations
  for the files referenced by `translation_documents`, `police_verification_requests`,
  `appointments`, or `user_guide_files`. If those buckets are public, the files are
  downloadable by URL regardless of table RLS. **Check them in the dashboard.**
- **Orphaned blobs.** Deleting a journey/user removes metadata rows but not the underlying
  storage files (no cascade reaches storage). Needs a cleanup job.
- The vault reference-count on delete is a good idea but has a race (M-4).

---

## 13. Monitoring / Reliability Findings

There is application-level audit logging and a daily security scan, but **no database-level
monitoring** is set up in the repo. Recommend turning on / watching:
- Slow query log (Supabase dashboard -> Query Performance / `pg_stat_statements`).
- Database size and per-table growth (especially `steps`, `audit_logs`, notifications).
- Index usage (`pg_stat_user_indexes`) - to confirm the "unused index" findings before
  dropping.
- Connection count vs the plan limit (serverless functions can exhaust connections; use
  Supavisor/pgBouncer pooling).
- RLS/permission errors and failed-transaction rates.
- Realtime subscription volume on `notifications`.
- Alerts on the above thresholds.

**Backups / disaster recovery (NOT VERIFIED):**
- Confirm which Supabase plan is in use and whether **Point-in-Time Recovery (PITR)** is
  enabled (Free/Pro have only daily backups; PITR is an add-on). Daily backups can lose up
  to 24h of data.
- Storage files are **not** included in Postgres PITR - confirm a separate backup for the
  storage bucket.
- **Do a real restore test** at least once - do not assume "Supabase backs up" is enough.
- Because there are no down-migrations, plan a manual rollback procedure per risky migration.

---

## 14. Technical Debt (things that work but should be cleaned up)

- Two user tables (`profiles` + `user_profiles`) and two signup triggers on `auth.users`.
- Legacy `user_journey_progress` table duplicating the journey model (M-11).
- Duplicate/near-duplicate `updated_at` functions (L-2) and the big combined/run-all
  migration files (H-7, Section 11).
- Dead enum types (L-4), commented-out `auto_complete_chapter` trigger, dead code paths.
- No generated DB types (H-3); builds ignore type errors, hiding drift.
- `select("*")` and manual RLS-in-code patterns scattered through the API layer.

---

## 15. Recommended Future Architecture (how the DB should evolve)

You do **not** need a rewrite. Keep the current normalized journey model - it is good. Evolve
it like this:

1. **Make the database the security boundary, not the app.** Turn RLS on everywhere, wrap
   `auth.uid()`, and move admin checks into a `SECURITY DEFINER is_admin()` helper (or a
   dedicated admin table). Protect privileged columns (tier, role) with triggers or column
   grants. Add RLS isolation tests so holes cannot ship again.
2. **One source of truth for progress.** Either the DB triggers or the app service computes
   progress - not both. Prefer incremental counters over full recounts as you scale.
3. **Add a types + migration pipeline.** Generate `database.types.ts`, type the clients, and
   move to the Supabase CLI migration workflow with tracked history and (where practical)
   reversible migrations. Stop dashboard edits.
4. **Retention and archival.** Scheduled cleanup for `audit_logs`, notifications, soft-deleted
   rows, orphaned storage blobs, and failed uploads.
5. **Wrap multi-table writes (journey seed, document delete, candidate creation) in RPC
   functions** so they are atomic.
6. **At high scale:** connection pooling (Supavisor), partition/archive the biggest log
   tables, and monitor `profile_details` JSONB size (split candidates out if needed).

The multi-candidate design (one journey per candidate via `journey_type`, no `candidate_id`
column, rosters in `profile_details`) is fine and should be **preserved** - none of the
recommendations above require touching it, and the earlier "store candidates inside the
Document Vault" approach should **not** be reintroduced. **Cross-candidate document sharing**
reuses the existing per-user cross-journey share (`documents.shareWithJourneyIds`), scoped to
**sibling candidates of the same base visa category only** (IR-5 with IR-5, IR-2 with IR-2);
IR-1 is deliberately kept out of the candidate system. This means the same storage blob can be
referenced by more than one `documents` row (one per journey), which is exactly why the delete
path must reference-count `storage_path` (see M-4) - that behavior stays required.

---

## 16. Recommended Action Plan

For each item: file/table, problem, and whether a migration / downtime / data migration is
needed. **All security fixes are RLS/policy/grant/trigger changes - no downtime, no data
migration** (a couple need a quick orphan-cleanup first).

### NOW (before real production traffic)
| # | Item | Migration? | Downtime? | Data migration? |
|---|---|---|---|---|
| CR-1 | Fix police_verification anon policy | Yes | No | No |
| CR-2 | Block self-upgrade of subscription tier | Yes | No | No |
| CR-3 | Block self-promotion to admin | Yes | No | No |
| CR-4 | Fix consultation_bookings world read/write | Yes | No | No |
| CR-5 | Enable RLS on the 5 open tables + policies | Yes | No | No (verify no anon path first) |
| CR-6 | Fix payments product_type CHECK + audit dashboard for other drift | Yes | No | Verify existing rows first |
| H-6 | Scope app_notifications INSERT to service_role | Yes | No | No |
| H-8 | Investigate/recover the empty RLS-fix migration | Yes | No | No |
| — | Verify non-vault storage buckets are private (NOT VERIFIED) | Maybe | No | No |
| H-4 | Add RLS cross-user isolation tests | No (test code) | No | No |

### NEXT (soon)
| # | Item | Migration? | Downtime? | Data migration? |
|---|---|---|---|---|
| H-1 | Add FKs on 4 journey child tables | Yes | No | Clean orphans first |
| H-2 | Add `notifications.journey_id` index | Yes | No | No |
| H-3 | Generate + commit DB types; type the clients | No | No | No |
| H-5 | Add `audit_logs` retention job | Yes (or cron) | No | No |
| H-7 | Consolidate duplicate table definitions | Yes | No | No |
| H-9 | Remove `DROP TABLE CASCADE` from app_notifications migration | Yes | No | No |
| H-10 | Add `ON DELETE CASCADE` to `profiles.id` | Yes | No | No |
| M-1 | Guard/simplify the `steps` progress triggers | Yes | No | No |
| M-2 | Batch case_data upsert; stop redundant ownership reads | No (code) | No | No |
| M-7 | Harden `increment_feature_usage_atomic` + feature_usage UPDATE policy | Yes | No | No |
| RLS-1 | Wrap `auth.uid()` as `(select auth.uid())` in policies | Yes | No | No |

### LATER (as scale increases)
| # | Item | Migration? | Downtime? | Data migration? |
|---|---|---|---|---|
| M-3 | Wrap journey seed in an RPC (atomic) | Yes (function) | No | No |
| M-4 | Atomic document delete/upload + orphan blob cleanup | Yes + code | No | No |
| M-6 | Guard case_data version/touch triggers | Yes | No | No |
| M-8 | Encrypt security-question answers | No (code) | No | Backfill existing rows |
| Perf | Drop redundant/unused indexes + GIN on `steps` | Yes | No | No |
| Scale | Notification retention; stale-step cleanup; PITR; pooling; partitioning | Mixed | No | No |
| M-11 | Retire legacy `user_journey_progress` | Yes | No | Confirm no reads first |

### DO NOT (leave as-is - already appropriate)
- **Do not** reintroduce storing multiple candidates inside the Document Vault. The current
  one-journey-per-candidate design (`journey_type`, rosters in `profile_details`) is correct.
- **Do not** add a `candidate_id` column or a candidates table; candidates are separate
  `journeys` rows and rosters live in `profile_details`. Cross-candidate sharing rides
  `documents.shareWithJourneyIds` (same base visa category only, IR-1 excluded).
- **Do not** change the Document Vault storage design - private bucket + per-user folder +
  per-user encryption is good.
- **Do not** switch the "My Journeys" step count back to counting DB `steps` rows - the JSON
  is intentionally the source of truth (stale-row issue is documented).
- **Do not** add GIN indexes to `case_data.data_value`, `profile_details`, or other JSONB
  columns - nothing queries them by inner key in SQL.
- **Do not** trust the webhook as the Stripe source of truth - `verify-session` is correct.
- **Do not** add JSONB GIN on `chapters.visible_when` - it is evaluated in the app.

---

## Appendix: Exact things that need attention

**Migrations (SQL):**
- `20260228_29_police_verification_schema.sql` - fix anon `FOR ALL` policy (CR-1)
- `20260228_14_add_rls_policies_for_consultation.sql` - drop public policies (CR-4)
- `20260228_22_create_translation_documents_table.sql` - enable RLS (CR-5)
- `20260228_30_risk_flags_table.sql` - enable RLS (CR-5)
- `20260228_26/27/28_interview_prep_*` - enable RLS (CR-5); fix trailing-comma in `_26`
- `20260228_25_fix_profiles_policies.sql` - block role self-change; fix self-referencing admin policy (CR-3, RLS-2)
- `20260127_add_subscription_fields.sql` / `20260228_15_COMPLETE_PROFILE_FIX.sql` - block tier self-change; consolidate duplicate table def (CR-2, H-7)
- `20260127_create_payments_table.sql` - fix product_type CHECK; drop anon grant (CR-6, L-1)
- `20260611_create_user_notifications_and_appointment_user_id.sql` - scope INSERT; remove DROP CASCADE (H-6, H-9)
- `20260403_create_steps_table.sql` - trigger guards + drop redundant/GIN indexes (M-1, perf)
- `20260403_create_case_data_table.sql` - trigger guards; trim indexes (M-6, perf)
- `20260403_01..04_*` + `20260403_HASHIR_ALL_TABLES_COMBINED.sql` - add journey FKs; de-duplicate (H-1, H-7)
- `20260403_create_journeys_table.sql` - FKs on current_chapter/step; drop redundant index (M-9)
- `20260421_create_notifications_table.sql` - add journey_id index (H-2)
- `20260626_create_audit_logs.sql` - add retention (H-5)
- `20260430_feature_usage.sql` - harden RPC + UPDATE policy (M-7)
- `20260228_24_create_visa_security_questions.sql` - plan app-layer encryption (M-8)
- `20260228_21_create_profiles_and_roles.sql` - add ON DELETE CASCADE (H-10)
- `20260715_fix_rls_security_gaps.sql` - empty; recover intended fixes (H-8)
- `20260915_set_user_plan_free.sql` - move out of migrations (Section 11)

**Tables to protect / fix:** police_verification_requests, consultation_bookings,
translation_documents, risk_flags, interview_prep_sessions/answers/results, app_notifications,
profiles, user_profiles, payments, feature_usage, visa_security_questions.

**App code:** `lib/supabase/client.ts` + `server.ts` (add `<Database>`),
`lib/journey/data-access.ts` + `service.ts` (N+1, ownership reads, atomic seed),
`app/api/documents/[id]/route.ts` + `upload/route.ts` (atomicity), `app/api/notifications/route.ts`
+ `app/api/user-dashboard/services-status/route.ts` (service-role bypass, sequential queries).

**Verify manually (NOT VERIFIED from files):** non-vault storage bucket privacy;
`profiles` RLS recursion on the live DB; whether the syntax-error migrations actually applied;
backup/PITR configuration and a restore test.

---

*End of audit. No changes have been made. Awaiting approval before any fix is implemented.*
