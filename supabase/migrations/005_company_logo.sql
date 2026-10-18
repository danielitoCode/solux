-- Logo corporativo público y almacenamiento de imagen.
alter table public.company_profile
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-assets', 'company-assets', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

create policy "Public can read company assets"
on storage.objects for select
to public
using (bucket_id = 'company-assets');

create policy "Authenticated staff can upload company assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'company-assets');

create policy "Authenticated staff can update company assets"
on storage.objects for update
to authenticated
using (bucket_id = 'company-assets')
with check (bucket_id = 'company-assets');

create policy "Authenticated staff can delete company assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'company-assets');
