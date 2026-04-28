-- =========================
-- receipt_records (STRICT: 1 receipt per user)
-- =========================

create table if not exists public.receipt_records (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  receipt_number text not null,
  notice_date date,
  priority_date date,
  case_label text,

  source text not null check (source in ('manual', 'upload')),

  tracking_enabled boolean not null default true,
  last_known_status text not null default 'Case Was Received',
  last_checked_at timestamptz not null default now(),

  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 🔥 ENFORCE ONLY ONE RECEIPT PER USER
  unique (user_id)
);

-- =========================
-- updated_at trigger
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists receipt_records_updated_at on public.receipt_records;

create trigger receipt_records_updated_at
before update on public.receipt_records
for each row
execute function public.set_updated_at();

-- =========================
-- indexes
-- =========================

create index if not exists idx_receipt_records_user_id
on public.receipt_records (user_id);

create index if not exists idx_receipt_records_tracking
on public.receipt_records (tracking_enabled, last_checked_at);

-- =========================
-- RLS ENABLE
-- =========================

alter table public.receipt_records enable row level security;

-- =========================
-- CLEAN POLICIES
-- =========================

drop policy if exists "receipt_select" on public.receipt_records;
drop policy if exists "receipt_insert" on public.receipt_records;
drop policy if exists "receipt_update" on public.receipt_records;
drop policy if exists "receipt_delete" on public.receipt_records;

-- SELECT
create policy "receipt_select"
on public.receipt_records
for select
using (auth.uid() = user_id);

-- INSERT
create policy "receipt_insert"
on public.receipt_records
for insert
with check (auth.uid() = user_id);

-- UPDATE
create policy "receipt_update"
on public.receipt_records
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE
create policy "receipt_delete"
on public.receipt_records
for delete
using (auth.uid() = user_id);