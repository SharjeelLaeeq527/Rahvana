# Journey dashboard: drafted items (not built yet)

Things the old (classic) journey dashboard showed that the redesigned dashboard
(`app/components/journey-dashboard/`) does not have yet. Kept here as drafts until we
decide to build them. Administrative processing (the AP tracker on the Result stage)
was built in Nov 2026 and is no longer on this list.

Rule for all of these: the old code located steps by hardcoded positions
(`onSelectStep(2, 8)`, `step_3_8`). That breaks the CLAUDE.md rule. Find steps by their
`tool_data.type` through `findStepByToolType` (`lib/journey/dashboard/buildDashboardModel.ts`),
or read facts through `readCaseFacts` (`lib/journey/dashboard/caseFacts.ts`).

## 1. Case story and time-remaining estimate (highest value)

The old `VisaTicker` ran `generateNarrative` (`lib/narrative/narrativeEngine.ts`, timeline from
`lib/ir1-engine`) on `buildVisaTickerProps(...)` and showed up to six lines: policy alert,
status badge, headline (where the case is), "what this means", estimate (time remaining),
next action.

Draft: a one-line "where you are and what is next" plus the estimate on the tracking ticket
(desktop) and the tracking card (mobile). Feed the narrative engine from `readCaseFacts`
so it reads the same keys as the ticket.

## 2. Milestone history

The old dashboard listed 14 milestones with a tick when reached: eligibility confirmed,
documents gathered, filing method selected, I-130 submitted, NVC fees paid, DS-260
submitted, documents submitted to NVC, documentarily qualified, medical scheduled,
interview scheduled, medical attended, interview attended, outcome confirmed, visa issued.

Draft: a "Milestones" view opened from the tracking ticket. Derive each milestone from
`readCaseFacts` or from the step it belongs to (found by tool type), never from fixed step ids.

## 3. Case summary sentence

The old Case Health card showed `caseNarrative.executiveSummary` (cut to about 280
characters) next to the score. The full analysis drawer still has it.

Draft: one or two lines under the score on desktop and on the mobile Case health page,
hidden while the score is locked by the plan.

## 4. Tracking prompts from the old sidebar

- "NVC document review complete" (tracking_status.nvc_review_complete, not yet DQ)
- "Case registered and under review" with a View receipt details link
- "In interview queue" with a link to the IV wait-times tool
- "Record your DQ date" / "Sync the embassy scheduling month" when the interview
  estimate cannot be worked out yet
- Interview scheduled card with an "Interview prep guide" button

Draft: fold these into the matching tracking stage `note` / links in `buildTracking`.

## 5. Smaller items

- Petition Readiness meter (`DocCaseStrengthMeter`, Chapter 1 documents). The old page showed
  it on mobile and tablet only, collapsed.
- Filing method (online / paper) in the case details. Could be a fact on the Petition stage.
- "Linked to embassy" label on the tracking column (decoration only, probably skip).
