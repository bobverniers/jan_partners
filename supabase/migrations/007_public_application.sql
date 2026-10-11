-- Let an unsigned visitor add an application, and nothing else.
-- They cannot read the directory or set internal fields.

grant insert (
  id,
  name,
  email,
  phone,
  linkedin_url,
  cv_file_path,
  cv_file_name,
  primary_residence,
  passports,
  preferred_locations,
  most_recent_position,
  previous_assignments,
  years_as_gm,
  specialty,
  number_of_keys,
  opening_experience,
  capex_refurb_experience,
  languages,
  consultancy
) on table public.people to anon;

drop policy if exists "people_insert_application" on public.people;
create policy "people_insert_application"
  on public.people
  for insert
  to anon
  with check (
    status = 'new'
    and length(btrim(name)) > 0
  );

-- A new CV upload returns the new object, which needs a select policy.
-- Limit that select to the upload itself so visitors cannot list or download CVs.
drop policy if exists "cvs_insert_application" on storage.objects;
create policy "cvs_insert_application"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'cvs'
    and name ~ '^[0-9a-f-]{36}/cv\.(pdf|doc|docx|odt|rtf|png|jpg|jpeg)$'
  );

drop policy if exists "cvs_select_application_upload" on storage.objects;
create policy "cvs_select_application_upload"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'cvs'
    and storage.allow_only_operation('storage.object.upload')
  );
