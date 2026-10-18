-- SOLUX Fase 4: registro transaccional de gastos, mano de obra y pagos.
-- Cada RPC usa operation_key para impedir duplicados por reintento.

create or replace function public.record_operating_expense(
  p_operation_key text,
  p_amount numeric,
  p_category text,
  p_description text,
  p_occurred_at timestamptz default now(),
  p_document_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.current_user_role() <> 'admin' then raise exception 'forbidden'; end if;
  if coalesce(trim(p_operation_key),'') = '' or p_amount is null or p_amount <= 0
     or coalesce(trim(p_category),'') = '' or coalesce(trim(p_description),'') = '' then
    raise exception 'invalid_expense_parameters';
  end if;

  select id into v_id from public.financial_operations where operation_key = p_operation_key;
  if v_id is not null then return v_id; end if;

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, occurred_at,
    category, description, document_reference, created_by
  ) values (
    p_operation_key, 'operating_expense', 'posted', round(p_amount,2), 'USD',
    coalesce(p_occurred_at,now()), trim(p_category), trim(p_description),
    nullif(trim(p_document_reference),''), auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.accrue_job_labor(
  p_operation_key text,
  p_reservation_id uuid,
  p_employee_id uuid,
  p_role_description text,
  p_hours numeric,
  p_amount numeric,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation_id uuid;
  v_labor_id uuid;
  v_existing uuid;
begin
  if public.current_user_role() not in ('admin','sales') then raise exception 'forbidden'; end if;
  if coalesce(trim(p_operation_key),'') = '' or p_reservation_id is null or p_employee_id is null
     or p_hours is null or p_hours < 0 or p_amount is null or p_amount <= 0
     or coalesce(trim(p_role_description),'') = '' then
    raise exception 'invalid_labor_parameters';
  end if;

  select id into v_existing from public.financial_operations where operation_key = p_operation_key;
  if v_existing is not null then return v_existing; end if;

  perform 1 from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'reservation_not_found'; end if;
  perform 1 from public.employees where id = p_employee_id and is_active = true for update;
  if not found then raise exception 'employee_not_active'; end if;

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, reservation_id,
    employee_id, category, description, created_by
  ) values (
    p_operation_key, 'labor_accrual', 'posted', round(p_amount,2), 'USD',
    p_reservation_id, p_employee_id, 'job_labor',
    'Mano de obra: ' || trim(p_role_description), auth.uid()
  ) returning id into v_operation_id;

  insert into public.job_labor (
    reservation_id, employee_id, role_description, hours, agreed_amount,
    accrued_amount, paid_amount, status, notes, created_by
  ) values (
    p_reservation_id, p_employee_id, trim(p_role_description), p_hours,
    round(p_amount,2), round(p_amount,2), 0, 'accrued', coalesce(p_notes,''), auth.uid()
  )
  on conflict (reservation_id, employee_id, role_description)
  do update set
    hours = public.job_labor.hours + excluded.hours,
    agreed_amount = public.job_labor.agreed_amount + excluded.agreed_amount,
    accrued_amount = public.job_labor.accrued_amount + excluded.accrued_amount,
    status = case when public.job_labor.paid_amount > 0 then 'partially_paid' else 'accrued' end,
    notes = case when excluded.notes = '' then public.job_labor.notes
      when public.job_labor.notes = '' then excluded.notes
      else public.job_labor.notes || E'\n' || excluded.notes end,
    updated_at = now()
  returning id into v_labor_id;

  return v_operation_id;
end;
$$;

create or replace function public.pay_employee(
  p_operation_key text,
  p_employee_id uuid,
  p_amount numeric,
  p_description text default 'Pago a empleado',
  p_document_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation_id uuid;
  v_existing uuid;
  v_due numeric(14,2);
  v_remaining numeric(14,2);
  v_labor record;
begin
  if public.current_user_role() <> 'admin' then raise exception 'forbidden'; end if;
  if coalesce(trim(p_operation_key),'') = '' or p_employee_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'invalid_employee_payment_parameters';
  end if;

  select id into v_existing from public.financial_operations where operation_key = p_operation_key;
  if v_existing is not null then return v_existing; end if;

  perform 1 from public.employees where id = p_employee_id for update;
  if not found then raise exception 'employee_not_found'; end if;

  select coalesce(sum(accrued_amount - paid_amount),0)
    into v_due from public.job_labor
    where employee_id = p_employee_id and status <> 'cancelled';
  if p_amount > v_due then raise exception 'payment_exceeds_accrued_balance'; end if;

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, employee_id,
    category, description, document_reference, created_by
  ) values (
    p_operation_key, 'employee_payment', 'posted', round(p_amount,2), 'USD',
    p_employee_id, 'employee_payment', trim(p_description),
    nullif(trim(p_document_reference),''), auth.uid()
  ) returning id into v_operation_id;

  v_remaining := round(p_amount,2);
  for v_labor in
    select id, accrued_amount, paid_amount from public.job_labor
    where employee_id = p_employee_id and status <> 'cancelled'
      and accrued_amount > paid_amount
    order by created_at, id
    for update
  loop
    exit when v_remaining <= 0;
    declare
      v_part numeric(14,2);
    begin
      v_part := least(v_remaining, v_labor.accrued_amount - v_labor.paid_amount);
      update public.job_labor
      set paid_amount = paid_amount + v_part,
          status = case
            when paid_amount + v_part >= accrued_amount then 'paid'
            when paid_amount + v_part > 0 then 'partially_paid'
            else status end,
          updated_at = now()
      where id = v_labor.id;
      v_remaining := v_remaining - v_part;
    end;
  end loop;

  return v_operation_id;
end;
$$;

revoke all on function public.record_operating_expense(text,numeric,text,text,timestamptz,text) from public, anon;
revoke all on function public.accrue_job_labor(text,uuid,uuid,text,numeric,numeric,text) from public, anon;
revoke all on function public.pay_employee(text,uuid,numeric,text,text) from public, anon;
grant execute on function public.record_operating_expense(text,numeric,text,text,timestamptz,text) to authenticated;
grant execute on function public.accrue_job_labor(text,uuid,uuid,text,numeric,numeric,text) to authenticated;
grant execute on function public.pay_employee(text,uuid,numeric,text,text) to authenticated;
