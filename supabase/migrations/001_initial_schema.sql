-- SOLUX — schema inicial
-- Clientes NO se autentican. Staff: admin | support | sales
-- Seguimiento cliente: tracking_code en reservations y support_tickets

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('admin', 'support', 'sales');
create type catalog_item_type as enum ('product', 'service');
create type catalog_category as enum (
  'solar_panels', 'inverters', 'batteries', 'solar_kits', 'power_stations',
  'grounding', 'electrical_installation', 'electrical_repair', 'maintenance', 'advisory'
);
create type reservation_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type ticket_status as enum ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type message_author as enum ('customer', 'agent', 'system');
create type contact_subject as enum ('quote', 'general', 'partnership', 'other');
create type day_of_week as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
create type service_category as enum (
  'solar_panels', 'solar_kits', 'power_stations', 'grounding',
  'electrical_repair', 'electrical_installation'
);

-- ============================================================
-- STAFF PROFILES (solo usuarios internos, vinculados a auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  role user_role not null default 'support',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PRESENTATION
-- ============================================================
create table public.company_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null default '',
  about text not null default '',
  mission text not null default '',
  vision text not null default '',
  years_of_experience int not null default 0,
  completed_projects int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category service_category not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  service_category text not null default '',
  completed_at date,
  image_urls text[] not null default '{}',
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CONTACT
-- ============================================================
create table public.contact_info (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text not null,
  whatsapp text,
  address text not null default '',
  city text not null default 'Guantánamo',
  country text not null default 'Cuba',
  map_url text,
  updated_at timestamptz not null default now()
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day day_of_week not null unique,
  open_time time,
  close_time time,
  is_closed boolean not null default false
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject contact_subject not null default 'general',
  message text not null,
  is_read boolean not null default false,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CATALOG (productos y servicios — carta)
-- ============================================================
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  type catalog_item_type not null,
  category catalog_category not null,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  price numeric(12, 2),
  currency text not null default 'USD',
  image_url text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RESERVATIONS (cliente sin cuenta; tracking_code público)
-- ============================================================
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  service_category text not null,
  preferred_date date not null,
  preferred_time_slot text not null,
  address text not null default '',
  notes text,
  status reservation_status not null default 'pending',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reservations_tracking_code_idx on public.reservations (tracking_code);
create index reservations_status_idx on public.reservations (status);

-- ============================================================
-- SUPPORT TICKETS (seguimiento por tracking_code)
-- ============================================================
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  subject text not null,
  description text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  related_reservation_id uuid references public.reservations (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index support_tickets_tracking_code_idx on public.support_tickets (tracking_code);
create index support_tickets_status_idx on public.support_tickets (status);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author message_author not null,
  author_name text not null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index ticket_messages_ticket_id_idx on public.ticket_messages (ticket_id);

-- ============================================================
-- HELPERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger company_profile_updated_at before update on public.company_profile
  for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger contact_info_updated_at before update on public.contact_info
  for each row execute function public.set_updated_at();
create trigger catalog_items_updated_at before update on public.catalog_items
  for each row execute function public.set_updated_at();
create trigger reservations_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();
create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- Genera tracking code legible: SLX-XXXXXXXX
create or replace function public.generate_tracking_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := 'SLX-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  return code;
end;
$$;

create or replace function public.set_reservation_tracking_code()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_code is null or new.tracking_code = '' then
    new.tracking_code := public.generate_tracking_code();
  end if;
  return new;
end;
$$;

create or replace function public.set_ticket_tracking_code()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_code is null or new.tracking_code = '' then
    new.tracking_code := public.generate_tracking_code();
  end if;
  return new;
end;
$$;

create trigger reservations_tracking_code
  before insert on public.reservations
  for each row execute function public.set_reservation_tracking_code();

create trigger support_tickets_tracking_code
  before insert on public.support_tickets
  for each row execute function public.set_ticket_tracking_code();

-- Auto-crear profile al registrar usuario en Auth (solo staff)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'support')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: rol del usuario autenticado
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;
