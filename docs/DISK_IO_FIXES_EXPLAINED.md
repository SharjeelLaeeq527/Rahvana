# Supabase Disk IO Fixes — Explained in Simple Words

**Date:** 2026-09-15
**Database:** Rahvana-Prod-DB
**Why this doc exists:** Supabase sent a "Disk IO Budget depleting" warning email. This file explains, in easy English, what the problem was, what we found, and every fix we made — so anyone (even without a coding background) can follow it.

---

## 1. First, what is "Disk IO"? (the almari analogy)

Think of the database as a big **almari (cupboard)** full of files.

- Every time someone **reads** a file (opens a drawer to look), that costs a little effort.
- Every time someone **writes** a file (puts a paper back in, or rewrites a whole page), that costs even more effort.

Supabase gives us a **daily budget** of this effort. It is like a battery.

Our app was **opening and rewriting files too often** — even when nothing had changed. The battery was draining fast. Supabase warned us: "You are using your Disk IO budget too quickly."

**Important:** The problem was NOT that the database was missing indexes on big tables (those were mostly fine). The problem was **too many repeated reads and too many pointless writes**.

---

## 2. How we found the cause

We looked at the code and at Supabase's own query stats (`pg_stat_statements`, which counts how many times each query runs).

We found **7 culprits**, ranked by how much damage they caused. Below, each one is explained: **what it was before**, **why it was bad**, and **what we changed**.

---

## 3. The fixes (one by one)

### Fix #1 — The Notification Poller in the header (BIGGEST culprit)

**File:** `app/components/layout/SiteHeader.tsx`

**What it was before:**
The top header (which is on *every* page) was checking for new notifications **every 2 minutes**. And each check was not one request — it fanned out into many:
- Get all journeys →
- For each journey, get its reminders →
- Get notifications.

So one "check" = several database reads. And it ran **for every logged-in user, on every page, even when the browser tab was hidden in the background**.

**Why it was bad (the analogy):**
Imagine a guard who runs to the almari to check for new mail **every 2 minutes, all day, even at night when the office is closed**. That is a huge waste.

**What we changed:**
- Changed the check from **every 2 minutes → every 10 minutes**.
- Added a rule: **if the browser tab is hidden (not visible), do NOT check at all.** No point checking mail for an office nobody is looking at.
- When the user comes back to the tab, we check again — but only if at least 1 minute has passed (a small "cooldown" so it doesn't spam).

**Result:** Massively fewer reads, because the #1 constant drain is now slow and only runs when someone is actually looking.

---

### Fix #2 — Plan "reconcile" on every page load

**File:** `app/context/PlanContext.tsx`

**What it was before:**
Every time any page loaded, the app called `/api/plan/reconcile`. This checks the user's payment/subscription status — it reads the `payments` table AND talks to Stripe. It ran **on every single page load**.

**Why it was bad:**
Checking "did this person pay?" on *every* page is overkill. A user's plan does not change 50 times a day. It is like re-verifying someone's ID card every time they walk through a door in the same building.

**What we changed:**
- Now it only reconciles **once per 24 hours per user**. We remember the last check time in the browser (`localStorage`), key `plan_reconciled_at_<userId>`.
- BUT — if the user just finished a payment, we **force** a fresh check immediately. The payment-success page calls `refresh()`, which bypasses the 24h wait. So a real upgrade is never delayed.

**Result:** A `payments` read + Stripe call went from "every page" to "once a day" — while still being instant right after a purchase.

---

### Fix #3 — Audit logs on every admin request (3 fixes here)

**Files:** `lib/supabase/middleware.ts`, `lib/security/alerting.ts`, `app/api/cron/security-scan/route.ts`, `app/api/admin/audit-logs/route.ts`, plus a new migration.

**The diary analogy:** `audit_logs` is a **security diary** — every sensitive action gets written down.

**What it was before + what we changed:**

**(a) Writing a diary entry on EVERY admin request**
- Before: every time an admin page made *any* request (even just viewing/GET), we wrote a new "admin.access" line into the diary. The admin dashboard also polls every 30 seconds — so the diary was being written into constantly.
- After: we only write the diary entry for **mutations** (actions that actually change something — POST/PUT/DELETE), not for plain views (GET/HEAD/OPTIONS).
- Analogy: only note it in the diary when someone *does* something, not every time they *glance* at a page.

**(b) The security scan read the whole diary with no limit**
- Before: `runSecurityScan` read failed-login and blocked-attempt rows with **no limit** — as the diary grew, this got heavier and heavier.
- After: added `.limit(5000)` to both scan queries. It reads at most 5000 recent rows, not the entire history.

**(c) The diary was never cleaned out**
- Before: `audit_logs` grew forever. An always-growing table means slower reads and more disk use.
- After: added a new function `pruneOldAuditLogs(90)` that **deletes entries older than 90 days**. It runs once a day from the `cron/security-scan` job. The diary now keeps only the last 90 days.

**(d) The admin viewer counted the whole table exactly**
- Before: the admin audit-log viewer used `count: "exact"`, which forces the DB to count *every* row on each page view — expensive on a big table.
- After: changed to `count: "planned"` — the DB gives a fast estimate instead of a slow exact count.

**(e) A missing index**
- The blocked-status scan was searching an unindexed column (`status`), which means a full-table scan.
- New migration `20260914_audit_logs_status_index.sql` adds an index on `(status, created_at DESC)` so that search is fast (like a book's index instead of flipping every page).

> **Surprise we discovered:** When running this migration on production, we got `relation "audit_logs" does not exist`. That means the audit_logs table had **never been created on production** — so security logging had silently been failing on prod the whole time (the logging code is "fire-and-forget", so it failed quietly). We fixed it by creating the table + its indexes + security policies on prod. **This was a hidden bug we found as a bonus.**

---

### Fix #4 — case_data redundant writes (write amplification)

**Files:** `lib/journey/CaseStrengthEngine.ts`, `app/api/case_data/route.ts`

**The key idea — "write amplification":** One user action was causing **multiple full rewrites** in the database, even when the values did not change.

**What it was before:**

**(a) The case-strength score was re-saved every single time**
- Every time any case_data was saved, the app recalculated the "case strength score" and **wrote it back** — even if the new score was exactly the same as the old one.
- Writing a value that is already there is pure waste. And each write touches indexes + a history trigger.

**What we changed:**
```js
const previousScore = Number(caseProfile.all_data?.case_strength_score?.data_value);
if (previousScore !== finalScore) {
  // only write when the score ACTUALLY changed
  await this.caseDataService.setCaseData(journeyId, "case_strength_score", finalScore, {...});
}
```
Now: **only write the score if it is different** from what is already saved.

**(b) The whole profile JSONB was rewritten every time**
- `case_data` changes also mirror into `user_profiles.profile_details` (a big JSONB blob, so tools share one profile).
- Before: this rewrote the **entire profile row** every time — even if the merged result was identical to what was already stored. Rewriting a whole JSONB blob is one of the most expensive writes there is (it also writes to the WAL / write-ahead log).

**What we changed:**
```js
// No-op guard: if the merged result equals what's already there, skip the write.
if (JSON.stringify(newProfileDetails) === JSON.stringify(currentProfile)) {
  return;
}
```
Now: **only rewrite the profile if something actually changed.**

**Analogy:** Before, every time you touched one file, we photocopied the *entire* folder and put a fresh copy back — even if nothing was different. Now we only make a new copy when the content genuinely changed.

---

### Fix #5 — Interview "my-sessions" page polling every 5 seconds

**File:** `app/(tools)/interview-prep/my-sessions/page.tsx`

**What it was before:**
This page refreshed its data **every 5 seconds**. That is 12 database reads per minute, per open page.

**What we changed:**
- Changed **5 seconds → 30 seconds**.
- Kept the existing rule that it only polls when the tab is visible.

**Result:** 6x fewer reads from this page. 5 seconds was far too aggressive for session data that rarely changes that fast.

---

### Fix #6 — Missing index for the payments reconcile query

**File (migration):** `supabase/migrations/20260915_payments_reconcile_index.sql`

**What it was before:**
The reconcile query looks up payments by `user_id` + `product_type`, sorted by newest first. There was no index matching that pattern, so the DB had to work harder to find the rows.

**What we changed:**
```sql
CREATE INDEX IF NOT EXISTS idx_payments_user_product_created
  ON public.payments (user_id, product_type, created_at DESC);
```

**Analogy:** This is like adding an index page to a book so you can jump straight to the right chapter, instead of reading every page to find it.

---

## 4. Summary table

| # | Problem (before) | Fix (after) | File |
|---|---|---|---|
| 1 | Header polled notifications every 2 min, even on hidden tabs | Every 10 min, only when tab visible | `SiteHeader.tsx` |
| 2 | Plan/payment re-checked on every page load | Once per 24h; forced only after payment | `PlanContext.tsx` |
| 3a | Diary entry written on every admin view | Only on real changes (mutations) | `middleware.ts` |
| 3b | Security scan read whole diary, no limit | Capped at 5000 recent rows | `alerting.ts` |
| 3c | Diary grew forever | Auto-delete entries older than 90 days | `alerting.ts` + `cron/security-scan` |
| 3d | Admin viewer counted whole table exactly | Fast estimated count | `admin/audit-logs/route.ts` |
| 3e | Blocked-status search had no index | Added index on (status, created_at) | migration `20260914` |
| 4a | Case score re-saved even when unchanged | Only save when score changed | `CaseStrengthEngine.ts` |
| 4b | Whole profile JSONB rewritten every time | Skip write if nothing changed | `case_data/route.ts` |
| 5 | Interview page polled every 5 sec | Every 30 sec | `my-sessions/page.tsx` |
| 6 | Payments reconcile query had no matching index | Added composite index | migration `20260915` |

---

## 5. Two things to remember (action items)

1. **SQL migrations are NOT applied automatically.** They must be run by hand on each database (prod AND staging) in the Supabase SQL editor:
   - `20260914_audit_logs_status_index.sql` — **DONE** on prod + staging.
   - `20260915_payments_reconcile_index.sql` — **needs to be run** (the `CREATE INDEX` above).

2. **Check the results after 6-12 hours.** The Supabase query stats were reset on 2026-09-15. After the app has run for half a day with the fixes deployed, re-check `pg_stat_statements` (top queries by number of calls) to confirm the drop and spot any new top culprit.

---

## 6. One known bigger item, left for later

There is still one heavy pattern: `auth.getUser()` (session lookup) runs on **every single API request** — we saw 230,000+ of these in the stats. It was being amplified by the same pollers we just slowed down, so fixing #1-#6 already reduces it a lot. Cutting it further would be a bigger change (reducing how often we verify the session), so we noted it as a **future optimization**, not part of this round.

---

## 7. Boss-friendly one-liner

> "The database was doing far too much repeated work — background pollers checking too often, and the app rewriting data that hadn't changed. We slowed the pollers down (and stopped them running on hidden tabs), made plan/payment checks happen once a day instead of every page, stopped rewriting data that was identical, and cleaned up the security-log table. We also found and fixed a hidden bug: the security-audit table never existed on production. Two small index commands still need to be run on the database, and we'll confirm the drop in load in 6-12 hours."
