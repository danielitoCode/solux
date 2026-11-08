-- Equipo visible en /nosotros; gestionable desde backoffice presentación.
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null default '',
  photo_url text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_public_order_idx
  on public.team_members (is_active, sort_order, created_at);

alter table public.team_members enable row level security;

drop policy if exists "Public read active team members" on public.team_members;
create policy "Public read active team members"
  on public.team_members for select
  using (is_active = true or public.current_user_role() = 'admin');

drop policy if exists "Admin manage team members" on public.team_members;
create policy "Admin manage team members"
  on public.team_members for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
