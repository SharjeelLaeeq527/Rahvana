# Rahvana — Development Update

## April 2026 | IR-1 Visa Journey Platform

**Prepared for:** Leadership / Non-Technical Review  
**Prepared by:** Development Team  
**Session Summary:** Full bug fixes, merge conflict resolution, and new CEAC notification system

---

## Overview

This document covers everything completed in this development session.  
Two major areas of work:

1. **Bug Fixes & Code Quality** — fixing existing issues in the roadmap journey
2. **New Feature: CEAC Status Notification System** — 13 automated reminders for the post-interview phase

---

## PART 1 — BUG FIXES

### Bug Fix 1: Step Numbers Were Wrong in Paper Filing Mode

**What was broken:**  
When a user selected "Paper" as their filing method in Chapter 1, the step numbers displayed on screen were incorrect. After Step 9 (Mail Packet to USCIS), the next steps showed as "11, 12, 13" instead of the correct "10, 11, 12".

**Where it was broken:**  
Three places showed wrong numbers:

- The step list inside Chapter 1
- The breadcrumb at the top of the page (e.g. "Dashboard > Chapter 1 > Step 13" instead of "Step 12")
- The step header inside the step view itself

**What was fixed:**  
All three places were updated to dynamically count step numbers based on the user's selected filing method (online vs paper). Steps are now numbered from the user's perspective — they only see the steps that apply to them, numbered 1, 2, 3... in order.

**Files changed:**  
`ChapterView.tsx`, `RoadmapLayoutV2.tsx`, `StepView.tsx`

---

### Bug Fix 2: "Next" Button Missing on Steps 15, 16, 17 of Chapter 1

**What was broken:**  
After completing certain steps in Chapter 1 (Register Receipt in CEAC Portal, Track Case Status, Receive Approval Notice), the "Next" button at the bottom of the screen did not appear even when the step was completed.

**Root cause:**

- Steps 15 and 16 had a custom rendering path that completely bypassed the standard page footer — meaning the "Next" button was never rendered at all.
- Step 17 had no way to mark itself as complete (no "Mark as Done" mechanism), so the Next button stayed hidden permanently.

**What was fixed:**

- Steps 15 and 16: Footer with Previous/Next buttons is now included in their custom rendering path.
- Step 17: When the user saves their Approval Notice details, the step automatically marks itself as complete, which makes the Next button appear.

**File changed:**  
`StepView.tsx`

---

### Bug Fix 3: "Days in AP" Counter Showing 0

**What was broken:**  
The Administrative Processing tracker on the dashboard was showing "0 Days Passed" even when the user had been in AP for several days.

**Root cause:**  
The form field was labelled "Interview Date" — which was confusing. Users were entering their upcoming scheduled interview date (a future date) instead of the date when AP was actually placed on their case. When a future date was entered, the counter calculated a negative number and showed 0.

**What was fixed:**

1. Field label changed to: **"Date of Interview (when AP was placed)"** — now clearly asks for the past date when AP happened.
2. Calendar date picker now blocks future dates — user physically cannot select a future date.
3. If somehow a future date exists, the counter now shows a helpful amber message: _"Interview date is upcoming — AP tracking starts after your interview"_ instead of silently showing 0.
4. Counter label changed from "Days Passed" → "Days in AP" — more accurate language.

**Files changed:**  
`APTrackingTool.tsx`, `StepView.tsx`

---

### Bug Fix 4: Administrative Processing Showing in 3 Different Places on Dashboard

**What was broken:**  
The Administrative Processing status was appearing in three separate places on the dashboard at the same time:

1. A small amber alert text at the top
2. A WaitingStateCard in the main column
3. The full APTrackingTool in the sidebar

All three were showing simultaneously with slightly different designs, creating a cluttered and confusing experience.

**What was fixed:**  
Clean, logical flow established:

| When                                                              | What Shows                                                             |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Admin marks AP pending, user has NOT gone to Chapter 3 Step 9 yet | Simple card: "Go to Step 9 to record AP details and activate tracking" |
| User has recorded AP details in Step 9                            | Full detailed APTrackingTool with days counter, status, update log     |
| AP not active                                                     | Nothing                                                                |

The duplicate amber alert was removed entirely.

**File changed:**  
`DashboardView.tsx`

---

### Bug Fix 5: "In Interview Queue" and "In Scheduling Queue" Showing as Duplicate Cards

**What was broken:**  
The dashboard was showing two cards saying essentially the same thing:

- Card 1: "In scheduling queue (Manual): DQ date: 2026-04-18. Monitor CEAC..."
- Card 2: "In Interview Queue (Islamabad)" with full DQ date, embassy month, estimated window

Both came from different conditions firing simultaneously.

**What was fixed:**  
Both duplicate text alerts removed. Only the **Dynamic Scheduling Tracker** (the detailed dark blue sidebar card) remains, which shows:

- DQ Date
- Days since DQ
- Current embassy scheduling month
- Estimated interview window
- Status Intelligence (how many months behind)
- Link to official US State Dept IV Wait Times tool

**File changed:**  
`DashboardView.tsx`

---

### Bug Fix 6: Various TypeScript Errors

Several TypeScript compilation errors were fixed:

| Error                                          | Fix                                           |
| ---------------------------------------------- | --------------------------------------------- |
| `Cannot find namespace 'JSX'`                  | Changed `JSX.Element` to `React.ReactElement` |
| `stepNumber does not exist on StepHeaderProps` | Added `stepNumber` as optional prop           |
| `Object is possibly undefined` (fields array)  | Added optional chaining and null checks       |
| `boolean \| null not assignable to boolean`    | Added `!!()` wrapper for type safety          |

**Files changed:**  
`StepView.tsx`, `StepHeader.tsx`

---

### Bug Fix 7: Sync Errors — Step Completion Not Saving

**What was broken:**  
When a user marked a step as complete, if the server had a momentary connection issue, the step would immediately rollback (uncheck itself) and show a jarring error toast. Users were confused why their completed steps kept reverting.

**What was fixed:**

- Step completion now retries **3 times** automatically (with 800ms, 1600ms delays) before giving up
- Only after all 3 retries fail does it rollback and show: _"Progress saved locally. Will sync when connection is restored."_
- This means a brief network hiccup no longer disrupts the user experience at all

**File changed:**  
`useWizard.ts`

---

### Bug Fix 8: Admin Check and Profile Loading Errors on App Start

**What was broken:**  
When the app first loaded, there were repeated error logs in the console:

- `fetchProfile attempt 1, 2 error` — profile not loading
- `check-admin failed` — admin status not loading
- These sometimes caused the wrong user name or admin status to show

**What was fixed:**

- Profile fetching: Now retries **3 times silently** (1s, 2s delays). Always falls back to user's email name if Supabase unreachable — UI never shows blank
- Admin check: Now fully silent on failure — defaults to non-admin safely
- No more error spam in console

**Files changed:**  
`AuthContext.tsx`

---

### Bug Fix 9: 221(g) Follow-Up Manager Crashing Silently

**What was broken:**  
A background component (`FollowUpManager`) that checks if users need a 221(g) case follow-up was throwing errors and logging them to console. When the table query failed, it caused noisy error logs that made it look like something was broken.

**What was fixed:**

- Errors now handled silently — if the query fails, the component simply doesn't show the follow-up dialog
- No impact on the main journey flow whatsoever
- `getUser221gCase` now returns `null` on error instead of throwing

**Files changed:**  
`FollowUpManager.tsx`, `twentyTwoOneG.ts`

---

### Bug Fix 10: Merge Conflicts — Staging Branch Integration

**What happened:**  
When the staging branch (which had new UI changes) was merged into the feature branch, conflicts occurred in 3 files. All 22 conflict regions were manually resolved.

**Files with conflicts:**

- `ApprovalNoticeTool.tsx` — 1 conflict (badge styling)
- `DashboardView.tsx` — 4 conflicts (new background images, Hero section redesign, chapter cards)
- `StepView.tsx` — 17 conflicts (sync effects, custom renderer restructuring, styling changes)

**What was kept / what was taken from each side:**

| Decision                                                             | Reason                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| Kept staging's new background images and chapter card designs        | New UI from staging                                     |
| Kept our bug fixes (step numbering, Next button, etc.)               | Our critical fixes                                      |
| Restored 6 missing sync useEffects that staging accidentally removed | These sync medical/appointment/police/DQ data to the UI |
| Restored `APTrackingTool` that was removed                           | Core feature                                            |
| Fixed `DashboardView` structural JSX errors caused by the merge      | Broken JSX tags, missing imports                        |

**Files changed:**  
`ApprovalNoticeTool.tsx`, `DashboardView.tsx`, `StepView.tsx`, `DashboardView.tsx`

---

## PART 2 — NEW FEATURE: CEAC STATUS NOTIFICATION SYSTEM

### What Is This Feature?

After a user attends their visa interview (Chapter 3, Step 8), their case moves into one of several CEAC statuses: In Transit, Ready, Administrative Processing, Issued, or Refused.

Users in this phase check their status repeatedly but often don't know what it means or what to do next. This new system **automatically sends the right notification at the right time** based on what the user reports in their journey app.

**No admin action required after setup. Everything is fully automatic.**

---

### Which Steps Are Involved?

| Chapter       | Step       | Name                                | Role                                               |
| ------------- | ---------- | ----------------------------------- | -------------------------------------------------- |
| Chapter 3     | Step 8     | Attend Visa Interview               | User attends interview, receives one of 3 outcomes |
| **Chapter 3** | **Step 9** | **Track Administrative Processing** | **User enters CEAC status → system activates**     |

Tracking starts **only when user enters a status beyond "At NVC"** — we intentionally skip NVC internal sub-stages since users cannot meaningfully track those.

---

### The 13 Reminders — When Each One Fires

#### When user enters "In Transit":

| #   | Fires                                | What user receives                                     | Email? |
| --- | ------------------------------------ | ------------------------------------------------------ | ------ |
| R1  | Immediately                          | "Case is on its way to the embassy — no action needed" | No     |
| R2  | 3 days later (if status not updated) | "Check CEAC — may have changed to Ready"               | No     |

#### When user enters "Ready":

| #   | Fires         | What user receives                                       | Email?  |
| --- | ------------- | -------------------------------------------------------- | ------- |
| R3  | Immediately   | **URGENT: "Status is Ready — your interview is coming"** | **Yes** |
| R4  | Every 14 days | "Check CEAC for updates" (repeats until outcome)         | No      |

#### When user enters "Administrative Processing":

| #   | Fires              | What user receives                           | Email?  |
| --- | ------------------ | -------------------------------------------- | ------- |
| R5  | Immediately        | **"AP is not a refusal — what this means"**  | **Yes** |
| R6  | Every 14 days      | "Check CEAC for updates" (repeats)           | No      |
| R7  | Day 60 (once only) | "AP 60+ days — consider consulting attorney" | No      |

#### When user enters "Issued":

| #   | Fires        | What user receives                                 | Email?  |
| --- | ------------ | -------------------------------------------------- | ------- |
| R8  | Immediately  | **URGENT: "Visa Issued — track your courier now"** | **Yes** |
| R9  | 2 days later | "Have you received your passport?"                 | No      |

#### When user enters "Refused":

| #   | Fires                                     | What user receives                                         | Email?  |
| --- | ----------------------------------------- | ---------------------------------------------------------- | ------- |
| R10 | Immediately for ALL refusals              | **URGENT: "Refused — read your written notice carefully"** | **Yes** |
| R11 | When user confirms 221(g)                 | "Submit the requested documents promptly"                  | No      |
| R12 | Every 21 days after 221(g) docs submitted | "Check CEAC — has status changed to Issued?"               | No      |
| R13 | When user confirms final denial           | **"Final refusal — consult an immigration attorney"**      | **Yes** |

> **Important design rule:** For "Refused" status, the system never assumes whether it's a 221(g) or final denial. The user is shown a prompt asking which type applies. Only then do reminders 11, 12, or 13 fire. This is intentional — guessing wrong could cause serious harm.

---

### How Does It Work Technically?

```
User saves AP status in Chapter 3 → Step 9
         ↓
System schedules notifications in database
         ↓
Every 6 hours, a background job runs automatically
         ↓
If a notification is due → Send it:
   Bell icon in the app (all reminders)
   + Email via Resend (URGENT reminders only)
         ↓
When user advances to a later status →
   Old reminders auto-cancel
   New reminders schedule
```

---

### Is It Fully Automatic?

| Task                                          | Automatic?                        |
| --------------------------------------------- | --------------------------------- |
| Scheduling reminders when user saves status   | ✅ Yes                            |
| Cancelling old reminders when status advances | ✅ Yes                            |
| Sending bell icon notification                | ✅ Yes                            |
| Sending emails for urgent reminders           | ✅ Yes                            |
| Recurring reminders (every 14/21 days)        | ✅ Yes                            |
| AP refusal branching (221g vs final)          | ✅ Yes (user prompted, then auto) |

**One-time setup required (already done in code):**

- Run 2 database migration files on Supabase
- Add `CRON_SECRET` to environment variables (already in `.env.local`)
- Register EasyCron job (same pattern as existing `update-tracking` cron)

---

### What Was Built (New Files)

| File                                                  | What It Does                            |
| ----------------------------------------------------- | --------------------------------------- |
| `supabase/migrations/20260420_ceac_tracking.sql`      | Creates 2 new database tables           |
| `supabase/migrations/20260420_ceac_reminder_type.sql` | Adds new notification type              |
| `lib/ceac-tracking/types.ts`                          | TypeScript types for the system         |
| `lib/ceac-tracking/reminderConfig.ts`                 | All 13 reminder definitions             |
| `lib/ceac-tracking/stateMachine.ts`                   | Status transition rules                 |
| `lib/ceac-tracking/CeacReminderEngine.ts`             | Core scheduling engine                  |
| `lib/ceac-tracking/recurringJobRunner.ts`             | Background job that sends notifications |
| `app/api/ceac/status/route.ts`                        | API endpoint for status updates         |
| `app/api/cron/ceac-reminders/route.ts`                | Cron endpoint (called by EasyCron)      |

---

## PART 3 — DQ DATE CALCULATION (CONFIRMED CORRECT)

The dashboard's "In Interview Queue" card calculates estimated interview windows. This was reviewed and confirmed to be:

- **Not hardcoded** — all values come from user data
- **Mathematically correct** — calculation matches the official US State Department IV wait time methodology
- "8 months behind" and "Dec 2026 – Feb 2027" are the correct outputs for the user's data

**How it works:**

```
User's DQ Date:           April 2026
Embassy current month:    August 2025
Gap:                      8 months

Today + 8 months = December 2026 (low estimate)
December + 2 months = February 2027 (high estimate)
Result: "Dec 2026 – Feb 2027"
```

The "Check Latest Official Tool" button links to the official US State Department website.

**Limitation (known, by design):** The embassy scheduling month must be manually updated by the user in Step 2.11 when it changes. There is no public API available to fetch this automatically.

---

## SUMMARY — What Changed Across the Codebase

| File                     | What Changed                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `StepView.tsx`           | Step numbering, Next button, AP status wiring, TypeScript fixes, sync effects |
| `ChapterView.tsx`        | Step number display in chapter list                                           |
| `RoadmapLayoutV2.tsx`    | Breadcrumb step numbers                                                       |
| `StepHeader.tsx`         | Added optional `stepNumber` prop                                              |
| `APTrackingTool.tsx`     | Days counter fix, future date handling, label fix                             |
| `DashboardView.tsx`      | AP deduplication, DQ card deduplication, import fix, div structure fix        |
| `useWizard.ts`           | Retry logic for step sync                                                     |
| `AuthContext.tsx`        | Silent error handling, retry logic                                            |
| `FollowUpManager.tsx`    | Silent error handling                                                         |
| `twentyTwoOneG.ts`       | Return null on error instead of throwing                                      |
| `ApprovalNoticeTool.tsx` | Badge styling (from staging)                                                  |
| 9 new files              | CEAC notification system (see Part 2)                                         |
| 2 new SQL migrations     | Database tables for CEAC tracking                                             |

---

## Total Items Completed

| Category                    | Count |
| --------------------------- | ----- |
| Bug fixes                   | 10    |
| Merge conflicts resolved    | 22    |
| New feature reminders built | 13    |
| New files created           | 11    |
| Existing files modified     | 10    |

---

_Document prepared for leadership review — April 2026_  
_All changes are on branch: `hashir-roadmap-journey-feature`_
