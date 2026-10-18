-- SOLUX Fase 6: cierre transaccional de trabajos y margen estimado.
-- Reutiliza reservations como entidad de trabajo; no crea tabla paralela de jobs.

create table if not exists public.job_closeouts (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete restrict,
  financial_operation_id uuid not null unique references public.financial_operations(id) on delete restrict,
  material_cost numeric(14,2) not null default 0 check (material_cost >= 0),
  materials_charge numeric(14,2) not null default 0 check (materials_charge >= 0),
  labor_cost numeric(14,2) not null default 0 check (labor_cost >= 0),
  labor_charge numeric(14,2) not null default 0 check (labor_charge >= 0),
  other_charge numeric(14,2) not null default 0 check (other_charge >= 0),
  total_charge numeric(14,2) not null default 0 check (total_charge >= 0),
  estimated_margin numeric(14,2) not null default 0,
  notes text not null default '',
  closed_by uuid references auth.users(id),
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists job_closeouts_closed_at_idx on public.job_closeouts(closed_at desc);
alter table public.job_closeouts enable row level security;

drop policy if exists "Staff read job closeouts" on public.job_closeouts;
create policy "Staff read job closeouts" on public.job_closeouts for select using (public.is_staff());

create or replace function public.close_reservation_job(
  p_operation_key text,
  p_reservation_id uuid,
  p_labor_charge numeric default 0,
  p_other_charge numeric default 0,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_reservation public.reservations%rowtype;
  v_material_cost numeric(14,2);
  v_materials_charge numeric(14,2);
  v_labor_cost numeric(14,2);
  v_total numeric(14,2);
  v_margin numeric(14,2);
  v_financial_id uuid;
  v_closeout_id uuid;
begin
  if public.current_user_role() not in ('admin','sales') then
    raise exception 'forbidden';
  end if;
  if coalesce(trim(p_operation_key),'') = '' or p_reservation_id is null
     or coalesce(p_labor_charge,0) < 0 or coalesce(p_other_charge,0) < 0 then
    raise exception 'invalid_job_closeout_parameters';
  end if;

  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'reservation_not_found'; end if;

  select id into v_existing from public.job_closeouts where reservation_id = p_reservation_id;
  if v_existing is not null then return v_existing; end if;
  if v_reservation.status <> 'in_progress' then raise exception 'reservation_must_be_in_progress'; end if;

  select
    coalesce(sum(round((quantity * unit_cost)::numeric,2)),0),
    coalesce(sum(round((quantity * unit_cost *
      case adjustment_type
        when 'markup' then 1 + adjustment_percent / 100
        when 'discount' then 1 - adjustment_percent / 100
        else 1
      end)::numeric,2)),0)
  into v_material_cost, v_materials_charge
  from public.reservation_materials
  where reservation_id = p_reservation_id;

  select coalesce(sum(agreed_amount),0)
  into v_labor_cost
  from public.job_labor
  where reservation_id = p_reservation_id and status <> 'cancelled';

  v_total := round(v_materials_charge + coalesce(p_labor_charge,0) + coalesce(p_other_charge,0),2);
  v_margin := round(v_total - v_material_cost - v_labor_cost,2);

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, occurred_at,
    reservation_id, category, description, related_operation_id, metadata, created_by
  ) values (
    p_operation_key, 'customer_charge', 'posted', v_total, 'USD', now(),
    p_reservation_id, 'job_closeout',
    coalesce(nullif(trim(p_notes),''),'Cargo final de trabajo ' || v_reservation.tracking_code),
    null, jsonb_build_object(
      'source','job_closeout',
      'material_cost',v_material_cost,
      'materials_charge',v_materials_charge,
      'labor_cost',v_labor_cost,
      'labor_charge',round(coalesce(p_labor_charge,0),2),
      'other_charge',round(coalesce(p_other_charge,0),2)
    ), auth.uid()
  ) returning id into v_financial_id;

  insert into public.job_closeouts (
    reservation_id, financial_operation_id, material_cost, materials_charge,
    labor_cost, labor_charge, other_charge, total_charge, estimated_margin, notes, closed_by
  ) values (
    p_reservation_id, v_financial_id, v_material_cost, v_materials_charge,
    v_labor_cost, round(coalesce(p_labor_charge,0),2), round(coalesce(p_other_charge,0),2),
    v_total, v_margin, coalesce(trim(p_notes),''), auth.uid()
  ) returning id into v_closeout_id;

  update public.reservations set status = 'completed', updated_at = now()
  where id = p_reservation_id;

  return v_closeout_id;
end;
$$;

revoke all on function public.close_reservation_job(text,uuid,numeric,numeric,text) from public, anon;
grant execute on function public.close_reservation_job(text,uuid,numeric,numeric,text) to authenticated;
