-- Consumibles de trabajo: inventario reutilizable en catálogo, consumo y cargos por reserva.
create table if not exists public.consumable_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category text not null default 'Consumibles',
  unit text not null default 'unidad',
  description text not null default '',
  default_cost numeric(12,2) not null default 0 check (default_cost >= 0),
  default_markup_percent numeric(7,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservation_materials (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  product_id uuid references public.consumable_products(id) on delete set null,
  product_name text not null,
  unit text not null default 'unidad',
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  adjustment_type text not null default 'markup' check (adjustment_type in ('markup','discount','none')),
  adjustment_percent numeric(7,2) not null default 0 check (adjustment_percent >= 0 and adjustment_percent <= 1000),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_materials_reservation_idx on public.reservation_materials(reservation_id);
create index if not exists consumable_products_active_idx on public.consumable_products(is_active, name);

alter table public.consumable_products enable row level security;
alter table public.reservation_materials enable row level security;

drop policy if exists "Staff read consumables" on public.consumable_products;
create policy "Staff read consumables" on public.consumable_products for select using (public.is_staff());
drop policy if exists "Admin and sales manage consumables" on public.consumable_products;
create policy "Admin and sales manage consumables" on public.consumable_products for all
using (public.current_user_role() in ('admin','sales'))
with check (public.current_user_role() in ('admin','sales'));

drop policy if exists "Staff manage reservation materials" on public.reservation_materials;
create policy "Staff manage reservation materials" on public.reservation_materials for all
using (public.current_user_role() in ('admin','sales'))
with check (public.current_user_role() in ('admin','sales'));

-- El cliente consulta únicamente los materiales de su reserva mediante código de seguimiento.
create or replace function public.get_reservation_materials_by_tracking(p_code text)
returns table (
  product_name text, unit text, quantity numeric, unit_cost numeric,
  adjustment_type text, adjustment_percent numeric, line_total numeric,
  notes text, created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select rm.product_name, rm.unit, rm.quantity, rm.unit_cost,
    rm.adjustment_type, rm.adjustment_percent,
    round((rm.quantity * rm.unit_cost *
      case rm.adjustment_type
        when 'markup' then 1 + rm.adjustment_percent / 100
        when 'discount' then 1 - rm.adjustment_percent / 100
        else 1
      end)::numeric, 2) as line_total,
    rm.notes, rm.created_at
  from public.reservation_materials rm
  join public.reservations r on r.id = rm.reservation_id
  where r.tracking_code = upper(trim(p_code))
  order by rm.created_at asc;
$$;
grant execute on function public.get_reservation_materials_by_tracking(text) to anon, authenticated;

create or replace function public.get_reservation_materials_total_by_tracking(p_code text)
returns numeric
language sql stable security definer set search_path = public
as $$
  select coalesce(sum(round((rm.quantity * rm.unit_cost *
      case rm.adjustment_type
        when 'markup' then 1 + rm.adjustment_percent / 100
        when 'discount' then 1 - rm.adjustment_percent / 100
        else 1
      end)::numeric, 2)), 0)
  from public.reservation_materials rm
  join public.reservations r on r.id = rm.reservation_id
  where r.tracking_code = upper(trim(p_code));
$$;
grant execute on function public.get_reservation_materials_total_by_tracking(text) to anon, authenticated;
