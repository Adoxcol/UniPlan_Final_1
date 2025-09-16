-- Enable UUID extension for potential future use
-- create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist (for clean recreation)
drop table if exists public.courses cascade;
drop table if exists public.semesters cascade;
drop table if exists public.profiles cascade;

-- Profiles table: holds per-user global data (notes, degree info)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notes text default '' not null,
  degree_name text,
  degree_total_credits integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint profiles_degree_credits_check check (
    (degree_name is null and degree_total_credits is null) or
    (degree_name is not null and degree_total_credits is not null and degree_total_credits >= 60 and degree_total_credits <= 200)
  ),
  constraint profiles_degree_name_length check (length(degree_name) <= 100),
  constraint profiles_notes_length check (length(notes) <= 10000)
);

-- Semesters table: stores semester information
create table public.semesters (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  year integer not null,
  season text not null,
  is_active boolean default false not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint semesters_name_length check (length(name) >= 1 and length(name) <= 50),
  constraint semesters_year_range check (year >= 2020 and year <= 2030),
  constraint semesters_season_valid check (season in ('Autumn', 'Spring', 'Summer')),
  constraint semesters_notes_length check (notes is null or length(notes) <= 1000),
  constraint semesters_id_format check (length(id) >= 1 and length(id) <= 50)
);

-- Courses table: stores course information under semesters
create table public.courses (
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
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint courses_name_length check (length(trim(name)) >= 1 and length(trim(name)) <= 100),
  constraint courses_credits_range check (credits >= 1 and credits <= 6),
  constraint courses_grade_range check (grade is null or (grade >= 0 and grade <= 4)),
  constraint courses_time_format check (
    (start_time is null or start_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$') and
    (end_time is null or end_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
  ),
  constraint courses_days_valid check (
    days_of_week is null or (
      array_length(days_of_week, 1) <= 7 and
      days_of_week <@ array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )
  ),
  constraint courses_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint courses_notes_length check (notes is null or length(notes) <= 1000),
  constraint courses_id_format check (length(id) >= 1 and length(id) <= 50),
  constraint courses_time_logic check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and start_time < end_time)
  )
);

-- Indexes for better performance
create index idx_profiles_user_id on public.profiles(user_id);
create index idx_semesters_user_id on public.semesters(user_id);
create index idx_semesters_user_year_season on public.semesters(user_id, year, season);
create index idx_semesters_active on public.semesters(user_id, is_active) where is_active = true;
create index idx_courses_user_id on public.courses(user_id);
create index idx_courses_semester_id on public.courses(semester_id);
create index idx_courses_user_semester on public.courses(user_id, semester_id);

-- Unique constraints
alter table public.semesters add constraint semesters_user_year_season_unique 
  unique(user_id, year, season);

-- Only one active semester per user
create unique index idx_semesters_one_active_per_user 
  on public.semesters(user_id) 
  where is_active = true;

-- Functions for automatic timestamp updates
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger semesters_updated_at
  before update on public.semesters
  for each row execute function public.handle_updated_at();

create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.handle_updated_at();

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles 
  for select using (auth.uid() = user_id);

create policy "profiles_insert_own" on public.profiles 
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles 
  for update using (auth.uid() = user_id);

create policy "profiles_delete_own" on public.profiles 
  for delete using (auth.uid() = user_id);

-- Semesters policies
create policy "semesters_select_own" on public.semesters 
  for select using (auth.uid() = user_id);

create policy "semesters_insert_own" on public.semesters 
  for insert with check (auth.uid() = user_id);

create policy "semesters_update_own" on public.semesters 
  for update using (auth.uid() = user_id);

create policy "semesters_delete_own" on public.semesters 
  for delete using (auth.uid() = user_id);

-- Courses policies
create policy "courses_select_own" on public.courses 
  for select using (auth.uid() = user_id);

create policy "courses_insert_own" on public.courses 
  for insert with check (auth.uid() = user_id);

create policy "courses_update_own" on public.courses 
  for update using (auth.uid() = user_id);

create policy "courses_delete_own" on public.courses 
  for delete using (auth.uid() = user_id);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.semesters to anon, authenticated;
grant all on public.courses to anon, authenticated;

-- Comments for documentation
comment on table public.profiles is 'User profiles containing global notes and degree information';
comment on table public.semesters is 'Academic semesters with courses and scheduling';
comment on table public.courses is 'Individual courses within semesters';

comment on column public.profiles.notes is 'Global user notes (max 10,000 characters)';
comment on column public.profiles.degree_name is 'Name of the degree program';
comment on column public.profiles.degree_total_credits is 'Total credits required for degree (60-200)';

comment on column public.semesters.season is 'Academic season: Autumn, Spring, or Summer';
comment on column public.semesters.is_active is 'Whether this is the currently active semester';
comment on column public.semesters.year is 'Academic year (2020-2030)';

comment on column public.courses.credits is 'Course credit hours (1-6)';
comment on column public.courses.grade is 'Course grade on 4.0 scale (0-4)';
comment on column public.courses.days_of_week is 'Array of weekdays when course meets';
comment on column public.courses.start_time is 'Course start time in HH:MM format';
comment on column public.courses.end_time is 'Course end time in HH:MM format';
comment on column public.courses.color is 'Hex color code for course display';


