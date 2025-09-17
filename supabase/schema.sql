-- Enable UUID extension for potential future use
-- create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist (for clean recreation)
drop table if exists public.degree_template_courses cascade;
drop table if exists public.degree_template_semesters cascade;
drop table if exists public.degree_templates cascade;
drop table if exists public.shared_plan_courses cascade;
drop table if exists public.shared_plan_semesters cascade;
drop table if exists public.shared_plans cascade;
drop table if exists public.courses cascade;
drop table if exists public.semesters cascade;
drop table if exists public.profiles cascade;

-- Drop functions if they exist
drop function if exists public.handle_updated_at() cascade;

-- Profiles table: holds per-user global data (notes, degree info, optional personal info)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notes text default '' not null,
  degree_name text,
  degree_total_credits integer,
  
  -- Optional Personal Information (all nullable)
  first_name text,
  last_name text,
  display_name text,
  bio text,
  avatar_url text,
  
  -- Optional Academic Information (all nullable)
  university text,
  major text,
  minor text,
  graduation_year integer,
  gpa real,
  
  -- Privacy Settings
  profile_public boolean default false not null,
  allow_plan_sharing boolean default true not null,
  
  -- Admin Role
  is_admin boolean default false not null,
  admin_level text default 'user' not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint profiles_degree_credits_check check (
    (degree_name is null and degree_total_credits is null) or
    (degree_name is not null and degree_total_credits is not null and degree_total_credits >= 60 and degree_total_credits <= 200)
  ),
  constraint profiles_degree_name_length check (length(degree_name) <= 100),
  constraint profiles_notes_length check (length(notes) <= 10000),
  constraint profiles_first_name_length check (first_name is null or length(trim(first_name)) <= 50),
  constraint profiles_last_name_length check (last_name is null or length(trim(last_name)) <= 50),
  constraint profiles_display_name_length check (display_name is null or length(trim(display_name)) <= 100),
  constraint profiles_bio_length check (bio is null or length(bio) <= 500),
  constraint profiles_university_length check (university is null or length(trim(university)) <= 100),
  constraint profiles_major_length check (major is null or length(trim(major)) <= 100),
  constraint profiles_minor_length check (minor is null or length(trim(minor)) <= 100),
  constraint profiles_graduation_year_range check (graduation_year is null or (graduation_year >= 2020 and graduation_year <= 2035)),
  constraint profiles_gpa_range check (gpa is null or (gpa >= 0 and gpa <= 4)),
  constraint profiles_admin_level_valid check (admin_level in ('user', 'moderator', 'admin', 'super_admin'))
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
  credits numeric(3,1) not null,
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
  constraint courses_credits_range check (credits >= 0 and credits <= 6),
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

-- Shared Plans table: for sharing semester plans with others
create table public.shared_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  share_token text unique not null default encode(gen_random_bytes(32), 'base64'),
  is_public boolean default false not null,
  view_count integer default 0 not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint shared_plans_title_length check (length(trim(title)) >= 1 and length(trim(title)) <= 100),
  constraint shared_plans_description_length check (description is null or length(description) <= 500),
  constraint shared_plans_view_count_positive check (view_count >= 0),
  constraint shared_plans_expires_future check (expires_at is null or expires_at > created_at)
);

-- Shared Plan Semesters: snapshot of semesters for shared plans
create table public.shared_plan_semesters (
  id uuid primary key default gen_random_uuid(),
  shared_plan_id uuid not null references public.shared_plans(id) on delete cascade,
  name text not null,
  year integer not null,
  season text not null,
  notes text,
  
  -- Constraints
  constraint shared_plan_semesters_name_length check (length(name) >= 1 and length(name) <= 50),
  constraint shared_plan_semesters_year_range check (year >= 2020 and year <= 2035),
  constraint shared_plan_semesters_season_valid check (season in ('Autumn', 'Spring', 'Summer')),
  constraint shared_plan_semesters_notes_length check (notes is null or length(notes) <= 1000)
);

-- Shared Plan Courses: snapshot of courses for shared plans
create table public.shared_plan_courses (
  id uuid primary key default gen_random_uuid(),
  shared_plan_semester_id uuid not null references public.shared_plan_semesters(id) on delete cascade,
  name text not null,
  credits numeric(3,1) not null,
  days_of_week text[],
  start_time text,
  end_time text,
  grade real,
  color text,
  notes text,
  
  -- Constraints
  constraint shared_plan_courses_name_length check (length(trim(name)) >= 1 and length(trim(name)) <= 100),
  constraint shared_plan_courses_credits_range check (credits >= 0 and credits <= 6),
  constraint shared_plan_courses_grade_range check (grade is null or (grade >= 0 and grade <= 4)),
  constraint shared_plan_courses_time_format check (
    (start_time is null or start_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$') and
    (end_time is null or end_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
  ),
  constraint shared_plan_courses_days_valid check (
    days_of_week is null or (
      array_length(days_of_week, 1) <= 7 and
      days_of_week <@ array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )
  ),
  constraint shared_plan_courses_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint shared_plan_courses_notes_length check (notes is null or length(notes) <= 1000),
  constraint shared_plan_courses_time_logic check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and start_time < end_time)
  )
);

-- Degree Templates table: for saving and sharing degree templates
create table public.degree_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  university text,
  major text,
  minor text,
  total_credits integer,
  duration_years integer,
  tags text[],
  is_public boolean default false not null,
  is_official boolean default false not null,
  share_token text unique not null default encode(gen_random_bytes(32), 'base64'),
  view_count integer default 0 not null,
  like_count integer default 0 not null,
  download_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint degree_templates_name_length check (length(trim(name)) >= 1 and length(trim(name)) <= 100),
  constraint degree_templates_description_length check (description is null or length(description) <= 1000),
  constraint degree_templates_university_length check (university is null or length(trim(university)) <= 100),
  constraint degree_templates_major_length check (major is null or length(trim(major)) <= 100),
  constraint degree_templates_minor_length check (minor is null or length(trim(minor)) <= 100),
  constraint degree_templates_total_credits_range check (total_credits is null or (total_credits >= 60 and total_credits <= 200)),
  constraint degree_templates_duration_years_range check (duration_years is null or (duration_years >= 1 and duration_years <= 8)),
  constraint degree_templates_view_count_positive check (view_count >= 0),
  constraint degree_templates_like_count_positive check (like_count >= 0),
  constraint degree_templates_download_count_positive check (download_count >= 0)
);

-- Degree Template Semesters: template semesters for degree templates
create table public.degree_template_semesters (
  id uuid primary key default gen_random_uuid(),
  degree_template_id uuid not null references public.degree_templates(id) on delete cascade,
  name text not null,
  year integer not null,
  season text not null,
  notes text,
  
  -- Constraints
  constraint degree_template_semesters_name_length check (length(name) >= 1 and length(name) <= 50),
  constraint degree_template_semesters_year_range check (year >= 1 and year <= 8),
  constraint degree_template_semesters_season_valid check (season in ('Autumn', 'Spring', 'Summer')),
  constraint degree_template_semesters_notes_length check (notes is null or length(notes) <= 1000)
);

-- Degree Template Courses: template courses for degree templates
create table public.degree_template_courses (
  id uuid primary key default gen_random_uuid(),
  degree_template_semester_id uuid not null references public.degree_template_semesters(id) on delete cascade,
  name text not null,
  credits numeric(3,1) not null,
  course_code text,
  prerequisites text,
  description text,
  is_required boolean default true not null,
  
  -- Constraints
  constraint degree_template_courses_name_length check (length(trim(name)) >= 1 and length(trim(name)) <= 100),
  constraint degree_template_courses_credits_range check (credits >= 0 and credits <= 6),
  constraint degree_template_courses_code_length check (course_code is null or length(trim(course_code)) <= 20),
  constraint degree_template_courses_prerequisites_length check (prerequisites is null or length(prerequisites) <= 500),
  constraint degree_template_courses_description_length check (description is null or length(description) <= 500)
);

-- Indexes for better performance
create index idx_profiles_user_id on public.profiles(user_id);
create index idx_semesters_user_id on public.semesters(user_id);
create index idx_semesters_user_year_season on public.semesters(user_id, year, season);
create index idx_semesters_active on public.semesters(user_id, is_active) where is_active = true;
create index idx_courses_user_id on public.courses(user_id);
create index idx_courses_semester_id on public.courses(semester_id);
create index idx_courses_user_semester on public.courses(user_id, semester_id);

-- Indexes for sharing tables
create index idx_shared_plans_user_id on public.shared_plans(user_id);
create index idx_shared_plans_share_token on public.shared_plans(share_token);
create index idx_shared_plans_public on public.shared_plans(is_public) where is_public = true;
create index idx_shared_plan_semesters_plan_id on public.shared_plan_semesters(shared_plan_id);
create index idx_shared_plan_courses_semester_id on public.shared_plan_courses(shared_plan_semester_id);

-- Indexes for degree templates
create index idx_degree_templates_user_id on public.degree_templates(user_id);
create index idx_degree_templates_share_token on public.degree_templates(share_token);
create index idx_degree_templates_public on public.degree_templates(is_public) where is_public = true;
create index idx_degree_templates_official on public.degree_templates(is_official) where is_official = true;
create index idx_degree_template_semesters_template_id on public.degree_template_semesters(degree_template_id);
create index idx_degree_template_courses_semester_id on public.degree_template_courses(degree_template_semester_id);

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

create trigger shared_plans_updated_at
  before update on public.shared_plans
  for each row execute function public.handle_updated_at();

create trigger degree_templates_updated_at
  before update on public.degree_templates
  for each row execute function public.handle_updated_at();

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;
alter table public.shared_plans enable row level security;
alter table public.shared_plan_semesters enable row level security;
alter table public.shared_plan_courses enable row level security;
alter table public.degree_templates enable row level security;
alter table public.degree_template_semesters enable row level security;
alter table public.degree_template_courses enable row level security;

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

-- Shared Plans policies
create policy "shared_plans_select_own_or_public" on public.shared_plans 
  for select using (auth.uid() = user_id or is_public = true);

create policy "shared_plans_insert_own" on public.shared_plans 
  for insert with check (auth.uid() = user_id);

create policy "shared_plans_update_own" on public.shared_plans 
  for update using (auth.uid() = user_id);

create policy "shared_plans_delete_own" on public.shared_plans 
  for delete using (auth.uid() = user_id);

-- Shared Plan Semesters policies (accessible if parent plan is accessible)
create policy "shared_plan_semesters_select" on public.shared_plan_semesters 
  for select using (
    exists (
      select 1 from public.shared_plans sp 
      where sp.id = shared_plan_id 
      and (sp.user_id = auth.uid() or sp.is_public = true)
    )
  );

create policy "shared_plan_semesters_insert" on public.shared_plan_semesters 
  for insert with check (
    exists (
      select 1 from public.shared_plans sp 
      where sp.id = shared_plan_id 
      and sp.user_id = auth.uid()
    )
  );

create policy "shared_plan_semesters_update" on public.shared_plan_semesters 
  for update using (
    exists (
      select 1 from public.shared_plans sp 
      where sp.id = shared_plan_id 
      and sp.user_id = auth.uid()
    )
  );

create policy "shared_plan_semesters_delete" on public.shared_plan_semesters 
  for delete using (
    exists (
      select 1 from public.shared_plans sp 
      where sp.id = shared_plan_id 
      and sp.user_id = auth.uid()
    )
  );

-- Shared Plan Courses policies (accessible if parent plan is accessible)
create policy "shared_plan_courses_select" on public.shared_plan_courses 
  for select using (
    exists (
      select 1 from public.shared_plan_semesters sps
      join public.shared_plans sp on sp.id = sps.shared_plan_id
      where sps.id = shared_plan_semester_id 
      and (sp.user_id = auth.uid() or sp.is_public = true)
    )
  );

create policy "shared_plan_courses_insert" on public.shared_plan_courses 
  for insert with check (
    exists (
      select 1 from public.shared_plan_semesters sps
      join public.shared_plans sp on sp.id = sps.shared_plan_id
      where sps.id = shared_plan_semester_id 
      and sp.user_id = auth.uid()
    )
  );

create policy "shared_plan_courses_update" on public.shared_plan_courses 
  for update using (
    exists (
      select 1 from public.shared_plan_semesters sps
      join public.shared_plans sp on sp.id = sps.shared_plan_id
      where sps.id = shared_plan_semester_id 
      and sp.user_id = auth.uid()
    )
  );

create policy "shared_plan_courses_delete" on public.shared_plan_courses 
  for delete using (
    exists (
      select 1 from public.shared_plan_semesters sps
      join public.shared_plans sp on sp.id = sps.shared_plan_id
      where sps.id = shared_plan_semester_id 
      and sp.user_id = auth.uid()
    )
  );

-- Degree Templates policies
create policy "degree_templates_select_own_or_public" on public.degree_templates 
  for select using (auth.uid() = user_id or is_public = true);

create policy "degree_templates_insert_own" on public.degree_templates 
  for insert with check (auth.uid() = user_id);

create policy "degree_templates_update_own" on public.degree_templates 
  for update using (auth.uid() = user_id);

create policy "degree_templates_delete_own" on public.degree_templates 
  for delete using (auth.uid() = user_id);

-- Degree Template Semesters policies (accessible if parent template is accessible)
create policy "degree_template_semesters_select" on public.degree_template_semesters 
  for select using (
    exists (
      select 1 from public.degree_templates dt 
      where dt.id = degree_template_id 
      and (dt.user_id = auth.uid() or dt.is_public = true)
    )
  );

create policy "degree_template_semesters_insert" on public.degree_template_semesters 
  for insert with check (
    exists (
      select 1 from public.degree_templates dt 
      where dt.id = degree_template_id 
      and dt.user_id = auth.uid()
    )
  );

create policy "degree_template_semesters_update" on public.degree_template_semesters 
  for update using (
    exists (
      select 1 from public.degree_templates dt 
      where dt.id = degree_template_id 
      and dt.user_id = auth.uid()
    )
  );

create policy "degree_template_semesters_delete" on public.degree_template_semesters 
  for delete using (
    exists (
      select 1 from public.degree_templates dt 
      where dt.id = degree_template_id 
      and dt.user_id = auth.uid()
    )
  );

-- Degree Template Courses policies (accessible if parent template is accessible)
create policy "degree_template_courses_select" on public.degree_template_courses 
  for select using (
    exists (
      select 1 from public.degree_template_semesters dts
      join public.degree_templates dt on dt.id = dts.degree_template_id
      where dts.id = degree_template_semester_id 
      and (dt.user_id = auth.uid() or dt.is_public = true)
    )
  );

create policy "degree_template_courses_insert" on public.degree_template_courses 
  for insert with check (
    exists (
      select 1 from public.degree_template_semesters dts
      join public.degree_templates dt on dt.id = dts.degree_template_id
      where dts.id = degree_template_semester_id 
      and dt.user_id = auth.uid()
    )
  );

create policy "degree_template_courses_update" on public.degree_template_courses 
  for update using (
    exists (
      select 1 from public.degree_template_semesters dts
      join public.degree_templates dt on dt.id = dts.degree_template_id
      where dts.id = degree_template_semester_id 
      and dt.user_id = auth.uid()
    )
  );

create policy "degree_template_courses_delete" on public.degree_template_courses 
  for delete using (
    exists (
      select 1 from public.degree_template_semesters dts
      join public.degree_templates dt on dt.id = dts.degree_template_id
      where dts.id = degree_template_semester_id 
      and dt.user_id = auth.uid()
    )
  );

-- Public profile viewing policy
create policy "profiles_select_public" on public.profiles 
  for select using (profile_public = true or auth.uid() = user_id);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.semesters to anon, authenticated;
grant all on public.courses to anon, authenticated;
grant all on public.shared_plans to anon, authenticated;
grant all on public.shared_plan_semesters to anon, authenticated;
grant all on public.shared_plan_courses to anon, authenticated;
grant all on public.degree_templates to anon, authenticated;
grant all on public.degree_template_semesters to anon, authenticated;
grant all on public.degree_template_courses to anon, authenticated;

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