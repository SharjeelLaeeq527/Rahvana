-- Create visa_security_questions table
create table if not exists public.visa_security_questions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    portal_username text not null,
    question_1 text not null,
    answer_1 text not null,
    question_2 text not null,
    answer_2 text not null,
    question_3 text not null,
    answer_3 text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    unique(user_id)
);

-- Enable Row Level Security (RLS)
alter table public.visa_security_questions enable row level security;

-- Create policies
create policy "Users can view their own security questions"
    on public.visa_security_questions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own security questions"
    on public.visa_security_questions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own security questions"
    on public.visa_security_questions for update
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.visa_security_questions
    for each row
    execute function public.handle_updated_at();
