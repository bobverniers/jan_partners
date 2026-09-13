-- External keep-alive ping target. Free-plan projects pause after ~7 days
-- without database activity. GitHub Actions calls this function every few days.

create table if not exists public.keep_alive (
  id int primary key check (id = 1),
  touched_at timestamptz not null default now()
);

insert into public.keep_alive (id) values (1)
on conflict (id) do nothing;

alter table public.keep_alive enable row level security;

revoke all on table public.keep_alive from anon, authenticated, public;
grant select on table public.keep_alive to anon, authenticated;

drop policy if exists "keep_alive_select" on public.keep_alive;
create policy "keep_alive_select"
  on public.keep_alive for select
  to anon, authenticated
  using (true);

create or replace function public.touch_keep_alive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update public.keep_alive
  set touched_at = now()
  where id = 1
  returning touched_at;
$$;

revoke all on function public.touch_keep_alive() from public;
grant execute on function public.touch_keep_alive() to anon, authenticated;
