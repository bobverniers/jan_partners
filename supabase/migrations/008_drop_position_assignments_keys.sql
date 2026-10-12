-- Most recent position, previous assignments, and hotel keys are no longer
-- collected. The search index expression includes most_recent_position, so
-- drop that index with the columns and recreate it for the fields that remain.

drop index if exists public.people_search_idx;

alter table public.people
  drop column if exists most_recent_position,
  drop column if exists previous_assignments,
  drop column if exists number_of_keys;

create index if not exists people_search_idx on public.people using gin (
  (
    coalesce(name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(primary_residence, '')
  ) gin_trgm_ops
);
