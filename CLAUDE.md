# Rahvana (Arachnie) — IR-1/CR-1 Visa Journey Platform

Full architecture, stack, folder map, DB schema, request/data flows, and file-importance
ranking live in **@docs/PROJECT_KNOWLEDGE.md**. Read that first for any non-trivial task;
open individual source files only when you need line-level detail.

> **Keep the docs alive.** When you make a change that alters architecture, a source of
> truth, a core data flow, the DB schema, or a critical rule, update
> `docs/PROJECT_KNOWLEDGE.md` in the same change so it never drifts from the code.

## Commands
```bash
npm run dev                              # Frontend at :3000
npm run build                            # Production build (Turbopack)
npm run lint                             # ESLint
cd backend && uvicorn main:app --reload  # FastAPI at :8000
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit  # Type check (builds DON'T)
```

## Critical rules
These cause real bugs and cannot be inferred from the code. Everything else is in PROJECT_KNOWLEDGE.md.

- **Never short-circuit `visible_when`.** Filter steps only via `getActiveStepsForStage(...)` in `app/components/journey-engine/journeyHelpers.ts` (spouse UI has a parallel copy at `app/components/journey-spouse/journeyHelpers.ts`) — never inline. New `visible_when` conditions go into the helper first, then the JSON data file.
- **Live journey source of truth is `data/visa-category/*.json`, NOT `data/roadmap.ts`.** The per-category JSON (keyed by `chapter_key`/`step_key`) drives step visibility, `who`, `filingType`, and stage order for the real V2/V3 dashboards. `data/roadmap.ts` is legacy (`stages`/`id` shape, no `visible_when`) and feeds only the home/marketing pages. Never hardcode stage or step IDs anywhere.
- **Plan tiers gate everything.** Hard-lock rules live only in `lib/entitlements/hardLockRules.ts`. Never put feature-access logic elsewhere; never show premium features to free users without checking entitlements.
- **State sync is bidirectional.** `useWizard` (`app/(main)/dashboard/hooks/useWizard.ts`) ⇄ Supabase, and profile ⇄ case_data via `syncCaseDataToProfile()` / `syncProfileToCaseData()`. Change the journey state shape → update both directions.
- **RLS changes go through `supabase/migrations/` only.** Never edit policies in the Supabase dashboard — they drift.
- **Builds hide TS/ESLint errors** (`ignoreBuildErrors`/`ignoreDuringBuilds`). A green build is not type-clean; run `tsc --noEmit` yourself.
- **Keep domain logic in `lib/`**, route handlers thin, components presentational.
- **User-facing copy is plain ASCII** — no em/en-dash, curly quotes, or ellipsis character.

## Patterns to know
- `getActiveStepsForStage(stage, filingType, metadata)` — always use for step filtering
- `toggleComplete(stepId)` — marks steps done, triggers Supabase update
- `mapDocumentNameToId()` — scopes documents to the journey
- Step `who` field: `"petitioner"` | `"beneficiary"` | `"both"` — affects ChapterView display

## Repeat mistakes log
<!-- Add a line only when the same mistake happens more than once. Format: **Galti** — Sahi tariqa -->
