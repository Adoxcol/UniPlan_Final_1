-- Enable UUID extension if you choose to use uuid keys later
-- create extension if not exists "uuid-ossp";

-- Profiles hold per-user global data (notes, degree)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notes text default '' not null,
  degree_name text,
  degree_total_credits integer
);

-- Semesters owned by user. We keep id as text to align with client ids
create table if not exists public.semesters (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  year integer not null,
  season text not null,
  is_active boolean default false,
  notes text
);

-- Courses under a semester
create table if not exists public.courses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_id text not null references public.semesters(id) on delete cascade,
  name text not null,
  credits integer not null,
  days_of_week text[],
  start_time text,
  end_time text,
  grade real,
  color text,
  notes text
);

-- RLS
alter table public.profiles enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_upsert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- Semesters policies
create policy "semesters_select_own" on public.semesters for select using (auth.uid() = user_id);
create policy "semesters_insert_own" on public.semesters for insert with check (auth.uid() = user_id);
create policy "semesters_update_own" on public.semesters for update using (auth.uid() = user_id);
create policy "semesters_delete_own" on public.semesters for delete using (auth.uid() = user_id);

-- Courses policies
create policy "courses_select_own" on public.courses for select using (auth.uid() = user_id);
create policy "courses_insert_own" on public.courses for insert with check (auth.uid() = user_id);
create policy "courses_update_own" on public.courses for update using (auth.uid() = user_id);
create policy "courses_delete_own" on public.courses for delete using (auth.uid() = user_id);


