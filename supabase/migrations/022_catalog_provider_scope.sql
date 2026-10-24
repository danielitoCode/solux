-- B3: proveedor y alcance comercial en ofertas del catálogo
-- provider: marca / proveedor del equipo (ej. Jinko, Growatt)
-- scope: qué incluye la oferta (solo equipo, kit+instalación, etc.)

alter table public.catalog_items
  add column if not exists provider text,
  add column if not exists scope text;

comment on column public.catalog_items.provider is 'Marca o proveedor del equipo (texto libre)';
comment on column public.catalog_items.scope is 'Alcance de la oferta: equipment_only | kit_install | install_only | maintenance | advisory | custom';

-- Índice opcional para filtrar por proveedor en backoffice
create index if not exists catalog_items_provider_idx
  on public.catalog_items (provider)
  where provider is not null and provider <> '';
