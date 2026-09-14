# Stripe Duplicate Subscription - Fix Report

**Area:** Payments (Stripe subscriptions)
**Status:** Done, tested, and live migration applied to production
**Prepared for:** Management update

---

## 1. The Problem (in simple words)

One user was ending up with **more than one active paid subscription** in Stripe at the same time.

Why this is bad:
- The customer could be **charged twice** every month for the same plan.
- Our records got confusing (which subscription is the "real" one?).
- It could cause refund requests, complaints, and trust issues.

The goal was: **one user should always have exactly ONE active journey subscription.**

---

## 2. The Root Cause

Our system was trusting **our own database** to decide "does this user already have a subscription?"

The problem: our database and Stripe can go **out of sync**. For example:
- Stripe sends us an update (a "webhook") but it is delayed or fails.
- A payment is retried.
- Something is edited manually.

When our database was wrong (said "no subscription") but Stripe actually had one, the user was allowed to buy **again**, creating a duplicate.

**The core fix idea:** Stripe is the real source of truth for money and subscriptions. We now **ask Stripe directly** before letting a user buy, instead of only trusting our database.

Also important: every Stripe Checkout **always creates a brand new subscription**. So we must actively prevent and clean up duplicates ourselves.

---

## 3. What Was There Before vs What We Did

| Topic | Before (old behavior) | Now (fixed behavior) |
|---|---|---|
| Who decides "already subscribed?" | Only our database | **Stripe is asked directly** + database |
| Duplicate cleanup | None (or a very narrow one) | Automatic cleanup keeps exactly one subscription |
| Upgrades (e.g. Premium -> Executive) | Risk of losing old plan if new payment failed | **Old plan is cancelled ONLY after the new one is paid** |
| Two clicks at the same time | Both could create a subscription | A per-user lock stops the second one |
| Payment failing (past due) | User told to "buy again" (made duplicates) | User is sent to the billing portal to **fix payment**, not re-buy |
| If Stripe was unreachable | We guessed and could create a duplicate | We **stop and show "try again"** (safe) |
| Stripe IDs in our database | Subscription ID was stored in the wrong field | Each ID now has its **own correct field** |

---

## 4. Every Fix We Made (plain explanation)

### Round 1 - Core fix
1. **Stripe-aware check at checkout.** Before creating a new subscription, we now list the user's live subscriptions **in Stripe** and block a duplicate or a downgrade, even if our database is out of date.
2. **Automatic duplicate cleanup.** After a payment is confirmed, we cancel any extra subscriptions and keep only the correct one.
3. **Safe ordering (very important).** We cancel the old subscription **only after** the new payment is confirmed and our records point to the new one. This means: if a payment fails, the user keeps their existing plan. And upgrades never reset the user's tier or their journey progress.
4. **Only touch our own subscriptions.** The cleanup only cancels subscriptions we can clearly identify as Rahvana journey plans. It will **never** cancel some unrelated subscription by mistake.
5. **Past-due recovery.** If a user's payment is failing, we send them to the billing portal to update their card, instead of telling them to buy the plan again (which caused duplicates).
6. **Concurrency lock.** If a user double-clicks "Subscribe," a short per-user lock makes sure only one request goes through.

### Round 2 - Hardening (making it production-strong)
7. **Fail safe if Stripe is down.** If we cannot check the user's current subscriptions, we stop and ask them to try again, instead of risking a duplicate.
8. **No duplicate customers.** If our database is missing the Stripe customer, we first **search Stripe** for the existing customer (by our tag, then email) instead of blindly creating a new one. Two customers = a way for duplicates to sneak in.
9. **Correct plan detection.** We can read a subscription's plan level from either its tag or its price ID, so an older subscription is never misread as "free."
10. **Retry protection.** A safe "idempotency key" means an accidental retry returns the same checkout instead of a second one.
11. **Full pagination.** When reading subscriptions, we now read **all pages**, so nothing is missed.
12. **Reconcile "resurrection" fix.** A background self-healing job used to re-activate a plan from an **old** payment record. This could bring back a **cancelled** user's plan by mistake. Now it double-checks with Stripe that the subscription is still live before granting access.

### Round 3 - Review checklist
13. **Lock ownership fix.** The lock now uses a unique token so a slow request can never accidentally release **another** request's lock.
14. **Customer lookup ordering fix (important).** We now find the existing Stripe customer **before** the duplicate check runs. Earlier, if the database had no customer ID, the whole Stripe check was skipped - exactly the case that caused duplicates. This closes that gap. If the lookup fails, we stop safely (no new customer, no duplicate).
15. **Checkout reads all subscription pages too** (same pagination as the cleanup).
16. **Correct database fields for Stripe IDs.** We added a proper `stripe_subscription_id` field. The subscription ID (sub_...) and the payment ID (pi_...) are now stored in the **right** places. This makes future debugging and reconciliation reliable.

---

## 5. Testing

We wrote and ran automated tests for the whole payment flow.

- **6 test files, 57 tests, all passing.**
- Covered: the duplicate/downgrade guard, the "database out of sync" case, the "Stripe is down -> stop safely" case, past-due recovery, the concurrency lock (including the ownership fix), the cleanup (only touches our subscriptions, reads all pages, never crashes), the self-healing job (won't revive a cancelled user), and both activation paths (webhook and the success-page check).
- Full project type check is clean (one unrelated, pre-existing warning that is not part of this work).

This means these behaviors are protected against future accidental breakage.

---

## 6. Deployment Status

- The database change (the new `stripe_subscription_id` field) has been **applied to production** and **verified live**:
  - The new field exists.
  - No old records were left in a broken state.
- The code is type-clean and test-green, and is safe to deploy.

**One small step after deploy:** in the Supabase dashboard, click "Reload schema" once (Settings -> API) so the new field is picked up immediately. (It usually refreshes automatically.)

---

## 7. Things We Deliberately Did NOT Change (and why)

These were reviewed and judged either already-correct or safer left alone:

- **Confirmation email:** In rare cases a user may get two "confirmed" emails (from two different success paths). This is cosmetic only - no billing impact. Can be cleaned up later if desired.
- **Unrelated/legacy subscriptions:** Our cleanup intentionally does not cancel subscriptions it cannot clearly identify as ours. This is the safe choice. Recommendation: tag any old subscriptions over time so they are fully identifiable.
- **Duplicate payment rows:** The database already prevents duplicate payment records (a unique rule was already in place), so no change was needed.

---

## 8. Bottom Line

- The duplicate-subscription problem is fixed at its root: **Stripe is now the source of truth**, duplicates are prevented up front and cleaned up automatically, and upgrades are safe.
- The risky edge cases (system out of sync, Stripe down, double-clicks, cancelled users, failed payments) are all handled.
- Everything is covered by automated tests and the production database is updated.

**Result: one user, one active subscription - safely and reliably.**
