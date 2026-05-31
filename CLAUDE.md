# Arachnie (Rahvana) — IR-1 Visa Journey Tool

## Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, TailwindCSS 4, shadcn-ui, Zustand
- **Backend**: Python FastAPI (`backend/`), Google Gemini, Supabase (PostgreSQL + RLS)
- **Forms**: React Hook Form + Zod
- **AI features**: Rembg, Tesseract OCR, Qdrant vector DB

## Commands
```bash
npm run dev                              # Frontend at :3000
npm run build                            # Production build (Turbopack)
npm run lint                             # ESLint
cd backend && uvicorn main:app --reload  # FastAPI at :8000
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit  # Type check
```

## Key folders
- `app/` — Next.js routes: `(auth)/`, `(main)/`, `(tools)/`
- `components/` — Reusable UI (shadcn, layout, chat, tools)
- `data/roadmap.ts` — Static IR-1 journey config (stages → steps)
- `lib/` — Supabase client, entitlements, journey helpers, autoFill
- `types/` — Shared TypeScript types
- `backend/` — Python FastAPI, AI services, PDF processing
- `supabase/` — Migrations, edge functions, RLS policies

## Critical rules

**visible_when must be fully evaluated — never short-circuit**
Steps have `visible_when: Record<string, unknown>`. Use `getActiveStepsForStage()` in `lib/journeyHelpers.ts` to filter steps. Never manually filter steps inline — this has caused bugs where steps disappear incorrectly. If adding new conditions to `visible_when`, update `journeyHelpers.ts` first, not just the data file.

**Plan tiers gate everything**
Free / basic / premium / executive tiers. Hard-lock rules live in `lib/entitlements/hardLockRules.ts`. Do not add feature access logic anywhere else. Never show premium features to free users without checking entitlements first.

**State sync is bidirectional**
`useWizard` (at `app/(main)/dashboard/hooks/useWizard.ts`) syncs to Supabase. Profile data flows both ways via `syncCaseDataToProfile()` / `syncProfileToCaseData()`. If you change journey state shape, check both sync functions.

**roadmap.ts is the source of truth**
Step visibility, who (petitioner/beneficiary/both), filingType (online/paper/both), and stage order all come from `data/roadmap.ts`. Do not hardcode stage IDs or step IDs anywhere else.

**Never edit Supabase RLS policies without a migration**
All policy changes go through `supabase/migrations/`. Direct edits to the dashboard will drift.

## Repeat mistakes log
<!-- Only added when the same mistake happens more than once -->
<!-- Format: **Galti** — Sahi tariqa -->


## Patterns to know
- `getActiveStepsForStage(stage, filingType, metadata)` — always use this for step filtering
- `toggleComplete(stepId)` — marks steps done, triggers Supabase update
- `mapDocumentNameToId()` — scopes documents to the journey
- Step `who` field: `"petitioner"` | `"beneficiary"` | `"both"` — affects ChapterView display
