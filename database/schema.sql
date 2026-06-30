create extension if not exists "pgcrypto";

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  season text not null,
  coach text not null,
  venue text,
  created_at timestamptz not null default now(),
  unique (name, category, season)
);

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  name text not null,
  initials text not null,
  number integer not null check (number between 1 and 99),
  position text not null,
  age integer check (age between 10 and 60),
  goals integer not null default 0,
  assists integer not null default 0,
  saves_rate integer,
  attendance_rate integer not null default 100 check (attendance_rate between 0 and 100),
  status text not null default 'active' check (status in ('active', 'attention', 'injured', 'archived')),
  injury text,
  fatigue text not null default 'normal' check (fatigue in ('normal', 'high', 'recovery')),
  created_at timestamptz not null default now()
);

create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  training_date date not null,
  training_time time not null,
  title text not null,
  focus text not null,
  venue text,
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  invited integer not null default 0,
  present integer,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.trainer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null default 'trainer' check (role in ('trainer', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'injured', 'excused')),
  notes text,
  created_at timestamptz not null default now(),
  unique (training_id, athlete_id)
);

create table if not exists public.match_stats (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  match_name text not null,
  goals integer not null default 0,
  assists integer not null default 0,
  shots integer not null default 0,
  shots_on_target integer not null default 0,
  saves integer not null default 0,
  turnovers integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.match_stats
  add column if not exists shots integer not null default 0,
  add column if not exists shots_on_target integer not null default 0,
  add column if not exists saves integer not null default 0;

insert into public.teams (name, category, season, coach, venue)
values ('Sporting Luanda', 'Sub-20', '2025/26', 'Mario Figueiredo', 'Pavilhao Cazenga')
on conflict (name, category, season) do update set
  coach = excluded.coach,
  venue = excluded.venue;
