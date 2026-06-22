# Spec: Partner / Spouse Collaboration ("Invite Your Spouse")

**Status:** Draft for review
**Owner:** Hashir
**Branch target:** new feature branch off `main`

---

## 1. Goal

An IR-1 case is inherently a **two-person** process (US **petitioner** + foreign **beneficiary**), but today the app is **single-user**: one Supabase account owns one journey, and the second person only exists as `sponsor.*` fields inside the owner's profile.

This feature lets **both spouses log in with their own accounts and collaborate on one shared case.**

### Confirmed product decisions

| Decision | Choice |
| --- | --- |
| Collaboration model | **One shared case** — both edit the same journey, documents, progress |
| Billing | **No extra payment.** The owner buys ONE plan (basic/premium/executive). The spouse joins **free** and **inherits the owner's plan** for the shared case. There is NO "partner seat" / add-on. |
| Partner permissions | **Full edit access** (same as owner) |
| Invite delivery | **Secure email link** (reuse `lib/email/resend.ts`). The **link itself is the secret** — whoever opens the valid, single-use token may accept with **any** account. The owner can send to any email; the invitee can sign up / log in with any email. |
| Max collaborators | **One** partner per case. Owner cannot send more than one invite. |
| Role assignment | After both are in the case, the **owner decides who is petitioner vs beneficiary**; this drives OCR/autofill routing and case-strength scoring |
| Case-strength | Already lives inside the journey steps → becomes **shared automatically** with the journey. No separate work. |

### Non-goals (v1)

- More than 2 people per case.
- Granular per-step permissions (partner gets full edit).
- Real-time presence / live cursors (data is shared but not live-collaborative).
- Transferring case ownership between accounts.

---

## 2. Why the role-decision step matters

Today the bridge in `lib/autoFill/journeyProfileBridge.ts` assumes:

- **account holder = beneficiary** → top-level `profile_details` fields
- **petitioner = sponsor** → `sponsor.*` fields

With two real logins, this assumption breaks — the **US petitioner** spouse may be the one who signs up and pays. If we don't capture roles explicitly:

- OCR can't tell whether an uploaded passport belongs to the petitioner or the beneficiary.
- Case-strength questions ("sponsor's annual income" vs "beneficiary's country of residence") can't be auto-filled correctly.

So each collaborator carries a **`case_role`** (`petitioner` | `beneficiary`). Once set, the **current logged-in user's `case_role`** routes their uploads and tool inputs to the correct section of the shared case data.

---

## 3. User flow

```
1. Owner buys a journey/plan (existing flow) — basic / premium / executive.
2. Owner opens Case Settings → "Invite your spouse" (NO extra payment).
   Enters spouse's email → invite email sent (Resend) with a secure token link.
   Only one invite allowed per case.
3. Spouse clicks the link → /invite/accept?token=...
   - Must sign up / log in with the EXACT invited email (any other email blocked).
   - On accept → spouse added to case_collaborators (membership_role = 'partner').
   - Spouse now inherits the owner's plan for this shared case (free for them).
4. ROLE DECISION GATE (first time both are in the case):
   - Owner assigns: "I am the [petitioner/beneficiary]; my spouse is the other."
   - Writes case_role for BOTH collaborator rows.
   - Until set, the case dashboard shows a "Finish setup: assign roles" gate.
5. Both spouses now use the SAME journey. OCR/autofill/case-strength route by
   each user's case_role.
```

---

## 4. Data model changes

One migration: `supabase/migrations/2026XXXX_create_case_collaboration.sql`.

### 4.1 New table — `case_collaborators`

Links users to a journey and records each member's case role.

```sql
CREATE TABLE public.case_collaborators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL DEFAULT 'partner'      -- 'owner' | 'partner'
                  CHECK (membership_role IN ('owner','partner')),
  case_role       TEXT                                  -- 'petitioner' | 'beneficiary' | NULL
                  CHECK (case_role IS NULL OR case_role IN ('petitioner','beneficiary')),
  status          TEXT NOT NULL DEFAULT 'active'        -- 'active' | 'removed'
                  CHECK (status IN ('active','removed')),
  invited_email   TEXT,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (journey_id, user_id)
);

-- Exactly one petitioner and one beneficiary per active case.
CREATE UNIQUE INDEX uniq_case_role_per_journey
  ON public.case_collaborators (journey_id, case_role)
  WHERE case_role IS NOT NULL AND status = 'active';

CREATE INDEX idx_case_collaborators_user   ON public.case_collaborators (user_id);
CREATE INDEX idx_case_collaborators_journey ON public.case_collaborators (journey_id);
```

**Backfill:** for every existing journey, insert one `owner` row
(`user_id = journeys.user_id`, `membership_role = 'owner'`, `case_role = 'beneficiary'`)
to preserve today's "account holder = beneficiary" behavior. The role gate only
ever blocks once a *partner* is added.

> **Guard against orphaned journeys.** `case_collaborators.user_id` has an FK to
> `auth.users(id)`. If any legacy `journeys` row points at a `user_id` that no
> longer exists in `auth.users`, the backfill INSERT would violate the FK and
> abort the whole migration. The backfill must therefore guard with
> `WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = j.user_id)` and use
> `ON CONFLICT (journey_id, user_id) DO NOTHING` so the migration is re-runnable.

### 4.2 New table — `case_invites`

```sql
CREATE TABLE public.case_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id    UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  invited_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,        -- store HASH of token, not the raw token
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at    TIMESTAMPTZ NOT NULL,        -- e.g. now() + 7 days
  accepted_by   UUID REFERENCES auth.users(id),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_invites_email ON public.case_invites (lower(invited_email));
```

> **Security note:** store only the SHA-256 **hash** of the invite token in
> `token_hash`. The raw token lives only in the emailed link. Acceptance hashes
> the incoming token and looks it up.

### 4.3 Membership helper function

```sql
CREATE OR REPLACE FUNCTION public.is_journey_member(p_journey_id UUID, p_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.journeys j
      WHERE j.id = p_journey_id AND j.user_id = p_uid
  ) OR EXISTS (
    SELECT 1 FROM public.case_collaborators c
      WHERE c.journey_id = p_journey_id
        AND c.user_id = p_uid
        AND c.status = 'active'
  );
$$;
```

(Function is `SECURITY DEFINER` so it can be referenced inside RLS policies on
the member tables without recursive RLS issues.)

### 4.4 Optional — link case-strength to the journey

`user_case_sessions` is currently `user_id`-scoped only. To make case-strength
shared and role-aware, mirror what the interview-prep migration already did
(`20260602_interview_sessions_journey_integration.sql`): add a nullable
`journey_id UUID REFERENCES journeys(id)` to `user_case_sessions` and prefer the
shared journey's `case_data` when scoring. (Can be a fast-follow if we want to
keep v1 smaller — call out as a phase-2 item.)

---

## 5. RLS changes

This is the **highest-risk** part of the work — it touches security-sensitive
policies. All changes go in the same migration (per CLAUDE.md: never edit RLS
outside a migration).

### 5.1 Member tables — switch owner check → membership check

For each journey-scoped table, the SELECT/UPDATE (and partner-relevant
INSERT/DELETE) policies change from `auth.uid() = user_id` /
`journeys.user_id = auth.uid()` to `is_journey_member(<journey_id>, auth.uid())`.

Tables affected:

| Table | Today's scope | New scope |
| --- | --- | --- |
| `journeys` | `auth.uid() = user_id` | SELECT/UPDATE: `is_journey_member(id, auth.uid())`. INSERT/DELETE stay **owner-only** (`auth.uid() = user_id`). |
| `chapters` | via `journeys.user_id` | via `is_journey_member(journey_id, auth.uid())` |
| `steps` | via `chapters → journeys.user_id` | via `is_journey_member(chapters.journey_id, auth.uid())` |
| `case_data` | via `journeys.user_id` | via `is_journey_member(journey_id, auth.uid())` |
| `tool_sessions` | via `journeys.user_id` | via `is_journey_member(journey_id, auth.uid())` |
| `journey_documents` | via `journeys.user_id` | via `is_journey_member(journey_id, auth.uid())` |

Example (journeys SELECT):

```sql
DROP POLICY IF EXISTS "Users can view own journeys" ON public.journeys;
CREATE POLICY "Members can view case journeys" ON public.journeys
  FOR SELECT USING (public.is_journey_member(id, auth.uid()));
```

Example (case_data, transitive):

```sql
DROP POLICY IF EXISTS "Users can view own case_data" ON public.case_data;
CREATE POLICY "Members can view case_data" ON public.case_data
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));
-- repeat for INSERT (WITH CHECK), UPDATE, DELETE
```

> Admin "view all" policies remain untouched.

### 5.2 `case_collaborators` RLS

```sql
ALTER TABLE public.case_collaborators ENABLE ROW LEVEL SECURITY;

-- A member can see the collaborator list of cases they belong to.
CREATE POLICY "Members can view collaborators" ON public.case_collaborators
  FOR SELECT USING (public.is_journey_member(journey_id, auth.uid()));

-- Only the owner can add/remove/update collaborators.
CREATE POLICY "Owner manages collaborators" ON public.case_collaborators
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.journeys j
            WHERE j.id = journey_id AND j.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.journeys j
            WHERE j.id = journey_id AND j.user_id = auth.uid())
  );

CREATE POLICY "Service role full access" ON public.case_collaborators
  FOR ALL USING (auth.role() = 'service_role');
```

> Acceptance writes (inserting the partner row) are done **server-side via the
> service-role client** in the accept route, so they bypass the owner-only
> policy safely after token validation.

### 5.3 `case_invites` RLS

```sql
ALTER TABLE public.case_invites ENABLE ROW LEVEL SECURITY;
-- Inviter can see invites they created.
CREATE POLICY "Inviter views own invites" ON public.case_invites
  FOR SELECT USING (auth.uid() = invited_by);
-- All token validation / acceptance is server-side via service role.
CREATE POLICY "Service role full access" ON public.case_invites
  FOR ALL USING (auth.role() = 'service_role');
```

### 5.4 Document vault (`documents`, `document_vault_config`)

`documents` is keyed to `user_id`, **not** `journey_id`, so it doesn't open up
automatically. Approach for v1 (kept deliberately narrow):

- Partner document **uploads for the case** attach to the shared journey via
  `journey_documents` (already journey-scoped → covered by 5.1).
- Add **one** vault policy granting members read access to vault `documents`
  rows that are referenced by a shared journey's `journey_documents.vault_file_id`:

```sql
CREATE POLICY "Members can view case-linked vault docs" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journey_documents jd
      WHERE jd.vault_file_id = documents.id
        AND public.is_journey_member(jd.journey_id, auth.uid())
    )
  );
```

- We do **not** expose the owner's entire personal vault — only docs already
  linked to the shared case. (Explicit scope decision; revisit if needed.)

---

## 6. Billing — NO extra payment; "best plan in the case wins"

**There is no "partner seat", no new add-on, no new Stripe price, and no change
to `pricing.ts` or the webhook.** One paid plan covers the shared case.

> **Model updated 2026-06-19 (owner decision): "best plan in the case wins"
> (MAX), replacing the earlier owner-only inheritance.** Both spouses are
> **self-sufficient** — EITHER can buy/upgrade on their own account, and the
> whole shared case gets the **highest tier among all members + the union of all
> members' add-ons**. So if the beneficiary has Premium and the petitioner later
> buys Executive, both see Executive. The earlier design (only the case OWNER's
> plan counted) meant a non-owner partner couldn't upgrade the case — fixed.

### The one real technical change: effective-plan resolution

`PlanContext` / `usePlan()` reads the **logged-in user's own**
`user_profiles.subscription_tier` **and** `profile_details.purchased_addons`. For
a shared case this is resolved server-side into the **effective** plan.

How it works (`lib/case-collaboration/entitlements.ts` → `resolveEffectivePlan`,
behind `GET /api/plan/effective`, service-role):

1. Resolve the shared case the user belongs to (own journey, else the case they
   were invited to — `resolveActiveJourneyId`).
2. Gather **all active members** (the user, the journey owner, every active
   collaborator).
3. Effective plan = **MAX `subscription_tier`** across members (rank
   free<basic<premium<executive; legacy aliases core/plus/pro mapped) **+ UNION**
   of every member's `purchased_addons`.
4. **Resolve live, never copy** — read on every call, never snapshotted. So if
   any member downgrades or lapses, the effective plan recomputes immediately.
5. Solo / no-case users just get their own plan. `isInherited` = true when the
   effective plan beats the user's own account (a spouse is lifting them).

Why service-role: a member can't read the other member's `user_profiles` row via
RLS, so the merge must run with the admin client server-side.

> Net effect: whichever spouse buys or upgrades, **both see the same unlocked
> features inside the shared case, each from their own login** — and either one
> can be the buyer.

### Who can invite

Inviting a spouse requires the owner to be on an **active paid plan**
(basic / premium / executive). Free is preview-only, so the "Invite your
spouse" button is shown but locked for free users with an upgrade hint.
*(Default assumption — flag in §12 if collaboration should be allowed on a
specific tier only.)*

---

## 7. Role assignment & its effect on OCR / autofill / case-strength

### 7.1 The setup gate

- After a partner accepts, the case dashboard checks: do **both** active
  collaborators have a non-null `case_role`? If not, show a blocking
  **"Assign roles"** card.
- **EITHER spouse can assign** (confirmed product decision — not owner-only).
  Whoever picks first declares **their own** role ("I am the petitioner /
  beneficiary"); the **other member is automatically given the opposite** role.
  The unique partial index guarantees exactly one of each.
- **Roles are a ONE-TIME choice — NO swapping later** (owner decision, updated
  2026-06-19; supersedes the earlier "either spouse can re-assign / swap"
  design). Because picking the wrong role would mis-route data, the choice is
  made deliberately behind a **confirmation modal** that states plainly that it
  cannot be changed afterward; the assign UI also carries a visible "this is a
  one-time choice and cannot be swapped" warning. Once set, the panel just shows
  the locked roles ("🔒 Roles are set and cannot be changed").

  **Enforcement (`public.assign_case_roles(p_journey_id, p_caller_role)`,
  `SECURITY DEFINER`):**
  - Uses `auth.uid()` internally (never trusts a passed caller id).
  - Verifies the caller is an **active member** of the journey.
  - Requires **exactly 2 active members** (a partner must exist first).
  - **One-time guard (`20260620_lock_case_roles.sql`):** if ANY active member
    already has a non-null `case_role`, the function raises *"Roles have already
    been assigned for this case and cannot be changed."* — the `roles` route
    surfaces this as a 400 and the UI shows it. So the first assignment wins and
    is final.
  - `SECURITY DEFINER` so EITHER member can assign without loosening the strict
    "owner manages collaborators" RLS on direct table writes.
  - The NULL-then-set shape is kept for safety/idempotence, but since we only
    ever go all-NULL → set-once, the old swap-collision on the partial unique
    index can no longer occur.

### 7.2 Routing logic

Add a helper, e.g. `getCurrentUserCaseRole(journeyId, userId)` →
`'petitioner' | 'beneficiary'`. Then:

- **OCR / autofill** (`lib/autoFill/journeyProfileBridge.ts` + the OCR routes):
  when the current user uploads a document, route extracted fields by their
  `case_role`:
  - `beneficiary` → top-level beneficiary fields of shared `case_data`
  - `petitioner` → `sponsor.*` fields
  This disambiguates same-type docs (e.g. a passport) by **who** uploaded it.
- **Case-strength** (`user_case_*`): prefill sponsor-side vs beneficiary-side
  questions from shared `case_data`, using roles to pick the right person.

### 7.3 Profile source-of-truth

- The shared **`case_data` (journey-scoped) becomes the source of truth** for the
  case.
- Each spouse keeps their **own** `user_profiles.profile_details` as a personal
  mirror; minor drift there is acceptable because the case itself stays
  consistent. Partner edits write to shared `case_data`.

---

## 8. API routes

| Route | Method | Behavior |
| --- | --- | --- |
| `app/api/case/invite/route.ts` | POST | Verify caller owns journey + is on an active paid plan. Reject if a partner already exists (max 1). Create `case_invites` (hashed token, 7-day expiry). Send Resend email with `/invite/accept?token=...`. |
| `app/api/case/invite/accept/route.ts` | POST | Validate token (hash lookup, not expired/revoked). Require auth. **Reject if the logged-in user's email ≠ the invited email.** Insert `case_collaborators` partner row (service role). Mark invite `accepted`. |
| `app/api/case/collaborators/route.ts` | GET / DELETE | List collaborators for a case; owner can revoke a partner (sets `status='removed'`, frees the seat). |
| `app/api/case/roles/route.ts` | POST | Owner sets/updates `case_role` for both members. |
| `app/api/journeys/initialize/route.ts` | (modify) | Resolve the journey the user is a **member** of (owner OR collaborator), not just `user_id = auth.uid()`. |

### 8.1 The critical shared-auth change

`lib/api/journey-auth.ts` → `verifyJourneyAccess()` currently does:

```ts
if (journey.user_id !== user.id) return 403;
```

Change to a membership check (calls `is_journey_member` or queries
`case_collaborators`). **This one change unlocks every existing journey API
route at once**, since "all of Hashir's Supporting Features API routes" use it.

### 8.2 Explicit route audit (do NOT assume)

A grep for `eq("user_id", …)` / `user_id = auth.uid()` under `app/api` returns
**23 routes**. Most are **personal** and MUST stay user-scoped — only the
journey/case-scoped ones move to a membership check. Each route below is
individually classified; nothing is migrated by assumption.

**MIGRATED to membership (verified — touch shared case data):** ✅

| Route | Decision | What changed |
| --- | --- | --- |
| `app/api/journey/marriage-check/route.ts` | Migrate | `findIr1JourneyId` no longer filters `user_id`; RLS scopes to member journeys so a partner resolves the shared case. |
| `app/api/ceac/status/route.ts` (POST + PATCH) | Migrate | Journey ownership check dropped `.eq("user_id", …)`; RLS membership now gates. Either spouse can report CEAC status. |

**Inspected and DELIBERATELY left user-scoped** (the audit's real payoff — these
*look* journey-related but are personal): ⛔

| Route | Why it stays personal |
| --- | --- |
| `app/api/interview-prep/sessions/[sessionId]/delete/route.ts` | **Delete stays per-user** (each deletes their own session). Interview progress becomes **read-shared** across members in Phase 5 (§13) — view-only, no cross-delete. |
| `app/api/visa-security/route.ts` | Stores each user's portal security Q&A. No `journey_id` column at all — making it shared needs a schema change. Defer to v2. |
| ~~`app/api/visa-forms/[formCode]/progress/route.ts`~~ | **NO LONGER deferred — now MIGRATED in Phase 5 (see §13a).** Form drafts were keyed by `(user_id, form_code, journey_key='global')`. The `20260617_share_forms_and_progress.sql` migration added `journey_id` + a shared `UNIQUE(journey_id, form_code)` and member RLS; the route now resolves the case server-side via `resolveActiveJourneyId()` so both spouses share one draft. (Row kept here for audit history.) |

**Untouched (clearly personal):**
`portal-wallet/*` (4), `stripe/verify-session`, `notifications`,
`guides/*` (7), `document-translation/*` (3), `user-dashboard/*` (2).

> The earlier "~20 routes" estimate was high. After inspection, only **2** API
> routes needed migration; **3** that looked shared are correctly personal. The
> bulk of Phase 2 lives in the data-access layer below, which is shared by many
> routes at once.

### 8.3 Data-access / service layer (the real leverage)

These shared helpers filtered by `user_id`; that filter is now removed where the
resource is the shared case (RLS enforces membership), and KEPT where the action
is owner-only or a personal reset.

| Function (file) | Change |
| --- | --- |
| `verifyJourneyAccess` (`lib/api/journey-auth.ts`) | Now an `is_journey_member` RPC check (owner OR partner) + returns `isOwner`. Unlocks all 12 `app/api/v1/journeys/[journeyId]/*` routes at once. |
| `getJourneyDB`, `getAllJourneysDB`, `getLatestInProgressJourneyDB` (`lib/journey/data-access.ts`) | Dropped `user_id` filter → RLS-scoped. Fixes `initialize` so a partner resolves the shared journey instead of creating a duplicate. |
| `updateJourneyDB`, `updateJourneyProgressDB` (`lib/journey/data-access.ts`) | Dropped `user_id` filter so a partner's step-completion/progress write succeeds (RLS membership UPDATE gates). |
| `loadJourneyProgress`, `listUserJourneys` (`lib/journey/journeyProgressService.ts`) | Dropped `user_id` filter (RLS-scoped); `loadJourneyProgress` adds `limit(1)` for the dual-membership edge. |
| `deleteJourneyDB`, `deleteAllJourneysDB`, `deleteJourneyProgress`, `deleteAllUserJourneys` | **KEPT `user_id`-scoped** — destructive/owner-or-personal; a partner must not delete or reset the shared case. |

---

## 9. Frontend surfaces

- **Invite UI** — a "Collaborators / Invite your spouse" panel in case settings
  (or dashboard header). Shows current members + their `case_role`, an
  invite-by-email form, and revoke. Gated by `usePlan()`.
- **`app/invite/accept/page.tsx`** — accept landing: validates token, handles
  the login/signup redirect, confirms joining the case.
- **Role-assignment gate** — blocking card on the case dashboard when roles are
  unassigned.
- **`useWizard`** — no shape change; it loads the same journey. Verify it reads
  the membership-resolved journey from the modified `initialize` route. Optional:
  show a small "shared with [spouse]" badge.

---

## 10. Edge cases & security

- **Invite enforcement:** block sending an invite if the owner is on a free plan
  or a partner already exists (max 2 people total).
- **Token safety:** store only the hash; single-use; 7-day expiry; revocable.
  **The link is the secret** — any logged-in account may accept a valid token.
- **No email lock:** the invitee can accept with **any** email/account. The
  invited email is only the delivery address for the link (and display), not a
  gate. Compensating guards: the owner can't accept their own invite, and a case
  holds at most one partner (single-use token + active-partner check).
- **Revocation:** removing a partner sets `status='removed'` (membership lost via
  `is_journey_member`); their personal `user_profiles` is untouched.
- **Owner deletes journey:** `ON DELETE CASCADE` cleans up collaborators/invites.
- **RLS recursion:** `is_journey_member` is `SECURITY DEFINER` to avoid recursive
  policy evaluation.
- **Don't over-share the vault:** only case-linked docs (§5.4).
- **Concurrent edits = last-write-wins (v1, by design).** There is no real-time
  presence and no optimistic locking. If both spouses edit the same step/field at
  the same moment, the later write silently wins. Acceptable for v1 (two
  cooperating spouses, not adversarial). Documented so it isn't a future
  surprise. **v2 candidates:** a "last edited by [name] · [time]" indicator on
  case data, and/or `updated_at`-based optimistic concurrency on `case_data`.
- **Accept page (no email gate).** Opening `/invite/accept?token=…`:
  - invalid / expired / already-used token → clear message + "Go to homepage".
  - valid + not logged in → "Sign up or log in with any account to continue".
  - valid + logged in → "Accept invite" button (any account works).
  The owner accepting their own link is rejected server-side ("you're already the
  owner"); a second person accepting after a partner exists is rejected
  ("this case already has a partner").

---

## 11. Build order (phased)

1. **Phase 1 — DB foundation:** migration with both tables, `is_journey_member`,
   guarded + re-runnable backfill of owner rows (§4.1), RLS rewrite. Test RLS in
   isolation (owner still works; a non-member is blocked).
2. **Phase 2 — Auth chokepoint:** update `verifyJourneyAccess` + `initialize`
   route to membership. Work through the §8.2 audit table, ticking off each
   journey-scoped route. Confirm owner experience is unchanged.
3. **Phase 3 — Invite flow:** invite/accept/collaborators routes + Resend email +
   accept page (with the wrong-email error state, §10) + invite UI. Enforce
   paid-plan owner, single partner, and the email-lock on acceptance. **At this
   point the spouse can join and edit, seeing their own (free) tier.**
4. **Phase 4 — Entitlement inheritance:** make the shared case resolve tier **and
   add-ons** against the **owner's** profile, live (§6), so the spouse sees the
   owner's unlocked features inside the case. (No Stripe/pricing changes.)
   *Moved after invite so it's independently testable with a real second member.*
5. **Phase 5 — Roles + routing + shared interview visibility:** `case_role`,
   owner role-assignment gate/route (with atomic swap, §7.1), OCR/autofill routing
   by current user's role (case-strength rides along for free), AND interview-prep
   read-visibility (§13).

---

## 13. Shared interview-prep visibility (role-based: beneficiary edits, petitioner read-only) — BUILT (2026-06-19)

> **Status: BUILT (Phase 5c).** Beneficiary edits/practices; petitioner sees the
> beneficiary's questions, saved answers and results **read-only**. Shipped with
> **NO migration** — reads go through a service-role API after membership is
> verified, so we didn't have to touch RLS on the per-user interview tables. The
> child-table-RLS design sketched below was the original plan; the simpler
> service-role read (item 2, "what we actually built") replaced it.
>
> **What we built:**
> - `getCaseRole(client, journeyId, userId)` in `lib/case-collaboration/helpers.ts`
>   → `'petitioner' | 'beneficiary' | null` (works for owner AND partner — both
>   have a `case_collaborators` row).
> - **Read API** `app/api/case/interview/route.ts` `GET [?journeyId]` — resolves
>   the shared case (via `resolveActiveJourneyId` when no param), confirms
>   membership (`is_journey_member`), then reads the `source='journey'` session +
>   `interview_prep_results` + `interview_user_answers` + a questionnaire-answer
>   count, with the **admin client** (so the other spouse, who owns no row, can
>   still read). Returns
>   `{ hasCase, journeyId, caseRole, canEdit, session, output, userAnswers, answeredCount }`.
> - **Prep is found by the BENEFICIARY's `user_id`, not by `journey_id`** (fixed
>   2026-06-19 after debugging real data): in practice the interview session is a
>   standalone `source='tool'` session with `journey_id = null` — people use the
>   standalone tool, not the journey auto-init — so a journey-only lookup found
>   nothing and the partner saw an empty page. beneficiaryId = the active member
>   whose `case_role = 'beneficiary'`, else the journey owner (account-holder
>   default). Session lookup prefers `user_id = beneficiaryId AND journey_id =
>   journeyId`, then falls back to that user's **latest session of any source**.
> - **`canEdit = (beneficiaryId === me)`.** The beneficiary edits/practices; every
>   other case member is read-only. Works with or without roles assigned. Edge case
>   now handled: owner = petitioner + partner = beneficiary (roles assigned) → the
>   beneficiary partner edits, the petitioner-owner is read-only.
> - **Rapid Fire mirror:** `interview_prep_session_progress` is surfaced read-only
>   (`rapidFire` in the payload). GOTCHA: `total_rounds_completed` can stay 0
>   mid-practice and `round_summary` is often null, so roundsDone =
>   `max(total_rounds_completed, current_round − 1, 0)` and activity =
>   `current_round > 1 || score > 0`. The frontend renders a "Rapid Fire practice"
>   card (rounds practised + points, or covered/partial/missed/readiness when a
>   `round_summary` exists).
> - **Write-gate** in `app/api/interview-prep/from-journey/route.ts` POST: a
>   **petitioner** creating a journey session gets **403** (stops a petitioner-owner
>   auto-init from claiming the case session). Other writes are already isolated by
>   the per-user `.eq("user_id", …)` ownership filter — a petitioner owns no
>   beneficiary session, so they cannot write to it.
> - **Frontend** `app/(tools)/interview-prep/page.tsx`: on load it calls
>   `/api/case/interview` first; if `canEdit === false` it enters a `readOnly`
>   branch — renders `<ResultPage readOnly initialSavedAnswers=… />`, or a "not
>   ready yet" empty state if the beneficiary hasn't generated questions. Country/
>   narrative modals are suppressed. `ResultPage` gained `readOnly` +
>   `initialSavedAnswers` props: hides the practice-mode tabs (Rapid Fire / Mock)
>   and the per-card Answer/Edit button, shows a read-only banner, and seeds saved
>   answers from the API instead of the per-user `/user-answers` route.
>
> **Primary model = owner is beneficiary** (account holder = beneficiary, see the
> two-person profile model). The reverse (owner = petitioner, partner =
> beneficiary) is SAFE — the petitioner write-gate prevents corruption — but the
> beneficiary-partner's journey session auto-init is keyed to the owner's journey
> row, so that edge case isn't fully wired. Revisit if role-swap becomes common.

---

### Original plan (superseded by the service-role read above)

**Design correction (confirmed with owner 2026-06-19):** in an IR-1/CR-1 case the
**beneficiary** (foreign spouse) is the one who attends and sits the consular
interview — the **petitioner** (US citizen) does **not** give the interview. So
interview practice only makes sense for the beneficiary. The earlier "both
practice, both view" (symmetric) framing was wrong. Correct model:

- **Beneficiary** → full **edit/practice** of the interview prep, from their own
  account (the one shared journey session for the case).
- **Petitioner** → **read-only**: can VIEW the beneficiary's interview progress,
  answers, and results (to follow along / help), but cannot edit or practice.

There is effectively **one** interview prep per case — the beneficiary's journey
session — which the petitioner sees read-only. We are NOT changing the interview
tool's scoring logic; we are (a) opening **read** access to the petitioner and
(b) **gating writes to the beneficiary** by `case_role`.

**Why it isn't automatic:** unlike `case_data`/`documents` (journey-scoped, now
membership-RLS), interview data is **per-user**:

- `interview_prep_sessions` — currently **no RLS** (app-layer gated by
  `.eq("user_id", …)` in every read). It has a `journey_id` column.
- `interview_user_answers`, `interview_prep_session_progress` — **RLS enabled**,
  scoped to the session's **owner** (`session_id IN (SELECT id FROM
  interview_prep_sessions WHERE user_id = auth.uid())`).
- `interview_prep_results`, `interview_prep_answers` — no RLS policy found.

So a partner is blocked from reading the other's sessions/answers/progress.

**Approach (read-only, low-risk):**

1. **Child-table RLS — add a member SELECT policy** (keep all existing
   owner-only write policies untouched) on `interview_user_answers` and
   `interview_prep_session_progress`, allowing read when the parent session
   belongs to a journey the caller is a member of:
   ```sql
   CREATE POLICY "Members can view case interview answers" ON interview_user_answers
     FOR SELECT USING (
       session_id IN (
         SELECT s.id FROM interview_prep_sessions s
         WHERE s.journey_id IS NOT NULL
           AND public.is_journey_member(s.journey_id, auth.uid())
       )
     );
   ```
   (Same shape for `interview_prep_session_progress`. `interview_prep_results`
   has no RLS, so reads already pass once the route fetches them.)
2. **`interview_prep_sessions`** — do **NOT** enable RLS on it (it has none today;
   enabling could regress the whole tool). Instead add a data-access read fn
   `getCaseInterviewSession(journeyId)` that selects the **beneficiary's** journey
   session for the shared journey **without** a `user_id` filter (membership
   verified by the caller via `verifyJourneyAccess`). Writes stay owner-of-session.
3. **Write-gating by role (the key part):** the petitioner must not edit. Server
   side, before any interview write (answers, progress, results, practice), check
   the caller's `case_role` for the journey — allow only when it is
   `beneficiary` (or when the case has no partner yet / solo user). A petitioner
   write returns 403. This is enforced in the interview write routes, not just
   hidden in the UI.
4. **Frontend** — when the current user's `case_role === 'petitioner'`, render the
   interview prep **read-only**: show the beneficiary's session status, progress %,
   saved answers, and results, but hide all practice/edit/save affordances. The
   beneficiary sees the normal editable tool.

**Scope guards:** only `source = 'journey'` sessions with a non-null `journey_id`
are shared. Standalone `source = 'tool'` sessions (no journey link) stay private.
Writes are restricted to the **beneficiary**; the petitioner gets **read** only.

---

## 13a. Shared FORMS + live progress (Phase 5 — built)

> **Scope change (boss):** progress sharing is **not limited to interview prep**.
> ALL tools and the autofiller forms (I-130, I-130A, DS-260, I-864, …) must show
> each spouse's progress to the other, **in real time**.

**What was already shared (no work needed):** `journeys`, `steps`, `chapters`,
`case_data`, `tool_sessions`, `journey_documents` — all switched to
membership-RLS in `20260616_create_case_collaboration.sql`. So overall journey
progress and every tool session are already case-scoped by `journey_id` and
visible to both members.

**The one gap — autofiller forms.** `visa_forms_draft` was keyed by `user_id`
with `journey_key = 'global'` (RLS = `auth.uid() = user_id`). A partner could
neither see nor edit the owner's form. **Decision (locked): ONE shared draft per
case + form** — both spouses open and edit the same I-130/DS-260/etc.

Migration `20260617_share_forms_and_progress.sql`:
- adds `visa_forms_draft.journey_id` (FK journeys) + backfills from each user's
  journey;
- `UNIQUE (journey_id, form_code)` → one shared draft per case + form (non-partial
  so PostgREST upsert can target it);
- RLS → `auth.uid() = user_id OR is_journey_member(journey_id, auth.uid())`
  (member read/write; the `user_id` arm keeps journey-less legacy drafts working);
- enables Supabase **Realtime** on `visa_forms_draft`, `tool_sessions`, `journeys`
  (`supabase_realtime` publication + `REPLICA IDENTITY FULL`).

**No frontend wizard change.** `app/api/visa-forms/[formCode]/progress/route.ts`
resolves the case server-side via `resolveActiveJourneyId()` (own journey, else
active collaborator journey — both spouses land on the same journey) and keys all
reads/writes by `journey_id`. The wizard keeps calling the same endpoint; it is
now case-aware. Falls back to per-user keying only when the user has no journey.

**Read API + UI.** `app/api/case/progress/route.ts` (GET `?journeyId`) returns a
case-wide snapshot (journey %, tools[], forms[], members[]) via the service role
after `verifyJourneyAccess`. `components/case/CaseProgressPanel.tsx` renders it on
`/settings` (Shared case card) and subscribes to `postgres_changes` on the three
tables filtered by `journey_id`, debounced-refetching on any change; a 25s poll is
the fallback if the realtime publication is off. Realtime respects RLS, so each
member only receives the shared case's events.

---

## 13c. Shared Document Vault (Phase 5b — built)

> **Bug found in testing:** one spouse uploaded the beneficiary passport in the
> "required documents" step; the partner account saw nothing. Root cause: that
> step reads the **Document Vault** (`documents` table), which was still
> **per-user** — it was never shared. Phase 5/5a only shared journeys, steps,
> case_data, tool_sessions, journey_documents, and visa_forms_draft. The vault
> (`documents` + the files behind it) was a separate per-user system.

**Why it isn't automatic (two blockers):**
1. **Per-user rows.** `documents` was keyed by `user_id` (RLS `auth.uid() = user_id`),
   and `/api/documents/list` queried `.eq("user_id", …)`. A partner's list never
   included the other's uploads.
2. **Per-user encryption.** Files are AES-256-GCM encrypted with a key derived
   from `SHA-256(PORTAL_WALLET_SECRET + uploader_user_id)`. Even if a partner
   could read the row, decrypting with *their own* id would fail.

**Decision (confirmed with owner): full shared vault** — one case vault; either
spouse can view / download / replace / delete any case document.

**Migration `20260618_share_documents_vault.sql`:**
- adds `documents.journey_id` (FK journeys ON DELETE CASCADE) + backfills each
  existing doc to its owner's most recent journey;
- swaps owner-only RLS for member RLS
  (`auth.uid() = user_id OR is_journey_member(journey_id, auth.uid())`) on
  SELECT/INSERT/UPDATE/DELETE; drops the old narrow journey_documents-linked
  SELECT policy (now superseded);
- `REPLICA IDENTITY FULL` + adds `documents` to the `supabase_realtime`
  publication (for a future live refresh; UI doesn't subscribe yet).

**Code changes (no vault-UI change needed):**
- `lib/document-vault/storage-database.ts` — `getAllDocuments`, `getDocument`,
  `getDocumentsByDefId`, `deleteDocument`, `updateDocument` take an optional
  `journeyId`; when present they scope to the case (membership RLS gates) instead
  of `user_id`. Mappers read/write the new `journey_id` column;
  `UploadedDocument` gains `journeyId?`.
- Routes resolve the case server-side via `resolveActiveJourneyId()` and pass the
  journey through: `documents/list` (GET), `documents/upload` (POST — stamps
  `journey_id`, versions across both spouses), `documents/[id]` (GET/DELETE/PATCH),
  `documents/[id]/download`, `…/preview`, `…/export`.
- **Encryption fix (the key part):** `download` and `preview` now decrypt with the
  stored **`document.userId`** (the *uploader's* id), NOT the requester's — so a
  partner opens files the other uploaded, and **no re-encryption of existing
  files is needed**. New uploads still encrypt with their own uploader's key.

**Checklist config — also shared (migration `20260619_share_vault_config.sql`).**
`document_vault_config` (visa category, scenario flags, custom/dynamic slots)
drives the checklist a user sees. It was per-user (`UNIQUE(user_id)`); it is now
**one shared config per case**:
- adds `document_vault_config.journey_id` + backfill from the owner's journey;
- **swaps `UNIQUE(user_id)` → `UNIQUE(journey_id)`** (non-partial so PostgREST
  upsert can target it) after de-duping any double rows per journey;
- member RLS (`auth.uid() = user_id OR is_journey_member(journey_id, auth.uid())`).
- `storage-database.ts` `getVaultConfig(userId, journeyId?)` reads the case row;
  `saveVaultConfig` upserts on `journey_id` when present (else a find-then-write
  per-user fallback, since `UNIQUE(user_id)` is gone). The `documents/config`
  GET/POST resolve the case via `resolveActiveJourneyId()`.

Net: a custom slot one spouse adds now appears for the other; both share the same
checklist layout AND the same uploaded files.

**Realtime (live — built).** `documents` and `document_vault_config` are on the
`supabase_realtime` publication. The hook `lib/document-vault/useVaultRealtime.ts`
subscribes to `postgres_changes` on both tables filtered by `journey_id`,
debounces, and refetches the store (`reloadDocuments` for docs, the new
`reloadConfig` for checklist changes). The store now holds `journeyId` (captured
from the `journeyId` added to the `documents/list` + `documents/config`
responses). The hook is mounted on the standalone vault page
(`app/(tools)/document-vault/page.tsx`) and the journey step view (`StepView.tsx`).
Net: a spouse's upload/delete or a new custom slot appears for the other
**without a page reload**, matching `CaseProgressPanel`.

---

## 13b. Activity history (audit log) — BUILT (2026-06-19)

> **Status: BUILT.** Append-only per-case feed, view-only, both spouses read it.
> One migration (`20260619_create_case_activity.sql` — user runs it). What shipped:
>
> - **Table `case_activity`** (`journey_id`, `actor_user_id` `ON DELETE SET NULL`,
>   `actor_role` **snapshot**, `action`, `target_label`, `metadata` JSONB,
>   `created_at`), index `(journey_id, created_at DESC)`. RLS: members SELECT
>   (`is_journey_member`); INSERT limited to `actor_user_id = auth.uid()` + member;
>   service-role full access.
> - **Logger** `lib/case-collaboration/activity.ts` → `logCaseActivity({ journeyId,
>   actorUserId, action, targetLabel, metadata })`. Best-effort & non-throwing
>   (try/catch — never breaks the real action); no-ops when `journeyId` is null
>   (solo/pre-case). Snapshots `actor_role` from `case_collaborators`
>   (case_role, else `'owner'` when the actor owns the journey).
> - **Action points instrumented** (server-side, after the real write succeeds):
>   - `app/api/visa-forms/[formCode]/progress` POST → `form.complete` when
>     `body.completed`, else `form.save` (label = friendly form name).
>   - `app/api/case/roles` POST → `role.assign` (after the swap, so the snapshot
>     reflects the chosen role).
>   - `app/api/documents/upload` POST → `document.upload` (label = doc def name).
>   - `app/api/documents/[id]` DELETE → `document.delete` (label = doc def name,
>     fallback original filename).
>   - `app/api/steps/[id]` POST `?action=complete` → `step.complete`; PATCH with a
>     non-`completed` status on a previously-`completed` step → `step.reopen`
>     (reads prior status before updating; actor via a quick `getActorId()`).
> - **Read API** `app/api/case/activity` GET `?journeyId=&limit=` (default 100,
>   max 300) — `verifyJourneyAccess` (member), service-role select `created_at
>   DESC`, enriches each row with the actor's email (`auth.admin.getUserById`,
>   deduped per unique id). Returns `{ activity[], members[] }`.
> - **UI** `app/(main)/case-history/page.tsx` — own page (resolves the case the
>   same way `/settings` does: own journey, else active collaborator journey),
>   latest-first feed with emoji + verb + role badge + target label + relative
>   time, and an **All / Petitioner / Beneficiary** filter (by `actorRole`
>   snapshot). View-only. Reached via a **"View history"** button on the Shared
>   case card in `/settings`.
>
> **Scope guards:** view-only (no undo); v1 tracks only the four action groups
> above; no realtime (loads on open) — both can be added later by adding `action`
> values + log calls / a subscription.

### Original plan (below — superseded by the BUILT notes above)

### In plain words (for non-technical readers)
- Har case ki ek **history** banegi: kis ne, kab, kya kiya.
- Track honge: **document upload / delete**, **form bharna / badalna / complete**,
  **step complete / dobara kholna**, aur **role chunna / swap**.
- Har entry par dikhega banda **petitioner tha ya beneficiary** (alag-alag pehchaan).
- **Dono spouse ek doosre ki history dekh sakte hain** (sirf dekhne ke liye).
- **Maqsad:** agar koi galti se ghalat doc upload/delete kare, ya check karna ho ke
  kaun-si cheez kisne bhari/upload/delete ki — history mein ja kar dekh sakein.

### Entry point (UI)
- `/settings` → **"Shared case"** card mein ek **"Activity history"** button.
- Button ek **alag page** kholega (e.g. `app/(main)/case-history/page.tsx`) jahan
  poori history list hogi — settings par inline nahi, taake jagah saaf rahe.
- Page case ko khud resolve karega (same logic as settings: own journey, else
  active collaborator journey) aur read API se history laayega.
- Simple filter: **All / Petitioner / Beneficiary** (ya per-person), latest upar.
- View-only — yahan se kuch delete/undo nahi (sirf record dekhna).

### Data model — `case_activity` (new table + migration)
| Column | Purpose |
|--------|---------|
| `id` | PK |
| `journey_id` | FK journeys — the shared case (scopes + RLS) |
| `actor_user_id` | who did it (FK auth.users, `ON DELETE SET NULL`) |
| `actor_role` | **snapshot** of their case_role at the time (`petitioner`/`beneficiary`/`owner`/null) — so renaming/swapping roles later doesn't rewrite past history |
| `action` | `document.upload` \| `document.delete` \| `form.save` \| `form.complete` \| `step.complete` \| `step.reopen` \| `role.assign` |
| `target_label` | human label — doc name, form name (e.g. "Form I-130"), step title |
| `metadata` | JSONB — extra context (form_code, step_key, file id, etc.) |
| `created_at` | timestamp |

- Index `(journey_id, created_at DESC)` for the history feed.
- **RLS:** members may SELECT (`is_journey_member`); INSERT limited to members
  acting as themselves (`actor_user_id = auth.uid()`); service-role full access.

### Logging mechanism
- One best-effort, non-throwing helper `logCaseActivity({ journeyId, actorUserId,
  action, targetLabel, metadata })` in `lib/case-collaboration/activity.ts`.
  - Uses the service-role client; snapshots `actor_role` from `case_collaborators`.
  - Wrapped in try/catch — **logging must never break the real action**.
- Call it from the server-side action points (to be located before building):
  - **Forms:** `app/api/visa-forms/[formCode]/progress/route.ts` POST →
    `form.save` (and `form.complete` when `completed` flips true).
  - **Roles:** `app/api/case/roles/route.ts` → `role.assign`.
  - **Documents:** the upload route (insert into `journey_documents`) →
    `document.upload`; the delete/unlink route → `document.delete`.
  - **Steps:** the step-complete route (persists `steps.status`) →
    `step.complete` / `step.reopen`.
  - *(Exact files/lines to be confirmed by a quick search at build time.)*

### Read API
- `app/api/case/activity/route.ts` — GET `?journeyId=&limit=` → `verifyJourneyAccess`
  (member), then service-role select ordered `created_at DESC`, enrich each row
  with the actor's email; return `{ activity[], members[] }`.

### Scope guards / decisions to confirm
- View-only (no undo from history) for now.
- Only the four action groups above in v1; more can be added later by adding
  `action` values + log calls.
- No realtime needed for v1 (page loads on open); can add later if desired.

---

## 12. Decisions — all locked ✅

1. **Billing:** No extra payment. Owner's plan covers both; spouse inherits the
   owner's plan inside the shared case. ✅
2. **Email:** No email lock. The invite **link** is the secret — the owner sends
   to any email, the invitee accepts with any account. One invite/partner per
   case is the only constraint. ✅
3. **Invites:** Max one partner per case. ✅
4. **Roles:** Owner assigns who is petitioner / beneficiary. ✅
5. **Case-strength:** Already inside the journey steps → shared automatically, no
   separate work. ✅

Remaining minor assumption (change if needed): inviting requires the owner to be
on an **active paid plan** (free is preview-only).
