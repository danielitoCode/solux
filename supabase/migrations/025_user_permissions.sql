-- Permisos por usuario (no solo por rol).
-- Admin = acceso total. Resto = grants vigentes en user_permissions.

create table if not exists public.features (
  key text primary key,
  label text not null,
  description text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature_key text not null references public.features (key) on delete cascade,
  can_read boolean not null default true,
  can_write boolean not null default false,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  unique (user_id, feature_key)
);

create index if not exists user_permissions_user_idx
  on public.user_permissions (user_id)
  where revoked_at is null;

create index if not exists user_permissions_feature_idx
  on public.user_permissions (feature_key)
  where revoked_at is null;

-- Catálogo de módulos del backoffice
insert into public.features (key, label, description, sort_order) values
  ('dashboard',     'Dashboard',              'Resumen general del backoffice', 10),
  ('reservations',  'Reservaciones',          'Gestión de visitas y trabajos', 20),
  ('support',       'Soporte',                'Tickets de soporte', 30),
  ('messages',      'Mensajes',               'Mensajes de contacto', 40),
  ('catalog',       'Catálogo',               'Productos y servicios', 50),
  ('consumables',   'Consumibles',            'Materiales consumibles', 60),
  ('inventory',     'Proveedores e inventario','Inventario y proveedores', 70),
  ('finance',       'Finanzas y personal',    'Finanzas, liquidaciones y personal', 80),
  ('presentation',  'Presentación',           'Contenido del sitio público', 90),
  ('team',          'Equipo',                 'Miembros del equipo público', 100),
  ('projects',      'Proyectos web',          'Proyectos publicados en la web', 110),
  ('users',         'Usuarios',                'Gestión de usuarios y permisos', 120)
on conflict (key) do update
  set label = excluded.label,
      description = excluded.description,
      sort_order = excluded.sort_order;

-- Grant vigente: no revocado y sin caducar
create or replace function public.permission_is_active(p public.user_permissions)
returns boolean
language sql
stable
as $$
  select p.revoked_at is null
    and (p.expires_at is null or p.expires_at > now());
$$;

-- ¿El usuario actual tiene la feature? Admin siempre sí.
create or replace function public.has_feature(p_feature text, p_mode text default 'read')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_staff() then false
    when public.current_user_role() = 'admin' then true
    when lower(coalesce(p_mode, 'read')) = 'write' then exists (
      select 1 from public.user_permissions up
      where up.user_id = auth.uid()
        and up.feature_key = p_feature
        and up.can_write = true
        and public.permission_is_active(up)
    )
    else exists (
      select 1 from public.user_permissions up
      where up.user_id = auth.uid()
        and up.feature_key = p_feature
        and (up.can_read = true or up.can_write = true)
        and public.permission_is_active(up)
    )
  end;
$$;

grant execute on function public.has_feature(text, text) to authenticated;

alter table public.features enable row level security;
alter table public.user_permissions enable row level security;

drop policy if exists "Staff read features" on public.features;
create policy "Staff read features"
  on public.features for select
  using (public.is_staff());

drop policy if exists "Admin manage features" on public.features;
create policy "Admin manage features"
  on public.features for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Cada usuario lee sus grants; admin lee/gestiona todos
drop policy if exists "Users read own permissions" on public.user_permissions;
create policy "Users read own permissions"
  on public.user_permissions for select
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

drop policy if exists "Admin manage user permissions" on public.user_permissions;
create policy "Admin manage user permissions"
  on public.user_permissions for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
