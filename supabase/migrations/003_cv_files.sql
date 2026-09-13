-- Store uploaded CVs in a private bucket. The existing cv_url column stays
-- for Dropbox / external links.

alter table public.people
  add column if not exists cv_file_path text,
  add column if not exists cv_file_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'text/rtf',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cvs_select_authenticated" on storage.objects;
drop policy if exists "cvs_insert_authenticated" on storage.objects;
drop policy if exists "cvs_update_authenticated" on storage.objects;
drop policy if exists "cvs_delete_authenticated" on storage.objects;

create policy "cvs_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'cvs');

create policy "cvs_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cvs');

create policy "cvs_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cvs')
  with check (bucket_id = 'cvs');

create policy "cvs_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cvs');
