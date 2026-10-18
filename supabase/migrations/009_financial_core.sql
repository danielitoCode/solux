-- SOLUX Fase 1: núcleo financiero, empleados y modelo de venta.
-- No crea trabajos paralelos: las reservas existentes siguen siendo el origen del trabajo.
alter table public.catalog_items
  add column if not exists fulfillment_model text not null default 'owned_stock'
    check (fulfillment_model in ('owned_stock','managed_sale')),
  add column if not exists stock_quantity numeric(12,3) not null default 0
    check (stock_quantity >= 0),
  add column if not exists minimum_stock numeric(12,3) not null default 0
    check (minimum_stock >= 0),
  add column if not exists acquisition_cost numeric(12,2) not null default 0
    check (acquisition_cost >= 0),
  add column if not exists average_cost numeric(12,2) not null default 0
    check (average_cost >= 0),
  add column if not exists commission_percent numeric(7,3) not null default 0
    check (commission_percent >= 0 and commission_percent <= 100),
  add column if not exists supplier_name text,
  add column if not exists external_availability text not null default 'unknown'
    check (external_availability in ('available','unavailable','unknown'));

create table if not exists public.financial_settings (
  id boolean primary key default true check (id),
  investment_reserve_percent numeric(5,2) not null default 10
    check (investment_reserve_percent >= 0 and investment_reserve_percent <= 100),
  labor_policy text not null default 'operating_expense'
    check (labor_policy in ('operating_expense','cooperative_distribution')),
  inventory_cost_method text not null default 'weighted_average'
    check (inventory_cost_method in ('weighted_average')),
  currency text not null default 'USD',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.financial_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role_title text not null default 'Técnico',
  is_active boolean not null default true,
  hired_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_operations (
  id uuid primary key default gen_random_uuid(),
  operation_key text not null unique,
  operation_type text not null check (operation_type in (
    'customer_charge','customer_payment','customer_refund',
    'purchase','operating_expense','labor_accrual','employee_payment',
    'investment_reserve','cooperative_distribution','capital_contribution',
    'owner_withdrawal','internal_transfer','inventory_adjustment','reversal','other'
  )),
  status text not null default 'posted' check (status in ('draft','posted','reversed')),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD',
  occurred_at timestamptz not null default now(),
  reservation_id uuid references public.reservations(id) on delete restrict,
  employee_id uuid references public.employees(id) on delete restrict,
  catalog_item_id uuid references public.catalog_items(id) on delete restrict,
  category text not null default 'general',
  description text not null,
  document_reference text,
  related_operation_id uuid references public.financial_operations(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  operation_key text not null unique,
  item_kind text not null check (item_kind in ('catalog_product','consumable')),
  catalog_item_id uuid references public.catalog_items(id) on delete restrict,
  consumable_product_id uuid references public.consumable_products(id) on delete restrict,
  movement_type text not null check (movement_type in (
    'purchase_receipt','job_issue','job_return','sale','supplier_return',
    'adjustment_in','adjustment_out','reservation_release'
  )),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  reservation_id uuid references public.reservations(id) on delete restrict,
  financial_operation_id uuid references public.financial_operations(id) on delete restrict,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint inventory_movement_item_match check (
    (item_kind = 'catalog_product' and catalog_item_id is not null and consumable_product_id is null)
    or (item_kind = 'consumable' and consumable_product_id is not null and catalog_item_id is null)
  )
);

create table if not exists public.job_labor (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  role_description text not null default '',
  hours numeric(10,2) not null default 0 check (hours >= 0),
  agreed_amount numeric(12,2) not null check (agreed_amount >= 0),
  accrued_amount numeric(12,2) not null default 0 check (accrued_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'assigned' check (status in ('assigned','accrued','partially_paid','paid','cancelled')),
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id, employee_id, role_description)
);

create index if not exists financial_operations_date_idx on public.financial_operations(occurred_at desc);
create index if not exists financial_operations_reservation_idx on public.financial_operations(reservation_id);
create index if not exists inventory_movements_item_idx on public.inventory_movements(item_kind,catalog_item_id,consumable_product_id,created_at desc);
create index if not exists job_labor_reservation_idx on public.job_labor(reservation_id);
create index if not exists catalog_items_stock_idx on public.catalog_items(fulfillment_model,stock_quantity,is_active);

alter table public.financial_settings enable row level security;
alter table public.employees enable row level security;
alter table public.financial_operations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.job_labor enable row level security;

drop policy if exists "Staff read financial settings" on public.financial_settings;
create policy "Staff read financial settings" on public.financial_settings for select using (public.is_staff());
drop policy if exists "Admin manage financial settings" on public.financial_settings;
create policy "Admin manage financial settings" on public.financial_settings for all
using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

drop policy if exists "Staff read employees" on public.employees;
create policy "Staff read employees" on public.employees for select using (public.is_staff());
drop policy if exists "Admin manage employees" on public.employees;
create policy "Admin manage employees" on public.employees for all
using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

drop policy if exists "Staff read financial operations" on public.financial_operations;
create policy "Staff read financial operations" on public.financial_operations for select using (public.is_staff());
drop policy if exists "Admin and sales insert financial operations" on public.financial_operations;
create policy "Admin and sales insert financial operations" on public.financial_operations for insert
with check (public.current_user_role() in ('admin','sales'));
drop policy if exists "Admin reverse financial operations" on public.financial_operations;
create policy "Admin reverse financial operations" on public.financial_operations for update
using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

drop policy if exists "Staff read inventory movements" on public.inventory_movements;
create policy "Staff read inventory movements" on public.inventory_movements for select using (public.is_staff());
drop policy if exists "Admin and sales record inventory movements" on public.inventory_movements;
create policy "Admin and sales record inventory movements" on public.inventory_movements for insert
with check (public.current_user_role() in ('admin','sales'));

drop policy if exists "Staff read job labor" on public.job_labor;
create policy "Staff read job labor" on public.job_labor for select using (public.is_staff());
drop policy if exists "Admin and sales manage job labor" on public.job_labor;
create policy "Admin and sales manage job labor" on public.job_labor for all
using (public.current_user_role() in ('admin','sales'))
with check (public.current_user_role() in ('admin','sales'));

-- El stock de terceros no es inventario propio; el cliente ve el mismo catálogo público.
-- La comisión se registra por operación de venta en fases posteriores.
