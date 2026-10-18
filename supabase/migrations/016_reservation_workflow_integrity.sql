-- SOLUX Fase 8: integridad del flujo de reservas y liquidación de cancelaciones.
-- Las reservas terminales conservan sus materiales y mano de obra como historial auditable.

create table if not exists public.job_cancellations (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete restrict,
  financial_operation_id uuid not null unique references public.financial_operations(id) on delete restrict,
  material_cost numeric(14,2) not null default 0 check (material_cost >= 0),
  labor_cost numeric(14,2) not null default 0 check (labor_cost >= 0),
  incurred_cost numeric(14,2) not null default 0 check (incurred_cost >= 0),
  customer_charge numeric(14,2) not null default 0 check (customer_charge >= 0),
  reason text not null,
  notes text not null default '',
  cancelled_by uuid references auth.users(id),
  cancelled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists job_cancellations_cancelled_at_idx
  on public.job_cancellations(cancelled_at desc);

alter table public.job_cancellations enable row level security;
drop policy if exists "Staff read job cancellations" on public.job_cancellations;
create policy "Staff read job cancellations"
  on public.job_cancellations for select using (public.is_staff());

create or replace function public.guard_reservation_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('completed','cancelled') and new.status is distinct from old.status then
    raise exception 'terminal_reservation_status_immutable';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
    (old.status = 'pending' and new.status in ('confirmed','cancelled'))
    or (old.status = 'confirmed' and new.status in ('in_progress','cancelled'))
    or (old.status = 'in_progress' and new.status in ('completed','cancelled'))
  ) then
    raise exception 'invalid_reservation_status_transition';
  end if;

  if new.status = 'completed'
     and not exists (select 1 from public.job_closeouts where reservation_id = old.id) then
    raise exception 'reservation_completion_requires_job_closeout';
  end if;

  if old.status = 'in_progress' and new.status = 'cancelled'
     and (
       exists (select 1 from public.reservation_materials where reservation_id = old.id)
       or exists (select 1 from public.job_labor where reservation_id = old.id and status <> 'cancelled')
     )
     and not exists (select 1 from public.job_cancellations where reservation_id = old.id) then
    raise exception 'reservation_cancellation_requires_liquidation';
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_terminal_status_guard on public.reservations;
drop trigger if exists reservations_workflow_guard on public.reservations;
create trigger reservations_workflow_guard
before update of status on public.reservations
for each row execute function public.guard_reservation_workflow();

create or replace function public.guard_terminal_reservation_work_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_reservation_id uuid;
  v_new_reservation_id uuid;
begin
  if tg_op <> 'INSERT' then
    v_old_reservation_id := (to_jsonb(old)->>'reservation_id')::uuid;
  end if;
  if tg_op <> 'DELETE' then
    v_new_reservation_id := (to_jsonb(new)->>'reservation_id')::uuid;
  end if;

  if v_old_reservation_id is not null and exists (
    select 1 from public.reservations
    where id = v_old_reservation_id and status in ('completed','cancelled')
  ) then
    raise exception 'terminal_reservation_work_records_immutable';
  end if;

  if v_new_reservation_id is not null and exists (
    select 1 from public.reservations
    where id = v_new_reservation_id and status in ('completed','cancelled')
  ) then
    raise exception 'terminal_reservation_work_records_immutable';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists reservation_materials_terminal_guard on public.reservation_materials;
create trigger reservation_materials_terminal_guard
before insert or update or delete on public.reservation_materials
for each row execute function public.guard_terminal_reservation_work_records();

drop trigger if exists job_labor_terminal_guard on public.job_labor;
create trigger job_labor_terminal_guard
before insert or update or delete on public.job_labor
for each row execute function public.guard_terminal_reservation_work_records();

create or replace function public.cancel_reservation_job(
  p_operation_key text,
  p_reservation_id uuid,
  p_customer_charge numeric default 0,
  p_reason text default '',
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_existing uuid;
  v_material_cost numeric(14,2);
  v_labor_cost numeric(14,2);
  v_incurred_cost numeric(14,2);
  v_financial_id uuid;
  v_cancellation_id uuid;
  v_reason text;
begin
  if public.current_user_role() not in ('admin','sales') then
    raise exception 'forbidden';
  end if;

  if coalesce(trim(p_operation_key),'') = ''
     or p_reservation_id is null
     or p_customer_charge is null or p_customer_charge < 0
     or coalesce(trim(p_reason),'') = '' then
    raise exception 'invalid_job_cancellation_parameters';
  end if;

  select * into v_reservation
  from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'reservation_not_found'; end if;

  select id into v_existing
  from public.job_cancellations where reservation_id = p_reservation_id;
  if v_existing is not null then return v_existing; end if;

  if v_reservation.status <> 'in_progress' then
    raise exception 'reservation_must_be_in_progress';
  end if;

  select coalesce(sum(round((quantity * unit_cost)::numeric,2)),0)
    into v_material_cost
  from public.reservation_materials
  where reservation_id = p_reservation_id;

  select coalesce(sum(agreed_amount),0)
    into v_labor_cost
  from public.job_labor
  where reservation_id = p_reservation_id and status <> 'cancelled';

  v_material_cost := round(v_material_cost,2);
  v_labor_cost := round(v_labor_cost,2);
  v_incurred_cost := round(v_material_cost + v_labor_cost,2);
  v_reason := trim(p_reason);

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, occurred_at,
    reservation_id, category, description, metadata, created_by
  ) values (
    p_operation_key, 'customer_charge', 'posted', round(p_customer_charge,2), 'USD', now(),
    p_reservation_id, 'job_cancellation',
    'Liquidación de cancelación ' || v_reservation.tracking_code,
    jsonb_build_object(
      'source','job_cancellation',
      'reason',v_reason,
      'material_cost',v_material_cost,
      'labor_cost',v_labor_cost,
      'incurred_cost',v_incurred_cost,
      'customer_charge',round(p_customer_charge,2),
      'notes',coalesce(trim(p_notes),'')
    ),
    auth.uid()
  ) returning id into v_financial_id;

  insert into public.job_cancellations (
    reservation_id, financial_operation_id, material_cost, labor_cost,
    incurred_cost, customer_charge, reason, notes, cancelled_by
  ) values (
    p_reservation_id, v_financial_id, v_material_cost, v_labor_cost,
    v_incurred_cost, round(p_customer_charge,2), v_reason,
    coalesce(trim(p_notes),''), auth.uid()
  ) returning id into v_cancellation_id;

  update public.reservations
  set status = 'cancelled', updated_at = now()
  where id = p_reservation_id;

  return v_cancellation_id;
end;
$$;

revoke all on function public.cancel_reservation_job(text,uuid,numeric,text,text) from public, anon;
grant execute on function public.cancel_reservation_job(text,uuid,numeric,text,text) to authenticated;
