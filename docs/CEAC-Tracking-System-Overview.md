# CEAC Status Tracking & Notification System
## Non-Technical Overview — For Leadership Review

**Project:** Rahvana IR-1 Visa Journey  
**Feature:** Automated CEAC Status Reminders  
**Date:** April 2026  
**Prepared by:** Development Team

---

## What Is This Feature?

When a user goes through the IR-1 visa journey, the most anxious and uncertain phase is **after the interview** — when they are waiting for their visa to be processed. During this time, users check their CEAC (Consular Electronic Application Center) status repeatedly but don't always know what each status means or what to do next.

This system **automatically sends the right reminder at the right time** based on what the user tells Rahvana about their CEAC status. No manual action is required from admin after setup.

---

## Where Does Tracking Start?

Tracking begins **only after the user reports a CEAC status beyond the NVC stage.**

> We intentionally **skip NVC internal sub-stages** (like "At NVC") because those are internal processing steps that users cannot meaningfully track. Tracking activates only when the case moves to the embassy.

---

## The Journey — Which Chapters & Steps Are Involved

### Chapter 3: Medical + Interview

This is the only chapter where CEAC status tracking is relevant.

| Step # | Step Name | What Happens Here |
|--------|-----------|-------------------|
| **Step 7** | Prepare for Interview | User prepares for the consular interview |
| **Step 8** | Attend Visa Interview | User attends interview. Three outcomes possible: Approved / AP / Refused |
| **Step 9** | Track Administrative Processing | **← This is where the tracking system activates** |

> **Step 8 (Attend Visa Interview)** shows the user three possible outcomes:
> - Visa Approved → journey continues normally
> - Administrative Processing (AP) → user goes to Step 9
> - Refused → user goes to Step 9 to record the refusal

> **Step 9 (Track Administrative Processing)** is the main interface where:
> 1. User records their CEAC status from a dropdown
> 2. User clicks **"Save AP Status & Activate Tracking"**
> 3. The notification system is triggered **automatically**

---

## What CEAC Statuses Does the System Track?

| Status User Reports | System Tracks? | What It Means |
|--------------------|---------------|---------------|
| Administrative Processing | ✅ Yes | Case under review post-interview |
| Ready | ✅ Yes | Embassy has the file, interview coming |
| Issued | ✅ Yes | Visa approved, courier delivery in progress |
| Refused | ✅ Yes | Needs clarification (see below) |
| In Transit | ✅ Yes | Case moving from NVC to embassy |
| Pending / Not Available | ❌ No | NVC internal — not tracked |

---

## The 13 Reminders — When & What

### Group 1 — When status = "In Transit"

| # | When It Fires | What User Receives | Channel |
|---|--------------|-------------------|---------|
| R1 | Immediately | "Case is on its way to the embassy — no action needed" | Push |
| R2 | 3 days later (if not updated) | "Check CEAC — may have changed to Ready" | Push |

**Auto-cancelled when:** User reports Ready or any later status.

---

### Group 2 — When status = "Ready"

| # | When It Fires | What User Receives | Channel |
|---|--------------|-------------------|---------|
| R3 | Immediately | **URGENT:** "Status is Ready — your interview is coming" | Push + Email |
| R4 | Every 14 days | "Check CEAC for updates" (repeats until interview outcome) | Push |

**Auto-cancelled when:** User reports AP, Issued, or Refused.

---

### Group 3 — When status = "Administrative Processing"

| # | When It Fires | What User Receives | Channel |
|---|--------------|-------------------|---------|
| R5 | Immediately | **"AP is not a refusal — what this means"** | Push + Email |
| R6 | Every 14 days | "Log into CEAC and check for updates" (repeats) | Push |
| R7 | Day 60 (once) | "AP 60+ days — consider consulting an attorney" | Push |

**Auto-cancelled when:** User reports Issued or Refused.

---

### Group 4 — When status = "Issued"

| # | When It Fires | What User Receives | Channel |
|---|--------------|-------------------|---------|
| R8 | Immediately | **URGENT:** "Visa Issued — track your courier delivery now" | Push + Email |
| R9 | 2 days later | "Have you received your passport?" | Push |

**R9 auto-cancelled when:** User marks passport as received.

---

### Group 5 — When status = "Refused"

**Important rule:** The system never assumes whether a refusal is a 221(g) or a final denial. The user is shown a prompt asking which situation applies. Only then are specific reminders sent.

| # | When It Fires | Condition | What User Receives | Channel |
|---|--------------|-----------|-------------------|---------|
| R10 | Immediately | All refusals | **URGENT:** "Refused — read your written notice carefully" | Push + Email |
| R11 | Immediately | User confirms 221(g) | "Submit the requested documents promptly" | Push |
| R12 | Every 21 days | After 221(g) docs submitted | "Check CEAC — has status changed to Issued?" (repeats) | Push |
| R13 | Immediately | User confirms final denial | "Final refusal — consult an immigration attorney" | Push + Email |

---

## Visual Summary — Notification Timeline

```
User enters CEAC status in Step 9
        │
        ▼
   ┌─────────────────────────────────────────────────────┐
   │ STATUS: In Transit                                  │
   │  Day 0  → R1: "Case heading to embassy"             │
   │  Day 3  → R2: "Check CEAC — may be Ready now"       │
   └─────────────────────────────────────────────────────┘
        │ (advances to Ready)
        ▼
   ┌─────────────────────────────────────────────────────┐
   │ STATUS: Ready                                       │
   │  Day 0  → R3: URGENT "Interview coming"             │
   │  Day 14 → R4: "Check CEAC" ← repeats every 14 days │
   │  Day 28 → R4 again                                  │
   │  Day 42 → R4 again ... (until outcome reported)     │
   └─────────────────────────────────────────────────────┘
        │ (after interview — 3 paths)
        ▼
   ┌──────────────┬───────────────┬──────────────────────┐
   │ AP           │ ISSUED        │ REFUSED               │
   │ Day 0 → R5   │ Day 0 → R8    │ Day 0 → R10          │
   │ Day 14 → R6  │ Day 2 → R9    │                      │
   │ Day 28 → R6  │               │ User clarifies:       │
   │ Day 60 → R7  │               │ 221(g) → R11, R12    │
   │ (recurring)  │               │ Final  → R13         │
   └──────────────┴───────────────┴──────────────────────┘
```

---

## Is It Automatic? What Does Admin Need to Do?

### Fully Automatic — No Manual Action Required:
- ✅ Reminders schedule themselves when user saves status
- ✅ Old reminders cancel themselves when status advances
- ✅ Recurring reminders re-schedule themselves after each send
- ✅ Emails send via Resend automatically
- ✅ System runs on a timer (every hour + every 6 hours via EasyCron)

### One-Time Admin Setup Required (already done in code):

| Task | Who | Status |
|------|-----|--------|
| Run database migration (`20260420_ceac_tracking.sql`) | Developer | ✅ Done by team |
| Add `CRON_SECRET` to environment variables | Developer | Needs `.env` update |
| Register EasyCron job (6-hourly, URL + secret header) | Developer/Admin | Needs EasyCron config |
| Add push notification provider (FCM/Expo) | Developer | Placeholder ready |

### What Admin CAN Monitor (in Supabase Dashboard):

| Table | What You Can See |
|-------|-----------------|
| `ceac_case_status` | Every user's current status + full history |
| `ceac_scheduled_notifications` | Every pending/sent/cancelled reminder + timestamps |

---

## What the User Sees — Step by Step

1. **User completes their interview** (Chapter 3, Step 8)
2. **User comes to Step 9** — sees a form to record their CEAC status
3. **User selects their status** from a dropdown (e.g., "Administrative Processing")
4. **User clicks "Save AP Status & Activate Tracking"**
   - If status = Refused → a prompt appears asking: *"Is this a 221(g) or a final denial?"*
5. **System schedules reminders silently in the background**
6. **User receives push notifications** at the correct intervals
7. **For URGENT reminders** → also receives an email
8. **When user updates their status** (e.g., AP → Issued) → old reminders auto-cancel, new ones schedule

---

## Status Progression Rules

The system enforces a logical order. Users can only move forward:

```
At NVC → In Transit → Ready → Administrative Processing ┐
                                                         ├→ Issued
                                                 Ready → ┘
                                                 Ready → Refused
                                           Refused (221g) → Issued (possible)
```

If a user tries to report an impossible transition (e.g., Issued → In Transit), the system rejects it gracefully.

---

## Key Decisions & Why

| Decision | Reason |
|----------|--------|
| Skip NVC sub-stages | NVC internal status is not actionable for users |
| Never auto-assume 221(g) vs final refusal | These require completely different actions — guessing wrong causes harm |
| Recurring reminders re-enqueue themselves | Ensures user keeps checking without admin intervention |
| Suppression runs before EVERY send | Prevents sending outdated reminders even if user updated status between sends |
| Supabase as job queue (no Redis needed) | Simpler architecture, already in the stack |

---

## Summary in One Paragraph

When a user reports their CEAC status in Step 9 of Chapter 3 (Track Administrative Processing), Rahvana automatically schedules the correct set of reminders for that status — immediately for urgent updates, and on recurring intervals for waiting periods. As the user advances their status, older reminders are cancelled and new ones take their place. The entire cycle runs without any admin involvement after the initial one-time setup. Admin can monitor all activity in the Supabase database at any time.

---

*Document prepared for leadership review. Technical implementation details available separately.*
