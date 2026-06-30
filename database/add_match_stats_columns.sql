alter table public.match_stats
  add column if not exists shots integer not null default 0,
  add column if not exists shots_on_target integer not null default 0,
  add column if not exists saves integer not null default 0;
