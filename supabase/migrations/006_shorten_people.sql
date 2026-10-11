-- Drop fields that are no longer part of a person record.
-- The search index expression includes reference_number, so Postgres drops
-- that index with the column. Recreate it for the fields that remain.

alter table public.people
  drop column if exists reference_number,
  drop column if exists notice_period,
  drop column if exists maximum_duration,
  drop column if exists personal_status,
  drop column if exists blackout_dates,
  drop column if exists enrolment_date,
  drop column if exists notes,
  drop column if exists tier,
  drop column if exists has_cv,
  drop column if exists has_contract,
  drop column if exists has_tracking,
  drop column if exists owner;

create index if not exists people_search_idx on public.people using gin (
  (
    coalesce(name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(most_recent_position, '') || ' ' ||
    coalesce(primary_residence, '')
  ) gin_trgm_ops
);
