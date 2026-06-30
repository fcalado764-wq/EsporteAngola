-- Run this once in Supabase SQL Editor if the teams table has duplicate rows.
-- It keeps the oldest row for each exact (name, category, season), moves references
-- to that row, deletes duplicates, and prevents the same duplicate from returning.

with ranked_teams as (
  select
    id,
    first_value(id) over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as row_number
  from public.teams
),
duplicates as (
  select id, keep_id
  from ranked_teams
  where row_number > 1
)
update public.athletes
set team_id = duplicates.keep_id
from duplicates
where public.athletes.team_id = duplicates.id;

with ranked_teams as (
  select
    id,
    first_value(id) over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as row_number
  from public.teams
),
duplicates as (
  select id, keep_id
  from ranked_teams
  where row_number > 1
)
update public.trainings
set team_id = duplicates.keep_id
from duplicates
where public.trainings.team_id = duplicates.id;

with ranked_teams as (
  select
    id,
    first_value(id) over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as row_number
  from public.teams
),
duplicates as (
  select id, keep_id
  from ranked_teams
  where row_number > 1
)
update public.trainer_profiles
set team_id = duplicates.keep_id
from duplicates
where public.trainer_profiles.team_id = duplicates.id;

with ranked_teams as (
  select
    id,
    row_number() over (
      partition by name, category, season
      order by created_at asc, id asc
    ) as row_number
  from public.teams
)
delete from public.teams
using ranked_teams
where public.teams.id = ranked_teams.id
  and ranked_teams.row_number > 1;

do $$
begin
  alter table public.teams
    add constraint teams_name_category_season_unique unique (name, category, season);
exception
  when duplicate_object then null;
end $$;
