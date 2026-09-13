-- Lock people behind a signed-in session. Anonymous clients can no longer
-- read or change the table.

alter table public.people enable row level security;

drop policy if exists "people_select_anon" on public.people;
drop policy if exists "people_insert_anon" on public.people;
drop policy if exists "people_update_anon" on public.people;
drop policy if exists "people_delete_anon" on public.people;
drop policy if exists "people_select_authenticated" on public.people;
drop policy if exists "people_insert_authenticated" on public.people;
drop policy if exists "people_update_authenticated" on public.people;
drop policy if exists "people_delete_authenticated" on public.people;

revoke all on table public.people from anon;
revoke usage on type public.person_status from anon;

grant usage on type public.person_status to authenticated;
grant select, insert, update, delete on table public.people to authenticated;

create policy "people_select_authenticated"
  on public.people for select
  to authenticated
  using (true);

create policy "people_insert_authenticated"
  on public.people for insert
  to authenticated
  with check (true);

create policy "people_update_authenticated"
  on public.people for update
  to authenticated
  using (true)
  with check (true);

create policy "people_delete_authenticated"
  on public.people for delete
  to authenticated
  using (true);
