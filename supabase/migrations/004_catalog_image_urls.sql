-- Multi-imagen por ítem de catálogo (URLs Cloudinary)
alter table public.catalog_items
  add column if not exists image_urls text[] not null default '{}';

-- Migrar image_url antigua si existe
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'image_url'
  ) then
    update public.catalog_items
    set image_urls = array[image_url]
    where image_url is not null
      and image_url <> ''
      and (image_urls is null or cardinality(image_urls) = 0);
  end if;
end $$;
