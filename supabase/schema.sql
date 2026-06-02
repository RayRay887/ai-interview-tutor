-- Run this in the Supabase SQL Editor after creating your project.

-- Profile row for each authenticated user (extends auth.users).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create / sync profile when a user signs up via OTP.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set
      email = excluded.email,
      name = coalesce(excluded.name, public.profiles.name),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cumulative interview time (for future pricing caps).
alter table public.profiles
  add column if not exists total_practice_seconds bigint not null default 0;

-- One row per practice session (started → completed or abandoned).
create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('in_progress', 'completed', 'abandoned')),
  question_slug text not null,
  question_title text not null,
  difficulty text not null,
  category text not null,
  session_minutes_planned int not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  code text,
  language text,
  tests_passed int,
  tests_total int,
  all_tests_passed boolean,
  hidden_passed int,
  hidden_total int,
  hints_used int not null default 0,
  transcript jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_attempts_user_started_idx
  on public.practice_attempts (user_id, started_at desc);

create index if not exists practice_attempts_user_status_started_idx
  on public.practice_attempts (user_id, status, started_at desc);

create index if not exists practice_attempts_user_slug_started_idx
  on public.practice_attempts (user_id, question_slug, started_at desc);

alter table public.practice_attempts enable row level security;

create policy "Users can read own practice attempts"
  on public.practice_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own practice attempts"
  on public.practice_attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own practice attempts"
  on public.practice_attempts for update
  using (auth.uid() = user_id);

-- Feedback tied 1:1 to completed attempts.
create table if not exists public.attempt_feedback (
  attempt_id uuid primary key references public.practice_attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  overall_score int not null,
  recommendation text not null,
  headline text not null,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists attempt_feedback_user_created_idx
  on public.attempt_feedback (user_id, created_at desc);

alter table public.attempt_feedback enable row level security;

create policy "Users can read own attempt feedback"
  on public.attempt_feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempt feedback"
  on public.attempt_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can update own attempt feedback"
  on public.attempt_feedback for update
  using (auth.uid() = user_id);
